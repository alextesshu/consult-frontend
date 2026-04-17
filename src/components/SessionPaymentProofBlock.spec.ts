import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SessionPaymentProofBlock from './SessionPaymentProofBlock.vue'
import {
  fetchSessionPaymentProof,
  markSessionPaymentProofPaid,
  requestSessionPaymentProof,
  requestSessionPaymentProofClarification,
  uploadSessionPaymentProof,
} from '../lib/api'

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
  fetchSessionPaymentProof: vi.fn(),
  requestSessionPaymentProof: vi.fn(),
  markSessionPaymentProofPaid: vi.fn(),
  requestSessionPaymentProofClarification: vi.fn(),
  uploadSessionPaymentProof: vi.fn(),
}))

const mockedFetchSessionPaymentProof = vi.mocked(fetchSessionPaymentProof)
const mockedRequestSessionPaymentProof = vi.mocked(requestSessionPaymentProof)
const mockedMarkSessionPaymentProofPaid = vi.mocked(markSessionPaymentProofPaid)
const mockedRequestSessionPaymentProofClarification = vi.mocked(requestSessionPaymentProofClarification)
const mockedUploadSessionPaymentProof = vi.mocked(uploadSessionPaymentProof)

function buildPaymentProof(overrides: Record<string, unknown> = {}) {
  return {
    status: 'REQUESTED',
    image_url: null,
    requested_by_specialist_at: '2099-01-01T10:00:00Z',
    submitted_by_client_at: null,
    reviewed_by_specialist_at: null,
    marked_paid_at: null,
    clarification_requested_at: null,
    specialist_note: '',
    client_can_upload_now: false,
    specialist_can_mark_paid_now: false,
    specialist_can_request_clarification_now: false,
    specialist_can_request_proof_now: false,
    payment_instructions: null,
    ...overrides,
  }
}

