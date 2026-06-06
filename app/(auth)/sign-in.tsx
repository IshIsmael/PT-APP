import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { Sprout } from '../../src/components/Sprout';

type Stage = 'email' | 'code';

const DISPLAY_BOLD = 'Fraunces_700Bold';
const CTA_GLOW = { boxShadow: '0 8px 24px rgba(224, 122, 95, 0.30)' } as const;

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<Stage>('email');
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      Alert.alert('Enter a valid email address');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) Alert.alert('Could not send code', error.message);
    else setStage('code');
  }

  async function verifyCode() {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    });
    setLoading(false);
    if (error) Alert.alert('Invalid or expired code', error.message);
  }

  function comingSoon(provider: string) {
    Alert.alert(`${provider} — coming soon`, 'For now, your email gets you in instantly.');
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center gap-9 px-7 py-10"
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View className="items-center gap-3">
            <Sprout streak={9} size={104} />
            <Text className="text-6xl text-fg" style={{ fontFamily: DISPLAY_BOLD }}>
              Tola
            </Text>
            <Text className="px-4 text-center text-base text-fg-muted">
              {stage === 'email'
                ? 'Let’s grow something good. Sign in with your email — no password to remember.'
                : `We sent a 6-digit code to ${email.trim().toLowerCase()}.`}
            </Text>
          </View>

          {stage === 'email' ? (
            <View className="gap-3">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                placeholderTextColor="#8C7B6C"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                inputMode="email"
                returnKeyType="go"
                onSubmitEditing={sendCode}
                style={{ borderCurve: 'continuous' }}
                className="rounded-2xl border border-border bg-bg-subtle px-4 py-4 text-base text-fg"
              />
              <Pressable
                onPress={sendCode}
                disabled={loading}
                style={[{ borderCurve: 'continuous' }, CTA_GLOW]}
                className="items-center rounded-2xl bg-accent py-4 active:opacity-90"
              >
                {loading ? (
                  <ActivityIndicator color="#171210" />
                ) : (
                  <Text className="font-semibold text-base text-bg">Send my code</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor="#8C7B6C"
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={6}
                returnKeyType="go"
                onSubmitEditing={verifyCode}
                style={{ borderCurve: 'continuous', fontVariant: ['tabular-nums'] }}
                className="rounded-2xl border border-border bg-bg-subtle px-4 py-4 text-center text-3xl tracking-[10px] text-fg"
              />
              <Pressable
                onPress={verifyCode}
                disabled={loading || code.trim().length < 6}
                style={[{ borderCurve: 'continuous' }, code.trim().length >= 6 ? CTA_GLOW : null]}
                className="items-center rounded-2xl bg-accent py-4 active:opacity-90 disabled:opacity-40"
              >
                {loading ? (
                  <ActivityIndicator color="#171210" />
                ) : (
                  <Text className="font-semibold text-base text-bg">Verify & continue</Text>
                )}
              </Pressable>
              <Pressable onPress={() => setStage('email')} className="items-center py-2">
                <Text className="text-sm text-fg-muted">Use a different email</Text>
              </Pressable>
            </View>
          )}

          {stage === 'email' && (
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="h-px flex-1 bg-border" />
                <Text className="text-xs text-fg-faint">or continue with</Text>
                <View className="h-px flex-1 bg-border" />
              </View>
              <View className="flex-row gap-3">
                <SocialButton label="Google" onPress={() => comingSoon('Google')} />
                <SocialButton label="Apple" onPress={() => comingSoon('Apple')} />
              </View>
            </View>
          )}

          <Text className="px-6 text-center text-xs text-fg-faint">One day at a time. 🌱</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ borderCurve: 'continuous' }}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-bg-elevated py-4 active:opacity-80"
    >
      <Text className="font-medium text-base text-fg">{label}</Text>
      <View className="rounded-full bg-bg-subtle px-2 py-0.5">
        <Text className="text-[10px] uppercase tracking-wide text-fg-faint">soon</Text>
      </View>
    </Pressable>
  );
}
