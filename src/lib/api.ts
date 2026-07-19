import { useAuth } from '@clerk/clerk-expo';
import { useMemo } from 'react';

import type {
  AnalyzeResult,
  DocType,
  Medication,
  MedicationInput,
  MedplanData,
  MedSlot,
  Profile,
  Referral,
  Reminder,
  Report,
  ShareInfo,
  Subscription,
  WerteEntry,
} from './types';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? 'https://medyra.de'}/api`;

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type TokenGetter = () => Promise<string | null>;

async function request<T>(
  getToken: TokenGetter,
  path: string,
  options: { method?: string; body?: BodyInit; headers?: Record<string, string> } = {},
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // non JSON error body
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.message || data?.error || `Request failed (${res.status})`, data?.error);
  }
  return data as T;
}

function jsonBody(obj: unknown) {
  return { body: JSON.stringify(obj), headers: { 'Content-Type': 'application/json' } };
}

export function createApi(getToken: TokenGetter) {
  return {
    getConsent: () => request<{ consented: boolean }>(getToken, '/consent'),
    grantConsent: () => request<{ success: boolean }>(getToken, '/consent', { method: 'POST', ...jsonBody({ version: '1.0' }) }),

    analyzeReport: (
      file: { uri: string; name: string; type: string },
      profileId?: string,
      opts?: { docType?: DocType; language?: string },
    ) => {
      const form = new FormData();
      // React Native FormData file part
      form.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
      if (profileId) form.append('profileId', profileId);
      if (opts?.docType) form.append('docType', opts.docType);
      if (opts?.language) form.append('language', opts.language);
      return request<AnalyzeResult>(getToken, '/reports/analyze', { method: 'POST', body: form });
    },

    getReports: (profileId?: string) =>
      request<{ reports: Report[] }>(getToken, `/reports${profileId ? `?profileId=${encodeURIComponent(profileId)}` : ''}`),
    getReport: (id: string) => request<{ report: Report }>(getToken, `/reports/${encodeURIComponent(id)}`),
    assignReport: (reportId: string, profileId: string) =>
      request<{ success: boolean; biomarkersExtracted?: number }>(
        getToken,
        `/reports/${encodeURIComponent(reportId)}/assign`,
        { method: 'PATCH', ...jsonBody({ profileId }) },
      ),

    getProfiles: () => request<{ profiles: Profile[]; limit: number | null; canCreate: boolean }>(getToken, '/profiles'),
    createProfile: (p: { name: string; relationship?: string; dob?: string; gender?: string; color?: string }) =>
      request<{ profile?: Profile; success?: boolean }>(getToken, '/profiles', { method: 'POST', ...jsonBody(p) }),
    updateProfile: (profileId: string, updates: Partial<Pick<Profile, 'name' | 'dob' | 'gender' | 'relationship' | 'color'>>) =>
      request<{ success: boolean }>(getToken, '/profiles', { method: 'PUT', ...jsonBody({ profileId, updates }) }),
    deleteProfile: (id: string) =>
      request<{ success: boolean }>(getToken, `/profiles?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

    getSubscription: () => request<Subscription>(getToken, '/subscription'),

    // Data & privacy: keep reports forever or auto delete 30 days after upload (default)
    getSettings: () => request<{ dataRetention: 'keep' | 'auto30'; totalReports: number }>(getToken, '/settings'),
    updateSettings: (dataRetention: 'keep' | 'auto30') =>
      request<{ success: boolean; dataRetention: 'keep' | 'auto30' }>(getToken, '/settings', {
        method: 'POST',
        ...jsonBody({ dataRetention }),
      }),

    // Recheck reminders: backend emails when it is time to test again
    createReminder: (preset: '4w' | '3m' | '6m', reportId?: string, label?: string, locale?: string) =>
      request<{ success: boolean; reminder: Reminder }>(getToken, '/reminders', {
        method: 'POST',
        ...jsonBody({ preset, reportId, label, locale }),
      }),
    getReminders: (reportId?: string) =>
      request<{ reminders: Reminder[] }>(
        getToken,
        `/reminders${reportId ? `?reportId=${encodeURIComponent(reportId)}` : ''}`,
      ),
    deleteReminder: (id: string) =>
      request<{ success: boolean }>(getToken, `/reminders/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    // Read only share links (7 day expiry, revocable)
    createShareLink: (reportId: string) =>
      request<{ success: boolean; token: string; expiresAt: string }>(
        getToken,
        `/reports/${encodeURIComponent(reportId)}/share`,
        { method: 'POST' },
      ),
    getShareStatus: (reportId: string) =>
      request<{ share: ShareInfo | null }>(getToken, `/reports/${encodeURIComponent(reportId)}/share`),
    revokeShareLink: (reportId: string) =>
      request<{ success: boolean }>(getToken, `/reports/${encodeURIComponent(reportId)}/share`, {
        method: 'DELETE',
      }),

    // Referral program: invite link, both sides earn a free report per month
    getReferral: () => request<Referral>(getToken, '/referral'),

    // Public compact lab value dataset for the value check screen
    getWerte: () => request<{ entries: WerteEntry[] }>(getToken, '/werte'),

    // Medication planner (1-0-1-0). Self is free; extra profiles need a paid tier.
    getMedplan: (profileId?: string | null) =>
      request<MedplanData>(getToken, `/medplan${profileId ? `?profileId=${encodeURIComponent(profileId)}` : ''}`),
    createMedication: (med: MedicationInput) =>
      request<{ success: boolean; medication: Medication }>(getToken, '/medplan/medications', {
        method: 'POST',
        ...jsonBody(med),
      }),
    updateMedication: (id: string, med: MedicationInput) =>
      request<{ success: boolean }>(getToken, `/medplan/medications/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        ...jsonBody(med),
      }),
    deleteMedication: (id: string) =>
      request<{ success: boolean }>(getToken, `/medplan/medications/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    setMedIntake: (medicationId: string, slot: MedSlot, status: 'taken' | 'skipped' | null) =>
      request<{ success: boolean; status: 'taken' | 'skipped' | null }>(getToken, '/medplan/intakes', {
        method: 'POST',
        ...jsonBody({ medicationId, slot, status }),
      }),
    setMedplanEmail: (emailReminders: boolean) =>
      request<{ success: boolean }>(getToken, '/medplan/settings', {
        method: 'POST',
        ...jsonBody({ emailReminders }),
      }),

    generatePrep: (input: string, locale: string, profileId?: string) =>
      request<{ success: boolean; output: string; tier: string }>(getToken, '/prep', {
        method: 'POST',
        ...jsonBody({ input, locale, ...(profileId ? { profileId } : {}) }),
      }),
    getPrepUsage: () => request<{ used?: number; limit?: number | null }>(getToken, '/prep'),
  };
}

export type Api = ReturnType<typeof createApi>;

/** Hook: API client bound to the current Clerk session. */
export function useApi(): Api {
  const { getToken } = useAuth();
  return useMemo(() => createApi(() => getToken()), [getToken]);
}
