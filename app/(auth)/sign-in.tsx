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
        <View className="flex-1 px-6 justify-center gap-8">
          <View className="gap-2">
            <Text className="text-fg text-4xl font-bold tracking-tight">Tola</Text>
            <Text className="text-fg-muted text-base">
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
                placeholderTextColor="#6B6B76"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                inputMode="email"
                returnKeyType="go"
                onSubmitEditing={sendCode}
                className="bg-bg-subtle text-fg rounded-2xl px-4 py-4 text-base border border-border"
              />
              <Pressable
                onPress={sendCode}
                disabled={loading}
                className="bg-accent rounded-2xl py-4 items-center active:opacity-80"
              >
                {loading ? (
                  <ActivityIndicator color="#0B0B0F" />
                ) : (
                  <Text className="text-bg font-semibold text-base">Send code</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, ''))}
                placeholder="Enter code"
                placeholderTextColor="#6B6B76"
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={10}
                returnKeyType="go"
                onSubmitEditing={verifyCode}
                className="bg-bg-subtle text-fg rounded-2xl px-4 py-4 text-2xl tracking-[6px] text-center border border-border"
              />
              <Pressable
                onPress={verifyCode}
                disabled={loading || code.trim().length < 6}
                className="bg-accent rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50"
              >
                {loading ? (
                  <ActivityIndicator color="#0B0B0F" />
                ) : (
                  <Text className="text-bg font-semibold text-base">Verify & continue</Text>
                )}
              </Pressable>
              <Pressable onPress={() => setStage('email')} className="py-2 items-center">
                <Text className="text-fg-muted text-sm">Use a different email</Text>
              </Pressable>
            </View>
          )}

          {stage === 'email' && (
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="flex-1 h-px bg-border" />
                <Text className="text-fg-faint text-xs">or</Text>
                <View className="flex-1 h-px bg-border" />
              </View>
              {/* Wired but inactive until OAuth credentials are configured. */}
              <Pressable
                onPress={() =>
                  Alert.alert('Coming soon', 'Google sign-in is set up after OAuth credentials are added.')
                }
                className="bg-bg-subtle border border-border rounded-2xl py-4 items-center opacity-60"
              >
                <Text className="text-fg font-medium text-base">Continue with Google</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert('Coming soon', 'Apple sign-in needs an Apple Developer account first.')
                }
                className="bg-bg-subtle border border-border rounded-2xl py-4 items-center opacity-60"
              >
                <Text className="text-fg font-medium text-base">Continue with Apple</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
