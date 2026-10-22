import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, computed } from 'vue'
import { applyUiVersion } from '../lib/uiVersion'
import { useRoute, useRouter, stringifyQuery, type LocationQuery } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { RegistrationError } from '../lib/api'
import ClientSignupView from './ClientSignupView.vue'

vi.mock('vue-router', async () => ({
  ...await vi.importActual<typeof import('vue-router')>('vue-router'),
  RouterLink: {
    props: ['to'],
    template: '<a><slot /></a>',
  },
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}))

const mockedUseRoute = vi.mocked(useRoute)
const mockedUseRouter = vi.mocked(useRouter)
const routeState = reactive({ query: {} as LocationQuery })
const routerPush = vi.fn()

const accountRouterLinkStub = {
  props: ['to'],
  setup(props: any) {
    return { href: computed(() => {
      if (typeof props.to === 'string') return props.to
      const query = stringifyQuery(props.to.query ?? {})
      return props.to.path + (query ? '?' + query : '')
    }) }
  },
  template: '<a :href="href"><slot /></a>',
}

function renderView() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()
  vi.spyOn(auth, 'signupClient').mockResolvedValue(undefined)

  const utils = render(ClientSignupView, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: accountRouterLinkStub,
      },
    },
  })

  return { ...utils, auth }
}

async function submitSignup(container: Element) {
  await fireEvent.update(container.querySelector('input[name="email"]') as HTMLInputElement, 'client@example.com')
  await fireEvent.update(container.querySelector('input[name="password"]') as HTMLInputElement, 'password123')
  const name = container.querySelector('input[name="first_name"]')
  if (name) await fireEvent.update(name, 'Олена')
  const confirm = container.querySelector('input[name="password_confirm"]')
  if (confirm) await fireEvent.update(confirm, 'password123')
  await fireEvent.submit(container.querySelector('form') as HTMLFormElement)
}

