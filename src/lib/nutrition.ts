import type { Database } from './database.types';

type Sex = Database['public']['Enums']['sex'];
type Activity = Database['public']['Enums']['activity_level'];
type Goal = Database['public']['Enums']['goal_type'];

const ACTIVITY_MULTIPLIER: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Mifflin-St Jeor basal metabolic rate (kcal/day).
export function mifflinBmr(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') return base + 5;
  if (sex === 'female') return base - 161;
  return base - 78; // unspecified → midpoint of the male/female constants
}

export type TargetInputs = {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: Activity;
  goalType: Goal;
  weeklyRateKg?: number | null;
};

export type Targets = {
  tdee_kcal: number;
  target_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  water_ml_goal: number;
};

// Science-based daily targets from intake. Deterministic + unit-testable.
export function computeTargets(i: TargetInputs): Targets {
  const bmr = mifflinBmr(i.weightKg, i.heightCm, i.age, i.sex);
  const tdee = bmr * ACTIVITY_MULTIPLIER[i.activityLevel];

  // ~7700 kcal per kg of body mass; spread the weekly rate across the day.
  const rate = i.weeklyRateKg ?? 0.5;
  const dailyDelta = (rate * 7700) / 7;

  let target = tdee;
  if (i.goalType === 'lose_fat') target = tdee - dailyDelta;
  else if (i.goalType === 'build_muscle') target = tdee + Math.min(dailyDelta, 400);
  else if (i.goalType === 'recomp') target = tdee - 200;

  // Never prescribe below a safe floor.
  target = Math.max(target, bmr * 1.1);

  const protein = 2.0 * i.weightKg; // g/kg
  const fat = 0.8 * i.weightKg; // g/kg
  const carbs = Math.max((target - (protein * 4 + fat * 9)) / 4, 0);
  const fiber = (target / 1000) * 14;
  const water = 35 * i.weightKg; // ml/kg baseline

  return {
    tdee_kcal: Math.round(tdee),
    target_kcal: Math.round(target),
    protein_g: Math.round(protein),
    carbs_g: Math.round(carbs),
    fat_g: Math.round(fat),
    fiber_g: Math.round(fiber),
    water_ml_goal: Math.round(water / 50) * 50,
  };
}
