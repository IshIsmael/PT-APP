import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  total: number;
  remaining: number;
  onSkip: () => void;
  onAdd: () => void;
  size?: number;
};

// A rest-timer hero: a smoothly depleting terracotta ring with the countdown
// in the middle. The big moment between sets, not a tiny inline row.
export function RestRing({ total, remaining, onSkip, onAdd, size = 128 }: Props) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const [offset] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const frac = Math.max(0, Math.min(remaining / Math.max(total, 1), 1));
    Animated.timing(offset, {
      toValue: C * (1 - frac),
      duration: 450,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [remaining, total, C, offset]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <View className="items-center gap-3">
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} stroke="#2C2219" strokeWidth={stroke} fill="none" />
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={r}
            stroke="#E07A5F"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text className="text-3xl font-bold text-fg" style={{ fontVariant: ['tabular-nums'] }}>
            {mins}:{String(secs).padStart(2, '0')}
          </Text>
          <Text className="text-xs uppercase tracking-wide text-fg-faint">rest</Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          onPress={onAdd}
          className="rounded-full border border-border bg-bg-subtle px-4 py-2 active:opacity-80"
        >
          <Text className="text-sm text-fg-muted">+15s</Text>
        </Pressable>
        <Pressable
          onPress={onSkip}
          className="rounded-full border border-border bg-bg-subtle px-4 py-2 active:opacity-80"
        >
          <Text className="text-sm text-fg-muted">Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}
