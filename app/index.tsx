import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/lib/auth';

// Entry route at "/". Redirects based on session + onboarding status.
export default function Index() {
  const { session, loading, onboardingComplete } = useAuth();

  if (loading || (session && onboardingComplete === null)) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#6EE7B7" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (!onboardingComplete) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
