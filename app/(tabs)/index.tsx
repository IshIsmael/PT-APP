import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth';
import { useActiveGoal } from '../../src/lib/goals';
import { useActiveMealPlan, useActiveTrainingPlan } from '../../src/lib/plans';
import {
  useLogHabit,
  useLogMeal,
  useLogWater,
  useLogWeight,
  useTodayMealLog,
  useTodaySummary,
  type LogMealInput,
} from '../../src/lib/logging';
import { MacroRing } from '../../src/components/MacroRing';
import { NumberModal } from '../../src/components/NumberModal';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
type MealSlot = LogMealInput['slot'];

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setDate(d.getDate() - d.getDay());
  return out;
}

function MacroBar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number | null;
  color: string;
}) {
  const pct = target ? Math.min(value / target, 1) : 0;
  return (
    <View className="flex-1 gap-1">
      <View className="flex-row justify-between">
        <Text className="text-xs text-fg-muted">{label}</Text>
        <Text className="text-xs text-fg-faint">
          {Math.round(value)}
          {target ? `/${target}` : ''}
        </Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
        <View
          style={{ width: `${pct * 100}%`, backgroundColor: color }}
          className="h-full rounded-full"
        />
      </View>
    </View>
  );
}

type ModalConfig = {
  title: string;
  suffix?: string;
  decimal?: boolean;
  initial?: string;
  onSubmit: (n: number) => void;
};

