-- ============================================================================
-- Tola — Phase 1 initial schema
--
-- Analytics architecture (three layers):
--   1. Typed log tables  → rich, structured truth (workouts, meals, etc.)
--   2. log_events        → append-only raw event STREAM (timelines, streaks, audit)
--   3. daily_user_summaries → pre-aggregated analytics CACHE (instant dashboards)
--
-- Logged nutrition/training values are SNAPSHOTTED at log time (never depend on
-- joining back to mutable `foods`/`plan` rows). Plan-vs-actual links let us measure
-- adherence. Source + confidence fields on every log power "smart" insights.
-- user_id is denormalized onto child tables so RLS stays a fast `user_id = auth.uid()`.
-- ============================================================================

-- ---------- Enums -----------------------------------------------------------
create type sex                as enum ('male', 'female', 'unspecified');
create type unit_preference    as enum ('metric', 'imperial');
create type goal_type          as enum ('lose_fat', 'build_muscle', 'maintain', 'recomp');
create type activity_level     as enum ('sedentary', 'light', 'moderate', 'active', 'very_active');
create type workout_mode       as enum ('standard', 'advanced');
create type plan_kind          as enum ('training', 'nutrition');
create type plan_source        as enum ('algorithm', 'manual');
create type session_status     as enum ('in_progress', 'completed', 'skipped');
create type event_type         as enum ('workout_session', 'set', 'meal', 'liquid', 'weight', 'habit', 'body_measurement');
create type meal_slot          as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type habit_type         as enum ('steps', 'sleep');
create type liquid_type        as enum ('water', 'coffee', 'tea', 'juice', 'milk', 'soda', 'alcohol', 'other');
create type food_kind          as enum ('product', 'ingredient', 'recipe');
create type badge_category     as enum ('consistency', 'body_goal');
create type set_type           as enum ('warmup', 'working', 'drop', 'failure', 'amrap', 'backoff', 'superset');

-- Where a piece of data came from — its provenance drives data-quality weighting
-- in analytics (a manually-estimated meal is lower confidence than a barcode scan).
create type input_source as enum (
  'manual', 'barcode', 'open_food_facts', 'apple_health', 'google_fit',
  'wearable', 'ai_estimated', 'plan_generated', 'curated'
);

-- ---------- Shared helpers --------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- IDENTITY & GOALS
-- ============================================================================
create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  display_name            text,
  sex                     sex,
  birth_date              date,
  height_cm               numeric(5,1),
  unit_preference         unit_preference not null default 'metric',
  workout_log_mode        workout_mode    not null default 'standard',
  theme_preference        text            not null default 'dark',
  onboarding_completed_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Goal config snapshot: inputs + engine-derived targets. History via effective_from;
-- current goal = the is_active row. Analytics joins summaries to the goal that was
-- active on a given day to answer "were they hitting the target they had THEN?".
create table public.user_goals (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  goal_type              goal_type      not null,
  activity_level         activity_level not null default 'moderate',
  target_weight_kg       numeric(5,1),
  weekly_rate_kg         numeric(4,2),
  training_days_per_week smallint not null default 3 check (training_days_per_week between 0 and 7),
  meals_per_day          smallint not null default 3 check (meals_per_day between 1 and 8),
  diet_tags              text[] not null default '{}',
  excluded_allergens     text[] not null default '{}',
  equipment              text[] not null default '{}',
  -- derived targets (output of the algorithmic plan engine)
  tdee_kcal              integer,
  target_kcal            integer,
  protein_g              integer,
  carbs_g                integer,
  fat_g                  integer,
  fiber_g                integer,
  water_ml_goal          integer,
  is_active              boolean not null default true,
  effective_from         timestamptz not null default now(),
  created_at             timestamptz not null default now()
);
create unique index user_goals_one_active on public.user_goals (user_id) where is_active;

