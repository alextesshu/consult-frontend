import type { SpecialistOnboardingState } from './api'

type OnboardingStepKey = 'profile_core' | 'availability' | 'public_profile' | 'inbound_readiness'

type NormalizedCodeItem = {
  code: string
  defaultMessage: string
}

type NormalizedAction = {
  ctaCode: string
  ctaTarget: string
  priority: number | null
  defaultMessage: string
}

type NormalizedReadiness = {
  profileCoreReady: boolean | null
  hasFutureSlots: boolean | null
  publicProfileEnabled: boolean | null
  readyForInboundIntent: boolean | null
}

export type NormalizedOnboardingState = {
  readiness: boolean
  readinessDetails: NormalizedReadiness
  missingItems: NormalizedCodeItem[]
  warnings: NormalizedCodeItem[]
  nextActions: NormalizedAction[]
  primaryCtaCode: string
  primaryCtaTarget: string
}

export type OnboardingViewStep = {
  key: OnboardingStepKey
  title: string
  done: boolean
  hint: string
  to: string
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

const UNKNOWN_MISSING_ITEM_COPY = 'Завершіть цей пункт профілю.'
const UNKNOWN_WARNING_COPY = 'Перевірте цей пункт профілю.'
const UNKNOWN_CTA_COPY = 'Продовжити налаштування'

export const MISSING_ITEM_COPY: Record<string, string> = {
  MISSING_DISPLAY_NAME: 'Додайте публічне імʼя спеціаліста.',
  MISSING_SPECIALIZATION: 'Додайте щонайменше одну спеціалізацію.',
  MISSING_CONTACT_CHANNEL: 'Додайте щонайменше один видимий канал звʼязку.',
  MISSING_SESSION_FORMAT: 'Увімкніть хоча б один формат сесій (онлайн або офлайн).',
  MISSING_FUTURE_SLOTS: 'За потреби додайте доступний час для прямого бронювання.',
  PUBLIC_PROFILE_DISABLED: 'Увімкніть публічний профіль, щоб сторінка була доступна за прямим посиланням.',
}

export const WARNING_CODE_COPY: Record<string, string> = {
  PROFILE_CORE_INCOMPLETE: 'Заповніть базові дані профілю, щоб отримувати вхідні звернення.',
  PUBLISHED_WITHOUT_BOOKABLE_TIME: 'Профіль опубліковано. Клієнти можуть залишати запити; пряме бронювання потребує доступного часу.',
  NO_BOOKABLE_TIME: 'Доступний час потрібен лише для прямого бронювання. Запити з публічного профілю можуть працювати без нього.',
  PUBLIC_PROFILE_OFF: 'Увімкніть публічний профіль, щоб почати отримувати вхідні звернення.',
}

export const PRIMARY_CTA_CODE_COPY: Record<string, string> = {
  COMPLETE_PROFILE: 'Заповнити профіль',
  ADD_AVAILABILITY: 'Додати вільний час',
  OPEN_PUBLIC_PROFILE: 'Налаштувати публічний профіль',
  VIEW_PUBLIC_PROFILE: 'Переглянути публічний профіль',
}

export const CTA_TARGET_ROUTE_KEYS: Record<string, string> = {
  CABINET_PROFILE: '/cabinet/profile',
  CABINET_AVAILABILITY: '/cabinet/availability-rules',
  CABINET_PUBLIC_PROFILE: '/public',
  PUBLIC_PROFILE_VIEW: '/public',
}

const PROFILE_CORE_MISSING_CODES = [
  'MISSING_DISPLAY_NAME',
  'MISSING_SPECIALIZATION',
  'MISSING_CONTACT_CHANNEL',
  'MISSING_SESSION_FORMAT',
]

const STEP_META: Array<{ key: OnboardingStepKey; title: string; hint: string }> = [
  {
    key: 'profile_core',
    title: 'Базовий профіль',
    hint: 'Імʼя, спеціалізація, канали звʼязку та формат сесій.',
  },
  {
    key: 'availability',
    title: 'Доступність',
    hint: 'Опційний доступний час для прямого бронювання.',
  },
  {
    key: 'public_profile',
    title: 'Публічний профіль',
    hint: 'Сторінка за прямим посиланням. Видимість у пошуку керується окремо.',
  },
  {
    key: 'inbound_readiness',
    title: 'Готовність до звернень',
    hint: 'Готовність профілю до першого контакту з клієнтом.',
  },
]

const STEP_ROUTE_BY_KEY: Record<OnboardingStepKey, string> = {
  profile_core: '/cabinet/profile',
  availability: '/cabinet/availability-rules',
  public_profile: '/public',
  inbound_readiness: '/cabinet/inquiries',
}

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
  const ctaCodeRaw = source.cta_code ?? source.code ?? source.primary_cta_code
  const ctaTargetRaw = source.cta_target ?? source.target
  const priorityRaw = source.priority
  const defaultMessageRaw = source.default_message
  return {
    ctaCode: typeof ctaCodeRaw === 'string' ? ctaCodeRaw.trim() : '',
    ctaTarget: typeof ctaTargetRaw === 'string' ? ctaTargetRaw.trim() : '',
    priority: typeof priorityRaw === 'number' ? priorityRaw : null,
    defaultMessage: typeof defaultMessageRaw === 'string' ? defaultMessageRaw.trim() : '',
  }
}