describe('ClientSignupView', () => {
  beforeEach(() => {
    cleanup()
    applyUiVersion('v1')
    routeState.query = {}
    routerPush.mockReset()
    mockedUseRoute.mockReturnValue(routeState as any)
    mockedUseRouter.mockReturnValue({ push: routerPush } as any)
  })

  it('honors safe redirect after client signup', async () => {
    routeState.query = { redirect: '/client/invite/token-123' }
    const { container, auth } = renderView()

    await submitSignup(container)

    await waitFor(() => {
      expect(auth.signupClient).toHaveBeenCalledWith('client@example.com', 'password123', 'password123')
      expect(routerPush).toHaveBeenCalledWith('/client/invite/token-123')
    })
  })

  it('falls back to client dashboard for unsafe redirect', async () => {
    routeState.query = { redirect: '//evil.com/path' }
    const { container } = renderView()

    await submitSignup(container)

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith('/client')
    })
  })

  it('shows invite-context notice when redirect points to client invite', async () => {
    routeState.query = { redirect: '/client/invite/token-123' }
    renderView()

    expect(
      await screen.findByText(
        'Ви створюєте акаунт клієнта за запрошенням спеціаліста. Після реєстрації ви зможете підтвердити підключення до клієнтської картки.'
      )
    ).toBeInTheDocument()
  })

  it('does not show invite-context notice for regular signup', async () => {
    routeState.query = {}
    renderView()

    expect(
      screen.queryByText(
        'Ви створюєте акаунт клієнта за запрошенням спеціаліста. Після реєстрації ви зможете підтвердити підключення до клієнтської картки.'
      )
    ).not.toBeInTheDocument()
  })

  it('toggles password fields without submitting signup', async () => {
    const { auth } = renderView()

    const passwordInput = screen.getByLabelText('Пароль') as HTMLInputElement
    const confirmInput = screen.getByLabelText('Підтвердження пароля') as HTMLInputElement

    expect(passwordInput.type).toBe('password')
    expect(confirmInput.type).toBe('password')

    await fireEvent.click(screen.getByRole('button', { name: 'Показати пароль' }))
    expect(passwordInput.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Сховати пароль' })).toBeInTheDocument()
    expect(auth.signupClient).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByRole('button', { name: 'Показати підтвердження пароля' }))
    expect(confirmInput.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Сховати підтвердження пароля' })).toBeInTheDocument()
    expect(auth.signupClient).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByRole('button', { name: 'Сховати пароль' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Сховати підтвердження пароля' }))

    expect(passwordInput.type).toBe('password')
    expect(confirmInput.type).toBe('password')
    expect(auth.signupClient).not.toHaveBeenCalled()
  })

  it('shows the client as selected before fields only under v2', () => {
    applyUiVersion('v2')
    const { container } = renderView()
    expect(screen.getByRole('navigation', { name: 'Тип акаунта' }).querySelectorAll('a')).toHaveLength(2)
    expect(screen.getByRole('link', { name: /Я клієнт/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Я спеціаліст/ })).toHaveAttribute('href', '/signup?ui=v2')
    expect(screen.getByRole('link', { name: /Я спеціаліст/ })).not.toHaveAttribute('aria-current')
    expect(container.querySelector('nav')!.compareDocumentPosition(container.querySelector('input')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Реєстрація спеціаліста' })).toBeNull()
  })

  it('retains the legacy account link without a selector in v1', () => {
    renderView()
    expect(screen.queryByRole('navigation', { name: 'Тип акаунта' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Реєстрація спеціаліста' })).toHaveAttribute('href', '/signup')
  })

  it('forwards acquisition query and safe invitation redirect and preserves the existing submit destination', async () => {
    applyUiVersion('v2')
    routeState.query = { redirect: '/client/invite/local-fixture', utm_medium: 'social', utm_source: 'source', access_token: 'not-forwarded' }
    const { container, auth } = renderView()
    const url = new URL(screen.getByRole('link', { name: /Я спеціаліст/ }).getAttribute('href')!, 'http://localhost')
    expect(Object.fromEntries(url.searchParams)).toEqual({ ui: 'v2', utm_source: 'source', utm_medium: 'social', redirect: '/client/invite/local-fixture' })
    await submitSignup(container)
    expect(auth.signupClient).toHaveBeenCalledWith('client@example.com', 'password123', undefined, { registration_contract_version: 2, first_name: 'Олена' })
    await waitFor(() => expect(routerPush).toHaveBeenCalledWith('/client/invite/local-fixture'))
  })

  it.each(['https://example.test', '//example.test'])('keeps the existing unsafe redirect fallback for %j', async (redirect) => {
    applyUiVersion('v2')
    routeState.query = { redirect }
    const { container } = renderView()
    expect(screen.getByRole('link', { name: /Я спеціаліст/ })).toHaveAttribute('href', '/signup?ui=v2')
    await submitSignup(container)
    await waitFor(() => expect(routerPush).toHaveBeenCalledWith('/client'))
  })

  it('shows a non-interactive example and public discovery without changing the field contract', () => {
    applyUiVersion('v2')
    const { container } = renderView()
    const preview = screen.getByRole('complementary', { name: 'Ваші запити й сесії — в одному місці' })
    expect(preview.textContent).toContain('Ілюстрація інтерфейсу. Це не ваші дані та не підтверджене бронювання.')
    expect(preview.querySelectorAll('a, button, input, [tabindex], img')).toHaveLength(0)
    expect(screen.getByRole('link', { name: 'Знайти спеціаліста →' })).toHaveAttribute('href', '/specialists?ui=v2')
    expect([...container.querySelectorAll('input')].map(input => [input.name, input.autocomplete])).toEqual([
      ['first_name', 'given-name'], ['email', 'email'], ['password', 'new-password'],
    ])
    expect(screen.getByRole('link', { name: 'Увійти' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Умовами користування' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Політикою конфіденційності' })).toHaveAttribute('href', '/privacy')
  })

  it('preserves values, errors and validation while reactively switching the client design', async () => {
    applyUiVersion('v2')
    const { container, auth } = renderView()
    await fireEvent.update(screen.getByRole('textbox', { name: /^Ім’я/ }), 'Олена')
    await fireEvent.update(screen.getByLabelText('Ел. пошта'), 'client@example.com')
    await fireEvent.submit(container.querySelector('form')!)
    expect(screen.getByRole('alert')).toHaveTextContent('Заповніть усі поля.')
    expect(auth.signupClient).not.toHaveBeenCalled()
    applyUiVersion('v1')
    await waitFor(() => expect(container.querySelector('.pc2-client-preview')).toBeNull())
    expect(screen.getByLabelText('Ел. пошта')).toHaveValue('client@example.com')
    expect(screen.getByText('Заповніть усі поля.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    applyUiVersion('v2')
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Заповніть усі поля.'))
    expect(screen.getByLabelText('Ел. пошта')).toHaveValue('client@example.com')
  })


  it('requires a meaningful v2 name before calling auth', async () => {
    applyUiVersion('v2')
    const { container, auth } = renderView()
    await fireEvent.submit(container.querySelector('form')!)
    expect(screen.getByRole('alert')).toHaveTextContent('Вкажіть ім’я.')
    expect(auth.signupClient).not.toHaveBeenCalled()
  })

  it.each([400, 429, 500])('keeps values, field errors and retry on status %s', async status => {
    applyUiVersion('v2')
    const { container, auth } = renderView()
    vi.mocked(auth.signupClient).mockRejectedValueOnce(new RegistrationError(`HTTP ${status}`, { first_name: 'Server name error' }))
    await submitSignup(container)
    await waitFor(() => expect(screen.getByText('Server name error')).toBeInTheDocument())
    expect(container.querySelector('[name="first_name"]')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Пароль')).toHaveValue('password123')
    expect(routerPush).not.toHaveBeenCalled()
    await fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(routerPush).toHaveBeenCalledWith('/client'))
  })

  it('prevents duplicate client requests during loading', async () => {
    applyUiVersion('v2')
    const { container, auth } = renderView()
    let done!: () => void
    vi.mocked(auth.signupClient).mockImplementationOnce(() => new Promise<void>(resolve => { done = resolve }))
    await submitSignup(container)
    await fireEvent.submit(container.querySelector('form')!)
    expect(auth.signupClient).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Створення акаунта...' })).toBeDisabled()
    done()
    await waitFor(() => expect(routerPush).toHaveBeenCalledWith('/client'))
  })
})
