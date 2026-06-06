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
      onError: (e) => Alert.alert('Could not generate', e instanceof Error ? e.message : 'Try again.'),
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="p-5 gap-4">
        <View className="flex-row items-end justify-between">
          <Text className="text-fg text-3xl font-bold">Plan</Text>
          {plan && (
            <Pressable onPress={onGenerate} disabled={generate.isPending} hitSlop={8}>
              <Text className="text-accent text-sm font-medium">
                {generate.isPending ? 'Regenerating…' : 'Regenerate'}
              </Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator color="#6EE7B7" className="mt-8" />
        ) : !plan ? (
          <View className="bg-bg-elevated border border-border rounded-3xl p-6 gap-4 mt-4">
            <Text className="text-fg text-lg font-semibold">No training plan yet</Text>
            <Text className="text-fg-muted text-sm">
              Generate a science-based split tailored to your goal, training days, and equipment.
            </Text>
            <Pressable
              onPress={onGenerate}
              disabled={generate.isPending}
              className="bg-accent rounded-2xl py-4 items-center active:opacity-80"
            >
              {generate.isPending ? (
                <ActivityIndicator color="#0B0B0F" />
              ) : (
                <Text className="text-bg font-semibold text-base">Generate smart plan</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <>
            <Text className="text-fg-muted text-sm -mt-2">{plan.name}</Text>
            {plan.workouts.map((w) => (
              <View key={w.id} className="bg-bg-elevated border border-border rounded-3xl p-5 gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-fg text-lg font-semibold">{w.name}</Text>
                  {w.dayOfWeek !== null && (
                    <View className="bg-bg-subtle rounded-full px-3 py-1">
                      <Text className="text-fg-muted text-xs">{DAYS[w.dayOfWeek]}</Text>
                    </View>
                  )}
                </View>
                {w.exercises.map((e) => (
                  <View key={e.id} className="flex-row items-center justify-between py-1">
                    <View className="flex-1 pr-3">
                      <Text className="text-fg text-sm">{e.name}</Text>
                      {e.restSeconds ? (
                        <Text className="text-fg-faint text-xs">{e.restSeconds}s rest</Text>
                      ) : null}
                    </View>
                    <Text className="text-accent text-sm font-medium">
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
