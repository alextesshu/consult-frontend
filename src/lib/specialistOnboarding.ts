import type { PublicProfileReadiness, SpecialistOnboardingState } from './api'

type OnboardingStepKey =
  | 'display_name'
  | 'description'
  | 'topics'
  | 'work_format'
  | 'base_price'
  | 'client_entry_path'

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
  hardRequirementDone: Record<OnboardingStepKey, boolean>
  profileCoreReady: boolean | null
  publicDisplayNameExists: boolean | null
  basicDescriptionExists: boolean | null
  topicsConfigured: boolean | null
  workFormatConfigured: boolean | null
  standardPriceConfigured: boolean | null
  clientEntryPathExists: boolean | null
  hasFutureSlots: boolean | null
  publicProfileEnabled: boolean | null
  isSearchVisible: boolean | null
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
  publicationSummary: string
  warnings: string[]
  nextActions: OnboardingCta[]
  primaryCta: OnboardingCta | null
  publicProfilePath: string
  publicProfileLinkAvailable: boolean
}

const UNKNOWN_WARNING_COPY = 'Перевірте налаштування профілю.'
const UNKNOWN_CTA_COPY = 'Продовжити налаштування'

export const MISSING_ITEM_COPY: Record<string, string> = {
  MISSING_DISPLAY_NAME: 'публічне ім’я',
  public_display_name: 'публічне ім’я',
  display_name: 'публічне ім’я',
  MISSING_DESCRIPTION: 'короткий опис',
  description: 'короткий опис',
  about: 'короткий опис',
  MISSING_TOPICS: 'теми й запити',
  topics: 'теми й запити',
  request_topics: 'теми й запити',
  MISSING_WORK_FORMAT: 'формат роботи',
  work_format: 'формат роботи',
  format: 'формат роботи',
  MISSING_BASE_PRICE: 'базова ціна',
  base_price: 'базова ціна',
  price_decision: 'базова ціна',
  standard_price: 'базова ціна',
  MISSING_CLIENT_ENTRY_PATH: 'спосіб першого звернення',
  client_entry_path: 'спосіб першого звернення',
  first_contact: 'спосіб першого звернення',
  PUBLIC_PROFILE_DISABLED: 'публікація профілю',
  MISSING_PUBLIC_PROFILE_LINK: 'публічне посилання',
}

export const WARNING_CODE_COPY: Record<string, string> = {
  PROFILE_CORE_INCOMPLETE:
    'Заповніть кілька основних пунктів, щоб клієнту було зрозуміло, як до вас звернутися.',
  CLIENT_ENTRY_PATH_MISSING:
    'Оберіть спосіб першого звернення або додайте вікна для запису.',
  PUBLIC_PROFILE_OFF: 'Опублікуйте профіль, коли основні дані будуть готові.',
  PUBLIC_PROFILE_LINK_MISSING:
    'Публічне посилання стане доступним після публікації профілю та наявності слага.',
}

export const PRIMARY_CTA_CODE_COPY: Record<string, string> = {
  COMPLETE_PROFILE: 'Заповнити профіль',
  ADD_AVAILABILITY: 'Налаштувати час',
  OPEN_PUBLIC_PROFILE: 'Опублікувати',
  VIEW_PUBLIC_PROFILE: 'Переглянути публічний профіль',
}

export const CTA_TARGET_ROUTE_KEYS: Record<string, string> = {
  CABINET_PROFILE: '/cabinet/profile',
  CABINET_AVAILABILITY: '/cabinet/slots?tab=availability&focus=create-availability',
  CABINET_PUBLIC_PROFILE: '/cabinet/profile',
  PUBLIC_PROFILE_VIEW: '/public',
}

