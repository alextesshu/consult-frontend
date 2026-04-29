import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  acceptClientRecordAccountInvite,
  fetchPublicClientRecordAccountInvite,
} from '../lib/api'
import { useAuthStore } from '../stores/auth'
import ClientRecordAccountInviteView from './ClientRecordAccountInviteView.vue'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    acceptClientRecordAccountInvite: vi.fn(),
    fetchPublicClientRecordAccountInvite: vi.fn(),
  }
})

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a><slot /></a>',
  },
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}))

const mockedAcceptInvite = vi.mocked(acceptClientRecordAccountInvite)
const mockedFetchPreview = vi.mocked(fetchPublicClientRecordAccountInvite)
const mockedUseRoute = vi.mocked(useRoute)
const mockedUseRouter = vi.mocked(useRouter)
const routeState = reactive({
  params: { token: 'invite-token' },
  fullPath: '/client/invite/invite-token',
})
const routerPush = vi.fn()

function preview(overrides: Record<string, unknown> = {}) {
  return {
    status: 'ACTIVE',
    specialist_display_name: 'Dr Specialist',
    client_display_name: 'Client Name',
    expires_at: '2099-06-30T10:00:00Z',
    can_accept: true,
    ...overrides,
  }
}

function renderView(options: { roles?: string[]; role?: string; token?: string } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()
  auth.$reset()
  if (options.roles || options.role) {
    auth.setToken('access-token')
    auth.setMe({
      user: {
        id: 77,
        username: 'user',
        email: 'user@example.com',
        role: options.role || null,
        roles: options.roles || [],
      },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      server_time: '2026-04-29T00:00:00Z',
    })
  }
  vi.spyOn(auth, 'loadMe').mockResolvedValue(undefined)
  routeState.params.token = options.token || 'invite-token'
  routeState.fullPath = `/client/invite/${routeState.params.token}`

  const utils = render(ClientRecordAccountInviteView, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: `
            <a :href="typeof to === 'string'
              ? to
              : \`\${to.name || ''}\${to.query?.redirect ? '?redirect=' + encodeURIComponent(to.query.redirect) : ''}\`">
              <slot />
            </a>
          `,
        },
      },
    },
  })

  return { ...utils, auth }
}

describe('ClientRecordAccountInviteView', () => {
  beforeEach(() => {
    cleanup()
    mockedFetchPreview.mockReset()
    mockedFetchPreview.mockResolvedValue(preview() as any)
    mockedAcceptInvite.mockReset()
    mockedAcceptInvite.mockResolvedValue({ status: 'accepted' } as any)
    routerPush.mockReset()
    mockedUseRoute.mockReturnValue(routeState as any)
    mockedUseRouter.mockReturnValue({ push: routerPush } as any)
  })

  it('renders public preview with specialist and client names', async () => {
    renderView()

    expect(await screen.findByText('Dr Specialist')).toBeInTheDocument()
    expect(screen.getByText('Client Name')).toBeInTheDocument()
    expect(screen.getByText(/Спеціаліст запросив вас підключити кабінет/)).toBeInTheDocument()
  })

  it('shows login and signup CTAs with redirect for unauthenticated user', async () => {
    renderView()

    const loginLink = await screen.findByRole('link', { name: 'Увійти і підключити' })
    const signupLink = await screen.findByRole('link', { name: 'Створити кабінет клієнта' })

    expect(loginLink).toHaveAttribute('href', 'login?redirect=%2Fclient%2Finvite%2Finvite-token')
    expect(signupLink).toHaveAttribute('href', 'signup-client?redirect=%2Fclient%2Finvite%2Finvite-token')
    expect(mockedAcceptInvite).not.toHaveBeenCalled()
  })

  it('authenticated client can accept invite, refreshes auth, and redirects to client dashboard', async () => {
    const { auth } = renderView({ roles: ['CLIENT'] })

    await fireEvent.click(await screen.findByRole('button', { name: 'Підключити кабінет' }))

    await waitFor(() => {
      expect(mockedAcceptInvite).toHaveBeenCalledWith('invite-token', undefined)
      expect(auth.loadMe).toHaveBeenCalled()
      expect(routerPush).toHaveBeenCalledWith('/client')
    })
  })

  it('authenticated non-client sees role mismatch and accept is not called', async () => {
    renderView({ roles: ['SPECIALIST'] })

    await screen.findByText('Dr Specialist')
    expect(await screen.findByText(/Це запрошення можна прийняти лише з клієнтського кабінету/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Вийти та увійти як клієнт' })).toBeInTheDocument()
    expect(mockedAcceptInvite).not.toHaveBeenCalled()
  })

  it('handles identity confirmation and retries accept with confirmation payload', async () => {
    mockedAcceptInvite
      .mockRejectedValueOnce({ response: { data: { code: 'IDENTITY_CONFIRMATION_REQUIRED' } } })
      .mockResolvedValueOnce({ status: 'accepted' } as any)
    renderView({ roles: ['CLIENT'] })

    await fireEvent.click(await screen.findByRole('button', { name: 'Підключити кабінет' }))
    expect(await screen.findByText(/Дані акаунта відрізняються/)).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити і підключити' }))

    await waitFor(() => {
      expect(mockedAcceptInvite).toHaveBeenLastCalledWith('invite-token', { confirm_identity: true })
    })
  })

  it('renders friendly preview errors', async () => {
    mockedFetchPreview.mockRejectedValueOnce({ response: { data: { code: 'INVITE_EXPIRED' } } })
    const expired = renderView()
    expect(await screen.findByText('Запрошення більше не дійсне. Попросіть спеціаліста надіслати нове.')).toBeInTheDocument()
    expired.unmount()

    mockedFetchPreview.mockRejectedValueOnce({ response: { data: { code: 'INVITE_REVOKED' } } })
    const revoked = renderView()
    expect(await screen.findByText('Запрошення було відкликане. Попросіть спеціаліста надіслати нове.')).toBeInTheDocument()
    revoked.unmount()

    mockedFetchPreview.mockRejectedValueOnce({ response: { data: { code: 'INVITE_ALREADY_ACCEPTED' } } })
    const accepted = renderView()
    expect(await screen.findByText('Це запрошення вже використано.')).toBeInTheDocument()
    accepted.unmount()

    mockedFetchPreview.mockRejectedValueOnce({ response: { status: 404, data: { code: 'INVITE_NOT_FOUND' } } })
    renderView()
    expect(await screen.findByText('Запрошення не знайдено.')).toBeInTheDocument()
  })

  it('renders friendly accept error for duplicate link', async () => {
    mockedAcceptInvite.mockRejectedValueOnce({ response: { data: { code: 'DUPLICATE_CLIENT_RECORD_LINK' } } })
    renderView({ roles: ['CLIENT'] })

    await fireEvent.click(await screen.findByRole('button', { name: 'Підключити кабінет' }))

    const panel = await screen.findByText('Цей акаунт уже повʼязаний з іншою карткою цього спеціаліста.')
    expect(within(panel.closest('.invite-panel') as HTMLElement).getByText('Dr Specialist')).toBeInTheDocument()
  })
})
