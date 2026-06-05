import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Nutrition() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-1 p-5 gap-2">
        <Text className="text-fg text-3xl font-bold">Nutrition</Text>
        <Text className="text-fg-muted text-base">
          Meals, macros, liquids, barcode scan & shopping list.
        </Text>
        <Text className="text-fg-faint text-sm mt-2">Coming in Phase 5.</Text>
      </View>
    </SafeAreaView>
  );
}
