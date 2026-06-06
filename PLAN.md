# Tola — Build Plan

Sequential phases, each independently shippable and verifiable, taking Tola from empty folder to
store-ready. See `SPEC.md` for all locked product decisions. Verify each phase on-device via
`npm run go` (Expo Go, SDK 55).

---

## Phase 0 — Foundation & Walking Skeleton ✅ DONE

Goal: app boots in Expo Go, talks to Supabase, one button does a real read/write round-trip.

- [x] Scaffold Expo SDK 55 TS app (expo-router, NativeWind v4 + Tailwind v3)
- [x] Add deps: supabase-js, tanstack-query, zustand, reanimated, async-storage, gesture-handler
- [x] Create Supabase project `tola-dev`; wire EXPO*PUBLIC*\* env + client
- [x] Root layout: QueryClientProvider + SafeAreaProvider + GestureHandlerRootView + global.css
- [x] 5-tab shell (Home / Plan / Nutrition / Progress / Profile), dark-first
- [x] Temp `ping` table (RLS) + Home round-trip (read recent + insert on tap)
- [x] Verify: `npm run go`, open in Expo Go, confirmed read/write round-trip on device

## Phase 1 — Data Model & Security ✅ DONE

Goal: the structured, analytics-ready DB; normalized + RLS-locked.
Three-layer analytics model: typed logs → `log_events` stream → `daily_user_summaries` cache.

- [x] Design schema: 24 tables incl. profiles, user_goals, plans/plan_workouts/plan_meals,
      exercises, foods (OFF cache + ingredients), log_events timeline, workout_sessions,
      set_logs (set_type/RPE/RIR/tempo/superset for Advanced), meal_logs + meal_log_items
      (snapshotted nutrition + confidence), liquid/weight/body_measurement/habit logs,
      daily_user_summaries, insights, streaks, badges, user_badges, shopping_list_items
- [x] Migrations (0001 schema, 0002 hardening, 0003 seed) + indexes on (user_id, day)
- [x] RLS on all 24 tables; source + plan-vs-actual links on every log
- [x] Generate TypeScript types → src/lib/database.types.ts, wired into typed client
- [x] Seed: 38 exercises · 27 base foods · 9 badges
- [x] Drop the temporary `ping` table
- [x] Verify: security advisor clean; anon access denied (RLS enforcing). Type-safe queries
      compile. Full two-user data-isolation test runs in Phase 2 (needs real auth users).

## Phase 2 — Auth & Onboarding (auth-first) ✅ DONE

- [x] Email OTP sign-in (6-digit code; Expo-Go friendly). Google/Apple buttons present but
      inactive pending OAuth setup (Google creds + Apple Developer enrollment)
- [x] Gate app behind auth; session persistence via AsyncStorage; onboarding gating
- [x] 11-step onboarding (name, bio, units, measurements, goal, activity, target/pace,
      training days+equipment, diet+allergens, meals/day) → profiles + user_goals + baseline weight
- [x] Mifflin-St Jeor + macro-split engine computes real targets at finish
- [x] Post-intake fork: Generate smart plan / Build my own (smart generation lands Phase 3)
- [x] Custom SMTP (Resend) wired for reliable auth emails
- [x] Verify on device: sign in → onboard → targets saved → land on tabs ✅ (6-digit OTP,
      Resend SMTP, Magic Link template with {{ .Token }})
- [ ] Later: wire Google + Apple OAuth; "redo with input" plan regeneration

## Phase 3 — Algorithmic Plan Engine ✅ DONE

- [x] Calorie/macro module (Mifflin-St Jeor × activity, goal adjustment, macro split) — Phase 2
- [x] Training generator (split by days, equipment filtering + fallback, goal-based set/rep/rest, A/B variety)
- [x] Meal generator (diet + allergen filtering, protein/carb/fat/veg roles, macro-scaled grams)
- [x] Plan tab: generate + view split; Nutrition tab: generate + view meals with daily totals
- [x] Verify: generators run against sample libraries → sensible, differentiated, diet-correct output
- [ ] Later: edit individual workouts/meals; "redo with extra input"; tune meal-macro precision;
      per-day meal variety; expand library with home/bodyweight exercise variants

