import { fireEvent, render, screen, within } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiDelete,
  apiGet,
  apiPost,
  createClientRegularTime,
  fetchSpecialistProfile,
  getCabinetSchedule,
  updateSpecialistProfile,
} from '../lib/api'
import SlotsView from './SlotsView.vue'

const mockRoute = {
  path: '/cabinet/slots',
  query: {} as Record<string, unknown>,
}

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
  fetchSpecialistProfile: vi.fn(),
  getCabinetSchedule: vi.fn(),
  updateSpecialistProfile: vi.fn(),
  getApiErrorMessage: vi.fn((err: any, fallback: string) => err?.message || fallback),
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRoute: () => mockRoute,
  }
})

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../composables/useConfirmModal', () => ({
  useConfirmModal: () => mockConfirmModal,
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiDelete = vi.mocked(apiDelete)
const mockedApiPost = vi.mocked(apiPost)
const mockedCreateClientRegularTime = vi.mocked(createClientRegularTime)
const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)
const mockedGetCabinetSchedule = vi.mocked(getCabinetSchedule)
const mockedUpdateSpecialistProfile = vi.mocked(updateSpecialistProfile)

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
  await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
  await flushAsyncUpdates()
  const addButton = screen.getByRole('button', { name: 'Додати вільний час' })
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

function scheduleEventFromSlot(slot: Record<string, any>) {
  return {
    type: slot.is_booked ? 'booked_slot' : 'available_slot',
    id: `${slot.is_booked ? 'booked-slot' : 'available-slot'}-${slot.id}`,
    slot_id: slot.id ?? null,
    session_id: slot.session_id ?? null,
    start_at: slot.start_at,
    end_at: slot.end_at,
    status: slot.is_booked ? 'booked' : 'available',
    title: slot.is_booked ? 'Заброньовано' : 'Вільний час',
    client_display_name: slot.client_display_name ?? null,
    client_kind: slot.client_kind ?? null,
  }
}

