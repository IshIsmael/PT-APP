import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth';
import { useActiveTrainingPlan, useGenerateTrainingPlan } from '../../src/lib/plans';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Plan() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: plan, isLoading } = useActiveTrainingPlan(userId);
  const generate = useGenerateTrainingPlan(userId);

  function onGenerate() {
    generate.mutate(undefined, {
      onError: (e) =>
        Alert.alert('Could not generate', e instanceof Error ? e.message : 'Try again.'),
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="p-5 gap-4">
        <View className="flex-row items-end justify-between">
          <Text className="text-3xl font-bold text-fg">Plan</Text>
          {plan && (
            <Pressable onPress={onGenerate} disabled={generate.isPending} hitSlop={8}>
              <Text className="font-medium text-sm text-accent">
                {generate.isPending ? 'Regenerating…' : 'Regenerate'}
              </Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator color="#E07A5F" className="mt-8" />
        ) : !plan ? (
          <View className="mt-4 gap-4 rounded-3xl border border-border bg-bg-elevated p-6">
            <Text className="font-semibold text-lg text-fg">No training plan yet</Text>
            <Text className="text-sm text-fg-muted">
              Generate a science-based split tailored to your goal, training days, and equipment.
            </Text>
            <Pressable
              onPress={onGenerate}
              disabled={generate.isPending}
              className="items-center rounded-2xl bg-accent py-4 active:opacity-80"
            >
              {generate.isPending ? (
                <ActivityIndicator color="#171210" />
              ) : (
                <Text className="font-semibold text-base text-bg">Generate smart plan</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <>
            <Text className="-mt-2 text-sm text-fg-muted">{plan.name}</Text>
            {plan.workouts.map((w) => (
              <View
                key={w.id}
                className="gap-3 rounded-3xl border border-border bg-bg-elevated p-5"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-lg text-fg">{w.name}</Text>
                  {w.dayOfWeek !== null && (
                    <View className="rounded-full bg-bg-subtle px-3 py-1">
                      <Text className="text-xs text-fg-muted">{DAYS[w.dayOfWeek]}</Text>
                    </View>
                  )}
                </View>
                {w.exercises.map((e) => (
                  <View key={e.id} className="flex-row items-center justify-between py-1">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm text-fg">{e.name}</Text>
                      {e.restSeconds ? (
                        <Text className="text-xs text-fg-faint">{e.restSeconds}s rest</Text>
                      ) : null}
                    </View>
                    <Text className="font-medium text-sm text-accent">
                      {e.sets} × {e.repsLow}–{e.repsHigh}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
