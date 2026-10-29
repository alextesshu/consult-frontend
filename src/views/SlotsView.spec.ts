import { fireEvent, render, screen, within } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/vue'
import {
  apiDelete,
  apiGet,
  apiPost,
  createClientRegularTime,
  createSessionFromCabinetGuestBookingRequest,
  fetchSpecialistProfile,
  getCabinetSchedule,
  updateSpecialistProfile,
} from '../lib/api'
import SlotsView from './SlotsView.vue'

const mockRoute = {
  path: '/cabinet/slots',
  query: {} as Record<string, unknown>,
}

const mockRouter = {
  replace: vi.fn(),
}

const scrollIntoViewMock = vi.fn()

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
  createSessionFromCabinetGuestBookingRequest: vi.fn(),
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
    useRouter: () => mockRouter,
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
const mockedCreateSessionFromGuestRequest = vi.mocked(createSessionFromCabinetGuestBookingRequest)
const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)
const mockedGetCabinetSchedule = vi.mocked(getCabinetSchedule)
const mockedUpdateSpecialistProfile = vi.mocked(updateSpecialistProfile)

async function flushAsyncUpdates() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
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

function publicBookingProfile(showPublicAvailability: boolean, publicBookingMode: 'request_only' | 'direct_booking' = 'direct_booking') {
  return {
    standard_session_duration_minutes: 50,
    timezone: 'Europe/Kyiv',
    public_booking_mode: publicBookingMode,
    show_public_availability: showPublicAvailability,
    public_booking_min_lead_time_hours: 24,
    public_booking_horizon_days: 14,
    public_booking_requires_confirmation: true,
  } as any
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
  await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
  await flushAsyncUpdates()
  const addButton = getAvailabilitySecondaryAction()
  if (!addButton) throw new Error('Add free time button not found')
  await fireEvent.click(addButton)
  await flushAsyncUpdates()
  return getCreateFormControls(container)
}

function getAvailabilityActionPanel() {
  const panel = screen.getByRole('region', { name: 'Як клієнти можуть звертатися' })
  return within(panel)
}

function getAvailabilityPrimaryAction() {
  return getAvailabilityActionPanel().getByRole('button', {
    name: /Створити вікна для запису|Додати вікна для запису/,
  })
}

