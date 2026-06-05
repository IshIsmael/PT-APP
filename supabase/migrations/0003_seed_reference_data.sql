-- ============================================================================
-- Seed reference data: badges, a global exercise library, base food ingredients.
-- All global (user_id null / no owner) and readable by every authenticated user.
-- ============================================================================

-- ---------- Badges (milestones: consistency + body-goal) --------------------
insert into public.badges (id, category, name, description, icon, criteria) values
  ('first_workout',  'consistency', 'First Rep',        'Complete your first workout.',                 'barbell',   '{"type":"workout_count","count":1}'),
  ('streak_3',       'consistency', 'Warming Up',       'Hit your daily plan 3 days in a row.',          'flame',     '{"type":"streak","count":3}'),
  ('streak_7',       'consistency', 'One Week Strong',  'Hit your daily plan 7 days in a row.',          'flame',     '{"type":"streak","count":7}'),
  ('streak_30',      'consistency', 'Unstoppable',      'Hit your daily plan 30 days in a row.',         'flame',     '{"type":"streak","count":30}'),
  ('perfect_week',   'consistency', 'Perfect Week',     'Complete every planned action for a full week.','calendar',  '{"type":"perfect_week"}'),
  ('hydration_week', 'consistency', 'Well Hydrated',    'Hit your water goal 7 days in a row.',          'water',     '{"type":"water_streak","count":7}'),
  ('first_weigh_in', 'body_goal',   'On the Scale',     'Log your first body weight.',                   'scale',     '{"type":"weight_count","count":1}'),
  ('milestone_5kg',  'body_goal',   'Five Down',        'Reach 5 kg of change toward your goal.',         'trending',  '{"type":"weight_change","kg":5}'),
  ('goal_weight',    'body_goal',   'Goal Reached',     'Reach your target weight.',                     'trophy',    '{"type":"goal_weight"}');

-- ---------- Global exercise library -----------------------------------------
insert into public.exercises (name, exercise_type, primary_muscle, secondary_muscles, equipment, category, movement_pattern, is_compound) values
  -- Chest
  ('Barbell Bench Press',      'strength', 'chest',      '{triceps,front_delts}',  'barbell',   'push', 'horizontal_press', true),
  ('Incline Dumbbell Press',   'strength', 'chest',      '{triceps,front_delts}',  'dumbbell',  'push', 'horizontal_press', true),
  ('Push-up',                  'strength', 'chest',      '{triceps,front_delts,core}', 'bodyweight', 'push', 'horizontal_press', true),
  ('Cable Fly',                'strength', 'chest',      '{front_delts}',          'cable',     'push', 'horizontal_press', false),
  ('Machine Chest Press',      'strength', 'chest',      '{triceps,front_delts}',  'machine',   'push', 'horizontal_press', true),
  -- Back
  ('Pull-up',                  'strength', 'lats',       '{biceps,upper_back}',    'bodyweight','pull', 'vertical_pull', true),
  ('Lat Pulldown',             'strength', 'lats',       '{biceps,upper_back}',    'cable',     'pull', 'vertical_pull', true),
  ('Barbell Row',              'strength', 'upper_back', '{lats,biceps}',          'barbell',   'pull', 'horizontal_pull', true),
  ('Seated Cable Row',         'strength', 'upper_back', '{lats,biceps}',          'cable',     'pull', 'horizontal_pull', true),
  ('Dumbbell Row',             'strength', 'upper_back', '{lats,biceps}',          'dumbbell',  'pull', 'horizontal_pull', true),
  ('Deadlift',                 'strength', 'back',       '{hamstrings,glutes,forearms}', 'barbell', 'pull', 'hinge', true),
  -- Legs
  ('Back Squat',               'strength', 'quads',      '{glutes,hamstrings,core}', 'barbell', 'legs', 'squat', true),
  ('Front Squat',              'strength', 'quads',      '{glutes,core}',          'barbell',   'legs', 'squat', true),
  ('Leg Press',                'strength', 'quads',      '{glutes,hamstrings}',    'machine',   'legs', 'squat', true),
  ('Romanian Deadlift',        'strength', 'hamstrings', '{glutes,back}',          'barbell',   'legs', 'hinge', true),
  ('Walking Lunge',            'strength', 'quads',      '{glutes,hamstrings}',    'dumbbell',  'legs', 'lunge', true),
  ('Leg Extension',            'strength', 'quads',      '{}',                     'machine',   'legs', 'isolation', false),
  ('Leg Curl',                 'strength', 'hamstrings', '{}',                     'machine',   'legs', 'isolation', false),
  ('Standing Calf Raise',      'strength', 'calves',     '{}',                     'machine',   'legs', 'isolation', false),
  ('Hip Thrust',               'strength', 'glutes',     '{hamstrings}',           'barbell',   'legs', 'hinge', true),
  -- Shoulders
  ('Overhead Press',           'strength', 'front_delts','{triceps,side_delts}',   'barbell',   'push', 'vertical_press', true),
  ('Dumbbell Shoulder Press',  'strength', 'front_delts','{triceps,side_delts}',   'dumbbell',  'push', 'vertical_press', true),
  ('Lateral Raise',            'strength', 'side_delts', '{}',                     'dumbbell',  'shoulders', 'isolation', false),
  ('Rear Delt Fly',            'strength', 'rear_delts', '{upper_back}',           'dumbbell',  'shoulders', 'isolation', false),
  ('Face Pull',                'strength', 'rear_delts', '{upper_back}',           'cable',     'pull', 'isolation', false),
  -- Arms
  ('Barbell Curl',             'strength', 'biceps',     '{forearms}',             'barbell',   'arms', 'isolation', false),
  ('Dumbbell Curl',            'strength', 'biceps',     '{forearms}',             'dumbbell',  'arms', 'isolation', false),
  ('Hammer Curl',              'strength', 'biceps',     '{forearms}',             'dumbbell',  'arms', 'isolation', false),
  ('Triceps Pushdown',         'strength', 'triceps',    '{}',                     'cable',     'arms', 'isolation', false),
  ('Overhead Triceps Extension','strength','triceps',    '{}',                     'dumbbell',  'arms', 'isolation', false),
  ('Dips',                     'strength', 'triceps',    '{chest,front_delts}',    'bodyweight','push', 'vertical_press', true),
  -- Core
  ('Plank',                    'strength', 'core',       '{}',                     'bodyweight','core', 'anti_extension', false),
  ('Hanging Leg Raise',        'strength', 'core',       '{hip_flexors}',          'bodyweight','core', 'flexion', false),
  ('Cable Crunch',             'strength', 'core',       '{}',                     'cable',     'core', 'flexion', false),
  -- Cardio
  ('Treadmill Run',            'cardio',   'full_body',  '{}',                     'machine',   'cardio', 'run', false),
  ('Stationary Bike',          'cardio',   'full_body',  '{}',                     'machine',   'cardio', 'cycle', false),
  ('Rowing Machine',           'cardio',   'full_body',  '{back,legs}',            'machine',   'cardio', 'row', false),
  ('Incline Walk',             'cardio',   'full_body',  '{}',                     'machine',   'cardio', 'walk', false);

