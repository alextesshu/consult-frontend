import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import SettingsHubView from './SettingsHubView.vue'
import { resetAccountEmailVerificationForTests } from '../composables/useAccountEmailVerification'
import {
  cancelDataDeletionRequest,
  createDataDeletionRequest,
  fetchCabinetPaymentDetails,
  fetchCurrentDataDeletionRequest,
  initiateAccountEmailChange,
  resendAccountEmailVerification,
  updateCabinetPaymentDetails,
  type DataDeletionRequest,
} from '../lib/api'

const mockToast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}

const mockRoute = reactive<{ query: Record<string, unknown>; hash: string }>({
  query: {},
  hash: '',
})

const mockRouter = {
  replace: vi.fn((payload: { query?: Record<string, unknown>; hash?: string }) => {
    mockRoute.query = { ...mockRoute.query, ...(payload.query || {}) }
    mockRoute.hash = payload.hash || ''
  }),
  push: vi.fn(),
}

const mockAuthStore = {
  logout: vi.fn(),
  me: {
    user: {
      username: 'specialist-login',
      email: 'specialist@example.test',
      roles: ['SPECIALIST'],
    },
  } as any,
  user: null,
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => mockRoute,
    useRouter: () => mockRouter,
  }
})

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('../lib/api', () => ({
  cancelDataDeletionRequest: vi.fn(),
  createDataDeletionRequest: vi.fn(),
  fetchCabinetPaymentDetails: vi.fn(),
  fetchCurrentDataDeletionRequest: vi.fn(),
  initiateAccountEmailChange: vi.fn(),
  resendAccountEmailVerification: vi.fn(),
  updateCabinetPaymentDetails: vi.fn(),
  getApiErrorMessage: vi.fn((err: any, fallback: string) => err?.response?.data?.detail || fallback),
}))

const mockedCancelDataDeletionRequest = vi.mocked(cancelDataDeletionRequest)
const mockedCreateDataDeletionRequest = vi.mocked(createDataDeletionRequest)
const mockedFetchCabinetPaymentDetails = vi.mocked(fetchCabinetPaymentDetails)
const mockedFetchCurrentDataDeletionRequest = vi.mocked(fetchCurrentDataDeletionRequest)
const mockedInitiateAccountEmailChange = vi.mocked(initiateAccountEmailChange)
const mockedResendAccountEmailVerification = vi.mocked(resendAccountEmailVerification)
const mockedUpdateCabinetPaymentDetails = vi.mocked(updateCabinetPaymentDetails)

function paymentDetailsFixture(overrides: Record<string, unknown> = {}) {
  return {
    is_configured: false,
    available_methods: [],
    default_method_type: null,
    methods: {},
    ...overrides,
  }
}

