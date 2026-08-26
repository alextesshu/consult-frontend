import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useRoute } from 'vue-router'
import { confirmPasswordReset, getApiErrorMessage } from '../lib/api'
import ResetPasswordView from './ResetPasswordView.vue'

vi.mock('../lib/api', () => ({
  confirmPasswordReset: vi.fn(),
  getApiErrorMessage: vi.fn(() => 'Не вдалося змінити пароль. Спробуйте ще раз.'),
}))

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  RouterLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
}))

const mockedConfirmPasswordReset = vi.mocked(confirmPasswordReset)
const mockedGetApiErrorMessage = vi.mocked(getApiErrorMessage)
const mockedUseRoute = vi.mocked(useRoute)
const routeState = reactive({ params: { uid: 'uid-value', token: 'token-value' } })

function renderView() {
  render(ResetPasswordView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  })
}

async function fillMatchingPasswords() {
  await fireEvent.update(screen.getByLabelText('Новий пароль'), 'NewPassword456!')
  await fireEvent.update(screen.getByLabelText('Повторіть новий пароль'), 'NewPassword456!')
}

describe('ResetPasswordView', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    routeState.params = { uid: 'uid-value', token: 'token-value' }
    mockedUseRoute.mockReturnValue(routeState as any)
  })

  it('extracts uid and token from the route when confirming a password', async () => {
    mockedConfirmPasswordReset.mockResolvedValueOnce({ status: 'password_changed' })
    renderView()

    await fillMatchingPasswords()
    await fireEvent.click(screen.getByRole('button', { name: 'Змінити пароль' }))

    await waitFor(() => {
      expect(mockedConfirmPasswordReset).toHaveBeenCalledWith(
        'uid-value',
        'token-value',
        'NewPassword456!',
        'NewPassword456!'
      )
    })
  })

  it('blocks mismatched passwords before calling the API', async () => {
    renderView()
    await fireEvent.update(screen.getByLabelText('Новий пароль'), 'NewPassword456!')
    await fireEvent.update(screen.getByLabelText('Повторіть новий пароль'), 'DifferentPassword456!')
    await fireEvent.click(screen.getByRole('button', { name: 'Змінити пароль' }))

    expect(screen.getByText('Паролі не співпадають.')).toBeInTheDocument()
    expect(mockedConfirmPasswordReset).not.toHaveBeenCalled()
  })

  it('shows a login CTA after a successful reset', async () => {
    mockedConfirmPasswordReset.mockResolvedValueOnce({ status: 'password_changed' })
    renderView()

    await fillMatchingPasswords()
    await fireEvent.click(screen.getByRole('button', { name: 'Змінити пароль' }))

    expect(await screen.findByText('Пароль змінено')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Увійти з новим паролем' })).toHaveAttribute(
      'href',
      '/login'
    )
  })

  it('shows the recovery CTA for an invalid or expired link', async () => {
    mockedConfirmPasswordReset.mockRejectedValueOnce({
      response: { data: { code: 'invalid_password_reset_link' } },
    })
    renderView()

    await fillMatchingPasswords()
    await fireEvent.click(screen.getByRole('button', { name: 'Змінити пароль' }))

    expect(
      await screen.findByText('Посилання для відновлення пароля недійсне або термін його дії минув.')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Запросити нове посилання' })).toHaveAttribute(
      'href',
      '/forgot-password'
    )
  })

  it('renders safe backend password validation feedback', async () => {
    mockedConfirmPasswordReset.mockRejectedValueOnce({
      response: { data: { new_password: ['Цей пароль надто поширений.'] } },
    })
    mockedGetApiErrorMessage.mockReturnValueOnce('new_password: Цей пароль надто поширений.')
    renderView()

    await fillMatchingPasswords()
    await fireEvent.click(screen.getByRole('button', { name: 'Змінити пароль' }))

    expect(
      await screen.findByText('new_password: Цей пароль надто поширений.')
    ).toBeInTheDocument()
  })
})
