-- Bodyweight exercise variants so home/bodyweight-only users get full plans.
-- The training generator only prescribes equipment the user has (it now skips a
-- slot rather than fall back to a disallowed movement), so these fill the gaps
-- for muscles that previously had only barbell/machine options.
insert into public.exercises (name, exercise_type, primary_muscle, secondary_muscles, equipment, category, movement_pattern, is_compound) values
  ('Bodyweight Squat',       'strength', 'quads',      '{glutes}',            'bodyweight', 'legs', 'squat', true),
  ('Bodyweight Lunge',       'strength', 'quads',      '{glutes,hamstrings}', 'bodyweight', 'legs', 'lunge', true),
  ('Glute Bridge',           'strength', 'glutes',     '{hamstrings}',        'bodyweight', 'legs', 'hinge', false),
  ('Nordic Hamstring Curl',  'strength', 'hamstrings', '{glutes}',            'bodyweight', 'legs', 'hinge', true),
  ('Bodyweight Calf Raise',  'strength', 'calves',     '{}',                  'bodyweight', 'legs', 'isolation', false),
  ('Pike Push-up',           'strength', 'front_delts','{triceps}',           'bodyweight', 'push', 'vertical_press', true),
  ('Inverted Row',           'strength', 'upper_back', '{lats,biceps}',       'bodyweight', 'pull', 'horizontal_pull', true),
  ('Superman',               'strength', 'rear_delts', '{back,glutes}',       'bodyweight', 'pull', 'isolation', false);
