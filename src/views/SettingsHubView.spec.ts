import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsHubView from './SettingsHubView.vue'
import { fetchCabinetPaymentDetails, updateCabinetPaymentDetails } from '../lib/api'

const mockToast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}

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
        SettingsSubnav: { template: '<div data-testid="settings-subnav" />' },
        RouterLink: {
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>',
        },
      },
    },
  })
}

describe('SettingsHubView payment details', () => {
  beforeEach(() => {
    mockedFetchCabinetPaymentDetails.mockReset()
    mockedUpdateCabinetPaymentDetails.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()
  })

  it('shows loading then empty state when payment details are not configured', async () => {
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

    expect(screen.getByText('Завантаження...')).toBeInTheDocument()
    expect(await screen.findByText('Реквізити ще не додані. Додайте їх, щоб запитувати підтвердження оплати у сесіях.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Додати реквізити' })).toBeInTheDocument()
  })

  it('renders configured bank account details in view mode', async () => {
    mockedFetchCabinetPaymentDetails.mockResolvedValue({
      method_type: 'bank_account',
      recipient_name: 'ФОП Петренко',
      iban: 'UA123',
      card_number: '',
      bank_name: 'Monobank',
      payment_purpose: 'Оплата консультації',
      comment: 'Після оплати надішліть скрін',
    })

    renderView()

    expect(await screen.findByText('Банківський рахунок (IBAN)')).toBeInTheDocument()
    expect(screen.getByText('UA123')).toBeInTheDocument()
    expect(screen.getByText('Monobank')).toBeInTheDocument()
    expect(screen.getByText('Оплата консультації')).toBeInTheDocument()
    expect(screen.getByText('Після оплати надішліть скрін')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Редагувати' })).toBeInTheDocument()
  })

  it('renders configured card details in view mode', async () => {
    mockedFetchCabinetPaymentDetails.mockResolvedValue({
      method_type: 'card',
      recipient_name: 'Іван Коваль',
      iban: '',
      card_number: '4444 3333 2222 1111',
      bank_name: '',
      payment_purpose: '',
      comment: '',
    })

    renderView()

    expect(await screen.findByText('Картка')).toBeInTheDocument()
    expect(screen.getByText('4444 3333 2222 1111')).toBeInTheDocument()
  })

  it('allows editing and saving payment details successfully', async () => {
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

  it('shows validation error and does not submit invalid form', async () => {
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

    await screen.findByRole('button', { name: 'Додати реквізити' })
    await fireEvent.click(screen.getByRole('button', { name: 'Додати реквізити' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(await screen.findByText('Вкажіть отримувача.')).toBeInTheDocument()
    expect(mockedUpdateCabinetPaymentDetails).not.toHaveBeenCalled()
  })

  it('shows save error and stays in edit mode when PATCH fails', async () => {
    mockedFetchCabinetPaymentDetails.mockResolvedValue({
      method_type: null,
      recipient_name: '',
      iban: '',
      card_number: '',
      bank_name: '',
      payment_purpose: '',
      comment: '',
    })
    mockedUpdateCabinetPaymentDetails.mockRejectedValue({
      response: {
        data: {
          detail: 'Save failed.',
        },
      },
    })

    renderView()

    await screen.findByRole('button', { name: 'Додати реквізити' })
    await fireEvent.click(screen.getByRole('button', { name: 'Додати реквізити' }))
    await fireEvent.update(screen.getByPlaceholderText('ПІБ або назва ФОП/компанії'), 'ФОП Тест')
    await fireEvent.update(screen.getByPlaceholderText('UA...'), 'UA123')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(await screen.findByText('Save failed.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Скасувати' })).toBeInTheDocument()
  })
})
