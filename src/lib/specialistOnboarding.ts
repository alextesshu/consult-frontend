import type { SpecialistOnboardingState } from './api'

type OnboardingStepKey = 'profile_core' | 'availability' | 'public_profile' | 'inbound_readiness'

type NormalizedCodeItem = {
  code: string
  defaultMessage: string
}

type NormalizedAction = {
  ctaCode: string
  ctaTarget: string
  defaultMessage: string
}

export type NormalizedOnboardingState = {
  readiness: boolean
  missingItems: NormalizedCodeItem[]
  warnings: NormalizedCodeItem[]
  nextActions: NormalizedAction[]
  primaryCtaCode: string
  ctaTarget: string
}

export type OnboardingViewStep = {
  key: OnboardingStepKey
  title: string
  done: boolean
  hint: string
}

export type OnboardingCta = {
  code: string
  label: string
  to: string
}

export type SpecialistOnboardingViewModel = {
  readiness: boolean
  steps: OnboardingViewStep[]
  missingItems: string[]
  warnings: string[]
  nextActions: OnboardingCta[]
  primaryCta: OnboardingCta | null
}

const UNKNOWN_MISSING_ITEM_COPY = 'Complete this profile requirement.'
const UNKNOWN_WARNING_COPY = 'Review this profile item for correct public visibility.'
const UNKNOWN_CTA_COPY = 'Continue setup'

export const MISSING_ITEM_COPY: Record<string, string> = {
  PROFILE_CORE_INCOMPLETE: 'Complete your core profile: name, specialization, languages, and description.',
  AVAILABILITY_NOT_CONFIGURED: 'Configure availability rules so clients can book sessions.',
  MISSING_FUTURE_SLOTS: 'Add future open slots so clients can choose a time.',
  PUBLIC_PROFILE_DISABLED: 'Enable your public profile to be visible in catalog and by direct link.',
  INBOUND_READINESS_INCOMPLETE: 'Set up inbound contact channels and first-response readiness.',
}

export const WARNING_CODE_COPY: Record<string, string> = {
  PUBLIC_MEDIA_VISIBILITY_INCONSISTENT: 'Some public media is currently unavailable on your public profile.',
  PUBLIC_MEDIA_HIDDEN: 'Media is hidden on your public profile. Check media visibility toggles.',
  INBOUND_CONTACT_CHANNELS_WEAK: 'Clients may have difficulty reaching you. Add reliable contact channels.',
}

export const PRIMARY_CTA_CODE_COPY: Record<string, string> = {
  COMPLETE_PROFILE_CORE: 'Complete profile',
  CONFIGURE_AVAILABILITY: 'Configure availability',
  ENABLE_PUBLIC_PROFILE: 'Enable public profile',
  CONFIGURE_INBOUND_READINESS: 'Configure inbound readiness',
  REVIEW_ONBOARDING: 'Review readiness',
}

export const CTA_TARGET_ROUTE_KEYS: Record<string, string> = {
  CABINET_PROFILE: '/cabinet/profile',
  CABINET_AVAILABILITY_RULES: '/cabinet/availability-rules',
  CABINET_SLOTS: '/cabinet/slots',
  CABINET_INQUIRIES: '/cabinet/inquiries',
  CABINET_SETTINGS: '/cabinet/settings',
  CABINET_DASHBOARD: '/cabinet',
}

const STEP_META: Array<{ key: OnboardingStepKey; title: string; hint: string; missingCodes: string[] }> = [
  {
    key: 'profile_core',
    title: 'Profile core',
    hint: 'Name, specialization, languages, description, contacts.',
    missingCodes: ['PROFILE_CORE_INCOMPLETE'],
  },
  {
    key: 'availability',
    title: 'Availability',
    hint: 'Schedule and rules used for booking.',
    missingCodes: ['AVAILABILITY_NOT_CONFIGURED', 'MISSING_FUTURE_SLOTS'],
  },
  {
    key: 'public_profile',
    title: 'Public profile',
    hint: 'Visibility in catalog and direct-link mode.',
    missingCodes: ['PUBLIC_PROFILE_DISABLED'],
  },
  {
    key: 'inbound_readiness',
    title: 'Inbound readiness',
    hint: 'First-contact channels and fast intake start.',
    missingCodes: ['INBOUND_READINESS_INCOMPLETE'],
  },
]

