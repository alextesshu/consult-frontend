import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  fetchSessionPaymentProof,
  requestSessionPaymentProof,
  markSessionPaymentProofPaid,
  requestSessionPaymentProofClarification,
  uploadSessionPaymentProof,
  updateSpecialistSessionMeeting,
} from '../lib/api'
import { BOOKING_SUCCESS_MESSAGES } from '../lib/bookingCopy'
import { formatSessionDateTime } from '../lib/specialistSessions'
import TherapistSessionDetailView from './TherapistSessionDetailView.vue'
import { createPracticeBoardItem, fetchPracticeBoards } from '../lib/specialistPracticeBoard'

const mockRoute = {
  params: {
    id: '42',
  },
  query: {} as Record<string, unknown>,
}

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn().mockResolvedValue(undefined),
}

const mockToast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
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
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  fetchSessionPaymentProof: vi.fn(),
  requestSessionPaymentProof: vi.fn(),
  markSessionPaymentProofPaid: vi.fn(),
  requestSessionPaymentProofClarification: vi.fn(),
  uploadSessionPaymentProof: vi.fn(),
  updateSpecialistSessionMeeting: vi.fn(),
}))
vi.mock('../lib/specialistPracticeBoard', () => ({
  createPracticeBoardItem: vi.fn(),
  fetchPracticeBoards: vi.fn(),
  resolveDefaultPracticeBoardId: (boards: Array<{ id: number | string; is_default: boolean }>) =>
    boards.find((b) => b.is_default)?.id ?? boards[0]?.id ?? null,
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPatch = vi.mocked(apiPatch)
const mockedApiPost = vi.mocked(apiPost)
const mockedApiPut = vi.mocked(apiPut)
const mockedFetchSessionPaymentProof = vi.mocked(fetchSessionPaymentProof)
const mockedRequestSessionPaymentProof = vi.mocked(requestSessionPaymentProof)
const mockedMarkSessionPaymentProofPaid = vi.mocked(markSessionPaymentProofPaid)
const mockedRequestSessionPaymentProofClarification = vi.mocked(requestSessionPaymentProofClarification)
const mockedUploadSessionPaymentProof = vi.mocked(uploadSessionPaymentProof)
const mockedUpdateSpecialistSessionMeeting = vi.mocked(updateSpecialistSessionMeeting)
const mockedCreatePracticeBoardItem = vi.mocked(createPracticeBoardItem)
const mockedFetchPracticeBoards = vi.mocked(fetchPracticeBoards)

function buildSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    status: 'SCHEDULED',
    client: 77,
    client_name: 'Test Client',
    client_email: 'client@example.com',
    therapist: 3,
    slot_start_at: '2099-06-15T10:00:00Z',
    slot_end_at: '2099-06-15T11:00:00Z',
    session_format: 'online',
    offline_location: null,
    payment_proof: null,
    ...overrides,
  }
}

function buildWorkspace(overrides: Record<string, unknown> = {}) {
  return {
    session_id: 42,
    lifecycle_status: 'completed',
    payment_state: 'unpaid',
    note_state: 'missing',
    workbook_state: 'missing',
    payment_updated_at: '2099-06-15T12:00:00Z',
    note_updated_at: '2099-06-15T12:00:00Z',
    workbook_updated_at: '2099-06-15T12:00:00Z',
    permissions: {
      can_edit_note: true,
      can_view_note: true,
      can_edit_workbook: true,
      can_view_workbook: true,
      can_mark_payment_paid: true,
      can_request_payment_proof: true,
      can_request_payment_clarification: true,
      can_upload_payment_proof: true,
    },
    available_action_items: [
      { code: 'OPEN_NOTE', label: 'Open note', classification: 'capability', urgency: 'low', blocking_scope: 'workspace' },
      { code: 'OPEN_WORKBOOK', label: 'Open workbook', classification: 'capability', urgency: 'low', blocking_scope: 'workspace' },
      { code: 'REQUEST_PAYMENT_PROOF', label: 'Request payment', classification: 'capability', urgency: 'normal', blocking_scope: 'client' },
    ],
    pending_task_items: [
      { code: 'COMPLETE_NOTE', label: 'Complete note', classification: 'recommended', urgency: 'normal', blocking_scope: 'workspace' },
      { code: 'COMPLETE_WORKBOOK', label: 'Complete workbook', classification: 'recommended', urgency: 'normal', blocking_scope: 'workspace' },
      { code: 'COMPLETE_PAYMENT_REVIEW', label: 'Complete payment review', classification: 'required', urgency: 'urgent', blocking_scope: 'session' },
    ],
    available_actions: ['OPEN_NOTE', 'OPEN_WORKBOOK', 'REQUEST_PAYMENT_PROOF'],
    pending_tasks: ['COMPLETE_NOTE', 'COMPLETE_WORKBOOK', 'COMPLETE_PAYMENT_REVIEW'],
    ...overrides,
  }
}

function buildSlot(overrides: Record<string, unknown> = {}) {
  return {
    id: 9,
    start_at: '2099-06-16T10:00:00Z',
    end_at: '2099-06-16T11:00:00Z',
    is_booked: false,
    ...overrides,
  }
}

function buildSuggestion(overrides: Record<string, unknown> = {}) {
  return {
    slot_id: 9,
    start_at: '2099-06-16T10:00:00Z',
    end_at: '2099-06-16T11:00:00Z',
    label: 'Next slot',
    reason_tag: 'nearest_available',
    ...overrides,
  }
}

function buildRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 15,
    session_id: 42,
    requested_slot_id: 9,
    requested_slot_start_at: '2099-06-17T10:00:00Z',
    requested_slot_end_at: '2099-06-17T11:00:00Z',
    client_name: 'Test Client',
    client_email: 'request@example.com',
    status: 'PENDING',
    ...overrides,
  }
}

type DetailRequest = ReturnType<typeof buildRequest>

function mockDetailContext(
  getSession: () => Record<string, unknown>,
  options: {
    slots?: Record<string, unknown>[]
    suggestions?: Record<string, unknown>[]
    note?: string
    requests?: Record<string, unknown>[]
  } = {}
) {
  const {
    slots = [buildSlot()],
    suggestions = [buildSuggestion()],
    note = 'Progress note',
    requests = [buildRequest()],
  } = options

  mockedApiGet.mockImplementation(async (url) => {
    if (url === `/booking/sessions/${mockRoute.params.id}/`) {
      return getSession()
    }

    if (url === '/cabinet/slots/') {
      return slots
    }

    if (url === `/booking/sessions/${mockRoute.params.id}/reschedule-suggestions/`) {
      return {
        suggestions,
      }
    }

    if (url === `/cabinet/sessions/${mockRoute.params.id}/note/`) {
      return {
        content: note,
      }
    }

    if (url === '/cabinet/sessions/reschedule-requests/') {
      return requests
    }

    throw new Error(`Unexpected apiGet call: ${url}`)
  })
}

function endpointCalls(url: string) {
  return mockedApiGet.mock.calls.filter(([calledUrl]) => calledUrl === url).length
}

