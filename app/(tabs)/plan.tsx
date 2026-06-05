import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Plan() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-1 p-5 gap-2">
        <Text className="text-fg text-3xl font-bold">Plan</Text>
        <Text className="text-fg-muted text-base">
          Your training plan — view, edit, or generate a smart science-based plan.
        </Text>
        <Text className="text-fg-faint text-sm mt-2">Coming in Phase 3.</Text>
      </View>
    </SafeAreaView>
  );
}
