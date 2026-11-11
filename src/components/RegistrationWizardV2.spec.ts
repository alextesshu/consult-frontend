import { render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import RegistrationWizardV2 from './RegistrationWizardV2.vue'

function props() {
  return { role: 'specialist' as const, step: 0, busy: false, firstName: '', email: '', password: '', professionalFocus: '' as const, showPassword: false, error: '', fieldErrors: {} }
}
afterEach(() => vi.unstubAllGlobals())
describe('registration P6 presentation', () => {
  it('uses three real specialist steps and keeps required focus errors accessible', async () => {
    const view = render(RegistrationWizardV2, { props: props(), global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } })
    expect(screen.getByRole('status')).toHaveTextContent('Крок 1 з 3')
    expect(view.container.querySelector('[name=password_confirm]')).toBeNull()
    await view.rerender({ step: 1, fieldErrors: { professional_focus: 'Choose a practice' } })
    await nextTick()
    expect(screen.getAllByRole('radio')).toHaveLength(6)
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a practice')
    expect(document.activeElement).toHaveAttribute('name', 'professional_focus')
    await view.rerender({ step: 2, fieldErrors: { password: 'Password error' } })
    await nextTick()
    expect(document.activeElement).toHaveAttribute('name', 'password')
    expect(view.container.querySelector('[name=password]')).toHaveAttribute('aria-describedby', 'registration-password-error')
  })
  it('does not expose an enabled navigation or input during final loading', () => {
    const view = render(RegistrationWizardV2, { props: { ...props(), step: 2, busy: true }, global: { stubs: { RouterLink: true } } })
    expect(screen.getByRole('button', { name: 'Створення акаунта...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Назад' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Показати пароль' })).toBeDisabled()
    expect(view.container.querySelector('form')).toHaveAttribute('aria-busy', 'true')
  })
  it('keeps keyboard focus above the mobile action footer without moving on typing', async () => {
    const frame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { callback(0); return 1 })
    const scroll = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    const view = render(RegistrationWizardV2, { props: props(), global: { stubs: { RouterLink: true } } })
    const field = view.container.querySelector<HTMLInputElement>('input')!
    const footer = view.container.querySelector<HTMLElement>('.pc2-registration-actions')!
    vi.spyOn(field, 'getBoundingClientRect').mockReturnValue({ top: 600, bottom: 650, height: 50 } as DOMRect)
    vi.spyOn(footer, 'getBoundingClientRect').mockReturnValue({ top: 580 } as DOMRect)
    try {
      field.focus()
      expect(scroll).toHaveBeenCalledWith({ top: 82, behavior: 'instant' })
      scroll.mockClear()
      field.value = 'Typing preserves scroll'
      field.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      expect(scroll).not.toHaveBeenCalled()
    } finally {
      view.unmount()
      frame.mockRestore()
      scroll.mockRestore()
    }
  })
  it('cancels source animations and media listeners on unmount and skips reduced motion', async () => {
    const remove = vi.fn(), cancel = vi.fn()
    const animate = vi.fn().mockReturnValue({ cancel })
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate')
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate })
    let reduced = false
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: reduced && query.includes('prefers-reduced-motion'), addEventListener: vi.fn(), removeEventListener: remove })))
    try {
      const view = render(RegistrationWizardV2, { props: props(), global: { stubs: { RouterLink: true } } })
      expect(animate).toHaveBeenCalledTimes(2)
      view.unmount()
      expect(cancel).toHaveBeenCalledTimes(2)
      reduced = true
      const quiet = render(RegistrationWizardV2, { props: props(), global: { stubs: { RouterLink: true } } })
      expect(animate).toHaveBeenCalledTimes(2)
      quiet.unmount()
      expect(remove).toHaveBeenCalled()
    } finally {
      if (original) Object.defineProperty(HTMLElement.prototype, 'animate', original)
      else Reflect.deleteProperty(HTMLElement.prototype, 'animate')
    }
  })
})
