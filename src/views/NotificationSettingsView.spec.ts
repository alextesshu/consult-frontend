import { fireEvent, render, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { confirmTelegramLink, createTelegramLink, disconnectTelegram, fetchNotificationSettings, fetchTelegramConnection, updateNotificationSettings, updateTelegramPreferences, type TelegramConnection } from '../lib/api'
import NotificationSettingsView from './NotificationSettingsView.vue'

vi.mock('../lib/api', () => ({ fetchNotificationSettings: vi.fn(), updateNotificationSettings: vi.fn(),
  fetchTelegramConnection: vi.fn(), createTelegramLink: vi.fn(), confirmTelegramLink: vi.fn(),
  disconnectTelegram: vi.fn(), updateTelegramPreferences: vi.fn(),
}))
vi.mock('../composables/useToast', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }))
const settings = (available = true, enabled = true) => ({
  notify_session_booked_in_app: true, notify_session_confirmed_in_app: true,
  notify_session_starts_24h_in_app: true, notify_session_starts_1h_in_app: true,
  notify_session_reminders_email: enabled, email_session_reminders_available: available,
})
function renderView() {
  return render(NotificationSettingsView, { global: { stubs: {
    SettingsSubnav: true,
    RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  } } })
}
function telegramState(state: TelegramConnection['state'] = 'unlinked', available = true): TelegramConnection {
  return { available, delivery_available: false, state,
    account: state === 'active' || state === 'stopped' ? { display_name: 'Test Specialist', username: 'test_specialist' } : null,
    pending: state === 'pending' ? { id: 'pending-identity', display_name: 'Test Specialist', username: 'test_specialist', expires_at: '2026-10-14T12:10:00Z' } : null,
    preferences: { notify_guest_requests: false, notify_session_booked: false, notify_session_reminders: false, notify_activation_nudges: false },
  }
}
beforeEach(() => {
  vi.mocked(fetchTelegramConnection).mockReset().mockResolvedValue(telegramState('unlinked', false))
  vi.mocked(createTelegramLink).mockReset()
  vi.mocked(confirmTelegramLink).mockReset()
  vi.mocked(disconnectTelegram).mockReset()
  vi.mocked(updateTelegramPreferences).mockReset()
})
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })
describe('NotificationSettingsView email reminders', () => {
  beforeEach(() => { vi.mocked(fetchNotificationSettings).mockReset(); vi.mocked(updateNotificationSettings).mockReset() })
  it('separates in-app preferences and saves email preference without capability', async () => {
    vi.mocked(fetchNotificationSettings).mockResolvedValue(settings())
    vi.mocked(updateNotificationSettings).mockResolvedValue(settings(true, false))
    const view = renderView()
    const email = await view.findByRole('checkbox', { name: /Email-нагадування про сесію/ })
    expect(email).toBeEnabled()
    expect(view.getByRole('heading', { name: 'У застосунку' })).toBeInTheDocument()
    expect(view.getAllByRole('checkbox')).toHaveLength(5)
    expect(view.getByText('За 24 години та за 1 годину — вам і клієнту, якщо у клієнта вказаний email.')).toBeInTheDocument()
    await fireEvent.click(email)
    await fireEvent.click(view.getByRole('button', { name: 'Зберегти' }))
    await waitFor(() => expect(updateNotificationSettings).toHaveBeenCalledWith({
      notify_session_booked_in_app: true, notify_session_confirmed_in_app: true,
      notify_session_starts_24h_in_app: true, notify_session_starts_1h_in_app: true,
      notify_session_reminders_email: false,
    }))
  })
  it.each([true, false])('keeps stored preference %s on Start while in-app preferences remain editable', async (enabled) => {
    vi.mocked(fetchNotificationSettings).mockResolvedValue(settings(false, enabled))
    vi.mocked(updateNotificationSettings).mockResolvedValue(settings(false, enabled))
    const view = renderView()
    const email = await view.findByRole('checkbox', { name: /Email-нагадування про сесію/ })
    expect(email).toBeDisabled()
    expect((email as HTMLInputElement).checked).toBe(enabled)
    expect(view.getByText('Email-нагадування недоступні на тарифі Start.')).toBeInTheDocument()
    expect(view.getByText('Нагадування в застосунку залишаються доступними.')).toBeInTheDocument()
    expect(view.getByRole('link', { name: 'Перейти на Pro' })).toHaveAttribute('href', '/cabinet/billing')
    expect(view.getByRole('checkbox', { name: /Нові запити/ })).toBeEnabled()
    await fireEvent.click(view.getByRole('button', { name: 'Зберегти' }))
    await waitFor(() => expect(updateNotificationSettings).toHaveBeenCalledWith(expect.objectContaining({ notify_session_reminders_email: enabled })))
  })
  it('does not infer Start or save defaults when loading fails', async () => {
    vi.mocked(fetchNotificationSettings).mockRejectedValue(new Error('offline'))
    const view = renderView()
    await waitFor(() => expect(view.getByRole('button', { name: 'Зберегти' })).toBeDisabled())
    expect(view.queryByText('Email-нагадування недоступні на тарифі Start.')).not.toBeInTheDocument()
    expect(updateNotificationSettings).not.toHaveBeenCalled()
  })
})

