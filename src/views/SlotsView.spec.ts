import { fireEvent, render, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost, createClientRegularTime } from '../lib/api'
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
  createClientRegularTime: vi.fn(),
  getApiErrorMessage: vi.fn((err: any, fallback: string) => err?.message || fallback),
}))

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../composables/useConfirmModal', () => ({
  useConfirmModal: () => mockConfirmModal,
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPost = vi.mocked(apiPost)
const mockedCreateClientRegularTime = vi.mocked(createClientRegularTime)

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
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : to?.path"><slot /></a>',
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
  if (!form) throw new Error('Create form not found')

  const dateInput = form.querySelector('input[aria-label="Дата"]')
  const timeInput = form.querySelector('input[list="time-options"]')
  const durationInput = form.querySelector('input[type="number"]')
  const submitButton = form.querySelector('button[type="submit"]')

  if (!dateInput || !timeInput || !durationInput || !submitButton) {
    throw new Error('Create controls not found')
  }

  return {
    dateInput: dateInput as HTMLInputElement,
    timeInput: timeInput as HTMLInputElement,
    durationInput: durationInput as HTMLInputElement,
    submitButton: submitButton as HTMLButtonElement,
  }
}

async function openCreateForm(container: Element) {
  const addButton = screen.getAllByRole('button', { name: 'Додати вільний час' })[0]
  if (!addButton) throw new Error('Add free time button not found')
  await fireEvent.click(addButton)
  await flushAsyncUpdates()
  return getCreateFormControls(container)
}

function scheduleSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 101,
    slot: null,
    slot_start_at: '2026-03-12T11:00:00Z',
    slot_end_at: '2026-03-12T11:50:00Z',
    status: 'SCHEDULED',
    client_display_name: 'Саша Мальована',
    client_name: 'Саша Мальована',
    client_username: 'sasha',
    client_email: 'sasha@example.com',
    client_record_id: 51,
    ...overrides,
  }
}

function manualClientRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 71,
    display_name: 'Manual Regular',
    status: 'active',
    archived_at: null,
    ...overrides,
  }
}

function registeredClient(overrides: Record<string, unknown> = {}) {
  return {
    id: 81,
    client_record_id: 72,
    state: 'ACTIVE',
    client_display_name: 'Registered Regular',
    client_name: 'Registered Regular',
    ...overrides,
  }
}

function mockScheduleApi(slots: unknown[] = [], sessions: unknown[] = []) {
  mockedApiGet.mockImplementation(async (url) => {
    if (url === '/cabinet/slots/') return slots as any
    if (url === '/booking/sessions/') return sessions as any
    throw new Error(`Unexpected apiGet call: ${url}`)
  })
}

