import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

export function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
      <View className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </View>
  );
}

export function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="gap-2">
      <Text className="text-3xl font-bold tracking-tight text-fg">{title}</Text>
      {subtitle ? <Text className="text-base text-fg-muted">{subtitle}</Text> : null}
    </View>
  );
}

// Single-select option card.
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
      onPress={onPress}
      className={`rounded-2xl border p-4 ${
        selected ? 'border-accent bg-accent/10' : 'border-border bg-bg-elevated'
      } active:opacity-80`}
    >
      <Text className={`font-semibold text-base ${selected ? 'text-accent' : 'text-fg'}`}>
        {label}
      </Text>
      {description ? <Text className="mt-0.5 text-sm text-fg-muted">{description}</Text> : null}
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
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${
        selected ? 'border-accent bg-accent/10' : 'border-border bg-bg-subtle'
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
    <View className="flex-row items-center rounded-2xl border border-border bg-bg-subtle px-4">
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className="items-center rounded-2xl bg-accent py-4 active:opacity-80 disabled:opacity-40"
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
