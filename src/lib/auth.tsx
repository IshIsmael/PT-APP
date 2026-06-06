import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthState = {
  session: Session | null;
  loading: boolean;
  // null = unknown/loading; true/false once the profile has been checked.
  onboardingComplete: boolean | null;
  refreshOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  onboardingComplete: null,
  refreshOnboarding: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  const loadOnboarding = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setOnboardingComplete(null);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', userId)
      .maybeSingle();
    setOnboardingComplete(!!data?.onboarding_completed_at);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadOnboarding(data.session?.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      await loadOnboarding(next?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadOnboarding]);

  const refreshOnboarding = useCallback(
    () => loadOnboarding(session?.user.id),
    [loadOnboarding, session?.user.id],
  );

  return (
    <AuthContext.Provider value={{ session, loading, onboardingComplete, refreshOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
