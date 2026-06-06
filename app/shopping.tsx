import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/lib/auth';
import {
  useAddShoppingItem,
  useClearChecked,
  useGenerateShoppingList,
  useShoppingList,
  useToggleShoppingItem,
} from '../src/lib/shopping';
import { hapticSelect } from '../src/lib/haptics';

export default function Shopping() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;

  const { data: items, isLoading } = useShoppingList(userId);
  const generate = useGenerateShoppingList(userId);
  const toggle = useToggleShoppingItem(userId);
  const add = useAddShoppingItem(userId);
  const clear = useClearChecked(userId);
  const [draft, setDraft] = useState('');

  const checkedCount = (items ?? []).filter((i) => i.is_checked).length;

  function onGenerate() {
    generate.mutate(undefined, {
      onError: (e) =>
        Alert.alert('Could not generate', e instanceof Error ? e.message : 'Try again.'),
    });
  }

  function onAdd() {
    const name = draft.trim();
    if (!name) return;
    setDraft('');
    add.mutate(name);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-fg-muted">Close</Text>
        </Pressable>
        <Text className="font-semibold text-base text-fg">Shopping list</Text>
        <Pressable onPress={onGenerate} disabled={generate.isPending} hitSlop={8}>
          <Text className="font-medium text-sm text-accent">
            {generate.isPending ? '…' : 'From plan'}
          </Text>
        </Pressable>
      </View>

      <View className="flex-row gap-2 px-5 pb-2">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add an item"
          placeholderTextColor="#8C7B6C"
          returnKeyType="done"
          onSubmitEditing={onAdd}
          className="flex-1 rounded-2xl border border-border bg-bg-subtle px-4 py-3 text-fg"
        />
        <Pressable
          onPress={onAdd}
          className="items-center justify-center rounded-2xl bg-accent px-5 active:opacity-80"
        >
          <Text className="font-semibold text-bg">Add</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#E07A5F" className="mt-8" />
      ) : !items || items.length === 0 ? (
        <View className="mt-10 items-center gap-2 px-5">
          <Text className="text-fg-muted">Your list is empty.</Text>
          <Text className="text-center text-sm text-fg-faint">
            Add items above, or pull the ingredients from your meal plan with “From plan”.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-8 gap-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                hapticSelect();
                toggle.mutate({ id: item.id, is_checked: item.is_checked });
              }}
              className="flex-row items-center gap-3 rounded-2xl px-2 py-3 active:opacity-70"
            >
              <View
                className={`h-6 w-6 items-center justify-center rounded-md border ${
                  item.is_checked ? 'border-accent bg-accent' : 'border-border bg-bg-subtle'
                }`}
              >
                {item.is_checked && <Text className="text-xs font-bold text-bg">✓</Text>}
              </View>
              <Text
                className={`flex-1 text-base ${item.is_checked ? 'text-fg-faint line-through' : 'text-fg'}`}
              >
                {item.name}
              </Text>
              {item.quantity ? (
                <Text className="text-sm text-fg-faint">
                  {item.quantity}
                  {item.unit ?? ''}
                </Text>
              ) : null}
            </Pressable>
          ))}

          {checkedCount > 0 && (
            <Pressable
              onPress={() => clear.mutate()}
              className="mt-3 items-center rounded-2xl border border-border py-3 active:opacity-80"
            >
              <Text className="text-sm text-fg-muted">Clear {checkedCount} checked</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
