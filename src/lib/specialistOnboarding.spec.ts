import { describe, expect, it } from 'vitest'
import {
  buildSpecialistOnboardingViewModel,
  CTA_TARGET_ROUTE_KEYS,
  MISSING_ITEM_COPY,
  normalizeOnboardingState,
  PRIMARY_CTA_CODE_COPY,
  WARNING_CODE_COPY,
} from './specialistOnboarding'

describe('specialist onboarding mapping', () => {
  it('keeps contract-aligned copy and route mappings', () => {
    expect(MISSING_ITEM_COPY.MISSING_DISPLAY_NAME).toBe('публічне ім’я')
    expect(MISSING_ITEM_COPY.MISSING_DESCRIPTION).toBe('короткий опис')
    expect(MISSING_ITEM_COPY.MISSING_TOPICS).toBe('спеціалізації')
    expect(MISSING_ITEM_COPY.MISSING_WORK_FORMAT).toBe('формат роботи')
    expect(MISSING_ITEM_COPY.MISSING_BASE_PRICE).toBe('базова ціна')
    expect(MISSING_ITEM_COPY.MISSING_CLIENT_ENTRY_PATH).toBe('спосіб першого звернення')
    expect(MISSING_ITEM_COPY.PUBLIC_PROFILE_DISABLED).toBe('публікація профілю')
    expect(MISSING_ITEM_COPY.MISSING_PUBLIC_PROFILE_LINK).toBe('публічне посилання')

    expect(WARNING_CODE_COPY.PROFILE_CORE_INCOMPLETE).toContain('Заповніть кілька основних пунктів')
    expect(WARNING_CODE_COPY.CLIENT_ENTRY_PATH_MISSING).toContain('Оберіть спосіб першого звернення')
    expect(WARNING_CODE_COPY.PUBLIC_PROFILE_OFF).toContain('Опублікуйте профіль')
    expect(WARNING_CODE_COPY.PUBLIC_PROFILE_LINK_MISSING).toContain('Публічне посилання')

    expect(PRIMARY_CTA_CODE_COPY.COMPLETE_PROFILE).toBe('Заповнити профіль')
    expect(PRIMARY_CTA_CODE_COPY.ADD_AVAILABILITY).toBe('Налаштувати час')
    expect(PRIMARY_CTA_CODE_COPY.OPEN_PUBLIC_PROFILE).toBe('Опублікувати')
    expect(PRIMARY_CTA_CODE_COPY.VIEW_PUBLIC_PROFILE).toBe('Переглянути публічний профіль')

    expect(CTA_TARGET_ROUTE_KEYS.CABINET_PROFILE).toBe('/cabinet/profile')
    expect(CTA_TARGET_ROUTE_KEYS.CABINET_AVAILABILITY).toBe('/cabinet/slots?tab=availability&focus=create-availability')
    expect(CTA_TARGET_ROUTE_KEYS.CABINET_PUBLIC_PROFILE).toBe('/cabinet/profile')
    expect(CTA_TARGET_ROUTE_KEYS.PUBLIC_PROFILE_VIEW).toBe('/public')
  })

  it('renders the canonical six hard requirements and excludes publication checks from hard readiness', () => {
    const normalized = normalizeOnboardingState({
      version: 2,
      public_profile_enabled: false,
      is_search_visible: false,
      minimum_public_profile_readiness: {
        is_ready: false,
        completed_count: 4,
        total_count: 6,
        missing_items: ['topics', 'work_format'],
        items: [
          { key: 'public_display_name', label: 'Публічне ім’я', complete: true },
          { key: 'description', label: 'Короткий опис', complete: true },
          { key: 'topics', label: 'Спеціалізації', complete: false },
          { key: 'work_format', label: 'Формат роботи', complete: false },
          { key: 'price_decision', label: 'Базова ціна', complete: true },
          { key: 'first_contact', label: 'Спосіб першого звернення', complete: true },
        ],
      },
      missing_items: ['topics', 'work_format', 'PUBLIC_PROFILE_DISABLED', 'MISSING_PUBLIC_PROFILE_LINK'],
      warnings: [{ code: 'PROFILE_CORE_INCOMPLETE' }],
      next_actions: [{ code: 'OPEN_PUBLIC_PROFILE', target: 'CABINET_PUBLIC_PROFILE', priority: 1 }],
      primary_cta_code: 'OPEN_PUBLIC_PROFILE',
    })

    expect(normalized).not.toBeNull()
    const viewModel = buildSpecialistOnboardingViewModel(normalized!)
    expect(viewModel.readiness).toBe(false)
    expect(viewModel.status).toBe('closed')
    expect(viewModel.primaryCta).toMatchObject({ code: 'COMPLETE_PROFILE', to: '/cabinet/profile' })
    expect(viewModel.steps.map((step) => step.key)).toEqual([
      'display_name',
      'description',
      'topics',
      'work_format',
      'base_price',
      'client_entry_path',
    ])
    expect(viewModel.steps.find((step) => step.key === 'topics')?.done).toBe(false)
    expect(viewModel.steps.find((step) => step.key === 'work_format')?.done).toBe(false)
    expect(viewModel.missingSummary).toBe('Що залишилось: спеціалізації, формат роботи.')
    expect(viewModel.missingItems).not.toContain('публікація профілю')
    expect(viewModel.missingItems).not.toContain('публічне посилання')
    expect(viewModel.publicationSummary).toBe('Публікація стане доступною після заповнення основних даних.')
  })

  it('uses top-level canonical missing items when readiness items are not present', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: {
          public_display_name_exists: true,
          basic_description_exists: true,
          standard_price_configured: true,
          client_entry_path_exists: true,
          public_profile_enabled: false,
          public_profile_link_available: false,
          ready_for_inbound_intent: false,
        },
        missing_items: ['topics'],
        warnings: [],
        next_actions: [{ code: 'COMPLETE_PROFILE', target: 'CABINET_PROFILE', priority: 1 }],
        primary_cta_code: 'COMPLETE_PROFILE',
      })!
    )

    expect(vm.readiness).toBe(false)
    expect(vm.steps.find((step) => step.key === 'topics')?.done).toBe(false)
    expect(vm.steps.find((step) => step.key === 'work_format')?.done).toBe(true)
    expect(vm.missingSummary).toBe('Що залишилось: спеціалізації.')
    expect(vm.publicationSummary).not.toMatch(/тільки|лише/)
  })

  it('routes missing topics to persisted specializations setup', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: {
          public_display_name_exists: true,
          basic_description_exists: true,
          standard_price_configured: true,
          client_entry_path_exists: true,
        },
        specializations: [],
        missing_items: ['topics'],
        warnings: [],
        next_actions: [{ code: 'COMPLETE_PROFILE', target: 'CABINET_PROFILE', priority: 1 }],
        primary_cta_code: 'COMPLETE_PROFILE',
      })!
    )

    const topicsStep = vm.steps.find((step) => step.key === 'topics')
    expect(topicsStep).toMatchObject({
      title: 'Додайте спеціалізації',
      done: false,
      to: '/cabinet/profile?focus=specializations',
      actionLabel: 'Додати спеціалізації',
    })
  })

  it('uses persisted specializations, not main request text, for fallback topics readiness', () => {
    const incomplete = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: {
          public_display_name_exists: true,
          basic_description_exists: true,
          standard_price_configured: true,
          client_entry_path_exists: true,
        },
        specializations: [],
        bio_for_whom: 'Працюю з тривогою та вигоранням.',
        missing_items: [],
        warnings: [],
        next_actions: [],
      })!
    )
    const complete = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: {
          public_display_name_exists: true,
          basic_description_exists: true,
          standard_price_configured: true,
          client_entry_path_exists: true,
        },
        specializations: ['Тривога'],
        bio_for_whom: '',
        missing_items: [],
        warnings: [],
        next_actions: [],
      })!
    )

    expect(incomplete.steps.find((step) => step.key === 'topics')?.done).toBe(false)
    expect(complete.steps.find((step) => step.key === 'topics')?.done).toBe(true)
  })

  it('routes missing first-contact setup to booking settings instead of availability creation', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: {
          public_display_name_exists: true,
          basic_description_exists: true,
          standard_price_configured: true,
          client_entry_path_exists: false,
          has_future_slots: false,
          public_profile_enabled: true,
          public_profile_link_available: true,
          public_booking_mode: 'direct_booking',
          show_public_availability: true,
          ready_for_inbound_intent: false,
        },
        missing_items: ['MISSING_CLIENT_ENTRY_PATH'],
        warnings: [{ code: 'CLIENT_ENTRY_PATH_MISSING' }],
        next_actions: [{ code: 'ADD_AVAILABILITY', target: 'CABINET_AVAILABILITY', priority: 2 }],
        primary_cta_code: 'ADD_AVAILABILITY',
      })!
    )

    expect(vm.status).toBe('needs_completion')
    expect(vm.primaryCta?.to).toBe('/cabinet/slots?tab=availability&focus=create-availability')
    expect(vm.steps.find((step) => step.key === 'client_entry_path')?.to).toBe(
      '/cabinet/slots?tab=settings'
    )
    expect(vm.steps.find((step) => step.key === 'client_entry_path')?.title).toContain('спосіб першого звернення')
  })

  it('summarizes all six ready but unpublished as publication-ready', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        public_profile_enabled: false,
        is_search_visible: false,
        minimum_public_profile_readiness: {
          is_ready: true,
          completed_count: 6,
          total_count: 6,
          missing_items: [],
          items: [],
        },
        missing_items: ['PUBLIC_PROFILE_DISABLED'],
        warnings: [{ code: 'PUBLIC_PROFILE_OFF' }],
        next_actions: [{ code: 'OPEN_PUBLIC_PROFILE', target: 'CABINET_PUBLIC_PROFILE', priority: 1 }],
        primary_cta_code: 'OPEN_PUBLIC_PROFILE',
      })!
    )

    expect(vm.readiness).toBe(true)
    expect(vm.steps).toHaveLength(6)
    expect(vm.steps.every((step) => step.done)).toBe(true)
    expect(vm.missingSummary).toBe('')
    expect(vm.publicationSummary).toBe(
      'Основні дані готові. Опублікуйте профіль, щоб відкрити сторінку за прямим посиланням.'
    )
  })

  it('distinguishes direct-link-only publication from search-visible publication', () => {
    const directOnly = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        public_profile_enabled: true,
        is_search_visible: false,
        public_profile_path: '/s/spec-a',
        minimum_public_profile_readiness: {
          is_ready: true,
          completed_count: 6,
          total_count: 6,
          missing_items: [],
          items: [],
        },
        missing_items: [],
        warnings: [],
        next_actions: [{ code: 'VIEW_PUBLIC_PROFILE', target: 'PUBLIC_PROFILE_VIEW', priority: 1 }],
        primary_cta_code: 'VIEW_PUBLIC_PROFILE',
      })!
    )
    const searchVisible = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        public_profile_enabled: true,
        is_search_visible: true,
        public_profile_path: '/s/spec-a',
        minimum_public_profile_readiness: {
          is_ready: true,
          completed_count: 6,
          total_count: 6,
          missing_items: [],
          items: [],
        },
        missing_items: [],
        warnings: [],
        next_actions: [{ code: 'VIEW_PUBLIC_PROFILE', target: 'PUBLIC_PROFILE_VIEW', priority: 1 }],
        primary_cta_code: 'VIEW_PUBLIC_PROFILE',
      })!
    )

    expect(directOnly.publicationSummary).toContain('доступний за прямим посиланням')
    expect(directOnly.publicationSummary).toContain('У пошуку він не показується')
    expect(searchVisible.publicationSummary).toContain('видимий у пошуку')
  })

  it('normalizes onboarding_summary shell without false-ready fallback', () => {
    const normalized = normalizeOnboardingState({
      ready_for_inbound_intent: false,
      missing_items_count: 3,
      primary_cta_code: 'ADD_AVAILABILITY',
    })

    expect(normalized).not.toBeNull()
    expect(normalized?.readiness).toBe(false)
    expect(normalized?.missingItems).toEqual([])
  })

  it('does not use marketplace, rating, recommendation, or platform verification wording', () => {
    const allCopy = [
      ...Object.values(MISSING_ITEM_COPY),
      ...Object.values(WARNING_CODE_COPY),
      ...Object.values(PRIMARY_CTA_CODE_COPY),
    ].join(' ')

    expect(allCopy).not.toMatch(/маркетплейс|рейтинг|топ|рекомендован|верифікован/i)
  })
})
