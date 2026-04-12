export const professionalFocusValues = [
  'psychological_practice',
  'coaching_practice',
  'mentoring_practice',
  'consulting_practice',
  'teaching_practice',
  'other',
] as const

export type ProfessionalFocus = (typeof professionalFocusValues)[number]

export type ProfessionalFocusOption = {
  value: ProfessionalFocus
  label: string
}

export const professionalFocusOptions: readonly ProfessionalFocusOption[] = [
  { value: 'psychological_practice', label: 'Психологічна практика' },
  { value: 'coaching_practice', label: 'Коучингова практика' },
  { value: 'mentoring_practice', label: 'Менторська практика' },
  { value: 'consulting_practice', label: 'Консультаційна практика' },
  { value: 'teaching_practice', label: 'Викладацька практика' },
  { value: 'other', label: 'Інша практика' },
]

const professionalFocusValueSet = new Set<string>(professionalFocusValues)

export function normalizeProfessionalFocus(value: unknown): ProfessionalFocus | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  return professionalFocusValueSet.has(normalized) ? (normalized as ProfessionalFocus) : null
}
