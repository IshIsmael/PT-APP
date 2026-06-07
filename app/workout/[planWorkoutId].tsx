import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { RestRing } from '../../src/components/RestRing';
import { NumberModal } from '../../src/components/NumberModal';
import { Sprout } from '../../src/components/Sprout';
import { ExerciseRail } from '../../src/components/ExerciseRail';

const DISPLAY_BOLD = 'Fraunces_700Bold';
type SetRow = { weight: number; reps: number; done: boolean };
type Entry = { ex: SessionExercise; sets: SetRow[] };
type ModalCfg = { title: string; decimal: boolean; initial: string; onSubmit: (n: number) => void };

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

export default function WorkoutScreen() {
  const { planWorkoutId } = useLocalSearchParams<{ planWorkoutId: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: workout, isLoading } = usePlanWorkout(planWorkoutId);
  const exerciseIds = workout?.exercises.map((e) => e.exerciseId) ?? [];
  const { data: lastPerf, isLoading: perfLoading } = useLastPerformance(userId, exerciseIds);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      {isLoading || !workout || perfLoading ? (
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
  const [now, setNow] = useState(() => Date.now());
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
  const [nextUp, setNextUp] = useState('');
  const [modal, setModal] = useState<ModalCfg | null>(null);
  const [summary, setSummary] = useState<{ volume: number; sets: number; minutes: number } | null>(
    null,
  );

  // Live session clock.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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

  // Cross-fade the hero when the exercise changes.
  const [fade] = useState(() => new Animated.Value(1));
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [exIdx, fade]);

  const entry = entries[exIdx];
  const curSetIdx = entry.sets.findIndex((s) => !s.done);
  const totalSets = entries.reduce((a, e) => a + e.sets.length, 0);
  const loggedSets = entries.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);
  const volume = Math.round(
    entries.reduce(
      (a, e) => a + e.sets.filter((s) => s.done).reduce((b, s) => b + s.weight * s.reps, 0),
      0,
    ),
  );
  const progress = totalSets ? loggedSets / totalSets : 0;
  const last = lastPerf[entry.ex.exerciseId];
  const elapsedSec = Math.floor((now - new Date(startedAt).getTime()) / 1000);
  const elapsed = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`;

  function patchCur(patch: Partial<SetRow>) {
    if (curSetIdx < 0) return;
    setEntries((prev) =>
      prev.map((e, i) =>
        i !== exIdx
          ? e
          : { ...e, sets: e.sets.map((s, j) => (j === curSetIdx ? { ...s, ...patch } : s)) },
      ),
    );
  }

  function computeNextUp(loggedIdx: number) {
    const e = entries[exIdx];
    const next = e.sets.findIndex((s, i) => i > loggedIdx && !s.done);
    if (next >= 0)
      return `Set ${next + 1} · ${fmt(e.sets[loggedIdx].weight)}kg × ${e.sets[loggedIdx].reps}`;
    const nextEx = entries[exIdx + 1];
    return nextEx ? `${nextEx.ex.name}` : 'Last set — finish strong';
  }

  function logSet() {
    if (curSetIdx < 0) return;
    hapticSuccess();
    const cur = entry.sets[curSetIdx];
    setEntries((prev) =>
      prev.map((e, i) =>
        i !== exIdx
          ? e
          : {
              ...e,
              // Mark current done; autofill the same numbers forward to undone sets.
              sets: e.sets.map((s, j) => {
                if (j === curSetIdx) return { ...s, done: true };
                if (j > curSetIdx && !s.done) return { ...s, weight: cur.weight, reps: cur.reps };
                return s;
              }),
            },
      ),
    );
    const r = entry.ex.restSeconds ?? 0;
    if (r > 0) {
      setNextUp(computeNextUp(curSetIdx));
      setRestTotal(r);
      setRest(r);
    }
  }

  function undoSet(i: number) {
    hapticSelect();
    setEntries((prev) =>
      prev.map((e, ei) =>
        ei !== exIdx
          ? e
          : { ...e, sets: e.sets.map((s, si) => (si === i ? { ...s, done: false } : s)) },
      ),
    );
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

  function goExercise(i: number) {
    hapticSelect();
    setExIdx(Math.min(Math.max(i, 0), entries.length - 1));
  }

  function onFinish() {
    const exercises: FinishedExercise[] = entries.map((e) => ({
      exerciseId: e.ex.exerciseId,
      planWorkoutExerciseId: e.ex.id,
      sets: e.sets
        .filter((s) => s.done && s.reps > 0)
        .map((s) => ({ weightKg: s.weight || null, reps: s.reps })),
    }));
    const minutes = Math.max(1, Math.round(elapsedSec / 60));
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

  // ---------- Completion ----------
  if (summary) {
    return (
      <View className="flex-1 items-center justify-center gap-5 px-8">
        <Sprout streak={12} size={132} />
        <Text className="text-4xl text-fg" style={{ fontFamily: DISPLAY_BOLD }}>
          Nice work
        </Text>
        <Text className="text-center text-base text-fg-muted">{workout.name} — in the books.</Text>
        <View className="w-full flex-row justify-around rounded-3xl border border-border bg-bg-elevated py-5">
          <Stat value={`${summary.sets}`} label="sets" />
          <Stat value={`${summary.volume}`} label="kg lifted" />
          <Stat value={`${summary.minutes}`} label="min" />
        </View>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            { borderCurve: 'continuous', boxShadow: '0 10px 30px rgba(224,122,95,0.35)' },
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
          className="w-full items-center rounded-2xl bg-accent py-4"
        >
          <Text className="font-semibold text-base text-bg">Done</Text>
        </Pressable>
      </View>
    );
  }

  const allDone = curSetIdx < 0;

  return (
    <View className="flex-1">
      {/* Live session header */}
      <View className="gap-3 px-5 py-3">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text className="text-base text-fg-muted">Close</Text>
          </Pressable>
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-accent" />
            <Text
              className="font-semibold text-base text-fg"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {elapsed}
            </Text>
          </View>
          <Text className="text-xs text-fg-faint" style={{ fontVariant: ['tabular-nums'] }}>
            {volume} kg
          </Text>
        </View>
        <View className="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
          <View className="h-full rounded-full bg-sage" style={{ width: `${progress * 100}%` }} />
        </View>
      </View>

      {/* Exercise rail */}
      <View className="pb-2">
        <ExerciseRail
          items={entries.map((e) => ({
            id: e.ex.id,
            name: e.ex.name,
            done: e.sets.filter((s) => s.done).length,
            total: e.sets.length,
          }))}
          activeIndex={exIdx}
          onSelect={goExercise}
        />
      </View>

      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ScrollView contentContainerClassName="px-5 pb-6 gap-5" keyboardShouldPersistTaps="handled">
          {/* Exercise heading */}
          <View className="gap-1 pt-2">
            <Text className="text-xs uppercase tracking-wide text-fg-faint">
              Exercise {exIdx + 1} of {entries.length}
            </Text>
            <Text className="text-3xl text-fg" style={{ fontFamily: DISPLAY_BOLD }}>
              {entry.ex.name}
            </Text>
            <Text className="text-sm text-fg-muted">
              Target {entry.ex.targetSets} × {entry.ex.repsLow}–{entry.ex.repsHigh}
              {last?.weightKg != null
                ? `   ·   Last ${fmt(last.weightKg)}kg × ${last.reps ?? '—'}`
                : ''}
            </Text>
          </View>

          {/* Set pills */}
          <View className="flex-row flex-wrap gap-2">
            {entry.sets.map((s, i) => {
              const state = s.done ? 'done' : i === curSetIdx ? 'current' : 'upcoming';
              return (
                <Pressable
                  key={i}
                  onPress={s.done ? () => undoSet(i) : undefined}
                  style={{ borderCurve: 'continuous' }}
                  className={`rounded-2xl border px-3 py-2 ${
                    state === 'done'
                      ? 'border-sage bg-sage/15'
                      : state === 'current'
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-bg-elevated'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      state === 'done'
                        ? 'text-sage'
                        : state === 'current'
                          ? 'font-semibold text-accent'
                          : 'text-fg-faint'
                    }`}
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {s.done ? `${fmt(s.weight)}×${s.reps}` : `Set ${i + 1}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Current-set hero */}
          {allDone ? (
            <View className="items-center gap-4 rounded-3xl border border-sage/40 bg-bg-elevated p-8">
              <Sprout streak={7} size={72} />
              <Text className="text-2xl text-sage" style={{ fontFamily: DISPLAY_BOLD }}>
                All sets done
              </Text>
              {exIdx < entries.length - 1 ? (
                <Pressable
                  onPress={() => goExercise(exIdx + 1)}
                  style={{ borderCurve: 'continuous' }}
                  className="w-full items-center rounded-2xl bg-accent py-4 active:opacity-90"
                >
                  <Text className="font-semibold text-base text-bg">Next exercise ›</Text>
                </Pressable>
              ) : (
                <Text className="text-sm text-fg-muted">Finish your session below.</Text>
              )}
            </View>
          ) : (
            <View
              style={{ borderCurve: 'continuous', boxShadow: '0 12px 32px rgba(0,0,0,0.30)' }}
              className="gap-5 rounded-3xl border border-border bg-bg-elevated p-6"
            >
              <Text className="text-center text-xs uppercase tracking-widest text-fg-faint">
                Set {curSetIdx + 1} of {entry.sets.length}
              </Text>
              <View className="flex-row items-center justify-center gap-4">
                <BigField
                  value={entry.sets[curSetIdx].weight}
                  unit="kg"
                  step={2.5}
                  onChange={(v) => patchCur({ weight: v })}
                  onPressValue={() =>
                    setModal({
                      title: 'Weight',
                      decimal: true,
                      initial: `${entry.sets[curSetIdx].weight}`,
                      onSubmit: (n) => patchCur({ weight: n }),
                    })
                  }
                />
                <Text className="px-1 text-3xl text-fg-faint">×</Text>
                <BigField
                  value={entry.sets[curSetIdx].reps}
                  unit="reps"
                  step={1}
                  onChange={(v) => patchCur({ reps: Math.max(0, Math.round(v)) })}
                  onPressValue={() =>
                    setModal({
                      title: 'Reps',
                      decimal: false,
                      initial: `${entry.sets[curSetIdx].reps}`,
                      onSubmit: (n) => patchCur({ reps: Math.round(n) }),
                    })
                  }
                />
              </View>
              <Pressable
                onPress={logSet}
                style={({ pressed }) => [
                  { borderCurve: 'continuous', boxShadow: '0 10px 30px rgba(224,122,95,0.40)' },
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
                className="items-center rounded-2xl bg-accent py-4"
              >
                <Text className="font-semibold text-lg text-bg">Log set</Text>
              </Pressable>
            </View>
          )}

          <Pressable onPress={addSet} className="items-center py-1 active:opacity-70">
            <Text className="text-sm text-fg-muted">+ Add set</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>

      {/* Finish */}
      <View
        className="border-t border-border bg-bg px-5 pt-4"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Pressable
          onPress={onFinish}
          disabled={finish.isPending || loggedSets === 0}
          style={({ pressed }) => [
            { borderCurve: 'continuous' },
            loggedSets > 0 && { boxShadow: '0 8px 24px rgba(224,122,95,0.25)' },
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          className="items-center rounded-2xl bg-accent py-4 disabled:opacity-40"
        >
          {finish.isPending ? (
            <ActivityIndicator color="#171210" />
          ) : (
            <Text className="font-semibold text-base text-bg">
              Finish{loggedSets > 0 ? ` · ${loggedSets} sets` : ''}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Rest takeover */}
      {rest !== null && (
        <RestTakeover
          total={restTotal}
          remaining={rest}
          nextLabel={nextUp}
          onAdd={() => {
            setRestTotal((t) => t + 15);
            setRest((r) => (r ?? 0) + 15);
          }}
          onSkip={() => {
            hapticImpact();
            setRest(null);
          }}
        />
      )}

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

function BigField({
  value,
  unit,
  step,
  onChange,
  onPressValue,
}: {
  value: number;
  unit: string;
  step: number;
  onChange: (v: number) => void;
  onPressValue: () => void;
}) {
  const round = (n: number) => Math.round(n * 100) / 100;
  return (
    <View className="items-center gap-2">
      <Pressable onPress={onPressValue} className="items-center">
        <Text
          className="text-6xl text-fg"
          style={{ fontFamily: DISPLAY_BOLD, fontVariant: ['tabular-nums'] }}
        >
          {fmt(value)}
        </Text>
        <Text className="text-xs uppercase tracking-widest text-fg-faint">{unit}</Text>
      </Pressable>
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => {
            hapticSelect();
            onChange(Math.max(0, round(value - step)));
          }}
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-subtle active:opacity-70"
        >
          <Text className="text-2xl text-fg-muted">−</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            hapticSelect();
            onChange(round(value + step));
          }}
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-subtle active:opacity-70"
        >
          <Text className="text-2xl text-fg-muted">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RestTakeover({
  total,
  remaining,
  nextLabel,
  onAdd,
  onSkip,
}: {
  total: number;
  remaining: number;
  nextLabel: string;
  onAdd: () => void;
  onSkip: () => void;
}) {
  const [ty] = useState(() => new Animated.Value(40));
  const [op] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.parallel([
      Animated.timing(ty, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(op, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [ty, op]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: 'rgba(23,18,16,0.97)',
          opacity: op,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        },
      ]}
    >
      <Animated.View style={{ transform: [{ translateY: ty }], alignItems: 'center', gap: 28 }}>
        <Text className="text-xs uppercase tracking-[4px] text-fg-faint">Rest</Text>
        <RestRing total={total} remaining={remaining} onAdd={onAdd} onSkip={onSkip} size={200} />
        <View className="items-center gap-1">
          <Text className="text-xs uppercase tracking-wide text-fg-faint">Up next</Text>
          <Text className="font-semibold text-base text-fg">{nextLabel}</Text>
        </View>
      </Animated.View>
    </Animated.View>
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
