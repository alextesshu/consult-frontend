import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import EmailVerificationNotice from './EmailVerificationNotice.vue'
import { resendAccountEmailVerification } from '../lib/api'
import { resetAccountEmailVerificationForTests } from '../composables/useAccountEmailVerification'

const auth = reactive({
  user: null as any,
  me: null as any,
})

vi.mock('../stores/auth', () => ({ useAuthStore: () => auth }))
vi.mock('../lib/api', () => ({
  resendAccountEmailVerification: vi.fn(),
  getApiErrorMessage: (error: any, fallback: string) => error?.response?.data?.detail || fallback,
}))

const mockedResend = vi.mocked(resendAccountEmailVerification)

function renderNotice() {
  return render(EmailVerificationNotice, {
    global: {
      stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } },
    },
  })
}

describe('EmailVerificationNotice', () => {
  beforeEach(() => {
    resetAccountEmailVerificationForTests()
    mockedResend.mockReset()
    auth.me = null
    auth.user = null
  })

  it('shows specialist copy and a settings change-email action only for unverified users', () => {
    auth.user = { roles: ['SPECIALIST'], email_verification_state: 'unverified' }
    renderNotice()

    expect(screen.getByText(/опублікувати профіль і приймати звернення/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Змінити email' })).toHaveAttribute('href', '/cabinet/settings')
  })

  it('shows client copy and sends a resend request with a visible cooldown', async () => {
    auth.user = { roles: ['CLIENT'], email_verification_state: 'unverified' }
    mockedResend.mockResolvedValue({ status: 'verification_sent', expires_at: '2026-08-29T12:00:00Z' })
    renderNotice()

    expect(screen.getByText(/щоб бронювати консультації/)).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати лист ще раз' }))
    expect(await screen.findByText('Лист надіслано. Перевірте пошту.')).toBeInTheDocument()
    expect(mockedResend).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /Ще раз через 60 с/ })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Змінити email' })).toHaveAttribute('href', '/client/settings')
  })

  it.each(['verified', 'legacy_unknown'])('does not show a persistent notice for %s', (state) => {
    auth.user = { roles: ['CLIENT'], email_verification_state: state }
    const { container } = renderNotice()
    expect(container).toBeEmptyDOMElement()
  })

  it('uses the server retry-after value when a resend is cooled down', async () => {
    auth.user = { roles: ['CLIENT'], email_verification_state: 'unverified' }
    mockedResend.mockRejectedValue({ response: { data: { retry_after_seconds: 17, detail: 'Зачекайте.' } } })
    renderNotice()

    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати лист ще раз' }))
    expect(await screen.findByText('Зачекайте.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ще раз через 17 с/ })).toBeDisabled()
  })
})
