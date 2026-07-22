import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { defineComponent, reactive } from 'vue'
import { createMemoryHistory, createRouter, useRoute } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  acceptBookingRules,
  apiGet,
  apiPatch,
  apiPost,
  createInquiryThread,
  fetchChatThreads,
  fetchInquiryMessages,
  fetchInquiryState,
  fetchPublicAuthorJournalPosts,
  fetchPublicJournalCollections,
  fetchPublicSpecialistProfile,
  fetchSessionPaymentProof,
  fetchSpecialistProfile,
  markSessionPaymentProofPaid,
  requestSessionPaymentProof,
  requestSessionPaymentProofClarification,
  sendInquiryMessage,
  type PublicSpecialistProfile,
  uploadSessionPaymentProof,
} from '../lib/api'
import ClientSessionDetailView from './ClientSessionDetailView.vue'
import PublicProfileView from './PublicProfileView.vue'

const mockAuth = reactive({
  accessToken: '',
  user: null as null | { id: number; roles: string[] },
  me: null as null | { user: { id: number; roles: string[] } },
  authResolved: false,
})

const mockToast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}

vi.mock('../stores/auth', () => ({
  useAuthStore: () => mockAuth,
}))

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../lib/api', () => ({
  REQUEST_TOPIC_OPTIONS: [],
  acceptBookingRules: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  createInquiryThread: vi.fn(),
  fetchChatThreads: vi.fn(),
  fetchInquiryMessages: vi.fn(),
  fetchInquiryState: vi.fn(),
  fetchPublicAuthorJournalPosts: vi.fn(),
  fetchPublicJournalCollections: vi.fn(),
  fetchPublicSpecialistProfile: vi.fn(),
  fetchSessionPaymentProof: vi.fn(),
  fetchSpecialistProfile: vi.fn(),
  markSessionPaymentProofPaid: vi.fn(),
  requestSessionPaymentProof: vi.fn(),
  requestSessionPaymentProofClarification: vi.fn(),
  sendInquiryMessage: vi.fn(),
  uploadSessionPaymentProof: vi.fn(),
}))

const mockedAcceptBookingRules = vi.mocked(acceptBookingRules)
const mockedApiGet = vi.mocked(apiGet)
const mockedApiPatch = vi.mocked(apiPatch)
const mockedApiPost = vi.mocked(apiPost)
const mockedCreateInquiryThread = vi.mocked(createInquiryThread)
const mockedFetchChatThreads = vi.mocked(fetchChatThreads)
const mockedFetchInquiryMessages = vi.mocked(fetchInquiryMessages)
const mockedFetchInquiryState = vi.mocked(fetchInquiryState)
const mockedFetchPublicAuthorJournalPosts = vi.mocked(fetchPublicAuthorJournalPosts)
const mockedFetchPublicJournalCollections = vi.mocked(fetchPublicJournalCollections)
const mockedFetchPublicSpecialistProfile = vi.mocked(fetchPublicSpecialistProfile)
const mockedFetchSessionPaymentProof = vi.mocked(fetchSessionPaymentProof)
const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)
const mockedMarkSessionPaymentProofPaid = vi.mocked(markSessionPaymentProofPaid)
const mockedRequestSessionPaymentProof = vi.mocked(requestSessionPaymentProof)
const mockedRequestSessionPaymentProofClarification = vi.mocked(requestSessionPaymentProofClarification)
const mockedSendInquiryMessage = vi.mocked(sendInquiryMessage)
const mockedUploadSessionPaymentProof = vi.mocked(uploadSessionPaymentProof)

const publicProfile = {
  therapist_id: 8,
  public_slug: 'olena',
  public_booking_mode: 'direct_booking',
  show_public_availability: true,
  public_direct_booking_enabled: true,
  display_name: 'Олена',
  public_display_name: 'Олена',
  offers_online: true,
  offers_offline: false,
  specializations: [],
  languages: [],
  contact_actions: [],
  profile_documents: [],
  booking_rules: { show_prompt: false, reason_codes: [], items: [] },
}

function buildCancelledSession() {
  return {
    id: 55,
    status: 'CANCELLED',
    slot_start_at: '2099-06-15T10:00:00Z',
    slot_end_at: '2099-06-15T10:50:00Z',
    therapist: 8,
    therapist_name: 'Олена',
    therapist_public_slug: 'olena',
    specialist_id: 8,
    specialist_name: 'Олена',
    specialist_public_slug: 'olena',
    session_format: 'online',
    client: 21,
  }
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/client', component: defineComponent({ template: '<div />' }) },
      { path: '/client/sessions/:id', component: ClientSessionDetailView },
      { path: '/s/:slug', component: PublicProfileView },
    ],
  })
}

