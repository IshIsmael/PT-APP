import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { localDay } from './logging';

const ADHERENCE_HIT = 0.6;

export type DaySummary = {
  day: string;
  kcal_total: number | null;
  protein_g: number | null;
  target_kcal: number | null;
  target_protein_g: number | null;
  water_ml: number | null;
  target_water_ml: number | null;
  weight_kg: number | null;
  workouts_completed: number | null;
  training_volume_kg: number | null;
  adherence_score: number | null;
};

function dayString(d: Date): string {
  return localDay(d);
}
function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return dayString(d);
}

// Consecutive "hit your plan" days ending today (today may still be pending —
// grace means an unfinished today doesn't break the streak).
export function computeStreak(summaries: DaySummary[]): { current: number; longest: number } {
  const hit = new Map<string, boolean>();
  for (const s of summaries) hit.set(s.day, (s.adherence_score ?? 0) >= ADHERENCE_HIT);

  const today = dayString(new Date());
  let cursor = hit.get(today) ? today : addDays(today, -1);
  let current = 0;
  while (hit.get(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // Longest run across the loaded window.
  const days = [...hit.keys()].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    if (!hit.get(d)) {
      run = 0;
      prev = d;
      continue;
    }
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { current, longest: Math.max(longest, current) };
}

export function useDailySummaries(userId?: string, days = 30) {
  return useQuery({
    queryKey: ['summaries', userId, days],
    enabled: !!userId,
    queryFn: async (): Promise<DaySummary[]> => {
      const since = addDays(dayString(new Date()), -days);
      const { data, error } = await supabase
        .from('daily_user_summaries')
        .select(
          'day,kcal_total,protein_g,target_kcal,target_protein_g,water_ml,target_water_ml,weight_kg,workouts_completed,training_volume_kg,adherence_score',
        )
        .eq('user_id', userId!)
        .gte('day', since)
        .order('day', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useWeightSeries(userId?: string, days = 90) {
  return useQuery({
    queryKey: ['weight-series', userId, days],
    enabled: !!userId,
    queryFn: async () => {
      const since = addDays(dayString(new Date()), -days);
      const { data, error } = await supabase
        .from('weight_logs')
        .select('day,weight_kg')
        .eq('user_id', userId!)
        .gte('day', since)
        .order('day', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({ day: r.day, value: Number(r.weight_kg) }));
    },
  });
}

export type Insight = { title: string; detail: string };

// Supportive, data-backed observations derived from the summary window.
export function buildInsights(summaries: DaySummary[]): Insight[] {
  const out: Insight[] = [];
  const withMeals = summaries.filter((s) => (s.kcal_total ?? 0) > 0);
  if (withMeals.length >= 3) {
    const avg = Math.round(
      withMeals.reduce((a, s) => a + (s.kcal_total ?? 0), 0) / withMeals.length,
    );
    out.push({
      title: 'Average intake',
      detail: `${avg} kcal/day over ${withMeals.length} logged days.`,
    });

    const proteinHits = withMeals.filter(
      (s) => s.target_protein_g && (s.protein_g ?? 0) >= s.target_protein_g * 0.9,
    ).length;
    out.push({
      title: 'Protein consistency',
      detail: `You hit your protein target on ${proteinHits}/${withMeals.length} logged days.`,
    });
  }

  const weights = summaries.filter((s) => s.weight_kg !== null);
  if (weights.length >= 2) {
    const first = weights[0].weight_kg!;
    const last = weights[weights.length - 1].weight_kg!;
    const delta = Math.round((last - first) * 10) / 10;
    out.push({
      title: 'Weight trend',
      detail:
        delta === 0
          ? 'Holding steady this period.'
          : `${delta > 0 ? '+' : ''}${delta} kg over this period.`,
    });
  }

  const workouts = summaries.reduce((a, s) => a + (s.workouts_completed ?? 0), 0);
  if (workouts > 0) {
    out.push({ title: 'Training', detail: `${workouts} workouts completed in the window.` });
  }
  return out;
}

// --- Badges --------------------------------------------------------------
export type EarnedBadge = {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  category: string;
  earned: boolean;
};

function consecutiveFromToday(predicate: Map<string, boolean>): number {
  const today = dayString(new Date());
  let cursor = predicate.get(today) ? today : addDays(today, -1);
  let n = 0;
  while (predicate.get(cursor)) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function useBadges(userId?: string) {
  return useQuery({
    queryKey: ['badges', userId],
    enabled: !!userId,
    queryFn: async (): Promise<EarnedBadge[]> => {
      const [{ data: defs }, { data: earned }] = await Promise.all([
        supabase.from('badges').select('id,name,description,icon,category'),
        supabase.from('user_badges').select('badge_id').eq('user_id', userId!),
      ]);
      const earnedSet = new Set((earned ?? []).map((e) => e.badge_id));
      return (defs ?? []).map((b) => ({ ...b, earned: earnedSet.has(b.id) }));
    },
  });
}

// Evaluate criteria from the data and persist any newly-earned badges.
export function useEvaluateBadges(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) return [];
      const [summaries, goal, weights, sessions, existing] = await Promise.all([
        supabase
          .from('daily_user_summaries')
          .select('day,adherence_score,water_ml,target_water_ml,weight_kg')
          .eq('user_id', userId)
          .order('day', { ascending: true }),
        supabase
          .from('user_goals')
          .select('goal_type,target_weight_kg')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle(),
        supabase
          .from('weight_logs')
          .select('weight_kg,day')
          .eq('user_id', userId)
          .order('day', { ascending: true }),
        supabase
          .from('workout_sessions')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .limit(1),
        supabase.from('user_badges').select('badge_id').eq('user_id', userId),
      ]);

      const sums = summaries.data ?? [];
      const adherence = new Map(
        sums.map((s) => [s.day, (s.adherence_score ?? 0) >= ADHERENCE_HIT]),
      );
      const water = new Map(
        sums.map((s) => [s.day, !!s.target_water_ml && (s.water_ml ?? 0) >= s.target_water_ml]),
      );
      const streak = consecutiveFromToday(adherence);
      const waterStreak = consecutiveFromToday(water);

      const w = (weights.data ?? []).map((r) => Number(r.weight_kg));
      const haveWeight = w.length > 0;
      const weightChange = w.length >= 2 ? Math.abs(w[w.length - 1] - w[0]) : 0;
      const target = goal.data?.target_weight_kg ?? null;
      const reachedGoal =
        target !== null && w.length > 0 ? Math.abs(w[w.length - 1] - target) <= 0.5 : false;
      const didWorkout = (sessions.data ?? []).length > 0;

      const earned: Record<string, boolean> = {
        streak_3: streak >= 3,
        streak_7: streak >= 7,
        streak_30: streak >= 30,
        hydration_week: waterStreak >= 7,
        first_workout: didWorkout,
        first_weigh_in: haveWeight,
        milestone_5kg: weightChange >= 5,
        goal_weight: reachedGoal,
        perfect_week:
          consecutiveFromToday(
            new Map(sums.map((s) => [s.day, (s.adherence_score ?? 0) >= 0.9])),
          ) >= 7,
      };

      const have = new Set((existing.data ?? []).map((e) => e.badge_id));
      const toAward = Object.entries(earned)
        .filter(([id, ok]) => ok && !have.has(id))
        .map(([id]) => ({ user_id: userId, badge_id: id }));

      if (toAward.length) {
        await supabase.from('user_badges').insert(toAward);
      }
      return toAward.map((t) => t.badge_id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['badges', userId] }),
  });
}
