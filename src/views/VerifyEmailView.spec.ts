import { render, screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import VerifyEmailView from './VerifyEmailView.vue'
import { confirmAccountEmailVerification } from '../lib/api'
import { takeEmailVerificationToken } from '../lib/emailVerificationToken'

const mockAuth = {
  accessToken: '',
  user: null as any,
  me: null as any,
  loadMe: vi.fn(),
}

vi.mock('../stores/auth', () => ({ useAuthStore: () => mockAuth }))
vi.mock('../lib/api', () => ({ confirmAccountEmailVerification: vi.fn() }))
vi.mock('../lib/emailVerificationToken', () => ({ takeEmailVerificationToken: vi.fn() }))

const mockedConfirm = vi.mocked(confirmAccountEmailVerification)
const mockedTakeToken = vi.mocked(takeEmailVerificationToken)

function renderView() {
  return render(VerifyEmailView, {
    global: {
      stubs: {
        RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
      },
    },
  })
}

describe('VerifyEmailView', () => {
  beforeEach(() => {
    mockAuth.accessToken = ''
    mockAuth.user = null
    mockAuth.me = null
    mockAuth.loadMe.mockReset()
    mockedConfirm.mockReset()
    mockedTakeToken.mockReset()
    mockedTakeToken.mockReturnValue('raw-token')
  })

  afterEach(() => vi.restoreAllMocks())

  it('confirms an in-memory token without rendering it and offers login when logged out', async () => {
    mockedConfirm.mockResolvedValue({ status: 'email_verified' })
    renderView()

    expect(await screen.findByText('Адресу email успішно підтверджено.')).toBeInTheDocument()
    expect(mockedConfirm).toHaveBeenCalledWith('raw-token')
    expect(screen.queryByText('raw-token', { exact: true })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Увійти' })).toHaveAttribute('href', '/login')
  })

  it('refreshes canonical identity after authenticated success', async () => {
    mockAuth.accessToken = 'access-token'
    mockAuth.user = { roles: ['CLIENT'] }
    mockedConfirm.mockResolvedValue({ status: 'email_verified' })
    mockAuth.loadMe.mockResolvedValue(undefined)
    renderView()

    await screen.findByText('Адресу email успішно підтверджено.')
    await waitFor(() => expect(mockAuth.loadMe).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('link', { name: 'Повернутися до кабінету' })).toHaveAttribute('href', '/client')
  })

  it.each([
    ['EXPIRED_EMAIL_VERIFICATION_TOKEN', 'Термін дії посилання минув'],
    ['INVALID_EMAIL_VERIFICATION_TOKEN', 'Посилання для підтвердження недійсне'],
    ['EMAIL_VERIFICATION_TOKEN_ALREADY_USED', 'Email уже підтверджено'],
    ['OBSOLETE_EMAIL_VERIFICATION_TOKEN', 'Це посилання вже не відповідає'],
    ['EMAIL_VERIFICATION_ACCOUNT_UNAVAILABLE', 'Акаунт недоступний'],
  ])('shows a safe semantic state for %s', async (code, message) => {
    mockedConfirm.mockRejectedValue({ response: { data: { code } } })
    renderView()

    expect(await screen.findByText(new RegExp(message))).toBeInTheDocument()
    expect(screen.queryByText('raw-token', { exact: true })).not.toBeInTheDocument()
  })

  it('handles a missing token without issuing a request', async () => {
    mockedTakeToken.mockReturnValue('')
    renderView()

    expect(await screen.findByText('У посиланні немає токена підтвердження.')).toBeInTheDocument()
    expect(mockedConfirm).not.toHaveBeenCalled()
  })
})
