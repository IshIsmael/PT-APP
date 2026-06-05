export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          category: Database["public"]["Enums"]["badge_category"]
          criteria: Json
          description: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          category: Database["public"]["Enums"]["badge_category"]
          criteria?: Json
          description: string
          icon?: string | null
          id: string
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["badge_category"]
          criteria?: Json
          description?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      body_measurement_logs: {
        Row: {
          arm_cm: number | null
          body_fat_percent: number | null
          chest_cm: number | null
          created_at: string
          day: string
          hip_cm: number | null
          id: string
          measured_at: string
          neck_cm: number | null
          photo_url: string | null
          source: Database["public"]["Enums"]["input_source"]
          thigh_cm: number | null
          user_id: string
          waist_cm: number | null
        }
        Insert: {
          arm_cm?: number | null
          body_fat_percent?: number | null
          chest_cm?: number | null
          created_at?: string
          day: string
          hip_cm?: number | null
          id?: string
          measured_at?: string
          neck_cm?: number | null
          photo_url?: string | null
          source?: Database["public"]["Enums"]["input_source"]
          thigh_cm?: number | null
          user_id: string
          waist_cm?: number | null
        }
        Update: {
          arm_cm?: number | null
          body_fat_percent?: number | null
          chest_cm?: number | null
          created_at?: string
          day?: string
          hip_cm?: number | null
          id?: string
          measured_at?: string
          neck_cm?: number | null
          photo_url?: string | null
          source?: Database["public"]["Enums"]["input_source"]
          thigh_cm?: number | null
          user_id?: string
          waist_cm?: number | null
        }
        Relationships: []
      }
      daily_user_summaries: {
        Row: {
          adherence_score: number | null
          carbs_g: number | null
          created_at: string
          day: string
          fat_g: number | null
          fiber_g: number | null
          habit_score: number | null
          kcal_delta: number | null
          kcal_total: number | null
          meals_logged: number | null
          meals_planned: number | null
          nutrition_score: number | null
          planned_kcal: number | null
          protein_delta: number | null
          protein_g: number | null
          salt_g: number | null
          saturated_fat_g: number | null
          sets_completed: number | null
          sleep_minutes: number | null
          snacks_logged: number | null
          steps: number | null
          sugar_g: number | null
          target_kcal: number | null
          target_protein_g: number | null
          target_water_ml: number | null
          training_score: number | null
          training_volume_kg: number | null
          updated_at: string
          user_id: string
          water_ml: number | null
          weight_kg: number | null
          workouts_completed: number | null
          workouts_planned: number | null
        }
        Insert: {
          adherence_score?: number | null
          carbs_g?: number | null
          created_at?: string
          day: string
          fat_g?: number | null
          fiber_g?: number | null
          habit_score?: number | null
          kcal_delta?: number | null
          kcal_total?: number | null
          meals_logged?: number | null
          meals_planned?: number | null
          nutrition_score?: number | null
          planned_kcal?: number | null
          protein_delta?: number | null
          protein_g?: number | null
          salt_g?: number | null
          saturated_fat_g?: number | null
          sets_completed?: number | null
          sleep_minutes?: number | null
          snacks_logged?: number | null
          steps?: number | null
          sugar_g?: number | null
          target_kcal?: number | null
          target_protein_g?: number | null
          target_water_ml?: number | null
          training_score?: number | null
          training_volume_kg?: number | null
          updated_at?: string
          user_id: string
          water_ml?: number | null
          weight_kg?: number | null
          workouts_completed?: number | null
          workouts_planned?: number | null
        }
        Update: {
          adherence_score?: number | null
          carbs_g?: number | null
          created_at?: string
          day?: string
          fat_g?: number | null
          fiber_g?: number | null
          habit_score?: number | null
          kcal_delta?: number | null
          kcal_total?: number | null
          meals_logged?: number | null
          meals_planned?: number | null
          nutrition_score?: number | null
          planned_kcal?: number | null
          protein_delta?: number | null
          protein_g?: number | null
          salt_g?: number | null
          saturated_fat_g?: number | null
          sets_completed?: number | null
          sleep_minutes?: number | null
          snacks_logged?: number | null
          steps?: number | null
          sugar_g?: number | null
          target_kcal?: number | null
          target_protein_g?: number | null
          target_water_ml?: number | null
          training_score?: number | null
          training_volume_kg?: number | null
          updated_at?: string
          user_id?: string
          water_ml?: number | null
          weight_kg?: number | null
          workouts_completed?: number | null
          workouts_planned?: number | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string | null
          created_at: string
          equipment: string | null
          exercise_type: string
          id: string
          instructions: string | null
          is_compound: boolean
          movement_pattern: string | null
          name: string
          primary_muscle: string | null
          secondary_muscles: string[]
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          equipment?: string | null
          exercise_type?: string
          id?: string
          instructions?: string | null
          is_compound?: boolean
          movement_pattern?: string | null
          name: string
          primary_muscle?: string | null
          secondary_muscles?: string[]
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          equipment?: string | null
          exercise_type?: string
          id?: string
          instructions?: string | null
          is_compound?: boolean
          movement_pattern?: string | null
          name?: string
          primary_muscle?: string | null
          secondary_muscles?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      foods: {
        Row: {
          barcode: string | null
          brand: string | null
          carbs_per_100g: number | null
          created_at: string
          fat_per_100g: number | null
          fiber_per_100g: number | null
          id: string
          image_url: string | null
          kcal_per_100g: number | null
          kind: Database["public"]["Enums"]["food_kind"]
          name: string
          off_raw: Json | null
          protein_per_100g: number | null
          salt_per_100g: number | null
          saturated_fat_per_100g: number | null
          serving_description: string | null
          serving_size_g: number | null
          source: Database["public"]["Enums"]["input_source"]
          sugar_per_100g: number | null
          user_id: string | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          carbs_per_100g?: number | null
          created_at?: string
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          image_url?: string | null
          kcal_per_100g?: number | null
          kind?: Database["public"]["Enums"]["food_kind"]
          name: string
          off_raw?: Json | null
          protein_per_100g?: number | null
          salt_per_100g?: number | null
          saturated_fat_per_100g?: number | null
          serving_description?: string | null
          serving_size_g?: number | null
          source?: Database["public"]["Enums"]["input_source"]
          sugar_per_100g?: number | null
          user_id?: string | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          carbs_per_100g?: number | null
          created_at?: string
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          image_url?: string | null
          kcal_per_100g?: number | null
          kind?: Database["public"]["Enums"]["food_kind"]
          name?: string
          off_raw?: Json | null
          protein_per_100g?: number | null
          salt_per_100g?: number | null
          saturated_fat_per_100g?: number | null
          serving_description?: string | null
          serving_size_g?: number | null
          source?: Database["public"]["Enums"]["input_source"]
          sugar_per_100g?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          day: string
          habit_type: Database["public"]["Enums"]["habit_type"]
          id: string
          logged_at: string
          source: Database["public"]["Enums"]["input_source"]
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          day: string
          habit_type: Database["public"]["Enums"]["habit_type"]
          id?: string
          logged_at?: string
          source?: Database["public"]["Enums"]["input_source"]
          unit: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          day?: string
          habit_type?: Database["public"]["Enums"]["habit_type"]
          id?: string
          logged_at?: string
          source?: Database["public"]["Enums"]["input_source"]
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      insights: {
        Row: {
          body: string
          created_at: string
          id: string
          is_pinned: boolean
          is_read: boolean
          metrics: Json
          period_end: string | null
          period_start: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_read?: boolean
          metrics?: Json
          period_end?: string | null
          period_start?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_read?: boolean
          metrics?: Json
          period_end?: string | null
          period_start?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      liquid_logs: {
        Row: {
          amount_ml: number
          created_at: string
          day: string
          id: string
          liquid_type: Database["public"]["Enums"]["liquid_type"]
          logged_at: string
          source: Database["public"]["Enums"]["input_source"]
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          day: string
          id?: string
          liquid_type?: Database["public"]["Enums"]["liquid_type"]
          logged_at?: string
          source?: Database["public"]["Enums"]["input_source"]
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          day?: string
          id?: string
          liquid_type?: Database["public"]["Enums"]["liquid_type"]
          logged_at?: string
          source?: Database["public"]["Enums"]["input_source"]
          user_id?: string
        }
        Relationships: []
      }
      log_events: {
        Row: {
          created_at: string
          day: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          logged_at: string
          ref_id: string | null
          source: Database["public"]["Enums"]["input_source"]
          summary: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          logged_at?: string
          ref_id?: string | null
          source?: Database["public"]["Enums"]["input_source"]
          summary?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          logged_at?: string
          ref_id?: string | null
          source?: Database["public"]["Enums"]["input_source"]
          summary?: Json
          user_id?: string
        }
        Relationships: []
      }
      meal_log_items: {
        Row: {
          carbs_g: number | null
          confidence_score: number | null
          created_at: string
          fat_g: number | null
          fiber_g: number | null
          food_id: string | null
          grams_consumed: number | null
          id: string
          is_estimated: boolean
          kcal: number | null
          meal_log_id: string
          name: string
          plan_meal_item_id: string | null
          protein_g: number | null
          quantity: number | null
          raw_input: string | null
          salt_g: number | null
          saturated_fat_g: number | null
          serving_description: string | null
          serving_size_g: number | null
          source: Database["public"]["Enums"]["input_source"]
          sugar_g: number | null
          unit: string | null
          user_id: string
        }
        Insert: {
          carbs_g?: number | null
          confidence_score?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_id?: string | null
          grams_consumed?: number | null
          id?: string
          is_estimated?: boolean
          kcal?: number | null
          meal_log_id: string
          name: string
          plan_meal_item_id?: string | null
          protein_g?: number | null
          quantity?: number | null
          raw_input?: string | null
          salt_g?: number | null
          saturated_fat_g?: number | null
          serving_description?: string | null
          serving_size_g?: number | null
          source?: Database["public"]["Enums"]["input_source"]
          sugar_g?: number | null
          unit?: string | null
          user_id: string
        }
        Update: {
          carbs_g?: number | null
          confidence_score?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_id?: string | null
          grams_consumed?: number | null
          id?: string
          is_estimated?: boolean
          kcal?: number | null
          meal_log_id?: string
          name?: string
          plan_meal_item_id?: string | null
          protein_g?: number | null
          quantity?: number | null
          raw_input?: string | null
          salt_g?: number | null
          saturated_fat_g?: number | null
          serving_description?: string | null
          serving_size_g?: number | null
          source?: Database["public"]["Enums"]["input_source"]
          sugar_g?: number | null
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_log_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_log_items_meal_log_id_fkey"
            columns: ["meal_log_id"]
            isOneToOne: false
            referencedRelation: "meal_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_log_items_plan_meal_item_id_fkey"
            columns: ["plan_meal_item_id"]
            isOneToOne: false
            referencedRelation: "plan_meal_items"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          carbs_g: number | null
          created_at: string
          day: string
          fat_g: number | null
          fiber_g: number | null
          id: string
          is_estimated: boolean
          is_snack: boolean
          kcal: number | null
          logged_at: string
          name: string
          photo_category: string | null
          plan_meal_id: string | null
          protein_g: number | null
          salt_g: number | null
          saturated_fat_g: number | null
          slot: Database["public"]["Enums"]["meal_slot"]
          source: Database["public"]["Enums"]["input_source"]
          sugar_g: number | null
          user_id: string
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string
          day: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          is_estimated?: boolean
          is_snack?: boolean
          kcal?: number | null
          logged_at?: string
          name: string
          photo_category?: string | null
          plan_meal_id?: string | null
          protein_g?: number | null
          salt_g?: number | null
          saturated_fat_g?: number | null
          slot: Database["public"]["Enums"]["meal_slot"]
          source?: Database["public"]["Enums"]["input_source"]
          sugar_g?: number | null
          user_id: string
        }
        Update: {
          carbs_g?: number | null
          created_at?: string
          day?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          is_estimated?: boolean
          is_snack?: boolean
          kcal?: number | null
          logged_at?: string
          name?: string
          photo_category?: string | null
          plan_meal_id?: string | null
          protein_g?: number | null
          salt_g?: number | null
          saturated_fat_g?: number | null
          slot?: Database["public"]["Enums"]["meal_slot"]
          source?: Database["public"]["Enums"]["input_source"]
          sugar_g?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_plan_meal_id_fkey"
            columns: ["plan_meal_id"]
            isOneToOne: false
            referencedRelation: "plan_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_meal_items: {
        Row: {
          carbs_g: number | null
          created_at: string
          fat_g: number | null
          fiber_g: number | null
          food_id: string | null
          grams: number | null
          id: string
          kcal: number | null
          name: string
          plan_meal_id: string
          protein_g: number | null
          quantity: number | null
          unit: string | null
          user_id: string
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_id?: string | null
          grams?: number | null
          id?: string
          kcal?: number | null
          name: string
          plan_meal_id: string
          protein_g?: number | null
          quantity?: number | null
          unit?: string | null
          user_id: string
        }
        Update: {
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_id?: string | null
          grams?: number | null
          id?: string
          kcal?: number | null
          name?: string
          plan_meal_id?: string
          protein_g?: number | null
          quantity?: number | null
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_meal_items_plan_meal_id_fkey"
            columns: ["plan_meal_id"]
            isOneToOne: false
            referencedRelation: "plan_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_meals: {
        Row: {
          carbs_g: number | null
          created_at: string
          day_of_week: number | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          name: string
          order_index: number
          photo_category: string | null
          plan_id: string
          protein_g: number | null
          recipe: string | null
          slot: Database["public"]["Enums"]["meal_slot"]
          target_kcal: number | null
          user_id: string
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string
          day_of_week?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          name: string
          order_index?: number
          photo_category?: string | null
          plan_id: string
          protein_g?: number | null
          recipe?: string | null
          slot: Database["public"]["Enums"]["meal_slot"]
          target_kcal?: number | null
          user_id: string
        }
        Update: {
          carbs_g?: number | null
          created_at?: string
          day_of_week?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          name?: string
          order_index?: number
          photo_category?: string | null
          plan_id?: string
          protein_g?: number | null
          recipe?: string | null
          slot?: Database["public"]["Enums"]["meal_slot"]
          target_kcal?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_meals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          plan_workout_id: string
          target_reps_high: number | null
          target_reps_low: number | null
          target_rest_seconds: number | null
          target_sets: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number
          plan_workout_id: string
          target_reps_high?: number | null
          target_reps_low?: number | null
          target_rest_seconds?: number | null
          target_sets?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          plan_workout_id?: string
          target_reps_high?: number | null
          target_reps_low?: number | null
          target_rest_seconds?: number | null
          target_sets?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_workout_exercises_plan_workout_id_fkey"
            columns: ["plan_workout_id"]
            isOneToOne: false
            referencedRelation: "plan_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_workouts: {
        Row: {
          created_at: string
          day_of_week: number | null
          id: string
          name: string
          order_index: number
          plan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          name: string
          order_index?: number
          plan_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          name?: string
          order_index?: number
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["plan_kind"]
          name: string
          notes: string | null
          source: Database["public"]["Enums"]["plan_source"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["plan_kind"]
          name: string
          notes?: string | null
          source?: Database["public"]["Enums"]["plan_source"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["plan_kind"]
          name?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["plan_source"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          display_name: string | null
          height_cm: number | null
          id: string
          onboarding_completed_at: string | null
          sex: Database["public"]["Enums"]["sex"] | null
          theme_preference: string
          unit_preference: Database["public"]["Enums"]["unit_preference"]
          updated_at: string
          workout_log_mode: Database["public"]["Enums"]["workout_mode"]
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          id: string
          onboarding_completed_at?: string | null
          sex?: Database["public"]["Enums"]["sex"] | null
          theme_preference?: string
          unit_preference?: Database["public"]["Enums"]["unit_preference"]
          updated_at?: string
          workout_log_mode?: Database["public"]["Enums"]["workout_mode"]
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          id?: string
          onboarding_completed_at?: string | null
          sex?: Database["public"]["Enums"]["sex"] | null
          theme_preference?: string
          unit_preference?: Database["public"]["Enums"]["unit_preference"]
          updated_at?: string
          workout_log_mode?: Database["public"]["Enums"]["workout_mode"]
        }
        Relationships: []
      }
      set_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          distance_m: number | null
          duration_seconds: number | null
          exercise_id: string
          id: string
          plan_workout_exercise_id: string | null
          reps: number | null
          rest_seconds: number | null
          rir: number | null
          rpe: number | null
          set_index: number
          set_type: Database["public"]["Enums"]["set_type"]
          superset_group: number | null
          tempo: string | null
          to_failure: boolean
          user_id: string
          weight_kg: number | null
          workout_session_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          distance_m?: number | null
          duration_seconds?: number | null
          exercise_id: string
          id?: string
          plan_workout_exercise_id?: string | null
          reps?: number | null
          rest_seconds?: number | null
          rir?: number | null
          rpe?: number | null
          set_index: number
          set_type?: Database["public"]["Enums"]["set_type"]
          superset_group?: number | null
          tempo?: string | null
          to_failure?: boolean
          user_id: string
          weight_kg?: number | null
          workout_session_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          distance_m?: number | null
          duration_seconds?: number | null
          exercise_id?: string
          id?: string
          plan_workout_exercise_id?: string | null
          reps?: number | null
          rest_seconds?: number | null
          rir?: number | null
          rpe?: number | null
          set_index?: number
          set_type?: Database["public"]["Enums"]["set_type"]
          superset_group?: number | null
          tempo?: string | null
          to_failure?: boolean
          user_id?: string
          weight_kg?: number | null
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_plan_workout_exercise_id_fkey"
            columns: ["plan_workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "plan_workout_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          checked_at: string | null
          created_at: string
          food_id: string | null
          id: string
          is_checked: boolean
          name: string
          plan_meal_id: string | null
          quantity: number | null
          source: string
          unit: string | null
          user_id: string
        }
        Insert: {
          checked_at?: string | null
          created_at?: string
          food_id?: string | null
          id?: string
          is_checked?: boolean
          name: string
          plan_meal_id?: string | null
          quantity?: number | null
          source?: string
          unit?: string | null
          user_id: string
        }
        Update: {
          checked_at?: string | null
          created_at?: string
          food_id?: string | null
          id?: string
          is_checked?: boolean
          name?: string
          plan_meal_id?: string | null
          quantity?: number | null
          source?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_plan_meal_id_fkey"
            columns: ["plan_meal_id"]
            isOneToOne: false
            referencedRelation: "plan_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          current_count: number
          grace_used_on: string | null
          last_active_day: string | null
          longest_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_count?: number
          grace_used_on?: string | null
          last_active_day?: string | null
          longest_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_count?: number
          grace_used_on?: string | null
          last_active_day?: string | null
          longest_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"]
          carbs_g: number | null
          created_at: string
          diet_tags: string[]
          effective_from: string
          equipment: string[]
          excluded_allergens: string[]
          fat_g: number | null
          fiber_g: number | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          id: string
          is_active: boolean
          meals_per_day: number
          protein_g: number | null
          target_kcal: number | null
          target_weight_kg: number | null
          tdee_kcal: number | null
          training_days_per_week: number
          user_id: string
          water_ml_goal: number | null
          weekly_rate_kg: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"]
          carbs_g?: number | null
          created_at?: string
          diet_tags?: string[]
          effective_from?: string
          equipment?: string[]
          excluded_allergens?: string[]
          fat_g?: number | null
          fiber_g?: number | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          id?: string
          is_active?: boolean
          meals_per_day?: number
          protein_g?: number | null
          target_kcal?: number | null
          target_weight_kg?: number | null
          tdee_kcal?: number | null
          training_days_per_week?: number
          user_id: string
          water_ml_goal?: number | null
          weekly_rate_kg?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"]
          carbs_g?: number | null
          created_at?: string
          diet_tags?: string[]
          effective_from?: string
          equipment?: string[]
          excluded_allergens?: string[]
          fat_g?: number | null
          fiber_g?: number | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          is_active?: boolean
          meals_per_day?: number
          protein_g?: number | null
          target_kcal?: number | null
          target_weight_kg?: number | null
          tdee_kcal?: number | null
          training_days_per_week?: number
          user_id?: string
          water_ml_goal?: number | null
          weekly_rate_kg?: number | null
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          day: string
          id: string
          measured_at: string
          source: Database["public"]["Enums"]["input_source"]
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          measured_at?: string
          source?: Database["public"]["Enums"]["input_source"]
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          measured_at?: string
          source?: Database["public"]["Enums"]["input_source"]
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string
          day: string
          ended_at: string | null
          id: string
          mode: Database["public"]["Enums"]["workout_mode"]
          name: string | null
          notes: string | null
          plan_workout_id: string | null
          source: Database["public"]["Enums"]["input_source"]
          started_at: string
          status: Database["public"]["Enums"]["session_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          ended_at?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["workout_mode"]
          name?: string | null
          notes?: string | null
          plan_workout_id?: string | null
          source?: Database["public"]["Enums"]["input_source"]
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          ended_at?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["workout_mode"]
          name?: string | null
          notes?: string | null
          plan_workout_id?: string | null
          source?: Database["public"]["Enums"]["input_source"]
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_plan_workout_id_fkey"
            columns: ["plan_workout_id"]
            isOneToOne: false
            referencedRelation: "plan_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "very_active"
      badge_category: "consistency" | "body_goal"
      event_type:
        | "workout_session"
        | "set"
        | "meal"
        | "liquid"
        | "weight"
        | "habit"
        | "body_measurement"
      food_kind: "product" | "ingredient" | "recipe"
      goal_type: "lose_fat" | "build_muscle" | "maintain" | "recomp"
      habit_type: "steps" | "sleep"
      input_source:
        | "manual"
        | "barcode"
        | "open_food_facts"
        | "apple_health"
        | "google_fit"
        | "wearable"
        | "ai_estimated"
        | "plan_generated"
        | "curated"
      liquid_type:
        | "water"
        | "coffee"
        | "tea"
        | "juice"
        | "milk"
        | "soda"
        | "alcohol"
        | "other"
      meal_slot: "breakfast" | "lunch" | "dinner" | "snack"
      plan_kind: "training" | "nutrition"
      plan_source: "algorithm" | "manual"
      session_status: "in_progress" | "completed" | "skipped"
      set_type:
        | "warmup"
        | "working"
        | "drop"
        | "failure"
        | "amrap"
        | "backoff"
        | "superset"
      sex: "male" | "female" | "unspecified"
      unit_preference: "metric" | "imperial"
      workout_mode: "standard" | "advanced"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_level: [
        "sedentary",
        "light",
        "moderate",
        "active",
        "very_active",
      ],
      badge_category: ["consistency", "body_goal"],
      event_type: [
        "workout_session",
        "set",
        "meal",
        "liquid",
        "weight",
        "habit",
        "body_measurement",
      ],
      food_kind: ["product", "ingredient", "recipe"],
      goal_type: ["lose_fat", "build_muscle", "maintain", "recomp"],
      habit_type: ["steps", "sleep"],
      input_source: [
        "manual",
        "barcode",
        "open_food_facts",
        "apple_health",
        "google_fit",
        "wearable",
        "ai_estimated",
        "plan_generated",
        "curated",
      ],
      liquid_type: [
        "water",
        "coffee",
        "tea",
        "juice",
        "milk",
        "soda",
        "alcohol",
        "other",
      ],
      meal_slot: ["breakfast", "lunch", "dinner", "snack"],
      plan_kind: ["training", "nutrition"],
      plan_source: ["algorithm", "manual"],
      session_status: ["in_progress", "completed", "skipped"],
      set_type: [
        "warmup",
        "working",
        "drop",
        "failure",
        "amrap",
        "backoff",
        "superset",
      ],
      sex: ["male", "female", "unspecified"],
      unit_preference: ["metric", "imperial"],
      workout_mode: ["standard", "advanced"],
    },
  },
} as const
