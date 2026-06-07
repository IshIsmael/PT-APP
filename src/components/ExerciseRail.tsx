import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { hapticSelect } from '../lib/haptics';

export type RailItem = { id: string; name: string; done: number; total: number };

const ACCENT = '#E07A5F';
const SAGE = '#9CA87E';
const FAINT = '#8C7B6C';
const TRACK = '#3A2D24';

// A small progress ring that doubles as the exercise's status glyph:
// number while in progress, check when every set is done.
function MiniRing({
  index,
  done,
  total,
  active,
}: {
  index: number;
  done: number;
  total: number;
  active: boolean;
}) {
  const size = 26;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const frac = total ? Math.min(done / total, 1) : 0;
  const complete = total > 0 && done >= total;
  const ringColor = complete ? SAGE : active ? ACCENT : SAGE;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={TRACK} strokeWidth={stroke} fill="none" />
        {frac > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={ringColor}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - frac)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View style={{ position: 'absolute' }}>
        <Text
          style={{
            color: complete ? SAGE : active ? ACCENT : FAINT,
            fontSize: 11,
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
          }}
        >
          {complete ? '✓' : index + 1}
        </Text>
      </View>
    </View>
  );
}

export function ExerciseRail({
  items,
  activeIndex,
  onSelect,
}: {
  items: RailItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<number[]>([]);

  // Keep the active chip comfortably in view (HIG: current selection stays visible).
  useEffect(() => {
    const x = offsets.current[activeIndex];
    if (x != null) scrollRef.current?.scrollTo({ x: Math.max(0, x - 20), animated: true });
  }, [activeIndex]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {items.map((item, i) => {
        const active = i === activeIndex;
        const complete = item.total > 0 && item.done >= item.total;
        return (
          <Pressable
            key={item.id}
            onLayout={(e) => {
              offsets.current[i] = e.nativeEvent.layout.x;
            }}
            onPress={() => {
              hapticSelect();
              onSelect(i);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Exercise ${i + 1}, ${item.name}, ${item.done} of ${item.total} sets done${active ? ', selected' : ''}`}
            style={{ borderCurve: 'continuous', minHeight: 44 }}
            className={`flex-row items-center gap-2.5 rounded-2xl border px-3 ${
              active ? 'border-accent bg-accent/10' : 'border-border bg-bg-elevated'
            }`}
          >
            <MiniRing index={i} done={item.done} total={item.total} active={active} />
            <View style={{ maxWidth: 130 }}>
              <Text
                numberOfLines={1}
                className={`text-sm ${active ? 'font-semibold text-fg' : 'text-fg-muted'}`}
              >
                {item.name}
              </Text>
              <Text
                className={`text-[11px] ${complete ? 'text-sage' : 'text-fg-faint'}`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {complete ? 'Done' : `${item.done}/${item.total} sets`}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