function normalizeCodeItem(value: unknown): NormalizedCodeItem | null {
  if (typeof value === 'string' && value.trim()) {
    return { code: value.trim(), defaultMessage: '' }
  }
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const codeRaw = source.code ?? source.item_code ?? source.key
  if (typeof codeRaw !== 'string' || !codeRaw.trim()) return null
  const defaultMessageRaw = source.default_message
  return {
    code: codeRaw.trim(),
    defaultMessage: typeof defaultMessageRaw === 'string' ? defaultMessageRaw.trim() : '',
  }
}

function normalizeAction(value: unknown): NormalizedAction | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const ctaCodeRaw = source.cta_code ?? source.primary_cta_code ?? source.code
  const ctaTargetRaw = source.cta_target ?? source.target
  const defaultMessageRaw = source.default_message
  return {
    ctaCode: typeof ctaCodeRaw === 'string' ? ctaCodeRaw.trim() : '',
    ctaTarget: typeof ctaTargetRaw === 'string' ? ctaTargetRaw.trim() : '',
    defaultMessage: typeof defaultMessageRaw === 'string' ? defaultMessageRaw.trim() : '',
  }
}

export function normalizeOnboardingState(raw: unknown): NormalizedOnboardingState | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as SpecialistOnboardingState & Record<string, unknown>

  const missingItems = (Array.isArray(source.missing_items) ? source.missing_items : [])
    .map((item) => normalizeCodeItem(item))
    .filter((item): item is NormalizedCodeItem => Boolean(item))

  const warnings = (Array.isArray(source.warnings) ? source.warnings : [])
    .map((item) => normalizeCodeItem(item))
    .filter((item): item is NormalizedCodeItem => Boolean(item))

  const nextActions = (Array.isArray(source.next_actions) ? source.next_actions : [])
    .map((item) => normalizeAction(item))
    .filter((item): item is NormalizedAction => Boolean(item))

  const primaryCtaCodeRaw = source.primary_cta_code
  const ctaTargetRaw = source.cta_target
  const readinessRaw =
    typeof source.readiness === 'boolean'
      ? source.readiness
      : typeof source.is_ready === 'boolean'
        ? source.is_ready
        : missingItems.length === 0

  return {
    readiness: readinessRaw,
    missingItems,
    warnings,
    nextActions,
    primaryCtaCode: typeof primaryCtaCodeRaw === 'string' ? primaryCtaCodeRaw.trim() : '',
    ctaTarget: typeof ctaTargetRaw === 'string' ? ctaTargetRaw.trim() : '',
  }
}

function toMissingCopy(item: NormalizedCodeItem): string {
  return MISSING_ITEM_COPY[item.code] || item.defaultMessage || UNKNOWN_MISSING_ITEM_COPY
}

function toWarningCopy(item: NormalizedCodeItem): string {
  return WARNING_CODE_COPY[item.code] || item.defaultMessage || UNKNOWN_WARNING_COPY
}

function toCtaLabel(code: string, fallbackMessage: string) {
  return PRIMARY_CTA_CODE_COPY[code] || fallbackMessage || UNKNOWN_CTA_COPY
}

function toRoutePath(routeKey: string) {
  return CTA_TARGET_ROUTE_KEYS[routeKey] || ''
}

export function buildSpecialistOnboardingViewModel(
  normalized: NormalizedOnboardingState
): SpecialistOnboardingViewModel {
  const missingCodes = new Set(normalized.missingItems.map((item) => item.code))

  const steps: OnboardingViewStep[] = STEP_META.map((step) => ({
    key: step.key,
    title: step.title,
    hint: step.hint,
    done: !step.missingCodes.some((code) => missingCodes.has(code)),
  }))

  const nextActions: OnboardingCta[] = normalized.nextActions
    .map((action) => {
      const to = toRoutePath(action.ctaTarget)
      if (!to) return null
      return {
        code: action.ctaCode,
        label: toCtaLabel(action.ctaCode, action.defaultMessage),
        to,
      }
    })
    .filter((action): action is OnboardingCta => Boolean(action))

  let primaryCta: OnboardingCta | null = null
  const primaryTargetPath = toRoutePath(normalized.ctaTarget)
  if (primaryTargetPath) {
    primaryCta = {
      code: normalized.primaryCtaCode,
      label: toCtaLabel(normalized.primaryCtaCode, ''),
      to: primaryTargetPath,
    }
  } else if (nextActions.length > 0) {
    primaryCta = nextActions[0] || null
  }

  return {
    readiness: normalized.readiness,
    steps,
    missingItems: normalized.missingItems.map(toMissingCopy),
    warnings: normalized.warnings.map(toWarningCopy),
    nextActions,
    primaryCta,
  }
}