const STEP_META: Array<{
  key: OnboardingStepKey
  title: string
  compactTitle: string
  missingCopy: string
  hint: string
  actionLabel: string
  fallbackRoute: string
}> = [
  {
    key: 'display_name',
    title: 'Додайте публічне ім’я',
    compactTitle: 'Публічне ім’я',
    missingCopy: 'публічне ім’я',
    hint: 'Це ім’я клієнт бачить на публічній сторінці.',
    actionLabel: 'Заповнити профіль',
    fallbackRoute: '/cabinet/profile',
  },
  {
    key: 'description',
    title: 'Заповніть короткий опис',
    compactTitle: 'Короткий опис',
    missingCopy: 'короткий опис',
    hint: 'Коротко поясніть, з чим до вас можна звертатися.',
    actionLabel: 'Додати опис',
    fallbackRoute: '/cabinet/profile',
  },
  {
    key: 'topics',
    title: 'Додайте теми й запити',
    compactTitle: 'Теми й запити',
    missingCopy: 'теми й запити',
    hint: 'Позначте теми, з якими до вас можуть звертатися клієнти.',
    actionLabel: 'Додати теми',
    fallbackRoute: '/cabinet/profile',
  },
  {
    key: 'work_format',
    title: 'Оберіть формат роботи',
    compactTitle: 'Формат роботи',
    missingCopy: 'формат роботи',
    hint: 'Вкажіть, як ви проводите консультації.',
    actionLabel: 'Оновити формат',
    fallbackRoute: '/cabinet/profile',
  },
  {
    key: 'base_price',
    title: 'Налаштуйте базову ціну',
    compactTitle: 'Базова ціна',
    missingCopy: 'базова ціна',
    hint: 'Вкажіть вартість стандартної консультації або оберіть рішення щодо ціни.',
    actionLabel: 'Налаштувати ціну',
    fallbackRoute: '/cabinet/profile',
  },
  {
    key: 'client_entry_path',
    title: 'Оберіть спосіб першого звернення',
    compactTitle: 'Спосіб першого звернення',
    missingCopy: 'спосіб першого звернення',
    hint: 'Клієнт має розуміти, як залишити запит або обрати час.',
    actionLabel: 'Налаштувати звернення',
    fallbackRoute: '/cabinet/slots?tab=settings',
  },
]

const HARD_STEP_KEYS = STEP_META.map((step) => step.key)

const MISSING_CODE_TO_STEP: Record<string, OnboardingStepKey> = {
  MISSING_DISPLAY_NAME: 'display_name',
  public_display_name: 'display_name',
  display_name: 'display_name',
  MISSING_DESCRIPTION: 'description',
  description: 'description',
  about: 'description',
  MISSING_TOPICS: 'topics',
  topics: 'topics',
  request_topics: 'topics',
  MISSING_WORK_FORMAT: 'work_format',
  work_format: 'work_format',
  format: 'work_format',
  MISSING_BASE_PRICE: 'base_price',
  base_price: 'base_price',
  price_decision: 'base_price',
  standard_price: 'base_price',
  MISSING_CLIENT_ENTRY_PATH: 'client_entry_path',
  client_entry_path: 'client_entry_path',
  first_contact: 'client_entry_path',
}

const CANONICAL_ITEM_KEY_TO_STEP: Record<string, OnboardingStepKey> = {
  public_display_name: 'display_name',
  display_name: 'display_name',
  description: 'description',
  about: 'description',
  topics: 'topics',
  request_topics: 'topics',
  work_format: 'work_format',
  format: 'work_format',
  base_price: 'base_price',
  price_decision: 'base_price',
  standard_price: 'base_price',
  client_entry_path: 'client_entry_path',
  first_contact: 'client_entry_path',
}

function emptyHardRequirementDone(value = true): Record<OnboardingStepKey, boolean> {
  return {
    display_name: value,
    description: value,
    topics: value,
    work_format: value,
    base_price: value,
    client_entry_path: value,
  }
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

function readBool(source: Record<string, unknown>, key: string): boolean | null {
  return typeof source[key] === 'boolean' ? source[key] : null
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (!item || typeof item !== 'object') return ''
      const source = item as Record<string, unknown>
      const code = source.code ?? source.key ?? source.item_code
      return typeof code === 'string' ? code.trim() : ''
    })
    .filter(Boolean)
}

function normalizeStepKey(raw: unknown): OnboardingStepKey | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  return CANONICAL_ITEM_KEY_TO_STEP[raw.trim()] || MISSING_CODE_TO_STEP[raw.trim()] || null
}

function normalizeCanonicalItemDone(value: unknown): boolean | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const raw = source.complete ?? source.is_complete ?? source.done ?? source.ready
  return typeof raw === 'boolean' ? raw : null
}

function collectReadinessCandidates(source: Record<string, unknown>): Record<string, unknown>[] {
  const candidates: Record<string, unknown>[] = []
  const readiness =
    typeof source.readiness === 'object' && source.readiness
      ? (source.readiness as Record<string, unknown>)
      : null

  for (const candidate of [
    source.minimum_public_profile_readiness,
    source.public_profile_readiness,
    readiness?.minimum_public_profile_readiness,
    readiness?.public_profile_readiness,
    readiness,
    source,
  ]) {
    if (candidate && typeof candidate === 'object') {
      candidates.push(candidate as Record<string, unknown>)
    }
  }

  return candidates
}

