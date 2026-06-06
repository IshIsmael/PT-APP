import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

type Stage = 'email' | 'code';

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
    // On success, onAuthStateChange fires and the root navigator redirects.
    if (error) Alert.alert('Invalid or expired code', error.message);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-center gap-8 px-6">
          <View className="gap-2">
            <Text className="text-4xl font-bold tracking-tight text-fg">Tola</Text>
            <Text className="text-base text-fg-muted">
              {stage === 'email'
                ? 'Sign in with your email to get started.'
                : `Enter the 6-digit code we sent to ${email.trim().toLowerCase()}.`}
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
                className="rounded-2xl border border-border bg-bg-subtle px-4 py-4 text-base text-fg"
              />
              <Pressable
                onPress={sendCode}
                disabled={loading}
                className="items-center rounded-2xl bg-accent py-4 active:opacity-80"
              >
                {loading ? (
                  <ActivityIndicator color="#171210" />
                ) : (
                  <Text className="font-semibold text-base text-bg">Send code</Text>
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
                className="rounded-2xl border border-border bg-bg-subtle px-4 py-4 text-center text-2xl tracking-[8px] text-fg"
              />
              <Pressable
                onPress={verifyCode}
                disabled={loading || code.trim().length < 6}
                className="items-center rounded-2xl bg-accent py-4 active:opacity-80 disabled:opacity-50"
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
                <Text className="text-xs text-fg-faint">or</Text>
                <View className="h-px flex-1 bg-border" />
              </View>
              {/* Wired but inactive until OAuth credentials are configured. */}
              <Pressable
                onPress={() =>
                  Alert.alert(
                    'Coming soon',
                    'Google sign-in is set up after OAuth credentials are added.',
                  )
                }
                className="items-center rounded-2xl border border-border bg-bg-subtle py-4 opacity-60"
              >
                <Text className="font-medium text-base text-fg">Continue with Google</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    'Coming soon',
                    'Apple sign-in needs an Apple Developer account first.',
                  )
                }
                className="items-center rounded-2xl border border-border bg-bg-subtle py-4 opacity-60"
              >
                <Text className="font-medium text-base text-fg">Continue with Apple</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
