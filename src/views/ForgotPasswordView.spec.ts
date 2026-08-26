import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requestPasswordReset } from '../lib/api'
import ForgotPasswordView from './ForgotPasswordView.vue'

vi.mock('../lib/api', () => ({
  getApiErrorMessage: vi.fn(() => 'Не вдалося надіслати посилання. Спробуйте ще раз.'),
  requestPasswordReset: vi.fn(),
}))

const mockedRequestPasswordReset = vi.mocked(requestPasswordReset)

function renderView() {
  render(ForgotPasswordView, {
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

describe('ForgotPasswordView', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('submits the entered email and shows the generic success state', async () => {
    mockedRequestPasswordReset.mockResolvedValueOnce({
      status: 'accepted',
      detail: 'ignored by UI',
    })
    renderView()

    await fireEvent.update(screen.getByLabelText('Ел. пошта'), 'missing@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати посилання' }))

    await waitFor(() => {
      expect(mockedRequestPasswordReset).toHaveBeenCalledWith('missing@example.com')
    })
    expect(
      screen.getByText(
        'Якщо акаунт із такою електронною поштою існує, ми надіслали посилання для відновлення пароля.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/не знайдено/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Повернутися до входу' })).toHaveAttribute(
      'href',
      '/login'
    )
  })

  it('requires an email before sending a request', async () => {
    renderView()

    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати посилання' }))

    expect(screen.getByText('Вкажіть електронну пошту.')).toBeInTheDocument()
    expect(mockedRequestPasswordReset).not.toHaveBeenCalled()
  })
})
