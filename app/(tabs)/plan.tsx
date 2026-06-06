import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import { useActiveTrainingPlan, useGenerateTrainingPlan } from '../../src/lib/plans';
import { Sprout } from '../../src/components/Sprout';
import { hapticImpact, hapticSuccess } from '../../src/lib/haptics';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DISPLAY_BOLD = 'Fraunces_700Bold';

export default function Plan() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: plan, isLoading } = useActiveTrainingPlan(userId);
  const generate = useGenerateTrainingPlan(userId);

  function onGenerate() {
    generate.mutate(undefined, {
      onSuccess: () => hapticSuccess(),
      onError: (e) =>
        Alert.alert('Could not generate', e instanceof Error ? e.message : 'Try again.'),
    });
  }

  function start(workoutId: string) {
    hapticImpact();
    router.push(`/workout/${workoutId}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView
        contentContainerClassName="p-5 gap-4"
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
      >
        <View className="flex-row items-end justify-between">
          <Text className="text-4xl text-fg" style={{ fontFamily: DISPLAY_BOLD }}>
            Plan
          </Text>
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
          <View className="mt-2 items-center gap-3 rounded-3xl border border-border bg-bg-elevated p-6">
            <Sprout streak={4} size={88} />
            <Text className="font-semibold text-lg text-fg">Let’s plant your plan</Text>
            <Text className="text-center text-sm text-fg-muted">
              A science-based split tailored to your goal, days, and equipment — yours to tweak.
            </Text>
            <Pressable
              onPress={onGenerate}
              disabled={generate.isPending}
              style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(224,122,95,0.30)' }}
              className="w-full items-center rounded-2xl bg-accent py-4 active:opacity-90"
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
            <Text className="-mt-2 text-sm text-fg-muted">
              {plan.name} · tap Start to train any day
            </Text>
            {plan.workouts.map((w) => (
              <View
                key={w.id}
                style={{ borderCurve: 'continuous' }}
                className="gap-3 rounded-3xl border border-border bg-bg-elevated p-5"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 pr-2 font-semibold text-lg text-fg">{w.name}</Text>
                  <View className="flex-row items-center gap-2">
                    {w.dayOfWeek !== null && (
                      <View className="rounded-full bg-bg-subtle px-3 py-1">
                        <Text className="text-xs text-fg-muted">{DAYS[w.dayOfWeek]}</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => start(w.id)}
                      style={{ borderCurve: 'continuous' }}
                      className="rounded-full bg-accent px-4 py-1.5 active:opacity-90"
                    >
                      <Text className="font-semibold text-xs text-bg">Start</Text>
                    </Pressable>
                  </View>
                </View>
                {w.exercises.map((e) => (
                  <View key={e.id} className="flex-row items-center justify-between py-1">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm text-fg">{e.name}</Text>
                      {e.restSeconds ? (
                        <Text className="text-xs text-fg-faint">{e.restSeconds}s rest</Text>
                      ) : null}
                    </View>
                    <Text
                      className="font-medium text-sm text-accent"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
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
