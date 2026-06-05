import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-1 p-5 gap-2">
        <Text className="text-fg text-3xl font-bold">Profile</Text>
        <Text className="text-fg-muted text-base">
          Account, units, preferences, remove-ads purchase & settings.
        </Text>
        <Text className="text-fg-faint text-sm mt-2">Coming later (auth in Phase 2).</Text>
      </View>
    </SafeAreaView>
  );
}