describe('SlotsView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T10:00:00+02:00'))
    mockedApiGet.mockReset()
    mockedApiPost.mockReset()
    mockedCreateClientRegularTime.mockReset()
    mockedCreateClientRegularTime.mockResolvedValue({} as any)
    mockToast.success.mockReset()
    mockToast.info.mockReset()
    mockConfirmModal.openConfirm.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders schedule as a practice calendar with free-time copy', async () => {
    mockScheduleApi()

    const { container } = renderView()
    await flushAsyncUpdates()

    expect(screen.getByRole('heading', { name: 'Розклад' })).toBeInTheDocument()
    expect(screen.getByText('Тут ви бачите календар практики. Вільний час потрібен лише тоді, коли ви хочете дозволити клієнтам самостійно обирати час у публічному профілі.')).toBeInTheDocument()
    expect(screen.getByText('09.03.2026 - 15.03.2026')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Деталі вільного часу' })).toBeInTheDocument()
    expect(screen.getByText('Оберіть вільний час у календарі, щоб переглянути деталі або змінити його.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Додати вільний час' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Заповнити тиждень' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Швидкі дії' })).not.toBeInTheDocument()
    expect(screen.getByText('На цьому тижні ще немає вільного часу для прямого запису.')).toBeInTheDocument()
    expect(container.querySelector('.calendar-scroll')).toBeInTheDocument()
    expect(screen.queryByText(/слот/i)).not.toBeInTheDocument()
  })

  it('renders grouped session and availability actions', async () => {
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    expect(screen.getAllByText('Сесії').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Створити сесію' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Закріпити регулярний час' })).toBeInTheDocument()
    expect(screen.getByText('Вільний час для запису')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Додати вільний час' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Заповнити тиждень' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сесії' })).toBeInTheDocument()
  })

  it('opens regular sessions modal and loads selectable clients with usable record ids', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return []
      if (url === '/booking/sessions/') return []
      if (url === '/cabinet/client-records/') {
        return [
          manualClientRecord({ id: 71, display_name: 'Manual Regular' }),
          manualClientRecord({ id: 73, display_name: 'Archived Manual', status: 'archived', archived_at: '2026-03-01T00:00:00Z' }),
        ] as any
      }
      if (url === '/cabinet/clients/') {
        return [
          registeredClient({ id: 81, client_record_id: 72, client_display_name: 'Registered Regular' }),
          registeredClient({ id: 82, client_record_id: null, client_display_name: 'Inactive Without Record', state: 'INACTIVE' }),
          registeredClient({ id: 83, client_record_id: 74, client_display_name: 'Archived Registered', state: 'ARCHIVED' }),
        ] as any
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Закріпити регулярний час' }))
    await flushAsyncUpdates()

    expect(screen.getByRole('dialog', { name: 'Закріпити регулярний час' })).toBeInTheDocument()
    expect(screen.getByText('Оберіть клієнта, день і час. Майбутні сесії створяться автоматично на кілька тижнів наперед.')).toBeInTheDocument()
    const clientSelect = screen.getByLabelText('Клієнт') as HTMLSelectElement
    const optionText = Array.from(clientSelect.options).map((option) => option.textContent || '').join(' ')
    expect(optionText).toContain('Manual Regular')
    expect(optionText).toContain('Registered Regular')
    expect(optionText).not.toContain('Inactive Without Record')
    expect(optionText).not.toContain('Archived Manual')
    expect(optionText).not.toContain('Archived Registered')
    expect(container.querySelector('.regular-sessions-form')).toBeInTheDocument()
  })

  it('creates regular sessions through client regular time API and refreshes schedule', async () => {
    const sessionResponses = [
      [],
      [
        scheduleSession({
          id: 177,
          slot: null,
          slot_start_at: '2026-03-12T07:30:00Z',
          slot_end_at: '2026-03-12T08:15:00Z',
          client_display_name: 'Manual Regular',
          client_name: 'Manual Regular',
          client_record_id: 71,
        }),
      ],
    ]
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return []
      if (url === '/booking/sessions/') return (sessionResponses.shift() || sessionResponses[0] || []) as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [registeredClient({ id: 81, client_record_id: 72, client_display_name: 'Registered Regular' })] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Закріпити регулярний час' }))
    await flushAsyncUpdates()

    await fireEvent.update(screen.getByLabelText('Клієнт'), '71')
    await fireEvent.update(screen.getByLabelText('День тижня'), '3')
    await fireEvent.update(screen.getByLabelText('Час початку'), '09:30')
    await fireEvent.update(screen.getByLabelText('Тривалість регулярної сесії'), '45')
    await fireEvent.update(screen.getByLabelText('Частота'), 'every_two_weeks')
    await fireEvent.update(screen.getByLabelText('Формат зустрічі'), 'offline')
    await fireEvent.update(screen.getByLabelText('Місце зустрічі'), 'Кабінет 4')
    await fireEvent.click(screen.getByRole('button', { name: 'Додати' }))
    await flushAsyncUpdates()

    expect(mockedCreateClientRegularTime).toHaveBeenCalledWith(71, {
      weekday: 3,
      start_time: '09:30',
      duration_minutes: 45,
      frequency: 'every_two_weeks',
      starts_on: '2026-03-12',
      session_format: 'offline',
      meeting_url: '',
      offline_location: 'Кабінет 4',
    })
    expect(mockToast.success).toHaveBeenCalledWith('Регулярні сесії додано.')
    expect(screen.queryByRole('dialog', { name: 'Закріпити регулярний час' })).not.toBeInTheDocument()
    const sessionBlock = container.querySelector('.week-calendar .calendar-session') as HTMLElement | null
    expect(sessionBlock).toBeInTheDocument()
    expect(sessionBlock?.getAttribute('aria-label') || '').toContain('09:30')
    expect(sessionBlock?.getAttribute('aria-label') || '').toContain('10:15')
    expect(screen.getAllByText('Manual Regular').length).toBeGreaterThan(0)
  })

  it('shows regular time create errors without creating free Slot rows', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return []
      if (url === '/booking/sessions/') return []
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedCreateClientRegularTime.mockRejectedValueOnce({
      response: { data: { code: 'CLIENT_REGULAR_TIME_DUPLICATE' } },
    })

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Закріпити регулярний час' }))
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Додати' }))
    await flushAsyncUpdates()

    expect(screen.getByText('Такий регулярний час уже додано для цього клієнта.')).toBeInTheDocument()
    expect(mockedApiPost).not.toHaveBeenCalledWith('/cabinet/slots/', expect.anything())
  })

  it('opens one-off session modal and creates session via existing client-record endpoint', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') {
        return [
          {
            id: 91,
            start_at: '2026-03-12T09:00:00Z',
            end_at: '2026-03-12T09:50:00Z',
            is_booked: false,
          },
        ] as any
      }
      if (url === '/booking/sessions/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockResolvedValue({ id: 501 } as any)

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))
    await flushAsyncUpdates()

    expect(screen.getByRole('dialog', { name: 'Створити сесію' })).toBeInTheDocument()
    const clientSelect = await screen.findByLabelText('Клієнт')
    await fireEvent.update(clientSelect, '71')
    await fireEvent.update(await screen.findByLabelText('Вільний час'), '91')
    await fireEvent.update(await screen.findByLabelText('Формат зустрічі'), 'offline')
    const submitButtons = screen.getAllByRole('button', { name: 'Створити сесію' })
    await fireEvent.click(submitButtons[submitButtons.length - 1] as HTMLButtonElement)
    await flushAsyncUpdates()

    expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/client-records/71/sessions/', {
      slot_id: 91,
      session_format: 'offline',
    })
    expect(mockToast.success).toHaveBeenCalledWith('Сесію створено.')
  })

  it('shows session-only blocks when filter Сесії is selected', async () => {
    mockScheduleApi(
      [
        {
          id: 12,
          start_at: '2026-03-12T11:00:00Z',
          end_at: '2026-03-12T13:00:00Z',
          is_booked: false,
        },
      ],
      [
        scheduleSession({
          id: 601,
          slot_start_at: '2026-03-12T07:00:00Z',
          slot_end_at: '2026-03-12T07:50:00Z',
        }),
      ]
    )

    const { container } = renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Сесії' }))
    await flushAsyncUpdates()

    expect(container.querySelector('.week-calendar .calendar-session')).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot:not(.calendar-session)')).not.toBeInTheDocument()
  })

  it('renders slot/session summary with updated human copy', async () => {
    mockScheduleApi(
      [
        {
          id: 21,
          start_at: '2026-03-12T09:00:00Z',
          end_at: '2026-03-12T09:50:00Z',
          is_booked: false,
        },
        {
          id: 22,
          start_at: '2026-03-12T10:00:00Z',
          end_at: '2026-03-12T10:50:00Z',
          is_booked: true,
        },
      ],
      [scheduleSession({ id: 900, slot_start_at: '2026-03-12T12:00:00Z', slot_end_at: '2026-03-12T12:50:00Z' })]
    )

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByText('1 вільних вікон · 1 заброньованих · 1 сесія')).toBeInTheDocument()
  })

  it('renders duration-based free-time blocks without repeated visible status labels', async () => {
    mockScheduleApi([
      {
        id: 11,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
      {
        id: 12,
        start_at: '2026-03-12T11:00:00Z',
        end_at: '2026-03-12T13:00:00Z',
        is_booked: false,
      },
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    const shortBlock = container.querySelector('.week-calendar .calendar-slot[aria-label="Доступно 11:00–11:50"]') as HTMLButtonElement | null
    const longBlock = container.querySelector('.week-calendar .calendar-slot[aria-label="Доступно 13:00–15:00"]') as HTMLButtonElement | null

    expect(shortBlock).toBeInstanceOf(HTMLButtonElement)
    expect(longBlock).toBeInstanceOf(HTMLButtonElement)
    expect(shortBlock as HTMLButtonElement).toHaveAttribute('data-duration-minutes', '50')
    expect(longBlock as HTMLButtonElement).toHaveAttribute('data-duration-minutes', '120')
    expect(parseFloat((longBlock as HTMLButtonElement).style.height)).toBeGreaterThan(parseFloat((shortBlock as HTMLButtonElement).style.height))
    expect(container.querySelector('.calendar-slot__status')).not.toBeInTheDocument()
  })

  it('opens selected free-time details and keeps actions available', async () => {
    mockScheduleApi([
      {
        id: 2,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    const block = container.querySelector('.week-calendar .calendar-slot')
    expect(block).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.click(block as HTMLButtonElement)

    expect(screen.getByText('Деталі вільного часу')).toBeInTheDocument()
    expect(screen.getAllByText('11:00–11:50').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Редагувати вільний час' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Видалити вільний час' })).toBeEnabled()
  })

  it('renders booked free time without guessing a session route', async () => {
    mockScheduleApi([
      {
        id: 3,
        start_at: '2026-03-12T10:00:00Z',
        end_at: '2026-03-12T10:50:00Z',
        is_booked: true,
      },
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    const block = container.querySelector('.week-calendar .calendar-slot')
    expect(block).toHaveClass('slot-status--booked')
    await fireEvent.click(block as HTMLButtonElement)

    expect(screen.getByText('Цей вільний час уже заброньовано. Даних для переходу до сесії в поточному payload немає.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Редагувати вільний час' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Видалити вільний час' })).toBeDisabled()
  })

  it('renders no-slot session in the visible week without a matching Slot', async () => {
    mockScheduleApi([], [
      scheduleSession({
        id: 77,
        slot_start_at: '2026-03-12T07:00:00Z',
        slot_end_at: '2026-03-12T07:50:00Z',
      }),
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    const sessionBlock = container.querySelector('.week-calendar .calendar-session') as HTMLButtonElement | null
    expect(sessionBlock).toBeInstanceOf(HTMLButtonElement)
    expect(sessionBlock).toHaveAttribute('aria-label', 'Сесія · Саша Мальована · 09:00–09:50')
    expect(container.querySelectorAll('.week-calendar .calendar-slot:not(.calendar-session)')).toHaveLength(0)
    expect(screen.queryByText('На цьому тижні ще немає вільного часу для прямого запису.')).not.toBeInTheDocument()
  })

  it('opens no-slot session details with client name and session link', async () => {
    mockScheduleApi([], [
      scheduleSession({
        id: 78,
        slot_start_at: '2026-03-12T07:00:00Z',
        slot_end_at: '2026-03-12T07:50:00Z',
      }),
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    const sessionBlock = container.querySelector('.week-calendar .calendar-session') as HTMLButtonElement | null
    expect(sessionBlock).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.click(sessionBlock as HTMLButtonElement)

    expect(screen.getByText('Деталі сесії')).toBeInTheDocument()
    expect(screen.getAllByText('Саша Мальована')).toHaveLength(2)
    expect(screen.getAllByText('09:00–09:50')).toHaveLength(3)
    expect(screen.getByText('Заплановано')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute('href', '/cabinet/sessions/78')
  })

  it('does not render cancelled no-slot session as an active calendar block', async () => {
    mockScheduleApi([], [
      scheduleSession({
        id: 79,
        status: 'CANCELLED',
        slot_start_at: '2026-03-12T07:00:00Z',
        slot_end_at: '2026-03-12T07:50:00Z',
      }),
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    expect(container.querySelector('.week-calendar .calendar-session')).not.toBeInTheDocument()
    expect(screen.getByText('На цьому тижні ще немає вільного часу для прямого запису.')).toBeInTheDocument()
  })

  it('renders a no-slot session instead of a duplicate booked Slot when they overlap', async () => {
    mockScheduleApi([
      {
        id: 30,
        start_at: '2026-03-12T07:00:00Z',
        end_at: '2026-03-12T07:50:00Z',
        is_booked: true,
      },
    ], [
      scheduleSession({
        id: 80,
        slot_start_at: '2026-03-12T07:00:00Z',
        slot_end_at: '2026-03-12T07:50:00Z',
      }),
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    expect(container.querySelectorAll('.week-calendar .calendar-session')).toHaveLength(1)
    expect(container.querySelectorAll('.week-calendar .calendar-slot:not(.calendar-session)')).toHaveLength(0)
  })

  it('refetches sessions for the newly visible week', async () => {
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', {
      params: {
        date_from: '2026-03-09',
        date_to: '2026-03-15',
        status: 'SCHEDULED,CONFIRMED',
      },
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Наступний тиждень' }))
    await flushAsyncUpdates()

    expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', {
      params: {
        date_from: '2026-03-16',
        date_to: '2026-03-22',
        status: 'SCHEDULED,CONFIRMED',
      },
    })
  })

  it('shows Ukrainian date format and an overlay calendar in the add form', async () => {
    mockScheduleApi()

    const { container } = renderView()
    await flushAsyncUpdates()

    const { dateInput } = await openCreateForm(container)
    expect(screen.getByRole('heading', { name: 'Додати вільний час' })).toBeInTheDocument()
    expect(screen.getByText('Цей проміжок клієнти зможуть обрати для прямого запису у вашому публічному профілі.')).toBeInTheDocument()
    expect(screen.getByText('Дата')).toBeInTheDocument()
    expect(screen.getByText('Час початку')).toBeInTheDocument()
    expect(screen.getByText('Тривалість')).toBeInTheDocument()
    expect(dateInput).toHaveAttribute('type', 'text')
    expect(dateInput).toHaveAttribute('placeholder', 'дд.мм.рррр')
    expect(dateInput.value).toBe('12.03.2026')
    expect(screen.getByText('Буде доступно: 12.03.2026, 09:00–09:50')).toBeInTheDocument()
    expect(container.querySelector('input[type="date"]')).not.toBeInTheDocument()

    const calendarButton = container.querySelector('.slot-form .date-picker-trigger') as HTMLButtonElement | null
    expect(calendarButton).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.click(calendarButton as HTMLButtonElement)

    const dateShell = container.querySelector('.slot-form .date-input-shell') as HTMLElement | null
    const popover = container.querySelector('.slot-form .date-picker-popover') as HTMLElement | null
    expect(container.querySelector('.slot-form--create .slot-form__time-field')).toBeInTheDocument()
    expect(container.querySelector('.slot-form--create .slot-form__duration-field')).toBeInTheDocument()
    expect(container.querySelector('.slot-form--create .slot-form__actions')).toBeInTheDocument()
    expect(dateShell).toContainElement(popover)
    expect(screen.getByRole('button', { name: 'Додати' })).toBeInTheDocument()
  })

  it('submits manually typed Ukrainian date as ISO datetime', async () => {
    mockScheduleApi()
    mockedApiPost.mockResolvedValue({ detail: 'created' } as any)

    const { container } = renderView()
    await flushAsyncUpdates()

    const { dateInput, timeInput, durationInput, submitButton } = await openCreateForm(container)
    await fireEvent.update(dateInput, '15.05.2026')
    await fireEvent.update(timeInput, '09:30')
    await fireEvent.update(durationInput, '45')
    expect(screen.getByText('Буде доступно: 15.05.2026, 09:30–10:15')).toBeInTheDocument()
    await fireEvent.click(submitButton)
    await flushAsyncUpdates()

    expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/slots/', {
      start_at: new Date(2026, 4, 15, 9, 30, 0, 0).toISOString(),
      end_at: new Date(2026, 4, 15, 10, 15, 0, 0).toISOString(),
    })
  })

  it('updates add form date from the calendar picker', async () => {
    mockScheduleApi()
    mockedApiPost.mockResolvedValue({ detail: 'created' } as any)

    const { container } = renderView()
    await flushAsyncUpdates()

    const { dateInput, timeInput, durationInput, submitButton } = await openCreateForm(container)
    const calendarButton = container.querySelector('.slot-form .date-picker-trigger') as HTMLButtonElement | null
    expect(calendarButton).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.click(calendarButton as HTMLButtonElement)
    expect(screen.getByRole('dialog', { name: 'Календар вибору дати' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: '13.03.2026' }))

    expect(dateInput.value).toBe('13.03.2026')
    expect(screen.queryByRole('dialog', { name: 'Календар вибору дати' })).not.toBeInTheDocument()

    await fireEvent.update(timeInput, '09:30')
    await fireEvent.update(durationInput, '45')
    await fireEvent.click(submitButton)
    await flushAsyncUpdates()

    expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/slots/', {
      start_at: new Date(2026, 2, 13, 9, 30, 0, 0).toISOString(),
      end_at: new Date(2026, 2, 13, 10, 15, 0, 0).toISOString(),
    })
  })

  it('closes add form datepicker on outside click, Escape, cancel, and submit', async () => {
    mockScheduleApi()
    mockedApiPost.mockResolvedValue({ detail: 'created' } as any)

    const { container } = renderView()
    await flushAsyncUpdates()

    await openCreateForm(container)
    const calendarButton = container.querySelector('.slot-form .date-picker-trigger') as HTMLButtonElement | null
    expect(calendarButton).toBeInstanceOf(HTMLButtonElement)

    await fireEvent.click(calendarButton as HTMLButtonElement)
    expect(screen.getByRole('dialog', { name: 'Календар вибору дати' })).toBeInTheDocument()
    await fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('dialog', { name: 'Календар вибору дати' })).not.toBeInTheDocument()

    await fireEvent.click(calendarButton as HTMLButtonElement)
    expect(screen.getByRole('dialog', { name: 'Календар вибору дати' })).toBeInTheDocument()
    await fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Календар вибору дати' })).not.toBeInTheDocument()

    await fireEvent.click(calendarButton as HTMLButtonElement)
    expect(screen.getByRole('dialog', { name: 'Календар вибору дати' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }))
    expect(screen.queryByRole('dialog', { name: 'Календар вибору дати' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Додати вільний час' })).not.toBeInTheDocument()

    const {
      dateInput: nextDateInput,
      timeInput: nextTimeInput,
      durationInput: nextDurationInput,
      submitButton: nextSubmitButton,
    } = await openCreateForm(container)
    const nextCalendarButton = container.querySelector('.slot-form .date-picker-trigger') as HTMLButtonElement | null
    expect(nextCalendarButton).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.click(nextCalendarButton as HTMLButtonElement)
    expect(screen.getByRole('dialog', { name: 'Календар вибору дати' })).toBeInTheDocument()
    await fireEvent.update(nextDateInput, '15.05.2026')
    await fireEvent.update(nextTimeInput, '09:30')
    await fireEvent.update(nextDurationInput, '45')
    await fireEvent.click(nextSubmitButton)
    await flushAsyncUpdates()

    expect(screen.queryByRole('dialog', { name: 'Календар вибору дати' })).not.toBeInTheDocument()
  })

  it('updates add form preview when time or duration changes', async () => {
    mockScheduleApi()

    const { container } = renderView()
    await flushAsyncUpdates()

    const { dateInput, timeInput, durationInput } = await openCreateForm(container)
    await fireEvent.update(dateInput, '14.05.2026')
    await fireEvent.update(timeInput, '09:00')
    await fireEvent.update(durationInput, '50')
    expect(screen.getByText('Буде доступно: 14.05.2026, 09:00–09:50')).toBeInTheDocument()

    await fireEvent.update(timeInput, '10:15')
    expect(screen.getByText('Буде доступно: 14.05.2026, 10:15–11:05')).toBeInTheDocument()

    await fireEvent.update(durationInput, '30')
    expect(screen.getByText('Буде доступно: 14.05.2026, 10:15–10:45')).toBeInTheDocument()
  })

  it('does not submit malformed slash date input', async () => {
    mockScheduleApi()

    const { container } = renderView()
    await flushAsyncUpdates()

    const { dateInput, timeInput, durationInput, submitButton } = await openCreateForm(container)
    await fireEvent.update(dateInput, '05/15/2026')
    await fireEvent.update(timeInput, '09:30')
    await fireEvent.update(durationInput, '45')
    await fireEvent.click(submitButton)
    await flushAsyncUpdates()

    expect(mockedApiPost).not.toHaveBeenCalled()
    expect(screen.getByText('Вкажіть дату, час і тривалість у хвилинах.')).toBeInTheDocument()
  })

  it('fills the currently visible selected week only after confirmation', async () => {
    mockScheduleApi()
    mockedApiPost.mockResolvedValue({ ok: true } as any)

    renderView()
    await flushAsyncUpdates()

    for (let index = 0; index < 11; index += 1) {
      await fireEvent.click(screen.getByRole('button', { name: 'Наступний тиждень' }))
    }
    expect(screen.getByText('25.05.2026 - 31.05.2026')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Заповнити тиждень' }))
    await flushAsyncUpdates()

    expect(mockedApiPost).not.toHaveBeenCalled()
    expect(mockConfirmModal.openConfirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Заповнити тиждень вільним часом?',
      confirmText: 'Заповнити тиждень',
      cancelText: 'Скасувати',
    }))
    const confirmOptions = mockConfirmModal.openConfirm.mock.calls.at(-1)?.[0]
    expect(confirmOptions?.message).toContain('Система створить вільний час для прямого запису на основі ваших робочих годин. Клієнти зможуть обрати ці проміжки у публічному профілі.')
    expect(confirmOptions?.message).toContain('Період: 25.05.2026–31.05.2026')
    expect(confirmOptions?.message).toContain('Існуючі сесії та записи не буде змінено.')
    expect(confirmOptions?.message).not.toContain('Минулі години не додаються.')

    mockConfirmModal.closeConfirm()
    expect(mockedApiPost).not.toHaveBeenCalled()

    await confirmOptions?.onConfirm?.()
    await flushAsyncUpdates()

    expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/slots/fill-week/', {
      date: '2026-05-25',
    })
  })

  it('navigates calendar weeks and returns to today', async () => {
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    await fireEvent.click(screen.getByRole('button', { name: 'Наступний тиждень' }))
    expect(screen.getByText('16.03.2026 - 22.03.2026')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Попередній тиждень' }))
    expect(screen.getByText('09.03.2026 - 15.03.2026')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Сьогодні' }))
    expect(screen.getByText('09.03.2026 - 15.03.2026')).toBeInTheDocument()
  })

  it('updates edit date from the calendar picker', async () => {
    mockScheduleApi([
      {
        id: 2,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    const block = container.querySelector('.week-calendar .calendar-slot')
    expect(block).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.click(block as HTMLButtonElement)
    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати вільний час' }))

    const editDateInput = screen.getByLabelText('Дата початку редагованого вільного часу') as HTMLInputElement
    const editCalendarButton = container.querySelector('.slot-card__edit .date-picker-trigger') as HTMLButtonElement | null
    expect(editCalendarButton).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.click(editCalendarButton as HTMLButtonElement)
    await fireEvent.click(screen.getByRole('button', { name: '13.03.2026' }))

    expect(editDateInput.value).toBe('13.03.2026')
  })

  it('reloads the current free-time list and shows success feedback after create', async () => {
    const slotResponses = [
      [],
      [
        {
          id: 5,
          start_at: '2026-03-12T09:10:00Z',
          end_at: '2026-03-12T09:40:00Z',
          is_booked: false,
        },
      ],
    ]
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return (slotResponses.shift() || slotResponses[0] || []) as any
      if (url === '/booking/sessions/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockResolvedValue({
      detail: 'created',
    } as any)

    const { container } = renderView()
    await flushAsyncUpdates()

    const { dateInput, timeInput, durationInput, submitButton } = await openCreateForm(container)
    await fireEvent.update(dateInput, '12.03.2026')
    await fireEvent.update(timeInput, '11:10')
    await fireEvent.update(durationInput, '30')
    await fireEvent.click(submitButton)
    await flushAsyncUpdates()

    expect(mockedApiGet).toHaveBeenCalledTimes(4)
    expect(screen.getAllByText('11:10–11:40').length).toBeGreaterThan(0)
    expect(mockToast.success).toHaveBeenCalledWith('Вільне вікно на 12.03.2026, 11:10 створено.')
  })
})
