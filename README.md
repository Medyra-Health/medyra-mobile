# Medyra

Understand your medical documents in plain language, in under 60 seconds.

Photograph a lab report, doctor letter, or health insurance document and Medyra
explains every value in simple words. Private by design, encrypted, and GDPR
compliant. One account works on the web and in the app.

## Download

- **Android:** [Download the latest APK](https://github.com/Medyra-Health/medyra-mobile/releases/latest/download/medyra.apk),
  open the file, and allow the install when your phone asks.
- **iPhone:** open [medyra.de](https://medyra.de) in Safari, tap Share, then
  **Add to Home Screen**. Medyra installs as an app with its own icon.

Get everything in one place at **[medyra.de/app](https://medyra.de/app)**.

## About this repo

This is the Medyra mobile app: React Native with Expo, TypeScript, Expo Router.
It is a client of the Medyra backend at https://medyra.de, which handles all
document analysis, health profiles, and subscriptions.

## Run it locally

```bash
cp .env.example .env   # add your Clerk publishable key
npm install --legacy-peer-deps
npx expo start
```

Scan the QR code with Expo Go on your phone.

## Privacy

Your health data is encrypted before it is stored and is never sold or shared.
Reports can be kept as an encrypted backup or set to auto-delete after 30 days.
See the [privacy policy](https://medyra.de/privacy).
