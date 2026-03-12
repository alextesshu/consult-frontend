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

    renderView()
    await flushAsyncUpdates()

    expect(screen.queryByText('12.03.2026, 07:00')).not.toBeInTheDocument()
    expect(screen.getAllByText('Вільно')).toHaveLength(1)
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
          detail: 'overlaps',
          conflict: {
            slot_id: 1,
            start_at: '2026-03-12T01:00:00Z',
            end_at: '2026-03-12T01:50:00Z',
          },
        },
      },
    })

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByText('12.03.2026, 11:00')).toBeInTheDocument()

    expect(screen.queryByText('12.03.2026, 03:00')).not.toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Дата початку'), '2026-03-12')
    await fireEvent.update(screen.getByLabelText('Час початку'), '11:10')
    await fireEvent.update(screen.getByLabelText('Тривалість у хвилинах'), '15')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити вільне вікно' }))
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
          detail: 'overlaps',
        },
      },
    })

    renderView()
    await flushAsyncUpdates()

    await fireEvent.update(screen.getByLabelText('Дата початку'), '2026-03-12')
    await fireEvent.update(screen.getByLabelText('Час початку'), '11:10')
    await fireEvent.update(screen.getByLabelText('Тривалість у хвилинах'), '15')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити вільне вікно' }))
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

    renderView()
    await flushAsyncUpdates()

    expect(mockedApiGet).toHaveBeenCalledTimes(1)

    await fireEvent.update(screen.getByLabelText('Дата початку'), '2026-03-12')
    await fireEvent.update(screen.getByLabelText('Час початку'), '11:10')
    await fireEvent.update(screen.getByLabelText('Тривалість у хвилинах'), '30')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити вільне вікно' }))
    await flushAsyncUpdates()

    expect(mockedApiGet).toHaveBeenCalledTimes(2)
    expect(screen.getByText('12.03.2026, 11:10')).toBeInTheDocument()

    expect(mockToast.success).toHaveBeenCalledWith('Вільне вікно на 12.03.2026, 11:10 створено.')
  })
})