function normalizeHardRequirementDone(
  source: Record<string, unknown>,
  missingItems: NormalizedCodeItem[]
): Record<OnboardingStepKey, boolean> {
  for (const candidate of collectReadinessCandidates(source)) {
    const hasCanonicalShape =
      Array.isArray(candidate.items) ||
      Array.isArray(candidate.missing_items) ||
      typeof candidate.is_ready === 'boolean'
    if (!hasCanonicalShape) continue

    const done = emptyHardRequirementDone(true)
    const itemKeys = new Set<OnboardingStepKey>()
    if (Array.isArray(candidate.items)) {
      for (const rawItem of candidate.items) {
        if (!rawItem || typeof rawItem !== 'object') continue
        const item = rawItem as Record<string, unknown>
        const stepKey = normalizeStepKey(item.key)
        const itemDone = normalizeCanonicalItemDone(item)
        if (!stepKey || itemDone === null) continue
        done[stepKey] = itemDone
        itemKeys.add(stepKey)
      }
    }

    for (const missingCode of readStringArray(candidate.missing_items)) {
      const stepKey = MISSING_CODE_TO_STEP[missingCode] || CANONICAL_ITEM_KEY_TO_STEP[missingCode]
      if (stepKey) done[stepKey] = false
    }

    if (typeof candidate.is_ready === 'boolean' && candidate.is_ready && itemKeys.size === 0) {
      return emptyHardRequirementDone(true)
    }

    return done
  }

  const readiness =
    typeof source.readiness === 'object' && source.readiness
      ? (source.readiness as Record<string, unknown>)
      : source
  if (
    !source.readiness &&
    typeof source.missing_items_count === 'number' &&
    source.missing_items_count > 0 &&
    missingItems.length === 0
  ) {
    return emptyHardRequirementDone(false)
  }
  const missingCodes = new Set(missingItems.map((item) => item.code))
  const fallback = emptyHardRequirementDone(true)

  fallback.display_name = readBool(readiness, 'public_display_name_exists') ?? !missingCodes.has('MISSING_DISPLAY_NAME')
  fallback.description = readBool(readiness, 'basic_description_exists') ?? !missingCodes.has('MISSING_DESCRIPTION')
  fallback.topics =
    readBool(readiness, 'topics_configured') ??
    !(missingCodes.has('MISSING_TOPICS') || missingCodes.has('topics') || missingCodes.has('request_topics'))
  fallback.work_format =
    readBool(readiness, 'work_format_configured') ??
    !(missingCodes.has('MISSING_WORK_FORMAT') || missingCodes.has('work_format') || missingCodes.has('format'))
  fallback.base_price = readBool(readiness, 'standard_price_configured') ?? !missingCodes.has('MISSING_BASE_PRICE')
  fallback.client_entry_path =
    readBool(readiness, 'client_entry_path_exists') ?? !missingCodes.has('MISSING_CLIENT_ENTRY_PATH')

  return fallback
}

