import { useAuth } from '@clerk/clerk-expo';
import { useMemo } from 'react';

import type { AnalyzeResult, Profile, Report, Subscription } from './types';

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

    analyzeReport: (file: { uri: string; name: string; type: string }, profileId?: string) => {
      const form = new FormData();
      // React Native FormData file part
      form.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
      if (profileId) form.append('profileId', profileId);
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
  };
}

export type Api = ReturnType<typeof createApi>;

/** Hook: API client bound to the current Clerk session. */
export function useApi(): Api {
  const { getToken } = useAuth();
  return useMemo(() => createApi(() => getToken()), [getToken]);
}
