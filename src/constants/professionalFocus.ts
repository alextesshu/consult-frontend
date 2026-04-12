export const professionalFocusValues = [
  'psychologist',
  'psychotherapist',
  'coach',
  'mentor',
  'consultant',
  'teacher',
  'other',
] as const

export type ProfessionalFocus = (typeof professionalFocusValues)[number]

export type ProfessionalFocusOption = {
  value: ProfessionalFocus
  label: string
}

export const professionalFocusOptions: readonly ProfessionalFocusOption[] = [
  { value: 'psychologist', label: 'Психолог' },
  { value: 'psychotherapist', label: 'Психотерапевт' },
  { value: 'coach', label: 'Коуч' },
  { value: 'mentor', label: 'Ментор' },
  { value: 'consultant', label: 'Консультант' },
  { value: 'teacher', label: 'Викладач' },
  { value: 'other', label: 'Інше' },
]

const professionalFocusValueSet = new Set<string>(professionalFocusValues)

export function normalizeProfessionalFocus(value: unknown): ProfessionalFocus | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  return professionalFocusValueSet.has(normalized) ? (normalized as ProfessionalFocus) : null
}
