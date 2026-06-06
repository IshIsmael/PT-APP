import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { generateTrainingPlan, type GeneratedTrainingPlan } from './plan-engine';

// ---------- Active training plan (for display) ------------------------------
export type PlanExerciseView = {
  id: string;
  name: string;
  primaryMuscle: string | null;
  sets: number | null;
  repsLow: number | null;
  repsHigh: number | null;
  restSeconds: number | null;
};
export type PlanWorkoutView = {
  id: string;
  name: string;
  dayOfWeek: number | null;
  exercises: PlanExerciseView[];
};
export type TrainingPlanView = {
  id: string;
  name: string;
  workouts: PlanWorkoutView[];
};

export function useActiveTrainingPlan(userId?: string) {
  return useQuery({
    queryKey: ['training-plan', userId],
    enabled: !!userId,
    queryFn: async (): Promise<TrainingPlanView | null> => {
      const { data, error } = await supabase
        .from('plans')
        .select(
          `id, name,
           plan_workouts (
             id, name, day_of_week, order_index,
             plan_workout_exercises (
               id, order_index, target_sets, target_reps_low, target_reps_high, target_rest_seconds,
               exercises ( name, primary_muscle )
             )
           )`,
        )
        .eq('user_id', userId!)
        .eq('kind', 'training')
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const workouts: PlanWorkoutView[] = (data.plan_workouts ?? [])
        .sort((a, b) => (a.day_of_week ?? 99) - (b.day_of_week ?? 99))
        .map((w) => ({
          id: w.id,
          name: w.name,
          dayOfWeek: w.day_of_week,
          exercises: (w.plan_workout_exercises ?? [])
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((pe) => ({
              id: pe.id,
              name: pe.exercises?.name ?? 'Exercise',
              primaryMuscle: pe.exercises?.primary_muscle ?? null,
              sets: pe.target_sets,
              repsLow: pe.target_reps_low,
              repsHigh: pe.target_reps_high,
              restSeconds: pe.target_rest_seconds,
            })),
        }));

      return { id: data.id, name: data.name, workouts };
    },
  });
}

// ---------- Persist a generated training plan -------------------------------
async function saveTrainingPlan(userId: string, generated: GeneratedTrainingPlan) {
  // Deactivate any current active training plan (unique-active-per-kind index).
  await supabase
    .from('plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('kind', 'training')
    .eq('is_active', true);

  const { data: plan, error: planErr } = await supabase
    .from('plans')
    .insert({ user_id: userId, kind: 'training', name: generated.name, source: 'algorithm', is_active: true })
    .select('id')
    .single();
  if (planErr) throw planErr;

  for (let i = 0; i < generated.workouts.length; i++) {
    const w = generated.workouts[i];
    const { data: wRow, error: wErr } = await supabase
      .from('plan_workouts')
      .insert({ plan_id: plan.id, user_id: userId, name: w.name, day_of_week: w.dayOfWeek, order_index: i })
      .select('id')
      .single();
    if (wErr) throw wErr;

    if (w.exercises.length) {
      const { error: exErr } = await supabase.from('plan_workout_exercises').insert(
        w.exercises.map((e, idx) => ({
          plan_workout_id: wRow.id,
          user_id: userId,
          exercise_id: e.exerciseId,
          order_index: idx,
          target_sets: e.targetSets,
          target_reps_low: e.targetRepsLow,
          target_reps_high: e.targetRepsHigh,
          target_rest_seconds: e.targetRestSeconds,
        })),
      );
      if (exErr) throw exErr;
    }
  }
}

export function useGenerateTrainingPlan(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not signed in');

      const { data: library, error: libErr } = await supabase.from('exercises').select('*');
      if (libErr) throw libErr;

      const { data: goal, error: goalErr } = await supabase
        .from('user_goals')
        .select('goal_type, training_days_per_week, equipment')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      if (goalErr) throw goalErr;

      const generated = generateTrainingPlan(library ?? [], {
        goalType: goal.goal_type,
        daysPerWeek: goal.training_days_per_week,
        equipment: goal.equipment,
      });
      await saveTrainingPlan(userId, generated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-plan', userId] }),
  });
}
