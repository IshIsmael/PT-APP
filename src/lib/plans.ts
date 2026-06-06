import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import {
  generateMealPlan,
  generateTrainingPlan,
  type GeneratedMealPlan,
  type GeneratedTrainingPlan,
} from './plan-engine';

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
    .insert({
      user_id: userId,
      kind: 'training',
      name: generated.name,
      source: 'algorithm',
      is_active: true,
    })
    .select('id')
    .single();
  if (planErr) throw planErr;

  for (let i = 0; i < generated.workouts.length; i++) {
    const w = generated.workouts[i];
    const { data: wRow, error: wErr } = await supabase
      .from('plan_workouts')
      .insert({
        plan_id: plan.id,
        user_id: userId,
        name: w.name,
        day_of_week: w.dayOfWeek,
        order_index: i,
      })
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

// ---------- Active meal plan (for display) ----------------------------------
export type MealItemView = {
  id: string;
  name: string;
  grams: number | null;
};
export type MealView = {
  id: string;
  slot: string;
  name: string;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  items: MealItemView[];
};
export type MealPlanView = {
  id: string;
  name: string;
  meals: MealView[];
};

const SLOT_ORDER: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };

export function useActiveMealPlan(userId?: string) {
  return useQuery({
    queryKey: ['meal-plan', userId],
    enabled: !!userId,
    queryFn: async (): Promise<MealPlanView | null> => {
      const { data, error } = await supabase
        .from('plans')
        .select(
          `id, name,
           plan_meals (
             id, slot, order_index, name, target_kcal, protein_g, carbs_g, fat_g,
             plan_meal_items ( id, name, grams )
           )`,
        )
        .eq('user_id', userId!)
        .eq('kind', 'nutrition')
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const meals: MealView[] = (data.plan_meals ?? [])
        .sort(
          (a, b) =>
            (SLOT_ORDER[a.slot] ?? 9) - (SLOT_ORDER[b.slot] ?? 9) ||
            (a.order_index ?? 0) - (b.order_index ?? 0),
        )
        .map((m) => ({
          id: m.id,
          slot: m.slot,
          name: m.name,
          kcal: m.target_kcal,
          protein: m.protein_g,
          carbs: m.carbs_g,
          fat: m.fat_g,
          items: (m.plan_meal_items ?? []).map((it) => ({
            id: it.id,
            name: it.name,
            grams: it.grams,
          })),
        }));

      return { id: data.id, name: data.name, meals };
    },
  });
}

async function saveMealPlan(userId: string, generated: GeneratedMealPlan) {
  await supabase
    .from('plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('kind', 'nutrition')
    .eq('is_active', true);

  const { data: plan, error: planErr } = await supabase
    .from('plans')
    .insert({
      user_id: userId,
      kind: 'nutrition',
      name: generated.name,
      source: 'algorithm',
      is_active: true,
    })
    .select('id')
    .single();
  if (planErr) throw planErr;

  for (let i = 0; i < generated.meals.length; i++) {
    const m = generated.meals[i];
    const { data: mealRow, error: mealErr } = await supabase
      .from('plan_meals')
      .insert({
        plan_id: plan.id,
        user_id: userId,
        day_of_week: null,
        slot: m.slot,
        order_index: i,
        name: m.name,
        photo_category: m.slot,
        target_kcal: m.targetKcal,
        protein_g: Math.round(m.protein),
        carbs_g: Math.round(m.carbs),
        fat_g: Math.round(m.fat),
        fiber_g: Math.round(m.fiber),
      })
      .select('id')
      .single();
    if (mealErr) throw mealErr;

    if (m.items.length) {
      const { error: itemErr } = await supabase.from('plan_meal_items').insert(
        m.items.map((it) => ({
          plan_meal_id: mealRow.id,
          user_id: userId,
          food_id: it.foodId,
          name: it.name,
          quantity: it.grams,
          unit: 'g',
          grams: it.grams,
          kcal: it.kcal,
          protein_g: it.protein,
          carbs_g: it.carbs,
          fat_g: it.fat,
          fiber_g: it.fiber,
        })),
      );
      if (itemErr) throw itemErr;
    }
  }
}

export function useGenerateMealPlan(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not signed in');

      const { data: foods, error: foodErr } = await supabase
        .from('foods')
        .select('*')
        .eq('kind', 'ingredient');
      if (foodErr) throw foodErr;

      const { data: goal, error: goalErr } = await supabase
        .from('user_goals')
        .select(
          'target_kcal, protein_g, carbs_g, fat_g, meals_per_day, diet_tags, excluded_allergens',
        )
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      if (goalErr) throw goalErr;

      const generated = generateMealPlan(foods ?? [], {
        targetKcal: goal.target_kcal ?? 2000,
        proteinG: goal.protein_g ?? 150,
        carbsG: goal.carbs_g ?? 200,
        fatG: goal.fat_g ?? 60,
        mealsPerDay: goal.meals_per_day,
        dietTags: goal.diet_tags,
        excludedAllergens: goal.excluded_allergens,
      });
      await saveMealPlan(userId, generated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plan', userId] }),
  });
}
