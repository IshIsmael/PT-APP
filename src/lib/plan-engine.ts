import type { Database } from './database.types';

type Goal = Database['public']['Enums']['goal_type'];
export type ExerciseRow = Database['public']['Tables']['exercises']['Row'];
export type FoodRow = Database['public']['Tables']['foods']['Row'];
type MealSlot = Database['public']['Enums']['meal_slot'];

// ============================================================================
// Training plan generation
// Picks a split by weekly frequency, fills each session's muscle slots from the
// exercise library (respecting available equipment), and assigns goal-based
// set/rep/rest schemes (progressive overload is applied at log time, Phase 4).
// ============================================================================

export type TrainingInput = {
  goalType: Goal;
  daysPerWeek: number;
  equipment: string[];
};

export type GeneratedExercise = {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetRepsLow: number;
  targetRepsHigh: number;
  targetRestSeconds: number;
};

export type GeneratedWorkout = {
  name: string;
  dayOfWeek: number;
  exercises: GeneratedExercise[];
};

export type GeneratedTrainingPlan = {
  name: string;
  workouts: GeneratedWorkout[];
};

type SessionType = 'FULL_A' | 'FULL_B' | 'PUSH' | 'PULL' | 'LEGS' | 'UPPER' | 'LOWER';

// Ordered muscle slots per session (primary_muscle values from the seeded library).
const BLUEPRINTS: Record<SessionType, { label: string; muscles: string[] }> = {
  FULL_A: { label: 'Full Body A', muscles: ['chest', 'lats', 'quads', 'hamstrings', 'side_delts', 'core'] },
  FULL_B: { label: 'Full Body B', muscles: ['chest', 'upper_back', 'quads', 'glutes', 'biceps', 'triceps'] },
  PUSH: { label: 'Push', muscles: ['chest', 'chest', 'front_delts', 'side_delts', 'triceps', 'triceps'] },
  PULL: { label: 'Pull', muscles: ['lats', 'upper_back', 'lats', 'biceps', 'biceps', 'rear_delts'] },
  LEGS: { label: 'Legs', muscles: ['quads', 'hamstrings', 'quads', 'glutes', 'calves', 'core'] },
  UPPER: { label: 'Upper', muscles: ['chest', 'lats', 'upper_back', 'front_delts', 'biceps', 'triceps'] },
  LOWER: { label: 'Lower', muscles: ['quads', 'hamstrings', 'glutes', 'quads', 'calves', 'core'] },
};

const SPLITS: Record<number, { name: string; sessions: SessionType[] }> = {
  2: { name: 'Full Body', sessions: ['FULL_A', 'FULL_B'] },
  3: { name: 'Push / Pull / Legs', sessions: ['PUSH', 'PULL', 'LEGS'] },
  4: { name: 'Upper / Lower', sessions: ['UPPER', 'LOWER', 'UPPER', 'LOWER'] },
  5: { name: 'PPL + Upper / Lower', sessions: ['PUSH', 'PULL', 'LEGS', 'UPPER', 'LOWER'] },
  6: { name: 'Push / Pull / Legs ×2', sessions: ['PUSH', 'PULL', 'LEGS', 'PUSH', 'PULL', 'LEGS'] },
};

// 0 = Sunday … 6 = Saturday. Spread sessions across the week with rest gaps.
const DAY_PATTERNS: Record<number, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
};

