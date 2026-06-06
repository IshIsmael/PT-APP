import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';
import { useActiveGoal } from '../../src/lib/goals';

const DISPLAY_BOLD = 'Fraunces_700Bold';

const GOAL_LABEL: Record<string, string> = {
  lose_fat: 'Lose fat',
  build_muscle: 'Build muscle',
  maintain: 'Maintain',
  recomp: 'Recomposition',
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-0.5 rounded-2xl bg-bg-subtle p-3">
      <Text className="text-lg font-bold text-fg" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text className="text-xs text-fg-faint">{label}</Text>
    </View>
  );
}

export default function Profile() {
  const tabBarHeight = useBottomTabBarHeight();
  const { session } = useAuth();
  const { data: goal, isLoading } = useActiveGoal(session?.user.id);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Sign out failed', error.message);
  }

  function confirmDelete() {
    Alert.alert(
      'Delete your account?',
      'This permanently erases your account, plans, and every log. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: async () => {
            // RPC added after types were generated — cast the name.
            const { error } = await supabase.rpc('delete_current_user' as never);
            if (error) {
              Alert.alert('Could not delete account', error.message);
              return;
            }
            await supabase.auth.signOut();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-4 p-5"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 24 }}
      >
        <Text className="text-4xl text-fg" style={{ fontFamily: DISPLAY_BOLD }}>
          Profile
        </Text>

        <View className="gap-1 rounded-3xl border border-border bg-bg-elevated p-5">
          <Text className="text-xs uppercase tracking-wide text-fg-faint">Signed in as</Text>
          <Text className="text-base text-fg" selectable>
            {session?.user.email ?? '—'}
          </Text>
        </View>

        <View className="gap-3 rounded-3xl border border-border bg-bg-elevated p-5">
          <Text className="font-semibold text-lg text-fg">Your daily targets</Text>
          {isLoading ? (
            <ActivityIndicator color="#E07A5F" />
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
          style={{ borderCurve: 'continuous' }}
          className="items-center rounded-2xl border border-border py-4 active:opacity-80"
        >
          <Text className="font-medium text-base text-fg">Sign out</Text>
        </Pressable>

        <Pressable onPress={confirmDelete} className="items-center py-2 active:opacity-70">
          <Text className="font-medium text-sm text-red-400">Delete account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
