# Medyra: publishing to the App Store and Play Store

This is the complete path from this repo to a public app anyone can download.
Listing texts are ready in `store/metadata.md`. Everything in the code is done;
the steps below need the owner's accounts and payments.

## Step 0: accounts you must create (one time, owner only)

| Account | Cost | Where | Needed for |
|---|---|---|---|
| Apple Developer Program | 99 USD/year | developer.apple.com/programs (enroll with your Apple ID) | iOS App Store |
| Google Play Console | 25 USD once | play.google.com/console/signup | Android Play Store |
| Expo (already exists) | free | abralur28@gmail.com | EAS cloud builds |

Notes:
- Apple enrollment as an individual takes 1 to 2 days for verification. If Medyra has
  a legal entity (GmbH/UG), enroll as an organization instead (needs a D-U-N-S number,
  takes longer, but the store shows the company name instead of your personal name).
- Google requires identity verification and, for new personal accounts, a closed test
  with at least 12 testers for 14 days before you can publish publicly. Plan for that
  or register as an organization account which skips the 12-tester requirement.

## Step 1: log in to EAS and link the project (5 minutes, PC)

```
cd medyra-mobile
npx eas-cli login          # abralur28@gmail.com + password
npx eas-cli init           # creates the EAS project and writes projectId into app.json
git add app.json && git commit -m "chore: link EAS project"
```

## Step 2: build both apps in the cloud (no Mac needed)

```
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
```

- iOS: EAS asks for your Apple Developer login the first time and creates the
  distribution certificate, provisioning profile, and the bundle id `de.medyra.app`
  automatically. Say yes to everything.
- Android: EAS generates and stores the signing keystore automatically.
- Builds take 10 to 25 minutes each. The production profile sets
  `EXPO_PUBLIC_STORE_BUILD=1`, which hides prices and web checkout links
  (required by App Store rule 3.1.1 and Play payments policy).

## Step 3: create the app records in both consoles

App Store Connect (appstoreconnect.apple.com):
1. My Apps > + > New App. Platform iOS, name Medyra, primary language German,
   bundle id de.medyra.app, SKU medyra-ios.
2. Copy the numeric Apple ID of the app into `eas.json` under `submit.production.ios.ascAppId`.
3. Category: Medical (primary), Health and Fitness (secondary). Age rating: complete the
   questionnaire, answer Medical/Treatment Information = Yes, everything else No. Result is 12+.
4. Paste name, subtitle, description, keywords from `store/metadata.md` (German and English).
5. Privacy Policy URL: https://medyra.de/privacy
6. App Privacy (nutrition labels), data collected and linked to identity:
   - Health and Fitness > Health: app functionality
   - Contact Info > Email Address: app functionality
   - Identifiers > User ID: app functionality
   - User Content > Photos or Videos (the document photos): app functionality
   - No tracking, no third party advertising, no data sold. Data is encrypted in transit
     and at rest (AES 256 GCM), reports auto delete after 30 days, account deletion in app.

Play Console (play.google.com/console):
1. Create app: name Medyra, default language German, app (not game), free.
2. Store listing from `store/metadata.md`. Privacy policy https://medyra.de/privacy.
3. App content section:
   - Data safety form: collects health info, email, user ids, photos; encrypted in transit;
     data deletion available in app and at https://medyra.de/dashboard; no sharing, no ads.
   - Health apps declaration: select "manages sensitive health information", purpose:
     health information tracking/education.
   - Ads: no. Target audience: 18+ (health content). Content rating questionnaire: complete,
     it lands at Everyone or Teen.
4. Service account for automated submits (optional but recommended):
   Play Console > Setup > API access > create a service account, download the JSON key,
   save it as `store/play-service-account.json` (gitignored). Then `eas submit` works.

## Step 4: screenshots (required by both stores)

Take them in Expo Go or from a preview build, on iPhone plus any Android phone:
1. Home with the upload card
2. A finished report explanation (use a test document, never real patient data)
3. Trends chart
4. Doctor Visit summary
5. Profiles

Apple needs 6.7 inch (1290x2796) shots; iPhone 15/16 Pro Max screenshots work as is.
Play needs at least 2 phone screenshots (any modern phone resolution) plus the
512x512 icon (`assets/images/icon.png`) and a 1024x500 feature graphic
(make it from the web hero: dark background, Medyra logo, one line of copy).

## Step 5: submit

```
npx eas-cli submit --platform ios --latest
npx eas-cli submit --platform android --latest
```

Then in App Store Connect select the uploaded build, and in Play Console create a release
(internal or closed track first, production when the tester requirement is met) and roll out.

App review notes (paste into the review notes field on both stores):
- Demo account: create a fresh Medyra account with a plus address, e.g.
  abralur28+review@gmail.com, and include the password.
- Note for the reviewer: "Medyra is an educational tool that explains medical documents
  in plain language. It does not diagnose or treat. Analysis requires a document upload;
  a sample lab report is fine. Subscriptions are not sold inside the app."

## Step 6: after approval

- iOS goes live within 24 hours of approval; Android within a few hours to days.
- Review times: Apple typically 1 to 3 days, Google 1 to 7 days for a first release.

## What is intentionally deferred

- Native in app purchases (RevenueCat): see `PHASE5-REVENUECAT.md`. Until then, store
  builds show no prices and no checkout links; web subscriptions unlock the app
  automatically through the shared backend.
- Locales beyond the 9 shipped UI languages (en, de, es, fr, it, pl, tr, ru, uk).
  Arabic needs RTL layout work; do it with a dedicated pass.
