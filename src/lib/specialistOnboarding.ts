import type { SpecialistOnboardingState } from './api'

type OnboardingStepKey =
  | 'display_name'
  | 'description'
  | 'base_price'
  | 'client_entry_path'
  | 'public_profile'
  | 'public_link'
  | 'profile_core'
  | 'availability'
  | 'inbound_readiness'

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
  publicDisplayNameExists: boolean | null
  basicDescriptionExists: boolean | null
  standardPriceConfigured: boolean | null
  clientEntryPathExists: boolean | null
  hasFutureSlots: boolean | null
  publicProfileEnabled: boolean | null
  profileSlugExists: boolean | null
  publicProfileLinkAvailable: boolean | null
  publicBookingMode: string
  showPublicAvailability: boolean | null
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
  publicProfilePath: string
}

export type OnboardingViewStep = {
  key: OnboardingStepKey
  title: string
  done: boolean
  hint: string
  to: string
  actionLabel: string
}

export type OnboardingCta = {
  code: string
  label: string
  to: string
}

export type SpecialistOnboardingViewModel = {
  readiness: boolean
  status: 'ready' | 'closed' | 'needs_completion'
  statusLabel: string
  helper: string
  steps: OnboardingViewStep[]
  missingItems: string[]
  missingSummary: string
  warnings: string[]
  nextActions: OnboardingCta[]
  primaryCta: OnboardingCta | null
  publicProfilePath: string
  publicProfileLinkAvailable: boolean
}

const UNKNOWN_MISSING_ITEM_COPY = 'Перевірте цей пункт профілю.'
const UNKNOWN_WARNING_COPY = 'Перевірте налаштування профілю.'
const UNKNOWN_CTA_COPY = 'Продовжити налаштування'

export const MISSING_ITEM_COPY: Record<string, string> = {
  MISSING_DISPLAY_NAME: 'публічне імʼя',
  MISSING_DESCRIPTION: 'опис',
  MISSING_BASE_PRICE: 'базова ціна',
  MISSING_CLIENT_ENTRY_PATH: 'спосіб першого звернення',
  PUBLIC_PROFILE_DISABLED: 'публікація профілю',
  MISSING_PUBLIC_PROFILE_LINK: 'публічне посилання',
}

export const WARNING_CODE_COPY: Record<string, string> = {
  PROFILE_CORE_INCOMPLETE: 'Заповніть кілька основних пунктів, щоб клієнту було зрозуміло, як до вас звернутися.',
  CLIENT_ENTRY_PATH_MISSING: 'Оберіть спосіб першого звернення або додайте вікна для запису.',
  PUBLIC_PROFILE_OFF: 'Опублікуйте профіль, коли основні дані будуть готові.',
  PUBLIC_PROFILE_LINK_MISSING: 'Публічне посилання стане доступним після публікації профілю та наявності слага.',
}

export const PRIMARY_CTA_CODE_COPY: Record<string, string> = {
  COMPLETE_PROFILE: 'Заповнити профіль',
  ADD_AVAILABILITY: 'Налаштувати час',
  OPEN_PUBLIC_PROFILE: 'Опублікувати',
  VIEW_PUBLIC_PROFILE: 'Переглянути публічний профіль',
}

export const CTA_TARGET_ROUTE_KEYS: Record<string, string> = {
  CABINET_PROFILE: '/cabinet/profile',
  CABINET_AVAILABILITY: '/cabinet/slots?tab=availability',
  CABINET_PUBLIC_PROFILE: '/cabinet/profile',
  PUBLIC_PROFILE_VIEW: '/public',
}

