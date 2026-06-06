import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { Database } from './database.types';

type MealSlot = Database['public']['Enums']['meal_slot'];
type LiquidType = Database['public']['Enums']['liquid_type'];
type HabitType = Database['public']['Enums']['habit_type'];
type InputSource = Database['public']['Enums']['input_source'];

// User-local calendar day (YYYY-MM-DD) — the grouping key for all logs.
export function localDay(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

const sum = <T>(rows: T[] | null | undefined, key: keyof T): number =>
  (rows ?? []).reduce((a, r) => a + (Number(r[key]) || 0), 0);

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

// ----------------------------------------------------------------------------
// Analytics cache: recompute today's daily_user_summaries row from raw logs.
// Runs after every log write so the Progress/Home dashboards read one fast row.
// ----------------------------------------------------------------------------
export async function recomputeDailySummary(userId: string, day: string) {
  const [meals, liquids, habits, weight, sessions, goal] = await Promise.all([
    supabase
      .from('meal_logs')
      .select('kcal,protein_g,carbs_g,fat_g,fiber_g,is_snack')
      .eq('user_id', userId)
      .eq('day', day),
    supabase
      .from('liquid_logs')
      .select('amount_ml,liquid_type')
      .eq('user_id', userId)
      .eq('day', day),
    // Order so .find() below deterministically takes the latest value per habit
    // type when multiple sources (manual + wearable) exist for the same day.
    supabase
      .from('habit_logs')
      .select('habit_type,value')
      .eq('user_id', userId)
      .eq('day', day)
      .order('logged_at', { ascending: false }),
    supabase
      .from('weight_logs')
      .select('weight_kg')
      .eq('user_id', userId)
      .eq('day', day)
      .order('measured_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('workout_sessions').select('id,status').eq('user_id', userId).eq('day', day),
    supabase
      .from('user_goals')
      .select('target_kcal,protein_g,water_ml_goal')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  const mealRows = meals.data ?? [];
  const kcal = sum(mealRows, 'kcal');
  const protein = sum(mealRows, 'protein_g');
  const sessionRows = sessions.data ?? [];
  const completed = sessionRows.filter((s) => s.status === 'completed');

  // Training volume from sets in today's sessions.
  let setsCount = 0;
  let volume = 0;
  if (sessionRows.length) {
    const { data: sets } = await supabase
      .from('set_logs')
      .select('weight_kg,reps')
      .in(
        'workout_session_id',
        sessionRows.map((s) => s.id),
      );
    setsCount = (sets ?? []).length;
    volume = (sets ?? []).reduce(
      (a, s) => a + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0),
      0,
    );
  }

  // Only hydrating liquids count toward the water/hydration goal (exclude
  // alcohol + soda, which dehydrate / aren't hydration).
  const waterMl = (liquids.data ?? [])
    .filter((l) => l.liquid_type !== 'alcohol' && l.liquid_type !== 'soda')
    .reduce((a, l) => a + (l.amount_ml || 0), 0);
  const steps = habits.data?.find((h) => h.habit_type === 'steps')?.value ?? null;
  const sleepHrs = habits.data?.find((h) => h.habit_type === 'sleep')?.value ?? null;

  const targetKcal = goal.data?.target_kcal ?? null;
  const targetProtein = goal.data?.protein_g ?? null;
  const targetWater = goal.data?.water_ml_goal ?? null;

  // Calories are scored two-sided (over- and under-eating both reduce the
  // score); protein is a "hit the floor" target.
  const kcalScore = targetKcal
    ? clamp01(1 - Math.min(Math.abs(kcal - targetKcal) / targetKcal, 1))
    : null;
  const proteinScore = targetProtein ? clamp01(protein / targetProtein) : null;
  const nutritionScore =
    kcalScore !== null && proteinScore !== null ? clamp01((kcalScore + proteinScore) / 2) : null;
  const habitScore = targetWater ? clamp01(waterMl / targetWater) : null;
  const trainingScore = completed.length > 0 ? 1 : 0;
  const parts = [nutritionScore, habitScore, trainingScore].filter((p): p is number => p !== null);
  const adherence = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null;

  await supabase.from('daily_user_summaries').upsert(
    {
      user_id: userId,
      day,
      kcal_total: kcal,
      protein_g: protein,
      carbs_g: sum(mealRows, 'carbs_g'),
      fat_g: sum(mealRows, 'fat_g'),
      fiber_g: sum(mealRows, 'fiber_g'),
      water_ml: waterMl,
      meals_logged: mealRows.filter((m) => !m.is_snack).length,
      snacks_logged: mealRows.filter((m) => m.is_snack).length,
      workouts_completed: completed.length,
      sets_completed: setsCount,
      training_volume_kg: volume,
      steps: steps !== null ? Math.round(Number(steps)) : null,
      sleep_minutes: sleepHrs !== null ? Math.round(Number(sleepHrs) * 60) : null,
      weight_kg: weight.data?.weight_kg ?? null,
      target_kcal: targetKcal,
      target_protein_g: targetProtein,
      target_water_ml: targetWater,
      nutrition_score: nutritionScore,
      training_score: trainingScore,
      habit_score: habitScore,
      adherence_score: adherence,
    },
    { onConflict: 'user_id,day' },
  );
}

// ----------------------------------------------------------------------------
// Today's at-a-glance summary (reads the cache row).
// ----------------------------------------------------------------------------
export type TodaySummary = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
  steps: number | null;
  sleepMinutes: number | null;
  weightKg: number | null;
};

export function useTodaySummary(userId?: string) {
  return useQuery({
    queryKey: ['today-summary', userId],
    enabled: !!userId,
    queryFn: async (): Promise<TodaySummary> => {
      const { data, error } = await supabase
        .from('daily_user_summaries')
        .select('kcal_total,protein_g,carbs_g,fat_g,water_ml,steps,sleep_minutes,weight_kg')
        .eq('user_id', userId!)
        .eq('day', localDay())
        .maybeSingle();
      if (error) throw error;
      return {
        kcal: Number(data?.kcal_total ?? 0),
        protein: Number(data?.protein_g ?? 0),
        carbs: Number(data?.carbs_g ?? 0),
        fat: Number(data?.fat_g ?? 0),
        waterMl: data?.water_ml ?? 0,
        steps: data?.steps ?? null,
        sleepMinutes: data?.sleep_minutes ?? null,
        weightKg: data?.weight_kg ?? null,
      };
    },
  });
}

// Which planned meals have already been ticked off today (for the meal card).
export function useTodayMealLog(userId?: string) {
  return useQuery({
    queryKey: ['today-meals', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_logs')
        .select('id,plan_meal_id,name,slot,is_snack')
        .eq('user_id', userId!)
        .eq('day', localDay());
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useInvalidateToday(userId?: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['today-summary', userId] });
    qc.invalidateQueries({ queryKey: ['today-meals', userId] });
  };
}

// ----------------------------------------------------------------------------
// Log writers — each: insert typed row → append log_events → recompute summary.
// ----------------------------------------------------------------------------
export type LogMealInput = {
  planMealId?: string | null;
  name: string;
  slot: MealSlot;
  isSnack?: boolean;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  source?: InputSource;
};

export function useLogMeal(userId?: string) {
  const invalidate = useInvalidateToday(userId);
  return useMutation({
    mutationFn: async (meal: LogMealInput) => {
      if (!userId) throw new Error('Not signed in');
      const day = localDay();
      const { data: row, error } = await supabase
        .from('meal_logs')
        .insert({
          user_id: userId,
          plan_meal_id: meal.planMealId ?? null,
          name: meal.name,
          slot: meal.slot,
          is_snack: meal.isSnack ?? false,
          source: meal.source ?? 'manual',
          kcal: meal.kcal,
          protein_g: meal.protein,
          carbs_g: meal.carbs,
          fat_g: meal.fat,
          fiber_g: meal.fiber ?? null,
          day,
        })
        .select('id')
        .single();
      if (error) throw error;
      await supabase.from('log_events').insert({
        user_id: userId,
        event_type: 'meal',
        ref_id: row.id,
        source: meal.source ?? 'manual',
        day,
        summary: { kcal: meal.kcal, protein: meal.protein, carbs: meal.carbs, fat: meal.fat },
      });
      await recomputeDailySummary(userId, day);
    },
    onSuccess: invalidate,
  });
}

export function useLogWater(userId?: string) {
  const invalidate = useInvalidateToday(userId);
  return useMutation({
    mutationFn: async (input: { amountMl: number; liquidType?: LiquidType }) => {
      if (!userId) throw new Error('Not signed in');
      const day = localDay();
      const { data: row, error } = await supabase
        .from('liquid_logs')
        .insert({
          user_id: userId,
          amount_ml: input.amountMl,
          liquid_type: input.liquidType ?? 'water',
          day,
        })
        .select('id')
        .single();
      if (error) throw error;
      await supabase.from('log_events').insert({
        user_id: userId,
        event_type: 'liquid',
        ref_id: row.id,
        day,
        summary: { ml: input.amountMl, type: input.liquidType ?? 'water' },
      });
      await recomputeDailySummary(userId, day);
    },
    onSuccess: invalidate,
  });
}

export function useLogWeight(userId?: string) {
  const invalidate = useInvalidateToday(userId);
  return useMutation({
    mutationFn: async (weightKg: number) => {
      if (!userId) throw new Error('Not signed in');
      const day = localDay();
      const { data: row, error } = await supabase
        .from('weight_logs')
        .upsert(
          { user_id: userId, weight_kg: weightKg, source: 'manual', day },
          { onConflict: 'user_id,day,source' },
        )
        .select('id')
        .single();
      if (error) throw error;
      await supabase.from('log_events').insert({
        user_id: userId,
        event_type: 'weight',
        ref_id: row.id,
        day,
        summary: { kg: weightKg },
      });
      await recomputeDailySummary(userId, day);
    },
    onSuccess: invalidate,
  });
}

export function useLogHabit(userId?: string) {
  const invalidate = useInvalidateToday(userId);
  return useMutation({
    mutationFn: async (input: { habitType: HabitType; value: number }) => {
      if (!userId) throw new Error('Not signed in');
      const day = localDay();
      const unit = input.habitType === 'steps' ? 'steps' : 'hours';
      const { data: row, error } = await supabase
        .from('habit_logs')
        .upsert(
          {
            user_id: userId,
            habit_type: input.habitType,
            value: input.value,
            unit,
            source: 'manual',
            day,
          },
          { onConflict: 'user_id,habit_type,day,source' },
        )
        .select('id')
        .single();
      if (error) throw error;
      await supabase.from('log_events').insert({
        user_id: userId,
        event_type: 'habit',
        ref_id: row.id,
        day,
        summary: { type: input.habitType, value: input.value },
      });
      await recomputeDailySummary(userId, day);
    },
    onSuccess: invalidate,
  });
}