function allowedEquipment(equipment: string[]): Set<string> {
  const eq = new Set(equipment);
  if (eq.has('full_gym')) {
    return new Set(['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'bands']);
  }
  // Home setups (dumbbells / bands) — also allow bodyweight.
  if (eq.has('dumbbells') || eq.has('dumbbell') || eq.has('bands')) {
    return new Set(['dumbbell', 'bands', 'bodyweight']);
  }
  return new Set(['bodyweight']);
}

function repScheme(
  goal: Goal,
  isCompound: boolean,
): { sets: number; low: number; high: number; rest: number } {
  if (goal === 'build_muscle') {
    return isCompound ? { sets: 4, low: 6, high: 10, rest: 90 } : { sets: 3, low: 10, high: 15, rest: 60 };
  }
  if (goal === 'recomp') {
    return isCompound ? { sets: 4, low: 8, high: 12, rest: 75 } : { sets: 3, low: 12, high: 15, rest: 60 };
  }
  if (goal === 'lose_fat') {
    return isCompound ? { sets: 3, low: 10, high: 12, rest: 60 } : { sets: 3, low: 12, high: 15, rest: 45 };
  }
  // maintain
  return isCompound ? { sets: 3, low: 8, high: 12, rest: 75 } : { sets: 3, low: 10, high: 15, rest: 60 };
}

function matchesMuscle(ex: ExerciseRow, muscle: string): boolean {
  return ex.primary_muscle === muscle || (ex.secondary_muscles ?? []).includes(muscle);
}

// Pick an exercise for a muscle slot: prefer allowed-equipment + compound, fall
// back to bodyweight, then to anything. `rotation` varies picks across repeats.
function pickExercise(
  library: ExerciseRow[],
  muscle: string,
  allowed: Set<string>,
  used: Set<string>,
  rotation: number,
): ExerciseRow | null {
  const candidates = library.filter((e) => matchesMuscle(e, muscle) && !used.has(e.id));
  if (candidates.length === 0) return null;

  const byAllowed = candidates.filter((e) => e.equipment && allowed.has(e.equipment));
  const byBodyweight = candidates.filter((e) => e.equipment === 'bodyweight');
  const pool = byAllowed.length ? byAllowed : byBodyweight.length ? byBodyweight : candidates;

  pool.sort((a, b) => Number(b.is_compound) - Number(a.is_compound));
  return pool[rotation % pool.length];
}

export function generateTrainingPlan(
  library: ExerciseRow[],
  input: TrainingInput,
): GeneratedTrainingPlan {
  const days = Math.min(Math.max(input.daysPerWeek, 2), 6);
  const split = SPLITS[days] ?? SPLITS[3];
  const pattern = DAY_PATTERNS[days] ?? DAY_PATTERNS[3];
  const allowed = allowedEquipment(input.equipment);

  // Count how many times each session type appears, to rotate exercise choices.
  const typeCounts: Record<string, number> = {};

  const workouts: GeneratedWorkout[] = split.sessions.map((type, i) => {
    const blueprint = BLUEPRINTS[type];
    const rotation = typeCounts[type] ?? 0;
    typeCounts[type] = rotation + 1;

    const used = new Set<string>();
    const exercises: GeneratedExercise[] = [];

    blueprint.muscles.forEach((muscle, slot) => {
      const ex = pickExercise(library, muscle, allowed, used, rotation + slot);
      if (!ex) return;
      used.add(ex.id);
      const scheme = repScheme(input.goalType, ex.is_compound);
      exercises.push({
        exerciseId: ex.id,
        name: ex.name,
        targetSets: scheme.sets,
        targetRepsLow: scheme.low,
        targetRepsHigh: scheme.high,
        targetRestSeconds: scheme.rest,
      });
    });

    // Label repeated session types A/B (e.g. two Push days → Push A / Push B).
    const repeated = split.sessions.filter((s) => s === type).length > 1;
    const name = repeated ? `${blueprint.label} ${String.fromCharCode(65 + rotation)}` : blueprint.label;

    return { name, dayOfWeek: pattern[i], exercises };
  });

  return { name: `Smart Plan — ${split.name}`, workouts };
}

// ============================================================================
// Meal plan generation
// Filters the food pool by diet + allergens, then builds each meal from a
// protein / carb / fat / veg source scaled to hit that meal's share of the
// daily macros. One repeating day for v1 (per-day variety can come later).
// ============================================================================

export type MealInput = {
  targetKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  mealsPerDay: number;
  dietTags: string[];
  excludedAllergens: string[];
};

export type GeneratedMealItem = {
  foodId: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};
export type GeneratedMeal = {
  slot: MealSlot;
  name: string;
  targetKcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  items: GeneratedMealItem[];
};
export type GeneratedMealPlan = {
  name: string;
  meals: GeneratedMeal[];
};

type FoodRole = 'protein' | 'carb' | 'fat' | 'veg';

// Metadata keyed by the seeded food names (we control these).
const FOOD_META: Record<string, { role: FoodRole; tags: string[] }> = {
  'Chicken Breast (cooked)': { role: 'protein', tags: ['meat', 'animal'] },
  'Lean Beef Mince 5% (cooked)': { role: 'protein', tags: ['meat', 'animal'] },
  'Salmon Fillet (cooked)': { role: 'protein', tags: ['fish', 'animal'] },
  'Tuna (canned in water)': { role: 'protein', tags: ['fish', 'animal'] },
  'Whole Egg': { role: 'protein', tags: ['egg', 'animal'] },
  'Egg White': { role: 'protein', tags: ['egg', 'animal'] },
  'Greek Yogurt 0%': { role: 'protein', tags: ['dairy', 'animal'] },
  'Whey Protein (generic)': { role: 'protein', tags: ['dairy', 'animal'] },
  'Tofu (firm)': { role: 'protein', tags: ['plant', 'soy'] },
  'Lentils (cooked)': { role: 'protein', tags: ['plant'] },
  'Chickpeas (cooked)': { role: 'protein', tags: ['plant'] },
  'White Rice (cooked)': { role: 'carb', tags: ['plant'] },
  'Brown Rice (cooked)': { role: 'carb', tags: ['plant'] },
  'Oats (dry)': { role: 'carb', tags: ['plant', 'gluten'] },
  'Pasta (cooked)': { role: 'carb', tags: ['plant', 'gluten'] },
  'Wholemeal Bread': { role: 'carb', tags: ['plant', 'gluten'] },
  'Potato (boiled)': { role: 'carb', tags: ['plant'] },
  'Sweet Potato (baked)': { role: 'carb', tags: ['plant'] },
  Banana: { role: 'carb', tags: ['plant', 'fruit'] },
  Apple: { role: 'veg', tags: ['plant', 'fruit'] },
  Broccoli: { role: 'veg', tags: ['plant'] },
  Avocado: { role: 'fat', tags: ['plant'] },
  Almonds: { role: 'fat', tags: ['plant', 'nuts'] },
  'Peanut Butter': { role: 'fat', tags: ['plant', 'nuts'] },
  'Olive Oil': { role: 'fat', tags: ['plant'] },
  'Whole Milk': { role: 'fat', tags: ['dairy', 'animal'] },
  'Cheddar Cheese': { role: 'fat', tags: ['dairy', 'animal'] },
};

const ALLERGEN_TAG: Record<string, string> = {
  dairy: 'dairy',
  nuts: 'nuts',
  gluten: 'gluten',
  eggs: 'egg',
  soy: 'soy',
};

function dietExcludes(tags: string[], dietTags: string[]): boolean {
  const has = (t: string) => tags.includes(t);
  if (dietTags.includes('vegan') && has('animal')) return true;
  if (dietTags.includes('vegetarian') && (has('meat') || has('fish'))) return true;
  if (dietTags.includes('pescatarian') && has('meat')) return true;
  return false;
}

const num = (n: number | null): number => n ?? 0;

function macrosAt(food: FoodRow, grams: number) {
  const f = grams / 100;
  return {
    kcal: num(food.kcal_per_100g) * f,
    protein: num(food.protein_per_100g) * f,
    carbs: num(food.carbs_per_100g) * f,
    fat: num(food.fat_per_100g) * f,
    fiber: num(food.fiber_per_100g) * f,
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

function slotLayout(meals: number): MealSlot[] {
  const order: MealSlot[] = ['breakfast', 'lunch', 'dinner'];
  const out: MealSlot[] = [];
  for (let i = 0; i < meals; i++) out.push(i < 3 ? order[i] : 'snack');
  return out;
}

export function generateMealPlan(pool: FoodRow[], input: MealInput): GeneratedMealPlan {
  const usable = pool.filter((f) => {
    const meta = FOOD_META[f.name];
    if (!meta) return false;
    if (dietExcludes(meta.tags, input.dietTags)) return false;
    for (const a of input.excludedAllergens) {
      const tag = ALLERGEN_TAG[a];
      if (tag && meta.tags.includes(tag)) return false;
    }
    return true;
  });

  const byRole = (role: FoodRole) => usable.filter((f) => FOOD_META[f.name].role === role);
  const proteins = byRole('protein');
  const carbs = byRole('carb');
  const fats = byRole('fat');
  const vegs = byRole('veg');

  const meals = clamp(input.mealsPerDay, 2, 6);
  const slots = slotLayout(meals);
  const weights = slots.map((s) => (s === 'snack' ? 0.5 : 1));
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const generated: GeneratedMeal[] = slots.map((slot, i) => {
    const w = weights[i] / weightSum;
    const tP = input.proteinG * w;
    const tC = input.carbsG * w;
    const tF = input.fatG * w;

    const items: GeneratedMealItem[] = [];
    let cC = 0;
    let cF = 0;

    const push = (food: FoodRow | undefined, grams: number) => {
      if (!food || grams < 5) return;
      const g = Math.round(grams);
      const m = macrosAt(food, g);
      items.push({
        foodId: food.id,
        name: food.name,
        grams: g,
        kcal: Math.round(m.kcal),
        protein: Math.round(m.protein),
        carbs: Math.round(m.carbs),
        fat: Math.round(m.fat),
        fiber: Math.round(m.fiber),
      });
      cC += m.carbs;
      cF += m.fat;
    };

    const p = proteins[i % Math.max(proteins.length, 1)];
    if (p) push(p, clamp((tP * 100) / Math.max(num(p.protein_per_100g), 1), 30, 350));

    const c = carbs[i % Math.max(carbs.length, 1)];
    if (c) push(c, clamp(((tC - cC) * 100) / Math.max(num(c.carbs_per_100g), 1), 0, 400));

    const fa = fats[i % Math.max(fats.length, 1)];
    if (fa) push(fa, clamp(((tF - cF) * 100) / Math.max(num(fa.fat_per_100g), 1), 0, 60));

    if (slot !== 'snack' && vegs.length) push(vegs[i % vegs.length], 100);

    const total = items.reduce(
      (acc, it) => ({
        kcal: acc.kcal + it.kcal,
        protein: acc.protein + it.protein,
        carbs: acc.carbs + it.carbs,
        fat: acc.fat + it.fat,
        fiber: acc.fiber + it.fiber,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );

    const label = slot[0].toUpperCase() + slot.slice(1);
    const name = items.length
      ? `${label}: ${items.map((it) => it.name.split(' (')[0]).join(' + ')}`
      : label;

    return {
      slot,
      name,
      targetKcal: Math.round(total.kcal),
      protein: total.protein,
      carbs: total.carbs,
      fat: total.fat,
      fiber: total.fiber,
      items,
    };
  });

  return { name: 'Smart Meal Plan', meals: generated };
}
