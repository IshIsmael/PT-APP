import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import {
  useFinishWorkout,
  usePlanWorkout,
  type FinishedExercise,
  type SessionExercise,
} from '../../src/lib/workout';
import { hapticSelect, hapticSuccess } from '../../src/lib/haptics';

type SetEntry = { weight: string; reps: string; done: boolean };

export default function WorkoutScreen() {
  const { planWorkoutId } = useLocalSearchParams<{ planWorkoutId: string }>();
  const { session } = useAuth();
  const { data: workout, isLoading } = usePlanWorkout(planWorkoutId);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      {isLoading || !workout ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E07A5F" />
        </View>
      ) : (
        <WorkoutRunner workout={workout} userId={session?.user.id} />
      )}
    </SafeAreaView>
  );
}

function WorkoutRunner({
  workout,
  userId,
}: {
  workout: { id: string; name: string; exercises: SessionExercise[] };
  userId?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const finish = useFinishWorkout(userId);

  const [startedAt] = useState(() => new Date().toISOString());
  const [entries, setEntries] = useState<{ ex: SessionExercise; sets: SetEntry[] }[]>(() =>
    workout.exercises.map((ex) => ({
      ex,
      sets: Array.from({ length: ex.targetSets ?? 3 }, () => ({
        weight: '',
        reps: '',
        done: false,
      })),
    })),
  );
  const [rest, setRest] = useState<number | null>(null);

  // Rest countdown — buzzes when rest is over so you can keep eyes off the screen.
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

  function updateSet(exIdx: number, setIdx: number, patch: Partial<SetEntry>) {
    setEntries((prev) =>
      prev.map((e, i) =>
        i !== exIdx
          ? e
          : { ...e, sets: e.sets.map((s, j) => (j !== setIdx ? s : { ...s, ...patch })) },
      ),
    );
  }

  function toggleDone(exIdx: number, setIdx: number) {
    const entry = entries[exIdx];
    const wasDone = entry.sets[setIdx].done;
    updateSet(exIdx, setIdx, { done: !wasDone });
    if (!wasDone) {
      hapticSelect();
      if (entry.ex.restSeconds) setRest(entry.ex.restSeconds);
    }
  }

  // A set "counts" only if it's marked done AND has positive reps — matching the
  // server-side filter, so the enabled-Finish gate and the saved data agree.
  const isLogged = (s: SetEntry) => s.done && parseInt(s.reps, 10) > 0;
  const doneCount = entries.reduce((a, e) => a + e.sets.filter(isLogged).length, 0);

  function onFinish() {
    const exercises: FinishedExercise[] = entries.map((e) => ({
      exerciseId: e.ex.exerciseId,
      planWorkoutExerciseId: e.ex.id,
      sets: e.sets.filter(isLogged).map((s) => ({
        weightKg: s.weight ? parseFloat(s.weight.replace(',', '.')) : null,
        reps: parseInt(s.reps, 10),
      })),
    }));
    finish.mutate(
      { planWorkoutId: workout.id, name: workout.name, mode: 'standard', startedAt, exercises },
      {
        onSuccess: () => {
          hapticSuccess();
          router.back();
        },
        onError: (e) =>
          Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.'),
      },
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-fg-muted">Close</Text>
        </Pressable>
        <Text className="font-semibold text-base text-fg">{workout.name}</Text>
        <Text className="text-xs text-fg-faint" style={{ fontVariant: ['tabular-nums'] }}>
          {doneCount} sets
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6 gap-4"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {entries.map((entry, exIdx) => (
          <View
            key={entry.ex.id}
            className="gap-2 rounded-3xl border border-border bg-bg-elevated p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-base text-fg">{entry.ex.name}</Text>
              <Text className="text-xs text-fg-faint">
                {entry.ex.repsLow}–{entry.ex.repsHigh} reps
              </Text>
            </View>
            {entry.sets.map((s, setIdx) => (
              <View key={setIdx} className="flex-row items-center gap-2">
                <Text className="w-6 text-sm text-fg-faint">{setIdx + 1}</Text>
                <TextInput
                  value={s.weight}
                  onChangeText={(t) => updateSet(exIdx, setIdx, { weight: t })}
                  placeholder="kg"
                  placeholderTextColor="#8C7B6C"
                  keyboardType="decimal-pad"
                  className="flex-1 rounded-xl border border-border bg-bg-subtle px-3 py-2.5 text-center text-fg"
                />
                <Text className="text-fg-faint">×</Text>
                <TextInput
                  value={s.reps}
                  onChangeText={(t) => updateSet(exIdx, setIdx, { reps: t.replace(/[^0-9]/g, '') })}
                  placeholder="reps"
                  placeholderTextColor="#8C7B6C"
                  keyboardType="number-pad"
                  className="flex-1 rounded-xl border border-border bg-bg-subtle px-3 py-2.5 text-center text-fg"
                />
                <Pressable
                  onPress={() => toggleDone(exIdx, setIdx)}
                  className={`h-9 w-9 items-center justify-center rounded-xl ${
                    s.done ? 'bg-accent' : 'border border-border bg-bg-subtle'
                  }`}
                >
                  <Text className={s.done ? 'font-bold text-bg' : 'text-fg-faint'}>✓</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() =>
                setEntries((prev) =>
                  prev.map((e, i) =>
                    i !== exIdx
                      ? e
                      : { ...e, sets: [...e.sets, { weight: '', reps: '', done: false }] },
                  ),
                )
              }
              className="items-center py-1.5"
            >
              <Text className="text-sm text-fg-muted">+ Add set</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Rest timer + finish — in normal flow so the keyboard lifts it */}
      <View
        className="gap-2 border-t border-border bg-bg px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {rest !== null && (
          <View className="flex-row items-center justify-between rounded-2xl bg-bg-subtle px-4 py-2">
            <Text className="text-sm text-fg-muted">Rest</Text>
            <Text className="text-lg font-bold text-accent">
              {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}
            </Text>
            <Pressable onPress={() => setRest(null)} hitSlop={8}>
              <Text className="text-sm text-fg-faint">Skip</Text>
            </Pressable>
          </View>
        )}
        <Pressable
          onPress={onFinish}
          disabled={finish.isPending || doneCount === 0}
          className="items-center rounded-2xl bg-accent py-4 active:opacity-80 disabled:opacity-40"
        >
          {finish.isPending ? (
            <ActivityIndicator color="#171210" />
          ) : (
            <Text className="font-semibold text-base text-bg">Finish workout</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
