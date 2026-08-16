import { render, screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import AccountEmailChangeConfirmView from './AccountEmailChangeConfirmView.vue'
import { confirmAccountEmailChange } from '../lib/api'

const mockRoute = reactive({ params: { token: 'verification-token' } })
const mockAuthStore = {
  accessToken: '',
  loadMe: vi.fn(),
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('../lib/api', () => ({
  confirmAccountEmailChange: vi.fn(),
}))

const mockedConfirmAccountEmailChange = vi.mocked(confirmAccountEmailChange)

function renderView() {
  return render(AccountEmailChangeConfirmView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>',
        },
      },
    },
  })
}

describe('AccountEmailChangeConfirmView', () => {
  beforeEach(() => {
    mockRoute.params.token = 'verification-token'
    mockAuthStore.accessToken = ''
    mockAuthStore.loadMe.mockReset()
    mockedConfirmAccountEmailChange.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading and anonymous success with a login CTA', async () => {
    mockedConfirmAccountEmailChange.mockResolvedValue({ status: 'email_changed' })
    renderView()

    expect(screen.getByText('Підтверджуємо нову адресу...')).toBeInTheDocument()
    expect(await screen.findByText('Email акаунта успішно змінено.')).toBeInTheDocument()
    expect(mockedConfirmAccountEmailChange).toHaveBeenCalledWith('verification-token')
    expect(screen.getByRole('link', { name: 'Увійти' })).toHaveAttribute('href', '/login')
    expect(mockAuthStore.loadMe).not.toHaveBeenCalled()
  })

  it('refreshes me after authenticated confirmation', async () => {
    mockAuthStore.accessToken = 'access-token'
    mockAuthStore.loadMe.mockResolvedValue(undefined)
    mockedConfirmAccountEmailChange.mockResolvedValue({ status: 'email_changed' })
    renderView()

    expect(await screen.findByText('Email акаунта успішно змінено.')).toBeInTheDocument()
    await waitFor(() => expect(mockAuthStore.loadMe).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('link', { name: 'Повернутися до налаштувань' })).toHaveAttribute(
      'href',
      '/cabinet/settings'
    )
  })

  it.each([
    'invalid_confirmation_token',
    'expired_confirmation_token',
    'confirmation_token_unavailable',
    'target_email_unavailable',
  ])('shows the same generic failure state for %s', async (code) => {
    const consoleLog = vi.spyOn(console, 'log')
    mockedConfirmAccountEmailChange.mockRejectedValue({ response: { data: { code } } })
    renderView()

    expect(await screen.findByText(/Посилання може бути недійсним, простроченим або вже використаним/)).toBeInTheDocument()
    expect(mockedConfirmAccountEmailChange).toHaveBeenCalledWith('verification-token')
    expect(screen.queryByText('verification-token', { exact: true })).not.toBeInTheDocument()
    expect(Object.keys(localStorage)).toEqual([])
    expect(consoleLog).not.toHaveBeenCalled()
  })
})
