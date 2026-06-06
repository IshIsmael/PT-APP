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
      onError: (e) => Alert.alert('Could not generate', e instanceof Error ? e.message : 'Try again.'),
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
          <Text className="text-fg text-3xl font-bold">Nutrition</Text>
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
            <Text className="text-fg text-lg font-semibold">No meal plan yet</Text>
            <Text className="text-fg-muted text-sm">
              Generate meals that hit your calorie + macro targets, respecting your diet and allergens.
            </Text>
            <Pressable
              onPress={onGenerate}
              disabled={generate.isPending}
              className="bg-accent rounded-2xl py-4 items-center active:opacity-80"
            >
              {generate.isPending ? (
                <ActivityIndicator color="#0B0B0F" />
              ) : (
                <Text className="text-bg font-semibold text-base">Generate meal plan</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <>
            {dayTotal && (
              <View className="bg-bg-elevated border border-border rounded-3xl p-5">
                <Text className="text-fg-faint text-xs uppercase tracking-wide mb-2">Daily total</Text>
                <View className="flex-row justify-between">
                  <Text className="text-fg text-base font-bold">{dayTotal.kcal} kcal</Text>
                  <Text className="text-macro-protein text-sm">{dayTotal.protein}p</Text>
                  <Text className="text-macro-carbs text-sm">{dayTotal.carbs}c</Text>
                  <Text className="text-macro-fat text-sm">{dayTotal.fat}f</Text>
                </View>
              </View>
            )}
            {plan.meals.map((m) => (
              <View key={m.id} className="bg-bg-elevated border border-border rounded-3xl p-5 gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-fg-faint text-xs uppercase tracking-wide">
                    {SLOT_LABEL[m.slot] ?? m.slot}
                  </Text>
                  <Text className="text-fg-muted text-xs">
                    {m.kcal} kcal · {m.protein}p {m.carbs}c {m.fat}f
                  </Text>
                </View>
                {m.items.map((it) => (
                  <View key={it.id} className="flex-row justify-between">
                    <Text className="text-fg text-sm flex-1 pr-2">{it.name}</Text>
                    <Text className="text-fg-faint text-sm">{it.grams}g</Text>
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
