# Medyra Mobile — working state for Claude

Read this first in every session. It is the single source of truth for where the build stands.

## What this is
Official Medyra app (iOS + Android), Expo SDK 54 (pinned to the user's Expo Go, do not upgrade without checking their Expo Go supported SDK), TypeScript, Expo Router, `src/` layout. Client of the production backend at https://medyra.de — never build backend logic here. Full endpoint list: `API-CONTRACT.md`.

## Status (2026-07-02)
- Phase 0 setup: DONE (verified booting in Expo Go on user's iPhone)
- Phase 1 auth: BUILT — Clerk sign in/up + email code, secure-store token cache, auth gate. Needs on-device verification with the user's real account.
- Phase 2 upload/analysis: BUILT — camera/photos/files -> POST /reports/analyze, consent modal (copy mirrors web ConsentModal), analyzing overlay, result screen with flags/share/disclaimer. Needs on-device verification against production.
- Phase 3 profiles: BUILT — CRUD + assign report to profile (report screen), free-tier upsell gate.
- Phase 4 trends: BUILT — per-profile biomarker chips + hand-rolled SVG line chart + document timeline.
- Phase 5 subscriptions: PARTIAL — paywall routes to medyra.de/pricing (Stripe web unlocks mobile via shared backend). RevenueCat NOT started: requires user accounts (RevenueCat, App Store Connect, Play Console), react-native-purchases, an EAS dev build (user's Expo account: abralur28@gmail.com, not yet logged in via `eas login`), and a backend entitlement endpoint (propose spec, get approval, then edit web repo).
- Phase 6: BUILT except store metadata drafts — settings (plan, legal links, about w/ Potsdam Transfer, sign out, Clerk user.delete() for GDPR deletion), brand icons generated from web MedyraIcon SVG via headless Edge.

## Hard rules (from product owner)
- Wellness positioning; never diagnostic language. Wellness disclaimer on every analysis screen (`src/components/disclaimer.tsx`).
- Tokens only in expo-secure-store. No health data in logs/analytics/unencrypted cache.
- Speed claim exactly "under 60 seconds". Voice "we". No hyphens/em dashes in user-facing copy.
- Copy for consent and disclaimer mirrors the web app verbatim; do not rewrite.

## Dev loop
- `npx expo start` then user scans QR (generate a QR png via the qrcode npm package for `exp://<LAN-IP>:8081` and open it on the PC screen with Invoke-Item; the user's iPhone Chrome does not hand off exp:// links, Safari or camera QR only).
- Verify: `npx tsc --noEmit`, `npx expo lint`, `npx expo export --platform ios`.
- npm needs legacy peer deps: `npx expo install --fix -- --legacy-peer-deps` (run from Git Bash; PowerShell eats the `--`).

## Next actions (in order)
1. User verifies Phases 1-4 on device (sign in with existing account, upload a test document, create profile, assign, view trend).
2. i18n: import web `messages/*.json` locales with i18next (deferred; UI is English-only right now).
3. RevenueCat (needs user accounts + EAS build + approved backend entitlement spec).
4. Store listing metadata drafts (DE + EN), EAS submit config.
