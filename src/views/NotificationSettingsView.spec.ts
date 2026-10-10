import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchNotificationSettings, updateNotificationSettings } from '../lib/api'
import NotificationSettingsView from './NotificationSettingsView.vue'

vi.mock('../lib/api', () => ({ fetchNotificationSettings: vi.fn(), updateNotificationSettings: vi.fn() }))
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
