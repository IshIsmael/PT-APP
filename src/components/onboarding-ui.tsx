import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { hapticSelect } from '../lib/haptics';

const DISPLAY_BOLD = 'Fraunces_700Bold';
const CTA_GLOW = { boxShadow: '0 8px 24px rgba(224, 122, 95, 0.30)' } as const;
const CONTINUOUS = { borderCurve: 'continuous' } as const;

export function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <View className="h-2 overflow-hidden rounded-full bg-bg-subtle">
      <View className="h-full rounded-full bg-sage" style={{ width: `${pct}%` }} />
    </View>
  );
}

export function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="gap-2">
      <Text className="text-4xl text-fg" style={{ fontFamily: DISPLAY_BOLD }}>
        {title}
      </Text>
      {subtitle ? <Text className="text-base leading-6 text-fg-muted">{subtitle}</Text> : null}
    </View>
  );
}

// Single-select option card with a tactile check.
export function ChoiceCard({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      style={CONTINUOUS}
      className={`flex-row items-center gap-3 rounded-2xl border p-4 ${
        selected ? 'border-accent bg-accent/10' : 'border-border bg-bg-elevated'
      } active:opacity-80`}
    >
      <View className="flex-1">
        <Text className="font-semibold text-base text-fg">{label}</Text>
        {description ? <Text className="mt-0.5 text-sm text-fg-muted">{description}</Text> : null}
      </View>
      <View
        className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
          selected ? 'border-accent bg-accent' : 'border-border'
        }`}
      >
        {selected && <Text className="text-xs font-bold text-bg">✓</Text>}
      </View>
    </Pressable>
  );
}

// Multi-select pill.
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      className={`rounded-full border px-4 py-2.5 ${
        selected ? 'border-accent bg-accent/15' : 'border-border bg-bg-subtle'
      } active:opacity-80`}
    >
      <Text className={`text-sm ${selected ? 'font-semibold text-accent' : 'text-fg-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  suffix,
  maxLength,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'number-pad';
  suffix?: string;
  maxLength?: number;
}) {
  return (
    <View
      style={CONTINUOUS}
      className="flex-row items-center rounded-2xl border border-border bg-bg-subtle px-4"
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8C7B6C"
        keyboardType={keyboardType}
        maxLength={maxLength}
        className="flex-1 py-4 text-base text-fg"
      />
      {suffix ? <Text className="ml-2 text-base text-fg-faint">{suffix}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const active = !disabled && !loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[CONTINUOUS, active ? CTA_GLOW : null]}
      className="items-center rounded-2xl bg-accent py-4 active:opacity-90 disabled:opacity-40"
    >
      {loading ? (
        <ActivityIndicator color="#171210" />
      ) : (
        <Text className="font-semibold text-base text-bg">{label}</Text>
      )}
    </Pressable>
  );
}

export function StepShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <View className="flex-1 justify-between">
      <View className="gap-6">{children}</View>
      <View className="gap-3">{footer}</View>
    </View>
  );
}