## Phase 4 — The Logging Loop (the spine) ✅ core done, pending on-device verify

- [x] Logging layer: each log writes typed row → log_events stream → recomputes
      daily_user_summaries cache (adherence scores). src/lib/logging.ts + workout.ts
- [x] Home: weekday strip, macro ring hero (SVG, P/C/F) + macro bars, today's session card,
      next-meal "Ate it / Skip" + quick-add snack, water bottle + quick add, habit chips
- [x] Workout modal: log weight×reps per set, per-exercise rest timer, add sets, finish →
      set_logs + session + log_events (plan-vs-actual linked)
- [x] Water/liquid bottle card → liquid_logs; Weight + steps/sleep habit chips
- [ ] On-device verify: log meals/water/weight/habits + a workout; Home + summary update
- [ ] Later: animated ring transitions; meal photos (curated); week dots + coach headline;
      day-completion bar; top insight; offline outbox queue; Advanced workout UI (RPE/supersets);
      editable liquid type

## Phase 4.5 — Health Integrations

- [ ] Health Connect (Android) + HealthKit (iOS): permissions + sync adapters (steps/sleep/weight)
- [ ] Manual fallback when unavailable/denied
- [ ] Verify: phone health data flows into habit chips + weight trend

## Phase 5 — Nutrition Tab, Barcode & Shopping List

- [ ] Nutrition tab: meal plan CRUD/generate, macro/calorie views
- [ ] Open Food Facts: barcode scan (expo-camera) → fetch → cache to foods; show health info
- [ ] Shopping list auto-derived from meal plan + manual add; barcode scan ticks items off
- [ ] Verify: scan real products → correct nutrition, list item checks off, macros update

## Phase 6 — Progress, Insights & Streaks

- [ ] Aggregations over log_events (weight, volume, calories, adherence, macros over time)
- [ ] Progress charts + supportive, data-backed insight cards
- [ ] Streak engine (hit-daily-plan rule + grace) + milestone badges (consistency + body-goal)
- [ ] Surface top insight on Home
- [ ] (Optional) begin micronutrient tracking
- [ ] Verify: seed 30 days → charts, insights, streaks, badges correct

## Phase 7 — Monetization

- [ ] AdMob: banner on secondary screens + interstitial at natural breaks + during rest timers
      (never block a log action)
- [ ] RevenueCat: `no_ads` one-time entitlement; gate ad rendering on it
- [ ] Remove-ads paywall: one SKU, one screen, "Restore purchases", contextual trigger
- [ ] Entitlement check on launch + restore flow
- [ ] Verify: sandbox purchase removes all ads instantly; restore works on reinstall

## Phase 8 — Design System & UI Polish

- [ ] Finalize design tokens (accent palette via 2–3 moodboard options) + light/dark
- [ ] Shared component kit (cards, rings, chips, modals, bottle, weekday strip)
- [ ] Native patterns (haptics, sheet modals, large titles, gestures, safe areas)
- [ ] Micro-interactions (ring fill, bottle fill, meal advance) w/ Reanimated; 60fps audit
- [ ] Accessibility (dynamic type, contrast, labels, reduced-motion)
- [ ] i18n layer wired (English strings)
- [ ] Verify: visual review iOS + Android, dark/light, small + large devices

## Phase 9 — Hardening & Store Launch

- [ ] Error boundaries; account deletion + data export (store-required)
- [ ] EAS Build + EAS Update; icons, splash, screenshots, privacy labels
- [ ] Local reminders (water/workout/meal-log)
- [ ] Store listings (ads/IAP), data-safety + privacy policy
- [ ] QA on real devices; performance + cold-start budget
- [ ] Submit to TestFlight / Play internal → production
- [ ] Verify: clean install onboarding-to-purchase works end-to-end on both stores

---

### Validation strategy (every phase)

- On-device check via Expo Go (`npm run go`).
- Unit tests on the **plan engine** and **insights aggregations** (highest-risk pure functions).
- Two-user RLS check after any schema change.
