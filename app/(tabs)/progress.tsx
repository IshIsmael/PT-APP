import { useEffect, useRef } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth';
import {
  buildInsights,
  computeStreak,
  useBadges,
  useDailySummaries,
  useEvaluateBadges,
  useWeightSeries,
} from '../../src/lib/progress';
import { localDay } from '../../src/lib/logging';
import { Bars, TrendLine } from '../../src/components/charts';
import { Sprout } from '../../src/components/Sprout';

const DISPLAY_BOLD = 'Fraunces_700Bold';

const BADGE_ICON: Record<string, string> = {
  flame: '🔥',
  scale: '⚖️',
  barbell: '🏋️',
  trophy: '🏆',
  water: '💧',
  trending: '📈',
  calendar: '🗓️',
};

function last14Adherence(summaries: { day: string; adherence_score: number | null }[]) {
  const map = new Map(summaries.map((s) => [s.day, s.adherence_score ?? 0]));
  const out: { label: string; frac: number }[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({ label: localDay(d), frac: map.get(localDay(d)) ?? 0 });
  }
  return out;
}

export default function Progress() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const { data: summaries, isLoading } = useDailySummaries(userId, 30);
  const { data: weights } = useWeightSeries(userId, 90);
  const { data: badges } = useBadges(userId);
  const evaluate = useEvaluateBadges(userId);

  // Evaluate / award badges once when the screen opens.
  const ran = useRef(false);
  useEffect(() => {
    if (userId && !ran.current) {
      ran.current = true;
      evaluate.mutate();
    }
  }, [userId, evaluate]);

  const streak = computeStreak(summaries ?? []);
  const insights = buildInsights(summaries ?? []);
  const adherence = last14Adherence(summaries ?? []);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="p-5 gap-4">
        <Text className="text-4xl text-fg" style={{ fontFamily: DISPLAY_BOLD }}>
          Progress
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#E07A5F" className="mt-8" />
        ) : (
          <>
            {/* Streak + sprout */}
            <View className="flex-row items-center justify-between rounded-3xl border border-border bg-bg-elevated p-5">
              <View className="flex-1">
                <Text className="text-xs uppercase tracking-wide text-fg-faint">
                  Current streak
                </Text>
                <Text
                  className="text-4xl text-fg"
                  style={{ fontFamily: DISPLAY_BOLD, fontVariant: ['tabular-nums'] }}
                >
                  {streak.current} {streak.current === 1 ? 'day' : 'days'}
                </Text>
                <Text className="mt-1 text-sm text-fg-muted">Longest: {streak.longest} days</Text>
              </View>
              <Sprout streak={streak.current} size={96} />
            </View>

            {/* Insights */}
            {insights.length > 0 && (
              <View className="gap-2">
                {insights.map((ins, i) => (
                  <View key={i} className="rounded-2xl border border-border bg-bg-elevated p-4">
                    <Text className="font-semibold text-sm text-fg">{ins.title}</Text>
                    <Text className="text-sm text-fg-muted">{ins.detail}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Weight trend */}
            <View className="gap-2 rounded-3xl border border-border bg-bg-elevated p-5">
              <Text className="text-xs uppercase tracking-wide text-fg-faint">Weight (90d)</Text>
              <TrendLine data={weights ?? []} />
            </View>

            {/* Adherence */}
            <View className="gap-2 rounded-3xl border border-border bg-bg-elevated p-5">
              <Text className="text-xs uppercase tracking-wide text-fg-faint">Adherence (14d)</Text>
              <Bars data={adherence} color="#E07A5F" />
            </View>

            {/* Badges */}
            <View className="gap-3 rounded-3xl border border-border bg-bg-elevated p-5">
              <Text className="font-semibold text-lg text-fg">Badges</Text>
              <View className="flex-row flex-wrap gap-3">
                {(badges ?? []).map((b) => (
                  <View
                    key={b.id}
                    className={`w-[30%] items-center gap-1 rounded-2xl p-3 ${
                      b.earned ? 'bg-bg-subtle' : 'opacity-40'
                    }`}
                  >
                    <Text className="text-2xl">{BADGE_ICON[b.icon ?? ''] ?? '🎖️'}</Text>
                    <Text className="text-center font-medium text-xs text-fg">{b.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
