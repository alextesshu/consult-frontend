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
    expect(MISSING_ITEM_COPY.MISSING_DISPLAY_NAME).toBe('публічне імʼя')
    expect(MISSING_ITEM_COPY.MISSING_DESCRIPTION).toBe('опис')
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
    expect(CTA_TARGET_ROUTE_KEYS.CABINET_AVAILABILITY).toBe('/cabinet/slots?tab=availability')
    expect(CTA_TARGET_ROUTE_KEYS.CABINET_PUBLIC_PROFILE).toBe('/cabinet/profile')
    expect(CTA_TARGET_ROUTE_KEYS.PUBLIC_PROFILE_VIEW).toBe('/public')
  })

  it('renders incomplete profile checklist from canonical readiness fields', () => {
    const normalized = normalizeOnboardingState({
      version: 2,
      readiness: {
        public_display_name_exists: false,
        basic_description_exists: false,
        standard_price_configured: false,
        client_entry_path_exists: false,
        public_profile_enabled: false,
        public_profile_link_available: false,
        ready_for_inbound_intent: false,
      },
      missing_items: [
        'MISSING_DISPLAY_NAME',
        'MISSING_DESCRIPTION',
        'MISSING_BASE_PRICE',
        'MISSING_CLIENT_ENTRY_PATH',
        'PUBLIC_PROFILE_DISABLED',
        'MISSING_PUBLIC_PROFILE_LINK',
      ],
      warnings: [{ code: 'PROFILE_CORE_INCOMPLETE' }],
      next_actions: [{ code: 'COMPLETE_PROFILE', target: 'CABINET_PROFILE', priority: 1 }],
      primary_cta_code: 'COMPLETE_PROFILE',
    })

    expect(normalized).not.toBeNull()
    const viewModel = buildSpecialistOnboardingViewModel(normalized!)
    expect(viewModel.readiness).toBe(false)
    expect(viewModel.status).toBe('closed')
    expect(viewModel.statusLabel).toBe('Профіль ще не відкритий')
    expect(viewModel.primaryCta?.to).toBe('/cabinet/profile')
    expect(viewModel.steps).toHaveLength(6)
    expect(viewModel.steps.find((step) => step.key === 'display_name')?.done).toBe(false)
    expect(viewModel.steps.find((step) => step.key === 'description')?.done).toBe(false)
    expect(viewModel.steps.find((step) => step.key === 'base_price')?.done).toBe(false)
    expect(viewModel.steps.find((step) => step.key === 'client_entry_path')?.done).toBe(false)
    expect(viewModel.missingSummary).toBe(
      'Що залишилось: публічне імʼя, опис, базова ціна, спосіб першого звернення, публікація профілю, публічне посилання.'
    )
  })

  it('routes direct booking without future windows to availability', () => {
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
    expect(vm.primaryCta?.to).toBe('/cabinet/slots?tab=availability')
    expect(vm.steps.find((step) => step.key === 'client_entry_path')?.to).toBe(
      '/cabinet/slots?tab=availability'
    )
  })

  it('handles ready state with public profile link', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: {
          public_display_name_exists: true,
          basic_description_exists: true,
          standard_price_configured: true,
          client_entry_path_exists: true,
          public_profile_enabled: true,
          profile_slug_exists: true,
          public_profile_link_available: true,
          ready_for_inbound_intent: true,
        },
        public_profile_path: '/s/spec-a',
        missing_items: [],
        warnings: [],
        next_actions: [{ code: 'VIEW_PUBLIC_PROFILE', target: 'PUBLIC_PROFILE_VIEW', priority: 1 }],
        primary_cta_code: 'VIEW_PUBLIC_PROFILE',
      })!
    )

    expect(vm.readiness).toBe(true)
    expect(vm.status).toBe('ready')
    expect(vm.steps.every((step) => step.done)).toBe(true)
    expect(vm.publicProfileLinkAvailable).toBe(true)
    expect(vm.publicProfilePath).toBe('/s/spec-a')
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
