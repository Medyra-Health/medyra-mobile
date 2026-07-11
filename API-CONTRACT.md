# Medyra Mobile API Contract

Base URL: `https://medyra.de/api`. All authenticated calls send `Authorization: Bearer <Clerk session token>`. The web app's `clerkMiddleware` covers `/api(.*)` and resolves Bearer tokens, so `auth()` works unchanged. Responses are JSON. Errors: `{ error: string }` with 400/401/403/404/429/500.

## Endpoints used by the app

| Endpoint | Method | Auth | Request | Response |
|---|---|---|---|---|
| `/` | GET | no | none | `{ message, status, features }` health check |
| `/consent` | GET | yes | none | `{ consented: boolean, consentDate }` |
| `/consent` | POST | yes | `{ version: string }` | `{ success: true }` |
| `/reports/analyze` | POST | yes | multipart form: `file` (pdf/jpg/png/webp/txt, max 10MB), optional `profileId`, optional `docType` (`lab`\|`letter`\|`medication`\|`insurance`, hint for the model), optional `language` (locale code; the explanation is written in that language) | `{ success, reportId, explanation, biomarkersExtracted, usage: { current, limit, tier } }`. 403 `consent_required` if no consent. 429 when free limit reached. |
| `/reports` | GET | yes | query `?profileId=` optional | `{ success, reports: Report[], count }` (no extractedText) |
| `/reports/:id` | GET | yes | none | `{ success, report }` |
| `/reports/:id/chat` | POST | yes | `{ message }` | conversational reply (not in v1 mobile) |
| `/reports/:id/assign` | PATCH | yes | `{ profileId }` | `{ success, biomarkersExtracted }`; re-extracts biomarkers, no duplicates |
| `/profiles` | GET | yes | none | `{ profiles: Profile[], limit, canCreate }` |
| `/profiles` | POST | yes | `{ name, relationship?, dob?, gender?, color? }` | created profile; error when tier limit hit |
| `/profiles` | PUT | yes | `{ profileId, updates: { name?, dob?, gender?, relationship?, color? } }` | `{ success }` |
| `/profiles` | DELETE | yes | query `?id=` | `{ success }` |
| `/subscription` | GET | yes | none | `{ success, tier: 'free'\|'personal'\|'family'\|'admin', status, usageLimit, currentUsage, remaining }` |
| `/reminders` | POST | yes | `{ preset: '4w'\|'3m'\|'6m', reportId?, label?, locale? }` | `{ success, reminder: { id, dueAt, label } }`. Backend emails when due (daily cron). Max 10 active. |
| `/reminders` | GET | yes | query `?reportId=` optional | `{ success, reminders: [{ id, reportId, label, dueAt }] }` (scheduled only) |
| `/reminders/:id` | DELETE | yes | none | `{ success }` (cancels the reminder) |
| `/reports/:id/share` | POST | yes | none | `{ success, token, expiresAt }`. Rotates: older links for the report are revoked. Public page: `https://medyra.de/share/<token>` (7 day expiry, sanitized explanation only, no file name or chat). |
| `/reports/:id/share` | GET | yes | none | `{ success, share: { token, expiresAt, views } \| null }` |
| `/reports/:id/share` | DELETE | yes | none | `{ success }` (revokes all links for the report) |
| `/referral` | GET | yes | none | `{ success, code, referredCount, bonusReports, maxCredits }`. Invite link `https://medyra.de/?ref=<code>`; the claim happens on web signup (cookie plus first consent). |
| `/werte` | GET | no | none | `{ success, entries: WerteEntry[] }` compact lexikon lab values (acronym, name, category, unit, ranges, shortAnswer) for the value check screen. |

## Shapes

```ts
type Explanation = {
  inShort: string;          // one sentence takeaway
  summary: string;          // 2 to 3 sentence overview
  tests: Array<{
    name: string;
    value: string;          // e.g. "14.5 g/dL"
    range?: string;
    flag?: 'normal' | 'elevated' | 'low' | 'critical' | string;
    interpretation: string; // plain language meaning
  }>;
};

type Report = {
  id: string;               // uuid
  userId: string;
  fileName: string;
  fileType: string;
  explanation: Explanation | string; // parse defensively
  profileId?: string;
  createdAt: string;
  expiresAt: string;        // auto deleted after 30 days
  status: 'completed';
};

type Profile = {
  id: string;
  name: string;
  relationship?: string;
  dob?: string;
  gender?: string;
  color?: string;
  biomarkers: Array<{ key: string; value: number; date: string; flag: string; reportId?: string }>;
};
```

Tracked biomarker keys: hba1c, ldl, hdl, triglycerides, cholesterol, hemoglobin, ferritin, tsh, glucose, vitaminD, vitaminB12, crp, creatinine, egfr, leukocytes, platelets.

## Notes

- There is no report delete endpoint; reports expire automatically after 30 days. The app does not offer delete in v1.
- Checkout (`/checkout`) is Stripe web only. Mobile upgrades route to the web pricing page until RevenueCat ships; the entitlement endpoint for cross store resolution is a Phase 5 backend proposal, not yet built.
- Account deletion: Clerk client side `user.delete()`; the existing `user.deleted` webhook purges MongoDB data.
