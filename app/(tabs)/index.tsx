import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';

type Ping = { id: string; message: string; created_at: string };

function usePings() {
  return useQuery({
    queryKey: ['pings'],
    queryFn: async (): Promise<Ping[]> => {
      const { data, error } = await supabase
        .from('ping')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function Home() {
  const qc = useQueryClient();
  const { data: pings, isLoading, error } = usePings();
  const [sent, setSent] = useState(0);

  const insertPing = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('ping')
        .insert({ message: `Hello from Tola #${sent + 1}` });
      if (error) throw error;
    },
    onSuccess: () => {
      setSent((c) => c + 1);
      qc.invalidateQueries({ queryKey: ['pings'] });
    },
    onError: (e: Error) => Alert.alert('Insert failed', e.message),
  });

  const connected = !error && !isLoading;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="p-5 gap-4">
        <View className="gap-1">
          <Text className="text-fg-muted text-base">Good to see you</Text>
          <Text className="text-fg text-4xl font-bold tracking-tight">Tola</Text>
          <Text className="text-fg-faint text-sm">
            Phase 0 · Expo SDK 55 + Supabase round-trip
          </Text>
        </View>

        {/* Backend connection status card */}
        <View className="bg-bg-elevated border border-border rounded-3xl p-5 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-fg text-lg font-semibold">Backend</Text>
            <View className="flex-row items-center gap-2">
              <View
                className={`h-2.5 w-2.5 rounded-full ${
                  error ? 'bg-red-500' : connected ? 'bg-accent' : 'bg-yellow-400'
                }`}
              />
              <Text className="text-fg-muted text-sm">
                {error ? 'Error' : connected ? 'Connected' : 'Connecting…'}
              </Text>
            </View>
          </View>

          {error ? (
            <Text className="text-red-400 text-sm">{(error as Error).message}</Text>
          ) : (
            <Text className="text-fg-muted text-sm">
              Reading + writing to the Supabase `ping` table over the anon client.
            </Text>
          )}

          <Pressable
            onPress={() => insertPing.mutate()}
            disabled={insertPing.isPending}
            className="bg-accent rounded-2xl py-3.5 items-center active:opacity-80"
          >
            <Text className="text-bg font-semibold text-base">
              {insertPing.isPending ? 'Sending…' : 'Send a ping'}
            </Text>
          </Pressable>
        </View>

        {/* Recent pings */}
        <View className="bg-bg-elevated border border-border rounded-3xl p-5 gap-3">
          <Text className="text-fg text-lg font-semibold">Recent pings</Text>
          {isLoading ? (
            <ActivityIndicator color="#6EE7B7" />
          ) : pings && pings.length > 0 ? (
            pings.map((p) => (
              <View key={p.id} className="bg-bg-subtle rounded-xl px-4 py-3">
                <Text className="text-fg text-sm">{p.message}</Text>
                <Text className="text-fg-faint text-xs mt-0.5">
                  {new Date(p.created_at).toLocaleTimeString()}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-fg-faint text-sm">
              No pings yet — tap “Send a ping”.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