describe('Client session recovery request intent', () => {
  beforeEach(() => {
    mockAuth.accessToken = ''
    mockAuth.user = null
    mockAuth.me = null
    mockAuth.authResolved = false
    Object.values({
      mockedAcceptBookingRules,
      mockedApiGet,
      mockedApiPatch,
      mockedApiPost,
      mockedCreateInquiryThread,
      mockedFetchChatThreads,
      mockedFetchInquiryMessages,
      mockedFetchInquiryState,
      mockedFetchPublicAuthorJournalPosts,
      mockedFetchPublicJournalCollections,
      mockedFetchPublicSpecialistProfile,
      mockedFetchSessionPaymentProof,
      mockedFetchSpecialistProfile,
      mockedMarkSessionPaymentProofPaid,
      mockedRequestSessionPaymentProof,
      mockedRequestSessionPaymentProofClarification,
      mockedSendInquiryMessage,
      mockedUploadSessionPaymentProof,
    }).forEach((mock) => mock.mockReset())

    mockedFetchPublicSpecialistProfile.mockResolvedValue(publicProfile as any)
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryMessages.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue({
      specialist_id: 8,
      inquiry_id: null,
      inquiry_exists: false,
      inquiry_status: 'NOT_CREATED',
      can_create_inquiry: true,
      create_reason_code: null,
      can_client_send: false,
      client_send_reason_code: 'INQUIRY_NOT_FOUND',
      can_specialist_reply: false,
      specialist_reply_reason_code: 'INQUIRY_NOT_FOUND',
    })
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/55/') return buildCancelledSession()
      if (url === '/booking/slots/') return []
      if (url === '/booking/sessions/') return []
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })
  })

  it('keeps the recovery intent through a failed auth refresh and opens the real request form once', async () => {
    let resolveProfile: (value: PublicSpecialistProfile) => void
    mockedFetchPublicSpecialistProfile.mockReset()
    mockedFetchPublicSpecialistProfile.mockResolvedValueOnce(publicProfile as any)
    mockedFetchPublicSpecialistProfile.mockReturnValueOnce(
      new Promise<PublicSpecialistProfile>((resolve) => {
        resolveProfile = resolve
      })
    )

    const router = createTestRouter()
    await router.push('/client/sessions/55')
    await router.isReady()

    const sidebarRequestCtaClick = vi.fn()
    const trackSidebarRequestCta = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('.identity-rail button')?.textContent?.trim() === 'Залишити запит') {
        sidebarRequestCtaClick()
      }
    }
    document.addEventListener('click', trackSidebarRequestCta)

    render(defineComponent({
      setup() {
        return { route: useRoute() }
      },
      template: '<RouterView :key="route.path" />',
    }), {
      global: { plugins: [router] },
    })

    await fireEvent.click(await screen.findByRole('link', { name: 'Залишити запит' }))

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/s/olena')
      expect(router.currentRoute.value.query.intent).toBe('request')
    })
    mockAuth.accessToken = 'stale-client-token'
    mockAuth.user = { id: 21, roles: ['CLIENT'] }
    mockAuth.me = { user: { id: 21, roles: ['CLIENT'] } }
    mockAuth.authResolved = true
    mockAuth.accessToken = ''
    mockAuth.user = null
    mockAuth.me = null
    mockAuth.authResolved = false
    resolveProfile!(publicProfile as PublicSpecialistProfile)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(router.currentRoute.value.query.intent).toBe('request')
    })

    mockAuth.authResolved = true

    expect(await screen.findByRole('dialog', { name: 'Запит на сесію' })).toBeInTheDocument()
    expect(screen.getByRole('dialog').querySelector('form.guest-booking-form')).toBeTruthy()
    await waitFor(() => {
      expect(router.currentRoute.value.query.intent).toBeUndefined()
    })
    expect(screen.getByRole('dialog').querySelector('form.guest-booking-form')).toBeTruthy()
    expect(sidebarRequestCtaClick).not.toHaveBeenCalled()
    document.removeEventListener('click', trackSidebarRequestCta)
  })

  it('opens the existing request dialog from a direct profile URL', async () => {
    mockAuth.authResolved = true
    const router = createTestRouter()
    await router.push('/s/olena?intent=request')
    await router.isReady()

    render(defineComponent({
      setup() {
        return { route: useRoute() }
      },
      template: '<RouterView :key="route.path" />',
    }), {
      global: { plugins: [router] },
    })

    expect(await screen.findByRole('dialog', { name: 'Запит на сесію' })).toBeInTheDocument()
    await waitFor(() => {
      expect(router.currentRoute.value.query.intent).toBeUndefined()
    })
  })
})
