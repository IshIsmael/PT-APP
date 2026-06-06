import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';
import { useActiveGoal } from '../../src/lib/goals';

const GOAL_LABEL: Record<string, string> = {
  lose_fat: 'Lose fat',
  build_muscle: 'Build muscle',
  maintain: 'Maintain',
  recomp: 'Recomposition',
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-0.5 rounded-2xl bg-bg-subtle p-3">
      <Text className="text-lg font-bold text-fg">{value}</Text>
      <Text className="text-xs text-fg-faint">{label}</Text>
    </View>
  );
}

export default function Profile() {
  const { session } = useAuth();
  const { data: goal, isLoading } = useActiveGoal(session?.user.id);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Sign out failed', error.message);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-1 gap-4 p-5">
        <Text className="text-3xl font-bold text-fg">Profile</Text>

        <View className="gap-1 rounded-3xl border border-border bg-bg-elevated p-5">
          <Text className="text-xs uppercase tracking-wide text-fg-faint">Signed in as</Text>
          <Text className="text-base text-fg">{session?.user.email ?? '—'}</Text>
        </View>

        <View className="gap-3 rounded-3xl border border-border bg-bg-elevated p-5">
          <Text className="text-lg font-semibold text-fg">Your daily targets</Text>
          {isLoading ? (
            <ActivityIndicator color="#6EE7B7" />
          ) : goal ? (
            <>
              <Text className="text-sm text-fg-muted">
                {GOAL_LABEL[goal.goal_type] ?? goal.goal_type} · {goal.training_days_per_week}{' '}
                days/wk · {goal.meals_per_day} meals/day
              </Text>
              <View className="flex-row gap-2">
                <Stat label="kcal" value={`${goal.target_kcal ?? '—'}`} />
                <Stat label="protein" value={`${goal.protein_g ?? '—'}g`} />
                <Stat label="carbs" value={`${goal.carbs_g ?? '—'}g`} />
                <Stat label="fat" value={`${goal.fat_g ?? '—'}g`} />
              </View>
              <Text className="text-xs text-fg-faint">
                Water goal{' '}
                {goal.water_ml_goal ? `${(goal.water_ml_goal / 1000).toFixed(1)} L` : '—'}
              </Text>
            </>
          ) : (
            <Text className="text-sm text-fg-faint">No active goal yet.</Text>
          )}
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={signOut}
          className="items-center rounded-2xl border border-border py-4 active:opacity-80"
        >
          <Text className="text-base font-medium text-red-400">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
