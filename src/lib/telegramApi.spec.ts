import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from './http'
import { confirmTelegramLink, createTelegramLink, disconnectTelegram, fetchTelegramConnection, updateTelegramPreferences } from './api'

vi.mock('./http', () => ({ http: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))

describe('Telegram linking API contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const method of ['get', 'post', 'patch', 'delete'] as const) {
      vi.mocked(http[method]).mockResolvedValue({ data: {} })
    }
  })

  it('uses only the authenticated cabinet linking endpoints', async () => {
    await fetchTelegramConnection()
    await createTelegramLink()
    await confirmTelegramLink('pending-uuid')
    await disconnectTelegram()
    expect(http.get).toHaveBeenCalledWith('/cabinet/telegram/')
    expect(http.post).toHaveBeenNthCalledWith(1, '/cabinet/telegram/link-token/')
    expect(http.post).toHaveBeenNthCalledWith(2, '/cabinet/telegram/confirm/', { pending_id: 'pending-uuid', confirm: true })
    expect(http.delete).toHaveBeenCalledWith('/cabinet/telegram/')
  })

  it('sends only category preferences, with no capability or existing-channel values', async () => {
    const preferences = { notify_guest_requests: true, notify_session_booked: false, notify_session_reminders: false, notify_activation_nudges: false }
    await updateTelegramPreferences(preferences)
    expect(http.patch).toHaveBeenCalledWith('/cabinet/telegram/', preferences)
  })
})