describe('NotificationSettingsView Telegram linking', () => {
  beforeEach(() => {
    vi.mocked(fetchNotificationSettings).mockResolvedValue(settings())
    vi.mocked(fetchTelegramConnection).mockResolvedValue(telegramState())
  })

  it('opens a short-lived link and requires explicit identity confirmation after refresh', async () => {
    vi.mocked(createTelegramLink).mockResolvedValue({ url: 'https://t.me/synthetic_test_bot?start=synthetic-token', expires_at: new Date(Date.now() + 600_000).toISOString() })
    const view = renderView()
    await fireEvent.click(await view.findByRole('button', { name: 'Підключити Telegram' }))
    const link = await view.findByRole('link', { name: 'Відкрити Telegram' })
    expect(link).toHaveAttribute('href', 'https://t.me/synthetic_test_bot?start=synthetic-token')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(confirmTelegramLink).not.toHaveBeenCalled()
    await waitFor(() => expect(view.getByRole('button', { name: 'Оновити стан Telegram' })).toBeEnabled())
    vi.mocked(fetchTelegramConnection).mockResolvedValue(telegramState('pending'))
    await fireEvent.click(view.getByRole('button', { name: 'Оновити стан Telegram' }))
    const confirm = await view.findByRole('button', { name: 'Підтвердити підключення' })
    expect(confirm).toBeDisabled()
    expect(view.getByText(/Очікує підтвердження: Test Specialist/)).toBeInTheDocument()
    expect(view.getByText(/Якщо посилання відкрив хтось інший/)).toBeInTheDocument()
    expect(view.queryByRole('link', { name: 'Відкрити Telegram' })).not.toBeInTheDocument()
    await fireEvent.click(confirm)
    expect(confirmTelegramLink).not.toHaveBeenCalled()
    await fireEvent.click(view.getByRole('checkbox', { name: 'Це мій акаунт Telegram' }))
    vi.mocked(confirmTelegramLink).mockResolvedValue(telegramState('active'))
    await fireEvent.click(confirm)
    await waitFor(() => expect(confirmTelegramLink).toHaveBeenCalledWith('pending-identity'))
    expect(await view.findByText(/Telegram підключено: Test Specialist/)).toBeInTheDocument()
    expect(view.getByText('Надсилання повідомлень ще не ввімкнене.')).toBeInTheDocument()
    for (const name of ['Нові звернення від клієнтів', 'Нові запити на сесії', 'Нагадування про сесії', 'Поради для повернення до роботи з практикою']) {
      expect(view.getByRole('checkbox', { name })).not.toBeChecked()
    }
  })

  it('saves only explicitly opted-in Telegram categories independently of email and in-app settings', async () => {
    vi.mocked(fetchTelegramConnection).mockResolvedValue(telegramState('active'))
    const active = telegramState('active')
    active.preferences.notify_guest_requests = true
    vi.mocked(updateTelegramPreferences).mockResolvedValue(active)
    const view = renderView()
    await fireEvent.click(await view.findByRole('checkbox', { name: 'Нові звернення від клієнтів' }))
    await fireEvent.click(view.getByRole('button', { name: 'Зберегти налаштування Telegram' }))
    await waitFor(() => expect(updateTelegramPreferences).toHaveBeenCalledWith({
      notify_guest_requests: true, notify_session_booked: false, notify_session_reminders: false, notify_activation_nudges: false,
    }))
    expect(updateNotificationSettings).not.toHaveBeenCalled()
  })

  it('handles /stop state and disconnects without enabling preferences', async () => {
    vi.mocked(fetchTelegramConnection).mockResolvedValue(telegramState('stopped'))
    vi.mocked(disconnectTelegram).mockResolvedValue(telegramState())
    const view = renderView()
    expect(await view.findByText(/Сповіщення Telegram зупинено командою/)).toBeInTheDocument()
    expect(view.getByRole('button', { name: 'Підключити знову' })).toBeEnabled()
    expect(view.queryByRole('checkbox', { name: 'Нагадування про сесії' })).not.toBeInTheDocument()
    await fireEvent.click(view.getByRole('button', { name: 'Відключити Telegram' }))
    expect(await view.findByText('Telegram не підключено.')).toBeInTheDocument()
    expect(disconnectTelegram).toHaveBeenCalledTimes(1)
    expect(updateTelegramPreferences).not.toHaveBeenCalled()
  })

  it('allows cancelling a forwarded pending identity without confirmation', async () => {
    const pending = telegramState('pending')
    pending.pending!.display_name = 'Someone else'
    vi.mocked(fetchTelegramConnection).mockResolvedValue(pending)
    vi.mocked(disconnectTelegram).mockResolvedValue(telegramState())
    const view = renderView()
    await fireEvent.click(await view.findByRole('button', { name: 'Скасувати підключення' }))
    expect(await view.findByText('Telegram не підключено.')).toBeInTheDocument()
    expect(confirmTelegramLink).not.toHaveBeenCalled()
  })

  it('shows expiry guidance and requires renewed explicit confirmation after refresh', async () => {
    vi.mocked(fetchTelegramConnection).mockResolvedValue(telegramState('pending'))
    vi.mocked(confirmTelegramLink).mockRejectedValue({ response: { data: { code: 'TELEGRAM_LINK_STALE' } } })
    const view = renderView()
    await fireEvent.click(await view.findByRole('checkbox', { name: 'Це мій акаунт Telegram' }))
    await fireEvent.click(view.getByRole('button', { name: 'Підтвердити підключення' }))
    expect(await view.findByRole('alert')).toHaveTextContent('Підключення прострочене')
    vi.mocked(fetchTelegramConnection).mockResolvedValue(telegramState())
    await fireEvent.click(view.getByRole('button', { name: 'Оновити стан Telegram' }))
    expect(await view.findByText('Telegram не підключено.')).toBeInTheDocument()
    expect(view.queryByRole('button', { name: 'Підтвердити підключення' })).not.toBeInTheDocument()
  })

  it('does not claim a connection when loading fails and offers retry', async () => {
    vi.mocked(fetchTelegramConnection).mockRejectedValue(new Error('offline'))
    const view = renderView()
    expect(await view.findByRole('alert')).toHaveTextContent('Оновіть стан і спробуйте ще раз')
    expect(view.queryByText(/Telegram підключено:/)).not.toBeInTheDocument()
    vi.mocked(fetchTelegramConnection).mockResolvedValue(telegramState())
    await fireEvent.click(view.getByRole('button', { name: 'Оновити стан Telegram' }))
    expect(await view.findByText('Telegram не підключено.')).toBeInTheDocument()
  })

  it('keeps feature-disabled connection controls disabled without affecting email preferences', async () => {
    vi.mocked(fetchTelegramConnection).mockResolvedValue(telegramState('unlinked', false))
    const view = renderView()
    expect(await view.findByRole('button', { name: 'Підключити Telegram' })).toBeDisabled()
    expect(view.getByRole('checkbox', { name: /Email-нагадування про сесію/ })).toBeEnabled()
    expect(createTelegramLink).not.toHaveBeenCalled()
  })

  it('prevents duplicate confirmation requests while busy', async () => {
    vi.mocked(fetchTelegramConnection).mockResolvedValue(telegramState('pending'))
    let resolve!: (value: TelegramConnection) => void
    vi.mocked(confirmTelegramLink).mockImplementation(() => new Promise((done) => { resolve = done }))
    const view = renderView()
    await fireEvent.click(await view.findByRole('checkbox', { name: 'Це мій акаунт Telegram' }))
    const button = view.getByRole('button', { name: 'Підтвердити підключення' })
    await fireEvent.click(button)
    await fireEvent.click(button)
    expect(confirmTelegramLink).toHaveBeenCalledTimes(1)
    expect(button).toBeDisabled()
    resolve(telegramState('active'))
    expect(await view.findByText(/Telegram підключено:/)).toBeInTheDocument()
  })

  it('ignores a late connection response after leaving the settings page', async () => {
    let resolve!: (value: TelegramConnection) => void
    vi.mocked(fetchTelegramConnection).mockImplementation(() => new Promise((done) => { resolve = done }))
    const view = renderView()
    view.unmount()
    resolve(telegramState('pending'))
    await Promise.resolve()
    expect(view.queryByRole('button', { name: 'Підтвердити підключення' })).not.toBeInTheDocument()
    expect(confirmTelegramLink).not.toHaveBeenCalled()
  })

  it('clears the link at the API expiry deadline and allows generating a replacement', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-14T12:00:00Z'))
    const scheduled = vi.spyOn(globalThis, 'setTimeout')
    vi.mocked(createTelegramLink).mockResolvedValue({ url: 'https://t.me/synthetic_test_bot?start=synthetic-token', expires_at: '2026-10-14T12:10:00Z' })
    const view = renderView()
    await fireEvent.click(await view.findByRole('button', { name: 'Підключити Telegram' }))
    expect(await view.findByRole('link', { name: 'Відкрити Telegram' })).toBeInTheDocument()
    await waitFor(() => expect(view.getByRole('button', { name: 'Оновити стан Telegram' })).toBeEnabled())
    const expire = scheduled.mock.calls.find(([, delay]) => delay === 600_000)?.[0]
    expect(typeof expire).toBe('function')
    vi.setSystemTime(new Date('2026-10-14T12:09:59Z'))
    window.dispatchEvent(new Event('focus'))
    expect(view.getByRole('link', { name: 'Відкрити Telegram' })).toBeInTheDocument()
    vi.setSystemTime(new Date('2026-10-14T12:10:00Z'))
    if (typeof expire === 'function') expire()
    await waitFor(() => expect(view.queryByRole('link', { name: 'Відкрити Telegram' })).not.toBeInTheDocument())
    expect(view.getByText(/Посилання прострочене/)).toBeInTheDocument()
    vi.mocked(createTelegramLink).mockResolvedValue({ url: 'https://t.me/synthetic_test_bot?start=replacement', expires_at: '2026-10-14T12:20:00Z' })
    await fireEvent.click(view.getByRole('button', { name: 'Підключити Telegram' }))
    expect(await view.findByRole('link', { name: 'Відкрити Telegram' })).toHaveAttribute('href', 'https://t.me/synthetic_test_bot?start=replacement')
  })

  it.each(['2020-01-01T12:10:00Z', 'invalid-date'])('does not show an unusable link with expiry %s', async (expires_at) => {
    vi.mocked(createTelegramLink).mockResolvedValue({ url: 'https://t.me/synthetic_test_bot?start=synthetic-token', expires_at })
    const view = renderView()
    await fireEvent.click(await view.findByRole('button', { name: 'Підключити Telegram' }))
    expect(await view.findByText(/Посилання прострочене/)).toBeInTheDocument()
    expect(view.queryByRole('link', { name: 'Відкрити Telegram' })).not.toBeInTheDocument()
  })

  it('clears an old URL on unlinked refresh even if the token was revoked elsewhere', async () => {
    vi.mocked(createTelegramLink).mockResolvedValue({ url: 'https://t.me/synthetic_test_bot?start=synthetic-token', expires_at: new Date(Date.now() + 600_000).toISOString() })
    const view = renderView()
    await fireEvent.click(await view.findByRole('button', { name: 'Підключити Telegram' }))
    expect(await view.findByRole('link', { name: 'Відкрити Telegram' })).toBeInTheDocument()
    await waitFor(() => expect(view.getByRole('button', { name: 'Оновити стан Telegram' })).toBeEnabled())
    await fireEvent.click(view.getByRole('button', { name: 'Оновити стан Telegram' }))
    await waitFor(() => expect(view.getByRole('button', { name: 'Оновити стан Telegram' })).toBeEnabled())
    expect(view.queryByRole('link', { name: 'Відкрити Telegram' })).not.toBeInTheDocument()
  })

  it('rechecks expiry when returning to a tab after browser timer throttling', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-14T12:00:00Z'))
    vi.mocked(createTelegramLink).mockResolvedValue({ url: 'https://t.me/synthetic_test_bot?start=synthetic-token', expires_at: '2026-10-14T12:10:00Z' })
    const view = renderView()
    await fireEvent.click(await view.findByRole('button', { name: 'Підключити Telegram' }))
    expect(await view.findByRole('link', { name: 'Відкрити Telegram' })).toBeInTheDocument()
    vi.setSystemTime(new Date('2026-10-14T12:11:00Z'))
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(view.queryByRole('link', { name: 'Відкрити Telegram' })).not.toBeInTheDocument())
    expect(view.getByText(/Посилання прострочене/)).toBeInTheDocument()
  })
})
