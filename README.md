# Medyra Mobile

Official Medyra app for iOS and Android. React Native with Expo (SDK 57), TypeScript, Expo Router.

The app is a client of the existing Medyra backend at https://medyra.de. All document analysis, profile logic, and subscription state live in the web app's API routes. Authentication uses the same Clerk instance as the web app.

## Setup

```bash
cp .env.example .env   # fill in the Clerk publishable key
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS or Android). Press `r` to reload, `?` for all commands.

## Structure

```
src/
  app/           Expo Router routes
    _layout.tsx  Root layout: fonts, splash, status bar
    (tabs)/      Tab shell: Home, Profiles, Trends, Settings
  components/    Shared UI (Screen, ThemedText, GlassCard)
  theme/         tokens.ts, the single source of truth for colors,
                 typography, spacing, and radii
assets/          Icons and splash (brand versions arrive in Phase 6)
eas.json         EAS build profiles (development, preview, production)
```

## Rules

- Wellness positioning only. No diagnostic language anywhere.
- Health data never goes into analytics, logs, or unencrypted local cache.
- Tokens live in expo-secure-store, never AsyncStorage.
- Speed claim is exactly "under 60 seconds".
- Brand voice uses "we". No hyphens or em dashes in user facing copy.
- Never commit `.env`.

## Phases

- [x] Phase 0: setup, theme, tab shell
- [ ] Phase 1: Clerk authentication
- [ ] Phase 2: document upload and analysis
- [ ] Phase 3: health profiles
- [ ] Phase 4: trends and history
- [ ] Phase 5: subscriptions (RevenueCat)
- [ ] Phase 6: settings, legal, polish
