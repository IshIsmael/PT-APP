import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../src/lib/auth';
import { fetchProduct, macrosForGrams, type OffProduct } from '../src/lib/openfoodfacts';
import { useLogMeal } from '../src/lib/logging';
import { useShoppingList, useToggleShoppingItem } from '../src/lib/shopping';

type Status = 'scanning' | 'loading' | 'result' | 'notfound';

export default function Scan() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [permission, requestPermission] = useCameraPermissions();

  const logMeal = useLogMeal(userId);
  const { data: shopping } = useShoppingList(userId);
  const toggle = useToggleShoppingItem(userId);

  const [status, setStatus] = useState<Status>('scanning');
  const [product, setProduct] = useState<OffProduct | null>(null);

  async function onScanned(barcode: string) {
    if (status !== 'scanning') return;
    setStatus('loading');
    const p = await fetchProduct(barcode);
    if (!p) {
      setStatus('notfound');
      return;
    }
    setProduct(p);
    setStatus('result');
  }

  function reset() {
    setProduct(null);
    setStatus('scanning');
  }

  // Permission gate
  if (!permission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#6EE7B7" />
      </SafeAreaView>
    );
  }
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-bg p-6">
        <Text className="text-center text-base text-fg-muted">
          Tola needs camera access to scan barcodes.
        </Text>
        <Pressable onPress={requestPermission} className="rounded-2xl bg-accent px-6 py-3">
          <Text className="font-semibold text-bg">Grant access</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-fg-faint">Cancel</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const grams = product?.servingSizeG ?? 100;
  const macros = product ? macrosForGrams(product, grams) : null;
  const shoppingMatch =
    product && shopping
      ? shopping.find(
          (i) => !i.is_checked && product.name.toLowerCase().includes(i.name.toLowerCase()),
        )
      : undefined;

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={status === 'scanning' ? ({ data }) => onScanned(data) : undefined}
      />

      <SafeAreaView className="absolute inset-x-0 top-0">
        <View className="flex-row items-center justify-between p-5">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text className="text-base font-medium text-white">Close</Text>
          </Pressable>
          <Text className="text-base font-semibold text-white">Scan barcode</Text>
          <View className="w-12" />
        </View>
      </SafeAreaView>

      {/* Result / status sheet */}
      {status !== 'scanning' && (
        <SafeAreaView className="absolute inset-x-0 bottom-0">
          <View className="m-4 gap-3 rounded-3xl bg-bg-elevated p-5">
            {status === 'loading' && (
              <View className="items-center gap-2 py-4">
                <ActivityIndicator color="#6EE7B7" />
                <Text className="text-fg-muted">Looking up product…</Text>
              </View>
            )}

            {status === 'notfound' && (
              <>
                <Text className="text-base font-semibold text-fg">Product not found</Text>
                <Text className="text-sm text-fg-muted">
                  Open Food Facts doesn’t have this barcode yet.
                </Text>
                <Pressable onPress={reset} className="items-center rounded-2xl bg-accent py-3">
                  <Text className="font-semibold text-bg">Scan again</Text>
                </Pressable>
              </>
            )}

            {status === 'result' && product && macros && (
              <>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-semibold text-fg">{product.name}</Text>
                    {product.brand ? (
                      <Text className="text-sm text-fg-faint">{product.brand}</Text>
                    ) : null}
                  </View>
                  {product.nutriScore ? (
                    <View className="rounded-full bg-bg-subtle px-2.5 py-1">
                      <Text className="text-xs uppercase text-fg-muted">
                        Nutri {product.nutriScore}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text className="text-sm text-fg-muted">
                  Per {grams}g: {macros.kcal} kcal · {macros.protein}p {macros.carbs}c {macros.fat}f
                </Text>

                <Pressable
                  onPress={() =>
                    logMeal.mutate(
                      {
                        name: product.name,
                        slot: 'snack',
                        isSnack: true,
                        kcal: macros.kcal,
                        protein: macros.protein,
                        carbs: macros.carbs,
                        fat: macros.fat,
                        fiber: macros.fiber,
                        source: 'barcode',
                      },
                      {
                        onSuccess: () => {
                          Alert.alert('Logged', `${product.name} added to today.`);
                          reset();
                        },
                      },
                    )
                  }
                  className="items-center rounded-2xl bg-accent py-3 active:opacity-80"
                >
                  <Text className="font-semibold text-bg">Log as snack</Text>
                </Pressable>

                {shoppingMatch && (
                  <Pressable
                    onPress={() => {
                      toggle.mutate({ id: shoppingMatch.id, is_checked: false });
                      Alert.alert('Ticked off', `“${shoppingMatch.name}” checked off your list.`);
                      reset();
                    }}
                    className="items-center rounded-2xl border border-border py-3 active:opacity-80"
                  >
                    <Text className="font-medium text-fg-muted">
                      ✓ Tick off “{shoppingMatch.name}”
                    </Text>
                  </Pressable>
                )}

                <Pressable onPress={reset} className="items-center py-1">
                  <Text className="text-sm text-fg-faint">Scan another</Text>
                </Pressable>
              </>
            )}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}