export default function Home() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const { data: goal } = useActiveGoal(userId);
  const { data: summary, isLoading } = useTodaySummary(userId);
  const { data: mealPlan } = useActiveMealPlan(userId);
  const { data: trainingPlan } = useActiveTrainingPlan(userId);
  const { data: loggedMeals } = useTodayMealLog(userId);

  const logMeal = useLogMeal(userId);
  const logWater = useLogWater(userId);
  const logWeight = useLogWeight(userId);
  const logHabit = useLogHabit(userId);

  const [skipped, setSkipped] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalConfig | null>(null);

  const today = new Date();
  const weekday = today.getDay();
  const weekStart = startOfWeek(today);

  // Next un-logged planned meal (skip ones already eaten or dismissed).
  const loggedPlanIds = new Set((loggedMeals ?? []).map((m) => m.plan_meal_id).filter(Boolean));
  const nextMeal = (mealPlan?.meals ?? []).find(
    (m) => !loggedPlanIds.has(m.id) && !skipped.includes(m.id),
  );
  const todaysWorkout = trainingPlan?.workouts.find((w) => w.dayOfWeek === weekday);

  const consumed = summary ?? {
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    waterMl: 0,
    steps: null,
    sleepMinutes: null,
    weightKg: null,
  };
  const waterPct = goal?.water_ml_goal ? Math.min(consumed.waterMl / goal.water_ml_goal, 1) : 0;

  function eatMeal() {
    if (!nextMeal) return;
    logMeal.mutate({
      planMealId: nextMeal.id,
      name: nextMeal.name,
      slot: nextMeal.slot as MealSlot,
      kcal: nextMeal.kcal ?? 0,
      protein: nextMeal.protein ?? 0,
      carbs: nextMeal.carbs ?? 0,
      fat: nextMeal.fat ?? 0,
      source: 'plan_generated',
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="p-5 gap-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base text-fg-muted">
              {today.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text className="text-3xl font-bold tracking-tight text-fg">Today</Text>
          </View>
        </View>

        {/* Weekday strip */}
        <View className="flex-row justify-between">
          {DAY_LABELS.map((label, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            const isToday = i === weekday;
            return (
              <View key={i} className="items-center gap-1">
                <Text className="text-xs text-fg-faint">{label}</Text>
                <View
                  className={`h-9 w-9 items-center justify-center rounded-full ${
                    isToday ? 'bg-accent' : 'bg-bg-subtle'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${isToday ? 'text-bg' : 'text-fg-muted'}`}
                  >
                    {d.getDate()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Macro ring hero */}
        <View className="items-center gap-4 rounded-3xl border border-border bg-bg-elevated p-5">
          {isLoading ? (
            <ActivityIndicator color="#6EE7B7" className="my-16" />
          ) : (
            <>
              <MacroRing
                consumedKcal={consumed.kcal}
                targetKcal={goal?.target_kcal ?? 2000}
                protein={consumed.protein}
                carbs={consumed.carbs}
                fat={consumed.fat}
              />
              <View className="w-full flex-row gap-3">
                <MacroBar
                  label="Protein"
                  value={consumed.protein}
                  target={goal?.protein_g ?? null}
                  color="#60A5FA"
                />
                <MacroBar
                  label="Carbs"
                  value={consumed.carbs}
                  target={goal?.carbs_g ?? null}
                  color="#FBBF24"
                />
                <MacroBar
                  label="Fat"
                  value={consumed.fat}
                  target={goal?.fat_g ?? null}
                  color="#F472B6"
                />
              </View>
            </>
          )}
        </View>

        {/* Today's session */}
        <View className="gap-2 rounded-3xl border border-border bg-bg-elevated p-5">
          <Text className="text-xs uppercase tracking-wide text-fg-faint">Today’s session</Text>
          {todaysWorkout ? (
            <>
              <Text className="text-lg font-semibold text-fg">{todaysWorkout.name}</Text>
              <Text className="text-sm text-fg-muted">
                {todaysWorkout.exercises.length} exercises ·{' '}
                {todaysWorkout.exercises
                  .slice(0, 3)
                  .map((e) => e.name)
                  .join(', ')}
                {todaysWorkout.exercises.length > 3 ? '…' : ''}
              </Text>
            </>
          ) : (
            <Text className="text-sm text-fg-muted">
              Rest day{trainingPlan ? '' : ' — generate a plan in the Plan tab'}.
            </Text>
          )}
        </View>

        {/* Today's meals */}
        <View className="gap-3 rounded-3xl border border-border bg-bg-elevated p-5">
          <Text className="text-xs uppercase tracking-wide text-fg-faint">Next meal</Text>
          {!mealPlan ? (
            <Text className="text-sm text-fg-muted">
              Generate a meal plan in the Nutrition tab.
            </Text>
          ) : nextMeal ? (
            <>
              <Text className="text-base font-semibold text-fg">{nextMeal.name}</Text>
              <Text className="text-sm text-fg-muted">
                {nextMeal.kcal} kcal · {nextMeal.protein}p {nextMeal.carbs}c {nextMeal.fat}f
              </Text>
              <View className="mt-1 flex-row gap-3">
                <Pressable
                  onPress={eatMeal}
                  disabled={logMeal.isPending}
                  className="flex-1 items-center rounded-2xl bg-accent py-3 active:opacity-80"
                >
                  <Text className="font-semibold text-bg">Ate it ✓</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSkipped((s) => [...s, nextMeal.id])}
                  className="flex-1 items-center rounded-2xl border border-border py-3 active:opacity-80"
                >
                  <Text className="font-medium text-fg-muted">Skip</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text className="text-sm text-fg-muted">All planned meals done for today 🎉</Text>
          )}
          <Pressable
            onPress={() =>
              setModal({
                title: 'Quick add a snack (kcal)',
                suffix: 'kcal',
                onSubmit: (kcal) =>
                  logMeal.mutate({
                    name: 'Snack',
                    slot: 'snack',
                    isSnack: true,
                    kcal,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                  }),
              })
            }
            className="items-center rounded-2xl border border-border py-2.5 active:opacity-80"
          >
            <Text className="text-sm text-fg-muted">+ Quick add snack</Text>
          </Pressable>
        </View>

        {/* Water bottle */}
        <View className="flex-row gap-4 rounded-3xl border border-border bg-bg-elevated p-5">
          <View className="h-24 w-12 justify-end overflow-hidden rounded-xl border border-border bg-bg-subtle">
            <View style={{ height: `${waterPct * 100}%` }} className="w-full bg-macro-protein/70" />
          </View>
          <View className="flex-1 justify-center gap-2">
            <Text className="text-fg">
              <Text className="text-xl font-bold">{(consumed.waterMl / 1000).toFixed(2)}</Text>
              <Text className="text-fg-faint">
                {' '}
                / {goal?.water_ml_goal ? (goal.water_ml_goal / 1000).toFixed(1) : '—'} L water
              </Text>
            </Text>
            <View className="flex-row gap-2">
              {[250, 500].map((ml) => (
                <Pressable
                  key={ml}
                  onPress={() => logWater.mutate({ amountMl: ml })}
                  className="rounded-full border border-border bg-bg-subtle px-4 py-2 active:opacity-80"
                >
                  <Text className="text-sm text-fg-muted">+{ml} ml</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Habit chips */}
        <View className="flex-row gap-3">
          <HabitChip
            label="Steps"
            value={consumed.steps !== null ? `${consumed.steps}` : 'Add'}
            onPress={() =>
              setModal({
                title: 'Steps today',
                suffix: 'steps',
                initial: consumed.steps ? `${consumed.steps}` : '',
                onSubmit: (v) => logHabit.mutate({ habitType: 'steps', value: v }),
              })
            }
          />
          <HabitChip
            label="Sleep"
            value={
              consumed.sleepMinutes !== null ? `${(consumed.sleepMinutes / 60).toFixed(1)}h` : 'Add'
            }
            onPress={() =>
              setModal({
                title: 'Sleep last night',
                suffix: 'hours',
                decimal: true,
                initial: consumed.sleepMinutes ? `${(consumed.sleepMinutes / 60).toFixed(1)}` : '',
                onSubmit: (v) => logHabit.mutate({ habitType: 'sleep', value: v }),
              })
            }
          />
          <HabitChip
            label="Weight"
            value={consumed.weightKg !== null ? `${consumed.weightKg}kg` : 'Add'}
            onPress={() =>
              setModal({
                title: 'Body weight',
                suffix: 'kg',
                decimal: true,
                initial: consumed.weightKg ? `${consumed.weightKg}` : '',
                onSubmit: (v) => logWeight.mutate(v),
              })
            }
          />
        </View>
      </ScrollView>

      <NumberModal
        visible={modal !== null}
        title={modal?.title ?? ''}
        suffix={modal?.suffix}
        decimal={modal?.decimal}
        initial={modal?.initial}
        onSubmit={(n) => modal?.onSubmit(n)}
        onClose={() => setModal(null)}
      />
    </SafeAreaView>
  );
}

function HabitChip({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 gap-0.5 rounded-2xl border border-border bg-bg-elevated p-4 active:opacity-80"
    >
      <Text className="text-xs text-fg-faint">{label}</Text>
      <Text className="text-base font-semibold text-fg">{value}</Text>
    </Pressable>
  );
}
