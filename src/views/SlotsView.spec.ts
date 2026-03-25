import { fireEvent, render, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost } from '../lib/api'
import SlotsView from './SlotsView.vue'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  show: vi.fn(),
}

const mockConfirmModal = {
  open: false,
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  tone: 'danger',
  confirm: vi.fn(),
  closeConfirm: vi.fn(),
  openConfirm: vi.fn(),
}

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../composables/useConfirmModal', () => ({
  useConfirmModal: () => mockConfirmModal,
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPost = vi.mocked(apiPost)

async function flushAsyncUpdates() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

function renderView() {
  return render(SlotsView, {
    global: {
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>',
        },
        ScheduleSubnav: {
          template: '<div data-testid="schedule-subnav" />',
        },
        ConfirmModal: {
          template: '<div data-testid="confirm-modal" />',
        },
      },
    },
  })
}

function getCreateFormControls(container: Element) {
  const form = container.querySelector('.slot-form')
  if (!form) throw new Error('Create slot form not found')

  const dateInput = form.querySelector('input[type="date"]')
  const timeInput = form.querySelector('input[list="time-options"]')
  const durationInput = form.querySelector('input[type="number"]')
  const submitButton = form.querySelector('button')

  if (!dateInput || !timeInput || !durationInput || !submitButton) {
    throw new Error('Create slot controls not found')
  }

  return {
    dateInput: dateInput as HTMLInputElement,
    timeInput: timeInput as HTMLInputElement,
    durationInput: durationInput as HTMLInputElement,
    submitButton: submitButton as HTMLButtonElement,
  }
}

describe('SlotsView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T10:00:00+02:00'))
    mockedApiGet.mockReset()
    mockedApiPost.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hides free slots whose start time is already in the past', async () => {
    mockedApiGet.mockResolvedValue([
      {
        id: 1,
        start_at: '2026-03-12T05:00:00Z',
        end_at: '2026-03-12T05:50:00Z',
        is_booked: false,
      },
      {
        id: 2,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    expect(screen.queryByText('07:00')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.slot-card')).toHaveLength(1)
  })

  it('shows the exact conflict slot from backend metadata and explains when that slot is already in the past', async () => {
    mockedApiGet.mockResolvedValue([
      {
        id: 2,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
    ])
    mockedApiPost.mockRejectedValue({
      response: {
        data: {
          code: 'SLOT_OVERLAP',
          detail: 'overlaps',
          conflict: {
            slot_id: 1,
            start_at: '2026-03-12T01:00:00Z',
            end_at: '2026-03-12T01:50:00Z',
          },
        },
      },
    })

    const { container } = renderView()
    await flushAsyncUpdates()

    expect(screen.getByText('11:00')).toBeInTheDocument()
    expect(screen.queryByText('03:00')).not.toBeInTheDocument()

    const { dateInput, timeInput, durationInput, submitButton } = getCreateFormControls(container)
    await fireEvent.update(dateInput, '2026-03-12')
    await fireEvent.update(timeInput, '11:10')
    await fireEvent.update(durationInput, '15')
    await fireEvent.click(submitButton)
    await flushAsyncUpdates()

    expect(
      screen.getByText('Віконце перетинається з уже існуючим: 12.03.2026, 03:00-03:50. Це вікно вже в минулому, тому не показується у списку за замовчуванням.')
    ).toBeInTheDocument()
  })

  it('falls back to the generic overlap copy when backend does not return conflict metadata', async () => {
    mockedApiGet.mockResolvedValue([
      {
        id: 2,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
    ])
    mockedApiPost.mockRejectedValue({
      response: {
        data: {
          code: 'SLOT_OVERLAP',
          detail: 'overlaps',
        },
      },
    })

    const { container } = renderView()
    await flushAsyncUpdates()

    const { dateInput, timeInput, durationInput, submitButton } = getCreateFormControls(container)
    await fireEvent.update(dateInput, '2026-03-12')
    await fireEvent.update(timeInput, '11:10')
    await fireEvent.update(durationInput, '15')
    await fireEvent.click(submitButton)
    await flushAsyncUpdates()

    expect(screen.getByText('Віконце перетинається з уже існуючим.')).toBeInTheDocument()
  })

  it('reloads the current slots list and shows success feedback after create', async () => {
    mockedApiGet
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 5,
          start_at: '2026-03-12T09:10:00Z',
          end_at: '2026-03-12T09:40:00Z',
          is_booked: false,
        },
      ])
    mockedApiPost.mockResolvedValue({
      detail: 'created',
    } as any)

    const { container } = renderView()
    await flushAsyncUpdates()

    expect(mockedApiGet).toHaveBeenCalledTimes(1)

    const { dateInput, timeInput, durationInput, submitButton } = getCreateFormControls(container)
    await fireEvent.update(dateInput, '2026-03-12')
    await fireEvent.update(timeInput, '11:10')
    await fireEvent.update(durationInput, '30')
    await fireEvent.click(submitButton)
    await flushAsyncUpdates()

    expect(mockedApiGet).toHaveBeenCalledTimes(2)
    expect(screen.getByText('11:10')).toBeInTheDocument()
    expect(mockToast.success).toHaveBeenCalledWith('Вільне вікно на 12.03.2026, 11:10 створено.')
  })

  it('switches to the nearest future date after fill-week when selected day has no future slots', async () => {
    mockedApiGet
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 9,
          start_at: '2026-03-13T09:00:00Z',
          end_at: '2026-03-13T09:50:00Z',
          is_booked: false,
        },
      ])
    mockedApiPost.mockResolvedValue({ ok: true } as any)

    renderView()
    await flushAsyncUpdates()

    await fireEvent.click(screen.getByRole('button', { name: 'Заповнити тиждень (Пн-Пт)' }))
    await flushAsyncUpdates()

    expect(screen.getByText('11:00')).toBeInTheDocument()
    expect(mockToast.info).toHaveBeenCalledWith(
      'За 12.03.2026 немає майбутніх вікон. Показано найближчу дату: 13.03.2026.'
    )
  })
})