describe('SessionPaymentProofBlock payment instructions', () => {
  const paymentDetailsMissingCopy =
    'Щоб запросити оплату, спочатку додайте реквізити для оплати.'

  beforeEach(() => {
    mockedFetchSessionPaymentProof.mockReset()
    mockedRequestSessionPaymentProof.mockReset()
    mockedMarkSessionPaymentProofPaid.mockReset()
    mockedRequestSessionPaymentProofClarification.mockReset()
    mockedUploadSessionPaymentProof.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('renders bank account instructions from snapshot and shows snapshot_created_at', async () => {
    render(SessionPaymentProofBlock, {
      props: {
        sessionId: 42,
        role: 'client',
        paymentProof: buildPaymentProof({
          payment_instructions: {
            method_type: 'bank_account',
            snapshot_created_at: '2099-06-15T11:30:00Z',
            recipient_name: 'ФОП Анна',
            iban: 'UA555',
            card_number: '',
            bank_name: 'Monobank',
            payment_purpose: 'Оплата консультації',
            comment: 'Оплатіть до сесії',
          },
        }),
      },
    })

    expect(await screen.findByText('Платіжні реквізити')).toBeInTheDocument()
    expect(screen.getByText('Банківський рахунок (IBAN)')).toBeInTheDocument()
    expect(screen.getByText('ФОП Анна')).toBeInTheDocument()
    expect(screen.getByText('UA555')).toBeInTheDocument()
    expect(screen.getByText('Monobank')).toBeInTheDocument()
    expect(screen.getByText('Оплата консультації')).toBeInTheDocument()
    expect(screen.getByText('Оплатіть до сесії')).toBeInTheDocument()
    expect(screen.getByText(/15\.06\.2099/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Скопіювати IBAN' })).toBeInTheDocument()
  })

  it('renders card instructions and works when iban is empty string', async () => {
    render(SessionPaymentProofBlock, {
      props: {
        sessionId: 42,
        role: 'client',
        paymentProof: buildPaymentProof({
          payment_instructions: {
            method_type: 'card',
            recipient_name: 'Іван Коваль',
            card_number: '4444 3333 2222 1111',
            iban: '',
          },
        }),
      },
    })

    expect(await screen.findByText('Картка')).toBeInTheDocument()
    expect(screen.getByText('4444 3333 2222 1111')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Скопіювати номер картки' })).toBeInTheDocument()
  })

  it('renders optional fields only when present and not when empty strings', async () => {
    render(SessionPaymentProofBlock, {
      props: {
        sessionId: 42,
        role: 'client',
        paymentProof: buildPaymentProof({
          payment_instructions: {
            method_type: 'bank_account',
            recipient_name: 'ФОП Тест',
            iban: 'UA777',
            card_number: '',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
        }),
      },
    })

    expect(await screen.findByText('UA777')).toBeInTheDocument()
    expect(screen.queryByText('Призначення платежу')).not.toBeInTheDocument()
    expect(screen.queryByText('Коментар')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Скопіювати призначення' })).not.toBeInTheDocument()
  })

  it('copies main value, purpose, and all requisites', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    })

    render(SessionPaymentProofBlock, {
      props: {
        sessionId: 42,
        role: 'client',
        paymentProof: buildPaymentProof({
          payment_instructions: {
            method_type: 'bank_account',
            recipient_name: 'ФОП Тест',
            iban: 'UA123456',
            card_number: '',
            payment_purpose: 'Оплата',
          },
        }),
      },
    })

    await screen.findByText('UA123456')
    await fireEvent.click(screen.getByRole('button', { name: 'Скопіювати IBAN' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Скопіювати призначення' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Скопіювати всі реквізити' }))

    expect(writeText).toHaveBeenCalledWith('UA123456')
    expect(writeText).toHaveBeenCalledWith('Оплата')
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('IBAN: UA123456'))
    expect(mockToast.success).toHaveBeenCalledWith('Скопійовано')
  })

  it('emits payment-details-missing event for specialist request action', async () => {
    mockedRequestSessionPaymentProof.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'PAYMENT_DETAILS_MISSING',
          detail: 'Specialist payment details are not configured.',
        },
      },
    })

    const view = render(SessionPaymentProofBlock, {
      props: {
        sessionId: 42,
        role: 'specialist',
        paymentProof: buildPaymentProof({
          specialist_can_request_proof_now: true,
          payment_instructions: null,
        }),
      },
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Запросити оплату' }))

    await waitFor(() => {
      expect(mockedRequestSessionPaymentProof).toHaveBeenCalledWith(42)
    })

    const emitted = view.emitted('payment-details-missing')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual([paymentDetailsMissingCopy])
    expect(mockToast.error).not.toHaveBeenCalled()
  })

  it('emits payment-details-missing event when backend returns reason_code shape', async () => {
    mockedRequestSessionPaymentProof.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'STATE_TRANSITION_INVALID',
          reason_code: 'PAYMENT_DETAILS_MISSING',
          detail: 'Specialist payment details are not configured.',
        },
      },
    })

    const view = render(SessionPaymentProofBlock, {
      props: {
        sessionId: 42,
        role: 'specialist',
        paymentProof: buildPaymentProof({
          specialist_can_request_proof_now: true,
        }),
      },
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Запросити оплату' }))

    await waitFor(() => {
      expect(mockedRequestSessionPaymentProof).toHaveBeenCalledWith(42)
    })

    const emitted = view.emitted('payment-details-missing')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual([paymentDetailsMissingCopy])
    expect(mockToast.error).not.toHaveBeenCalled()
  })

  it.each([
    ['PAYMENT_PROOF_STATE_INVALID', 400, 'Неможливо виконати дію у поточному стані.'],
    ['SERVICE_UNAVAILABLE', 503, 'Сервіс тимчасово недоступний.'],
    ['PERMISSION_DENIED', 403, 'Доступ заборонено.'],
  ])('keeps regular error UX for %s without inline payment-details CTA', async (code, status, detail) => {
    mockedRequestSessionPaymentProof.mockRejectedValue({
      response: {
        status,
        data: {
          code,
          detail,
        },
      },
    })

    const view = render(SessionPaymentProofBlock, {
      props: {
        sessionId: 42,
        role: 'specialist',
        paymentProof: buildPaymentProof({
          specialist_can_request_proof_now: true,
          payment_instructions: null,
        }),
      },
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Запросити оплату' }))

    await waitFor(() => {
      expect(mockedRequestSessionPaymentProof).toHaveBeenCalledWith(42)
    })

    expect(view.emitted('payment-details-missing')).toBeFalsy()
    expect(mockToast.error).toHaveBeenCalledWith(detail)
  })
})
