import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth';
import { useActiveMealPlan, useGenerateMealPlan } from '../../src/lib/plans';

const SLOT_LABEL: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export default function Nutrition() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: plan, isLoading } = useActiveMealPlan(userId);
  const generate = useGenerateMealPlan(userId);

  function onGenerate() {
    generate.mutate(undefined, {
      onError: (e) =>
        Alert.alert('Could not generate', e instanceof Error ? e.message : 'Try again.'),
    });
  }

  const dayTotal = plan?.meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + (m.kcal ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="p-5 gap-4">
        <View className="flex-row items-end justify-between">
          <Text className="text-3xl font-bold text-fg">Nutrition</Text>
          {plan && (
            <Pressable onPress={onGenerate} disabled={generate.isPending} hitSlop={8}>
              <Text className="text-sm font-medium text-accent">
                {generate.isPending ? 'Regenerating…' : 'Regenerate'}
              </Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator color="#6EE7B7" className="mt-8" />
        ) : !plan ? (
          <View className="mt-4 gap-4 rounded-3xl border border-border bg-bg-elevated p-6">
            <Text className="text-lg font-semibold text-fg">No meal plan yet</Text>
            <Text className="text-sm text-fg-muted">
              Generate meals that hit your calorie + macro targets, respecting your diet and
              allergens.
            </Text>
            <Pressable
              onPress={onGenerate}
              disabled={generate.isPending}
              className="items-center rounded-2xl bg-accent py-4 active:opacity-80"
            >
              {generate.isPending ? (
                <ActivityIndicator color="#0B0B0F" />
              ) : (
                <Text className="text-base font-semibold text-bg">Generate meal plan</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <>
            {dayTotal && (
              <View className="rounded-3xl border border-border bg-bg-elevated p-5">
                <Text className="mb-2 text-xs uppercase tracking-wide text-fg-faint">
                  Daily total
                </Text>
                <View className="flex-row justify-between">
                  <Text className="text-base font-bold text-fg">{dayTotal.kcal} kcal</Text>
                  <Text className="text-sm text-macro-protein">{dayTotal.protein}p</Text>
                  <Text className="text-sm text-macro-carbs">{dayTotal.carbs}c</Text>
                  <Text className="text-sm text-macro-fat">{dayTotal.fat}f</Text>
                </View>
              </View>
            )}
            {plan.meals.map((m) => (
              <View
                key={m.id}
                className="gap-2 rounded-3xl border border-border bg-bg-elevated p-5"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs uppercase tracking-wide text-fg-faint">
                    {SLOT_LABEL[m.slot] ?? m.slot}
                  </Text>
                  <Text className="text-xs text-fg-muted">
                    {m.kcal} kcal · {m.protein}p {m.carbs}c {m.fat}f
                  </Text>
                </View>
                {m.items.map((it) => (
                  <View key={it.id} className="flex-row justify-between">
                    <Text className="flex-1 pr-2 text-sm text-fg">{it.name}</Text>
                    <Text className="text-sm text-fg-faint">{it.grams}g</Text>
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
