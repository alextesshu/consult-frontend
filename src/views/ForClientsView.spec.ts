import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import ForClientsView from './ForClientsView.vue'
import { applyUiVersion } from '../lib/uiVersion'

async function mountPage(path = '/for-clients?ui=v2') {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/for-clients', component: ForClientsView },
    { path: '/', component: { template: '<div>Legacy home</div>' } },
    { path: '/specialists', component: { template: '<div>Discovery</div>' } },
    { path: '/signup-client', component: { template: '<div>Client signup</div>' } },
    { path: '/support-and-data-requests', component: { template: '<div>Support</div>' } },
  ] })
  await router.push(path)
  await router.isReady()
  render({ template: '<RouterView />' }, { global: { plugins: [router] } })
  return router
}

describe('For Clients v5 landing', () => {
  beforeEach(() => applyUiVersion('v2'))

  it('uses a single semantic page without duplicating the shared shell or fabricated profiles', async () => {
    await mountPage()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Від запиту до першої зустрічі' })).toBeVisible()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(document.querySelector('header, footer')).toBeNull()
    expect(document.querySelector('img, time')).toBeNull()
    expect(screen.getByText('Приклад інформації для вибору, а не результати пошуку.')).toBeVisible()
  })

  it('publishes canonical metadata without search or acquisition parameters and resets on leave', async () => {
    const router = await mountPage('/for-clients?ui=v2&utm_source=fixture')
    expect(document.title).toContain('знайдіть психолога')
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', `${window.location.origin}/for-clients`)
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).not.toContain('найближчим')
    await router.push('/')
    expect(document.title).not.toContain('знайдіть психолога')
  })

  it.each(['', '  тривога  ', '  ＡＢＣ  '])('hands off only normalized supported q on submit: %s', async (value) => {
    const router = await mountPage('/for-clients?ui=v2&returnTo=https://evil.example')
    await fireEvent.update(screen.getByRole('searchbox'), value)
    await fireEvent.submit(screen.getByRole('search'))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/specialists'))
    expect(router.currentRoute.value.query).toEqual({ ui: 'v2', ...(value.trim() ? { q: value.normalize('NFKC').trim() } : {}) })
  })

  it.each(['ab', 'x'.repeat(241)])('rejects invalid search length without navigation', async (value) => {
    const router = await mountPage()
    await fireEvent.update(screen.getByRole('searchbox'), value)
    await fireEvent.submit(screen.getByRole('search'))
    expect(screen.getByRole('alert')).toBeVisible()
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true')
    expect(router.currentRoute.value.path).toBe('/for-clients')
  })

  it('uses existing request_group filters rather than invented topic/nearest-slot parameters', async () => {
    const router = await mountPage()
    await fireEvent.click(screen.getByRole('link', { name: 'Вигорання' }))
    await waitFor(() => expect(router.currentRoute.value.query).toEqual({ request_group: 'work_career_burnout', ui: 'v2' }))
  })

  it('makes client signup optional and keeps working discovery/support destinations', async () => {
    await mountPage()
    expect(screen.getByRole('link', { name: 'Створити кабінет клієнта' })).toHaveAttribute('href', '/signup-client?ui=v2')
    expect(screen.getByRole('link', { name: /Переглянути всіх/ })).toHaveAttribute('href', '/specialists?ui=v2')
    expect(screen.getByRole('link', { name: /Перегляньте способи/ })).toHaveAttribute('href', '/support-and-data-requests')
  })

  it('opens one FAQ at a time with native buttons and labelled hidden regions', async () => {
    await mountPage()
    const first = screen.getByRole('button', { name: 'Скільки коштує консультація?' })
    const second = screen.getByRole('button', { name: 'Чи потрібно реєструватися?' })
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(second.getAttribute('aria-controls')!)).not.toBeVisible()
    await fireEvent.click(second)
    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(second).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'Чи потрібно реєструватися?' })).toBeVisible()
    await fireEvent.click(second)
    expect(screen.queryByRole('region', { name: 'Чи потрібно реєструватися?' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Скільки коштує консультація?' })).toBeNull()
  })

  it('does not publish unsupported privacy, payment, response or crisis guarantees', async () => {
    await mountPage()
    const text = document.body.textContent || ''
    expect(text).not.toMatch(/7333|112|протягом доби|лише спеціаліст|Найближче вікно/i)
    expect(text).toContain('не гарантує фіксованого строку')
    expect(text).toContain('не є підтвердженою сесією')
    expect(text).toContain('не обробляє оплату автоматично')
  })

  it('defaults to the existing v1 client-entry destination while retaining acquisition query', async () => {
    applyUiVersion('v1')
    const router = await mountPage('/for-clients?ui=v1&utm_source=fixture')
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
    expect(router.currentRoute.value.hash).toBe('#client-entry-title')
    expect(router.currentRoute.value.query).toEqual({ ui: 'v1', utm_source: 'fixture' })
    expect(document.querySelector('.pc2-for-clients')).toBeNull()
  })

  it('reacts to v2 to v1 switching without leaving v2 content visible', async () => {
    const router = await mountPage()
    applyUiVersion('v1')
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
    expect(document.querySelector('.pc2-for-clients')).toBeNull()
  })
})
