import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchMe, loginWithIdentifier } from '../lib/api'
import { applyUiVersion } from '../lib/uiVersion'
import LoginView from './LoginView.vue'

vi.mock('../lib/api', () => ({
  fetchMe: vi.fn(),
  loginWithIdentifier: vi.fn(),
  logoutSession: vi.fn(),
  refreshToken: vi.fn(),
  signupClient: vi.fn(),
  signupSpecialist: vi.fn(),
}))
vi.mock('vue-router', () => ({ RouterLink: { props: ['to'], template: '<a><slot /></a>' }, useRoute: vi.fn(), useRouter: vi.fn() }))

const routeState = reactive({ query: {} as Record<string, string> })
const push = vi.fn()

function renderView() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return render(LoginView, { global: { plugins: [pinia], stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } } })
}

describe('LoginView UI v2 (Auth.dc.html + Public-Mobile P5)', () => {
  beforeEach(() => {
    cleanup()
    window.localStorage.clear()
    routeState.query = {}
    vi.clearAllMocks()
    vi.mocked(useRoute).mockReturnValue(routeState as any)
    vi.mocked(useRouter).mockReturnValue({ push, replace: vi.fn() } as any)
    applyUiVersion('v2')
  })
  afterEach(() => applyUiVersion('v1'))

  it('renders the form-only v2 layout with source labels and no unsupported auth features', () => {
    const { container } = renderView()
    expect(container.querySelector('.pc2-login')).not.toBeNull()
    expect(container.querySelector('.auth__aside')).toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Вхід')
    expect(screen.getByLabelText('Ел. пошта або логін')).toHaveAttribute('autocomplete', 'username')
    expect(screen.getByLabelText('Пароль')).toHaveAttribute('autocomplete', 'current-password')
    expect(screen.getByRole('link', { name: 'Забули пароль?' })).toHaveAttribute('href', '/forgot-password')
    expect(screen.getByRole('button', { name: 'Увійти' })).toHaveAttribute('type', 'submit')
    expect(container.textContent).not.toMatch(/Посилання на email|Запам’ятати мене|на 30 днів/)
  })

  it('keeps the role switch presentational: copy and footer link change, login call does not', async () => {
    renderView()
    const client = screen.getByRole('button', { name: 'Я клієнт' })
    const specialist = screen.getByRole('button', { name: 'Я спеціаліст' })
    expect(client).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: 'Знайти без реєстрації' })).toHaveAttribute('href', '/specialists')
    await fireEvent.click(specialist)
    expect(specialist).toHaveAttribute('aria-pressed', 'true')
    expect(window.localStorage.getItem('pc-auth-role')).toBe('specialist')
    expect(screen.getByRole('link', { name: 'Створити безкоштовно' })).toHaveAttribute('href', '/signup')
    vi.mocked(loginWithIdentifier).mockResolvedValueOnce({ access: 'a', refresh: 'r' } as any)
    vi.mocked(fetchMe).mockResolvedValueOnce({ user: { id: 1, username: 'c', email: 'c@example.com', roles: ['CLIENT'] } } as any)
    await fireEvent.update(screen.getByLabelText('Ел. пошта або логін'), ' c@example.com ')
    await fireEvent.update(screen.getByLabelText('Пароль'), 'secret-pass')
    await fireEvent.click(screen.getByRole('button', { name: 'Увійти' }))
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/client'))
    expect(loginWithIdentifier).toHaveBeenCalledWith('c@example.com', 'secret-pass')
  })

  it('restores a remembered role and survives unavailable storage', () => {
    window.localStorage.setItem('pc-auth-role', 'specialist')
    renderView()
    expect(screen.getByRole('button', { name: 'Я спеціаліст' })).toHaveAttribute('aria-pressed', 'true')
    cleanup()
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    renderView()
    expect(screen.getByRole('button', { name: 'Я клієнт' })).toHaveAttribute('aria-pressed', 'true')
    getItem.mockRestore()
  })

  it('reuses v1 validation and invalid-credential mapping with an accessible alert', async () => {
    renderView()
    await fireEvent.click(screen.getByRole('button', { name: 'Увійти' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Введіть облікові дані.')
    expect(screen.getByLabelText('Пароль')).toHaveAttribute('aria-invalid', 'true')
    vi.mocked(loginWithIdentifier).mockRejectedValueOnce(new Error('No active account found with the given credentials'))
    await fireEvent.update(screen.getByLabelText('Ел. пошта або логін'), 'wrong@example.com')
    await fireEvent.update(screen.getByLabelText('Пароль'), 'wrong')
    await fireEvent.click(screen.getByRole('button', { name: 'Увійти' }))
    expect(await screen.findByText('Не вдалося увійти з цими даними. Перевірте електронну пошту та пароль.')).toBeInTheDocument()
  })

  it('keeps the invite notice and password toggle without submitting', async () => {
    routeState.query = { redirect: '/client/invite/token-123' }
    renderView()
    expect(screen.getByText(/Ви відкрили запрошення до акаунта клієнта/)).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Показати пароль' }))
    expect(screen.getByLabelText('Пароль')).toHaveAttribute('type', 'text')
    expect(loginWithIdentifier).not.toHaveBeenCalled()
  })

  it('leaves the v1 login markup untouched by default', () => {
    applyUiVersion('v1')
    const { container } = renderView()
    expect(container.querySelector('.pc2-login')).toBeNull()
    expect(container.querySelector('.auth__aside')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Продовжити' })).toBeInTheDocument()
  })
})
