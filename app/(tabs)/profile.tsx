import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';

export default function Profile() {
  const { session } = useAuth();

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

        <Text className="text-fg-muted text-sm">
          Account, units, preferences, remove-ads purchase & settings live here.
        </Text>

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
