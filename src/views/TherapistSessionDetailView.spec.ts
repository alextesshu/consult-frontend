import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiGet,
  apiPatch,
  apiPost,
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
}

const mockRouter = {
  push: vi.fn(),
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
      can_open_workbook: true,
      can_review_payment: true,
    },
    available_action_items: [
      { code: 'OPEN_NOTE', label: 'Open note' },
      { code: 'OPEN_WORKBOOK', label: 'Open workbook' },
      { code: 'REVIEW_PAYMENT', label: 'Review payment' },
    ],
    pending_task_items: [
      { code: 'OPEN_NOTE', label: 'Open note' },
      { code: 'OPEN_WORKBOOK', label: 'Open workbook' },
      { code: 'REVIEW_PAYMENT', label: 'Review payment' },
    ],
    available_actions: ['OPEN_NOTE', 'OPEN_WORKBOOK', 'REVIEW_PAYMENT'],
    pending_tasks: ['OPEN_NOTE', 'OPEN_WORKBOOK', 'REVIEW_PAYMENT'],
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
    mockRouter.push.mockReset()
    mockedApiGet.mockReset()
    mockedApiPatch.mockReset()
    mockedApiPost.mockReset()
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
    expect(screen.getByText(/ID: #77/)).toBeInTheDocument()
    expect(await screen.findByText('request@example.com')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Progress note')).toBeInTheDocument()

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
    const sessionDetail = buildSession({
      status: 'SCHEDULED',
      payment_proof: initialPaymentProof,
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    mockedRequestSessionPaymentProof.mockResolvedValue({
      ...initialPaymentProof,
      status: 'REQUESTED',
      specialist_can_request_proof_now: true,
    } as any)
    mockedFetchSessionPaymentProof.mockResolvedValue({
      ...initialPaymentProof,
      status: 'REQUESTED',
      specialist_can_request_proof_now: true,
    } as any)

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

    const sessionDetail = buildSession({
      status: 'CONFIRMED',
      payment_proof: initialPaymentProof,
    })
    mockDetailContext(() => sessionDetail, { requests: [] })

    mockedMarkSessionPaymentProofPaid.mockResolvedValue(markedPaidProof as any)
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
    expect(screen.getByTestId('workspace-summary-payment')).toHaveTextContent('Не оплачено')
    expect(screen.getByTestId('workspace-summary-note')).toHaveTextContent('Потрібно створити')
    expect(screen.getByTestId('workspace-summary-workbook')).toHaveTextContent('Потрібно створити')
    expect(screen.getByTestId('workspace-actions')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Відкрити нотатку' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Відкрити робочий зошит' })).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: 'Відкрити робочий зошит' })).toBeInTheDocument()
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
    expect(screen.getByTestId('workspace-summary-payment')).toHaveTextContent('Оплачено')
    expect(screen.getByTestId('workspace-summary-note')).toHaveTextContent('Заповнено')
    expect(screen.getByTestId('workspace-summary-workbook')).toHaveTextContent('Заповнено')
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
    expect(screen.getByTestId('workspace-summary-payment')).toHaveTextContent('Очікує підтвердження')
    expect(screen.getByRole('button', { name: 'Перевірити оплату' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Відкрити нотатку' })).not.toBeInTheDocument()
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
    expect(screen.getByTestId('workspace-summary-note')).toHaveTextContent('Недоступно')
    expect(screen.getByTestId('workspace-summary-workbook')).toHaveTextContent('Недоступно')
    expect(screen.queryByText('Потрібно створити')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Відкрити нотатку' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Відкрити робочий зошит' })).not.toBeInTheDocument()
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
    const noteTextarea = (await screen.findByDisplayValue('Progress note')) as HTMLTextAreaElement
    ;(noteTextarea as any).scrollIntoView = vi.fn()
    const noteAction = await screen.findByTestId('workspace-action-open_note')
    await fireEvent.click(noteAction)
    await waitFor(() => {
      expect(document.activeElement).toBe(noteTextarea)
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

  it('creates board task from session quick-add button with session context', async () => {
    const sessionDetail = buildSession({
      id: 42,
      client: 77,
      status: 'CONFIRMED',
    })
    mockDetailContext(() => sessionDetail)
    mockedCreatePracticeBoardItem.mockResolvedValue({ id: 901 } as any)
    mockedFetchPracticeBoards.mockResolvedValue([{ id: 1, title: 'Main board', is_default: true }] as any)

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Додати на дошку' }))

    await waitFor(() => {
      expect(mockedCreatePracticeBoardItem).toHaveBeenCalledWith({
        board_id: 1,
        title: 'Повернутись до сесії',
        related_client_id: 77,
        related_session_id: 42,
        source_type: 'session',
        source_id: 42,
      })
      expect(mockToast.success).toHaveBeenCalledWith('Задачу додано на дошку')
    })
  })
  it.each(['REVIEW_PAYMENT', 'UPLOAD_PAYMENT_PROOF', 'CONFIRM_PAYMENT'] as const)(
    'routes %s workspace action by code to payment section',
    async (actionCode) => {
      const originalScrollIntoView = (HTMLElement.prototype as any).scrollIntoView
      const scrollSpy = vi.fn()
      ;(HTMLElement.prototype as any).scrollIntoView = scrollSpy
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
        ;(HTMLElement.prototype as any).scrollIntoView = originalScrollIntoView
      }
    }
  )
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
      expect(screen.getByRole('button', { name: 'Відкрити робочий зошит' })).toBeInTheDocument()
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
    expect(await screen.findByText('Новий слот для сесії')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сховати перенос' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Сховати перенос' }))

    await waitFor(() => {
      expect(screen.queryByText('Новий слот для сесії')).not.toBeInTheDocument()
    })
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
    await waitFor(() => {
      expect(document.querySelector('.slot-list')).not.toBeNull()
    })
    const reschedulePanel = document.querySelector('.slot-list')?.closest('section')
    expect(reschedulePanel).not.toBeNull()

    const panelButtons = within(reschedulePanel as HTMLElement).getAllByRole('button')
    const suggestionButton = panelButtons[0]
    if (!suggestionButton) {
      throw new Error('Suggestion button not found')
    }
    await fireEvent.click(suggestionButton)

    const confirmRescheduleButton = within(reschedulePanel as HTMLElement).getAllByRole('button')[1]
    if (!confirmRescheduleButton) {
      throw new Error('Confirm reschedule button not found')
    }
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



