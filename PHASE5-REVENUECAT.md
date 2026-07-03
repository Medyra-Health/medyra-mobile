# Phase 5: Native subscriptions (RevenueCat) — implementation plan

Status: NOT started. The paywall currently bridges to Stripe web checkout, which is fully
functional because entitlement lives in the shared backend. This document is the complete plan
for switching to native in app purchases. Nothing here can proceed without the owner steps below.

## Owner prerequisites (cannot be automated)

1. Apple Developer Program membership (99 USD/year) and an App Store Connect app for
   `de.medyra.app` with two auto renewing subscriptions: `personal_monthly` (4.99 EUR),
   `family_monthly` (9.99 EUR).
2. Google Play Console account (25 USD once) and matching subscription products.
3. RevenueCat account (free tier is fine): one project, iOS + Android apps, an entitlement
   `premium` with two products mapped, and the public SDK keys.
4. `npx eas login` once with the Expo account (abralur28@gmail.com), then we run
   `eas build --profile development --platform ios` so the native module works
   (react-native-purchases does not run in Expo Go).

## Client work (done by Claude once prerequisites exist)

- `npx expo install react-native-purchases`
- Configure in `src/app/_layout.tsx` with platform specific API key; identify the user with the
  Clerk user id (`Purchases.logIn(clerkUserId)`) so RevenueCat webhooks can reference it.
- Rebuild `paywall.tsx`: fetch offerings, native purchase buttons, restore purchases button,
  loading and error states. Keep the web bridge as fallback when offerings fail to load.
- Manage subscription: App Store / Play Store subscription settings deep link for store
  purchases, medyra.de dashboard for Stripe purchases (source is in the entitlement response).

## Backend spec (requires explicit owner approval before touching the web repo)

New route in the web repo: `GET /api/entitlement`

- Auth: Clerk (same as all routes).
- Logic: resolve the effective tier as `max(stripeTier, revenueCatTier)`.
  - Stripe side: existing `users.subscription` document state (already maintained by webhook).
  - RevenueCat side: `GET https://api.revenuecat.com/v1/subscribers/{clerk_user_id}` with the
    RevenueCat secret key, mapping entitlement `premium` product to `personal` or `family`.
- Response: `{ tier, source: 'stripe' | 'revenuecat' | 'none', expiresAt }`.
- Also: RevenueCat webhook route `POST /api/webhook/revenuecat` (signature verified) that
  mirrors subscription state into `users.subscription` so `ensureUserExists` limits (20/50
  reports) apply without extra lookups. This mirrors how the Stripe webhook already works.
- Env vars: `REVENUECAT_SECRET_KEY`, `REVENUECAT_WEBHOOK_AUTH`.

With the webhook mirroring approach the existing `GET /api/subscription` keeps working unchanged
for both platforms, so the mobile app needs no API change at all — only the webhook and the
mirror logic are new. This is the recommended design: one source of truth in MongoDB.

## App Store review notes

- Apple requires in app purchase for digital subscriptions surfaced in the app. The current
  "Continue on medyra.de" bridge is acceptable for TestFlight but risks rejection at App Store
  review (guideline 3.1.1). Ship RevenueCat before public App Store release, or remove the
  paywall's external link on iOS builds.
- Wellness positioning: store listing and review notes must describe Medyra as an educational
  health literacy tool, never diagnostic.
