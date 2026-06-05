# Tola — Product Spec

A freemium fitness + nutrition app (Expo / React Native, iOS + Android) that plans your
training and meals, lets you log everything (sets, food, liquids, weight, habits), collates it
into a structured database, and reflects it back as insights with personal, science-based advice.
Freemium = banner/interstitial ads removed by a single one-time purchase. All features are free.

> This spec is the single source of truth. Tola is built **from scratch** against this document only.

## The spine (core loop)
Set up → generate a smart tailored plan (or build your own, or redo with extra input) →
use the app & log the day → it nudges the next action → it pays you back with insights →
streaks keep you coming back.

## Navigation — 5 bottom tabs
- **Home** — "your day at a glance"; the collation hub + primary logging surface.
- **Plan** — view / edit / generate the training plan; gym QR/PIN; physio extras.
- **Nutrition** — meal plan CRUD/generate, liquids, supplements, shopping list, macros/micros.
- **Progress** — analytics hub: trends, insights, streaks.
- **Profile** — account, units, preferences, remove-ads purchase, settings.

## Locked decisions

### Stack & platform
| Area | Decision |
| --- | --- |
| Framework | Expo **SDK 55** · React Native 0.83 · TypeScript · Expo Router (file-based) |
| Styling | **NativeWind v4 + Tailwind v3** (dark-first token system) |
| Server state | TanStack Query (cache) + Zustand (ephemeral UI) |
| Backend | **Supabase** (Postgres + Auth + Storage + RLS + Edge Functions) — project `tola-dev` |
| Plan engine | Local deterministic TS module (Mifflin-St Jeor, macro splits, progressive overload) |
| Food / barcode | **Open Food Facts** API + `expo-camera`, cached to a local products table |
| Monetization | **RevenueCat** (`no_ads` entitlement) + **AdMob** banner/interstitial |
| Platforms | iOS + Android equal. No Mac → preview via Expo Go (`npm run go`), iOS ships via EAS cloud |

> SDK 55 is required because the user's Expo Go app supports SDK 55. Do not upgrade past what
> Expo Go supports.

### Onboarding & auth
- **Auth-first** — sign in before onboarding (no guest-data migration).
- Sign-in: **email magic link + Google + Apple**.
- **Both units**, user picks in onboarding; stored canonically in metric.
- Onboarding length: **balanced (~8–10 steps)**.

### Plan & nutrition
- **Algorithmic** science-based generation. Goals: **lose fat, build muscle, maintain, recomp**.
- Diets: flexible **tag + allergen-exclusion** system (omnivore / vegetarian / vegan / keto /
  pescatarian / high-protein / custom).
- v1 tracks **calories + macros** (+ fiber); micronutrients deferred to Phase 6+.
- Meal cards use **curated stock photos** by category.
- **User sets meals/day** in onboarding; snacks always quick-addable.
- Shopping list: **auto-derived from meal plan + manual add**; barcode scan ticks items off.
- **No supplement tracking** in v1.

### Logging & health
- **Auto-sync steps / sleep / weight** via **Health Connect (Android) + HealthKit (iOS)** in v1,
  with manual fallback.
- Workout logging is **user-selectable: Standard** (sets/reps/weight + rest timer) **or Advanced**
  (+ RPE, supersets, warmups). Shared data model sized for Advanced (nullable columns).
- **Rest timer**: auto-suggested by goal (~60–90s hypertrophy, ~2–3min strength), editable.
- Water/liquid: **fill-the-bottle** card; **auto-calculated goal** (bodyweight + activity),
  user-overridable.

### Engagement
- **Streak = hit your daily plan** (with sensible grace so one miss isn't punishing).
- **Streaks + milestone badges**: consistency badges + body-goal milestones.

### Experience & monetization
- **Dark-first / premium** design system (dark default; light theme secondary).
- Accent palette finalized in **Phase 8** via moodboard (current values are placeholders).
- Coach/insight voice: **supportive & data-backed**.
- Reminders: **water + workout + meal-log** (local notifications).
- Ads: **light & respectful** + an **interstitial during workout rest timers** (fills waiting
  time, never blocks a log action). Removed by the one-time `no_ads` purchase.
- **No telemetry in v1** (seam left to add Sentry / PostHog later).
- **English only, i18n-ready** (all strings through an i18n layer).

### Home widgets (all in v1)
Weekday strip · animated macro ring hero (calories vs target, P/C/F segments) · day-completion
bar + coach headline · today's session card · today's meals card (advancing) · water bottle card ·
habit chips (water/steps/sleep) · this-week 7-dot strip · top surfaced insight.

## Out of scope (v1) — seams left for later
Social features · wearables beyond Health Connect/HealthKit · AI-written coaching · paid food API ·
web app · push-notification campaigns · full micronutrient tracking · supplement tracking.

## Data architecture (Phase 1 — implemented)
Three layers so dashboards stay instant:
1. **Typed log tables** — structured truth (`set_logs`, `meal_logs`/`meal_log_items`,
   `liquid_logs`, `weight_logs`, `body_measurement_logs`, `habit_logs`, `workout_sessions`).
2. **`log_events`** — append-only event STREAM (timelines, streaks, audit); every log writes one row.
3. **`daily_user_summaries`** — pre-aggregated per-user/day analytics CACHE (built out in Phase 6).

Principles: logged nutrition/training values are **snapshotted at log time** (never recomputed from
mutable `foods`/`plan` rows); every log carries a **`source`** (`input_source` enum) and meals carry
**estimation/confidence** fields for data-quality weighting; **plan-vs-actual** links
(`plan_workout_exercise_id`, `plan_meal_item_id`, etc.) drive adherence analytics; `user_id` is
denormalized onto child tables so RLS is a fast `user_id = auth.uid()`. `insights` stores generated
reflections. 24 tables total; migrations in `supabase/migrations/`.

## Config facts
- Supabase project ref: `tqcavomczpzqgzmzwwkz` (org "IshIsmael's Org", region eu-west-1)
- Bundle id: `com.tola.app`
- Package manager: npm · `.npmrc` has `legacy-peer-deps=true`
- Run locally: `npm run go` (Expo Go)
