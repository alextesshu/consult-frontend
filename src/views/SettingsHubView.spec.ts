import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import SettingsHubView from './SettingsHubView.vue'
import { fetchCabinetPaymentDetails, updateCabinetPaymentDetails } from '../lib/api'

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

vi.mock('../lib/api', () => ({
  fetchCabinetPaymentDetails: vi.fn(),
  updateCabinetPaymentDetails: vi.fn(),
  getApiErrorMessage: vi.fn((err: any, fallback: string) => err?.response?.data?.detail || fallback),
}))

const mockedFetchCabinetPaymentDetails = vi.mocked(fetchCabinetPaymentDetails)
const mockedUpdateCabinetPaymentDetails = vi.mocked(updateCabinetPaymentDetails)

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

describe('SettingsHubView payment-details tab', () => {
  beforeEach(() => {
    mockRoute.query = {}
    mockRoute.hash = ''
    mockRouter.replace.mockClear()

    mockedFetchCabinetPaymentDetails.mockReset()
    mockedUpdateCabinetPaymentDetails.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()
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

    expect(screen.getByRole('link', { name: 'Реквізити' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Профіль' })).toBeInTheDocument()
    expect(screen.queryByText('Реквізити для оплати')).not.toBeInTheDocument()
    expect(mockedFetchCabinetPaymentDetails).not.toHaveBeenCalled()
  })

  it('opens payment details when tab=payment-details is in query', async () => {
    mockRoute.query = { tab: 'payment-details' }
    mockedFetchCabinetPaymentDetails.mockResolvedValue({
      method_type: null,
      recipient_name: '',
      iban: '',
      card_number: '',
      bank_name: '',
      payment_purpose: '',
      comment: '',
    })

    renderView()

    expect(await screen.findByText('Реквізити для оплати')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Додати реквізити' })).toBeInTheDocument()
    expect(mockedFetchCabinetPaymentDetails).toHaveBeenCalledTimes(1)
  })

  it('supports legacy hash landing by canonically switching to query tab', async () => {
    mockRoute.hash = '#payment-details'
    mockedFetchCabinetPaymentDetails.mockResolvedValue({
      method_type: null,
      recipient_name: '',
      iban: '',
      card_number: '',
      bank_name: '',
      payment_purpose: '',
      comment: '',
    })

    renderView()

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith({
        path: '/cabinet/settings',
        query: { tab: 'payment-details' },
        hash: '',
      })
    })

    expect(await screen.findByText('Реквізити для оплати')).toBeInTheDocument()
  })

  it('keeps payment details save/edit behavior unchanged inside Реквізити tab', async () => {
    mockRoute.query = { tab: 'payment-details' }
    mockedFetchCabinetPaymentDetails.mockResolvedValue({
      method_type: null,
      recipient_name: '',
      iban: '',
      card_number: '',
      bank_name: '',
      payment_purpose: '',
      comment: '',
    })
    mockedUpdateCabinetPaymentDetails.mockResolvedValue({
      method_type: 'bank_account',
      recipient_name: 'ФОП Тест',
      iban: 'UA999',
      card_number: '',
      bank_name: 'A-Bank',
      payment_purpose: 'Оплата послуги',
      comment: '',
    })

    renderView()

    await screen.findByRole('button', { name: 'Додати реквізити' })
    await fireEvent.click(screen.getByRole('button', { name: 'Додати реквізити' }))
    await fireEvent.update(screen.getByPlaceholderText('ПІБ або назва ФОП/компанії'), 'ФОП Тест')
    await fireEvent.update(screen.getByPlaceholderText('UA...'), 'UA999')
    await fireEvent.update(screen.getByLabelText("Назва банку (необов'язково)"), 'A-Bank')
    await fireEvent.update(screen.getByLabelText("Призначення платежу (необов'язково)"), 'Оплата послуги')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedUpdateCabinetPaymentDetails).toHaveBeenCalledWith({
        method_type: 'bank_account',
        recipient_name: 'ФОП Тест',
        iban: 'UA999',
        card_number: '',
        bank_name: 'A-Bank',
        payment_purpose: 'Оплата послуги',
        comment: '',
      })
      expect(mockToast.success).toHaveBeenCalledWith('Реквізити для оплати збережено.')
    })

    expect(await screen.findByText('UA999')).toBeInTheDocument()
  })
})
