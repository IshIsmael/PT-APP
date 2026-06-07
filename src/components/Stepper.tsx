import { Pressable, Text, View } from 'react-native';
import { hapticSelect } from '../lib/haptics';

type Props = {
  value: number;
  onChange: (v: number) => void;
  onPressValue?: () => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  decimals?: number;
};

// Big +/- control for gym-friendly entry (no keyboard needed). Tapping the
// value opens precise entry via onPressValue.
export function Stepper({
  value,
  onChange,
  onPressValue,
  step = 1,
  min = 0,
  max = 9999,
  suffix,
  decimals = 0,
}: Props) {
  const round = (n: number) => Math.round(n * 100) / 100;
  const bump = (dir: 1 | -1) => {
    hapticSelect();
    onChange(Math.min(max, Math.max(min, round(value + dir * step))));
  };
  const label = decimals > 0 ? value.toFixed(decimals) : `${value}`;

  return (
    <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-border bg-bg-subtle">
      <Pressable
        onPress={() => bump(-1)}
        className="h-12 w-12 items-center justify-center active:opacity-60"
        hitSlop={4}
      >
        <Text className="text-2xl text-fg-muted">−</Text>
      </Pressable>
      <Pressable
        onPress={onPressValue}
        className="flex-1 items-center py-3"
        disabled={!onPressValue}
      >
        <Text className="font-semibold text-xl text-fg" style={{ fontVariant: ['tabular-nums'] }}>
          {label}
          {suffix ? <Text className="text-sm text-fg-faint"> {suffix}</Text> : null}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => bump(1)}
        className="h-12 w-12 items-center justify-center active:opacity-60"
        hitSlop={4}
      >
        <Text className="text-2xl text-fg-muted">+</Text>
      </Pressable>
    </View>
  );
}
