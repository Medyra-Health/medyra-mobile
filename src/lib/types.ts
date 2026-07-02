export type TestFlag = 'normal' | 'elevated' | 'low' | 'critical' | string;

export type ExplanationTest = {
  name: string;
  value: string;
  range?: string;
  flag?: TestFlag;
  status?: TestFlag;
  interpretation: string;
};

export type Explanation = {
  inShort?: string;
  summary: string;
  tests: ExplanationTest[];
};

export type Report = {
  id: string;
  fileName: string;
  fileType: string;
  explanation: Explanation | string;
  profileId?: string | null;
  createdAt: string;
  expiresAt: string;
  status: string;
};

export type BiomarkerEntry = {
  key: string;
  value: number;
  date: string;
  flag: string;
  reportId?: string;
};

export type Profile = {
  id: string;
  name: string;
  relationship?: string;
  dob?: string | null;
  gender?: string;
  color?: string;
  biomarkers?: BiomarkerEntry[];
};

export type Subscription = {
  tier: 'free' | 'personal' | 'family' | 'admin';
  status: string;
  usageLimit: number;
  currentUsage: number;
  remaining: number;
};

export type AnalyzeResult = {
  success: boolean;
  reportId: string;
  explanation: Explanation | string;
  biomarkersExtracted: number;
  usage: { current: number; limit: number; tier: string };
};

/** The API stores explanation as JSON or string. Always parse defensively. */
export function parseExplanation(raw: Explanation | string | undefined | null): Explanation {
  if (!raw) return { summary: '', tests: [] };
  if (typeof raw === 'object') return { summary: raw.summary ?? '', tests: raw.tests ?? [], inShort: raw.inShort };
  try {
    const parsed = JSON.parse(raw);
    return { summary: parsed.summary ?? '', tests: parsed.tests ?? [], inShort: parsed.inShort };
  } catch {
    return { summary: String(raw), tests: [] };
  }
}