const STEP_META: Array<{
  key: OnboardingStepKey
  title: string
  hint: string
  actionLabel: string
  fallbackRoute: string
}> = [
  {
    key: 'display_name',
    title: 'Додайте публічне імʼя',
    hint: 'Це імʼя клієнт бачить на публічній сторінці.',
    actionLabel: 'Заповнити профіль',
    fallbackRoute: '/cabinet/profile',
  },
  {
    key: 'description',
    title: 'Заповніть короткий опис',
    hint: 'Коротко поясніть, з чим до вас можна звертатися.',
    actionLabel: 'Додати опис',
    fallbackRoute: '/cabinet/profile',
  },
  {
    key: 'base_price',
    title: 'Налаштуйте базову ціну',
    hint: 'Вкажіть вартість стандартної консультації.',
    actionLabel: 'Налаштувати ціну',
    fallbackRoute: '/cabinet/profile',
  },
  {
    key: 'client_entry_path',
    title: 'Оберіть спосіб першого звернення',
    hint: 'Клієнт має розуміти, як залишити запит або обрати час.',
    actionLabel: 'Налаштувати звернення',
    fallbackRoute: '/cabinet/slots?tab=settings',
  },
  {
    key: 'public_profile',
    title: 'Опублікуйте профіль',
    hint: 'Публікація відкриває сторінку для клієнтів за прямим посиланням.',
    actionLabel: 'Опублікувати',
    fallbackRoute: '/cabinet/profile',
  },
  {
    key: 'public_link',
    title: 'Публічне посилання доступне',
    hint: 'Після публікації профіль можна переглянути за окремим посиланням.',
    actionLabel: 'Переглянути профіль',
    fallbackRoute: '/public',
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

function readBool(source: Record<string, unknown>, key: string): boolean | null {
  return typeof source[key] === 'boolean' ? source[key] : null
}

function normalizeReadiness(source: Record<string, unknown>): NormalizedReadiness {
  const readiness =
    typeof source.readiness === 'object' && source.readiness
      ? (source.readiness as Record<string, unknown>)
      : source

  return {
    profileCoreReady: readBool(readiness, 'profile_core_ready'),
    publicDisplayNameExists: readBool(readiness, 'public_display_name_exists'),
    basicDescriptionExists: readBool(readiness, 'basic_description_exists'),
    standardPriceConfigured: readBool(readiness, 'standard_price_configured'),
    clientEntryPathExists: readBool(readiness, 'client_entry_path_exists'),
    hasFutureSlots: readBool(readiness, 'has_future_slots'),
    publicProfileEnabled: readBool(readiness, 'public_profile_enabled'),
    profileSlugExists: readBool(readiness, 'profile_slug_exists'),
    publicProfileLinkAvailable: readBool(readiness, 'public_profile_link_available'),
    publicBookingMode: typeof readiness.public_booking_mode === 'string' ? readiness.public_booking_mode : '',
    showPublicAvailability: readBool(readiness, 'show_public_availability'),
    readyForInboundIntent:
      readBool(readiness, 'ready_for_inbound_intent') ?? readBool(source, 'ready_for_inbound_intent'),
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
  const publicProfilePathRaw = source.public_profile_path

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
    publicProfilePath: typeof publicProfilePathRaw === 'string' ? publicProfilePathRaw.trim() : '',
  }
}

function toMissingCopy(item: NormalizedCodeItem): string {
  return MISSING_ITEM_COPY[item.code] || item.defaultMessage || UNKNOWN_MISSING_ITEM_COPY
}

function toWarningCopy(item: NormalizedCodeItem): string {
  return WARNING_CODE_COPY[item.code] || item.defaultMessage || UNKNOWN_WARNING_COPY
}

function toCtaLabel(code: string) {
  return PRIMARY_CTA_CODE_COPY[code] || UNKNOWN_CTA_COPY
}

function toRoutePath(routeKey: string) {
  return CTA_TARGET_ROUTE_KEYS[routeKey] || ''
}

function doneFromReadiness(
  value: boolean | null,
  missingCodes: Set<string>,
  missingCode: string
) {
  return value ?? !missingCodes.has(missingCode)
}

function sentenceFromItems(items: string[]) {
  if (!items.length) return ''
  return `Що залишилось: ${items.join(', ')}.`
}

export function buildSpecialistOnboardingViewModel(
  normalized: NormalizedOnboardingState
): SpecialistOnboardingViewModel {
  const missingCodes = new Set(normalized.missingItems.map((item) => item.code))
  const details = normalized.readinessDetails
  const publicProfilePath = normalized.publicProfilePath

  const doneByKey: Record<OnboardingStepKey, boolean> = {
    display_name: doneFromReadiness(
      details.publicDisplayNameExists,
      missingCodes,
      'MISSING_DISPLAY_NAME'
    ),
    description: doneFromReadiness(
      details.basicDescriptionExists,
      missingCodes,
      'MISSING_DESCRIPTION'
    ),
    base_price: doneFromReadiness(
      details.standardPriceConfigured,
      missingCodes,
      'MISSING_BASE_PRICE'
    ),
    client_entry_path: doneFromReadiness(
      details.clientEntryPathExists,
      missingCodes,
      'MISSING_CLIENT_ENTRY_PATH'
    ),
    public_profile: doneFromReadiness(
      details.publicProfileEnabled,
      missingCodes,
      'PUBLIC_PROFILE_DISABLED'
    ),
    public_link: doneFromReadiness(
      details.publicProfileLinkAvailable,
      missingCodes,
      'MISSING_PUBLIC_PROFILE_LINK'
    ),
    profile_core: normalized.readiness,
    availability: details.hasFutureSlots ?? false,
    inbound_readiness: normalized.readiness,
  }

  const routeByStep: Record<OnboardingStepKey, string> = {
    display_name: '/cabinet/profile',
    description: '/cabinet/profile',
    base_price: '/cabinet/profile',
    client_entry_path:
      details.publicBookingMode === 'direct_booking' &&
      details.showPublicAvailability === true &&
      details.hasFutureSlots === false
        ? '/cabinet/slots?tab=availability'
        : '/cabinet/slots?tab=settings',
    public_profile: '/cabinet/profile',
    public_link: publicProfilePath || '/public',
    profile_core: '/cabinet/profile',
    availability: '/cabinet/slots?tab=availability',
    inbound_readiness: '/cabinet/inquiries',
  }

  const steps: OnboardingViewStep[] = STEP_META.map((step) => ({
    key: step.key,
    title: step.title,
    hint: step.hint,
    done: doneByKey[step.key],
    to: routeByStep[step.key] || step.fallbackRoute,
    actionLabel: step.actionLabel,
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

  const missingItems = normalized.missingItems.map(toMissingCopy)
  const publicProfileEnabled = doneByKey.public_profile
  const status: SpecialistOnboardingViewModel['status'] = normalized.readiness
    ? 'ready'
    : publicProfileEnabled
      ? 'needs_completion'
      : 'closed'

  return {
    readiness: normalized.readiness,
    status,
    statusLabel:
      status === 'ready'
        ? 'Профіль готовий до перших запитів'
        : status === 'closed'
          ? 'Профіль ще не відкритий'
          : 'Профіль відкритий, але його варто доповнити',
    helper:
      'Заповніть кілька основних пунктів, щоб клієнту було зрозуміло, як до вас звернутися.',
    steps,
    missingItems,
    missingSummary: sentenceFromItems(missingItems),
    warnings: normalized.warnings.map(toWarningCopy),
    nextActions: secondaryActions,
    primaryCta,
    publicProfilePath,
    publicProfileLinkAvailable: doneByKey.public_link && Boolean(publicProfilePath),
  }
}
