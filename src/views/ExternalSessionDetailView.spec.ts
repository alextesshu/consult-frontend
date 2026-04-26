import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExternalSessionDetailView from './ExternalSessionDetailView.vue'
import {
  cancelExternalSession,
  createExternalSessionInvite,
  fetchExternalSessionDetail,
  fetchExternalSessionInvite,
  markExternalSessionPaymentPaid,
  regenerateExternalSessionInvite,
  requestExternalSessionPayment,
  revokeExternalSessionInvite,
  updateExternalSession,
} from '../lib/api'

const routeParams = { id: '21' }

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => ({
      params: routeParams,
    }),
  }
})

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  show: vi.fn(),
}

vi.mock('../composables/useToast', () => ({
  useToast: () => toast,
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchExternalSessionDetail: vi.fn(),
    updateExternalSession: vi.fn(),
    cancelExternalSession: vi.fn(),
    fetchExternalSessionInvite: vi.fn(),
    createExternalSessionInvite: vi.fn(),
    revokeExternalSessionInvite: vi.fn(),
    regenerateExternalSessionInvite: vi.fn(),
    requestExternalSessionPayment: vi.fn(),
    markExternalSessionPaymentPaid: vi.fn(),
    getApiErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  }
})

const mockedFetchExternalSessionDetail = vi.mocked(fetchExternalSessionDetail)
const mockedUpdateExternalSession = vi.mocked(updateExternalSession)
const mockedCancelExternalSession = vi.mocked(cancelExternalSession)
const mockedFetchExternalSessionInvite = vi.mocked(fetchExternalSessionInvite)
const mockedCreateExternalSessionInvite = vi.mocked(createExternalSessionInvite)
const mockedRevokeExternalSessionInvite = vi.mocked(revokeExternalSessionInvite)
const mockedRegenerateExternalSessionInvite = vi.mocked(regenerateExternalSessionInvite)
const mockedRequestExternalSessionPayment = vi.mocked(requestExternalSessionPayment)
const mockedMarkExternalSessionPaymentPaid = vi.mocked(markExternalSessionPaymentPaid)
function baseSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 21,
    starts_at: '2099-06-15T10:00:00Z',
    ends_at: '2099-06-15T11:00:00Z',
    duration_minutes: 60,
    session_format: 'online',
    meeting_url: 'https://meet.google.com/demo',
    offline_location_snapshot: null,
    guest_name: 'Guest User',
    guest_email: 'guest@example.com',
    status: 'SCHEDULED',
    cancelled_at: null,
    created_at: '2099-06-01T00:00:00Z',
    updated_at: '2099-06-01T00:00:00Z',
    payment_state: 'unpaid',
    payment_badge_state: 'unpaid',
    payment_requested_at: null,
    payment_confirmed_at: null,
    payment_amount: null,
    payment_currency: 'UAH',
    payment_details_snapshot: {
      is_available: false,
      available_methods: [],
      default_method_type: null,
      methods: {},
      method_type: null,
      recipient_name: null,
      iban: null,
      card_number: null,
      bank_name: null,
      payment_purpose: null,
      comment: null,
      snapshot_created_at: null,
    },
    payment_available_actions: {
      can_request_payment: true,
      can_mark_paid: false,
      can_request_clarification: false,
    },
    payment_proof: null,
    ...overrides,
  }
}

function renderView() {
  return render(ExternalSessionDetailView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>',
        },
      },
    },
  })
}

