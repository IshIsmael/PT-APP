import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { localDay, recomputeDailySummary } from './logging';

export type SessionExercise = {
  id: string; // plan_workout_exercise id
  exerciseId: string;
  name: string;
  targetSets: number | null;
  repsLow: number | null;
  repsHigh: number | null;
  restSeconds: number | null;
};

export function usePlanWorkout(planWorkoutId?: string) {
  return useQuery({
    queryKey: ['plan-workout', planWorkoutId],
    enabled: !!planWorkoutId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_workouts')
        .select(
          `id, name,
           plan_workout_exercises (
             id, exercise_id, order_index, target_sets, target_reps_low, target_reps_high, target_rest_seconds,
             exercises ( name )
           )`,
        )
        .eq('id', planWorkoutId!)
        .single();
      if (error) throw error;

      const exercises: SessionExercise[] = (data.plan_workout_exercises ?? [])
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((pe) => ({
          id: pe.id,
          exerciseId: pe.exercise_id,
          name: pe.exercises?.name ?? 'Exercise',
          targetSets: pe.target_sets,
          repsLow: pe.target_reps_low,
          repsHigh: pe.target_reps_high,
          restSeconds: pe.target_rest_seconds,
        }));
      return { id: data.id, name: data.name, exercises };
    },
  });
}

export type FinishedSet = { weightKg: number | null; reps: number | null };
export type FinishedExercise = {
  exerciseId: string;
  planWorkoutExerciseId: string;
  sets: FinishedSet[];
};

export function useFinishWorkout(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      planWorkoutId: string;
      name: string;
      mode: 'standard' | 'advanced';
      startedAt: string;
      exercises: FinishedExercise[];
    }) => {
      if (!userId) throw new Error('Not signed in');
      const day = localDay();
      const nowIso = new Date().toISOString();

      const { data: session, error: sErr } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: userId,
          plan_workout_id: input.planWorkoutId,
          name: input.name,
          mode: input.mode,
          status: 'completed',
          source: 'manual',
          day,
          started_at: input.startedAt,
          ended_at: nowIso,
        })
        .select('id')
        .single();
      if (sErr) throw sErr;

      const rows = input.exercises.flatMap((e) =>
        e.sets
          .filter((s) => s.reps && s.reps > 0)
          .map((s, i) => ({
            user_id: userId,
            workout_session_id: session.id,
            exercise_id: e.exerciseId,
            plan_workout_exercise_id: e.planWorkoutExerciseId,
            set_index: i + 1,
            set_type: 'working' as const,
            weight_kg: s.weightKg,
            reps: s.reps,
            completed_at: nowIso,
          })),
      );
      if (rows.length) {
        const { error: setErr } = await supabase.from('set_logs').insert(rows);
        if (setErr) throw setErr;
      }

      const volume = rows.reduce((a, r) => a + (r.weight_kg ?? 0) * (r.reps ?? 0), 0);
      await supabase.from('log_events').insert({
        user_id: userId,
        event_type: 'workout_session',
        ref_id: session.id,
        day,
        summary: { name: input.name, sets: rows.length, volume },
      });
      await recomputeDailySummary(userId, day);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-summary', userId] });
    },
  });
}
