# Tola

[![CI](https://github.com/IshIsmael/PT-APP/actions/workflows/ci.yml/badge.svg)](https://github.com/IshIsmael/PT-APP/actions/workflows/ci.yml)

A freemium fitness + nutrition app (Expo / React Native, iOS + Android) that plans your training
and meals, lets you log everything, and reflects your data back as science-based insights.
All features are free; a single one-time purchase removes ads.

See **[SPEC.md](./SPEC.md)** for the full product spec and **[PLAN.md](./PLAN.md)** for the phased
build plan.

## Stack

- Expo **SDK 55** · React Native · TypeScript · Expo Router
- NativeWind v4 + Tailwind v3 (dark-first)
- Supabase (Postgres + Auth + RLS) · TanStack Query + Zustand
- RevenueCat + AdMob · Open Food Facts

## Run locally (no Mac required)

```bash
npm install
npm run go        # opens Expo Go — scan the QR with the Expo Go app (SDK 55)
```

iOS production builds are produced in the cloud via EAS Build.

## Environment

Copy your Supabase values into `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...   # publishable key (safe to ship; security is via RLS)
```

## Quality & CI

Every push / PR runs the [CI workflow](.github/workflows/ci.yml): typecheck → lint → format-check
→ Metro bundle smoke test. Run the same checks locally:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier --write
```

OTA updates ship via the manual [EAS Update workflow](.github/workflows/eas-update.yml) (requires a
one-time `eas init` + an `EXPO_TOKEN` repo secret — see the workflow header).

## Status

Phases 0–3 complete: app shell + 5 tabs, Supabase backend (24-table schema + RLS), email-OTP auth +
onboarding, and the algorithmic plan engine (training split + meal generation). Next: Phase 4 — the
logging loop & Home screen.