describe('ExternalSessionDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeParams.id = '21'
    mockedFetchExternalSessionDetail.mockResolvedValue(baseSession() as any)
    mockedFetchExternalSessionInvite.mockRejectedValue({
      response: { status: 404, data: { code: 'NOT_FOUND' } },
    })
    mockedRequestExternalSessionPayment.mockResolvedValue(
      baseSession({
        payment_state: 'requested',
        payment_badge_state: 'awaiting_confirmation',
        payment_requested_at: '2099-06-15T12:00:00Z',
        payment_available_actions: {
          can_request_payment: true,
          can_mark_paid: true,
          can_request_clarification: false,
        },
      }) as any
    )

    mockedMarkExternalSessionPaymentPaid.mockResolvedValue(
      baseSession({
        payment_state: 'paid',
        payment_badge_state: 'paid',
        payment_requested_at: '2099-06-15T12:00:00Z',
        payment_confirmed_at: '2099-06-15T12:30:00Z',
        payment_available_actions: {
          can_request_payment: false,
          can_mark_paid: false,
          can_request_clarification: false,
        },
      }) as any
    )
  })

  it('renders empty invite state when invite does not exist', async () => {
    const { container } = renderView()

    expect(await screen.findByText('Деталі гостьової сесії')).toBeInTheDocument()
    expect(screen.getByText('Зведення')).toBeInTheDocument()
    expect(screen.getAllByText('Гостьовий доступ').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Редагувати / перенести' })).toBeInTheDocument()
    expect(await screen.findByText('Запрошення ще не створено. Створіть його, щоб надіслати гостю безпечне посилання.')).toBeInTheDocument()
    expect(container.querySelector('input[type="datetime-local"]')).not.toBeInTheDocument()
    expect(container.querySelector('input[type="date"]')).not.toBeInTheDocument()
    expect(container.querySelector('input[inputmode="numeric"]')).not.toBeInTheDocument()
    expect(mockedFetchExternalSessionDetail).toHaveBeenCalledWith(21)
    expect(mockedFetchExternalSessionInvite).toHaveBeenCalledWith(21)
  })

  it('renders unpaid guest payment state and request action', async () => {
    renderView()

    await screen.findByText('Деталі гостьової сесії')

    expect(screen.getByText('Оплата гостьової сесії')).toBeInTheDocument()
    expect(screen.getByText('Не оплачено')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Запросити оплату' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Позначити оплаченою' })).not.toBeInTheDocument()
  })

  it('requests guest payment and updates payment state', async () => {
    renderView()

    await screen.findByText('Деталі гостьової сесії')
    await fireEvent.click(screen.getByRole('button', { name: 'Запросити оплату' }))

    await waitFor(() => {
      expect(mockedRequestExternalSessionPayment).toHaveBeenCalledWith(21, {
        amount: null,
        currency: 'UAH',
      })
    })

    expect(await screen.findByText('Оплату запрошено')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Позначити оплаченою' })).toBeInTheDocument()
  })

  it('marks requested guest payment as paid', async () => {
    mockedFetchExternalSessionDetail.mockResolvedValue(
      baseSession({
        payment_state: 'requested',
        payment_badge_state: 'awaiting_confirmation',
        payment_requested_at: '2099-06-15T12:00:00Z',
        payment_amount: '2000.00',
        payment_available_actions: {
          can_request_payment: true,
          can_mark_paid: true,
          can_request_clarification: false,
        },
      }) as any
    )

    renderView()

    await screen.findByText('Деталі гостьової сесії')
    expect(screen.getByText('Оплату запрошено')).toBeInTheDocument()
    expect(screen.getByText('2000.00 UAH')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Позначити оплаченою' }))

    await waitFor(() => {
      expect(mockedMarkExternalSessionPaymentPaid).toHaveBeenCalledWith(21, {
        specialist_note: 'Оплату підтверджено вручну.',
      })
    })

    expect(await screen.findByText('Оплачено')).toBeInTheDocument()
  })

  it('promotes safe guest invite CTA near online meeting URL when invite does not exist', async () => {
    mockedCreateExternalSessionInvite.mockResolvedValue({
      invite: {
        id: 31,
        external_session_id: 21,
        status: 'ACTIVE',
        expires_at: '2099-06-16T10:00:00Z',
        opened_at: null,
        last_opened_at: null,
        joined_at: null,
        created_at: null,
        updated_at: null,
      },
    } as any)

    const { container } = renderView()
    await screen.findByText('Посилання на онлайн-зустріч')

    const meetingCard = container.querySelector('.meeting-share-card') as HTMLElement | null
    expect(meetingCard).not.toBeNull()
    expect(within(meetingCard as HTMLElement).getByText('https://meet.google.com/demo')).toBeInTheDocument()
    expect(
      within(meetingCard as HTMLElement).getByText('Це внутрішнє посилання на онлайн-зустріч. Не надсилайте його гостю напряму. Для гостя створіть гостьове запрошення нижче.')
    ).toBeInTheDocument()
    expect(
      within(meetingCard as HTMLElement).getByText('Буде показане гостю після відкриття гостьового запрошення.')
    ).toBeInTheDocument()
    expect(within(meetingCard as HTMLElement).getByText('Гостьове запрошення ще не створено')).toBeInTheDocument()

    await fireEvent.click(within(meetingCard as HTMLElement).getByRole('button', { name: 'Створити гостьове запрошення' }))

    await waitFor(() => {
      expect(mockedCreateExternalSessionInvite).toHaveBeenCalledWith(21)
    })
  })

  it('shows existing invite as guest link with copy action instead of a raw meeting share link', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      clipboard: { writeText: clipboardWrite },
    })
    mockedFetchExternalSessionInvite.mockResolvedValue({
      id: 32,
      external_session_id: 21,
      status: 'ACTIVE',
      expires_at: '2099-06-16T10:00:00Z',
      opened_at: null,
      last_opened_at: null,
      joined_at: null,
      created_at: null,
      updated_at: null,
      invite_url: 'https://proconsult.space/guest/external-session/existing-token',
    } as any)

    const { container } = renderView()
    expect(await screen.findByText('Посилання для гостя')).toBeInTheDocument()
    expect(screen.queryByText('Гостьове посилання')).not.toBeInTheDocument()

    const meetingCard = container.querySelector('.meeting-share-card') as HTMLElement | null
    expect(meetingCard).not.toBeNull()
    expect(within(meetingCard as HTMLElement).queryByText('Гостьове запрошення ще не створено')).not.toBeInTheDocument()
    expect(
      within(meetingCard as HTMLElement).getByRole('button', { name: 'Скопіювати гостьове запрошення' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'https://proconsult.space/guest/external-session/existing-token' })
    ).toBeInTheDocument()

    await fireEvent.click(within(meetingCard as HTMLElement).getByRole('button', { name: 'Скопіювати гостьове запрошення' }))
    await waitFor(() => {
      expect(clipboardWrite).toHaveBeenCalledWith('https://proconsult.space/guest/external-session/existing-token')
    })
  })

  it('does not show online meeting URL warning for offline session', async () => {
    mockedFetchExternalSessionDetail.mockResolvedValue(
      baseSession({
        session_format: 'offline',
        meeting_url: 'https://meet.google.com/should-not-be-shared',
        offline_location_snapshot: 'Київ, вул. Тестова, 1',
      }) as any
    )

    const { container } = renderView()
    expect(await screen.findByText('Локація')).toBeInTheDocument()
    expect(screen.getByText('Київ, вул. Тестова, 1')).toBeInTheDocument()
    expect(screen.queryByText('Це внутрішнє посилання на онлайн-зустріч. Не надсилайте його гостю напряму. Для гостя створіть гостьове запрошення нижче.')).not.toBeInTheDocument()
    expect(screen.queryByText('Гостьове запрошення ще не створено')).not.toBeInTheDocument()
    expect(container.querySelector('.meeting-share-card')).toBeNull()
  })

  it('opens edit mode and closes with cancel while resetting local draft', async () => {
    const { container } = renderView()
    await screen.findByText('Деталі гостьової сесії')

    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати / перенести' }))
    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement | null
    const timeInput = container.querySelector('input[inputmode="numeric"]') as HTMLInputElement | null
    if (!dateInput || !timeInput) {
      throw new Error('Edit inputs are missing')
    }

    expect(timeInput).toHaveAttribute('list', 'external-session-edit-time-options')
    const options = Array.from(
      container.querySelectorAll('datalist#external-session-edit-time-options option')
    ).map((item) => item.getAttribute('value'))
    expect(options[0]).toBe('00:00')
    expect(options[1]).toBe('00:15')
    expect(options[95]).toBe('23:45')

    await fireEvent.update(dateInput, '2099-06-20')
    await fireEvent.update(timeInput, '11:45')
    await fireEvent.click(screen.getByRole('button', { name: 'Закрити редагування' }))

    expect(screen.getByRole('button', { name: 'Редагувати / перенести' })).toBeInTheDocument()
    expect(container.querySelector('input[type="date"]')).not.toBeInTheDocument()
    expect(container.querySelector('input[inputmode="numeric"]')).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати / перенести' }))
    const resetDateInput = container.querySelector('input[type="date"]') as HTMLInputElement | null
    const resetTimeInput = container.querySelector('input[inputmode="numeric"]') as HTMLInputElement | null
    expect(resetDateInput?.value).toBe('2099-06-15')
    expect(resetTimeInput?.value).toBe('13:00')
  })

  it('stores and renders invite URL after create success', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      clipboard: { writeText: clipboardWrite },
    })

    mockedCreateExternalSessionInvite.mockResolvedValue({
      invite: {
        id: 11,
        external_session_id: 21,
        status: 'ACTIVE',
        expires_at: '2099-06-16T10:00:00Z',
        opened_at: null,
        last_opened_at: null,
        joined_at: null,
        created_at: null,
        updated_at: null,
        invite_url: 'https://proconsult.space/guest/external-session/new-token',
      },
    } as any)

    renderView()
    await screen.findByText('Запрошення ще не створено. Створіть його, щоб надіслати гостю безпечне посилання.')

    const createInviteButton = await screen.findByRole('button', { name: 'Створити запрошення' })
    await fireEvent.click(createInviteButton)

    await waitFor(() => {
      expect(mockedCreateExternalSessionInvite).toHaveBeenCalledWith(21)
      expect(toast.success).toHaveBeenCalledWith('Посилання запрошення скопійовано.')
    })

    await waitFor(() => {
      expect(clipboardWrite).toHaveBeenCalledWith('https://proconsult.space/guest/external-session/new-token')
    })
    expect(screen.getByText('Посилання для гостя')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://proconsult.space/guest/external-session/new-token' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Скопіювати посилання|Скопійовано/ })).toBeInTheDocument()
  })

  it('renders invite URL and copy action when create response has invite_url without invite object', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      clipboard: { writeText: clipboardWrite },
    })

    mockedCreateExternalSessionInvite.mockResolvedValue({
      invite: null,
      invite_url: 'https://proconsult.space/guest/external-session/url-only-create',
    } as any)

    const { container } = renderView()
    let createInviteButton: HTMLButtonElement | null = null
    await waitFor(() => {
      createInviteButton = container.querySelector('.actions-row .btn') as HTMLButtonElement | null
      expect(createInviteButton).not.toBeNull()
    })
    if (!createInviteButton) {
      throw new Error('Create invite button is missing')
    }
    await fireEvent.click(createInviteButton)

    await waitFor(() => {
      expect(mockedCreateExternalSessionInvite).toHaveBeenCalledWith(21)
      expect(clipboardWrite).toHaveBeenCalledWith('https://proconsult.space/guest/external-session/url-only-create')
    })

    expect(
      screen.getByRole('link', { name: 'https://proconsult.space/guest/external-session/url-only-create' })
    ).toBeInTheDocument()
    expect(container.querySelector('.invite-link-block')).not.toBeNull()
    expect(container.querySelector('.actions-row .btn--sm')).not.toBeNull()
  })

  it('renders empty invite state when status endpoint returns invite: null payload', async () => {
    mockedFetchExternalSessionInvite.mockResolvedValueOnce(null as any)

    renderView()
    await screen.findByText('Деталі гостьової сесії')

    expect(screen.getByText('Запрошення ще не створено. Створіть його, щоб надіслати гостю безпечне посилання.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Створити запрошення' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Перевидати' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Відкликати' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Скопіювати посилання' })).not.toBeInTheDocument()
  })

  it('renders explicit get new link action when active invite has no invite URL in page state', async () => {
    mockedFetchExternalSessionInvite.mockReset()
    mockedFetchExternalSessionInvite.mockResolvedValue({
      id: 77,
      external_session_id: 21,
      status: 'ACTIVE',
      expires_at: '2099-06-16T10:00:00Z',
      opened_at: null,
      last_opened_at: null,
      joined_at: null,
      created_at: null,
      updated_at: null,
    } as any)

    renderView()
    await screen.findByText('Деталі гостьової сесії')

    expect(await screen.findByRole('button', { name: 'Отримати нове посилання' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Відкликати' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Скопіювати посилання' })).not.toBeInTheDocument()
  })

  it('gets new link for active invite and then shows visible URL with copy action', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      clipboard: { writeText: clipboardWrite },
    })

    mockedFetchExternalSessionInvite.mockReset()
    mockedFetchExternalSessionInvite.mockResolvedValue({
      id: 78,
      external_session_id: 21,
      status: 'ACTIVE',
      expires_at: '2099-06-16T10:00:00Z',
      opened_at: null,
      last_opened_at: null,
      joined_at: null,
      created_at: null,
      updated_at: null,
    } as any)
    mockedRegenerateExternalSessionInvite.mockResolvedValue({
      invite: {
        id: 79,
        external_session_id: 21,
        status: 'ACTIVE',
        expires_at: '2099-06-17T10:00:00Z',
        opened_at: null,
        last_opened_at: null,
        joined_at: null,
        created_at: null,
        updated_at: null,
        invite_url: 'https://proconsult.space/guest/external-session/new-from-regenerate',
      },
    } as any)

    renderView()
    await screen.findByText('Деталі гостьової сесії')

    await fireEvent.click(await screen.findByRole('button', { name: 'Отримати нове посилання' }))

    await waitFor(() => {
      expect(mockedRegenerateExternalSessionInvite).toHaveBeenCalledWith(21)
      expect(toast.success).toHaveBeenCalledWith('Нове посилання скопійовано.')
    })

    expect(screen.getByText('Посилання для гостя')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'https://proconsult.space/guest/external-session/new-from-regenerate' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Скопіювати посилання|Скопійовано/ })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /Скопіювати посилання|Скопійовано/ }))
    await waitFor(() => {
      expect(clipboardWrite).toHaveBeenCalledWith('https://proconsult.space/guest/external-session/new-from-regenerate')
    })
  })

  it('keeps visible URL and copy action when clipboard auto-copy fails', async () => {
    const clipboardWrite = vi.fn().mockRejectedValue(new Error('clipboard blocked'))
    vi.stubGlobal('navigator', {
      clipboard: { writeText: clipboardWrite },
    })

    mockedCreateExternalSessionInvite.mockResolvedValue({
      invite: {
        id: 120,
        external_session_id: 21,
        status: 'ACTIVE',
        expires_at: '2099-06-16T10:00:00Z',
        opened_at: null,
        last_opened_at: null,
        joined_at: null,
        created_at: null,
        updated_at: null,
      },
      invite_url: 'https://proconsult.space/guest/external-session/fallback-url',
    } as any)

    renderView()
    await screen.findByText('Деталі гостьової сесії')

    await fireEvent.click(await screen.findByRole('button', { name: 'Створити запрошення' }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Посилання запрошення готове до копіювання.')
    })
    expect(screen.getByText('Посилання для гостя')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Скопіювати посилання|Скопійовано/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://proconsult.space/guest/external-session/fallback-url' })).toBeInTheDocument()
  })

  it('disables edit and invite actions for cancelled session', async () => {
    mockedFetchExternalSessionDetail.mockResolvedValue(
      baseSession({ status: 'CANCELLED', cancelled_at: '2099-06-12T10:00:00Z' }) as any
    )
    mockedFetchExternalSessionInvite.mockResolvedValue({
      id: 14,
      external_session_id: 21,
      status: 'ACTIVE',
      expires_at: '2099-06-16T10:00:00Z',
      opened_at: null,
      last_opened_at: null,
      joined_at: null,
      created_at: null,
      updated_at: null,
    } as any)

    renderView()
    await screen.findByText('Скасовано')

    expect(screen.queryByRole('button', { name: 'Редагувати' })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Отримати нове посилання' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Відкликати' })).toBeDisabled()
    })
  })

  it('cancels active session and reloads invite state', async () => {
    mockedCancelExternalSession.mockResolvedValue(
      baseSession({ status: 'CANCELLED', cancelled_at: '2099-06-12T10:00:00Z' }) as any
    )
    mockedFetchExternalSessionInvite
      .mockRejectedValueOnce({ response: { status: 404, data: { code: 'NOT_FOUND' } } })
      .mockRejectedValueOnce({ response: { status: 404, data: { code: 'NOT_FOUND' } } })

    renderView()
    await screen.findByText('Деталі гостьової сесії')

    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати / перенести' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати сесію' }))

    await waitFor(() => {
      expect(mockedCancelExternalSession).toHaveBeenCalledWith(21)
      expect(toast.success).toHaveBeenCalledWith('Гостьову сесію скасовано.')
    })
  })

  it('keeps existing action methods wired (no accidental regressions)', async () => {
    mockedFetchExternalSessionInvite.mockResolvedValue({
      id: 14,
      external_session_id: 21,
      status: 'ACTIVE',
      expires_at: '2099-06-16T10:00:00Z',
      opened_at: null,
      last_opened_at: null,
      joined_at: null,
      created_at: null,
      updated_at: null,
    } as any)
    mockedUpdateExternalSession.mockResolvedValue(baseSession() as any)
    mockedRevokeExternalSessionInvite.mockResolvedValue({
      id: 14,
      external_session_id: 21,
      status: 'REVOKED',
      expires_at: '2099-06-16T10:00:00Z',
      opened_at: null,
      last_opened_at: null,
      joined_at: null,
      created_at: null,
      updated_at: null,
    } as any)
    mockedRegenerateExternalSessionInvite.mockResolvedValue({
      invite: {
        id: 15,
        external_session_id: 21,
        status: 'ACTIVE',
        expires_at: '2099-06-17T10:00:00Z',
        opened_at: null,
        last_opened_at: null,
        joined_at: null,
        created_at: null,
        updated_at: null,
      },
      invite_url: 'https://proconsult.space/guest/external-session/regenerated',
    } as any)

    renderView()
    await screen.findByText('Деталі гостьової сесії')

    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати / перенести' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))
    await waitFor(() => {
      expect(mockedUpdateExternalSession).toHaveBeenCalledTimes(1)
    })

    await fireEvent.click(await screen.findByRole('button', { name: 'Відкликати' }))
    await waitFor(() => {
      expect(mockedRevokeExternalSessionInvite).toHaveBeenCalledWith(21)
    })

    await fireEvent.click(await screen.findByRole('button', { name: 'Перевидати' }))
    await waitFor(() => {
      expect(mockedRegenerateExternalSessionInvite).toHaveBeenCalledWith(21)
    })
  })

  it('reloads invite state after 409 on get new link action and removes stale active controls', async () => {
    mockedFetchExternalSessionInvite.mockReset()
    let inviteStatusCall = 0
    mockedFetchExternalSessionInvite.mockImplementation(async () => {
      inviteStatusCall += 1
      if (inviteStatusCall >= 2) return null as any
      return {
        id: 90,
        external_session_id: 21,
        status: 'ACTIVE',
        expires_at: '2099-06-16T10:00:00Z',
        opened_at: null,
        last_opened_at: null,
        joined_at: null,
        created_at: null,
        updated_at: null,
      } as any
    })
    mockedRegenerateExternalSessionInvite.mockRejectedValue({
      response: { status: 409, data: { code: 'EXTERNAL_GUEST_INVITE_STATE_CONFLICT' } },
    })

    renderView()
    await screen.findByText('Деталі гостьової сесії')

    const regenerateButton = await screen.findByRole('button', { name: 'Отримати нове посилання' })
    await fireEvent.click(regenerateButton)

    await waitFor(() => {
      expect(mockedRegenerateExternalSessionInvite).toHaveBeenCalledWith(21)
      expect(mockedFetchExternalSessionInvite).toHaveBeenCalledTimes(2)
    })
    expect(screen.getByText('Запрошення ще не створено. Створіть його, щоб надіслати гостю безпечне посилання.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Перевидати' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Відкликати' })).not.toBeInTheDocument()
  })

  it('reloads invite state after 409 on revoke and removes stale active controls', async () => {
    mockedFetchExternalSessionInvite.mockReset()
    let inviteStatusCall = 0
    mockedFetchExternalSessionInvite.mockImplementation(async () => {
      inviteStatusCall += 1
      if (inviteStatusCall >= 2) return null as any
      return {
        id: 91,
        external_session_id: 21,
        status: 'ACTIVE',
        expires_at: '2099-06-16T10:00:00Z',
        opened_at: null,
        last_opened_at: null,
        joined_at: null,
        created_at: null,
        updated_at: null,
      } as any
    })
    mockedRevokeExternalSessionInvite.mockRejectedValue({
      response: { status: 409, data: { code: 'EXTERNAL_GUEST_INVITE_STATE_CONFLICT' } },
    })

    renderView()
    await screen.findByText('Деталі гостьової сесії')

    const revokeButton = await screen.findByRole('button', { name: 'Відкликати' })
    await fireEvent.click(revokeButton)

    await waitFor(() => {
      expect(mockedRevokeExternalSessionInvite).toHaveBeenCalledWith(21)
      expect(mockedFetchExternalSessionInvite).toHaveBeenCalledTimes(2)
    })
    expect(screen.getByText('Запрошення ще не створено. Створіть його, щоб надіслати гостю безпечне посилання.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Перевидати' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Відкликати' })).not.toBeInTheDocument()
  })
})
