import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

export function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <View className="h-1.5 bg-bg-subtle rounded-full overflow-hidden">
      <View className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
    </View>
  );
}

export function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="gap-2">
      <Text className="text-fg text-3xl font-bold tracking-tight">{title}</Text>
      {subtitle ? <Text className="text-fg-muted text-base">{subtitle}</Text> : null}
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
      className={`rounded-2xl p-4 border ${
        selected ? 'border-accent bg-accent/10' : 'border-border bg-bg-elevated'
      } active:opacity-80`}
    >
      <Text className={`text-base font-semibold ${selected ? 'text-accent' : 'text-fg'}`}>
        {label}
      </Text>
      {description ? <Text className="text-fg-muted text-sm mt-0.5">{description}</Text> : null}
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
      className={`rounded-full px-4 py-2 border ${
        selected ? 'border-accent bg-accent/10' : 'border-border bg-bg-subtle'
      } active:opacity-80`}
    >
      <Text className={`text-sm ${selected ? 'text-accent font-semibold' : 'text-fg-muted'}`}>
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
    <View className="flex-row items-center bg-bg-subtle rounded-2xl px-4 border border-border">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6B6B76"
        keyboardType={keyboardType}
        maxLength={maxLength}
        className="flex-1 text-fg py-4 text-base"
      />
      {suffix ? <Text className="text-fg-faint text-base ml-2">{suffix}</Text> : null}
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
      className="bg-accent rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-40"
    >
      {loading ? (
        <ActivityIndicator color="#0B0B0F" />
      ) : (
        <Text className="text-bg font-semibold text-base">{label}</Text>
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
