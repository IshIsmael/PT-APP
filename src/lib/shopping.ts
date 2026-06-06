import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  source: string;
  is_checked: boolean;
};

export function useShoppingList(userId?: string) {
  return useQuery({
    queryKey: ['shopping', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ShoppingItem[]> => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('id,name,quantity,unit,source,is_checked')
        .eq('user_id', userId!)
        .order('is_checked', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useInvalidateShopping(userId?: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['shopping', userId] });
}

// Rebuild the plan-derived items from the active meal plan (manual items kept).
export function useGenerateShoppingList(userId?: string) {
  const invalidate = useInvalidateShopping(userId);
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not signed in');

      const { data: plan, error } = await supabase
        .from('plans')
        .select('id, plan_meals ( plan_meal_items ( name, grams, food_id ) )')
        .eq('user_id', userId)
        .eq('kind', 'nutrition')
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      if (!plan) throw new Error('Generate a meal plan first.');

      // Aggregate ingredients across all meals by name.
      const map = new Map<string, { name: string; grams: number; foodId: string | null }>();
      for (const meal of plan.plan_meals ?? []) {
        for (const item of meal.plan_meal_items ?? []) {
          const key = item.name.toLowerCase();
          const prev = map.get(key);
          map.set(key, {
            name: item.name,
            grams: (prev?.grams ?? 0) + (Number(item.grams) || 0),
            foodId: item.food_id ?? null,
          });
        }
      }

      // Replace previous plan-derived items; keep manually-added ones.
      const { error: delErr } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('user_id', userId)
        .eq('source', 'plan');
      if (delErr) throw delErr;

      const rows = [...map.values()].map((v) => ({
        user_id: userId,
        name: v.name,
        food_id: v.foodId,
        quantity: Math.round(v.grams),
        unit: 'g',
        source: 'plan' as const,
        is_checked: false,
      }));
      if (rows.length) {
        const { error: insErr } = await supabase.from('shopping_list_items').insert(rows);
        if (insErr) throw insErr;
      }
    },
    onSuccess: invalidate,
  });
}

export function useToggleShoppingItem(userId?: string) {
  const invalidate = useInvalidateShopping(userId);
  return useMutation({
    mutationFn: async (item: { id: string; is_checked: boolean }) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({
          is_checked: !item.is_checked,
          checked_at: item.is_checked ? null : new Date().toISOString(),
        })
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useAddShoppingItem(userId?: string) {
  const invalidate = useInvalidateShopping(userId);
  return useMutation({
    mutationFn: async (name: string) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('shopping_list_items')
        .insert({ user_id: userId, name, source: 'manual', is_checked: false });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useClearChecked(userId?: string) {
  const invalidate = useInvalidateShopping(userId);
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('user_id', userId)
        .eq('is_checked', true);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