function scheduleEventFromSession(session: Record<string, any>) {
  return {
    type: 'session',
    id: `session-${session.id}`,
    slot_id: session.slot ?? null,
    session_id: session.id,
    start_at: session.start_at ?? session.slot_start_at,
    end_at: session.end_at ?? session.slot_end_at,
    status: session.status ?? 'SCHEDULED',
    title: 'Сесія',
    client_display_name: session.client_display_name ?? session.client_name ?? null,
    client_kind: session.client_kind ?? 'registered',
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

function mockScheduleApi(slots: unknown[] = [], sessions: unknown[] = [], scheduleEvents?: unknown[]) {
  mockedApiGet.mockImplementation(async (url) => {
    if (url === '/cabinet/slots/') return slots as any
    throw new Error(`Unexpected apiGet call: ${url}`)
  })
  mockedGetCabinetSchedule.mockResolvedValue({
    events: (scheduleEvents || [
      ...(slots as Record<string, any>[]).map(scheduleEventFromSlot),
      ...(sessions as Record<string, any>[]).map(scheduleEventFromSession),
    ]) as any,
  })
}

function openCalendarRoute() {
  mockRoute.path = '/cabinet/schedule'
  mockRoute.query = {}
}

function openAvailabilityRoute(query: Record<string, unknown> = { tab: 'availability' }) {
  mockRoute.path = '/cabinet/slots'
  mockRoute.query = query
}

describe('SlotsView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T10:00:00+02:00'))
    mockRoute.path = '/cabinet/slots'
    mockRoute.query = {}
    mockedApiGet.mockReset()
    mockedApiDelete.mockReset()
    mockedApiPost.mockReset()
    mockedCreateClientRegularTime.mockReset()
    mockedFetchSpecialistProfile.mockReset()
    mockedGetCabinetSchedule.mockReset()
    mockedUpdateSpecialistProfile.mockReset()
    mockedGetCabinetSchedule.mockResolvedValue({ events: [] })
    mockedCreateClientRegularTime.mockResolvedValue({} as any)
    mockedFetchSpecialistProfile.mockResolvedValue({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kyiv',
      public_booking_mode: 'request_only',
      show_public_availability: false,
      public_booking_min_lead_time_hours: 24,
      public_booking_horizon_days: 14,
      public_booking_requires_confirmation: true,
    } as any)
    mockedUpdateSpecialistProfile.mockResolvedValue({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kyiv',
      public_booking_mode: 'request_only',
      show_public_availability: false,
      public_booking_min_lead_time_hours: 24,
      public_booking_horizon_days: 14,
      public_booking_requires_confirmation: true,
    } as any)
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.info.mockReset()
    mockToast.warning.mockReset()
    mockConfirmModal.openConfirm.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders schedule as a practice calendar with free-time copy', async () => {
    openCalendarRoute()
    mockScheduleApi()

    const { container } = renderView()
    await flushAsyncUpdates()
    expect(screen.getByRole('tab', { name: 'Календар' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Календар' })).toHaveAttribute('href', '/cabinet/schedule')
    expect(screen.getByText('09.03.2026 - 15.03.2026')).toBeInTheDocument()
    expect(mockedGetCabinetSchedule).toHaveBeenCalledWith('2026-03-09', '2026-03-15')
    expect(screen.getByRole('heading', { name: 'Деталі події' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Створити сесію' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Додати вільний час' })).not.toBeInTheDocument()
    expect(screen.getAllByText('На цьому тижні ще немає подій у розкладі.').length).toBeGreaterThan(0)
    expect(container.querySelector('.calendar-scroll')).toBeInTheDocument()
  })

  it('opens availability tab from route query', async () => {
    mockRoute.query = { tab: 'availability' }
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByRole('tab', { name: 'Вільний час для запису' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'Додати вільний час' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Створити сесію' })).not.toBeInTheDocument()
  })

  it('opens calendar tab from schedule route and slots tab query', async () => {
    openCalendarRoute()
    mockScheduleApi()

    const { unmount } = renderView()
    await flushAsyncUpdates()
    expect(screen.getByRole('tab', { name: 'Календар' })).toHaveAttribute('aria-selected', 'true')
    unmount()

    openAvailabilityRoute({ tab: 'calendar' })
    renderView()
    await flushAsyncUpdates()
    expect(screen.getByRole('tab', { name: 'Календар' })).toHaveAttribute('aria-selected', 'true')
  })

  it('keeps calendar tab as default when slots tab query is missing or unknown', async () => {
    mockScheduleApi()

    openAvailabilityRoute({})
    const { unmount } = renderView()
    await flushAsyncUpdates()
    expect(screen.getByRole('tab', { name: 'Календар' })).toHaveAttribute('aria-selected', 'true')
    unmount()

    openAvailabilityRoute({ tab: 'something-else' })
    renderView()
    await flushAsyncUpdates()
    expect(screen.getByRole('tab', { name: 'Календар' })).toHaveAttribute('aria-selected', 'true')
  })

  it('opens settings tab from route query', async () => {
    openAvailabilityRoute({ tab: 'settings' })
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByRole('tab', { name: 'Налаштування' })).toHaveAttribute('aria-selected', 'true')
  })

  it('reloads schedule events when availability auto-jump changes the visible week', async () => {
    openCalendarRoute()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') {
        return [
          {
            id: 701,
            start_at: '2026-03-16T08:00:00Z',
            end_at: '2026-03-16T08:50:00Z',
            is_booked: false,
          },
        ] as any
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedGetCabinetSchedule.mockImplementation(async (dateFrom, dateTo) => {
      if (dateFrom === '2026-03-09' && dateTo === '2026-03-15') {
        return {
          events: [
            scheduleEventFromSession(
              scheduleSession({
                id: 901,
                slot_start_at: '2026-03-12T07:00:00Z',
                slot_end_at: '2026-03-12T07:50:00Z',
                client_display_name: 'Old Week Client',
              }) as any
            ),
          ],
        } as any
      }
      if (dateFrom === '2026-03-16' && dateTo === '2026-03-22') {
        return {
          events: [
            scheduleEventFromSession(
              scheduleSession({
                id: 902,
                slot_start_at: '2026-03-17T08:00:00Z',
                slot_end_at: '2026-03-17T08:50:00Z',
                client_display_name: 'Visible Week Client',
              }) as any
            ),
          ],
        } as any
      }
      return { events: [] } as any
    })

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByText('16.03.2026 - 22.03.2026')).toBeInTheDocument()
    expect(mockedGetCabinetSchedule).toHaveBeenCalledWith('2026-03-09', '2026-03-15')
    expect(mockedGetCabinetSchedule).toHaveBeenCalledWith('2026-03-16', '2026-03-22')
    await flushAsyncUpdates()
    expect(screen.queryByText('Old Week Client')).not.toBeInTheDocument()
    expect(screen.getAllByText('Visible Week Client').length).toBeGreaterThan(0)
  })

  it('keeps existing internal tab switching behavior', async () => {
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()
    expect(screen.getByRole('tab', { name: 'Вільний час для запису' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'Додати вільний час' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('tab', { name: 'Календар' }))
    await flushAsyncUpdates()
    expect(screen.getByRole('tab', { name: 'Календар' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'Створити сесію' })).toBeInTheDocument()
  })

  it('renders grouped session and availability actions', async () => {
    openCalendarRoute()
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()
    expect(screen.getByRole('button', { name: 'Створити сесію' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Закріпити регулярний час' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Додати вільний час' })).not.toBeInTheDocument()
    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()
    expect(screen.getByRole('button', { name: 'Додати вільний час' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Заповнити тиждень' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Створити сесію' })).not.toBeInTheDocument()
  })

  it('renders public booking settings in settings tab with profile values', async () => {
    mockedFetchSpecialistProfile.mockResolvedValueOnce({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kyiv',
      public_booking_mode: 'direct_booking',
      show_public_availability: true,
      public_booking_min_lead_time_hours: 48,
      public_booking_horizon_days: 30,
      public_booking_requires_confirmation: false,
    } as any)
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    await fireEvent.click(screen.getByRole('tab', { name: 'Налаштування' }))
    await flushAsyncUpdates()

    expect(screen.getByRole('heading', { name: 'Публічний запис' })).toBeInTheDocument()
    expect((screen.getByLabelText('Режим запису') as HTMLSelectElement).value).toBe('direct_booking')
    expect((screen.getByLabelText('Показувати вільний час у публічному профілі') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('Мінімальний час до бронювання') as HTMLSelectElement).value).toBe('48')
    expect((screen.getByLabelText('Показувати вільний час наперед') as HTMLSelectElement).value).toBe('30')
    expect((screen.getByLabelText('Підтвердження спеціаліста') as HTMLSelectElement).value).toBe('auto')
  })

  it('saves public booking settings with expected profile patch payload', async () => {
    mockScheduleApi()
    mockedUpdateSpecialistProfile.mockResolvedValueOnce({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kyiv',
      public_booking_mode: 'direct_booking',
      show_public_availability: true,
      public_booking_min_lead_time_hours: 72,
      public_booking_horizon_days: 7,
      public_booking_requires_confirmation: false,
    } as any)

    renderView()
    await flushAsyncUpdates()

    await fireEvent.click(screen.getByRole('tab', { name: 'Налаштування' }))
    await flushAsyncUpdates()

    await fireEvent.update(screen.getByLabelText('Режим запису'), 'direct_booking')
    await fireEvent.click(screen.getByLabelText('Показувати вільний час у публічному профілі'))
    await fireEvent.update(screen.getByLabelText('Мінімальний час до бронювання'), '72')
    await fireEvent.update(screen.getByLabelText('Показувати вільний час наперед'), '7')
    await fireEvent.update(screen.getByLabelText('Підтвердження спеціаліста'), 'auto')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти налаштування' }))
    await flushAsyncUpdates()

    expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith({
      public_booking_mode: 'direct_booking',
      show_public_availability: true,
      public_booking_min_lead_time_hours: 72,
      public_booking_horizon_days: 7,
      public_booking_requires_confirmation: false,
    })
    expect(mockToast.success).toHaveBeenCalledWith('Налаштування публічного запису збережено.')
  })

  it('disables public availability toggle in request-only mode', async () => {
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('tab', { name: 'Налаштування' }))
    await flushAsyncUpdates()

    expect((screen.getByLabelText('Режим запису') as HTMLSelectElement).value).toBe('request_only')
    expect((screen.getByLabelText('Показувати вільний час у публічному профілі') as HTMLInputElement).disabled).toBe(true)
  })

  it('updates availability helper copy according to public booking settings', async () => {
    mockedFetchSpecialistProfile.mockResolvedValueOnce({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kyiv',
      public_booking_mode: 'request_only',
      show_public_availability: false,
      public_booking_min_lead_time_hours: 24,
      public_booking_horizon_days: 14,
      public_booking_requires_confirmation: true,
    } as any)
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()
    expect(
      screen.getByText('Клієнти бачать ці вікна лише коли прямий запис увімкнено.')
    ).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('tab', { name: 'Налаштування' }))
    await flushAsyncUpdates()
    await fireEvent.update(screen.getByLabelText('Режим запису'), 'direct_booking')
    await fireEvent.click(screen.getByLabelText('Показувати вільний час у публічному профілі'))
    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()
    expect(
      screen.getByText('Клієнти бачать ці вікна у публічному профілі.')
    ).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('tab', { name: 'Налаштування' }))
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByLabelText('Показувати вільний час у публічному профілі'))
    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()
    expect(
      screen.getByText('Показ вільного часу вимкнено у публічному профілі.')
    ).toBeInTheDocument()
  })

  it('opens regular sessions modal and loads selectable clients with usable record ids', async () => {
    openCalendarRoute()
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
    openCalendarRoute()
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
    mockedGetCabinetSchedule
      .mockResolvedValueOnce({ events: [] })
      .mockResolvedValueOnce({
        events: sessionResponses[1]!.map((session) => scheduleEventFromSession(session as any)) as any,
      })
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return []
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
    openCalendarRoute()
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

  it('opens one-off session modal and creates no-slot session via client-record endpoint', async () => {
    openCalendarRoute()
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
    expect(screen.queryByLabelText('Вільний час')).not.toBeInTheDocument()
    await fireEvent.update(await screen.findByLabelText('Дата'), '13.03.2026')
    await fireEvent.update(await screen.findByLabelText('Час початку'), '14:00')
    await fireEvent.update(await screen.findByLabelText('Тривалість'), '50')
    await fireEvent.update(await screen.findByLabelText('Формат зустрічі'), 'offline')
    const submitButtons = screen.getAllByRole('button', { name: 'Створити сесію' })
    await fireEvent.click(submitButtons[submitButtons.length - 1] as HTMLButtonElement)
    await flushAsyncUpdates()

    const createCall = mockedApiPost.mock.calls.find(
      (call) => call[0] === '/cabinet/client-records/71/sessions/'
    )
    expect(createCall).toBeTruthy()
    const payload = (createCall?.[1] || {}) as Record<string, unknown>
    expect(payload.session_format).toBe('offline')
    expect(payload.timezone).toBe('Europe/Kyiv')
    expect(payload.meeting_url).toBe('')
    expect(payload.offline_location).toBe('')
    expect(typeof payload.starts_at).toBe('string')
    expect(typeof payload.ends_at).toBe('string')
    expect(payload).not.toHaveProperty('slot_id')
    expect(mockToast.success).toHaveBeenCalledWith('Сесію створено.')
    expect(screen.queryByRole('dialog', { name: 'Створити сесію' })).not.toBeInTheDocument()
  })

  it('opens one-off session modal from empty calendar cell with clicked date and start time', async () => {
    openCalendarRoute()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedGetCabinetSchedule.mockResolvedValue({ events: [] })

    const { container } = renderView()
    await flushAsyncUpdates()

    const hitAreas = container.querySelectorAll('.calendar-empty-hit-area')
    const fridayHitArea = hitAreas[4] as HTMLElement
    fridayHitArea.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 650,
      width: 100,
      height: 650,
      toJSON: () => {},
    })
    await fireEvent.click(fridayHitArea, { clientY: 100 })
    await flushAsyncUpdates()

    expect(screen.getByRole('dialog', { name: 'Створити сесію' })).toBeInTheDocument()
    expect((screen.getByLabelText('Дата') as HTMLInputElement).value).toBe('13.03.2026')
    expect((screen.getByLabelText('Час початку') as HTMLInputElement).value).toBe('10:00')
  })

  it('does not open create modal when clicking existing calendar events', async () => {
    openCalendarRoute()
    mockScheduleApi([], [], [
      scheduleEventFromSession(
        scheduleSession({
          id: 701,
          slot_start_at: '2026-03-12T08:00:00Z',
          slot_end_at: '2026-03-12T08:50:00Z',
          client_display_name: 'Session Client',
        })
      ),
      scheduleEventFromSlot({
        id: 702,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: true,
        session_id: 902,
        client_display_name: 'Booked Client',
      }),
      scheduleEventFromSlot({
        id: 703,
        start_at: '2026-03-12T10:00:00Z',
        end_at: '2026-03-12T10:50:00Z',
        is_booked: false,
      }),
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    const eventButtons = Array.from(container.querySelectorAll('.week-calendar .schedule-event')) as HTMLElement[]
    expect(eventButtons).toHaveLength(3)
    for (const eventButton of eventButtons) {
      await fireEvent.click(eventButton)
      await flushAsyncUpdates()
      expect(screen.queryByRole('dialog', { name: 'Створити сесію' })).not.toBeInTheDocument()
    }
  })

  it('reloads visible schedule after successful one-off session created from calendar click', async () => {
    openCalendarRoute()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedGetCabinetSchedule
      .mockResolvedValueOnce({ events: [] })
      .mockResolvedValueOnce({
        events: [
          scheduleEventFromSession(
            scheduleSession({
              id: 704,
              slot_start_at: '2026-03-12T08:00:00Z',
              slot_end_at: '2026-03-12T08:50:00Z',
              client_display_name: 'Manual Regular',
            })
          ),
        ] as any,
      })
    mockedApiPost.mockResolvedValue({ id: 704 } as any)

    const { container } = renderView()
    await flushAsyncUpdates()

    const hitAreas = container.querySelectorAll('.calendar-empty-hit-area')
    const fridayHitArea = hitAreas[4] as HTMLElement
    fridayHitArea.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 650,
      width: 100,
      height: 650,
      toJSON: () => {},
    })
    await fireEvent.click(fridayHitArea, { clientY: 0 })
    await flushAsyncUpdates()
    await fireEvent.update(await screen.findByLabelText('Клієнт'), '71')
    const submitButtons = screen.getAllByRole('button', { name: 'Створити сесію' })
    await fireEvent.click(submitButtons[submitButtons.length - 1] as HTMLButtonElement)
    await flushAsyncUpdates()

    expect(mockedGetCabinetSchedule).toHaveBeenCalledTimes(2)
    expect(mockedGetCabinetSchedule).toHaveBeenLastCalledWith('2026-03-09', '2026-03-15')
    expect(screen.queryByRole('dialog', { name: 'Створити сесію' })).not.toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-session')).toBeInTheDocument()
  })

  it('keeps calendar state safe when one-off calendar-click create hits a conflict', async () => {
    openCalendarRoute()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedGetCabinetSchedule.mockResolvedValue({ events: [] })
    mockedApiPost.mockRejectedValueOnce({
      response: { data: { code: 'MANUAL_SESSION_TIME_CONFLICT' } },
    })

    const { container } = renderView()
    await flushAsyncUpdates()

    const hitAreas = container.querySelectorAll('.calendar-empty-hit-area')
    const fridayHitArea = hitAreas[4] as HTMLElement
    fridayHitArea.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 650,
      width: 100,
      height: 650,
      toJSON: () => {},
    })
    await fireEvent.click(fridayHitArea, { clientY: 0 })
    await flushAsyncUpdates()
    await fireEvent.update(await screen.findByLabelText('Клієнт'), '71')
    const submitButtons = screen.getAllByRole('button', { name: 'Створити сесію' })
    await fireEvent.click(submitButtons[submitButtons.length - 1] as HTMLButtonElement)
    await flushAsyncUpdates()

    expect(
      screen.getByText(
        'Не вдалося створити сесію: цей час перетинається з іншою сесією або недоступністю.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Створити сесію' })).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-session')).not.toBeInTheDocument()
    expect(mockedGetCabinetSchedule).toHaveBeenCalledTimes(1)
  })

  it('keeps modal closed when schedule refresh fails after successful one-off create', async () => {
    openCalendarRoute()
    let slotsCallCount = 0
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') {
        slotsCallCount += 1
        if (slotsCallCount >= 2) {
          throw new Error('refresh failed')
        }
        return [] as any
      }
      if (url === '/booking/sessions/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockResolvedValue({ id: 503 } as any)

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))
    await flushAsyncUpdates()

    await fireEvent.update(await screen.findByLabelText('Клієнт'), '71')
    await fireEvent.update(await screen.findByLabelText('Дата'), '13.03.2026')
    await fireEvent.update(await screen.findByLabelText('Час початку'), '14:00')
    await fireEvent.update(await screen.findByLabelText('Тривалість'), '50')
    const submitButtons = screen.getAllByRole('button', { name: 'Створити сесію' })
    await fireEvent.click(submitButtons[submitButtons.length - 1] as HTMLButtonElement)
    await flushAsyncUpdates()

    expect(mockToast.success).toHaveBeenCalledWith('Сесію створено.')
    expect(screen.queryByRole('dialog', { name: 'Створити сесію' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('normalizes Europe/Kiev timezone alias to Europe/Kyiv in one-off session payload', async () => {
    openCalendarRoute()
    mockedFetchSpecialistProfile.mockResolvedValueOnce({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kiev',
    } as any)
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return [] as any
      if (url === '/booking/sessions/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockResolvedValue({ id: 502 } as any)

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))
    await flushAsyncUpdates()

    await fireEvent.update(await screen.findByLabelText('Клієнт'), '71')
    await fireEvent.update(await screen.findByLabelText('Дата'), '13.03.2026')
    await fireEvent.update(await screen.findByLabelText('Час початку'), '14:00')
    await fireEvent.update(await screen.findByLabelText('Тривалість'), '50')
    const submitButtons = screen.getAllByRole('button', { name: 'Створити сесію' })
    await fireEvent.click(submitButtons[submitButtons.length - 1] as HTMLButtonElement)
    await flushAsyncUpdates()

    const createCall = mockedApiPost.mock.calls.find(
      (call) => call[0] === '/cabinet/client-records/71/sessions/'
    )
    expect(createCall).toBeTruthy()
    const payload = (createCall?.[1] || {}) as Record<string, unknown>
    expect(payload.timezone).toBe('Europe/Kyiv')
  })

  it('shows friendly conflict copy for one-off no-slot session create', async () => {
    openCalendarRoute()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return [] as any
      if (url === '/booking/sessions/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockRejectedValueOnce({
      response: { data: { code: 'MANUAL_SESSION_TIME_CONFLICT' } },
    })

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))
    await flushAsyncUpdates()

    await fireEvent.update(await screen.findByLabelText('Клієнт'), '71')
    await fireEvent.update(await screen.findByLabelText('Дата'), '13.03.2026')
    await fireEvent.update(await screen.findByLabelText('Час початку'), '14:00')
    await fireEvent.update(await screen.findByLabelText('Тривалість'), '50')
    const submitButtons = screen.getAllByRole('button', { name: 'Створити сесію' })
    await fireEvent.click(submitButtons[submitButtons.length - 1] as HTMLButtonElement)
    await flushAsyncUpdates()

    expect(
      screen.getByText(
        'Не вдалося створити сесію: цей час перетинається з іншою сесією або недоступністю.'
      )
    ).toBeInTheDocument()
    const dialog = screen.getByRole('dialog', { name: 'Створити сесію' })
    const alert = within(dialog).getByRole('alert')
    const firstField = within(dialog).getByLabelText('Клієнт')
    expect(alert.compareDocumentPosition(firstField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('dialog', { name: 'Створити сесію' })).toBeInTheDocument()
  })

  it('blocks one-off session create when selected time is in the past', async () => {
    openCalendarRoute()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return [] as any
      if (url === '/booking/sessions/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))
    await flushAsyncUpdates()

    await fireEvent.update(await screen.findByLabelText('Клієнт'), '71')
    await fireEvent.update(await screen.findByLabelText('Дата'), '01.01.2000')
    await fireEvent.update(await screen.findByLabelText('Час початку'), '14:00')
    await fireEvent.update(await screen.findByLabelText('Тривалість'), '50')
    const submitButtons = screen.getAllByRole('button', { name: 'Створити сесію' })
    await fireEvent.click(submitButtons[submitButtons.length - 1] as HTMLButtonElement)
    await flushAsyncUpdates()

    expect(
      screen.getByText('Неможливо створити сесію в минулому. Оберіть майбутню дату або час.')
    ).toBeInTheDocument()
    expect(
      mockedApiPost.mock.calls.some((call) => call[0] === '/cabinet/client-records/71/sessions/')
    ).toBe(false)
    expect(screen.queryByText(/detail:/i)).not.toBeInTheDocument()
  })

  it('localizes backend past-time detail for one-off session create', async () => {
    openCalendarRoute()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return [] as any
      if (url === '/booking/sessions/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Session time is in the past.',
        },
      },
    })

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))
    await flushAsyncUpdates()

    await fireEvent.update(await screen.findByLabelText('Клієнт'), '71')
    await fireEvent.update(await screen.findByLabelText('Дата'), '13.03.2099')
    await fireEvent.update(await screen.findByLabelText('Час початку'), '14:00')
    await fireEvent.update(await screen.findByLabelText('Тривалість'), '50')
    const submitButtons = screen.getAllByRole('button', { name: 'Створити сесію' })
    await fireEvent.click(submitButtons[submitButtons.length - 1] as HTMLButtonElement)
    await flushAsyncUpdates()

    expect(
      screen.getByText('Неможливо створити сесію в минулому. Оберіть майбутню дату або час.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/Session time is in the past/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/detail:/i)).not.toBeInTheDocument()
  })

  it('shows friendly timezone copy when backend returns Invalid timezone', async () => {
    openCalendarRoute()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return [] as any
      if (url === '/booking/sessions/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockRejectedValueOnce({
      response: { data: { detail: ['Invalid timezone.'] } },
    })

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))
    await flushAsyncUpdates()

    await fireEvent.update(await screen.findByLabelText('Клієнт'), '71')
    await fireEvent.update(await screen.findByLabelText('Дата'), '13.03.2026')
    await fireEvent.update(await screen.findByLabelText('Час початку'), '14:00')
    await fireEvent.update(await screen.findByLabelText('Тривалість'), '50')
    const submitButtons = screen.getAllByRole('button', { name: 'Створити сесію' })
    await fireEvent.click(submitButtons[submitButtons.length - 1] as HTMLButtonElement)
    await flushAsyncUpdates()

    expect(
      screen.getByText(
        'Не вдалося створити сесію: некоректний часовий пояс. Оновіть сторінку або перевірте налаштування профілю.'
      )
    ).toBeInTheDocument()
  })

  it('shows session-only blocks when filter Сесії is selected', async () => {
    openCalendarRoute()
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

  it('renders unified schedule event filters without private client contact data', async () => {
    openCalendarRoute()
    mockScheduleApi([], [], [
      {
        type: 'available_slot',
        id: 'available-slot-91',
        slot_id: 91,
        session_id: null,
        start_at: '2026-03-12T07:00:00Z',
        end_at: '2026-03-12T07:50:00Z',
        status: 'available',
        title: 'Вільний час',
        client_display_name: null,
        client_kind: null,
      },
      {
        type: 'booked_slot',
        id: 'booked-slot-92',
        slot_id: 92,
        session_id: 502,
        start_at: '2026-03-12T08:00:00Z',
        end_at: '2026-03-12T08:50:00Z',
        status: 'booked',
        title: 'Заброньовано',
        client_display_name: 'Гостьовий клієнт',
        client_kind: 'guest',
        client_email: 'guest@example.com',
        client_phone: '+380991112233',
      },
      {
        type: 'session',
        id: 'session-503',
        slot_id: null,
        session_id: 503,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        status: 'SCHEDULED',
        title: 'Сесія',
        client_display_name: 'Олена',
        client_kind: 'registered',
        client_email: 'olena@example.com',
      },
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    expect(container.querySelectorAll('.week-calendar .schedule-event')).toHaveLength(3)
    expect(screen.queryByText('guest@example.com')).not.toBeInTheDocument()
    expect(screen.queryByText('+380991112233')).not.toBeInTheDocument()
    expect(screen.queryByText('olena@example.com')).not.toBeInTheDocument()

    const mobileSchedule = container.querySelector('.mobile-day-schedule') as HTMLElement | null
    expect(mobileSchedule).toBeInstanceOf(HTMLElement)
    expect(within(mobileSchedule as HTMLElement).getByText('Події тижня')).toBeInTheDocument()
    expect((mobileSchedule as HTMLElement).querySelectorAll('.mobile-schedule-event')).toHaveLength(3)
    expect(within(mobileSchedule as HTMLElement).getAllByText(/Вільний час/).length).toBeGreaterThan(0)
    expect(within(mobileSchedule as HTMLElement).getAllByText(/Сесія/).length).toBeGreaterThan(0)
    expect(within(mobileSchedule as HTMLElement).getAllByText(/Заброньовано/).length).toBeGreaterThan(0)
    expect(within(mobileSchedule as HTMLElement).queryByRole('link', { name: 'Відкрити сесію' })).not.toBeInTheDocument()
    const availableMobileEvent = (mobileSchedule as HTMLElement).querySelector(
      '.mobile-schedule-event.schedule-event--available'
    ) as HTMLElement | null
    const bookedMobileEvent = (mobileSchedule as HTMLElement).querySelector(
      '.mobile-schedule-event.schedule-event--booked'
    ) as HTMLElement | null
    const sessionMobileEvent = (mobileSchedule as HTMLElement).querySelector(
      '.mobile-schedule-event.calendar-session'
    ) as HTMLElement | null
    expect(availableMobileEvent).toBeInstanceOf(HTMLElement)
    expect(bookedMobileEvent).toBeInstanceOf(HTMLElement)
    expect(sessionMobileEvent).toBeInstanceOf(HTMLElement)

    await fireEvent.click(within(availableMobileEvent as HTMLElement).getByRole('button'))
    await flushAsyncUpdates()
    expect(within(availableMobileEvent as HTMLElement).getByText('Керування')).toBeInTheDocument()
    expect(
      within(availableMobileEvent as HTMLElement).getByText('Керувати вільним часом можна у вкладці “Вільний час для запису”.')
    ).toBeInTheDocument()
    expect(within(availableMobileEvent as HTMLElement).queryByRole('link', { name: 'Відкрити сесію' })).not.toBeInTheDocument()

    await fireEvent.click(within(bookedMobileEvent as HTMLElement).getByRole('button'))
    await flushAsyncUpdates()
    expect(within(bookedMobileEvent as HTMLElement).getByText('Заброньовано')).toBeInTheDocument()
    expect(within(bookedMobileEvent as HTMLElement).getByText('Гостьовий клієнт')).toBeInTheDocument()
    expect(within(bookedMobileEvent as HTMLElement).getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute('href', '/cabinet/sessions/502')

    await fireEvent.click(within(sessionMobileEvent as HTMLElement).getByRole('button'))
    await flushAsyncUpdates()
    expect(within(sessionMobileEvent as HTMLElement).getByText('Сесія')).toBeInTheDocument()
    expect(within(sessionMobileEvent as HTMLElement).getByText('Олена')).toBeInTheDocument()
    expect(within(sessionMobileEvent as HTMLElement).getByText('Заплановано')).toBeInTheDocument()
    expect(within(sessionMobileEvent as HTMLElement).getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute('href', '/cabinet/sessions/503')

    const detailPanel = container.querySelector('.slot-detail-panel') as HTMLElement

    await fireEvent.click(container.querySelector('.week-calendar .schedule-event--available') as HTMLButtonElement)
    await flushAsyncUpdates()
    expect(within(detailPanel).queryByRole('link', { name: 'Відкрити сесію' })).not.toBeInTheDocument()

    await fireEvent.click(container.querySelector('.week-calendar .schedule-event--booked') as HTMLButtonElement)
    await flushAsyncUpdates()
    expect(within(detailPanel).getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute('href', '/cabinet/sessions/502')

    await fireEvent.click(container.querySelector('.week-calendar .calendar-session') as HTMLButtonElement)
    await flushAsyncUpdates()
    expect(within(detailPanel).getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute('href', '/cabinet/sessions/503')

    await fireEvent.click(screen.getByRole('button', { name: 'Вільний час' }))
    await flushAsyncUpdates()
    expect(container.querySelectorAll('.week-calendar .schedule-event')).toHaveLength(1)
    expect(container.querySelector('.week-calendar .schedule-event--available')).toBeInTheDocument()
    expect((mobileSchedule as HTMLElement).querySelectorAll('.mobile-schedule-event')).toHaveLength(1)
    expect((mobileSchedule as HTMLElement).querySelector('.mobile-schedule-event.schedule-event--available')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Заброньовано' }))
    await flushAsyncUpdates()
    expect(container.querySelectorAll('.week-calendar .schedule-event')).toHaveLength(1)
    expect(container.querySelector('.week-calendar .schedule-event--booked')).toBeInTheDocument()
    expect((mobileSchedule as HTMLElement).querySelectorAll('.mobile-schedule-event')).toHaveLength(1)
    expect((mobileSchedule as HTMLElement).querySelector('.mobile-schedule-event.schedule-event--booked')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Сесії' }))
    await flushAsyncUpdates()
    expect(container.querySelectorAll('.week-calendar .schedule-event')).toHaveLength(2)
    expect(container.querySelector('.week-calendar .schedule-event--booked')).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-session')).toBeInTheDocument()
    expect((mobileSchedule as HTMLElement).querySelectorAll('.mobile-schedule-event')).toHaveLength(2)
  })

  it('does not show mobile inline session link when selected schedule event has no session id', async () => {
    openCalendarRoute()
    mockScheduleApi([], [], [
      {
        type: 'booked_slot',
        id: 'booked-slot-no-session',
        slot_id: 94,
        session_id: null,
        start_at: '2026-03-12T10:00:00Z',
        end_at: '2026-03-12T10:50:00Z',
        status: 'booked',
        title: 'Заброньовано',
        client_display_name: 'Гостьовий клієнт',
        client_kind: 'guest',
        contact: '+380991112233',
        meeting_url: 'https://meet.example/private',
        offline_location: 'Private room',
      },
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    const mobileEvent = container.querySelector('.mobile-schedule-event') as HTMLElement | null
    expect(mobileEvent).toBeInstanceOf(HTMLElement)
    await fireEvent.click(within(mobileEvent as HTMLElement).getByRole('button'))
    await flushAsyncUpdates()

    expect(within(mobileEvent as HTMLElement).getByText('Заброньовано')).toBeInTheDocument()
    expect(within(mobileEvent as HTMLElement).queryByRole('link', { name: 'Відкрити сесію' })).not.toBeInTheDocument()
    expect(screen.queryByText('+380991112233')).not.toBeInTheDocument()
    expect(screen.queryByText('https://meet.example/private')).not.toBeInTheDocument()
    expect(screen.queryByText('Private room')).not.toBeInTheDocument()
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
    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()

    expect(screen.getByText('1 вільних вікон · 1 заброньованих')).toBeInTheDocument()
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
    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()

    const shortBlock = container.querySelector('.week-calendar .calendar-slot[aria-label="Доступно 11:00–11:50"]') as HTMLElement | null
    const longBlock = container.querySelector('.week-calendar .calendar-slot[aria-label="Доступно 13:00–15:00"]') as HTMLElement | null

    expect(shortBlock).toBeInstanceOf(HTMLElement)
    expect(longBlock).toBeInstanceOf(HTMLElement)
    expect(shortBlock as HTMLElement).toHaveAttribute('data-duration-minutes', '50')
    expect(longBlock as HTMLElement).toHaveAttribute('data-duration-minutes', '120')
    expect(parseFloat((longBlock as HTMLElement).style.height)).toBeGreaterThan(parseFloat((shortBlock as HTMLElement).style.height))
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
    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()

    const block = container.querySelector('.week-calendar .calendar-slot')
    expect(block).toBeInstanceOf(HTMLElement)
    const mobileSchedule = container.querySelector('.mobile-day-schedule') as HTMLElement | null
    expect(mobileSchedule).toBeInstanceOf(HTMLElement)
    expect((mobileSchedule as HTMLElement).querySelector('.mobile-day-group')).not.toBeInTheDocument()
    expect((mobileSchedule as HTMLElement).querySelector('.mobile-slot')).toBeInTheDocument()
    await fireEvent.click(block as HTMLElement)

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
    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()

    const block = container.querySelector('.week-calendar .calendar-slot')
    expect(block).toHaveClass('slot-status--booked')
    await fireEvent.click(block as HTMLElement)

    expect(screen.getByText('Цей вільний час уже заброньовано. Даних для переходу до сесії в поточному payload немає.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Редагувати вільний час' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Видалити вільний час' })).toBeDisabled()
  })

  it('keeps all filter and booked slots after single free-slot delete', async () => {
    openAvailabilityRoute()
    mockScheduleApi([
      {
        id: 34,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
      {
        id: 35,
        start_at: '2026-03-12T10:00:00Z',
        end_at: '2026-03-12T10:50:00Z',
        is_booked: true,
      },
    ])
    mockedApiDelete.mockResolvedValue({} as any)

    const { container } = renderView()
    await flushAsyncUpdates()

    expect(screen.getByRole('button', { name: 'Усі' })).toHaveClass('btn--active')
    await fireEvent.click(container.querySelector('.week-calendar .calendar-slot[aria-label="Доступно 11:00–11:50"]') as HTMLElement)
    await fireEvent.click(screen.getByRole('button', { name: 'Видалити вільний час' }))
    const confirmOptions = mockConfirmModal.openConfirm.mock.calls.at(-1)?.[0]
    await confirmOptions?.onConfirm?.()
    await flushAsyncUpdates()

    expect(mockedApiDelete).toHaveBeenCalledWith('/cabinet/slots/34/')
    expect(mockedApiDelete).not.toHaveBeenCalledWith('/cabinet/slots/35/')
    expect(screen.getByRole('button', { name: 'Усі' })).toHaveClass('btn--active')
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Доступно 11:00–11:50"]')).not.toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Заброньовано 12:00–12:50"]')).toBeInTheDocument()
  })

  it('renders selection controls only for unbooked availability slots and clears selection', async () => {
    openAvailabilityRoute()
    mockScheduleApi([
      {
        id: 41,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
      {
        id: 42,
        start_at: '2026-03-12T10:00:00Z',
        end_at: '2026-03-12T10:50:00Z',
        is_booked: true,
      },
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    const weekCalendar = container.querySelector('.week-calendar') as HTMLElement
    const selectFree = within(weekCalendar).getByRole('button', { name: 'Вибрати слот 11:00–11:50' })
    expect(selectFree).toBeEnabled()
    expect(within(weekCalendar).queryByRole('button', { name: 'Вибрати слот 12:00–12:50' })).not.toBeInTheDocument()

    const mobileSchedule = container.querySelector('.mobile-day-schedule') as HTMLElement
    expect(within(mobileSchedule).getByRole('button', { name: 'Вибрати слот 11:00–11:50' })).toBeEnabled()
    expect(within(mobileSchedule).queryByRole('button', { name: 'Вибрати слот 12:00–12:50' })).not.toBeInTheDocument()

    await fireEvent.click(selectFree)

    expect(screen.getByText('Вибрано: 1')).toBeInTheDocument()
    expect(selectFree).toHaveAttribute('aria-pressed', 'true')

    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати вибір' }))

    expect(screen.queryByText('Вибрано: 1')).not.toBeInTheDocument()
    expect(selectFree).toHaveAttribute('aria-pressed', 'false')
  })

  it('deletes selected unbooked availability slots after confirmation', async () => {
    openAvailabilityRoute()
    const bookedSlot = {
      id: 53,
      start_at: '2026-03-12T11:00:00Z',
      end_at: '2026-03-12T11:50:00Z',
      is_booked: true,
    }
    let currentSlots = [
      {
        id: 51,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
      {
        id: 52,
        start_at: '2026-03-12T10:00:00Z',
        end_at: '2026-03-12T10:50:00Z',
        is_booked: false,
      },
      bookedSlot,
    ]
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return currentSlots as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiDelete.mockImplementation(async (url) => {
      const idMatch = /\/cabinet\/slots\/(\d+)\//.exec(String(url))
      if (!idMatch) throw new Error(`Unexpected apiDelete call: ${url}`)
      const slotId = Number(idMatch[1])
      currentSlots = currentSlots.filter((slot) => slot.id !== slotId)
      return {} as any
    })

    const { container } = renderView()
    await flushAsyncUpdates()

    const weekCalendar = container.querySelector('.week-calendar') as HTMLElement
    await fireEvent.click(within(weekCalendar).getByRole('button', { name: 'Вибрати слот 11:00–11:50' }))
    await fireEvent.click(within(weekCalendar).getByRole('button', { name: 'Вибрати слот 12:00–12:50' }))

    expect(screen.getByText('Вибрано: 2')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Видалити вибрані' }))

    const confirmOptions = mockConfirmModal.openConfirm.mock.calls.at(-1)?.[0]
    expect(confirmOptions).toEqual(expect.objectContaining({
      title: 'Видалити вільний час?',
      confirmText: 'Видалити вибрані',
    }))
    expect(confirmOptions?.message).toContain('Буде видалено 2 вільних слотів.')
    expect(confirmOptions?.message).toContain('Заброньовані сесії не буде змінено.')

    await confirmOptions?.onConfirm?.()
    await flushAsyncUpdates()

    expect(mockedApiDelete).toHaveBeenCalledWith('/cabinet/slots/51/')
    expect(mockedApiDelete).toHaveBeenCalledWith('/cabinet/slots/52/')
    expect(mockedApiDelete).not.toHaveBeenCalledWith('/cabinet/slots/53/')
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Доступно 11:00–11:50"]')).not.toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Доступно 12:00–12:50"]')).not.toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Заброньовано 13:00–13:50"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Усі' })).toHaveClass('btn--active')
    expect(screen.queryByText('Вибрано: 2')).not.toBeInTheDocument()
    expect(mockToast.success).toHaveBeenCalledWith('Вільний час видалено.')
  })

  it('clears all unbooked slots in the visible week independent of the active filter', async () => {
    openAvailabilityRoute()
    mockScheduleApi([
      {
        id: 61,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
      {
        id: 62,
        start_at: '2026-03-12T10:00:00Z',
        end_at: '2026-03-12T10:50:00Z',
        is_booked: true,
      },
      {
        id: 63,
        start_at: '2026-03-16T09:00:00Z',
        end_at: '2026-03-16T09:50:00Z',
        is_booked: false,
      },
    ])
    mockedApiDelete.mockResolvedValue({} as any)

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Заброньовані' }))
    expect(screen.getByRole('button', { name: 'Заброньовані' })).toHaveClass('btn--active')

    await fireEvent.click(screen.getByRole('button', { name: 'Очистити тиждень' }))
    const confirmOptions = mockConfirmModal.openConfirm.mock.calls.at(-1)?.[0]
    expect(confirmOptions).toEqual(expect.objectContaining({
      title: 'Видалити вільний час?',
      confirmText: 'Очистити тиждень',
    }))
    expect(confirmOptions?.message).toContain('Буде видалено всі вільні незаброньовані слоти цього тижня.')
    expect(confirmOptions?.message).toContain('Заброньовані сесії не буде змінено.')

    await confirmOptions?.onConfirm?.()
    await flushAsyncUpdates()

    expect(mockedApiDelete).toHaveBeenCalledTimes(1)
    expect(mockedApiDelete).toHaveBeenCalledWith('/cabinet/slots/61/')
    expect(mockedApiDelete).not.toHaveBeenCalledWith('/cabinet/slots/62/')
    expect(mockedApiDelete).not.toHaveBeenCalledWith('/cabinet/slots/63/')
    expect(screen.getByRole('button', { name: 'Заброньовані' })).toHaveClass('btn--active')
    expect(mockToast.success).toHaveBeenCalledWith('Вільний час видалено.')
  })

  it('preserves booked slots after clearing the visible week', async () => {
    openAvailabilityRoute()
    const freeSlot = {
      id: 64,
      start_at: '2026-03-12T09:00:00Z',
      end_at: '2026-03-12T09:50:00Z',
      is_booked: false,
    }
    const bookedSlot = {
      id: 65,
      start_at: '2026-03-12T10:00:00Z',
      end_at: '2026-03-12T10:50:00Z',
      is_booked: true,
    }
    let cleared = false
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return cleared ? [bookedSlot] : [freeSlot, bookedSlot]
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiDelete.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/64/') {
        cleared = true
        return {} as any
      }
      throw new Error(`Unexpected apiDelete call: ${url}`)
    })

    const { container } = renderView()
    await flushAsyncUpdates()

    expect(screen.getByRole('button', { name: 'Усі' })).toHaveClass('btn--active')
    expect(screen.getByText('1 вільних вікон · 1 заброньованих')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Очистити тиждень' }))
    const confirmOptions = mockConfirmModal.openConfirm.mock.calls.at(-1)?.[0]
    await confirmOptions?.onConfirm?.()
    await flushAsyncUpdates()

    expect(mockedApiDelete).toHaveBeenCalledWith('/cabinet/slots/64/')
    expect(mockedApiDelete).not.toHaveBeenCalledWith('/cabinet/slots/65/')
    expect(screen.getByRole('button', { name: 'Усі' })).toHaveClass('btn--active')
    expect(screen.getByText('0 вільних вікон · 1 заброньованих')).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Доступно 11:00–11:50"]')).not.toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Заброньовано 12:00–12:50"]')).toBeInTheDocument()
  })

  it('reloads slots and clears selection when bulk delete fails', async () => {
    openAvailabilityRoute()
    const slots = [
      {
        id: 71,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
      {
        id: 72,
        start_at: '2026-03-12T10:00:00Z',
        end_at: '2026-03-12T10:50:00Z',
        is_booked: false,
      },
    ]
    mockScheduleApi(slots)
    mockedApiDelete.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/72/') throw new Error('delete failed')
      return {} as any
    })

    const { container } = renderView()
    await flushAsyncUpdates()

    const weekCalendar = container.querySelector('.week-calendar') as HTMLElement
    await fireEvent.click(within(weekCalendar).getByRole('button', { name: 'Вибрати слот 11:00–11:50' }))
    await fireEvent.click(within(weekCalendar).getByRole('button', { name: 'Вибрати слот 12:00–12:50' }))
    expect(screen.getByText('Вибрано: 2')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Видалити вибрані' }))
    const confirmOptions = mockConfirmModal.openConfirm.mock.calls.at(-1)?.[0]
    await confirmOptions?.onConfirm?.()
    await flushAsyncUpdates()

    expect(mockedApiDelete).toHaveBeenCalledWith('/cabinet/slots/71/')
    expect(mockedApiDelete).toHaveBeenCalledWith('/cabinet/slots/72/')
    expect(mockToast.error).toHaveBeenCalledWith('Не вдалося видалити вільний час. Оновіть сторінку і спробуйте ще раз.')
    expect(screen.queryByText('Вибрано: 2')).not.toBeInTheDocument()
    expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/slots/')
  })

  it('prunes selected slots when the visible week changes', async () => {
    openAvailabilityRoute()
    mockScheduleApi([
      {
        id: 81,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    const weekCalendar = container.querySelector('.week-calendar') as HTMLElement
    await fireEvent.click(within(weekCalendar).getByRole('button', { name: 'Вибрати слот 11:00–11:50' }))
    expect(screen.getByText('Вибрано: 1')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Наступний тиждень' }))
    await flushAsyncUpdates()

    expect(screen.queryByText('Вибрано: 1')).not.toBeInTheDocument()
  })

  it('renders no-slot session in the visible week without a matching Slot', async () => {
    openCalendarRoute()
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
    openCalendarRoute()
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

    const detailPanel = container.querySelector('.slot-detail-panel') as HTMLElement
    expect(within(detailPanel).getByText('Деталі події')).toBeInTheDocument()
    expect(within(detailPanel).getByText('Саша Мальована')).toBeInTheDocument()
    expect(within(detailPanel).getByText('09:00–09:50')).toBeInTheDocument()
    expect(within(detailPanel).getByText('Заплановано')).toBeInTheDocument()
    expect(
      within(detailPanel).getByRole('link', { name: 'Відкрити сесію' })
    ).toHaveAttribute('href', '/cabinet/sessions/78')
  })

  it('does not render cancelled no-slot session as an active calendar block', async () => {
    openCalendarRoute()
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
    expect(screen.getAllByText('На цьому тижні ще немає подій у розкладі.').length).toBeGreaterThan(0)
  })

  it('renders schedule API events without duplicating overlapping booked slots', async () => {
    openCalendarRoute()
    const overlappingSession = scheduleSession({
      id: 80,
      slot_start_at: '2026-03-12T07:00:00Z',
      slot_end_at: '2026-03-12T07:50:00Z',
    })
    mockScheduleApi([
      {
        id: 30,
        start_at: '2026-03-12T07:00:00Z',
        end_at: '2026-03-12T07:50:00Z',
        is_booked: true,
      },
    ], [], [scheduleEventFromSession(overlappingSession as any)])

    const { container } = renderView()
    await flushAsyncUpdates()

    expect(container.querySelectorAll('.week-calendar .calendar-session')).toHaveLength(1)
    expect(container.querySelectorAll('.week-calendar .calendar-slot:not(.calendar-session)')).toHaveLength(0)
  })

  it('refetches unified schedule events for the newly visible week', async () => {
    openCalendarRoute()
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    expect(mockedGetCabinetSchedule).toHaveBeenCalledWith('2026-03-09', '2026-03-15')

    await fireEvent.click(screen.getByRole('button', { name: 'Наступний тиждень' }))
    await flushAsyncUpdates()

    expect(mockedGetCabinetSchedule).toHaveBeenCalledWith('2026-03-16', '2026-03-22')
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
    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()

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

  it('keeps the default all filter and booked slots after filling week', async () => {
    const bookedSlot = {
      id: 30,
      start_at: '2026-03-12T09:00:00Z',
      end_at: '2026-03-12T09:50:00Z',
      is_booked: true,
    }
    const createdAvailableSlot = {
      id: 31,
      start_at: '2026-03-12T11:00:00Z',
      end_at: '2026-03-12T11:50:00Z',
      is_booked: false,
    }
    let slotsReloaded = false
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') {
        return slotsReloaded ? [bookedSlot, createdAvailableSlot] : [bookedSlot]
      }
      if (url === '/booking/sessions/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/fill-week/') {
        slotsReloaded = true
        return [createdAvailableSlot] as any
      }
      throw new Error(`Unexpected apiPost call: ${url}`)
    })

    const { container } = renderView()
    await flushAsyncUpdates()

    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()
    expect(screen.getByRole('button', { name: 'Усі' })).toHaveClass('btn--active')
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Доступно 13:00–13:50"]')).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Заповнити тиждень' }))
    await flushAsyncUpdates()
    const confirmOptions = mockConfirmModal.openConfirm.mock.calls.at(-1)?.[0]
    await confirmOptions?.onConfirm?.()
    await flushAsyncUpdates()

    expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/slots/fill-week/', {
      date: '2026-03-09',
    })
    expect(screen.getByRole('tab', { name: 'Вільний час для запису' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('09.03.2026 - 15.03.2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Усі' })).toHaveClass('btn--active')
    expect(screen.getByRole('button', { name: 'Доступно' })).not.toHaveClass('btn--active')
    expect(screen.getByRole('button', { name: 'Заброньовані' })).not.toHaveClass('btn--active')
    expect(screen.getByText('1 вільних вікон · 1 заброньованих')).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Доступно 13:00–13:50"]')).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Заброньовано 11:00–11:50"]')).toBeInTheDocument()
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Тиждень від 09.03.2026 заповнено.'))
  })

  it('preserves a manually selected booked filter after filling week', async () => {
    const bookedSlot = {
      id: 32,
      start_at: '2026-03-12T09:00:00Z',
      end_at: '2026-03-12T09:50:00Z',
      is_booked: true,
    }
    const createdAvailableSlot = {
      id: 33,
      start_at: '2026-03-12T11:00:00Z',
      end_at: '2026-03-12T11:50:00Z',
      is_booked: false,
    }
    let slotsReloaded = false
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') {
        return slotsReloaded ? [bookedSlot, createdAvailableSlot] : [bookedSlot]
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/fill-week/') {
        slotsReloaded = true
        return [createdAvailableSlot] as any
      }
      throw new Error(`Unexpected apiPost call: ${url}`)
    })

    const { container } = renderView()
    await flushAsyncUpdates()

    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Заброньовані' }))

    await fireEvent.click(screen.getByRole('button', { name: 'Заповнити тиждень' }))
    const confirmOptions = mockConfirmModal.openConfirm.mock.calls.at(-1)?.[0]
    await confirmOptions?.onConfirm?.()
    await flushAsyncUpdates()

    expect(screen.getByRole('button', { name: 'Заброньовані' })).toHaveClass('btn--active')
    expect(screen.getByText('1 вільних вікон · 1 заброньованих')).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Заброньовано 11:00–11:50"]')).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Доступно 13:00–13:50"]')).not.toBeInTheDocument()
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
    await fireEvent.click(screen.getByRole('tab', { name: 'Вільний час для запису' }))
    await flushAsyncUpdates()

    const block = container.querySelector('.week-calendar .calendar-slot')
    expect(block).toBeInstanceOf(HTMLElement)
    await fireEvent.click(block as HTMLElement)
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

    expect(mockedApiGet).toHaveBeenCalledTimes(2)
    expect(mockedGetCabinetSchedule).toHaveBeenCalledTimes(2)
    expect(screen.getAllByText('11:10–11:40').length).toBeGreaterThan(0)
    expect(mockToast.success).toHaveBeenCalledWith('Вільне вікно на 12.03.2026, 11:10 створено.')
  })
})