function getAvailabilitySecondaryAction() {
  return getAvailabilityActionPanel().getByRole('button', { name: 'Додати одне вікно' })
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

function openSlotsCalendarRoute(query: Record<string, unknown> = {}) {
  mockRoute.path = '/cabinet/slots'
  mockRoute.query = query
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
    mockedCreateSessionFromGuestRequest.mockReset()
    mockedFetchSpecialistProfile.mockReset()
    mockedGetCabinetSchedule.mockReset()
    mockedUpdateSpecialistProfile.mockReset()
    mockedGetCabinetSchedule.mockResolvedValue({ events: [] })
    mockedCreateClientRegularTime.mockResolvedValue({} as any)
    mockedCreateSessionFromGuestRequest.mockResolvedValue({} as any)
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
    mockRouter.replace.mockReset()
    scrollIntoViewMock.mockReset()
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewMock,
    })
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
    expect(screen.queryByRole('button', { name: 'Додати одне вікно' })).not.toBeInTheDocument()
    expect(screen.getAllByText('На цьому тижні ще немає подій у розкладі.').length).toBeGreaterThan(0)
    expect(container.querySelector('.calendar-scroll')).toBeInTheDocument()
  })

  it('opens availability tab from route query', async () => {
    mockRoute.query = { tab: 'availability' }
    mockScheduleApi()

    const { container } = renderView()
    await flushAsyncUpdates()

    expect(screen.getByRole('tab', { name: 'Вікна для запису' })).toHaveAttribute('aria-selected', 'true')
    expect(getAvailabilitySecondaryAction()).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Як клієнти можуть звертатися' })).toBeInTheDocument()
    expect(screen.getByText('Зараз: запит без вибору часу')).toBeInTheDocument()
    expect(screen.getByText('Клієнти можуть залишати запити без вибору конкретного часу. Вікна для запису необов’язкові.')).toBeInTheDocument()
    const actionPanel = screen.getByRole('region', { name: 'Як клієнти можуть звертатися' })
    const toolbar = container.querySelector('.schedule-toolbar')
    expect(toolbar).toBeInstanceOf(HTMLElement)
    expect(actionPanel.compareDocumentPosition(toolbar as Element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(toolbar as HTMLElement).queryByRole('link', { name: 'Запис і запити' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Створити сесію' })).not.toBeInTheDocument()
    expect(scrollIntoViewMock).not.toHaveBeenCalled()
    expect(mockRouter.replace).not.toHaveBeenCalled()
    expect(actionPanel).not.toHaveClass('availability-action-panel--attention')
  })

  it('defers availability deep-link focus until the primary action is enabled', async () => {
    openAvailabilityRoute({ tab: 'availability', focus: 'create-availability', source: 'dashboard' })
    const slotsDeferred = createDeferred<unknown[]>()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return slotsDeferred.promise as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedGetCabinetSchedule.mockResolvedValue({ events: [] })

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByRole('tab', { name: 'Вікна для запису' })).toHaveAttribute('aria-selected', 'true')
    const primaryAction = getAvailabilityPrimaryAction()
    expect(primaryAction).toBeDisabled()
    expect(scrollIntoViewMock).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(primaryAction)
    expect(mockRouter.replace).not.toHaveBeenCalled()
    expect(screen.getByRole('region', { name: 'Як клієнти можуть звертатися' })).not.toHaveClass(
      'availability-action-panel--attention'
    )

    slotsDeferred.resolve([])
    await flushAsyncUpdates()

    expect(primaryAction).not.toBeDisabled()
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
      expect(document.activeElement).toBe(primaryAction)
    })
    expect(screen.queryByRole('dialog', { name: 'Створити вікна для запису' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Як клієнти можуть звертатися' })).toHaveClass(
      'availability-action-panel--attention'
    )
    expect(mockRouter.replace).toHaveBeenCalledWith({
      path: '/cabinet/slots',
      query: { tab: 'availability', source: 'dashboard' },
    })

    vi.advanceTimersByTime(2200)
    await flushAsyncUpdates()
    expect(screen.getByRole('region', { name: 'Як клієнти можуть звертатися' })).not.toHaveClass(
      'availability-action-panel--attention'
    )
  })

  it('renders empty-week availability guidance inside the calendar column', async () => {
    openAvailabilityRoute()
    mockScheduleApi()

    const { container } = renderView()
    await flushAsyncUpdates()

    const emptyState = screen.getByRole('region', { name: 'На цьому тижні ще немає вікон для запису' })
    expect(emptyState).toBeInTheDocument()
    expect(emptyState.closest('.calendar-panel')).toBeInTheDocument()
    expect(container.querySelector('.calendar-scroll')).toBeInTheDocument()
    expect(within(emptyState).getByText('Робочі години — лише шаблон. Створіть вікна за графіком або додайте час вручну.')).toBeInTheDocument()
    expect(within(emptyState).getAllByRole('button')).toHaveLength(1)
    expect(within(emptyState).queryByRole('button', { name: 'Додати одне вікно' })).not.toBeInTheDocument()
    expect(screen.queryByText('На цьому тижні ще немає вікон для запису.')).not.toBeInTheDocument()

    await fireEvent.click(getAvailabilitySecondaryAction())
    await flushAsyncUpdates()
    expect(screen.getByRole('heading', { name: 'Додати вікно для запису' })).toBeInTheDocument()

    await fireEvent.click(within(emptyState).getByRole('button', { name: 'Створити вікна для запису' }))
    await flushAsyncUpdates()
    expect(screen.getByRole('dialog', { name: 'Створити вікна для запису' })).toBeInTheDocument()
  })

  it('does not show empty-week guidance or duplicate primary action when availability has slots', async () => {
    openAvailabilityRoute()
    mockScheduleApi([
      {
        id: 703,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
    ])

    renderView()
    await flushAsyncUpdates()

    expect(screen.queryByRole('region', { name: 'На цьому тижні ще немає вікон для запису' })).not.toBeInTheDocument()
    expect(getAvailabilityActionPanel().getByRole('button', { name: 'Додати вікна для запису' })).toHaveClass('btn--ghost')
  })

  it('does not show onboarding empty state when status filters hide existing week slots', async () => {
    openAvailabilityRoute()
    mockScheduleApi([
      {
        id: 704,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: false,
      },
    ])

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Заброньовано' }))

    expect(screen.queryByRole('region', { name: 'На цьому тижні ще немає вікон для запису' })).not.toBeInTheDocument()
    expect(screen.getByText('За обраним фільтром вікон немає.')).toBeInTheDocument()
    expect(screen.queryByText('На цьому тижні ще немає вікон для запису.')).not.toBeInTheDocument()
  })

  it('does not show onboarding empty state when available filter hides booked week slots', async () => {
    openAvailabilityRoute()
    mockScheduleApi([
      {
        id: 705,
        start_at: '2026-03-12T09:00:00Z',
        end_at: '2026-03-12T09:50:00Z',
        is_booked: true,
      },
    ])

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Незайняті' }))

    expect(screen.queryByRole('region', { name: 'На цьому тижні ще немає вікон для запису' })).not.toBeInTheDocument()
    expect(screen.getByText('За обраним фільтром вікон немає.')).toBeInTheDocument()
    expect(screen.queryByText('На цьому тижні ще немає вікон для запису.')).not.toBeInTheDocument()
  })

  it('keeps availability action block and empty-week guidance off calendar and settings tabs', async () => {
    openCalendarRoute()
    mockScheduleApi()

    const { unmount } = renderView()
    await flushAsyncUpdates()

    expect(screen.queryByRole('region', { name: 'Як клієнти можуть звертатися' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'На цьому тижні ще немає вікон для запису' })).not.toBeInTheDocument()
    unmount()

    openAvailabilityRoute({ tab: 'settings' })
    renderView()
    await flushAsyncUpdates()

    expect(screen.queryByRole('region', { name: 'Як клієнти можуть звертатися' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'На цьому тижні ще немає вікон для запису' })).not.toBeInTheDocument()
  })

  it('falls back to the nearest future date without showing a noisy toast', async () => {
    openAvailabilityRoute()
    mockScheduleApi([
      {
        id: 701,
        start_at: '2026-03-12T06:00:00Z',
        end_at: '2026-03-12T06:50:00Z',
        is_booked: false,
      },
      {
        id: 702,
        start_at: '2026-03-13T08:00:00Z',
        end_at: '2026-03-13T08:50:00Z',
        is_booked: false,
      },
    ])

    renderView()
    await flushAsyncUpdates()
    await flushAsyncUpdates()

    expect(screen.getByText('09.03.2026 - 15.03.2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'пт, 13.03' })).toHaveClass('btn--active')
    expect(mockToast.info).not.toHaveBeenCalled()
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

  it('keeps schedule navigation focused on calendar, booking windows and vacation', async () => {
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByRole('tab', { name: 'Календар' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Вікна для запису' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Відпустка' })).toHaveAttribute('href', '/cabinet/availability-exceptions')
    expect(screen.queryByRole('tab', { name: 'Налаштування' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Налаштування' })).not.toBeInTheDocument()
  })

  it('opens booking settings from settings tab query without restoring legacy settings tab', async () => {
    openAvailabilityRoute({ tab: 'settings' })
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByRole('tab', { name: 'Вікна для запису' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.queryByRole('tab', { name: 'Налаштування' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Запис і запити' })).toBeInTheDocument()
    expect(screen.getByText('Налаштуйте, як клієнти можуть звертатися до вас із публічного профілю.')).toBeInTheDocument()
  })

  it('warns when direct booking is selected but public availability is hidden', async () => {
    openAvailabilityRoute({ tab: 'settings' })
    mockedFetchSpecialistProfile.mockResolvedValueOnce({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kyiv',
      public_booking_mode: 'direct_booking',
      show_public_availability: false,
      public_booking_min_lead_time_hours: 24,
      public_booking_horizon_days: 14,
      public_booking_requires_confirmation: true,
    } as any)
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByText('Запис на вікна вимкнений у публічному профілі')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Ви обрали запис на доступні вікна, але не показуєте ці вікна клієнтам. Увімкніть показ вікон або перейдіть на запити без вибору часу.'
      )
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Показувати доступні вікна у публічному профілі')).not.toBeChecked()

    await fireEvent.update(screen.getByLabelText('Спосіб запису'), 'request_only')
    await flushAsyncUpdates()
    expect(screen.queryByText('Запис на вікна вимкнений у публічному профілі')).not.toBeInTheDocument()
  })

  it('keeps booking settings save disabled until local changes exist', async () => {
    openAvailabilityRoute({ tab: 'settings' })
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByRole('button', { name: 'Зберегти зміни' })).toBeDisabled()
    expect(screen.queryByTestId('settings-sticky-save-bar')).not.toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Спосіб запису'), 'direct_booking')
    await flushAsyncUpdates()

    expect(screen.getByText('Є незбережені зміни')).toBeInTheDocument()
    expect(screen.getByTestId('settings-sticky-save-bar')).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Зберегти зміни' }).some((button) => !button.hasAttribute('disabled'))
    ).toBe(true)
  })

  it('keeps public availability control connected to its label and saves the setting', async () => {
    openAvailabilityRoute({ tab: 'settings' })
    mockedFetchSpecialistProfile.mockResolvedValueOnce({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kyiv',
      public_booking_mode: 'direct_booking',
      show_public_availability: false,
      public_booking_min_lead_time_hours: 24,
      public_booking_horizon_days: 14,
      public_booking_requires_confirmation: true,
    } as any)
    mockedUpdateSpecialistProfile.mockResolvedValueOnce({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kyiv',
      public_booking_mode: 'direct_booking',
      show_public_availability: true,
      public_booking_min_lead_time_hours: 24,
      public_booking_horizon_days: 14,
      public_booking_requires_confirmation: true,
    } as any)
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    const availabilityControl = screen.getByLabelText('Показувати доступні вікна у публічному профілі')
    expect(availabilityControl).not.toBeChecked()
    expect(screen.getByText('Якщо вимкнути, клієнти не бачать календар доступних вікон.')).toBeInTheDocument()

    await fireEvent.click(screen.getByText('Показувати доступні вікна у публічному профілі'))
    expect(availabilityControl).toBeChecked()

    expect(screen.getByText('Є незбережені зміни')).toBeInTheDocument()
    await fireEvent.click(screen.getAllByRole('button', { name: 'Зберегти зміни' }).at(-1)!)

    expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        public_booking_mode: 'direct_booking',
        show_public_availability: true,
      })
    )
    await waitFor(() => {
      expect(screen.queryByTestId('settings-sticky-save-bar')).not.toBeInTheDocument()
    })
    expect(mockToast.success).toHaveBeenCalledWith('Зміни збережено')
  })

  it('shows an unavailable availability block without a switch in request-only mode', async () => {
    openAvailabilityRoute({ tab: 'settings' })
    mockedFetchSpecialistProfile.mockResolvedValueOnce(publicBookingProfile(true, 'request_only'))
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    expect(
      screen.queryByRole('checkbox', { name: 'Показувати доступні вікна у публічному профілі' })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Показ доступних вікон у публічному профілі')).toBeInTheDocument()
    expect(
      screen.getByText('Показ доступних вікон застосовується лише для запису на вільний час. Попереднє налаштування збережено.')
    ).toBeInTheDocument()
  })

  it('preserves a true public availability setting across request-only save and back to direct booking', async () => {
    openAvailabilityRoute({ tab: 'settings' })
    mockedFetchSpecialistProfile.mockResolvedValueOnce(publicBookingProfile(true))
    mockedUpdateSpecialistProfile.mockResolvedValueOnce({
      ...publicBookingProfile(true),
      public_booking_mode: 'request_only',
    })
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    const bookingModeSelect = screen.getByLabelText('Спосіб запису')

    expect(screen.getByLabelText('Показувати доступні вікна у публічному профілі')).toBeChecked()

    await fireEvent.update(bookingModeSelect, 'request_only')
    await flushAsyncUpdates()

    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('checkbox', { name: 'Показувати доступні вікна у публічному профілі' })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Показ доступних вікон у публічному профілі')).toBeInTheDocument()
    expect(
      screen.getByText('Показ доступних вікон застосовується лише для запису на вільний час. Попереднє налаштування збережено.')
    ).toBeInTheDocument()
    expect(screen.getByText('Є незбережені зміни')).toBeInTheDocument()

    await fireEvent.click(screen.getAllByRole('button', { name: 'Зберегти зміни' }).at(-1)!)

    expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        public_booking_mode: 'request_only',
        show_public_availability: true,
      })
    )
    await waitFor(() => {
      expect(screen.queryByTestId('settings-sticky-save-bar')).not.toBeInTheDocument()
    })

    await fireEvent.update(bookingModeSelect, 'direct_booking')
    await flushAsyncUpdates()

    expect(screen.getByRole('checkbox', { name: 'Показувати доступні вікна у публічному профілі' })).toBeChecked()
    expect(mockedUpdateSpecialistProfile).toHaveBeenCalledTimes(1)
  })

  it('preserves a false public availability setting across request-only save and back to direct booking', async () => {
    openAvailabilityRoute({ tab: 'settings' })
    mockedFetchSpecialistProfile.mockResolvedValueOnce(publicBookingProfile(false))
    mockedUpdateSpecialistProfile.mockResolvedValueOnce({
      ...publicBookingProfile(false),
      public_booking_mode: 'request_only',
    })
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    const bookingModeSelect = screen.getByLabelText('Спосіб запису')

    expect(screen.getByLabelText('Показувати доступні вікна у публічному профілі')).not.toBeChecked()

    await fireEvent.update(bookingModeSelect, 'request_only')
    await flushAsyncUpdates()

    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('checkbox', { name: 'Показувати доступні вікна у публічному профілі' })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Показ доступних вікон у публічному профілі')).toBeInTheDocument()
    expect(
      screen.getByText('Показ доступних вікон застосовується лише для запису на вільний час. Попереднє налаштування збережено.')
    ).toBeInTheDocument()
    expect(screen.getByText('Є незбережені зміни')).toBeInTheDocument()

    await fireEvent.click(screen.getAllByRole('button', { name: 'Зберегти зміни' }).at(-1)!)

    expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        public_booking_mode: 'request_only',
        show_public_availability: false,
      })
    )
    await waitFor(() => {
      expect(screen.queryByTestId('settings-sticky-save-bar')).not.toBeInTheDocument()
    })

    await fireEvent.update(bookingModeSelect, 'direct_booking')
    await flushAsyncUpdates()

    expect(screen.getByRole('checkbox', { name: 'Показувати доступні вікна у публічному профілі' })).not.toBeChecked()
    expect(mockedUpdateSpecialistProfile).toHaveBeenCalledTimes(1)
  })

  it.each([
    { initialAvailability: true },
    { initialAvailability: false },
  ])('restores persisted booking settings when cancelling request-only changes ($initialAvailability)', async ({
    initialAvailability,
  }) => {
    openAvailabilityRoute({ tab: 'settings' })
    mockedFetchSpecialistProfile.mockResolvedValueOnce(publicBookingProfile(initialAvailability))
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    const bookingModeSelect = screen.getByLabelText('Спосіб запису')

    await fireEvent.update(bookingModeSelect, 'request_only')
    await flushAsyncUpdates()

    expect(screen.getByText('Є незбережені зміни')).toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: 'Показувати доступні вікна у публічному профілі' })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Показ доступних вікон у публічному профілі')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }))
    await flushAsyncUpdates()

    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Спосіб запису')).toHaveValue('direct_booking')
    if (initialAvailability) {
      expect(screen.getByLabelText('Показувати доступні вікна у публічному профілі')).toBeChecked()
    } else {
      expect(screen.getByLabelText('Показувати доступні вікна у публічному профілі')).not.toBeChecked()
    }
    expect(screen.queryByText('Є незбережені зміни')).not.toBeInTheDocument()
  })

  it('keeps booking settings dirty and retryable when save fails', async () => {
    openAvailabilityRoute({ tab: 'settings' })
    mockedUpdateSpecialistProfile.mockRejectedValueOnce(new Error('Save failed'))
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    await fireEvent.update(screen.getByLabelText('Спосіб запису'), 'direct_booking')
    await flushAsyncUpdates()
    const saveButton = screen.getAllByRole('button', { name: 'Зберегти зміни' }).at(-1)!
    await fireEvent.click(saveButton)

    expect(await screen.findByText('Save failed')).toBeInTheDocument()
    expect(screen.getByText('Є незбережені зміни')).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Зберегти зміни' }).some((button) => !button.hasAttribute('disabled'))
    ).toBe(true)
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

    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()
    expect(screen.getByRole('tab', { name: 'Вікна для запису' })).toHaveAttribute('aria-selected', 'true')
    expect(getAvailabilitySecondaryAction()).toBeInTheDocument()

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
    expect(screen.queryByRole('button', { name: 'Додати одне вікно' })).not.toBeInTheDocument()
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()
    expect(getAvailabilitySecondaryAction()).toBeInTheDocument()
    expect(getAvailabilityPrimaryAction()).toBeInTheDocument()
    const toolbar = document.querySelector('.schedule-toolbar')
    expect(toolbar).toBeInTheDocument()
    expect(within(toolbar as HTMLElement).queryByRole('button', { name: 'Додати одне вікно' })).not.toBeInTheDocument()
    expect(within(toolbar as HTMLElement).queryByRole('link', { name: 'Запис і запити' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Створити сесію' })).not.toBeInTheDocument()
  })

  it.each([
    ['request_only', false, 'Клієнти залишають запит без вибору часу. Вікна не показуються у публічному профілі.'],
    ['direct_booking', false, 'Показ вікон у публічному профілі вимкнено. Клієнти не можуть обрати час.'],
    ['direct_booking', true, 'Вікна в календарі — збережені записи. Робочі години та попередній розрахунок не створюють їх автоматично. Доступність клієнтам визначають правила публічного запису.'],
  ] as const)('explains private persisted windows without claiming public bookability (%s, %s)', async (mode, visible, message) => {
    openCalendarRoute()
    mockedFetchSpecialistProfile.mockResolvedValueOnce(publicBookingProfile(visible, mode))
    mockScheduleApi([{
      id: 91,
      start_at: '2026-03-12T11:00:00Z',
      end_at: '2026-03-12T11:50:00Z',
      is_booked: false,
    }])
    const { container } = renderView()
    await flushAsyncUpdates()

    expect(screen.getByLabelText('Вікна та публічний запис')).toHaveTextContent(message)
    expect(container.querySelector('.week-calendar button[aria-label="Вікно для запису · 13:00–13:50"]')).toBeInTheDocument()
    expect(within(container.querySelector('.mobile-day-schedule') as HTMLElement).getByRole('button', {
      name: 'Вікно для запису · 13:00–13:50',
    })).toBeInTheDocument()
    expect(mockedApiPost).not.toHaveBeenCalled()
    expect(mockedApiGet.mock.calls.every(([url]) => url === '/cabinet/slots/')).toBe(true)
  })

  it('does not turn working hours or generation examples into calendar events', async () => {
    openCalendarRoute()
    mockedFetchSpecialistProfile.mockResolvedValueOnce(publicBookingProfile(true))
    mockScheduleApi()
    const { container } = renderView()
    await flushAsyncUpdates()

    expect(screen.getByLabelText('Вікна та публічний запис')).toHaveTextContent('Майбутніх незайнятих вікон ще немає.')
    expect(container.querySelectorAll('.schedule-event')).toHaveLength(0)
    const manage = screen.getByRole('link', { name: 'Керувати вікнами' })
    expect(manage).toHaveAttribute('href', '/cabinet/slots?tab=availability')
    await fireEvent.click(manage)
    await flushAsyncUpdates()
    expect(screen.getByRole('region', { name: 'На цьому тижні ще немає вікон для запису' })).toBeInTheDocument()
    expect(mockedApiPost).not.toHaveBeenCalled()
  })

  it('navigates from the calendar to booking settings without creating windows', async () => {
    openCalendarRoute()
    mockScheduleApi()
    renderView()
    await flushAsyncUpdates()

    const settings = screen.getByRole('link', { name: 'Налаштування запису' })
    expect(settings).toHaveAttribute('href', '/cabinet/slots?tab=settings')
    await fireEvent.click(settings)
    await flushAsyncUpdates()
    expect(screen.getByRole('heading', { name: 'Запис і запити' })).toBeInTheDocument()
    expect(mockedApiPost).not.toHaveBeenCalled()
  })

  it('keeps generation preview separate until explicit creation succeeds and slots reload', async () => {
    openAvailabilityRoute()
    mockedFetchSpecialistProfile.mockResolvedValueOnce(publicBookingProfile(true))
    const pending = createDeferred<any>()
    let created = false
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return (created ? [{
        id: 91, start_at: '2026-03-12T11:00:00Z', end_at: '2026-03-12T11:50:00Z', is_booked: false,
      }] : []) as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockReturnValueOnce(pending.promise)
    const { container } = renderView()
    await flushAsyncUpdates()
    const empty = screen.getByRole('region', { name: 'На цьому тижні ще немає вікон для запису' })
    await fireEvent.click(within(empty).getByRole('button', { name: 'Створити вікна для запису' }))
    await flushAsyncUpdates()
    const dialog = screen.getByRole('dialog', { name: 'Створити вікна для запису' })
    expect(within(dialog).getByTestId('fill-availability-preview')).toHaveTextContent('Це попередній розрахунок, а не створені вікна.')
    await fireEvent.update(within(dialog).getByLabelText('Кількість тижнів'), '2')
    expect(mockedApiPost).not.toHaveBeenCalled()
    expect(container.querySelectorAll('.availability-slot')).toHaveLength(0)
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Створити вікна для запису' }))
    await flushAsyncUpdates()
    expect(mockedApiPost).toHaveBeenCalledTimes(1)
    expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/slots/fill/', expect.any(Object))
    expect(container.querySelectorAll('.availability-slot')).toHaveLength(0)
    created = true
    pending.resolve({ created_count: 1, skipped_count: 0 })
    await waitFor(() => {
      expect(container.querySelector('.availability-slot[aria-label="Вікно для запису 13:00–13:50"]')).toBeInTheDocument()
    })
    expect(mockedApiGet).toHaveBeenCalledTimes(2)
  })

  it('shows request-only guidance with a contextual booking settings entry point', async () => {
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
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()
    expect(
      screen.getByText('Клієнти залишають запит без вибору часу. Вікна не показуються у публічному профілі.')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Клієнти можуть залишати запити без вибору конкретного часу. Вікна для запису необов’язкові.')
    ).toBeInTheDocument()
    expect(getAvailabilityActionPanel().queryByRole('button', { name: 'Створити вікна для запису' })).not.toBeInTheDocument()
    expect(getAvailabilityActionPanel().getByRole('button', { name: 'Додати вікна для запису' })).toHaveClass('btn--ghost')
    expect(screen.getByRole('link', { name: 'Змінити налаштування' })).toHaveAttribute('href', '/cabinet/slots?tab=settings')
    expect(screen.queryByRole('link', { name: 'Налаштувати запис і запити' })).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('link', { name: 'Змінити налаштування' }))
    await flushAsyncUpdates()
    expect(screen.getByRole('heading', { name: 'Запис і запити' })).toBeInTheDocument()
    expect(screen.getByLabelText('Спосіб запису')).toBeInTheDocument()
    expect(screen.getByText('Клієнти надсилають запит')).toBeInTheDocument()
    expect(screen.getByText('Клієнти можуть записатися на доступне вікно')).toBeInTheDocument()
  })

  it('shows first-contact setup guidance without presenting availability creation as the only first step', async () => {
    mockedFetchSpecialistProfile.mockResolvedValueOnce({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kyiv',
      public_booking_mode: null,
      show_public_availability: false,
      public_booking_min_lead_time_hours: 24,
      public_booking_horizon_days: 14,
      public_booking_requires_confirmation: true,
    } as any)
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()

    expect(screen.getByText('Спочатку оберіть, як клієнт починатиме взаємодію: залишатиме запит, обиратиме вільний час або використовуватиме обидва варіанти.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Налаштувати запис і запити' })).toHaveAttribute('href', '/cabinet/slots?tab=settings')
    expect(getAvailabilityActionPanel().queryByRole('button', { name: /Створити вікна для запису|Додати вікна для запису/ })).not.toBeInTheDocument()
  })

  it('makes availability creation primary only when persisted direct booking has no future windows', async () => {
    mockedFetchSpecialistProfile.mockResolvedValueOnce({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kyiv',
      public_booking_mode: 'direct_booking',
      show_public_availability: true,
      public_booking_min_lead_time_hours: 24,
      public_booking_horizon_days: 14,
      public_booking_requires_confirmation: true,
    } as any)
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()

    expect(screen.getByText('Майбутніх незайнятих вікон немає')).toBeInTheDocument()
    expect(screen.getByText('Щоб клієнти могли обирати час, створіть доступні вікна.')).toBeInTheDocument()
    expect(getAvailabilityActionPanel().getByRole('button', { name: 'Створити вікна для запису' })).not.toHaveClass('btn--ghost')
    expect(getAvailabilityActionPanel().getByRole('button', { name: 'Додати одне вікно' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Змінити налаштування запису і запитів' })).toHaveAttribute(
      'href',
      '/cabinet/slots?tab=settings'
    )
  })

  it('shows compact current mode when direct booking has future windows', async () => {
    mockedFetchSpecialistProfile.mockResolvedValueOnce({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kyiv',
      public_booking_mode: 'direct_booking',
      show_public_availability: true,
      public_booking_min_lead_time_hours: 24,
      public_booking_horizon_days: 14,
      public_booking_requires_confirmation: true,
    } as any)
    mockScheduleApi([
      {
        id: 903,
        start_at: '2026-03-13T09:00:00Z',
        end_at: '2026-03-13T09:50:00Z',
        is_booked: false,
      },
    ])

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()

    expect(screen.getByText('Вікна створені; показ у публічному профілі увімкнено')).toBeInTheDocument()
    expect(screen.getByText('Можливість обрати конкретне вікно залежить від правил публічного запису. Клієнти також можуть залишити запит без вибору часу.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Створити вікна для запису' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Додати вікна для запису' })).toHaveClass('btn--ghost')
    expect(screen.getByRole('link', { name: 'Змінити налаштування' })).toBeInTheDocument()
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
    const timeSelect = await screen.findByLabelText('Час початку') as HTMLSelectElement
    expect(timeSelect.tagName).toBe('SELECT')
    await fireEvent.update(await screen.findByLabelText('Дата'), '13.03.2026')
    const timeOptionValues = Array.from(timeSelect.options).map((option) => option.value)
    expect(timeOptionValues).toContain('09:00')
    expect(timeOptionValues).toContain('09:10')
    expect(timeOptionValues).toContain('09:20')
    await fireEvent.update(timeSelect, '14:20')
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
    expect(String(payload.starts_at)).toContain(':20:00.000Z')
    expect(payload).not.toHaveProperty('slot_id')
    expect(mockToast.success).toHaveBeenCalledWith('Сесію створено.')
    expect(screen.queryByRole('dialog', { name: 'Створити сесію' })).not.toBeInTheDocument()
  })

  it('opens one-off session modal from route CTA with nearest future time', async () => {
    openSlotsCalendarRoute({ action: 'create-session' })
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByRole('dialog', { name: 'Створити сесію' })).toBeInTheDocument()
    expect(mockRouter.replace).toHaveBeenCalledWith({ path: '/cabinet/slots', query: {} })
    expect((await screen.findByLabelText('Дата') as HTMLInputElement).value).toBe('12.03.2026')
    const timeSelect = await screen.findByLabelText('Час початку') as HTMLSelectElement
    expect(timeSelect.value).toBe('10:10')
    const optionValues = Array.from(timeSelect.options).map((option) => option.value)
    expect(optionValues).not.toContain('09:50')
    expect(optionValues).not.toContain('10:00')
    expect(optionValues).toContain('10:10')
  })

  it('opens request scheduling modal from route CTA without loading the generic client selector', async () => {
    openSlotsCalendarRoute({
      action: 'create-session',
      request_id: '29',
      client_name: 'Олександр Константінов',
      contact: 'alx@example.com',
      format: 'online',
    })
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByRole('dialog', { name: 'Створити сесію з цього запиту' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Створити сесію' })).not.toBeInTheDocument()
    expect(screen.getByText('Олександр Константінов')).toBeInTheDocument()
    expect(mockRouter.replace).toHaveBeenCalledWith({
      path: '/cabinet/slots',
      query: {
        request_id: '29',
        client_name: 'Олександр Константінов',
        contact: 'alx@example.com',
        format: 'online',
      },
    })
    expect(mockedApiGet).not.toHaveBeenCalledWith('/cabinet/client-records/')
    expect(mockedApiGet).not.toHaveBeenCalledWith('/cabinet/clients/')
  })

  it('lets one-off session date be selected from the date picker', async () => {
    openCalendarRoute()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))
    await flushAsyncUpdates()

    const dialog = await screen.findByRole('dialog', { name: 'Створити сесію' })
    const dateInput = within(dialog).getByLabelText('Дата') as HTMLInputElement
    expect(dateInput).toHaveAttribute('placeholder', 'ДД.ММ.РРРР')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Вибрати дату' }))

    const calendar = screen.getByRole('dialog', { name: 'Календар вибору дати' })
    await fireEvent.click(within(calendar).getByRole('button', { name: '13.03.2026' }))
    await flushAsyncUpdates()

    expect(dateInput.value).toBe('13.03.2026')
    const timeSelect = within(dialog).getByLabelText('Час початку') as HTMLSelectElement
    const optionValues = Array.from(timeSelect.options).map((option) => option.value)
    expect(optionValues).toContain('09:00')
  })

  it('normalizes one-off session time when selected date changes back to today', async () => {
    openCalendarRoute()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return [] as any
      if (url === '/cabinet/client-records/') return [manualClientRecord({ id: 71, display_name: 'Manual Regular' })] as any
      if (url === '/cabinet/clients/') return [] as any
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))
    await flushAsyncUpdates()

    const dateInput = await screen.findByLabelText('Дата') as HTMLInputElement
    const timeSelect = await screen.findByLabelText('Час початку') as HTMLSelectElement
    await fireEvent.update(dateInput, '13.03.2026')
    await fireEvent.update(timeSelect, '09:00')
    expect(timeSelect.value).toBe('09:00')

    await fireEvent.update(dateInput, '12.03.2026')
    await flushAsyncUpdates()

    expect(timeSelect.value).toBe('10:10')
    const optionValues = Array.from(timeSelect.options).map((option) => option.value)
    expect(optionValues).not.toContain('09:00')
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
    expect((await screen.findByLabelText('Дата') as HTMLInputElement).value).toBe('13.03.2026')
    const timeSelect = await screen.findByLabelText('Час початку') as HTMLSelectElement
    expect(timeSelect.tagName).toBe('SELECT')
    expect(timeSelect.value).toBe('10:00')
  })

  it('shows request scheduling banner and clears request query params when cancelled', async () => {
    openSlotsCalendarRoute({
      tab: 'calendar',
      request_id: '29',
      client_name: 'Олександр Константінов',
      contact: 'alx@example.com',
      format: 'offline',
      source: 'public_guest_request',
      kept: '1',
    })
    mockScheduleApi()

    renderView()
    await flushAsyncUpdates()

    expect(screen.getByText('Обираємо час для запиту: Олександр Константінов')).toBeInTheDocument()
    expect(screen.getByText(/Контакт: alx@example.com · Формат: офлайн/)).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати вибір запиту' }))
    await flushAsyncUpdates()

    expect(mockRouter.replace).toHaveBeenCalledWith({
      path: '/cabinet/slots',
      query: {
        tab: 'calendar',
        kept: '1',
      },
    })
  })

  it('opens and submits request scheduling from an empty calendar cell without selecting the first client', async () => {
    openSlotsCalendarRoute({
      request_id: '29',
      client_name: 'Олександр Константінов',
      contact: 'alx@example.com',
      format: 'offline',
    })
    mockScheduleApi()
    mockedCreateSessionFromGuestRequest.mockResolvedValue({
      request: {} as any,
      session: { id: 888 } as any,
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
    await fireEvent.click(fridayHitArea, { clientY: 100 })
    await flushAsyncUpdates()

    const dialog = screen.getByRole('dialog', { name: 'Створити сесію з цього запиту' })
    expect(screen.queryByRole('dialog', { name: 'Створити сесію' })).not.toBeInTheDocument()
    expect(within(dialog).getByText('Олександр Константінов')).toBeInTheDocument()
    expect(within(dialog).getByText('alx@example.com')).toBeInTheDocument()
    expect(within(dialog).getByText('13.03.2026')).toBeInTheDocument()
    expect(within(dialog).getByText('10:00–10:50')).toBeInTheDocument()
    expect(within(dialog).getByText('офлайн')).toBeInTheDocument()
    expect(mockedApiGet).not.toHaveBeenCalledWith('/cabinet/client-records/')
    expect(mockedApiGet).not.toHaveBeenCalledWith('/cabinet/clients/')

    await fireEvent.click(within(dialog).getByRole('button', { name: 'Створити сесію' }))
    await flushAsyncUpdates()

    expect(mockedCreateSessionFromGuestRequest).toHaveBeenCalledWith(29, {
      starts_at: expect.any(String),
      ends_at: expect.any(String),
      timezone: 'Europe/Kyiv',
      session_format: 'offline',
    })
    expect(mockedApiPost).not.toHaveBeenCalledWith(
      expect.stringContaining('/cabinet/client-records/'),
      expect.anything()
    )
    expect(mockToast.success).toHaveBeenCalledWith('Запит погоджено. Сесію створено.')
    expect(screen.queryByRole('dialog', { name: 'Створити сесію з цього запиту' })).not.toBeInTheDocument()
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

  it('shows public guest request context and create-session CTA for a selected available slot', async () => {
    openSlotsCalendarRoute({
      request_id: '9',
      client_name: 'Олександр Ко',
      contact: 'alx@example.com',
      format: 'online',
      source: 'public_guest_request',
    })
    mockScheduleApi([], [], [
      scheduleEventFromSlot({
        id: 901,
        start_at: '2026-03-13T09:00:00+02:00',
        end_at: '2026-03-13T09:50:00+02:00',
        is_booked: false,
      }),
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    await fireEvent.click(container.querySelector('.week-calendar .schedule-event--available') as HTMLButtonElement)
    await flushAsyncUpdates()

    const detailPanel = container.querySelector('.slot-detail-panel') as HTMLElement
    expect(within(detailPanel).getByText('Запит для цього часу')).toBeInTheDocument()
    expect(within(detailPanel).getByText('Олександр Ко')).toBeInTheDocument()
    expect(within(detailPanel).getByText('alx@example.com')).toBeInTheDocument()
    expect(within(detailPanel).getByText('онлайн')).toBeInTheDocument()
    expect(within(detailPanel).getByRole('button', { name: 'Створити сесію на цей час' })).toBeInTheDocument()
    expect(within(detailPanel).getByRole('link', { name: 'Повернутися до запиту' })).toHaveAttribute(
      'href',
      '/cabinet/external-sessions#guest-requests'
    )
  })

  it('keeps available-slot details unchanged when there is no public guest request context', async () => {
    openSlotsCalendarRoute()
    mockScheduleApi([], [], [
      scheduleEventFromSlot({
        id: 902,
        start_at: '2026-03-13T09:00:00+02:00',
        end_at: '2026-03-13T09:50:00+02:00',
        is_booked: false,
      }),
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    await fireEvent.click(container.querySelector('.week-calendar .schedule-event--available') as HTMLButtonElement)
    await flushAsyncUpdates()

    const detailPanel = container.querySelector('.slot-detail-panel') as HTMLElement
    expect(within(detailPanel).getByText('Керування')).toBeInTheDocument()
    expect(
      within(detailPanel).getByText('Керувати вікнами можна у вкладці “Вікна для запису”.')
    ).toBeInTheDocument()
    expect(within(detailPanel).queryByRole('button', { name: 'Створити сесію на цей час' })).not.toBeInTheDocument()
  })

  it('opens a confirmation modal for creating a session from the selected request slot', async () => {
    openSlotsCalendarRoute({
      request_id: '9',
      client_name: 'Олександр Ко',
      contact: 'alx@example.com',
      format: 'online',
      source: 'public_guest_request',
    })
    mockScheduleApi([], [], [
      scheduleEventFromSlot({
        id: 903,
        start_at: '2026-03-13T09:00:00+02:00',
        end_at: '2026-03-13T09:50:00+02:00',
        is_booked: false,
      }),
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    await fireEvent.click(container.querySelector('.week-calendar .schedule-event--available') as HTMLButtonElement)
    await flushAsyncUpdates()
    const detailPanel = container.querySelector('.slot-detail-panel') as HTMLElement
    await fireEvent.click(within(detailPanel).getByRole('button', { name: 'Створити сесію на цей час' }))
    await flushAsyncUpdates()

    const dialog = screen.getByRole('dialog', { name: 'Створити сесію з цього запиту' })
    expect(within(dialog).getByText('Олександр Ко')).toBeInTheDocument()
    expect(within(dialog).getByText('alx@example.com')).toBeInTheDocument()
    expect(within(dialog).getByText('13.03.2026')).toBeInTheDocument()
    expect(within(dialog).getByText('09:00–09:50')).toBeInTheDocument()
    expect(within(dialog).getByText('онлайн')).toBeInTheDocument()
    expect(mockedCreateSessionFromGuestRequest).not.toHaveBeenCalled()
  })

  it('submits selected available-slot time through existing guest request create-session API', async () => {
    openSlotsCalendarRoute({
      request_id: '9',
      client_name: 'Олександр Ко',
      contact: 'alx@example.com',
      format: 'online',
      source: 'public_guest_request',
    })
    mockScheduleApi([], [], [
      scheduleEventFromSlot({
        id: 904,
        start_at: '2026-03-13T09:00:00+02:00',
        end_at: '2026-03-13T09:50:00+02:00',
        is_booked: false,
      }),
    ])
    mockedCreateSessionFromGuestRequest.mockResolvedValue({
      request: {} as any,
      session: { id: 777 } as any,
    })

    const { container } = renderView()
    await flushAsyncUpdates()

    await fireEvent.click(container.querySelector('.week-calendar .schedule-event--available') as HTMLButtonElement)
    await flushAsyncUpdates()
    const detailPanel = container.querySelector('.slot-detail-panel') as HTMLElement
    await fireEvent.click(within(detailPanel).getByRole('button', { name: 'Створити сесію на цей час' }))
    await flushAsyncUpdates()

    const dialog = screen.getByRole('dialog', { name: 'Створити сесію з цього запиту' })
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Створити сесію' }))
    await flushAsyncUpdates()

    expect(mockedCreateSessionFromGuestRequest).toHaveBeenCalledWith(9, {
      starts_at: '2026-03-13T09:00:00+02:00',
      ends_at: '2026-03-13T09:50:00+02:00',
      timezone: 'Europe/Kyiv',
      session_format: 'online',
    })
    expect(mockedApiPost).not.toHaveBeenCalledWith(
      expect.stringContaining('/cabinet/client-records/'),
      expect.anything()
    )
    expect(mockToast.success).toHaveBeenCalledWith('Запит погоджено. Сесію створено.')
    expect(
      screen.getAllByText('Наступний крок: перевірте деталі сесії та підтвердьте її готовність. Оплата має окремий статус.').length
    ).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Перевірити деталі сесії' })[0]).toHaveAttribute(
      'href',
      '/cabinet/sessions/777'
    )
    expect(screen.queryByRole('dialog', { name: 'Створити сесію з цього запиту' })).not.toBeInTheDocument()
  })

  it('does not show guest request CTA when request_id is invalid or missing', async () => {
    openSlotsCalendarRoute({
      request_id: 'not-a-number',
      client_name: 'Олександр Ко',
      contact: 'alx@example.com',
      format: 'online',
      source: 'public_guest_request',
    })
    mockScheduleApi([], [], [
      scheduleEventFromSlot({
        id: 905,
        start_at: '2026-03-13T09:00:00+02:00',
        end_at: '2026-03-13T09:50:00+02:00',
        is_booked: false,
      }),
    ])

    const { container, unmount } = renderView()
    await flushAsyncUpdates()
    await fireEvent.click(container.querySelector('.week-calendar .schedule-event--available') as HTMLButtonElement)
    await flushAsyncUpdates()
    expect(screen.queryByRole('button', { name: 'Створити сесію на цей час' })).not.toBeInTheDocument()
    unmount()

    openSlotsCalendarRoute({ source: 'public_guest_request' })
    mockScheduleApi([], [], [
      scheduleEventFromSlot({
        id: 906,
        start_at: '2026-03-13T09:00:00+02:00',
        end_at: '2026-03-13T09:50:00+02:00',
        is_booked: false,
      }),
    ])
    const rendered = renderView()
    await flushAsyncUpdates()
    await fireEvent.click(rendered.container.querySelector('.week-calendar .schedule-event--available') as HTMLButtonElement)
    await flushAsyncUpdates()
    expect(screen.queryByRole('button', { name: 'Створити сесію на цей час' })).not.toBeInTheDocument()
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

  it('normalizes past one-off session date before submit', async () => {
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
    const dateInput = await screen.findByLabelText('Дата') as HTMLInputElement
    const timeSelect = await screen.findByLabelText('Час початку') as HTMLSelectElement
    await fireEvent.update(dateInput, '01.01.2000')
    await flushAsyncUpdates()
    expect(dateInput.value).toBe('12.03.2026')
    expect(timeSelect.value).toBe('10:10')
    await fireEvent.update(await screen.findByLabelText('Тривалість'), '50')
    const submitButtons = screen.getAllByRole('button', { name: 'Створити сесію' })
    await fireEvent.click(submitButtons[submitButtons.length - 1] as HTMLButtonElement)
    await flushAsyncUpdates()

    const createCall = mockedApiPost.mock.calls.find(
      (call) => call[0] === '/cabinet/client-records/71/sessions/'
    )
    expect(createCall).toBeTruthy()
    expect(String((createCall?.[1] as Record<string, unknown>).starts_at)).toContain('08:10:00.000Z')
    expect(screen.queryByText('Неможливо створити сесію в минулому. Оберіть майбутню дату або час.')).not.toBeInTheDocument()
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
        type: 'booked_slot',
        id: 'pending-requests-slot-93',
        slot_id: 93,
        session_id: null,
        start_at: '2026-03-12T08:30:00Z',
        end_at: '2026-03-12T09:20:00Z',
        status: 'pending',
        title: 'Запит на сесію',
        client_display_name: null,
        client_kind: null,
        requests_count: 1,
        request_ids: [301],
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

    expect(container.querySelectorAll('.week-calendar .schedule-event')).toHaveLength(4)
    expect(screen.queryByText('guest@example.com')).not.toBeInTheDocument()
    expect(screen.queryByText('+380991112233')).not.toBeInTheDocument()
    expect(screen.queryByText('olena@example.com')).not.toBeInTheDocument()

    const mobileSchedule = container.querySelector('.mobile-day-schedule') as HTMLElement | null
    expect(mobileSchedule).toBeInstanceOf(HTMLElement)
    expect(within(mobileSchedule as HTMLElement).getByText('Події тижня')).toBeInTheDocument()
    expect((mobileSchedule as HTMLElement).querySelectorAll('.mobile-schedule-event')).toHaveLength(4)
    expect(within(mobileSchedule as HTMLElement).getAllByText(/Вікно для запису/).length).toBeGreaterThan(0)
    expect(within(mobileSchedule as HTMLElement).getAllByText(/Сесія/).length).toBeGreaterThan(0)
    expect(within(mobileSchedule as HTMLElement).getAllByText(/Запит/).length).toBeGreaterThan(0)
    expect(within(mobileSchedule as HTMLElement).queryByRole('link', { name: 'Відкрити сесію' })).not.toBeInTheDocument()
    const availableMobileEvent = (mobileSchedule as HTMLElement).querySelector(
      '.mobile-schedule-event.schedule-event--available'
    ) as HTMLElement | null
    const bookedMobileEvent = (mobileSchedule as HTMLElement).querySelector(
      '.mobile-schedule-event.schedule-event--booked'
    ) as HTMLElement | null
    const sessionMobileEvents = (mobileSchedule as HTMLElement).querySelectorAll(
      '.mobile-schedule-event.calendar-session'
    )
    const sessionMobileEvent = sessionMobileEvents[1] as HTMLElement | undefined
    const bookedSessionMobileEvent = sessionMobileEvents[0] as HTMLElement | undefined
    expect(bookedSessionMobileEvent).toBeInstanceOf(HTMLElement)
    expect(within(bookedSessionMobileEvent as HTMLElement).getByText(/Сесія/)).toBeInTheDocument()
    expect(within(bookedSessionMobileEvent as HTMLElement).queryByText('Заброньовано')).not.toBeInTheDocument()
    expect(availableMobileEvent).toBeInstanceOf(HTMLElement)
    expect(bookedMobileEvent).toBeInstanceOf(HTMLElement)
    expect(sessionMobileEvent).toBeInstanceOf(HTMLElement)

    await fireEvent.click(within(availableMobileEvent as HTMLElement).getByRole('button'))
    await flushAsyncUpdates()
    expect(within(availableMobileEvent as HTMLElement).getByText('Керування')).toBeInTheDocument()
    expect(
      within(availableMobileEvent as HTMLElement).getByText('Керувати вікнами можна у вкладці “Вікна для запису”.')
    ).toBeInTheDocument()
    expect(within(availableMobileEvent as HTMLElement).queryByRole('link', { name: 'Відкрити сесію' })).not.toBeInTheDocument()

    await fireEvent.click(within(bookedSessionMobileEvent as HTMLElement).getByRole('button'))
    await flushAsyncUpdates()
    expect(within(bookedSessionMobileEvent as HTMLElement).getByText('Підтверджено')).toBeInTheDocument()
    expect(within(bookedSessionMobileEvent as HTMLElement).getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute(
      'href',
      '/cabinet/sessions/502'
    )

    await fireEvent.click(within(bookedMobileEvent as HTMLElement).getByRole('button'))
    await flushAsyncUpdates()
    expect(within(bookedMobileEvent as HTMLElement).getAllByText('Запит на сесію').length).toBeGreaterThan(0)
    expect(within(bookedMobileEvent as HTMLElement).getByText('Очікує підтвердження')).toBeInTheDocument()
    expect(within(bookedMobileEvent as HTMLElement).queryByText('Гостьовий клієнт')).not.toBeInTheDocument()
    expect(within(bookedMobileEvent as HTMLElement).queryByRole('link', { name: 'Відкрити сесію' })).not.toBeInTheDocument()
    expect(within(bookedMobileEvent as HTMLElement).getByRole('link', { name: 'Переглянути запити' })).toHaveAttribute(
      'href',
      '/cabinet/external-sessions?request_ids=301#guest-requests'
    )

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

    const calendarSessionEvents = container.querySelectorAll('.week-calendar .calendar-session')
    await fireEvent.click(calendarSessionEvents[0] as HTMLButtonElement)
    await flushAsyncUpdates()
    expect(within(detailPanel).getByText('Деталі сесії')).toBeInTheDocument()
    expect(within(detailPanel).getByText('Підтверджено')).toBeInTheDocument()
    expect(within(detailPanel).getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute('href', '/cabinet/sessions/502')

    await fireEvent.click(container.querySelector('.week-calendar .schedule-event--booked') as HTMLButtonElement)
    await flushAsyncUpdates()
    expect(within(detailPanel).getByRole('heading', { name: 'Запит на сесію' })).toBeInTheDocument()
    expect(within(detailPanel).getByText('Очікує підтвердження')).toBeInTheDocument()
    expect(within(detailPanel).queryByText('Гостьовий клієнт')).not.toBeInTheDocument()
    expect(within(detailPanel).queryByRole('link', { name: 'Відкрити сесію' })).not.toBeInTheDocument()
    expect(within(detailPanel).getByRole('link', { name: 'Переглянути запити' })).toHaveAttribute(
      'href',
      '/cabinet/external-sessions?request_ids=301#guest-requests'
    )

    await fireEvent.click(calendarSessionEvents[1] as HTMLButtonElement)
    await flushAsyncUpdates()
    expect(within(detailPanel).getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute('href', '/cabinet/sessions/503')

    await fireEvent.click(screen.getByRole('button', { name: 'Незайняті' }))
    await flushAsyncUpdates()
    expect(container.querySelectorAll('.week-calendar .schedule-event')).toHaveLength(1)
    expect(container.querySelector('.week-calendar .schedule-event--available')).toBeInTheDocument()
    expect((mobileSchedule as HTMLElement).querySelectorAll('.mobile-schedule-event')).toHaveLength(1)
    expect((mobileSchedule as HTMLElement).querySelector('.mobile-schedule-event.schedule-event--available')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Запити' }))
    await flushAsyncUpdates()
    expect(container.querySelectorAll('.week-calendar .schedule-event')).toHaveLength(1)
    expect(container.querySelector('.week-calendar .schedule-event--booked')).toBeInTheDocument()
    expect((mobileSchedule as HTMLElement).querySelectorAll('.mobile-schedule-event')).toHaveLength(1)
    expect((mobileSchedule as HTMLElement).querySelector('.mobile-schedule-event.schedule-event--booked')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Сесії' }))
    await flushAsyncUpdates()
    expect(container.querySelectorAll('.week-calendar .schedule-event')).toHaveLength(2)
    expect(container.querySelector('.week-calendar .schedule-event--booked')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.week-calendar .calendar-session')).toHaveLength(2)
    expect((mobileSchedule as HTMLElement).querySelectorAll('.mobile-schedule-event')).toHaveLength(2)
  })

  it('does not show mobile inline session link when selected schedule event has no session id', async () => {
    openCalendarRoute()
    mockScheduleApi([], [], [
      {
        type: 'booked_slot',
        id: 'pending-requests-slot-no-session',
        slot_id: 94,
        session_id: null,
        start_at: '2026-03-12T10:00:00Z',
        end_at: '2026-03-12T10:50:00Z',
        status: 'pending',
        title: 'Запити на сесію',
        client_display_name: null,
        client_kind: null,
        requests_count: 2,
        request_ids: [301, 302],
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

    expect(within(mobileEvent as HTMLElement).getAllByText('Запити · 2').length).toBeGreaterThan(0)
    expect(within(mobileEvent as HTMLElement).getByText('Очікує підтвердження')).toBeInTheDocument()
    expect(within(mobileEvent as HTMLElement).queryByText('Заброньовано')).not.toBeInTheDocument()
    expect(within(mobileEvent as HTMLElement).queryByRole('link', { name: 'Відкрити сесію' })).not.toBeInTheDocument()
    expect(within(mobileEvent as HTMLElement).getByRole('link', { name: 'Переглянути запити' })).toHaveAttribute(
      'href',
      '/cabinet/external-sessions?request_ids=301,302#guest-requests'
    )
    expect(screen.queryByText('+380991112233')).not.toBeInTheDocument()
    expect(screen.queryByText('https://meet.example/private')).not.toBeInTheDocument()
    expect(screen.queryByText('Private room')).not.toBeInTheDocument()
  })

  it.each([
    [0, 'незайнятих'],
    [1, 'незайняте'],
    [2, 'незайняті'],
    [3, 'незайняті'],
    [4, 'незайняті'],
    [5, 'незайнятих'],
    [11, 'незайнятих'],
    [21, 'незайняте'],
    [22, 'незайняті'],
    [25, 'незайнятих'],
  ] as const)('uses the Ukrainian summary form for %i unoccupied windows', async (count, form) => {
    openAvailabilityRoute()
    const start = Date.parse('2026-03-12T09:00:00Z')
    mockScheduleApi([
      ...Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        start_at: new Date(start + index * 30 * 60_000).toISOString(),
        end_at: new Date(start + (index * 30 + 20) * 60_000).toISOString(),
        is_booked: false,
      })),
      { id: 100, start_at: '2026-03-13T09:00:00Z', end_at: '2026-03-13T09:50:00Z', is_booked: true },
    ])
    renderView()
    await flushAsyncUpdates()

    expect(screen.getByText(`${count} ${form} · 1 заброньовано`)).toBeInTheDocument()
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
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()

    expect(screen.getByText('1 незайняте · 1 заброньовано')).toBeInTheDocument()
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
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()

    const shortBlock = container.querySelector('.week-calendar .calendar-slot[aria-label="Вікно для запису 11:00–11:50"]') as HTMLElement | null
    const longBlock = container.querySelector('.week-calendar .calendar-slot[aria-label="Вікно для запису 13:00–15:00"]') as HTMLElement | null

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
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()

    const block = container.querySelector('.week-calendar .calendar-slot')
    expect(block).toBeInstanceOf(HTMLElement)
    const mobileSchedule = container.querySelector('.mobile-day-schedule') as HTMLElement | null
    expect(mobileSchedule).toBeInstanceOf(HTMLElement)
    expect((mobileSchedule as HTMLElement).querySelector('.mobile-day-group')).not.toBeInTheDocument()
    expect((mobileSchedule as HTMLElement).querySelector('.mobile-slot')).toBeInTheDocument()
    await fireEvent.click(block as HTMLElement)

    expect(screen.getByText('Деталі вікна для запису')).toBeInTheDocument()
    expect(screen.getAllByText('11:00–11:50').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Редагувати вікно' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Видалити вікно' })).toBeEnabled()
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
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()

    const block = container.querySelector('.week-calendar .calendar-slot')
    expect(block).toHaveClass('slot-status--booked')
    await fireEvent.click(block as HTMLElement)

    expect(screen.getByText('Це вікно вже заброньовано. Даних для переходу до сесії в поточному payload немає.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Редагувати вікно' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Видалити вікно' })).toBeDisabled()
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
    await fireEvent.click(container.querySelector('.week-calendar .calendar-slot[aria-label="Вікно для запису 11:00–11:50"]') as HTMLElement)
    await fireEvent.click(screen.getByRole('button', { name: 'Видалити вікно' }))
    const confirmOptions = mockConfirmModal.openConfirm.mock.calls.at(-1)?.[0]
    await confirmOptions?.onConfirm?.()
    await flushAsyncUpdates()

    expect(mockedApiDelete).toHaveBeenCalledWith('/cabinet/slots/34/')
    expect(mockedApiDelete).not.toHaveBeenCalledWith('/cabinet/slots/35/')
    expect(screen.getByRole('button', { name: 'Усі' })).toHaveClass('btn--active')
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Вікно для запису 11:00–11:50"]')).not.toBeInTheDocument()
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
      title: 'Видалити вікна для запису?',
      confirmText: 'Видалити вибрані',
    }))
    expect(confirmOptions?.message).toContain('Буде видалено 2 вікон для запису.')
    expect(confirmOptions?.message).toContain('Заброньовані сесії не буде змінено.')

    await confirmOptions?.onConfirm?.()
    await flushAsyncUpdates()

    expect(mockedApiDelete).toHaveBeenCalledWith('/cabinet/slots/51/')
    expect(mockedApiDelete).toHaveBeenCalledWith('/cabinet/slots/52/')
    expect(mockedApiDelete).not.toHaveBeenCalledWith('/cabinet/slots/53/')
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Вікно для запису 11:00–11:50"]')).not.toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Вікно для запису 12:00–12:50"]')).not.toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Заброньовано 13:00–13:50"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Усі' })).toHaveClass('btn--active')
    expect(screen.queryByText('Вибрано: 2')).not.toBeInTheDocument()
    expect(mockToast.success).toHaveBeenCalledWith('Вікна для запису видалено.')
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
    await fireEvent.click(screen.getByRole('button', { name: 'Заброньовано' }))
    expect(screen.getByRole('button', { name: 'Заброньовано' })).toHaveClass('btn--active')

    await fireEvent.click(screen.getByRole('button', { name: 'Очистити тиждень' }))
    const confirmOptions = mockConfirmModal.openConfirm.mock.calls.at(-1)?.[0]
    expect(confirmOptions).toEqual(expect.objectContaining({
      title: 'Очистити тиждень від вікон для запису?',
      confirmText: 'Очистити тиждень',
    }))
    expect(confirmOptions?.message).toContain('Буде видалено всі доступні незаброньовані вікна для запису цього тижня.')
    expect(confirmOptions?.message).toContain('Заброньовані сесії не буде змінено.')

    await confirmOptions?.onConfirm?.()
    await flushAsyncUpdates()

    expect(mockedApiDelete).toHaveBeenCalledTimes(1)
    expect(mockedApiDelete).toHaveBeenCalledWith('/cabinet/slots/61/')
    expect(mockedApiDelete).not.toHaveBeenCalledWith('/cabinet/slots/62/')
    expect(mockedApiDelete).not.toHaveBeenCalledWith('/cabinet/slots/63/')
    expect(screen.getByRole('button', { name: 'Заброньовано' })).toHaveClass('btn--active')
    expect(mockToast.success).toHaveBeenCalledWith('Вікна для запису видалено.')
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
    expect(screen.getByText('1 незайняте · 1 заброньовано')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Очистити тиждень' }))
    const confirmOptions = mockConfirmModal.openConfirm.mock.calls.at(-1)?.[0]
    await confirmOptions?.onConfirm?.()
    await flushAsyncUpdates()

    expect(mockedApiDelete).toHaveBeenCalledWith('/cabinet/slots/64/')
    expect(mockedApiDelete).not.toHaveBeenCalledWith('/cabinet/slots/65/')
    expect(screen.getByRole('button', { name: 'Усі' })).toHaveClass('btn--active')
    expect(screen.getByText('0 незайнятих · 1 заброньовано')).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Вікно для запису 11:00–11:50"]')).not.toBeInTheDocument()
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
    expect(mockToast.error).toHaveBeenCalledWith('Не вдалося видалити вікна для запису. Оновіть сторінку і спробуйте ще раз.')
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
    expect(screen.queryByText('На цьому тижні ще немає вікон для запису.')).not.toBeInTheDocument()
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
    expect(within(detailPanel).getByText('Деталі сесії')).toBeInTheDocument()
    expect(within(detailPanel).getByText('Саша Мальована')).toBeInTheDocument()
    expect(within(detailPanel).getByText('09:00–09:50')).toBeInTheDocument()
    expect(within(detailPanel).getByText('Заплановано')).toBeInTheDocument()
    expect(
      within(detailPanel).getByRole('link', { name: 'Відкрити сесію' })
    ).toHaveAttribute('href', '/cabinet/sessions/78')
  })

  it('renders completed past session as muted archive event with read-only details', async () => {
    openCalendarRoute()
    mockScheduleApi([], [
      scheduleSession({
        id: 178,
        status: 'COMPLETED',
        slot_start_at: '2026-03-10T07:00:00Z',
        slot_end_at: '2026-03-10T07:50:00Z',
      }),
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    const sessionBlock = container.querySelector('.week-calendar .calendar-session') as HTMLButtonElement | null
    expect(sessionBlock).toBeInstanceOf(HTMLButtonElement)
    expect(sessionBlock).toHaveClass('schedule-event--archived')
    expect(sessionBlock).toHaveAttribute('aria-label', 'Завершено · Саша Мальована · 09:00–09:50')
    expect(within(sessionBlock as HTMLElement).getByText('Завершено')).toBeInTheDocument()
    expect(within(sessionBlock as HTMLElement).queryByText('Завершена сесія')).not.toBeInTheDocument()

    const mobileEvent = container.querySelector('.mobile-schedule-event.schedule-event--archived') as HTMLElement | null
    expect(mobileEvent).toBeInstanceOf(HTMLElement)
    expect(within(mobileEvent as HTMLElement).getByText(/Завершено/)).toBeInTheDocument()
    expect(within(mobileEvent as HTMLElement).queryByText(/Завершена сесія/)).not.toBeInTheDocument()

    await fireEvent.click(sessionBlock as HTMLButtonElement)

    const detailPanel = container.querySelector('.slot-detail-panel') as HTMLElement
    expect(within(detailPanel).getByText('Деталі сесії')).toBeInTheDocument()
    expect(within(detailPanel).getByText('Завершена сесія')).toBeInTheDocument()
    expect(within(detailPanel).getByText('Завершено')).toBeInTheDocument()
    expect(within(detailPanel).getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute('href', '/cabinet/sessions/178')
    expect(within(detailPanel).queryByRole('button', { name: 'Створити сесію на цей час' })).not.toBeInTheDocument()
    expect(within(detailPanel).queryByRole('button', { name: /Перенести|Скасувати/ })).not.toBeInTheDocument()
  })

  it('renders future session normally without archive styling', async () => {
    openCalendarRoute()
    mockScheduleApi([], [
      scheduleSession({
        id: 179,
        status: 'CONFIRMED',
        slot_start_at: '2026-03-12T07:00:00Z',
        slot_end_at: '2026-03-12T07:50:00Z',
      }),
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    const sessionBlock = container.querySelector('.week-calendar .calendar-session') as HTMLButtonElement | null
    expect(sessionBlock).toBeInstanceOf(HTMLButtonElement)
    expect(sessionBlock).not.toHaveClass('schedule-event--archived')
    expect(within(sessionBlock as HTMLElement).getByText('Сесія')).toBeInTheDocument()
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

  it('does not render past availability windows by default', async () => {
    openAvailabilityRoute()
    mockScheduleApi([
      {
        id: 188,
        start_at: '2026-03-10T07:00:00Z',
        end_at: '2026-03-10T07:50:00Z',
        is_booked: false,
      },
    ])

    const { container } = renderView()
    await flushAsyncUpdates()

    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Вікно для запису 09:00–09:50"]')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'На цьому тижні ще немає вікон для запису' })).not.toBeInTheDocument()
    expect(screen.getByText('Усі вікна цього тижня вже минули.')).toBeInTheDocument()
    expect(screen.queryByText('На цьому тижні ще немає вікон для запису.')).not.toBeInTheDocument()
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
    expect(screen.getByRole('heading', { name: 'Додати вікно для запису' })).toBeInTheDocument()
    expect(screen.getByText('Цей проміжок клієнти зможуть обрати для прямого запису у вашому публічному профілі.')).toBeInTheDocument()
    expect(screen.getByText('Дата')).toBeInTheDocument()
    expect(screen.getByText('Час початку')).toBeInTheDocument()
    expect(screen.getByText('Тривалість')).toBeInTheDocument()
    expect(dateInput).toHaveAttribute('type', 'text')
    expect(dateInput).toHaveAttribute('placeholder', 'дд.мм.рррр')
    expect(dateInput.value).toBe('12.03.2026')
    expect(screen.getByText('Буде створено вікно: 12.03.2026, 09:00–09:50')).toBeInTheDocument()
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
    expect(screen.getByText('Буде створено вікно: 15.05.2026, 09:30–10:15')).toBeInTheDocument()
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
    expect(screen.queryByRole('heading', { name: 'Додати вікно для запису' })).not.toBeInTheDocument()

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
    expect(screen.getByText('Буде створено вікно: 14.05.2026, 09:00–09:50')).toBeInTheDocument()

    await fireEvent.update(timeInput, '10:15')
    expect(screen.getByText('Буде створено вікно: 14.05.2026, 10:15–11:05')).toBeInTheDocument()

    await fireEvent.update(durationInput, '30')
    expect(screen.getByText('Буде створено вікно: 14.05.2026, 10:15–10:45')).toBeInTheDocument()
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

  it('opens smart fill modal with defaults instead of calling the old fill-week endpoint', async () => {
    mockScheduleApi()

    const { container } = renderView()
    await flushAsyncUpdates()

    for (let index = 0; index < 11; index += 1) {
      await fireEvent.click(screen.getByRole('button', { name: 'Наступний тиждень' }))
    }
    expect(screen.getByText('25.05.2026 - 31.05.2026')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()

    const opener = getAvailabilityPrimaryAction()
    expect(opener.closest('.availability-action-panel')).toBeInTheDocument()
    expect(opener.closest('.schedule-toolbar')).not.toBeInTheDocument()
    expect(container.querySelector('.day-list:not(.day-list--mobile)')).not.toBeInTheDocument()
    expect(container.querySelector('.day-list--mobile')).toBeInTheDocument()
    expect(container.querySelectorAll('.week-calendar .calendar-day-header')).toHaveLength(7)

    await fireEvent.click(opener)
    await flushAsyncUpdates()

    expect(mockedApiPost).not.toHaveBeenCalled()
    expect(mockConfirmModal.openConfirm).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog', { name: 'Створити вікна для запису' })
    expect(dialog).toBeInTheDocument()
    expect(dialog.querySelector('.smart-fill-modal')).toBeInTheDocument()
    for (const index of [0, 1, 2, 3, 4]) {
      const weekday = within(dialog).getByTestId(`fill-weekday-${index}`)
      expect(weekday).toHaveAttribute('aria-pressed', 'true')
      expect(weekday).toHaveAttribute('data-selected', 'true')
      expect(weekday).toHaveClass('fill-availability-day--selected')
    }
    for (const index of [5, 6]) {
      const weekday = within(dialog).getByTestId(`fill-weekday-${index}`)
      expect(weekday).toHaveAttribute('aria-pressed', 'false')
      expect(weekday).toHaveAttribute('data-selected', 'false')
      expect(weekday).not.toHaveClass('fill-availability-day--selected')
    }
    expect(within(dialog).getByLabelText('Початок робочого дня')).toHaveValue('09:00')
    expect(within(dialog).getByLabelText('Кінець робочого дня')).toHaveValue('18:00')
    expect(within(dialog).getByLabelText('Тривалість вікна')).toHaveValue('50')
    expect(within(dialog).getByLabelText('Перерва між вікнами')).toHaveValue('10')
    expect(within(dialog).getByLabelText('Кількість тижнів')).toHaveValue(1)
    const preview = within(dialog).getByTestId('fill-availability-preview')
    const footer = dialog.querySelector('.slot-form__actions')
    const submitButton = within(dialog).getByRole('button', { name: 'Створити вікна для запису' })
    expect(footer).toBeInTheDocument()
    expect(submitButton).toBeInTheDocument()
    expect(preview).toHaveTextContent('5')
    expect(preview).toHaveTextContent('9')
    expect(preview).toHaveTextContent('45')
    await fireEvent.update(within(dialog).getByLabelText('Кількість тижнів'), '5')
    expect(within(dialog).getByTestId('fill-availability-preview')).toBe(preview)
    expect(dialog.querySelector('.slot-form__actions')).toBe(footer)
    expect(submitButton).toBeInTheDocument()
    expect(preview).toHaveTextContent('5')
    expect(preview).toHaveTextContent('225')
    await fireEvent.update(within(dialog).getByLabelText('Перерва між вікнами'), '0')
    expect(within(dialog).getByTestId('fill-availability-preview')).toBe(preview)
    expect(dialog.querySelector('.slot-form__actions')).toBe(footer)
    expect(preview).toHaveTextContent('10')
    expect(preview).toHaveTextContent('250')
  })

  it('submits smart fill settings with project weekday values and reloads visible week', async () => {
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
      if (url === '/cabinet/slots/fill/') {
        slotsReloaded = true
        return {
          created_count: 1,
          skipped_count: 2,
          date_from: '2026-03-09',
          date_to: '2026-03-15',
          weeks: 1,
        } as any
      }
      throw new Error(`Unexpected apiPost call: ${url}`)
    })

    const { container } = renderView()
    await flushAsyncUpdates()

    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()
    expect(screen.getByRole('button', { name: 'Усі' })).toHaveClass('btn--active')
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Вікно для запису 13:00–13:50"]')).not.toBeInTheDocument()

    await fireEvent.click(getAvailabilityPrimaryAction())
    await flushAsyncUpdates()
    const dialog = screen.getByRole('dialog', { name: 'Створити вікна для запису' })
    await fireEvent.click(within(dialog).getByTestId('fill-weekday-1'))
    await fireEvent.click(within(dialog).getByTestId('fill-weekday-3'))
    await fireEvent.click(within(dialog).getByTestId('fill-weekday-4'))
    await fireEvent.click(within(dialog).getByTestId('fill-weekday-5'))
    await fireEvent.click(within(dialog).getByTestId('fill-weekday-6'))
    for (const index of [0, 2, 5, 6]) {
      expect(within(dialog).getByTestId(`fill-weekday-${index}`)).toHaveAttribute('data-selected', 'true')
    }
    for (const index of [1, 3, 4]) {
      expect(within(dialog).getByTestId(`fill-weekday-${index}`)).toHaveAttribute('data-selected', 'false')
    }
    await fireEvent.update(within(dialog).getByLabelText('Початок робочого дня'), '09:10')
    await fireEvent.update(within(dialog).getByLabelText('Кінець робочого дня'), '12:20')
    await fireEvent.update(within(dialog).getByLabelText('Тривалість вікна'), '40')
    await fireEvent.update(within(dialog).getByLabelText('Перерва між вікнами'), '20')
    await fireEvent.update(within(dialog).getByLabelText('Кількість тижнів'), '12')
    const preview = within(dialog).getByTestId('fill-availability-preview')
    expect(preview).toHaveTextContent('4')
    expect(preview).toHaveTextContent('12')
    expect(preview).toHaveTextContent('144')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Створити вікна для запису' }))
    await flushAsyncUpdates()

    expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/slots/fill/', {
      date_from: '2026-03-09',
      weeks: 12,
      weekdays: [0, 2, 5, 6],
      start_time: '09:10',
      end_time: '12:20',
      slot_duration_minutes: 40,
      break_minutes: 20,
    })
    expect(screen.queryByRole('dialog', { name: 'Створити вікна для запису' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Вікна для запису' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('09.03.2026 - 15.03.2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Усі' })).toHaveClass('btn--active')
    expect(screen.getByRole('button', { name: 'Незайняті' })).not.toHaveClass('btn--active')
    expect(screen.getByRole('button', { name: 'Заброньовано' })).not.toHaveClass('btn--active')
    expect(screen.getByText('1 незайняте · 1 заброньовано')).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Вікно для запису 13:00–13:50"]')).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Заброньовано 11:00–11:50"]')).toBeInTheDocument()
    expect(mockToast.success).toHaveBeenCalledWith('Створено 1 вікон для запису. Пропущено 2.')
  })

  it('blocks invalid smart fill form submissions before calling backend', async () => {
    mockScheduleApi()
    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()

    await fireEvent.click(getAvailabilityPrimaryAction())
    await flushAsyncUpdates()
    const dialog = screen.getByRole('dialog', { name: 'Створити вікна для запису' })

    for (const label of ['Пн', 'Вт', 'Ср', 'Чт', 'Пт']) {
      await fireEvent.click(within(dialog).getByRole('button', { name: label }))
    }
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Створити вікна для запису' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Оберіть хоча б один день тижня.')
    expect(mockedApiPost).not.toHaveBeenCalled()

    await fireEvent.click(within(dialog).getByRole('button', { name: 'Пн' }))
    await fireEvent.update(within(dialog).getByLabelText('Початок робочого дня'), '18:00')
    await fireEvent.update(within(dialog).getByLabelText('Кінець робочого дня'), '09:00')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Створити вікна для запису' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Кінець робочого дня має бути пізніше за початок.')
    expect(mockedApiPost).not.toHaveBeenCalled()

    await fireEvent.update(within(dialog).getByLabelText('Початок робочого дня'), '09:00')
    await fireEvent.update(within(dialog).getByLabelText('Кінець робочого дня'), '10:00')
    await fireEvent.update(within(dialog).getByLabelText('Кількість тижнів'), '13')
    await fireEvent.submit(dialog.querySelector('form') as HTMLFormElement)
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Кількість тижнів має бути від 1 до 12.')
    expect(mockedApiPost).not.toHaveBeenCalled()

    await fireEvent.update(within(dialog).getByLabelText('Кількість тижнів'), '1')
    await fireEvent.update(within(dialog).getByLabelText('Кінець робочого дня'), '09:30')
    await fireEvent.update(within(dialog).getByLabelText('Тривалість вікна'), '60')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Створити вікна для запису' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Діапазон робочого дня має вміщувати хоча б одне вікно.')
    expect(mockedApiPost).not.toHaveBeenCalled()
  })

  it('shows neutral message when smart fill creates nothing but skips conflicts', async () => {
    mockScheduleApi()
    mockedApiPost.mockResolvedValue({
      created_count: 0,
      skipped_count: 3,
      date_from: '2026-03-09',
      date_to: '2026-03-15',
      weeks: 1,
    } as any)

    renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()

    await fireEvent.click(getAvailabilityPrimaryAction())
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('dialog', { name: 'Створити вікна для запису' }).querySelector('button[type="submit"]') as HTMLButtonElement)
    await flushAsyncUpdates()

    expect(mockToast.info).toHaveBeenCalledWith('Нові вікна для запису не створено. Існуючі або зайняті періоди було пропущено.')
    expect(screen.queryByRole('dialog', { name: 'Створити вікна для запису' })).not.toBeInTheDocument()
  })

  it('shows safe smart fill error and does not update local slots optimistically', async () => {
    const bookedSlot = {
      id: 40,
      start_at: '2026-03-12T09:00:00Z',
      end_at: '2026-03-12T09:50:00Z',
      is_booked: true,
    }
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/slots/') return [bookedSlot]
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockRejectedValueOnce(new Error('server unavailable'))

    const { container } = renderView()
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()

    await fireEvent.click(getAvailabilityPrimaryAction())
    await flushAsyncUpdates()
    const dialog = screen.getByRole('dialog', { name: 'Створити вікна для запису' })
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Створити вікна для запису' }))
    await flushAsyncUpdates()

    expect(within(dialog).getByRole('alert')).toHaveTextContent('Не вдалося створити вікна для запису. Перевірте параметри і спробуйте ще раз.')
    expect(screen.getByRole('dialog', { name: 'Створити вікна для запису' })).toBeInTheDocument()
    expect(container.querySelectorAll('.week-calendar .calendar-slot')).toHaveLength(1)
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Заброньовано 11:00–11:50"]')).toBeInTheDocument()
  })

  it('preserves a manually selected booked filter after smart fill', async () => {
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
      if (url === '/cabinet/slots/fill/') {
        slotsReloaded = true
        return { created_count: 1, skipped_count: 0 } as any
      }
      throw new Error(`Unexpected apiPost call: ${url}`)
    })

    const { container } = renderView()
    await flushAsyncUpdates()

    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('button', { name: 'Заброньовано' }))

    await fireEvent.click(getAvailabilityPrimaryAction())
    await flushAsyncUpdates()
    await fireEvent.click(screen.getByRole('dialog', { name: 'Створити вікна для запису' }).querySelector('button[type="submit"]') as HTMLButtonElement)
    await flushAsyncUpdates()

    expect(screen.getByRole('button', { name: 'Заброньовано' })).toHaveClass('btn--active')
    expect(screen.getByText('1 незайняте · 1 заброньовано')).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Заброньовано 11:00–11:50"]')).toBeInTheDocument()
    expect(container.querySelector('.week-calendar .calendar-slot[aria-label="Вікно для запису 13:00–13:50"]')).not.toBeInTheDocument()
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
    await fireEvent.click(screen.getByRole('tab', { name: 'Вікна для запису' }))
    await flushAsyncUpdates()

    const block = container.querySelector('.week-calendar .calendar-slot')
    expect(block).toBeInstanceOf(HTMLElement)
    await fireEvent.click(block as HTMLElement)
    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати вікно' }))

    const editDateInput = screen.getByLabelText('Дата початку редагованого вікна') as HTMLInputElement
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
    expect(mockToast.success).toHaveBeenCalledWith('Вікно для запису на 12.03.2026, 11:10 створено.')
  })
})
