import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import {
  useFinishWorkout,
  useLastPerformance,
  usePlanWorkout,
  type FinishedExercise,
  type LastPerf,
  type SessionExercise,
} from '../../src/lib/workout';
import { hapticImpact, hapticSelect, hapticSuccess } from '../../src/lib/haptics';
import { Stepper } from '../../src/components/Stepper';
import { RestRing } from '../../src/components/RestRing';
import { NumberModal } from '../../src/components/NumberModal';
import { Sprout } from '../../src/components/Sprout';

const DISPLAY_BOLD = 'Fraunces_700Bold';
type SetRow = { weight: number; reps: number; done: boolean };
type Entry = { ex: SessionExercise; sets: SetRow[] };
type ModalCfg = { title: string; decimal: boolean; initial: string; onSubmit: (n: number) => void };

export default function WorkoutScreen() {
  const { planWorkoutId } = useLocalSearchParams<{ planWorkoutId: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: workout, isLoading } = usePlanWorkout(planWorkoutId);
  const exerciseIds = workout?.exercises.map((e) => e.exerciseId) ?? [];
  const { data: lastPerf, isLoading: perfLoading } = useLastPerformance(userId, exerciseIds);

  const notReady = isLoading || !workout || perfLoading;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      {notReady ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E07A5F" />
        </View>
      ) : (
        <WorkoutRunner workout={workout} userId={userId} lastPerf={lastPerf ?? {}} />
      )}
    </SafeAreaView>
  );
}

