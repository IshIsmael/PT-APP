import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Phase 1 placeholder. The real Home (macro ring, session/meal cards, water
// bottle, habit chips, week dots, top insight) is built in Phase 4 once auth +
// the plan engine exist. Live data requires a signed-in user (Phase 2).
const READY = [
  '24-table schema applied (typed logs → log_events stream → daily summaries)',
  'Row Level Security on every table — security advisor clean',
  'Seeded: 38 exercises · 27 base foods · 9 badges',
  'Generated TypeScript types wired into a typed Supabase client',
];

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="p-5 gap-4">
        <View className="gap-1">
          <Text className="text-base text-fg-muted">Good to see you</Text>
          <Text className="text-4xl font-bold tracking-tight text-fg">Tola</Text>
          <Text className="text-sm text-fg-faint">Phase 1 · Data model & security</Text>
        </View>

        <View className="gap-4 rounded-3xl border border-border bg-bg-elevated p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-fg">Backend ready</Text>
            <View className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full bg-accent" />
              <Text className="text-sm text-fg-muted">tola-dev</Text>
            </View>
          </View>
          {READY.map((line) => (
            <View key={line} className="flex-row gap-3">
              <Text className="text-base text-accent">✓</Text>
              <Text className="flex-1 text-sm text-fg-muted">{line}</Text>
            </View>
          ))}
        </View>

        <View className="gap-2 rounded-3xl border border-border bg-bg-elevated p-5">
          <Text className="text-lg font-semibold text-fg">Next: Phase 2</Text>
          <Text className="text-sm text-fg-muted">
            Auth (magic link · Google · Apple) + the ~8–10 step onboarding intake, then the
            algorithmic plan engine.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