function dataDeletionFixture(overrides: Partial<DataDeletionRequest> = {}): DataDeletionRequest {
  return {
    id: 41,
    kind: 'ACCOUNT',
    status: 'SUBMITTED',
    reason: '',
    submitted_at: '2026-06-16T12:00:00Z',
    reviewed_at: null,
    cancelled_at: null,
    ...overrides,
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

function renderView() {
  return render(SettingsHubView, {
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

function bankCard() {
  const card = screen.getByRole('heading', { name: 'Банківський рахунок (IBAN)' }).closest('article')
  if (!card) throw new Error('Bank card not found')
  return within(card)
}

function cardCard() {
  const card = screen.getByRole('heading', { name: 'Картка' }).closest('article')
  if (!card) throw new Error('Card card not found')
  return within(card)
}

describe('SettingsHubView dual payment methods', () => {
  beforeEach(() => {
    resetAccountEmailVerificationForTests()
    mockRoute.query = {}
    mockRoute.hash = ''
    mockRouter.replace.mockClear()
    mockRouter.push.mockReset()
    mockAuthStore.logout.mockReset()
    mockAuthStore.me = {
      user: {
        username: 'specialist-login',
        email: 'specialist@example.test',
        roles: ['SPECIALIST'],
      },
    }
    mockAuthStore.user = null

    mockedFetchCabinetPaymentDetails.mockReset()
    mockedFetchCurrentDataDeletionRequest.mockReset()
    mockedInitiateAccountEmailChange.mockReset()
    mockedResendAccountEmailVerification.mockReset()
    mockedUpdateCabinetPaymentDetails.mockReset()
    mockedCreateDataDeletionRequest.mockReset()
    mockedCancelDataDeletionRequest.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()
    mockedFetchCurrentDataDeletionRequest.mockResolvedValue(null)
  })

  it('shows canonical unverified email state and reuses resend cooldown behavior', async () => {
    mockAuthStore.me.user.email_verification_state = 'unverified'
    mockedResendAccountEmailVerification.mockResolvedValue({
      status: 'verification_sent',
      expires_at: '2026-08-29T12:00:00Z',
    })
    const view = renderView()
    await waitFor(() => expect(mockedFetchCurrentDataDeletionRequest).toHaveBeenCalledTimes(1))
    const settings = within(view.container as HTMLElement)
    await waitFor(() =>
      expect(settings.getByTestId('email-verification-status')).toHaveClass(
        'account-email-change__verification-status--unverified'
      )
    )
    await fireEvent.click(settings.getByTestId('email-verification-resend'))
    await waitFor(() => expect(mockedResendAccountEmailVerification).toHaveBeenCalledTimes(1))
    expect(settings.getByTestId('email-verification-resend')).toBeDisabled()
  })

  it('shows neutral legacy state without calling it verified', async () => {
    mockAuthStore.me.user.email_verification_state = 'legacy_unknown'
    const view = renderView()
    await waitFor(() => expect(mockedFetchCurrentDataDeletionRequest).toHaveBeenCalledTimes(1))
    const settings = within(view.container as HTMLElement)
    await waitFor(() =>
      expect(settings.getByTestId('email-verification-status')).toHaveClass(
        'account-email-change__verification-status--legacy_unknown'
      )
    )
    expect(settings.getByTestId('email-verification-resend')).toBeInTheDocument()
  })

  it('shows dedicated Реквізити tab in settings navigation', async () => {
    renderView()

    expect(screen.getByRole('link', { name: 'Реквізити' })).toHaveAttribute(
      'href',
      '/cabinet/settings?tab=payment-details'
    )
  })

  it('keeps hub as default and does not load payment details API until payment tab is open', async () => {
    renderView()

    await waitFor(() => {
      expect(mockedFetchCurrentDataDeletionRequest).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByRole('link', { name: 'Реквізити' })).toBeInTheDocument()
    const bookingSettingsLink = screen.getByRole('heading', { name: 'Запис і запити' }).closest('a')
    expect(bookingSettingsLink).toHaveAttribute('href', '/cabinet/slots?tab=settings')
    expect(
      screen.getByText('Оберіть, як клієнти можуть звертатися до вас із публічного профілю: через запит або запис на доступне вікно.')
    ).toBeInTheDocument()
    expect(screen.getByText('Налаштувати запис')).toBeInTheDocument()
    expect(screen.queryByText('Реквізити для оплати')).not.toBeInTheDocument()
    expect(mockedFetchCabinetPaymentDetails).not.toHaveBeenCalled()
  })

  it('shows account and data block with submit action when there is no current request', async () => {
    renderView()

    expect(await screen.findByRole('heading', { name: 'Акаунт і дані' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Видалити акаунт' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Скасувати видалення' })).not.toBeInTheDocument()
  })

  it('keeps account email and login separate from the public-page address', async () => {
    const view = renderView()

    const identity = await waitFor(() => {
      expect(mockedFetchCurrentDataDeletionRequest).toHaveBeenCalled()
      const currentIdentity = view.container.querySelector('.account-email-change__identity')
      if (!currentIdentity) throw new Error('Account email identity not rendered')
      return currentIdentity
    })
    expect(identity).toHaveTextContent('specialist@example.test')
    expect(identity).toHaveTextContent('Email акаунта')
    expect(identity).toHaveTextContent('Логін')
    expect(identity).toHaveTextContent('specialist-login')
    expect(identity.querySelectorAll('dd')).toHaveLength(2)
    expect(identity.parentElement).toHaveTextContent(
      'Email акаунта, логін і публічна адреса сторінки — окремі речі.'
    )
  })

  it('requires a new email and current password before initiating the change', async () => {
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Змінити email' }))
    expect(screen.getByLabelText('Новий email')).toBeInTheDocument()
    expect(screen.getByLabelText('Поточний пароль')).toBeInTheDocument()
    const form = screen.getByRole('button', { name: 'Надіслати підтвердження' }).closest('form')
    if (!form) throw new Error('Email-change form not found')
    await fireEvent.submit(form)

    expect(await screen.findByText('Вкажіть новий email і поточний пароль.')).toBeInTheDocument()
    expect(mockedInitiateAccountEmailChange).not.toHaveBeenCalled()
  })

  it('keeps the current email visible until verification succeeds', async () => {
    mockedInitiateAccountEmailChange.mockResolvedValue({ status: 'verification_sent' })
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Змінити email' }))
    await fireEvent.update(screen.getByLabelText('Новий email'), 'new-address@example.test')
    await fireEvent.update(screen.getByLabelText('Поточний пароль'), 'TestPass123!')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати підтвердження' }))

    await waitFor(() => {
      expect(mockedInitiateAccountEmailChange).toHaveBeenCalledWith('new-address@example.test', 'TestPass123!')
    })
    expect(screen.getByText('Лист підтвердження надіслано. Поточний email залишатиметься активним, доки ви не підтвердите нову адресу.')).toBeInTheDocument()
    expect(screen.getByText('specialist@example.test')).toBeInTheDocument()
    expect(screen.queryByText('new-address@example.test')).not.toBeInTheDocument()
  })

  it('locks the email-change form until the initiation request resolves', async () => {
    const request = deferred<{ status: 'verification_sent' }>()
    mockedInitiateAccountEmailChange.mockReturnValue(request.promise)
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Змінити email' }))
    const newEmail = screen.getByLabelText('Новий email')
    const currentPassword = screen.getByLabelText('Поточний пароль')
    const submit = screen.getByRole('button', { name: 'Надіслати підтвердження' })
    const cancel = screen.getByRole('button', { name: 'Скасувати' })
    await fireEvent.update(newEmail, 'new-address@example.test')
    await fireEvent.update(currentPassword, 'TestPass123!')
    await fireEvent.click(submit)

    await waitFor(() => {
      expect(mockedInitiateAccountEmailChange).toHaveBeenCalledWith(
        'new-address@example.test',
        'TestPass123!'
      )
    })
    expect(newEmail).toBeDisabled()
    expect(currentPassword).toBeDisabled()
    expect(submit).toBeDisabled()
    expect(cancel).toBeDisabled()

    expect(mockedInitiateAccountEmailChange).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Новий email')).toBeInTheDocument()

    request.resolve({ status: 'verification_sent' })
    expect(
      await screen.findByText(
        'Лист підтвердження надіслано. Поточний email залишатиметься активним, доки ви не підтвердите нову адресу.'
      )
    ).toBeInTheDocument()
  })

  it('shows a safe API error when email-change initiation fails', async () => {
    mockedInitiateAccountEmailChange.mockRejectedValue({
      response: { data: { detail: 'Не вдалося використати цей email.' } },
    })
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Змінити email' }))
    await fireEvent.update(screen.getByLabelText('Новий email'), 'new-address@example.test')
    await fireEvent.update(screen.getByLabelText('Поточний пароль'), 'TestPass123!')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати підтвердження' }))

    expect(await screen.findByText('Не вдалося використати цей email.')).toBeInTheDocument()
  })

  it('executes account deletion from confirm modal, clears auth, and redirects', async () => {
    mockedCreateDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'EXECUTED',
      })
    )

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Видалити акаунт' }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Видалити акаунт?',
    })
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument()
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Видалити акаунт' }))

    await waitFor(() => {
      expect(mockedCreateDataDeletionRequest).toHaveBeenCalledWith()
    })
    expect(mockAuthStore.logout).toHaveBeenCalledTimes(1)
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
    expect(mockToast.success).toHaveBeenCalledWith('Акаунт видалено.')
  })

  it('shows neutral blocked message with blocker labels', async () => {
    mockedCreateDataDeletionRequest.mockRejectedValue({
      response: {
        data: {
          code: 'ACCOUNT_DELETION_BLOCKED',
          blockers: {
            counts: {
              future_sessions_count: 1,
            },
            items: [
              {
                code: 'future_sessions_count',
                count: 1,
                label: 'Є майбутні сесії. Завершіть або скасуйте їх перед видаленням акаунта.',
              },
            ],
          },
        },
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Видалити акаунт' }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Видалити акаунт?',
    })
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Видалити акаунт' }))

    expect(
      await screen.findByText(
        'Зараз видалення акаунта не завершено. Завершіть активні дії в акаунті та спробуйте ще раз.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Є майбутні сесії. Завершіть або скасуйте їх перед видаленням акаунта.'
      )
    ).toBeInTheDocument()
    expect(mockAuthStore.logout).not.toHaveBeenCalled()
  })

  it('shows current request and allows cancel while request is in review', async () => {
    mockedFetchCurrentDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'IN_REVIEW',
      })
    )
    mockedCancelDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'CANCELLED',
        cancelled_at: '2026-06-17T10:00:00Z',
      })
    )

    renderView()

    expect(await screen.findByText('Видалення акаунта в обробці')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати видалення' }))

    await waitFor(() => {
      expect(mockedCancelDataDeletionRequest).toHaveBeenCalledWith(41)
    })
    expect(await screen.findByText('Видалення акаунта скасовано')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Видалити акаунт' })).toBeInTheDocument()
    expect(mockToast.success).toHaveBeenCalledWith('Видалення акаунта скасовано.')
  })

  it('shows approved state without submit or cancel actions', async () => {
    mockedFetchCurrentDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'APPROVED',
        reviewed_at: '2026-06-17T09:00:00Z',
      })
    )

    renderView()

    expect(await screen.findByText('Видалення акаунта в обробці')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Видалити акаунт' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Скасувати видалення' })).not.toBeInTheDocument()
  })

  it('keeps banned phrases out of the deletion flow copy', async () => {
    const { container } = renderView()

    await screen.findByRole('heading', { name: 'Акаунт і дані' })

    expect(container.textContent).not.toMatch(
      /запит на видалення|підтримка|перевірка|процедура|ризик|історія сервісу|дані іншої сторони|зв’яжеться з вами/i
    )
  })

  it('supports canonical payment tab and 0-method empty state', async () => {
    mockRoute.query = { tab: 'payment-details' }
    mockedFetchCabinetPaymentDetails.mockResolvedValue(paymentDetailsFixture())

    renderView()

    expect(await screen.findByText('Реквізити для оплати')).toBeInTheDocument()
    expect(bankCard().getByRole('button', { name: 'Додати IBAN' })).toBeInTheDocument()
    expect(cardCard().getByRole('button', { name: 'Додати картку' })).toBeInTheDocument()
    expect(screen.queryByText('За замовчуванням')).not.toBeInTheDocument()
  })

  it('saves bank account method without affecting card method', async () => {
    mockRoute.query = { tab: 'payment-details' }
    mockedFetchCabinetPaymentDetails.mockResolvedValue(paymentDetailsFixture())
    mockedUpdateCabinetPaymentDetails.mockResolvedValue(
      paymentDetailsFixture({
        is_configured: true,
        available_methods: ['bank_account'],
        default_method_type: 'bank_account',
        methods: {
          bank_account: {
            recipient_name: 'ФОП Тест',
            iban: 'UA111',
            card_number: '',
            bank_name: 'A-Bank',
            payment_purpose: 'Оплата',
            comment: '',
          },
        },
      })
    )

    renderView()

    await screen.findByText('Реквізити для оплати')
    await fireEvent.click(bankCard().getByRole('button', { name: 'Додати IBAN' }))
    await fireEvent.update(bankCard().getByPlaceholderText('ПІБ або назва ФОП/компанії'), 'ФОП Тест')
    await fireEvent.update(bankCard().getByPlaceholderText('UA...'), 'UA111')
    await fireEvent.update(bankCard().getByLabelText("Назва банку (необов'язково)"), 'A-Bank')
    await fireEvent.update(bankCard().getByLabelText("Призначення платежу (необов'язково)"), 'Оплата')
    await fireEvent.click(bankCard().getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedUpdateCabinetPaymentDetails).toHaveBeenCalledWith({
        methods: {
          bank_account: {
            recipient_name: 'ФОП Тест',
            iban: 'UA111',
            card_number: '',
            bank_name: 'A-Bank',
            payment_purpose: 'Оплата',
            comment: '',
          },
        },
      })
    })
    expect(await screen.findByText('UA111')).toBeInTheDocument()
    expect(cardCard().getByRole('button', { name: 'Додати картку' })).toBeInTheDocument()
  })

  it('deletes only one method and preserves second method', async () => {
    mockRoute.query = { tab: 'payment-details' }
    mockedFetchCabinetPaymentDetails.mockResolvedValue(
      paymentDetailsFixture({
        is_configured: true,
        available_methods: ['bank_account', 'card'],
        default_method_type: 'card',
        methods: {
          bank_account: {
            recipient_name: 'ФОП Тест',
            iban: 'UA111',
            card_number: '',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
          card: {
            recipient_name: 'ФОП Тест',
            iban: '',
            card_number: '4444 3333 2222 1111',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
        },
      })
    )
    mockedUpdateCabinetPaymentDetails.mockResolvedValue(
      paymentDetailsFixture({
        is_configured: true,
        available_methods: ['card'],
        default_method_type: 'card',
        methods: {
          card: {
            recipient_name: 'ФОП Тест',
            iban: '',
            card_number: '4444 3333 2222 1111',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
        },
      })
    )

    renderView()

    await screen.findByText('UA111')
    await fireEvent.click(bankCard().getByRole('button', { name: 'Видалити' }))

    await waitFor(() => {
      expect(mockedUpdateCabinetPaymentDetails).toHaveBeenCalledWith({
        methods: { bank_account: null },
      })
    })
    expect(await screen.findByText('4444 3333 2222 1111')).toBeInTheDocument()
    expect(bankCard().getByRole('button', { name: 'Додати IBAN' })).toBeInTheDocument()
  })

  it('updates default method when both methods are configured', async () => {
    mockRoute.query = { tab: 'payment-details' }
    mockedFetchCabinetPaymentDetails.mockResolvedValue(
      paymentDetailsFixture({
        is_configured: true,
        available_methods: ['bank_account', 'card'],
        default_method_type: 'bank_account',
        methods: {
          bank_account: {
            recipient_name: 'ФОП Тест',
            iban: 'UA111',
            card_number: '',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
          card: {
            recipient_name: 'ФОП Тест',
            iban: '',
            card_number: '4444 3333 2222 1111',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
        },
      })
    )
    mockedUpdateCabinetPaymentDetails.mockResolvedValue(
      paymentDetailsFixture({
        is_configured: true,
        available_methods: ['bank_account', 'card'],
        default_method_type: 'card',
        methods: {
          bank_account: {
            recipient_name: 'ФОП Тест',
            iban: 'UA111',
            card_number: '',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
          card: {
            recipient_name: 'ФОП Тест',
            iban: '',
            card_number: '4444 3333 2222 1111',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
        },
      })
    )

    renderView()

    await screen.findByText('За замовчуванням')
    await fireEvent.click(screen.getByRole('radio', { name: 'Картка' }))

    await waitFor(() => {
      expect(mockedUpdateCabinetPaymentDetails).toHaveBeenCalledWith({
        default_method_type: 'card',
      })
      expect(mockToast.success).toHaveBeenCalledWith('Метод за замовчуванням оновлено.')
    })
  })

  it('supports legacy hash landing by canonically switching to query tab', async () => {
    mockRoute.hash = '#payment-details'
    mockedFetchCabinetPaymentDetails.mockResolvedValue(paymentDetailsFixture())

    renderView()

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith({
        path: '/cabinet/settings',
        query: { tab: 'payment-details' },
        hash: '',
      })
    })
  })
})
