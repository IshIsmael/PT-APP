import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Progress() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-1 gap-2 p-5">
        <Text className="text-3xl font-bold text-fg">Progress</Text>
        <Text className="text-base text-fg-muted">
          Insights, trends & streaks — your data reflected back at you.
        </Text>
        <Text className="mt-2 text-sm text-fg-faint">Coming in Phase 6.</Text>
      </View>
    </SafeAreaView>
  );
}
