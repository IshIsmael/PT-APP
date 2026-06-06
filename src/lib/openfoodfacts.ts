// Open Food Facts barcode lookup (free, public, no key).
export type OffProduct = {
  barcode: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  servingSizeG: number | null;
  nutriScore: string | null;
  per100g: {
    kcal: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
    fiber: number | null;
    sugar: number | null;
    salt: number | null;
    saturatedFat: number | null;
  };
};

function toNum(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export async function fetchProduct(barcode: string): Promise<OffProduct | null> {
  const fields = 'product_name,brands,nutriments,serving_size,image_url,nutriscore_grade';
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode,
  )}.json?fields=${fields}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Tola/0.1 (fitness app)' },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      status?: number;
      product?: Record<string, unknown>;
    };
    if (json.status !== 1 || !json.product) return null;

    const p = json.product;
    const n = (p.nutriments ?? {}) as Record<string, unknown>;
    const servingSizeG = p.serving_size ? toNum(p.serving_size) : null;

    return {
      barcode,
      name: (p.product_name as string) || 'Unknown product',
      brand: (p.brands as string) || null,
      imageUrl: (p.image_url as string) || null,
      servingSizeG,
      nutriScore: (p.nutriscore_grade as string) || null,
      per100g: {
        kcal: toNum(n['energy-kcal_100g']),
        protein: toNum(n['proteins_100g']),
        carbs: toNum(n['carbohydrates_100g']),
        fat: toNum(n['fat_100g']),
        fiber: toNum(n['fiber_100g']),
        sugar: toNum(n['sugars_100g']),
        salt: toNum(n['salt_100g']),
        saturatedFat: toNum(n['saturated-fat_100g']),
      },
    };
  } catch {
    // Network error / timeout / abort.
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Scale a per-100g product to a gram amount.
export function macrosForGrams(p: OffProduct, grams: number) {
  const f = grams / 100;
  const s = (v: number | null) => (v === null ? 0 : Math.round(v * f));
  return {
    kcal: s(p.per100g.kcal),
    protein: s(p.per100g.protein),
    carbs: s(p.per100g.carbs),
    fat: s(p.per100g.fat),
    fiber: s(p.per100g.fiber),
  };
}
