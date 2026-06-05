import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Progress() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-1 p-5 gap-2">
        <Text className="text-fg text-3xl font-bold">Progress</Text>
        <Text className="text-fg-muted text-base">
          Insights, trends & streaks — your data reflected back at you.
        </Text>
        <Text className="text-fg-faint text-sm mt-2">Coming in Phase 6.</Text>
      </View>
    </SafeAreaView>
  );
}