-- ---------- Base food ingredients (per 100g) --------------------------------
insert into public.foods (kind, name, source, serving_size_g, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g) values
  ('ingredient', 'Chicken Breast (cooked)',  'curated', 120, 165, 31.0, 0.0,  3.6, 0.0),
  ('ingredient', 'Lean Beef Mince 5% (cooked)','curated',100, 137, 21.0, 0.0,  5.0, 0.0),
  ('ingredient', 'Salmon Fillet (cooked)',   'curated', 120, 208, 20.0, 0.0, 13.0, 0.0),
  ('ingredient', 'Tuna (canned in water)',   'curated', 100, 116, 26.0, 0.0,  1.0, 0.0),
  ('ingredient', 'White Rice (cooked)',      'curated', 150, 130,  2.7, 28.0, 0.3, 0.4),
  ('ingredient', 'Brown Rice (cooked)',      'curated', 150, 123,  2.7, 25.6, 1.0, 1.8),
  ('ingredient', 'Oats (dry)',               'curated',  40, 379, 13.0, 67.0, 7.0, 10.0),
  ('ingredient', 'Pasta (cooked)',           'curated', 150, 131,  5.0, 25.0, 1.1, 1.8),
  ('ingredient', 'Wholemeal Bread',          'curated',  40, 247, 13.0, 41.0, 3.4, 7.0),
  ('ingredient', 'Potato (boiled)',          'curated', 150,  77,  2.0, 17.0, 0.1, 2.2),
  ('ingredient', 'Sweet Potato (baked)',     'curated', 150,  90,  2.0, 21.0, 0.2, 3.3),
  ('ingredient', 'Whole Egg',                'curated',  50, 143, 13.0,  1.1, 9.5, 0.0),
  ('ingredient', 'Egg White',                'curated',  33,  52, 11.0,  0.7, 0.2, 0.0),
  ('ingredient', 'Greek Yogurt 0%',          'curated', 170,  59, 10.0,  3.6, 0.4, 0.0),
  ('ingredient', 'Whole Milk',               'curated', 250,  61,  3.2,  4.8, 3.3, 0.0),
  ('ingredient', 'Cheddar Cheese',           'curated',  30, 402, 25.0,  1.3, 33.0, 0.0),
  ('ingredient', 'Whey Protein (generic)',   'curated',  30, 400, 80.0,  8.0, 7.0, 0.0),
  ('ingredient', 'Tofu (firm)',              'curated', 100,  76,  8.0,  1.9, 4.8, 0.3),
  ('ingredient', 'Lentils (cooked)',         'curated', 150, 116,  9.0, 20.0, 0.4, 8.0),
  ('ingredient', 'Chickpeas (cooked)',       'curated', 150, 164,  8.9, 27.0, 2.6, 7.6),
  ('ingredient', 'Banana',                   'curated', 120,  89,  1.1, 23.0, 0.3, 2.6),
  ('ingredient', 'Apple',                    'curated', 150,  52,  0.3, 14.0, 0.2, 2.4),
  ('ingredient', 'Broccoli',                 'curated', 100,  34,  2.8,  7.0, 0.4, 2.6),
  ('ingredient', 'Avocado',                  'curated', 100, 160,  2.0,  9.0, 15.0, 7.0),
  ('ingredient', 'Almonds',                  'curated',  30, 579, 21.0, 22.0, 50.0, 12.5),
  ('ingredient', 'Peanut Butter',            'curated',  20, 588, 25.0, 20.0, 50.0, 6.0),
  ('ingredient', 'Olive Oil',                'curated',  10, 884,  0.0,  0.0, 100.0, 0.0);
