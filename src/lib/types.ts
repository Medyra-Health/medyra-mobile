export type TestFlag = 'normal' | 'elevated' | 'low' | 'critical' | string;

export type ExplanationTest = {
  name: string;
  value: string;
  range?: string;
  flag?: TestFlag;
  status?: TestFlag;
  interpretation: string;
};

export type ExplanationSection = {
  title: string;
  content?: string;
  items?: string[];
};

export type Explanation = {
  inShort?: string;
  summary: string;
  tests: ExplanationTest[];
  sections?: ExplanationSection[];
  questionsForDoctor?: string[];
  nextSteps?: string[];
  docType?: string;
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

/** User hint for what kind of document is being analyzed. */
export type DocType = 'lab' | 'letter' | 'medication' | 'insurance';

export type Reminder = {
  id: string;
  reportId?: string | null;
  label?: string | null;
  dueAt: string;
};

export type ShareInfo = {
  token: string;
  expiresAt: string;
  views: number;
};

export type Referral = {
  code: string;
  referredCount: number;
  bonusReports: number;
  maxCredits: number;
};

/** Compact lab value entry powering the value check screen (public endpoint). */
export type WerteEntry = {
  slug: string;
  acronym: string;
  name: string;
  category: string;
  unit: string;
  ranges: {
    low?: { min: number | null; max: number | null; label?: string };
    normal: { min: number | null; max: number | null; label?: string };
    elevated?: { min: number | null; max: number | null; label?: string };
    high?: { min: number | null; max: number | null; label?: string };
  };
  shortAnswer: string;
};

/** Medication planner (1-0-1-0 scheme: morning/noon/evening/night). */
export type MedSlot = 'morning' | 'noon' | 'evening' | 'night';

export type Medication = {
  id: string;
  profileId: string | null;
  name: string;
  dose: string;
  notes: string;
  form: 'tablet' | 'capsule' | 'drops' | 'injection' | 'spray' | 'ointment' | 'other';
  color: 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'indigo';
  slots: Partial<Record<MedSlot, boolean>>;
  times: Record<MedSlot, string>;
  /** 0 = Sunday to 6 = Saturday; empty = every day */
  days: number[];
  active: boolean;
  createdAt: string;
};

export type MedIntake = {
  medicationId: string;
  date: string;
  slot: MedSlot;
  status: 'taken' | 'skipped';
};

export type MedplanData = {
  medications: Medication[];
  todayIntakes: MedIntake[];
  today: string;
  weekday: number;
  stats: {
    streak: number;
    adherence7: number | null;
    dayStats: Record<string, { due: number; taken: number }>;
  };
  tier: string;
  profilesAllowed: boolean;
  emailReminders: boolean;
  maxMeds: number;
};

export type MedicationInput = {
  name: string;
  dose?: string;
  notes?: string;
  form?: Medication['form'];
  color?: Medication['color'];
  slots: Partial<Record<MedSlot, boolean>>;
  times?: Partial<Record<MedSlot, string>>;
  days?: number[];
  profileId?: string | null;
};

/** The API stores explanation as JSON or string. Always parse defensively. */
export function parseExplanation(raw: Explanation | string | undefined | null): Explanation {
  if (!raw) return { summary: '', tests: [] };
  const norm = (p: any): Explanation => ({
    summary: p.summary ?? '',
    tests: Array.isArray(p.tests) ? p.tests : [],
    sections: Array.isArray(p.sections) ? p.sections : [],
    questionsForDoctor: Array.isArray(p.questionsForDoctor) ? p.questionsForDoctor : [],
    nextSteps: Array.isArray(p.nextSteps) ? p.nextSteps : [],
    inShort: p.inShort,
    docType: p.docType,
  });
  if (typeof raw === 'object') return norm(raw);
  try {
    return norm(JSON.parse(raw));
  } catch {
    return { summary: String(raw), tests: [] };
  }
}