function normalizeReadiness(
  source: Record<string, unknown>,
  missingItems: NormalizedCodeItem[]
): NormalizedReadiness {
  const readiness =
    typeof source.readiness === 'object' && source.readiness
      ? (source.readiness as Record<string, unknown>)
      : source

  return {
    hardRequirementDone: normalizeHardRequirementDone(source, missingItems),
    profileCoreReady: readBool(readiness, 'profile_core_ready'),
    publicDisplayNameExists: readBool(readiness, 'public_display_name_exists'),
    basicDescriptionExists: readBool(readiness, 'basic_description_exists'),
    topicsConfigured: readBool(readiness, 'topics_configured'),
    workFormatConfigured: readBool(readiness, 'work_format_configured'),
    standardPriceConfigured: readBool(readiness, 'standard_price_configured'),
    clientEntryPathExists: readBool(readiness, 'client_entry_path_exists'),
    hasFutureSlots: readBool(readiness, 'has_future_slots'),
    publicProfileEnabled:
      readBool(readiness, 'public_profile_enabled') ?? readBool(source, 'public_profile_enabled'),
    isSearchVisible: readBool(readiness, 'is_search_visible') ?? readBool(source, 'is_search_visible'),
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
  const source = raw as SpecialistOnboardingState &
    Partial<{
      minimum_public_profile_readiness: PublicProfileReadiness | null
      public_profile_readiness: PublicProfileReadiness | null
    }> &
    Record<string, unknown>

  const missingItems = (Array.isArray(source.missing_items) ? source.missing_items : [])
    .map((item) => normalizeCodeItem(item))
    .filter((item): item is NormalizedCodeItem => Boolean(item))

  const readinessDetails = normalizeReadiness(source, missingItems)

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
  const readiness = HARD_STEP_KEYS.every((key) => readinessDetails.hardRequirementDone[key])

  return {
    readiness,
    readinessDetails,
    missingItems,
    warnings,
    nextActions,
    primaryCtaCode,
    primaryCtaTarget: typeof primaryTargetRaw === 'string' ? primaryTargetRaw.trim() : '',
    publicProfilePath: typeof publicProfilePathRaw === 'string' ? publicProfilePathRaw.trim() : '',
  }
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

function sentenceFromItems(items: string[]) {
  if (!items.length) return ''
  return `Що залишилось: ${items.join(', ')}.`
}

function buildPublicationSummary(
  hardReady: boolean,
  publicProfileEnabled: boolean,
  isSearchVisible: boolean | null
) {
  if (!hardReady) {
    return publicProfileEnabled
      ? 'Профіль опублікований, але основні дані потрібно доповнити.'
      : 'Публікація стане доступною після заповнення основних даних.'
  }
  if (!publicProfileEnabled && isSearchVisible === true) {
    return 'Профіль ще не опублікований. Показ у пошуку стане доступним після публікації.'
  }
  if (!publicProfileEnabled) {
    return 'Основні дані готові. Опублікуйте профіль, щоб відкрити сторінку за прямим посиланням.'
  }
  if (isSearchVisible === true) {
    return 'Профіль опублікований і видимий у пошуку.'
  }
  return 'Профіль опублікований і доступний за прямим посиланням. У пошуку він не показується.'
}

function compactMissingItemsFromSteps(steps: OnboardingViewStep[]) {
  return steps
    .filter((step) => !step.done)
    .map((step) => STEP_META.find((meta) => meta.key === step.key)?.missingCopy || step.title)
}

export function buildSpecialistOnboardingViewModel(
  normalized: NormalizedOnboardingState
): SpecialistOnboardingViewModel {
  const details = normalized.readinessDetails
  const publicProfilePath = normalized.publicProfilePath

  const routeByStep: Record<OnboardingStepKey, string> = {
    display_name: '/cabinet/profile',
    description: '/cabinet/profile',
    topics: '/cabinet/profile',
    work_format: '/cabinet/profile',
    base_price: '/cabinet/profile',
    client_entry_path:
      details.publicBookingMode === 'direct_booking' &&
      details.showPublicAvailability === true &&
      details.hasFutureSlots === false
        ? '/cabinet/slots?tab=availability&focus=create-availability'
        : '/cabinet/slots?tab=settings',
  }

  const steps: OnboardingViewStep[] = STEP_META.map((step) => ({
    key: step.key,
    title: step.title,
    hint: step.hint,
    done: details.hardRequirementDone[step.key],
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

  const hardReady = steps.every((step) => step.done)
  if (!hardReady && primaryCta?.code === 'OPEN_PUBLIC_PROFILE') {
    primaryCta = {
      code: 'COMPLETE_PROFILE',
      label: toCtaLabel('COMPLETE_PROFILE'),
      to: CTA_TARGET_ROUTE_KEYS.CABINET_PROFILE || '/cabinet/profile',
    }
  }
  if (hardReady && details.publicProfileEnabled === false && !primaryCta) {
    primaryCta = {
      code: 'OPEN_PUBLIC_PROFILE',
      label: toCtaLabel('OPEN_PUBLIC_PROFILE'),
      to: CTA_TARGET_ROUTE_KEYS.CABINET_PUBLIC_PROFILE || '/cabinet/profile',
    }
  }

  const secondaryActions = nextActions.filter((action) => {
    if (!primaryCta) return true
    return !(action.code === primaryCta.code && action.to === primaryCta.to)
  })

  const publicProfileEnabled = details.publicProfileEnabled === true
  const status: SpecialistOnboardingViewModel['status'] = hardReady
    ? 'ready'
    : publicProfileEnabled
      ? 'needs_completion'
      : 'closed'
  const missingItems = compactMissingItemsFromSteps(steps)
  const publicProfileLinkAvailable =
    publicProfileEnabled &&
    (details.publicProfileLinkAvailable ?? Boolean(publicProfilePath)) &&
    Boolean(publicProfilePath)

  return {
    readiness: hardReady,
    status,
    statusLabel:
      status === 'ready'
        ? details.publicProfileEnabled === false
          ? 'Основні дані готові'
          : 'Профіль опублікований'
        : status === 'closed'
          ? 'Профіль ще не готовий'
          : 'Профіль опублікований, але потребує доповнення',
    helper:
      'Заповніть шість основних пунктів, щоб клієнту було зрозуміло, як до вас звернутися.',
    steps,
    missingItems,
    missingSummary: sentenceFromItems(missingItems),
    publicationSummary: buildPublicationSummary(
      hardReady,
      publicProfileEnabled,
      details.isSearchVisible
    ),
    warnings: normalized.warnings.map(toWarningCopy),
    nextActions: secondaryActions,
    primaryCta,
    publicProfilePath,
    publicProfileLinkAvailable,
  }
}
