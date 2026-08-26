import { render, screen, waitFor } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ClientInquiryRedirectView from './ClientInquiryRedirectView.vue'
import { fetchInquiryThreads, fetchPublicSpecialists, type InquiryThread } from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, fetchInquiryThreads: vi.fn(), fetchPublicSpecialists: vi.fn() }
})

const mockedFetchInquiryThreads = vi.mocked(fetchInquiryThreads)
const mockedFetchPublicSpecialists = vi.mocked(fetchPublicSpecialists)

function inquiryThread(overrides: Partial<InquiryThread> = {}): InquiryThread {
  return {
    id: 91,
    specialist_id: 12,
    specialist_public_slug: 'hidden-specialist',
    created_at: '2026-08-01T10:00:00Z',
    last_message_at: '2026-08-02T10:00:00Z',
    inquiry_status: 'OPEN',
    closed_reason: null,
    other_user: { id: 12, role: 'SPECIALIST', display_name: 'Олена' },
    last_message_preview: '',
    unread_count: 0,
    can_client_send: true,
    client_send_reason_code: null,
    can_specialist_reply: true,
    specialist_reply_reason_code: null,
    ...overrides,
  }
}

async function renderView(initialPath = '/client/inquiries/12') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/client/inquiries/:specialistId', name: 'client-inquiry-redirect', component: ClientInquiryRedirectView },
      { path: '/s/:slug', name: 'public-profile', component: { template: '<div>Public Profile</div>' } },
      { path: '/specialists', component: { template: '<div>Specialist Search</div>' } },
    ],
  })
  await router.push(initialPath)
  await router.isReady()
  render(ClientInquiryRedirectView, { global: { plugins: [router] } })
  return { router }
}

describe('ClientInquiryRedirectView', () => {
  beforeEach(() => {
    mockedFetchInquiryThreads.mockReset()
    mockedFetchPublicSpecialists.mockReset()
  })

  it('opens a hidden-from-directory specialist from the authenticated inquiry thread', async () => {
    mockedFetchInquiryThreads.mockResolvedValue([inquiryThread()])
    const { router } = await renderView()

    await waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/s/hidden-specialist#inquiry'))
    expect(mockedFetchPublicSpecialists).not.toHaveBeenCalled()
  })

  it('shows a controlled fallback when the authenticated inquiry has no usable slug', async () => {
    mockedFetchInquiryThreads.mockResolvedValue([inquiryThread({ specialist_public_slug: '' })])
    await renderView()

    expect(await screen.findByText('Не вдалося відкрити профіль спеціаліста для цього запиту.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Знайти профіль спеціаліста' })).toHaveAttribute('href', '/specialists')
    expect(mockedFetchPublicSpecialists).not.toHaveBeenCalled()
  })
})