-- ============================================================================
-- EXERCISE LIBRARY & PLANS
-- ============================================================================
-- user_id null = global seeded library; non-null = user's custom exercise.
-- Muscle/equipment/category fields enable volume-by-muscle & frequency analytics.
create table public.exercises (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade,
  name              text not null,
  exercise_type     text not null default 'strength',  -- strength | cardio | mobility
  primary_muscle    text,
  secondary_muscles text[] not null default '{}',
  equipment         text,
  category          text,                               -- push | pull | legs | core | ...
  movement_pattern  text,                               -- squat | hinge | press | pull | carry | ...
  is_compound       boolean not null default false,
  instructions      text,
  created_at        timestamptz not null default now()
);

create table public.plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       plan_kind   not null,
  name       text        not null,
  source     plan_source not null default 'algorithm',
  is_active  boolean     not null default true,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index plans_one_active_per_kind on public.plans (user_id, kind) where is_active;

create table public.plan_workouts (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.plans(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  day_of_week smallint check (day_of_week between 0 and 6),  -- null = unscheduled
  order_index smallint not null default 0,
  created_at  timestamptz not null default now()
);

create table public.plan_workout_exercises (
  id                  uuid primary key default gen_random_uuid(),
  plan_workout_id     uuid not null references public.plan_workouts(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  exercise_id         uuid not null references public.exercises(id),
  order_index         smallint not null default 0,
  target_sets         smallint,
  target_reps_low     smallint,
  target_reps_high    smallint,
  target_rest_seconds smallint,
  notes               text,
  created_at          timestamptz not null default now()
);

-- ============================================================================
-- FOODS (Open Food Facts cache + ingredients + recipes) & MEAL PLANS
-- ============================================================================
create table public.foods (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users(id) on delete cascade,  -- null = global/OFF cache/curated
  kind                 food_kind    not null default 'product',
  barcode              text,
  name                 text         not null,
  brand                text,
  source               input_source not null default 'manual',
  serving_size_g       numeric(7,1),
  serving_description  text,                                              -- "1 scoop", "2 eggs"
  -- per-100g nutrition
  kcal_per_100g        numeric(7,2),
  protein_per_100g     numeric(6,2),
  carbs_per_100g       numeric(6,2),
  fat_per_100g         numeric(6,2),
  fiber_per_100g       numeric(6,2),
  sugar_per_100g       numeric(6,2),
  salt_per_100g        numeric(6,2),
  saturated_fat_per_100g numeric(6,2),
  image_url            text,
  off_raw              jsonb,                                             -- cached Open Food Facts payload
  created_at           timestamptz not null default now()
);
create unique index foods_barcode_global on public.foods (barcode) where barcode is not null and user_id is null;

create table public.plan_meals (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references public.plans(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  day_of_week   smallint check (day_of_week between 0 and 6),  -- null = every day
  slot          meal_slot not null,
  order_index   smallint not null default 0,
  name          text not null,
  photo_category text,
  target_kcal   integer,
  protein_g     integer,
  carbs_g       integer,
  fat_g         integer,
  fiber_g       integer,
  recipe        text,
  created_at    timestamptz not null default now()
);

create table public.plan_meal_items (
  id           uuid primary key default gen_random_uuid(),
  plan_meal_id uuid not null references public.plan_meals(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  food_id      uuid references public.foods(id),
  name         text not null,
  quantity     numeric(7,2),
  unit         text,
  grams        numeric(7,1),
  kcal         numeric(7,2),
  protein_g    numeric(6,2),
  carbs_g      numeric(6,2),
  fat_g        numeric(6,2),
  fiber_g      numeric(6,2),
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- LAYER 2 — THE UNIFIED EVENT STREAM
-- Every log writes one lightweight row here. Powers timelines/streaks and feeds
-- the summary rollups. Raw stream; durable analytics live in daily_user_summaries.
-- ============================================================================
create table public.log_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_type event_type   not null,
  ref_id     uuid,                                              -- id of the detail row
  source     input_source not null default 'manual',
  day        date not null,                                     -- user-local calendar day
  logged_at  timestamptz not null default now(),
  summary    jsonb not null default '{}',                       -- denormalized metrics
  created_at timestamptz not null default now()
);

-- ============================================================================
-- TYPED LOG TABLES (with source + plan-vs-actual links)
-- ============================================================================
create table public.workout_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  plan_workout_id uuid references public.plan_workouts(id) on delete set null,  -- plan-vs-actual
  name            text,
  mode            workout_mode   not null default 'standard',
  status          session_status not null default 'in_progress',
  source          input_source   not null default 'manual',
  day             date not null,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  notes           text,
  created_at      timestamptz not null default now()
);

create table public.set_logs (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  workout_session_id       uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id              uuid not null references public.exercises(id),
  plan_workout_exercise_id uuid references public.plan_workout_exercises(id) on delete set null,  -- plan-vs-actual
  set_index                smallint not null,
  set_type                 set_type not null default 'working',
  weight_kg                numeric(6,2),
  reps                     smallint,
  duration_seconds         integer,                              -- timed holds / cardio
  distance_m               numeric(8,1),                         -- cardio
  -- Advanced-mode fields (nullable; unused in Standard mode)
  rpe                      numeric(3,1) check (rpe is null or (rpe >= 1 and rpe <= 10)),
  rir                      smallint     check (rir is null or (rir >= 0 and rir <= 10)),
  tempo                    text,                                 -- e.g. "3-1-1-0"
  to_failure               boolean not null default false,
  superset_group           smallint,
  rest_seconds             smallint,
  completed_at             timestamptz,
  created_at               timestamptz not null default now()
);

-- meal_logs snapshot the meal totals at log time. plan_meal_id set when a planned
-- meal is ticked off (plan-vs-actual). Item-level detail in meal_log_items.
create table public.meal_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  plan_meal_id   uuid references public.plan_meals(id) on delete set null,
  name           text not null,
  slot           meal_slot not null,
  is_snack       boolean not null default false,
  source         input_source not null default 'manual',
  photo_category text,
  -- snapshotted totals (do NOT recompute from items/foods later — they can change)
  kcal           numeric(7,2),
  protein_g      numeric(6,2),
  carbs_g        numeric(6,2),
  fat_g          numeric(6,2),
  fiber_g        numeric(6,2),
  sugar_g        numeric(6,2),
  salt_g         numeric(6,2),
  saturated_fat_g numeric(6,2),
  is_estimated   boolean not null default false,
  day            date not null,
  logged_at      timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create table public.meal_log_items (
  id                uuid primary key default gen_random_uuid(),
  meal_log_id       uuid not null references public.meal_logs(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  food_id           uuid references public.foods(id),               -- reference only; values snapshotted below
  plan_meal_item_id uuid references public.plan_meal_items(id) on delete set null,  -- plan-vs-actual
  name              text not null,
  source            input_source not null default 'manual',
  -- portion: keep what the user entered AND a normalized grams value
  quantity          numeric(7,2),
  unit              text,                                          -- 'g','ml','scoop','egg','serving'
  serving_size_g    numeric(7,1),
  grams_consumed    numeric(7,1),
  -- snapshotted nutrition AT TIME OF LOGGING
  kcal              numeric(7,2),
  protein_g         numeric(6,2),
  carbs_g           numeric(6,2),
  fat_g             numeric(6,2),
  fiber_g           numeric(6,2),
  sugar_g           numeric(6,2),
  salt_g            numeric(6,2),
  saturated_fat_g   numeric(6,2),
  -- data quality
  is_estimated      boolean not null default false,
  confidence_score  numeric(3,2) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
  serving_description text,
  raw_input         text,                                          -- what the user typed/scanned
  created_at        timestamptz not null default now()
);

create table public.liquid_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  liquid_type liquid_type  not null default 'water',
  amount_ml   integer not null check (amount_ml > 0),
  source      input_source not null default 'manual',
  day         date not null,
  logged_at   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create table public.weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  weight_kg   numeric(5,2) not null check (weight_kg > 0),
  source      input_source not null default 'manual',
  day         date not null,
  measured_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (user_id, day, source)                                  -- a manual + a synced value can coexist
);

create table public.body_measurement_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  waist_cm        numeric(5,1),
  hip_cm          numeric(5,1),
  chest_cm        numeric(5,1),
  arm_cm          numeric(5,1),
  thigh_cm        numeric(5,1),
  neck_cm         numeric(5,1),
  body_fat_percent numeric(4,1),
  photo_url       text,
  source          input_source not null default 'manual',
  day             date not null,
  measured_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create table public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  habit_type habit_type   not null,
  value      numeric(8,2) not null,
  unit       text         not null,                              -- 'steps','minutes'
  source     input_source not null default 'manual',
  day        date not null,
  logged_at  timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, habit_type, day, source)
);

-- ============================================================================
-- LAYER 3 — ANALYTICS CACHE
-- One pre-aggregated row per user per day. The backbone of the Progress screen:
-- dashboards/graphs read straight from here instead of scanning raw logs.
-- Maintained incrementally (triggers / edge function) — built out in Phase 6.
-- ============================================================================
create table public.daily_user_summaries (
  user_id              uuid not null references auth.users(id) on delete cascade,
  day                  date not null,
  -- nutrition actuals
  kcal_total           numeric(8,2),
  protein_g            numeric(7,2),
  carbs_g              numeric(7,2),
  fat_g                numeric(7,2),
  fiber_g              numeric(7,2),
  sugar_g              numeric(7,2),
  salt_g               numeric(7,2),
  saturated_fat_g      numeric(7,2),
  water_ml             integer,
  meals_logged         smallint,
  meals_planned        smallint,
  snacks_logged        smallint,
  -- training actuals
  workouts_completed   smallint,
  workouts_planned     smallint,
  sets_completed       integer,
  training_volume_kg   numeric(10,2),
  -- health / habits
  steps                integer,
  sleep_minutes        integer,
  weight_kg            numeric(5,2),
  -- targets snapshot (from the goal active that day)
  target_kcal          integer,
  planned_kcal         integer,
  target_protein_g     integer,
  target_water_ml      integer,
  -- deltas + scores (0..1 adherence)
  kcal_delta           integer,
  protein_delta        integer,
  nutrition_score      numeric(4,3),
  training_score       numeric(4,3),
  habit_score          numeric(4,3),
  adherence_score      numeric(4,3),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  primary key (user_id, day)
);

-- Generated insights/reflections shown to the user (stored so we can show history,
-- avoid repeats, and track what resonated).
create table public.insights (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null,                                    -- 'weekly_review','protein_trend',...
  title        text not null,
  body         text not null,
  metrics      jsonb not null default '{}',
  period_start date,
  period_end   date,
  is_read      boolean not null default false,
  is_pinned    boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- ENGAGEMENT & SHOPPING
-- ============================================================================
create table public.streaks (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  current_count   integer not null default 0,
  longest_count   integer not null default 0,
  last_active_day date,
  grace_used_on   date,
  updated_at      timestamptz not null default now()
);

create table public.badges (
  id          text primary key,
  category    badge_category not null,
  name        text not null,
  description text not null,
  icon        text,
  criteria    jsonb not null default '{}'
);

create table public.user_badges (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  badge_id  text not null references public.badges(id),
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table public.shopping_list_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  food_id      uuid references public.foods(id),
  plan_meal_id uuid references public.plan_meals(id) on delete set null,
  quantity     numeric(8,2),
  unit         text,
  source       text not null default 'manual' check (source in ('plan', 'manual')),
  is_checked   boolean not null default false,
  checked_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();
create trigger daily_user_summaries_updated_at before update on public.daily_user_summaries
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- INDEXES
-- ============================================================================
create index log_events_user_day        on public.log_events (user_id, day);
create index log_events_user_type_day   on public.log_events (user_id, event_type, day);
create index log_events_user_logged_at  on public.log_events (user_id, logged_at desc);
create index set_logs_session           on public.set_logs (workout_session_id);
create index set_logs_user_created      on public.set_logs (user_id, created_at);
create index set_logs_exercise          on public.set_logs (user_id, exercise_id);
create index meal_logs_user_day         on public.meal_logs (user_id, day);
create index meal_log_items_meal        on public.meal_log_items (meal_log_id);
create index liquid_logs_user_day       on public.liquid_logs (user_id, day);
create index weight_logs_user_day       on public.weight_logs (user_id, day);
create index body_measurement_user_day  on public.body_measurement_logs (user_id, day);
create index habit_logs_user_day        on public.habit_logs (user_id, day);
create index workout_sessions_user_day  on public.workout_sessions (user_id, day);
create index daily_summaries_day        on public.daily_user_summaries (day);
create index insights_user_created      on public.insights (user_id, created_at desc);
create index insights_user_unread       on public.insights (user_id) where not is_read;
create index exercises_user             on public.exercises (user_id);
create index foods_user                 on public.foods (user_id);
create index plan_workouts_plan         on public.plan_workouts (plan_id);
create index plan_workout_ex_workout    on public.plan_workout_exercises (plan_workout_id);
create index plan_meals_plan            on public.plan_meals (plan_id);
create index plan_meal_items_meal       on public.plan_meal_items (plan_meal_id);
create index shopping_user_checked      on public.shopping_list_items (user_id, is_checked);
create index user_badges_user           on public.user_badges (user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles               enable row level security;
alter table public.user_goals             enable row level security;
alter table public.exercises              enable row level security;
alter table public.plans                  enable row level security;
alter table public.plan_workouts          enable row level security;
alter table public.plan_workout_exercises enable row level security;
alter table public.foods                  enable row level security;
alter table public.plan_meals             enable row level security;
alter table public.plan_meal_items        enable row level security;
alter table public.log_events             enable row level security;
alter table public.workout_sessions       enable row level security;
alter table public.set_logs               enable row level security;
alter table public.meal_logs              enable row level security;
alter table public.meal_log_items         enable row level security;
alter table public.liquid_logs            enable row level security;
alter table public.weight_logs            enable row level security;
alter table public.body_measurement_logs  enable row level security;
alter table public.habit_logs             enable row level security;
alter table public.daily_user_summaries   enable row level security;
alter table public.insights               enable row level security;
alter table public.streaks                enable row level security;
alter table public.badges                 enable row level security;
alter table public.user_badges            enable row level security;
alter table public.shopping_list_items    enable row level security;

-- profiles keyed by id
create policy "profiles_select" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- streaks keyed by user_id
create policy "streaks_select" on public.streaks for select to authenticated using (user_id = (select auth.uid()));
create policy "streaks_insert" on public.streaks for insert to authenticated with check (user_id = (select auth.uid()));
create policy "streaks_update" on public.streaks for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- badges: shared read-only reference data
create policy "badges_read" on public.badges for select to authenticated using (true);

-- exercises & foods: read global (user_id is null) OR own; write only own
create policy "exercises_read"   on public.exercises for select to authenticated using (user_id is null or user_id = (select auth.uid()));
create policy "exercises_insert" on public.exercises for insert to authenticated with check (user_id = (select auth.uid()));
create policy "exercises_update" on public.exercises for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "exercises_delete" on public.exercises for delete to authenticated using (user_id = (select auth.uid()));

create policy "foods_read"   on public.foods for select to authenticated using (user_id is null or user_id = (select auth.uid()));
create policy "foods_insert" on public.foods for insert to authenticated with check (user_id = (select auth.uid()));
create policy "foods_update" on public.foods for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "foods_delete" on public.foods for delete to authenticated using (user_id = (select auth.uid()));

-- all remaining user-owned tables: full CRUD restricted to owner
create policy "own" on public.user_goals             for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.plans                  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.plan_workouts          for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.plan_workout_exercises for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.plan_meals             for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.plan_meal_items        for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.log_events             for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.workout_sessions       for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.set_logs               for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.meal_logs              for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.meal_log_items         for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.liquid_logs            for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.weight_logs            for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.body_measurement_logs  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.habit_logs             for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.daily_user_summaries   for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.insights               for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.user_badges            for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own" on public.shopping_list_items    for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