function normalizeReadiness(source: Record<string, unknown>): NormalizedReadiness {
  if (typeof source.readiness === 'object' && source.readiness) {
    const readiness = source.readiness as Record<string, unknown>
    return {
      profileCoreReady:
        typeof readiness.profile_core_ready === 'boolean' ? readiness.profile_core_ready : null,
      hasFutureSlots: typeof readiness.has_future_slots === 'boolean' ? readiness.has_future_slots : null,
      publicProfileEnabled:
        typeof readiness.public_profile_enabled === 'boolean' ? readiness.public_profile_enabled : null,
      readyForInboundIntent:
        typeof readiness.ready_for_inbound_intent === 'boolean'
          ? readiness.ready_for_inbound_intent
          : null,
    }
  }

  return {
    profileCoreReady: null,
    hasFutureSlots: null,
    publicProfileEnabled: null,
    readyForInboundIntent:
      typeof source.ready_for_inbound_intent === 'boolean' ? source.ready_for_inbound_intent : null,
  }
}

export function normalizeOnboardingState(raw: unknown): NormalizedOnboardingState | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as SpecialistOnboardingState & Record<string, unknown>
  const readinessDetails = normalizeReadiness(source)

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
  const primaryCtaCode = typeof primaryCtaCodeRaw === 'string' ? primaryCtaCodeRaw.trim() : ''
  const primaryTargetFromAction = nextActions.find(
    (action) => action.ctaCode && action.ctaCode === primaryCtaCode
  )?.ctaTarget
  const primaryTargetRaw = source.cta_target ?? primaryTargetFromAction ?? nextActions[0]?.ctaTarget

  const readinessRaw =
    readinessDetails.readyForInboundIntent ??
    (typeof source.readiness === 'boolean' ? source.readiness : null) ??
    (typeof source.is_ready === 'boolean' ? source.is_ready : null) ??
    false

  return {
    readiness: readinessRaw,
    readinessDetails,
    missingItems,
    warnings,
    nextActions,
    primaryCtaCode,
    primaryCtaTarget: typeof primaryTargetRaw === 'string' ? primaryTargetRaw.trim() : '',
  }
}

function toMissingCopy(item: NormalizedCodeItem): string {
  return MISSING_ITEM_COPY[item.code] || UNKNOWN_MISSING_ITEM_COPY
}

function toWarningCopy(item: NormalizedCodeItem): string {
  return WARNING_CODE_COPY[item.code] || UNKNOWN_WARNING_COPY
}

function toCtaLabel(code: string) {
  return PRIMARY_CTA_CODE_COPY[code] || UNKNOWN_CTA_COPY
}

function toRoutePath(routeKey: string) {
  return CTA_TARGET_ROUTE_KEYS[routeKey] || ''
}

export function buildSpecialistOnboardingViewModel(
  normalized: NormalizedOnboardingState
): SpecialistOnboardingViewModel {
  const missingCodes = new Set(normalized.missingItems.map((item) => item.code))

  const isProfileCoreDone =
    normalized.readinessDetails.profileCoreReady ??
    !PROFILE_CORE_MISSING_CODES.some((code) => missingCodes.has(code))
  const isAvailabilityDone =
    normalized.readinessDetails.hasFutureSlots ?? !missingCodes.has('MISSING_FUTURE_SLOTS')
  const isPublicProfileDone =
    normalized.readinessDetails.publicProfileEnabled ?? !missingCodes.has('PUBLIC_PROFILE_DISABLED')
  const isInboundDone =
    normalized.readinessDetails.readyForInboundIntent ??
    (isProfileCoreDone && isAvailabilityDone && isPublicProfileDone)

  const stepDoneByKey: Record<OnboardingStepKey, boolean> = {
    profile_core: isProfileCoreDone,
    availability: isAvailabilityDone,
    public_profile: isPublicProfileDone,
    inbound_readiness: isInboundDone,
  }

  const steps: OnboardingViewStep[] = STEP_META.map((step) => ({
    key: step.key,
    title: step.title,
    hint: step.hint,
    done: stepDoneByKey[step.key],
    to: STEP_ROUTE_BY_KEY[step.key],
  }))

  const nextActions: OnboardingCta[] = normalized.nextActions
    .map((action) => {
      const to = toRoutePath(action.ctaTarget)
      if (!to) return null
      return {
        code: action.ctaCode,
        label: toCtaLabel(action.ctaCode),
        to,
      }
    })
    .filter((action): action is OnboardingCta => Boolean(action))

  let primaryCta: OnboardingCta | null = null
  const primaryTargetPath = toRoutePath(normalized.primaryCtaTarget)

  if (normalized.primaryCtaCode && primaryTargetPath) {
    primaryCta = {
      code: normalized.primaryCtaCode,
      label: toCtaLabel(normalized.primaryCtaCode),
      to: primaryTargetPath,
    }
  } else {
    const actionMatch = nextActions.find((action) => action.code === normalized.primaryCtaCode)
    primaryCta = actionMatch || nextActions[0] || null
  }

  const secondaryActions = nextActions.filter((action) => {
    if (!primaryCta) return true
    return !(action.code === primaryCta.code && action.to === primaryCta.to)
  })

  return {
    readiness: normalized.readiness,
    steps,
    missingItems: normalized.missingItems.map(toMissingCopy),
    warnings: normalized.warnings.map(toWarningCopy),
    nextActions: secondaryActions,
    primaryCta,
  }
}