function WorkoutRunner({
  workout,
  userId,
  lastPerf,
}: {
  workout: { id: string; name: string; exercises: SessionExercise[] };
  userId?: string;
  lastPerf: LastPerf;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const finish = useFinishWorkout(userId);

  const [startedAt] = useState(() => new Date().toISOString());
  const [entries, setEntries] = useState<Entry[]>(() =>
    workout.exercises.map((ex) => {
      const lp = lastPerf[ex.exerciseId];
      const reps = lp?.reps ?? ex.repsLow ?? 8;
      const weight = lp?.weightKg ?? 0;
      return {
        ex,
        sets: Array.from({ length: ex.targetSets ?? 3 }, () => ({ weight, reps, done: false })),
      };
    }),
  );
  const [exIdx, setExIdx] = useState(0);
  const [rest, setRest] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const [modal, setModal] = useState<ModalCfg | null>(null);
  const [summary, setSummary] = useState<{ volume: number; sets: number; minutes: number } | null>(
    null,
  );

  // Gentle cross-fade when switching exercise.
  const [fade] = useState(() => new Animated.Value(1));
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }).start();
  }, [exIdx, fade]);

  // Rest countdown — buzzes when rest ends.
  useEffect(() => {
    if (rest === null) return;
    const t = setTimeout(() => {
      if (rest <= 1) {
        hapticSuccess();
        setRest(null);
      } else {
        setRest(rest - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const entry = entries[exIdx];
  const totalSets = entries.reduce((a, e) => a + e.sets.length, 0);
  const loggedSets = entries.reduce(
    (a, e) => a + e.sets.filter((s) => s.done && s.reps > 0).length,
    0,
  );
  const progress = totalSets ? loggedSets / totalSets : 0;
  const last = lastPerf[entry.ex.exerciseId];

  function patchSet(setIdx: number, patch: Partial<SetRow>) {
    setEntries((prev) =>
      prev.map((e, i) =>
        i !== exIdx
          ? e
          : { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) },
      ),
    );
  }

  function toggleDone(setIdx: number) {
    const wasDone = entry.sets[setIdx].done;
    patchSet(setIdx, { done: !wasDone });
    if (!wasDone) {
      hapticImpact();
      const r = entry.ex.restSeconds ?? 0;
      if (r > 0) {
        setRestTotal(r);
        setRest(r);
      }
    }
  }

  function addSet() {
    hapticSelect();
    const lastRow = entry.sets[entry.sets.length - 1];
    setEntries((prev) =>
      prev.map((e, i) =>
        i !== exIdx
          ? e
          : {
              ...e,
              sets: [
                ...e.sets,
                { weight: lastRow?.weight ?? 0, reps: lastRow?.reps ?? 8, done: false },
              ],
            },
      ),
    );
  }

  function onFinish() {
    const exercises: FinishedExercise[] = entries.map((e) => ({
      exerciseId: e.ex.exerciseId,
      planWorkoutExerciseId: e.ex.id,
      sets: e.sets
        .filter((s) => s.done && s.reps > 0)
        .map((s) => ({ weightKg: s.weight || null, reps: s.reps })),
    }));
    const volume = Math.round(
      entries.reduce(
        (a, e) =>
          a + e.sets.filter((s) => s.done && s.reps > 0).reduce((b, s) => b + s.weight * s.reps, 0),
        0,
      ),
    );
    const minutes = Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000));

    finish.mutate(
      { planWorkoutId: workout.id, name: workout.name, mode: 'standard', startedAt, exercises },
      {
        onSuccess: () => {
          hapticSuccess();
          setSummary({ volume, sets: loggedSets, minutes });
        },
        onError: (e) =>
          Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.'),
      },
    );
  }

  // ---- Completion moment ----
  if (summary) {
    return (
      <View className="flex-1 items-center justify-center gap-5 px-8">
        <Sprout streak={12} size={132} />
        <Text className="text-4xl text-fg" style={{ fontFamily: DISPLAY_BOLD }}>
          Nice work
        </Text>
        <Text className="text-center text-base text-fg-muted">
          {workout.name} — logged and in the books.
        </Text>
        <View className="w-full flex-row justify-around rounded-3xl border border-border bg-bg-elevated py-5">
          <Stat value={`${summary.sets}`} label="sets" />
          <Stat value={`${summary.volume}`} label="kg lifted" />
          <Stat value={`${summary.minutes}`} label="min" />
        </View>
        <Pressable
          onPress={() => router.back()}
          style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(224,122,95,0.30)' }}
          className="w-full items-center rounded-2xl bg-accent py-4 active:opacity-90"
        >
          <Text className="font-semibold text-base text-bg">Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header + overall progress */}
      <View className="gap-3 px-5 py-3">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text className="text-base text-fg-muted">Close</Text>
          </Pressable>
          <Text className="font-semibold text-base text-fg">{workout.name}</Text>
          <Text className="text-xs text-fg-faint" style={{ fontVariant: ['tabular-nums'] }}>
            {loggedSets}/{totalSets}
          </Text>
        </View>
        <View className="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
          <View className="h-full rounded-full bg-sage" style={{ width: `${progress * 100}%` }} />
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ScrollView contentContainerClassName="px-5 pb-6 gap-4" keyboardShouldPersistTaps="handled">
          {/* Current exercise */}
          <View className="gap-1">
            <Text className="text-xs uppercase tracking-wide text-fg-faint">
              Exercise {exIdx + 1} of {entries.length}
            </Text>
            <Text className="text-3xl text-fg" style={{ fontFamily: DISPLAY_BOLD }}>
              {entry.ex.name}
            </Text>
            <Text className="text-sm text-fg-muted">
              Target {entry.ex.targetSets} × {entry.ex.repsLow}–{entry.ex.repsHigh}
              {last?.weightKg != null
                ? `   ·   Last: ${last.weightKg}kg × ${last.reps ?? '—'}`
                : ''}
            </Text>
          </View>

          {/* Set rows with steppers */}
          <View className="gap-2">
            <View className="flex-row items-center gap-2 px-1">
              <Text className="w-6 text-xs text-fg-faint">Set</Text>
              <Text className="flex-1 text-center text-xs text-fg-faint">Weight</Text>
              <Text className="w-4" />
              <Text className="flex-1 text-center text-xs text-fg-faint">Reps</Text>
              <Text className="w-12" />
            </View>
            {entry.sets.map((s, setIdx) => (
              <View
                key={setIdx}
                className={`flex-row items-center gap-2 ${s.done ? 'opacity-60' : ''}`}
              >
                <Text className="w-6 text-center font-semibold text-base text-fg-muted">
                  {setIdx + 1}
                </Text>
                <Stepper
                  value={s.weight}
                  onChange={(v) => patchSet(setIdx, { weight: v })}
                  step={2.5}
                  decimals={s.weight % 1 === 0 ? 0 : 1}
                  suffix="kg"
                  onPressValue={() =>
                    setModal({
                      title: `Set ${setIdx + 1} — weight`,
                      decimal: true,
                      initial: `${s.weight}`,
                      onSubmit: (n) => patchSet(setIdx, { weight: n }),
                    })
                  }
                />
                <Text className="w-4 text-center text-fg-faint">×</Text>
                <Stepper
                  value={s.reps}
                  onChange={(v) => patchSet(setIdx, { reps: v })}
                  step={1}
                  onPressValue={() =>
                    setModal({
                      title: `Set ${setIdx + 1} — reps`,
                      decimal: false,
                      initial: `${s.reps}`,
                      onSubmit: (n) => patchSet(setIdx, { reps: Math.round(n) }),
                    })
                  }
                />
                <Pressable
                  onPress={() => toggleDone(setIdx)}
                  className={`h-12 w-12 items-center justify-center rounded-2xl ${
                    s.done ? 'bg-sage' : 'border border-border bg-bg-subtle'
                  }`}
                >
                  <Text className={`text-lg ${s.done ? 'font-bold text-bg' : 'text-fg-faint'}`}>
                    ✓
                  </Text>
                </Pressable>
              </View>
            ))}
            <Pressable onPress={addSet} className="items-center py-2 active:opacity-70">
              <Text className="text-sm text-fg-muted">+ Add set</Text>
            </Pressable>
          </View>

          {/* Prev / Next exercise */}
          <View className="mt-1 flex-row gap-3">
            <Pressable
              onPress={() => {
                hapticSelect();
                setExIdx((i) => Math.max(0, i - 1));
              }}
              disabled={exIdx === 0}
              className="flex-1 items-center rounded-2xl border border-border py-3 active:opacity-80 disabled:opacity-30"
            >
              <Text className="font-medium text-fg-muted">‹ Previous</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                hapticSelect();
                setExIdx((i) => Math.min(entries.length - 1, i + 1));
              }}
              disabled={exIdx === entries.length - 1}
              className="flex-1 items-center rounded-2xl border border-border py-3 active:opacity-80 disabled:opacity-30"
            >
              <Text className="font-medium text-fg-muted">Next ›</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Bottom: rest ring (between sets) or Finish */}
      <View
        className="items-center gap-2 border-t border-border bg-bg px-5 pt-4"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {rest !== null ? (
          <RestRing
            total={restTotal}
            remaining={rest}
            onAdd={() => {
              setRestTotal((t) => t + 15);
              setRest((r) => (r ?? 0) + 15);
            }}
            onSkip={() => setRest(null)}
          />
        ) : (
          <Pressable
            onPress={onFinish}
            disabled={finish.isPending || loggedSets === 0}
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(224,122,95,0.30)' }}
            className="w-full items-center rounded-2xl bg-accent py-4 active:opacity-90 disabled:opacity-40"
          >
            {finish.isPending ? (
              <ActivityIndicator color="#171210" />
            ) : (
              <Text className="font-semibold text-base text-bg">
                Finish workout{loggedSets > 0 ? ` · ${loggedSets} sets` : ''}
              </Text>
            )}
          </Pressable>
        )}
      </View>

      <NumberModal
        visible={modal !== null}
        title={modal?.title ?? ''}
        decimal={modal?.decimal}
        initial={modal?.initial}
        onSubmit={(n) => modal?.onSubmit(n)}
        onClose={() => setModal(null)}
      />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center gap-0.5">
      <Text className="text-2xl font-bold text-fg" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text className="text-xs text-fg-faint">{label}</Text>
    </View>
  );
}
