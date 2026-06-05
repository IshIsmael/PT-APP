import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';

const GOAL_LABEL: Record<string, string> = {
  lose_fat: 'Lose fat',
  build_muscle: 'Build muscle',
  maintain: 'Maintain',
  recomp: 'Recomposition',
};

function useActiveGoal(userId?: string) {
  return useQuery({
    queryKey: ['active-goal', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_goals')
        .select(
          'goal_type, target_kcal, protein_g, carbs_g, fat_g, water_ml_goal, training_days_per_week, meals_per_day',
        )
        .eq('user_id', userId!)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-bg-subtle rounded-2xl p-3 gap-0.5">
      <Text className="text-fg text-lg font-bold">{value}</Text>
      <Text className="text-fg-faint text-xs">{label}</Text>
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
      <View className="flex-1 p-5 gap-4">
        <Text className="text-fg text-3xl font-bold">Profile</Text>

        <View className="bg-bg-elevated border border-border rounded-3xl p-5 gap-1">
          <Text className="text-fg-faint text-xs uppercase tracking-wide">Signed in as</Text>
          <Text className="text-fg text-base">{session?.user.email ?? '—'}</Text>
        </View>

        <View className="bg-bg-elevated border border-border rounded-3xl p-5 gap-3">
          <Text className="text-fg text-lg font-semibold">Your daily targets</Text>
          {isLoading ? (
            <ActivityIndicator color="#6EE7B7" />
          ) : goal ? (
            <>
              <Text className="text-fg-muted text-sm">
                {GOAL_LABEL[goal.goal_type] ?? goal.goal_type} · {goal.training_days_per_week}{' '}
                days/wk · {goal.meals_per_day} meals/day
              </Text>
              <View className="flex-row gap-2">
                <Stat label="kcal" value={`${goal.target_kcal ?? '—'}`} />
                <Stat label="protein" value={`${goal.protein_g ?? '—'}g`} />
                <Stat label="carbs" value={`${goal.carbs_g ?? '—'}g`} />
                <Stat label="fat" value={`${goal.fat_g ?? '—'}g`} />
              </View>
              <Text className="text-fg-faint text-xs">
                Water goal {goal.water_ml_goal ? `${(goal.water_ml_goal / 1000).toFixed(1)} L` : '—'}
              </Text>
            </>
          ) : (
            <Text className="text-fg-faint text-sm">No active goal yet.</Text>
          )}
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={signOut}
          className="border border-border rounded-2xl py-4 items-center active:opacity-80"
        >
          <Text className="text-red-400 font-medium text-base">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
