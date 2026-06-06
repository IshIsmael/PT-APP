import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export function useActiveGoal(userId?: string) {
  return useQuery({
    queryKey: ['active-goal', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_goals')
        .select(
          'goal_type, target_kcal, protein_g, carbs_g, fat_g, water_ml_goal, training_days_per_week, meals_per_day',
        )
        .eq('user_id', userId!)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
