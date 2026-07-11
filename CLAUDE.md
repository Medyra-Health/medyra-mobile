# Medyra Mobile — working state for Claude

Read this first in every session. It is the single source of truth for where the build stands.

## What this is
Official Medyra app (iOS + Android), Expo SDK 54 (pinned to the user's Expo Go, do not upgrade without checking their Expo Go supported SDK), TypeScript, Expo Router, `src/` layout. Client of the production backend at https://medyra.de — never build backend logic here. Full endpoint list: `API-CONTRACT.md`.

## Status (2026-07-11)
- Phases 0 to 4 and 6: BUILT (auth, upload/analysis, profiles, trends, settings, icons). Needs on-device verification with the user's real account.
- Phase 5 subscriptions: paywall is store compliant. `EXPO_PUBLIC_STORE_BUILD=1` (set only in eas.json production profile) hides prices, the medyra.de checkout button, and the manage-subscription web link (App Store 3.1.1 / Play payments policy). Expo Go and preview builds keep the web checkout for testing. RevenueCat still deferred, see PHASE5-REVENUECAT.md.
- i18n: 9 UI languages (en, de, es, fr, it, pl, tr, ru, uk). Key parity enforced by `node scripts/check-locales.js`. Arabic deferred (needs RTL pass).
- Store readiness: DONE in code — expo-image-picker permission strings (EN + DE via app.json `locales`), microphone permission stripped, RECORD_AUDIO blocked on Android, ITSAppUsesNonExemptEncryption false. Listing drafts in `store/metadata.md`; full owner playbook in `store/submission-guide.md` (accounts, eas init/build/submit, privacy labels, screenshots, review notes).
- Publishing blockers (owner only): Apple Developer 99 USD/yr, Play Console 25 USD, `npx eas-cli login` (not logged in) then `eas init` to write projectId into app.json.

## Hard rules (from product owner)
- Wellness positioning; never diagnostic language. Wellness disclaimer on every analysis screen (`src/components/disclaimer.tsx`).
- Tokens only in expo-secure-store. No health data in logs/analytics/unencrypted cache.
- Speed claim exactly "under 60 seconds". Voice "we". No hyphens/em dashes in user-facing copy.
- Copy for consent and disclaimer mirrors the web app verbatim; do not rewrite.

## Dev loop
- `npx expo start` then user scans QR (generate a QR png via the qrcode npm package for `exp://<LAN-IP>:8081` and open it on the PC screen with Invoke-Item; the user's iPhone Chrome does not hand off exp:// links, Safari or camera QR only).
- Verify: `npx tsc --noEmit`, `npx expo lint`, `npx expo export --platform ios`.
- npm needs legacy peer deps: `npx expo install --fix -- --legacy-peer-deps` (run from Git Bash; PowerShell eats the `--`).

## Distribution (2026-07-11): no store budget yet, direct download instead
- Owner has no funding for Apple Developer / Play Console fees. Interim plan: Android sideload APK + iPhone PWA (medyra.de added to home screen). Store submission deferred, playbook stays in `store/submission-guide.md`.
- eas.json `apk` profile builds a sideloadable APK. It intentionally does NOT set EXPO_PUBLIC_STORE_BUILD, so the web checkout stays visible (store billing rules do not apply outside the stores).
- Download page: medyra.de/app (web repo `app/app/page.js`, 17 locales, footer link, public in middleware). APK button points to https://github.com/Medyra-Health/medyra-mobile/releases/latest/download/medyra.apk — publish each APK as a GitHub release with the asset named exactly `medyra.apk`.
- APK release flow (after owner runs `npx eas-cli login`, one time): `npx eas-cli init` once, then `npx eas-cli build --platform android --profile apk`, download the artifact, `gh release create vX.Y.Z medyra.apk --repo Medyra-Health/medyra-mobile`.

## Next actions (in order)
1. User verifies the full loop on device (sign in with existing account, upload a test document, create profile, assign, view trend, switch language in Settings).
2. Owner runs `npx eas-cli login` (free) so the APK can be built and published as a GitHub release (see Distribution above).
3. When funding exists: store accounts + `store/submission-guide.md` end to end, then RevenueCat (PHASE5-REVENUECAT.md).
4. Optional: Arabic locale with an RTL layout pass.

## Fixed issues log
- Analysis prompt was lab-only; backend now classifies docType and returns sections for letters/prescriptions/insurance (web commit bf60f04); mobile renders sections + questions + next steps (2026-07-03).
- App rethemed LIGHT to match web (tokens.ts is the source); dark splash kept as brand moment. Doctor Visit prep tab + dashboard home + Learn links added (commit 6b3c31c).
- ExpoCryptoAES crash in Expo Go: Clerk pulled SDK 57 expo-crypto/expo-auth-session; pinned both to SDK 54 top-level so npm dedupes (2026-07-03).
