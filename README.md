# Tola

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

## Status
Phase 0 complete: app shell + 5 tabs + Supabase round-trip. Next: Phase 1 (data model & RLS).
