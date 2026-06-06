import type { Database } from './database.types';

type Goal = Database['public']['Enums']['goal_type'];
export type ExerciseRow = Database['public']['Tables']['exercises']['Row'];

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
