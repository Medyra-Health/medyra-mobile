/** Display names for tracked biomarker keys (mirrors backend BIOMARKER_PATTERNS). */
export const BIOMARKER_LABELS: Record<string, string> = {
  hba1c: 'HbA1c',
  ldl: 'LDL',
  hdl: 'HDL',
  triglycerides: 'Triglycerides',
  cholesterol: 'Cholesterol',
  hemoglobin: 'Hemoglobin',
  ferritin: 'Ferritin',
  tsh: 'TSH',
  glucose: 'Glucose',
  vitaminD: 'Vitamin D',
  vitaminB12: 'Vitamin B12',
  crp: 'CRP',
  creatinine: 'Creatinine',
  egfr: 'eGFR',
  leukocytes: 'Leukocytes',
  platelets: 'Platelets',
};

export function biomarkerLabel(key: string) {
  return BIOMARKER_LABELS[key] ?? key.toUpperCase();
}