function renderView() {
  return render(TherapistSessionDetailView, {
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

describe('TherapistSessionDetailView', () => {
  beforeEach(() => {
    mockRoute.params.id = '42'
    mockRoute.query = {}
    mockRouter.push.mockReset()
    mockRouter.replace.mockReset()
    mockedApiGet.mockReset()
    mockedApiPatch.mockReset()
    mockedApiPost.mockReset()
    mockedApiPut.mockReset()
    mockedFetchSessionPaymentProof.mockReset()
    mockedRequestSessionPaymentProof.mockReset()
    mockedMarkSessionPaymentProofPaid.mockReset()
    mockedRequestSessionPaymentProofClarification.mockReset()
    mockedUploadSessionPaymentProof.mockReset()
    mockedUpdateSpecialistSessionMeeting.mockReset()
    mockedCreatePracticeBoardItem.mockReset()
    mockedFetchPracticeBoards.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()
  })

  it('renders the session detail happy path with related context', async () => {
    let sessionDetail = buildSession({
      status: 'CONFIRMED',
      meeting_mode: 'ONLINE',
      meeting_url: 'https://meet.google.com/therapist-room',
      meeting_provider: 'google_meet',
      meeting_link_ready: true,
      join_available: true,
      join_starts_at: '2099-06-14T10:00:00Z',
      join_ends_at: '2099-06-15T11:30:00Z',
    })
    mockDetailContext(() => sessionDetail)

    const { container } = renderView()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledTimes(5)
    })

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    expect(screen.queryByText('Сесія спеціаліста')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Деталі сесії' })).toBeInTheDocument()
    expect(
      screen.getByText(`${formatSessionDateTime(sessionDetail.slot_start_at as string)} · Test Client · Підтверджено`)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Назад до списку' })).toHaveAttribute('href', '/cabinet/sessions')
    expect(screen.getByText(/ID: #77/)).toBeInTheDocument()
    expect(await screen.findByText('request@example.com')).toBeInTheDocument()
    expect(screen.getByText('Приватна нотатка прихована. Доступ має лише спеціаліст.')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Progress note')).not.toBeInTheDocument()
    await fireEvent.click(await screen.findByRole('button', { name: 'Відкрити нотатку' }))
    expect(await screen.findByDisplayValue('Progress note')).toBeInTheDocument()
    expect(screen.getByText(/Цей простір призначений для робочих нотаток спеціаліста/)).toBeInTheDocument()
    expect(screen.getByText(/Не використовуйте його для ведення офіційної медичної документації/)).toBeInTheDocument()

    expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/42/')
    expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/slots/')
    expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/42/reschedule-suggestions/')
    expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/sessions/42/note/')
    expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/sessions/reschedule-requests/')
    expect(container.querySelector('.note-header-actions button.btn')).toBeInTheDocument()
    expect(container.querySelector('.empty-state')).not.toBeInTheDocument()
    expect(screen.getByText('Google Meet')).toBeInTheDocument()
    expect(screen.getByText('Формат: Онлайн')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Приєднатися' })).toHaveAttribute(
      'href',
      'https://meet.google.com/therapist-room'
    )
    expect(sessionDetail.status).toBe('CONFIRMED')
  })

  it('opens the client workbook popup from the session page', async () => {
    const sessionDetail = buildSession({
      status: 'CONFIRMED',
      client: 77,
    })
    mockDetailContext(() => sessionDetail)

    const { container } = renderView()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null as any)

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    const button = container.querySelector('.note-header-actions button.btn') as HTMLButtonElement | null
    expect(button).toBeInTheDocument()
    await fireEvent.click(button as HTMLButtonElement)
    expect(openSpy).toHaveBeenCalled()
    openSpy.mockRestore()
  })

  it.each([
    ['linked', 'login@example.com', 'contact@example.com'],
    ['manual', null, 'contact@example.com'],
    ['equal', 'same@example.com', 'same@example.com'],
    ['registered', 'login@example.com', 'contact@example.com'],
  ])('labels account/contact identity for %s clients', async (kind, accountEmail, contactEmail) => {
    mockDetailContext(() => buildSession({
      client: kind === 'registered' ? 77 : null,
      client_record_id: kind === 'registered' ? null : 501,
      client_display_name: 'Identity Client', client_name: 'Identity Client',
      client_email: kind === 'registered' ? accountEmail : null,
      client_account_email: accountEmail, client_contact_email: contactEmail,
      client_has_account: kind !== 'manual',
    }), { requests: [] })
    const { container } = renderView()
    await screen.findByText(contactEmail)
    expect(container).toHaveTextContent('Контактний email')
    if (accountEmail) {
      expect(container).toHaveTextContent('Email акаунта')
      expect(screen.getAllByText(accountEmail)).toHaveLength(1)
    } else {
      expect(container).not.toHaveTextContent('Email акаунта:')
    }
  })

  it('shows manual-client badge and hides account-only detail actions', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      client: null,
      client_user_id: null,
      client_record_id: 501,
      client_display_name: 'Manual Detail Client',
      client_name: null,
      client_username: null,
      client_email: null,
      client_has_account: false,
      client_source: 'manual',
      client_identity_type: 'manual',
      price_amount: '1200.00',
      price_currency: 'UAH',
      task_context: {
        source_type: 'session',
        source_id: 42,
        related_session_id: 42,
        related_client_id: null,
        related_client_record_id: 501,
      },
      workspace: buildWorkspace({
        payment_state: 'unpaid',
        note_state: 'missing',
        workbook_state: 'missing',
        pending_task_items: [
          { code: 'COMPLETE_NOTE', label: 'Complete note', classification: 'recommended' },
          { code: 'COMPLETE_WORKBOOK', label: 'Complete workbook', classification: 'recommended' },
          { code: 'REQUEST_PAYMENT_PROOF', label: 'Request payment', classification: 'capability', blocking_scope: 'client' },
        ],
        available_action_items: [
          { code: 'OPEN_NOTE', label: 'Open note', classification: 'capability' },
          { code: 'OPEN_WORKBOOK', label: 'Open workbook', classification: 'capability' },
          { code: 'REQUEST_PAYMENT_PROOF', label: 'Request payment', classification: 'capability', blocking_scope: 'client' },
        ],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    const { container } = renderView()

    expect(await screen.findByText('Manual Detail Client')).toBeInTheDocument()
    expect(screen.getByText('Без реєстрації')).toBeInTheDocument()
    expect(screen.getByText('Цю сесію створено для клієнта без реєстрації. Підключення кабінету дасть клієнту доступ до власних сесій, нагадувань, оплати та комунікації зі спеціалістом.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Клієнт оплачує сесію безпосередньо вам. Оскільки в нього немає кабінету, він не може надіслати підтвердження через Pro Consult. Після перевірки надходження коштів позначте сесію оплаченою.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/оплата ведеться вручну/i)).not.toBeInTheDocument()
    expect(container).not.toHaveTextContent('undefined')
    expect(container).not.toHaveTextContent('null')
    expect(container).not.toHaveTextContent('ID: #null')
    expect(screen.queryByRole('button', { name: 'Повторювати щотижня' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Додати на дошку' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'До картки клієнта' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'До приватного зошита' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Відкрити.*приват/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Запросити підтвердження оплати' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Оплата' })).toBeInTheDocument()
    expect(screen.getByText('Не оплачено')).toBeInTheDocument()
    expect(container).toHaveTextContent(/1\s*200 грн/)
    expect(screen.getByRole('button', { name: 'Редагувати ціну' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Позначити оплаченою' })).toBeInTheDocument()
    expect(screen.queryByText('Приватний зошит')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('Progress note')).not.toBeInTheDocument()
    expect(await screen.findByText('Приватна нотатка прихована. Доступ має лише спеціаліст.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Заповнити нотатку' })).toBeInTheDocument()
  })

  it('keeps private session note collapsed until opened, preserves local edits on close, and saves', async () => {
    const sessionDetail = buildSession({ status: 'CONFIRMED' })
    mockDetailContext(() => sessionDetail, { note: 'Sensitive progress note', requests: [] })
    mockedApiPut.mockResolvedValue({} as any)

    renderView()

    const noteSection = await waitFor(() => {
      const heading = screen.getByRole('heading', { name: 'Приватна нотатка по сесії' })
      const section = heading.closest('section')
      expect(section).toBeInstanceOf(HTMLElement)
      return section as HTMLElement
    })

    await waitFor(() => {
      expect(within(noteSection).getByText('Зашифровано')).toBeInTheDocument()
      expect(within(noteSection).getByText('Приватна нотатка прихована. Доступ має лише спеціаліст.')).toBeInTheDocument()
    })
    expect(screen.queryByDisplayValue('Sensitive progress note')).not.toBeInTheDocument()

    await fireEvent.click(within(noteSection).getByRole('button', { name: 'Відкрити нотатку' }))
    const textarea = await screen.findByDisplayValue('Sensitive progress note')
    await fireEvent.update(textarea, 'Unsaved local note')
    await fireEvent.click(within(noteSection).getByRole('button', { name: 'Закрити нотатку' }))

    expect(screen.queryByDisplayValue('Unsaved local note')).not.toBeInTheDocument()
    await fireEvent.click(within(noteSection).getByRole('button', { name: 'Відкрити нотатку' }))
    expect(await screen.findByDisplayValue('Unsaved local note')).toBeInTheDocument()

    await fireEvent.click(within(noteSection).getByRole('button', { name: 'Зберегти' }))
    await waitFor(() => {
      expect(mockedApiPut).toHaveBeenCalledWith('/cabinet/sessions/42/note/', {
        content: 'Unsaved local note',
      })
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.noteSaved)
    })
  })

  it('requests payment proof from specialist block and refreshes payment-proof state', async () => {
    const initialPaymentProof = {
      status: 'NOT_REQUESTED',
      image_url: null,
      requested_by_specialist_at: null,
      submitted_by_client_at: null,
      reviewed_by_specialist_at: null,
      marked_paid_at: null,
      clarification_requested_at: null,
      specialist_note: '',
      client_can_upload_now: false,
      specialist_can_mark_paid_now: false,
      specialist_can_request_clarification_now: false,
      specialist_can_request_proof_now: true,
    }
    let sessionDetail = buildSession({
      status: 'SCHEDULED',
      payment_proof: initialPaymentProof,
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    const requestedProof = {
      ...initialPaymentProof,
      status: 'REQUESTED',
      specialist_can_request_proof_now: true,
    }
    mockedRequestSessionPaymentProof.mockImplementation(async () => {
      sessionDetail = buildSession({
        status: 'SCHEDULED',
        payment_proof: requestedProof,
      })
      return requestedProof as any
    })
    mockedFetchSessionPaymentProof.mockResolvedValue(requestedProof as any)

    renderView()

    expect(await screen.findByText(/Оплату не запитано/)).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /Запросити оплату/ }))

    await waitFor(() => {
      expect(mockedRequestSessionPaymentProof).toHaveBeenCalledWith(42)
      expect(mockedFetchSessionPaymentProof).toHaveBeenCalledWith(42)
      expect(mockToast.success).toHaveBeenCalledTimes(1)
    })

    expect(await screen.findByText(/Очікується підтвердження оплати/)).toBeInTheDocument()
    expect(
      screen.getByText(/Підтвердження оплати надсилається клієнтом/)
    ).toBeInTheDocument()
  })

  it('marks session as paid from specialist block after confirmation and refreshes payment-proof state', async () => {
    const initialPaymentProof = {
      status: 'REQUESTED',
      image_url: null,
      requested_by_specialist_at: '2099-06-15T09:00:00Z',
      submitted_by_client_at: null,
      reviewed_by_specialist_at: null,
      marked_paid_at: null,
      clarification_requested_at: null,
      specialist_note: '',
      client_can_upload_now: false,
      specialist_can_mark_paid_now: true,
      specialist_can_request_clarification_now: true,
      specialist_can_request_proof_now: false,
      payment_instructions: null,
    }
    const markedPaidProof = {
      ...initialPaymentProof,
      status: 'MARKED_PAID',
      marked_paid_at: '2099-06-15T09:05:00Z',
      specialist_can_mark_paid_now: false,
      specialist_can_request_clarification_now: false,
      specialist_can_request_proof_now: false,
    }

    let sessionDetail = buildSession({
      status: 'CONFIRMED',
      payment_proof: initialPaymentProof,
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    mockedMarkSessionPaymentProofPaid.mockImplementation(async () => {
      sessionDetail = buildSession({
        status: 'CONFIRMED',
        payment_proof: markedPaidProof,
      })
      return markedPaidProof as any
    })
    mockedFetchSessionPaymentProof.mockResolvedValue(markedPaidProof as any)

    renderView()

    expect(await screen.findByRole('button', { name: 'Позначити як оплачено' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Позначити як оплачено' }))

    const dialog = await screen.findByRole('dialog', { name: 'Позначити сесію як оплачену?' })
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Позначити як оплачено' }))

    await waitFor(() => {
      expect(mockedMarkSessionPaymentProofPaid).toHaveBeenCalledWith(42)
      expect(mockedFetchSessionPaymentProof).toHaveBeenCalledWith(42)
      expect(mockToast.success).toHaveBeenCalledWith('Оплату позначено як отриману.')
    })

    expect(await screen.findByText(/Оплату позначено як отриману/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Позначити як оплачено' })).not.toBeInTheDocument()
  })

  it('removes stale payment required action without page reload after mark-paid action', async () => {
    const initialPaymentProof = {
      status: 'REQUESTED',
      image_url: null,
      requested_by_specialist_at: '2099-06-15T09:00:00Z',
      submitted_by_client_at: null,
      reviewed_by_specialist_at: null,
      marked_paid_at: null,
      clarification_requested_at: null,
      specialist_note: '',
      client_can_upload_now: false,
      specialist_can_mark_paid_now: true,
      specialist_can_request_clarification_now: true,
      specialist_can_request_proof_now: false,
      payment_instructions: null,
    }
    const markedPaidProof = {
      ...initialPaymentProof,
      status: 'MARKED_PAID',
      marked_paid_at: '2099-06-15T09:05:00Z',
      specialist_can_mark_paid_now: false,
      specialist_can_request_clarification_now: false,
      specialist_can_request_proof_now: false,
    }

    let sessionDetail = buildSession({
      status: 'COMPLETED',
      payment_proof: initialPaymentProof,
      workspace: buildWorkspace({
        payment_state: 'awaiting_confirmation',
        note_state: 'completed',
        workbook_state: 'completed',
        pending_task_items: [{ code: 'REVIEW_PAYMENT', label: 'Do payment review', classification: 'required' }],
        available_action_items: [{ code: 'REVIEW_PAYMENT', label: 'Do payment review', classification: 'capability' }],
        pending_tasks: ['REVIEW_PAYMENT'],
        available_actions: ['REVIEW_PAYMENT'],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    mockedMarkSessionPaymentProofPaid.mockImplementation(async () => {
      sessionDetail = buildSession({
        status: 'COMPLETED',
        payment_proof: markedPaidProof,
        workspace: buildWorkspace({
          payment_state: 'paid',
          note_state: 'completed',
          workbook_state: 'completed',
          pending_task_items: [],
          available_action_items: [],
          pending_tasks: [],
          available_actions: [],
        }),
      })
      return markedPaidProof as any
    })
    mockedFetchSessionPaymentProof.mockResolvedValue(markedPaidProof as any)

    renderView()

    expect(await screen.findByRole('button', { name: 'Перевірити оплату' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Позначити як оплачено' }))

    const dialog = await screen.findByRole('dialog', { name: 'Позначити сесію як оплачену?' })
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Позначити як оплачено' }))

    await waitFor(() => {
      expect(mockedMarkSessionPaymentProofPaid).toHaveBeenCalledWith(42)
      expect(mockedFetchSessionPaymentProof).toHaveBeenCalledWith(42)
      expect(screen.queryByRole('button', { name: 'Перевірити оплату' })).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('workspace-no-pending')).toBeInTheDocument()
    expect(await screen.findByText(/Оплату позначено як отриману/)).toBeInTheDocument()
  })

  it('renders workspace pending actions for missing note and workbook with unpaid payment state', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        payment_state: 'unpaid',
        note_state: 'missing',
        workbook_state: 'missing',
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    renderView()

    expect(await screen.findByTestId('session-workspace')).toBeInTheDocument()
    expect(screen.queryByTestId('workspace-summary-payment')).not.toBeInTheDocument()
    expect(screen.getByTestId('workspace-summary-note')).toHaveTextContent('Нотатку ще не збережено')
    expect(screen.getByTestId('workspace-summary-workbook')).toHaveTextContent('Запис ще не створено')
    expect(screen.getByTestId('workspace-actions')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-zone-required')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-zone-recommended')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-zone-capability')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-action-open_note')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Відкрити приватний зошит' })).toBeInTheDocument()
  })

  it('uses preparation wording for scheduled workspace and keeps core pending-session actions', async () => {
    const sessionDetail = buildSession({
      status: 'SCHEDULED',
      session_format: 'online',
      meeting_mode: 'ONLINE',
      meeting_url: null,
      meeting_provider: null,
      join_available: false,
      workspace: buildWorkspace({
        payment_state: 'unpaid',
        note_state: 'missing',
        workbook_state: 'missing',
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    renderView()

    const workspace = await screen.findByTestId('session-workspace')
    expect(screen.queryByText('Сесія спеціаліста')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Деталі сесії' })).toBeInTheDocument()
    expect(
      screen.getByText(`${formatSessionDateTime(sessionDetail.slot_start_at as string)} · Test Client · Заплановано`)
    ).toBeInTheDocument()
    expect(within(workspace).getByRole('heading', { name: 'Підготовка до сесії' })).toBeInTheDocument()
    expect(within(workspace).queryByRole('heading', { name: 'Стан після сесії' })).not.toBeInTheDocument()
    expect(within(workspace).getByText('Перевірте час, формат, посилання на зустріч, оплату та робочі нотатки перед підтвердженням.')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Оплата' })).toHaveLength(1)
    expect(screen.queryByTestId('workspace-summary-payment')).not.toBeInTheDocument()

    const meetingCard = screen.getByText('Онлайн-зустріч').closest('.meeting-card')
    expect(meetingCard).toBeInTheDocument()
    expect(within(meetingCard as HTMLElement).getByText('Потрібно додати посилання')).toBeInTheDocument()
    expect(within(meetingCard as HTMLElement).getByRole('button', { name: 'Додати посилання' })).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Підтвердити' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Скасувати' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Перенести' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Повторювати щотижня' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Додати на дошку' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Приватна нотатка по сесії' })).toBeInTheDocument()
    expect(await screen.findByText('Приватна нотатка прихована. Доступ має лише спеціаліст.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Назад до списку' })).toHaveAttribute('href', '/cabinet/sessions')
  })

  it('keeps next-step continuity inside workspace rail when actionable workspace zones are present', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        payment_state: 'unpaid',
        note_state: 'missing',
        workbook_state: 'missing',
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    renderView()

    expect(await screen.findByTestId('session-workspace')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-navigation-rail')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Наступні кроки' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'До приватного зошита' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'До нотатки' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'До блоку оплати' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'До картки клієнта' })).toHaveAttribute(
      'href',
      '/cabinet/clients?client=77&autoOpen=1'
    )
    expect(screen.queryByRole('link', { name: 'До списку сесій' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Назад до списку' })).toHaveAttribute('href', '/cabinet/sessions')
  })

  it('groups pending actions by classification and does not infer required from priority', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        note_state: 'missing',
        workbook_state: 'completed',
        payment_state: 'paid',
        pending_task_items: [
          { code: 'OPEN_NOTE', label: 'Open note', priority: 'high' },
          { code: 'COMPLETE_NOTE', label: 'Complete note', classification: 'required', urgency: 'low' },
        ],
        available_action_items: [],
        pending_tasks: [],
        available_actions: [],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })
    renderView()

    expect(await screen.findByTestId('session-workspace')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-zone-required')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-zone-recommended')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-action-complete_note')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-action-open_note')).toBeInTheDocument()
  })

  it('uses continue semantics for note draft and keeps workbook pending action', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        payment_state: 'unpaid',
        note_state: 'draft',
        workbook_state: 'missing',
        pending_task_items: [
          { code: 'CONTINUE_NOTE', label: 'Continue note' },
          { code: 'OPEN_WORKBOOK', label: 'Open workbook' },
        ],
        available_action_items: [
          { code: 'CONTINUE_NOTE', label: 'Continue note' },
          { code: 'OPEN_WORKBOOK', label: 'Open workbook' },
        ],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    renderView()

    expect(await screen.findByTestId('session-workspace')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-summary-note')).toHaveTextContent('Чернетка')
    expect(screen.getByRole('button', { name: 'Продовжити нотатку' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Відкрити приватний зошит' })).toBeInTheDocument()
  })

  it('shows done states without noisy pending actions when workspace is complete', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        payment_state: 'paid',
        note_state: 'completed',
        workbook_state: 'completed',
        pending_task_items: [],
        available_action_items: [],
        pending_tasks: [],
        available_actions: [],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    renderView()

    expect(await screen.findByTestId('session-workspace')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Після сесії' })).toBeInTheDocument()
    expect(screen.queryByTestId('workspace-summary-payment')).not.toBeInTheDocument()
    expect(screen.getByTestId('workspace-summary-note')).toHaveTextContent('Заповнена')
    expect(screen.getByTestId('workspace-summary-workbook')).toHaveTextContent('Заповнений')
    expect(screen.queryByTestId('workspace-actions')).not.toBeInTheDocument()
    expect(screen.getByTestId('workspace-no-pending')).toBeInTheDocument()
  })

  it('shows payment awaiting confirmation state and payment review action when available', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        payment_state: 'awaiting_confirmation',
        note_state: 'completed',
        workbook_state: 'completed',
        pending_task_items: [{ code: 'REVIEW_PAYMENT', label: 'Do payment review' }],
        available_action_items: [{ code: 'REVIEW_PAYMENT', label: 'Do payment review' }],
        pending_tasks: ['REVIEW_PAYMENT'],
        available_actions: ['REVIEW_PAYMENT'],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    renderView()

    expect(await screen.findByTestId('session-workspace')).toBeInTheDocument()
    expect(screen.queryByTestId('workspace-summary-payment')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Перевірити оплату' })).toBeInTheDocument()
    expect(within(screen.getByTestId('session-workspace')).queryByRole('button', { name: 'Відкрити нотатку' })).not.toBeInTheDocument()
  })

  it('does not treat hidden workspace states as missing and avoids hidden CTAs', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        payment_state: 'paid',
        note_state: 'hidden',
        workbook_state: 'hidden',
        pending_task_items: [{ code: 'REVIEW_PAYMENT', label: 'Review payment' }],
        available_action_items: [{ code: 'REVIEW_PAYMENT', label: 'Review payment' }],
        pending_tasks: ['REVIEW_PAYMENT'],
        available_actions: ['REVIEW_PAYMENT'],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    renderView()

    expect(await screen.findByTestId('session-workspace')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-summary-note')).toHaveTextContent('Недоступна')
    expect(screen.getByTestId('workspace-summary-workbook')).toHaveTextContent('Недоступний')
    expect(screen.queryByText('Нотатку ще не збережено')).not.toBeInTheDocument()
    expect(within(screen.getByTestId('session-workspace')).queryByRole('button', { name: 'Відкрити нотатку' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Відкрити приватний зошит' })).not.toBeInTheDocument()
  })
  it('uses pending_task_items as primary source over legacy pending_tasks', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        pending_task_items: [{ code: 'OPEN_NOTE', label: 'Primary source note action' }],
        available_action_items: [{ code: 'OPEN_NOTE', label: 'Primary source note action' }],
        pending_tasks: ['OPEN_WORKBOOK'],
        available_actions: ['OPEN_WORKBOOK'],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })
    renderView()
    expect(await screen.findByTestId('session-workspace')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-action-open_note')).toBeInTheDocument()
    expect(screen.queryByTestId('workspace-action-open_workbook')).not.toBeInTheDocument()
  })
  it('routes note workspace action by code and ignores misleading labels', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        note_state: 'missing',
        workbook_state: 'completed',
        payment_state: 'paid',
        pending_task_items: [{ code: 'OPEN_NOTE', label: 'This text mentions payment and workbook' }],
        available_action_items: [{ code: 'OPEN_NOTE', label: 'This text mentions payment and workbook' }],
        pending_tasks: [],
        available_actions: [],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })
    renderView()
    const noteAction = await screen.findByTestId('workspace-action-open_note')
    await fireEvent.click(noteAction)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Progress note')).toBeInTheDocument()
    })
  })
  it('routes workbook workspace action by code to workbook flow', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null as any)
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        note_state: 'completed',
        workbook_state: 'missing',
        payment_state: 'paid',
        pending_task_items: [{ code: 'OPEN_WORKBOOK', label: 'Open workbook now' }],
        available_action_items: [{ code: 'OPEN_WORKBOOK', label: 'Open workbook now' }],
        pending_tasks: [],
        available_actions: [],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })
    renderView()
    const workbookAction = await screen.findByTestId('workspace-action-open_workbook')
    await fireEvent.click(workbookAction)
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalled()
    })
    openSpy.mockRestore()
  })

  it('creates board task from session quick-add modal with custom title and session context', async () => {
    const sessionDetail = buildSession({
      id: 42,
      client: 77,
      status: 'CONFIRMED',
    })
    mockDetailContext(() => sessionDetail)
    mockedCreatePracticeBoardItem.mockResolvedValue({ id: 901 } as any)
    mockedFetchPracticeBoards.mockResolvedValue([{ id: 1, title: 'Main board', is_default: true }] as any)

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: '\u0414\u043e\u0434\u0430\u0442\u0438 \u043d\u0430 \u0434\u043e\u0448\u043a\u0443' }))
    await fireEvent.update(screen.getByLabelText('\u041d\u0430\u0437\u0432\u0430 \u0437\u0430\u0434\u0430\u0447\u0456'), 'Custom follow-up task')
    await fireEvent.click(screen.getByRole('button', { name: '\u0414\u043e\u0434\u0430\u0442\u0438' }))

    await waitFor(() => {
      expect(mockedCreatePracticeBoardItem).toHaveBeenCalledWith({
        board_id: 1,
        title: 'Custom follow-up task',
        related_client_id: 77,
        related_session_id: 42,
        source_type: 'session',
        source_id: 42,
      })
      expect(mockToast.success).toHaveBeenCalledWith(
        'Задачу додано. Вона доступна в розділі «Задачі».'
      )
    })
  })

  it('creates board task from manual no-registration session task context without client id', async () => {
    const sessionDetail = buildSession({
      id: 42,
      client: null,
      client_user_id: null,
      client_record_id: 501,
      client_display_name: 'Manual Detail Client',
      client_has_account: false,
      client_source: 'manual',
      client_identity_type: 'manual',
      task_context: {
        source_type: 'session',
        source_id: 42,
        related_session_id: 42,
        related_client_id: null,
        related_client_record_id: 501,
      },
      status: 'CONFIRMED',
      workspace: buildWorkspace({
        payment_state: 'not_applicable',
        workbook_state: 'hidden',
        permissions: {
          can_edit_note: true,
          can_view_note: true,
          can_edit_workbook: false,
          can_view_workbook: false,
        },
        pending_task_items: [{ code: 'COMPLETE_NOTE', label: 'Complete note', classification: 'recommended' }],
        available_action_items: [{ code: 'OPEN_NOTE', label: 'Open note', classification: 'capability' }],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })
    mockedCreatePracticeBoardItem.mockResolvedValue({ id: 903 } as any)
    mockedFetchPracticeBoards.mockResolvedValue([{ id: 1, title: 'Main board', is_default: true }] as any)

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Додати на дошку' }))
    await fireEvent.update(screen.getByLabelText('Назва задачі'), 'Manual request follow-up')
    await fireEvent.click(screen.getByRole('button', { name: 'Додати' }))

    await waitFor(() => {
      expect(mockedCreatePracticeBoardItem).toHaveBeenCalledWith({
        board_id: 1,
        title: 'Manual request follow-up',
        related_session_id: 42,
        source_type: 'session',
        source_id: 42,
      })
      expect(mockToast.success).toHaveBeenCalledWith(
        'Задачу додано. Вона доступна в розділі «Задачі».'
      )
    })
  })

  it('validates empty title in session quick-add modal and does not submit', async () => {
    const sessionDetail = buildSession({
      id: 42,
      client: 77,
      status: 'CONFIRMED',
    })
    mockDetailContext(() => sessionDetail)

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: '\u0414\u043e\u0434\u0430\u0442\u0438 \u043d\u0430 \u0434\u043e\u0448\u043a\u0443' }))
    await fireEvent.click(screen.getByRole('button', { name: '\u0414\u043e\u0434\u0430\u0442\u0438' }))

    expect(await screen.findByText('\u0412\u043a\u0430\u0436\u0456\u0442\u044c \u043d\u0430\u0437\u0432\u0443 \u0437\u0430\u0434\u0430\u0447\u0456.')).toBeInTheDocument()
    expect(mockedCreatePracticeBoardItem).not.toHaveBeenCalled()
  })

  it('creates board task from session quick-add without board_id when no board exists yet', async () => {
    const sessionDetail = buildSession({
      id: 42,
      client: 77,
      status: 'CONFIRMED',
    })
    mockDetailContext(() => sessionDetail)
    mockedCreatePracticeBoardItem.mockResolvedValue({ id: 902 } as any)
    mockedFetchPracticeBoards.mockResolvedValue([])

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: '\u0414\u043e\u0434\u0430\u0442\u0438 \u043d\u0430 \u0434\u043e\u0448\u043a\u0443' }))
    await fireEvent.update(screen.getByLabelText('\u041d\u0430\u0437\u0432\u0430 \u0437\u0430\u0434\u0430\u0447\u0456'), 'No-board custom task')
    await fireEvent.click(screen.getByRole('button', { name: '\u0414\u043e\u0434\u0430\u0442\u0438' }))

    await waitFor(() => {
      expect(mockedCreatePracticeBoardItem).toHaveBeenCalledWith({
        title: 'No-board custom task',
        related_client_id: 77,
        related_session_id: 42,
        source_type: 'session',
        source_id: 42,
      })
      expect(mockToast.success).toHaveBeenCalledWith(
        'Задачу додано. Вона доступна в розділі «Задачі».'
      )
    })
  })

  it.each(['REVIEW_PAYMENT', 'UPLOAD_PAYMENT_PROOF', 'CONFIRM_PAYMENT'] as const)(
    'routes %s workspace action by code to payment section',
    async (actionCode) => {
      const originalScrollIntoView = (HTMLElement.prototype as any).scrollIntoView
      const scrollSpy = vi.fn()
        ; (HTMLElement.prototype as any).scrollIntoView = scrollSpy
      try {
        const sessionDetail = buildSession({
          status: 'COMPLETED',
          workspace: buildWorkspace({
            note_state: 'completed',
            workbook_state: 'completed',
            payment_state: 'unpaid',
            pending_task_items: [{ code: actionCode, label: `Action ${actionCode}` }],
            available_action_items: [{ code: actionCode, label: `Action ${actionCode}` }],
            pending_tasks: [],
            available_actions: [],
          }),
        })
        mockDetailContext(() => sessionDetail, { requests: [] })
        renderView()
        const actionTestId = `workspace-action-${actionCode.toLowerCase()}`
        const paymentAction = await screen.findByTestId(actionTestId)
        await fireEvent.click(paymentAction)
        await waitFor(() => {
          expect(scrollSpy).toHaveBeenCalled()
        })
      } finally {
        ; (HTMLElement.prototype as any).scrollIntoView = originalScrollIntoView
      }
    }
  )
  it('falls back to localized label when backend returns raw action code as label', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        note_state: 'completed',
        workbook_state: 'completed',
        payment_state: 'unpaid',
        pending_task_items: [{ code: 'COMPLETE_PAYMENT_REVIEW', label: 'COMPLETE_PAYMENT_REVIEW' }],
        available_action_items: [{ code: 'COMPLETE_PAYMENT_REVIEW', label: 'COMPLETE_PAYMENT_REVIEW' }],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })
    renderView()

    expect(await screen.findByTestId('workspace-action-complete_payment_review')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Перевірити оплату' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'COMPLETE_PAYMENT_REVIEW' })).not.toBeInTheDocument()
  })

  it('renders localized labels for known workspace action codes and hides raw or legacy english labels', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        note_state: 'missing',
        workbook_state: 'missing',
        payment_state: 'awaiting_confirmation',
        pending_task_items: [
          { code: 'COMPLETE_PAYMENT_REVIEW', label: 'COMPLETE_PAYMENT_REVIEW', classification: 'required' },
          { code: 'COMPLETE_NOTE', label: 'COMPLETE_NOTE', classification: 'recommended' },
          { code: 'COMPLETE_WORKBOOK', label: 'Complete workbook', classification: 'recommended' },
        ],
        available_action_items: [
          { code: 'MARK_PAYMENT_PAID', label: 'Mark payment paid', classification: 'capability' },
          { code: 'REQUEST_PAYMENT_PROOF', label: 'REQUEST_PAYMENT_PROOF', classification: 'capability' },
        ],
        pending_tasks: [],
        available_actions: [],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })
    renderView()

    expect(await screen.findByTestId('session-workspace')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Перевірити оплату' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Заповнити нотатку' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Заповнити приватний зошит' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Позначити як оплачено' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Запросити підтвердження оплати' })).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: 'COMPLETE_PAYMENT_REVIEW' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'COMPLETE_NOTE' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Complete workbook' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark payment paid' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'REQUEST_PAYMENT_PROOF' })).not.toBeInTheDocument()
  })

  it('falls back to localized label for english capability labels', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        note_state: 'completed',
        workbook_state: 'completed',
        payment_state: 'unpaid',
        pending_task_items: [],
        available_action_items: [{ code: 'MARK_PAYMENT_PAID', label: 'Mark payment paid', classification: 'capability' }],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })
    renderView()

    expect(await screen.findByTestId('workspace-zone-capability')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Позначити як оплачено' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark payment paid' })).not.toBeInTheDocument()
  })

  it('keeps backend label when it is already user-facing', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        note_state: 'completed',
        workbook_state: 'completed',
        payment_state: 'unpaid',
        pending_task_items: [],
        available_action_items: [
          { code: 'REQUEST_PAYMENT_PROOF', label: 'Запросити підтвердження в клієнта', classification: 'capability' },
        ],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })
    renderView()

    expect(await screen.findByTestId('workspace-zone-capability')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Запросити підтвердження в клієнта' })).toBeInTheDocument()
  })

  it('handles unknown workspace action codes without rendering unsafe CTA', async () => {
    const sessionDetail = buildSession({
      status: 'COMPLETED',
      workspace: buildWorkspace({
        note_state: 'missing',
        workbook_state: 'missing',
        payment_state: 'unpaid',
        pending_task_items: [{ code: 'FUTURE_WORKSPACE_ACTION', label: 'Future action' }],
        available_action_items: [{ code: 'FUTURE_WORKSPACE_ACTION', label: 'Future action' }],
        pending_tasks: [],
        available_actions: [],
      }),
    })
    mockDetailContext(() => sessionDetail, { requests: [] })
    renderView()
    expect(await screen.findByTestId('session-workspace')).toBeInTheDocument()
    expect(screen.queryByTestId('workspace-actions')).not.toBeInTheDocument()
    expect(screen.getByTestId('workspace-no-pending')).toBeInTheDocument()
  })
  it('shows actionable inline message for PAYMENT_DETAILS_MISSING and links to payment details settings', async () => {
    const initialPaymentProof = {
      status: 'NOT_REQUESTED',
      image_url: null,
      requested_by_specialist_at: null,
      submitted_by_client_at: null,
      reviewed_by_specialist_at: null,
      marked_paid_at: null,
      clarification_requested_at: null,
      specialist_note: '',
      client_can_upload_now: false,
      specialist_can_mark_paid_now: false,
      specialist_can_request_clarification_now: false,
      specialist_can_request_proof_now: true,
      payment_instructions: null,
    }
    const sessionDetail = buildSession({
      status: 'SCHEDULED',
      payment_proof: initialPaymentProof,
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    mockedRequestSessionPaymentProof.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'PAYMENT_DETAILS_MISSING',
          detail: 'Specialist payment details are not configured.',
        },
      },
    })

    renderView()

    expect(await screen.findByText(/Оплату не запитано/)).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /Запросити оплату/ }))

    expect(await screen.findByText('Щоб запросити оплату, спочатку додайте реквізити для оплати.')).toBeInTheDocument()
    expect(mockToast.error).not.toHaveBeenCalled()
    expect(mockedFetchSessionPaymentProof).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByRole('button', { name: 'Перейти до реквізитів для оплати' }))
    expect(mockRouter.push).toHaveBeenCalledWith({ path: '/cabinet/settings', query: { tab: 'payment-details' } })
  })

  it('shows payment-details-missing inline UX on first click for reason_code response shape', async () => {
    const initialPaymentProof = {
      status: 'NOT_REQUESTED',
      image_url: null,
      requested_by_specialist_at: null,
      submitted_by_client_at: null,
      reviewed_by_specialist_at: null,
      marked_paid_at: null,
      clarification_requested_at: null,
      specialist_note: '',
      client_can_upload_now: false,
      specialist_can_mark_paid_now: false,
      specialist_can_request_clarification_now: false,
      specialist_can_request_proof_now: true,
      payment_instructions: null,
    }
    const sessionDetail = buildSession({
      status: 'SCHEDULED',
      payment_proof: initialPaymentProof,
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

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

    renderView()

    expect(await screen.findByText(/Оплату не запитано/)).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /Запросити оплату/ }))

    await waitFor(() => {
      expect(mockedRequestSessionPaymentProof).toHaveBeenCalledTimes(1)
    })
    expect(await screen.findByText('Щоб запросити оплату, спочатку додайте реквізити для оплати.')).toBeInTheDocument()
    expect(mockToast.error).not.toHaveBeenCalled()
  })

  it.each([
    ['PAYMENT_PROOF_STATE_INVALID', 400, 'Неможливо виконати дію у поточному стані.'],
    ['SERVICE_UNAVAILABLE', 503, 'Сервіс тимчасово недоступний.'],
    ['PERMISSION_DENIED', 403, 'Доступ заборонено.'],
  ])(
    'keeps regular UX for request-payment-proof %s',
    async (code, status, detail) => {
      const initialPaymentProof = {
        status: 'NOT_REQUESTED',
        image_url: null,
        requested_by_specialist_at: null,
        submitted_by_client_at: null,
        reviewed_by_specialist_at: null,
        marked_paid_at: null,
        clarification_requested_at: null,
        specialist_note: '',
        client_can_upload_now: false,
        specialist_can_mark_paid_now: false,
        specialist_can_request_clarification_now: false,
        specialist_can_request_proof_now: true,
        payment_instructions: null,
      }
      const sessionDetail = buildSession({
        status: 'SCHEDULED',
        payment_proof: initialPaymentProof,
      })
      mockDetailContext(() => sessionDetail, { requests: [] })

      mockedRequestSessionPaymentProof.mockRejectedValue({
        response: {
          status,
          data: {
            code,
            detail,
          },
        },
      })

      renderView()

      expect(await screen.findByText(/Оплату не запитано/)).toBeInTheDocument()
      await fireEvent.click(screen.getByRole('button', { name: /Запросити оплату/ }))

      await waitFor(() => {
        expect(mockedRequestSessionPaymentProof).toHaveBeenCalledWith(42)
      })
      expect(mockToast.error).toHaveBeenCalledWith(detail)
      expect(screen.queryByRole('button', { name: 'Перейти до реквізитів для оплати' })).not.toBeInTheDocument()
    }
  )

  it('confirms a scheduled session and refreshes the detail context', async () => {
    let sessionDetail = buildSession({ status: 'SCHEDULED' })
    mockDetailContext(() => sessionDetail)

    mockedApiPatch.mockImplementation(async (url) => {
      if (url === '/booking/sessions/42/confirm/') {
        sessionDetail = {
          ...sessionDetail,
          status: 'CONFIRMED',
        }
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    expect(
      screen.getByText('Очікує підтвердження спеціаліста. Потрібно завершити підготовку: перевірте формат, посилання на зустріч і робочі нотатки. Підтвердження не означає підтвердження оплати.')
    ).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/confirm/')
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionConfirmed)
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Підтвердити' })).toBeDisabled()
    })

    expect(endpointCalls('/booking/sessions/42/')).toBe(2)
    expect(endpointCalls('/cabinet/slots/')).toBe(2)
    expect(endpointCalls('/booking/sessions/42/reschedule-suggestions/')).toBe(2)
    expect(endpointCalls('/cabinet/sessions/reschedule-requests/')).toBe(2)
  })

  it('renders offline session format and hides online join controls', async () => {
    const sessionDetail = buildSession({
      status: 'CONFIRMED',
      session_format: 'offline',
      meeting_mode: 'OFFLINE',
      offline_location: 'Київ, офіс 12',
      meeting_url: 'https://meet.google.com/should-not-be-used',
      join_available: true,
    })
    mockDetailContext(() => sessionDetail)

    renderView()

    expect(await screen.findByText('Формат: Офлайн')).toBeInTheDocument()
    expect(screen.getByText('Локація: Київ, офіс 12')).toBeInTheDocument()
    expect(screen.getByText('Офлайн-сесія')).toBeInTheDocument()
    expect(
      screen.getByText('Для офлайн-формату посилання для приєднання не використовується.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Приєднатися' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Змінити посилання' })).not.toBeInTheDocument()
  })

  it('highlights online meeting block and promotes add-link CTA for confirmed sessions without meeting link', async () => {
    const sessionDetail = buildSession({
      status: 'CONFIRMED',
      session_format: 'online',
      meeting_mode: 'ONLINE',
      meeting_url: null,
      meeting_provider: null,
      join_available: false,
    })
    mockDetailContext(() => sessionDetail)

    renderView()

    const meetingCard = (await screen.findByText('Онлайн-зустріч')).closest('.meeting-card')
    expect(meetingCard).toBeInTheDocument()
    expect(meetingCard).toHaveClass('meeting-card--attention')
    expect(within(meetingCard as HTMLElement).getByText('Потрібно додати посилання')).toBeInTheDocument()

    const addLinkButton = within(meetingCard as HTMLElement).getByRole('button', { name: /додати посилання/i })
    expect(addLinkButton).toHaveClass('btn--sm')
    expect(addLinkButton).not.toHaveClass('btn--ghost')
  })

  it('focuses and highlights online meeting block when opened with focus=meeting_link', async () => {
    const sessionDetail = buildSession({
      status: 'CONFIRMED',
      session_format: 'online',
      meeting_mode: 'ONLINE',
      meeting_url: null,
      meeting_provider: null,
      join_available: false,
    })
    mockRoute.query = { focus: 'meeting_link' }
    mockDetailContext(() => sessionDetail)

    renderView()

    const meetingCard = (await screen.findByText('Онлайн-зустріч')).closest('.meeting-card')
    expect(meetingCard).toBeInTheDocument()
    await waitFor(() => {
      expect(meetingCard).toHaveClass('meeting-card--focused')
    })
  })

  it('surfaces a stale confirm target error without reloading the page context', async () => {
    let sessionDetail = buildSession({ status: 'SCHEDULED' })
    mockDetailContext(() => sessionDetail)

    mockedApiPatch.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'STATE_TRANSITION_INVALID',
          reason_code: 'SESSION_STATUS_INVALID',
          detail: 'Invalid status transition.',
        },
      },
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/confirm/')
      expect(mockToast.error).toHaveBeenCalledTimes(1)
    })

    expect(endpointCalls('/booking/sessions/42/')).toBe(1)
    expect(screen.getByRole('button', { name: 'Підтвердити' })).not.toBeDisabled()
  })

  it('cancels a confirmed session and disables further cancellation after reload', async () => {
    let sessionDetail = buildSession({ status: 'CONFIRMED' })
    mockDetailContext(() => sessionDetail)

    mockedApiPatch.mockImplementation(async (url) => {
      if (url === '/booking/sessions/42/cancel/') {
        sessionDetail = {
          ...sessionDetail,
          status: 'CANCELLED',
        }
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/cancel/')
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionCancelled)
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Скасувати' })).toBeDisabled()
    })

    expect(screen.getByRole('button', { name: 'Перенести' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Повторювати щотижня' })).not.toBeInTheDocument()
    expect(endpointCalls('/booking/sessions/42/')).toBe(2)
  })

  it('completes a confirmed session, refreshes the detail context, and reloads the private note', async () => {
    let sessionDetail = buildSession({ status: 'CONFIRMED' })
    let noteContent = 'Completed session note'

    mockedApiGet.mockImplementation(async (url) => {
      if (url === `/booking/sessions/${mockRoute.params.id}/`) {
        return sessionDetail
      }

      if (url === '/booking/sessions/') {
        return [sessionDetail]
      }

      if (url === '/cabinet/slots/') {
        return [buildSlot()]
      }

      if (url === `/booking/sessions/${mockRoute.params.id}/reschedule-suggestions/`) {
        return {
          suggestions: [buildSuggestion()],
        }
      }

      if (url === `/cabinet/sessions/${mockRoute.params.id}/note/`) {
        return {
          content: noteContent,
        }
      }

      if (url === '/cabinet/sessions/reschedule-requests/') {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedApiPatch.mockImplementation(async (url, payload) => {
      if (url === '/booking/sessions/42/complete/') {
        expect(payload).toEqual({ actual_duration_minutes: 60 })
        sessionDetail = {
          ...sessionDetail,
          status: 'COMPLETED',
        }
        noteContent = 'Completed session note (reloaded)'
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Completed session note')).not.toBeInTheDocument()
    await fireEvent.click(await screen.findByRole('button', { name: 'Відкрити нотатку' }))
    expect(await screen.findByDisplayValue('Completed session note')).toBeInTheDocument()

    const statusPanel = screen.getByText(/ID: #77/).closest('section')
    expect(statusPanel).not.toBeNull()
    const completionButton = within(statusPanel as HTMLElement)
      .getAllByRole('button')
      .find((button) => button.textContent?.includes('Завершити'))
    if (!completionButton) {
      throw new Error('Complete button not found')
    }
    await fireEvent.click(completionButton)
    await fireEvent.click(screen.getByTestId('session-completion-submit'))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/complete/', {
        actual_duration_minutes: 60,
      })
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionCompleted)
    })

    const updatedStatusPanel = screen.getByText(/ID: #77/).closest('section')
    expect(updatedStatusPanel).not.toBeNull()
    const remainingActionButtons = within(updatedStatusPanel as HTMLElement).queryAllByRole('button')
    expect(remainingActionButtons).toHaveLength(4)
    expect(remainingActionButtons.filter((button) => button.hasAttribute('disabled')).length).toBeGreaterThanOrEqual(3)
    expect((updatedStatusPanel as HTMLElement).querySelector('.status-pill--muted')).not.toBeNull()
    expect(
      within(updatedStatusPanel as HTMLElement)
        .queryAllByRole('button')
        .some((button) => button.textContent?.includes('Завершити'))
    ).toBe(false)
    expect(screen.getByRole('button', { name: 'Відкрити приватний зошит' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Додати / відкрити нотатку' })).not.toBeInTheDocument()
    expect(await screen.findByDisplayValue('Completed session note (reloaded)')).toBeInTheDocument()
    expect(document.querySelector('a[href="/cabinet/clients?client=77&autoOpen=1"]')).toBeInTheDocument()
    expect(endpointCalls('/booking/sessions/42/')).toBe(2)
    expect(endpointCalls('/cabinet/slots/')).toBe(2)
    expect(endpointCalls('/booking/sessions/42/reschedule-suggestions/')).toBe(2)
    expect(endpointCalls('/cabinet/sessions/reschedule-requests/')).toBe(2)
    expect(endpointCalls('/cabinet/sessions/42/note/')).toBe(2)
  })

  it('keeps stale complete rejection inline without reloading detail context or note', async () => {
    let sessionDetail = buildSession({ status: 'CONFIRMED' })
    mockDetailContext(() => sessionDetail, {
      requests: [],
    })

    mockedApiPatch.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'STATE_TRANSITION_INVALID',
          reason_code: 'SESSION_STATUS_INVALID',
          detail: 'Invalid status transition.',
        },
      },
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Progress note')).not.toBeInTheDocument()
    await fireEvent.click(await screen.findByRole('button', { name: 'Відкрити нотатку' }))
    expect(await screen.findByDisplayValue('Progress note')).toBeInTheDocument()

    const statusPanel = screen.getByText(/ID: #77/).closest('section')
    expect(statusPanel).not.toBeNull()
    const completionButton = within(statusPanel as HTMLElement).getAllByRole('button')[1]
    if (!completionButton) {
      throw new Error('Complete button not found')
    }
    await fireEvent.click(completionButton)
    await fireEvent.click(screen.getByTestId('session-completion-submit'))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/complete/', {
        actual_duration_minutes: 60,
      })
      expect(mockToast.error).toHaveBeenCalledTimes(1)
    })

    expect(completionButton).not.toBeDisabled()
    expect(await screen.findByDisplayValue('Progress note')).toBeInTheDocument()
    expect(endpointCalls('/booking/sessions/42/')).toBe(1)
    expect(endpointCalls('/cabinet/slots/')).toBe(1)
    expect(endpointCalls('/booking/sessions/42/reschedule-suggestions/')).toBe(1)
    expect(endpointCalls('/cabinet/sessions/reschedule-requests/')).toBe(1)
    expect(endpointCalls('/cabinet/sessions/42/note/')).toBe(1)
  })

  it('keeps confirm, cancel, and reschedule guarded for non-actionable statuses', async () => {
    let sessionDetail = buildSession({ status: 'COMPLETED' })
    mockDetailContext(() => sessionDetail, {
      requests: [],
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Підтвердити' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Скасувати' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Перенести' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Повторювати щотижня' })).not.toBeInTheDocument()
    expect(mockedApiPatch).not.toHaveBeenCalled()
  })

  it('toggles the reschedule panel only for actionable sessions', async () => {
    let sessionDetail = buildSession({ status: 'CONFIRMED' })
    mockDetailContext(() => sessionDetail)

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Перенести' }))
    const reschedulePanel = await screen.findByTestId('reschedule-panel')
    expect(within(reschedulePanel).getByRole('heading', { name: 'Перенести сесію' })).toBeInTheDocument()
    expect(screen.getByText(/ID: #77/).closest('section')).toContainElement(reschedulePanel)
    expect(within(reschedulePanel).getByText('Для переносу оберіть один із доступних слотів.')).toBeInTheDocument()
    const dateInput = within(reschedulePanel).getByLabelText('Нова дата')
    const timeSelect = within(reschedulePanel).getByLabelText('Час початку')
    expect(dateInput).toHaveAttribute('type', 'text')
    expect(dateInput).toHaveAttribute('placeholder', 'ДД.ММ.РРРР')
    expect(reschedulePanel.querySelector('input[type="date"]')).not.toBeInTheDocument()
    expect(reschedulePanel.querySelector('input[type="time"]')).not.toBeInTheDocument()
    expect(timeSelect.tagName).toBe('SELECT')
    expect(within(timeSelect as HTMLElement).getByRole('option', { name: '09:10' })).toBeInTheDocument()
    expect(within(timeSelect as HTMLElement).queryByRole('option', { name: '09:25' })).not.toBeInTheDocument()
    await waitFor(() => {
      expect((dateInput as HTMLInputElement).value).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
      expect((timeSelect as HTMLSelectElement).value).toMatch(/^\d{2}:\d{2}$/)
    })
    expect(reschedulePanel.textContent).not.toMatch(/\b(?:AM|PM)\b/)
    await fireEvent.click(within(reschedulePanel).getByRole('button', { name: 'Відкрити календар' }))
    expect(within(reschedulePanel).getByRole('button', { name: 'Попередній місяць' })).toBeInTheDocument()
    await fireEvent.focus(timeSelect)
    expect(within(reschedulePanel).queryByRole('button', { name: 'Попередній місяць' })).not.toBeInTheDocument()
    await fireEvent.click(within(reschedulePanel).getByRole('button', { name: 'Відкрити календар' }))
    const currentDisplayDate = (dateInput as HTMLInputElement).value
    await fireEvent.click(within(reschedulePanel).getByRole('button', { name: currentDisplayDate }))
    expect((dateInput as HTMLInputElement).value).toBe(currentDisplayDate)
    expect(screen.getByRole('button', { name: 'Сховати перенос' })).toBeInTheDocument()

    const cancelButton = within(reschedulePanel).getAllByRole('button', { name: 'Скасувати' })[0]
    if (!cancelButton) {
      throw new Error('Cancel reschedule button not found')
    }
    await fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByTestId('reschedule-panel')).not.toBeInTheDocument()
    })
  })

  it('reschedules a confirmed session from visible date and time fields when they match an available slot', async () => {
    const updatedSlot = buildSlot({
      id: 71,
      start_at: '2099-06-20T09:10:00',
      end_at: '2099-06-20T10:10:00',
    })
    let sessionDetail = buildSession({ status: 'CONFIRMED' })

    mockedApiGet.mockImplementation(async (url) => {
      if (url === `/booking/sessions/${mockRoute.params.id}/`) {
        return sessionDetail
      }

      if (url === '/cabinet/slots/') {
        return [updatedSlot]
      }

      if (url === `/booking/sessions/${mockRoute.params.id}/reschedule-suggestions/`) {
        return {
          suggestions: [],
        }
      }

      if (url === `/cabinet/sessions/${mockRoute.params.id}/note/`) {
        return {
          content: 'Progress note',
        }
      }

      if (url === '/cabinet/sessions/reschedule-requests/') {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedApiPatch.mockImplementation(async (url, payload) => {
      if (url === '/booking/sessions/42/reschedule/') {
        expect(payload).toEqual({ slot_id: 71 })
        sessionDetail = {
          ...sessionDetail,
          slot_start_at: updatedSlot.start_at,
          slot_end_at: updatedSlot.end_at,
        }
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Перенести' }))

    const reschedulePanel = await screen.findByTestId('reschedule-panel')
    const dateField = within(reschedulePanel).getByLabelText('Нова дата')
    await fireEvent.update(dateField, '20.6.2099')
    await fireEvent.blur(dateField)
    expect((dateField as HTMLInputElement).value).toBe('20.06.2099')
    await fireEvent.update(within(reschedulePanel).getByLabelText('Нова дата'), '20.06.2099')
    await fireEvent.update(within(reschedulePanel).getByLabelText('Час початку'), '09:10')
    await fireEvent.click(within(reschedulePanel).getByRole('button', { name: 'Перенести сесію' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/reschedule/', {
        slot_id: 71,
      })
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
    })
  })

  it('blocks reschedule date and time submit when no available slot matches', async () => {
    const updatedSlot = buildSlot({
      id: 72,
      start_at: '2099-06-20T09:10:00',
      end_at: '2099-06-20T10:10:00',
    })
    const sessionDetail = buildSession({ status: 'CONFIRMED' })
    mockDetailContext(() => sessionDetail, {
      slots: [updatedSlot],
      suggestions: [],
      requests: [],
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Перенести' }))

    const reschedulePanel = await screen.findByTestId('reschedule-panel')
    await fireEvent.update(within(reschedulePanel).getByLabelText('Нова дата'), '20.06.2099')
    await fireEvent.update(within(reschedulePanel).getByLabelText('Час початку'), '09:20')
    await fireEvent.click(within(reschedulePanel).getByRole('button', { name: 'Перенести сесію' }))

    expect(
      await within(reschedulePanel).findByText('Для цього часу немає доступного слота. Оберіть час із запропонованих слотів.')
    ).toBeInTheDocument()
    expect(
      within(reschedulePanel).getByText('Якщо потрібного часу немає у списку, створіть вікна для запису в розкладі.')
    ).toBeInTheDocument()
    const availabilityLink = within(reschedulePanel).getByRole('link', { name: 'Перейти до вікон для запису' })
    expect(availabilityLink).toHaveAttribute('href', '/cabinet/slots?tab=availability')
    expect(mockedApiPatch).not.toHaveBeenCalledWith('/booking/sessions/42/reschedule/', expect.anything())
  })

  it('shows guidance when no available slots exist for reschedule', async () => {
    const sessionDetail = buildSession({ status: 'CONFIRMED' })
    mockDetailContext(() => sessionDetail, {
      slots: [],
      suggestions: [],
      requests: [],
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Перенести' }))

    const reschedulePanel = await screen.findByTestId('reschedule-panel')
    expect(within(reschedulePanel).getByText('Немає доступних слотів для переносу')).toBeInTheDocument()
    expect(
      within(reschedulePanel).getByText(
        'Щоб перенести сесію, спочатку створіть вікна для запису в розкладі. Після цього поверніться до цієї сесії та оберіть слот для переносу.'
      )
    ).toBeInTheDocument()
    const availabilityLink = within(reschedulePanel).getByRole('link', { name: 'Створити вікна' })
    expect(availabilityLink).toHaveAttribute('href', '/cabinet/slots?tab=availability')
    expect(availabilityLink).toHaveClass('btn')
    expect(availabilityLink).not.toHaveClass('btn--ghost')
    expect(within(reschedulePanel).getAllByRole('link', { name: 'Створити вікна' })).toHaveLength(1)
    expect(within(reschedulePanel).queryByRole('link', { name: 'Перейти до вікон для запису' })).not.toBeInTheDocument()
    expect(within(reschedulePanel).queryByLabelText('Нова дата')).not.toBeInTheDocument()
    expect(within(reschedulePanel).queryByLabelText('Час початку')).not.toBeInTheDocument()
    expect(within(reschedulePanel).queryByText('Рекомендовані варіанти')).not.toBeInTheDocument()
  })

  it('blocks reschedule submit when visible date format is invalid', async () => {
    const updatedSlot = buildSlot({
      id: 73,
      start_at: '2099-06-20T09:10:00',
      end_at: '2099-06-20T10:10:00',
    })
    const sessionDetail = buildSession({ status: 'CONFIRMED' })
    mockDetailContext(() => sessionDetail, {
      slots: [updatedSlot],
      suggestions: [],
      requests: [],
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Перенести' }))

    const reschedulePanel = await screen.findByTestId('reschedule-panel')
    await fireEvent.update(within(reschedulePanel).getByLabelText('Нова дата'), '31.02.2099')
    await fireEvent.update(within(reschedulePanel).getByLabelText('Час початку'), '09:10')
    await fireEvent.click(within(reschedulePanel).getByRole('button', { name: 'Перенести сесію' }))

    expect(
      await within(reschedulePanel).findByText('Введіть дату у форматі ДД.ММ.РРРР, наприклад 25.06.2026.')
    ).toBeInTheDocument()
    expect(mockedApiPatch).not.toHaveBeenCalledWith('/booking/sessions/42/reschedule/', expect.anything())
  })

  it('blocks reschedule submit when start time is missing', async () => {
    const updatedSlot = buildSlot({
      id: 74,
      start_at: '2099-06-20T09:10:00',
      end_at: '2099-06-20T10:10:00',
    })
    const sessionDetail = buildSession({ status: 'CONFIRMED' })
    mockDetailContext(() => sessionDetail, {
      slots: [updatedSlot],
      suggestions: [],
      requests: [],
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Перенести' }))

    const reschedulePanel = await screen.findByTestId('reschedule-panel')
    await fireEvent.update(within(reschedulePanel).getByLabelText('Нова дата'), '20.06.2099')
    await fireEvent.update(within(reschedulePanel).getByLabelText('Час початку'), '')
    await fireEvent.click(within(reschedulePanel).getByRole('button', { name: 'Перенести сесію' }))

    expect(await within(reschedulePanel).findByText('Оберіть час початку.')).toBeInTheDocument()
    expect(mockedApiPatch).not.toHaveBeenCalledWith('/booking/sessions/42/reschedule/', expect.anything())
  })

  it('does not block a future slot only because it is earlier than the current session', async () => {
    const earlierFutureSlot = buildSlot({
      id: 75,
      start_at: '2099-06-19T08:00:00',
      end_at: '2099-06-19T09:00:00',
    })
    let sessionDetail = buildSession({
      status: 'CONFIRMED',
      slot_start_at: '2099-06-20T09:00:00',
      slot_end_at: '2099-06-20T10:00:00',
    })
    mockDetailContext(() => sessionDetail, {
      slots: [earlierFutureSlot],
      suggestions: [],
      requests: [],
    })
    mockedApiPatch.mockImplementation(async (url, payload) => {
      if (url === '/booking/sessions/42/reschedule/') {
        expect(payload).toEqual({ slot_id: earlierFutureSlot.id })
        sessionDetail = {
          ...sessionDetail,
          slot_start_at: earlierFutureSlot.start_at,
          slot_end_at: earlierFutureSlot.end_at,
        }
        return {}
      }
      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Перенести' }))

    const reschedulePanel = await screen.findByTestId('reschedule-panel')
    await fireEvent.update(within(reschedulePanel).getByLabelText('Нова дата'), '19.06.2099')
    await fireEvent.update(within(reschedulePanel).getByLabelText('Час початку'), '08:00')
    await fireEvent.click(within(reschedulePanel).getByRole('button', { name: 'Перенести сесію' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/reschedule/', {
        slot_id: earlierFutureSlot.id,
      })
    })
    expect(within(reschedulePanel).queryByText('Неможливо перенести сесію на раніший час.')).not.toBeInTheDocument()
  })

  it('reschedules a confirmed session from detail suggestions and refreshes the session context', async () => {
    const updatedSlot = buildSlot({
      id: 10,
      start_at: '2099-06-18T10:00:00Z',
      end_at: '2099-06-18T11:00:00Z',
    })
    const updatedSuggestion = buildSuggestion({
      slot_id: updatedSlot.id,
      start_at: updatedSlot.start_at,
      end_at: updatedSlot.end_at,
    })
    let sessionDetail = buildSession({ status: 'CONFIRMED' })

    mockedApiGet.mockImplementation(async (url) => {
      if (url === `/booking/sessions/${mockRoute.params.id}/`) {
        return sessionDetail
      }

      if (url === '/cabinet/slots/') {
        return [updatedSlot]
      }

      if (url === `/booking/sessions/${mockRoute.params.id}/reschedule-suggestions/`) {
        return {
          suggestions: [updatedSuggestion],
        }
      }

      if (url === `/cabinet/sessions/${mockRoute.params.id}/note/`) {
        return {
          content: 'Progress note',
        }
      }

      if (url === '/cabinet/sessions/reschedule-requests/') {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedApiPatch.mockImplementation(async (url, payload) => {
      if (url === '/booking/sessions/42/reschedule/') {
        expect(payload).toEqual({ slot_id: 10 })
        sessionDetail = {
          ...sessionDetail,
          slot_start_at: updatedSlot.start_at,
          slot_end_at: updatedSlot.end_at,
        }
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    const statusPanel = screen.getByText(/ID: #77/).closest('section')
    expect(statusPanel).not.toBeNull()
    const summaryButtons = within(statusPanel as HTMLElement).getAllByRole('button')
    const rescheduleButton = summaryButtons[3]
    if (!rescheduleButton) {
      throw new Error('Reschedule button not found')
    }

    await fireEvent.click(rescheduleButton)
    const reschedulePanel = await screen.findByTestId('reschedule-panel')
    const suggestionButton = within(reschedulePanel).getByRole('button', {
      name: `${formatSessionDateTime(updatedSuggestion.start_at)} · 1 год Найближче доступне вікно`,
    })
    expect(within(reschedulePanel).queryByRole('button', { name: 'Перенести сюди' })).not.toBeInTheDocument()
    await fireEvent.click(suggestionButton)

    const confirmRescheduleButton = within(reschedulePanel).getByRole('button', { name: 'Підтвердити перенос' })
    await fireEvent.click(confirmRescheduleButton)

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/reschedule/', {
        slot_id: 10,
      })
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
    })

    expect(screen.getAllByText(formatSessionDateTime(updatedSlot.start_at))).not.toHaveLength(0)
    expect(endpointCalls('/booking/sessions/42/')).toBe(2)
    expect(endpointCalls('/cabinet/slots/')).toBe(2)
    expect(endpointCalls('/booking/sessions/42/reschedule-suggestions/')).toBe(2)
    expect(endpointCalls('/cabinet/sessions/reschedule-requests/')).toBe(2)
    expect(endpointCalls('/cabinet/sessions/42/note/')).toBe(1)
  })

  it('renders recommended reschedule slots chronologically by start time', async () => {
    const suggestions = [
      buildSuggestion({
        slot_id: 103,
        start_at: '2099-06-18T10:00:00Z',
        end_at: '2099-06-18T11:00:00Z',
      }),
      buildSuggestion({
        slot_id: 101,
        start_at: '2099-06-18T08:00:00Z',
        end_at: '2099-06-18T09:00:00Z',
      }),
      buildSuggestion({
        slot_id: 105,
        start_at: '2099-06-18T13:00:00Z',
        end_at: '2099-06-18T14:00:00Z',
      }),
      buildSuggestion({
        slot_id: 102,
        start_at: '2099-06-18T09:00:00Z',
        end_at: '2099-06-18T10:00:00Z',
      }),
      buildSuggestion({
        slot_id: 104,
        start_at: '2099-06-18T12:00:00Z',
        end_at: '2099-06-18T13:00:00Z',
      }),
    ]
    const slots = suggestions.map((item) =>
      buildSlot({
        id: item.slot_id,
        start_at: item.start_at,
        end_at: item.end_at,
      })
    )
    const sessionDetail = buildSession({ status: 'CONFIRMED' })
    mockDetailContext(() => sessionDetail, {
      slots,
      suggestions,
      requests: [],
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Перенести' }))

    const reschedulePanel = await screen.findByTestId('reschedule-panel')
    const suggestionButtons = within(reschedulePanel)
      .getAllByRole('button')
      .filter((button) => button.classList.contains('suggestion-btn'))

    expect(suggestionButtons.map((button) => button.querySelector('span')?.textContent?.trim())).toEqual([
      `${formatSessionDateTime('2099-06-18T08:00:00Z')} · 1 год`,
      `${formatSessionDateTime('2099-06-18T09:00:00Z')} · 1 год`,
      `${formatSessionDateTime('2099-06-18T10:00:00Z')} · 1 год`,
      `${formatSessionDateTime('2099-06-18T12:00:00Z')} · 1 год`,
      `${formatSessionDateTime('2099-06-18T13:00:00Z')} · 1 год`,
    ])
  })

  it('keeps non-recommended available slot actions working', async () => {
    const recommendedSlot = buildSlot({
      id: 91,
      start_at: '2099-06-18T10:00:00Z',
      end_at: '2099-06-18T11:00:00Z',
    })
    const normalSlot = buildSlot({
      id: 92,
      start_at: '2099-06-19T12:00:00Z',
      end_at: '2099-06-19T13:00:00Z',
    })
    const recommendation = buildSuggestion({
      slot_id: recommendedSlot.id,
      start_at: recommendedSlot.start_at,
      end_at: recommendedSlot.end_at,
    })
    let sessionDetail = buildSession({ status: 'CONFIRMED' })

    mockedApiGet.mockImplementation(async (url) => {
      if (url === `/booking/sessions/${mockRoute.params.id}/`) {
        return sessionDetail
      }

      if (url === '/cabinet/slots/') {
        return [recommendedSlot, normalSlot]
      }

      if (url === `/booking/sessions/${mockRoute.params.id}/reschedule-suggestions/`) {
        return {
          suggestions: [recommendation],
        }
      }

      if (url === `/cabinet/sessions/${mockRoute.params.id}/note/`) {
        return {
          content: 'Progress note',
        }
      }

      if (url === '/cabinet/sessions/reschedule-requests/') {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedApiPatch.mockImplementation(async (url, payload) => {
      if (url === '/booking/sessions/42/reschedule/') {
        expect(payload).toEqual({ slot_id: normalSlot.id })
        sessionDetail = {
          ...sessionDetail,
          slot_start_at: normalSlot.start_at,
          slot_end_at: normalSlot.end_at,
        }
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Перенести' }))

    const reschedulePanel = await screen.findByTestId('reschedule-panel')
    expect(
      within(reschedulePanel).getByRole('button', {
        name: `${formatSessionDateTime(recommendation.start_at)} · 1 год Найближче доступне вікно`,
      })
    ).toBeInTheDocument()
    const recommendedSlotOccurrences = Array.from(
      reschedulePanel.querySelectorAll('.suggestion-btn span:first-child, .slot-time')
    ).filter((element) => element.textContent?.startsWith(formatSessionDateTime(recommendedSlot.start_at)))
    expect(recommendedSlotOccurrences).toHaveLength(1)

    const normalSlotCard = within(reschedulePanel)
      .getByText(formatSessionDateTime(normalSlot.start_at))
      .closest('.slot-card')
    expect(normalSlotCard).not.toBeNull()
    await fireEvent.click(within(normalSlotCard as HTMLElement).getByRole('button', { name: 'Перенести сюди' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/reschedule/', {
        slot_id: normalSlot.id,
      })
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
    })
  })

  it('approves and declines reschedule requests from the detail view with the expected refresh behavior', async () => {
    let sessionDetail = buildSession({ status: 'CONFIRMED' })
    let requests: [DetailRequest, DetailRequest] = [
      buildRequest({
        id: 15,
        client_email: 'approve-request@example.com',
        status: 'PENDING',
      }),
      buildRequest({
        id: 16,
        requested_slot_id: 10,
        requested_slot_start_at: '2099-06-18T10:00:00Z',
        requested_slot_end_at: '2099-06-18T11:00:00Z',
        client_email: 'decline-request@example.com',
        status: 'PENDING',
      }),
    ]

    mockedApiGet.mockImplementation(async (url) => {
      if (url === `/booking/sessions/${mockRoute.params.id}/`) {
        return sessionDetail
      }

      if (url === '/cabinet/slots/') {
        return [buildSlot()]
      }

      if (url === `/booking/sessions/${mockRoute.params.id}/reschedule-suggestions/`) {
        return {
          suggestions: [buildSuggestion()],
        }
      }

      if (url === `/cabinet/sessions/${mockRoute.params.id}/note/`) {
        return {
          content: 'Progress note',
        }
      }

      if (url === '/cabinet/sessions/reschedule-requests/') {
        return requests.map((request) => ({ ...request }))
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedApiPatch.mockImplementation(async (url) => {
      if (url === '/cabinet/sessions/reschedule-requests/15/approve/') {
        const [approveRequest, declineRequest] = requests
        requests = [
          {
            ...approveRequest,
            status: 'APPROVED',
          },
          declineRequest,
        ]
        return {}
      }

      if (url === '/cabinet/sessions/reschedule-requests/16/decline/') {
        const [approveRequest, declineRequest] = requests
        requests = [
          approveRequest,
          {
            ...declineRequest,
            status: 'DECLINED',
          },
        ]
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('approve-request@example.com')).toBeInTheDocument()

    const approveCard = screen.getByText('approve-request@example.com').closest('article')
    expect(approveCard).not.toBeNull()
    await fireEvent.click((approveCard as HTMLElement).querySelectorAll('button')[0] as HTMLButtonElement)

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/cabinet/sessions/reschedule-requests/15/approve/')
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.rescheduleRequestApproved)
    })

    await waitFor(() => {
      expect((screen.getByText('approve-request@example.com').closest('article') as HTMLElement).querySelectorAll('button')).toHaveLength(0)
    })

    const declineCard = screen.getByText('decline-request@example.com').closest('article')
    expect(declineCard).not.toBeNull()
    await fireEvent.click((declineCard as HTMLElement).querySelectorAll('button')[1] as HTMLButtonElement)

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/cabinet/sessions/reschedule-requests/16/decline/')
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.rescheduleRequestDeclined)
    })

    await waitFor(() => {
      expect((screen.getByText('decline-request@example.com').closest('article') as HTMLElement).querySelectorAll('button')).toHaveLength(0)
    })

    expect(endpointCalls('/booking/sessions/42/')).toBe(2)
    expect(endpointCalls('/cabinet/slots/')).toBe(2)
    expect(endpointCalls('/booking/sessions/42/reschedule-suggestions/')).toBe(2)
    expect(endpointCalls('/cabinet/sessions/reschedule-requests/')).toBe(3)
    expect(endpointCalls('/cabinet/sessions/42/note/')).toBe(1)
  })

  it('shows recurring controls for eligible sessions and blocks invalid custom occurrences client-side', async () => {
    let sessionDetail = buildSession({
      status: 'CONFIRMED',
      slot_start_at: '2099-07-15T10:00:00Z',
      slot_end_at: '2099-07-15T11:00:00Z',
    })
    mockDetailContext(() => sessionDetail, {
      requests: [],
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Повторювати щотижня' }))
    expect(await screen.findByText('Створити повторювані сесії')).toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Кількість повторів'), 'custom')
    await fireEvent.update(screen.getByLabelText('Власне число'), '0')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити серію' }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Вкажіть кількість повторів від 1 до 52.')
    })

    expect(mockedApiPost).not.toHaveBeenCalled()
  })

  it('shows an inline empty state and skips API loading for an invalid route id', async () => {
    mockRoute.params.id = 'not-a-number'

    const { container } = renderView()

    await waitFor(() => {
      expect(container.querySelector('.empty-state')).toBeInTheDocument()
    })

    expect(mockedApiGet).not.toHaveBeenCalled()
    expect(container.querySelector('a[href="/cabinet/sessions"]')).toBeInTheDocument()
  })

  it('shows the stale session error state when the detail request fails', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/42/') {
        throw {
          response: {
            status: 404,
            data: {
              code: 'SESSION_NOT_FOUND',
              detail: 'Session missing.',
            },
          },
        }
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    await waitFor(() => {
      expect(container.querySelector('.empty-state')).toBeInTheDocument()
    })

    expect(container).toHaveTextContent(/Сесію не знайдено/i)
    expect(mockedApiGet).toHaveBeenCalledTimes(1)
    expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/42/')
  })

  it('allows editing the meeting link and reloads the session on success', async () => {
    const oldUrl = 'https://meet.example.com/old-link'
    const newUrl = 'https://meet.example.com/new-link'
    let sessionDetail: Record<string, unknown> = buildSession({
      status: 'CONFIRMED',
      meeting_mode: 'ONLINE',
      meeting_url: oldUrl,
      meeting_provider: 'GOOGLE_MEET',
      meeting_link_ready: true,
      join_available: true,
      join_starts_at: '2099-06-14T10:00:00Z',
      join_ends_at: '2099-06-15T11:30:00Z',
    })
    mockDetailContext(() => sessionDetail)

    mockedUpdateSpecialistSessionMeeting.mockImplementation(async (_sessionId, payload) => {
      expect(_sessionId).toBe(42)
      expect(payload).toEqual({
        meeting_mode: 'ONLINE',
        meeting_url: newUrl,
      })

      sessionDetail = {
        ...sessionDetail,
        meeting_mode: 'ONLINE',
        meeting_url: newUrl,
        meeting_provider: 'EXTERNAL',
        meeting_link_ready: true,
        join_available: true,
      }

      return sessionDetail as any
    })

    renderView()

    const meetingCard = (await screen.findByText('Приєднатися')).closest('.meeting-card')
    expect(meetingCard).toBeInTheDocument()

    const editButton = within(meetingCard as HTMLElement).getByRole('button', { name: 'Змінити посилання' })
    await fireEvent.click(editButton)

    const input = (await within(meetingCard as HTMLElement).findByLabelText(
      'Посилання на онлайн-зустріч'
    )) as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.value).toBe(oldUrl)

    await fireEvent.update(input, newUrl)

    const saveButton = within(meetingCard as HTMLElement).getByRole('button', { name: 'Зберегти' })
    await fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockedUpdateSpecialistSessionMeeting).toHaveBeenCalledWith(42, {
        meeting_mode: 'ONLINE',
        meeting_url: newUrl,
      })
    })

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledTimes(1)
    })

    expect(endpointCalls('/booking/sessions/42/')).toBe(2)
  })
})
