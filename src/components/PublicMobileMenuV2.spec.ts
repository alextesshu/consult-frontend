import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { defineComponent, h, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import PublicMobileMenuV2 from './PublicMobileMenuV2.vue'
import { PUBLIC_MENU_ITEMS, PUBLIC_MENU_PRIMARY } from '../lib/publicMobileMenu'
import { applyUiVersion } from '../lib/uiVersion'
import appRouter from '../router'

const stub = { template: '<div />' }
function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: ['/', '/for-clients', '/specialists', '/faq', '/signup', '/signup-client', '/login'].map((path) => ({ path, component: stub })),
  })
}

async function renderMenu(audience: 'specialists' | 'clients' = 'specialists') {
  const router = makeRouter()
  await router.push('/')
  await router.isReady()
  const open = ref(false)
  const Harness = defineComponent({
    setup() {
      const trigger = ref<HTMLElement | null>(null)
      return () => [
        h('button', { ref: trigger, type: 'button', onClick: () => { open.value = true } }, 'Меню сайту'),
        h(PublicMobileMenuV2, { open: open.value, audience, trigger: trigger.value, 'onUpdate:open': (value: boolean) => { open.value = value } }),
      ]
    },
  })
  return { router, open, ...render(Harness, { global: { plugins: [router] } }) }
}

describe('Public mobile menu P2 (Public-Mobile.dc.html)', () => {
  beforeEach(() => applyUiVersion('v2'))
  afterEach(() => { applyUiVersion('v1'); document.body.style.overflow = ''; document.documentElement.style.overflow = '' })

  it('maps every item and action to an existing production route or page section', () => {
    const links = [...PUBLIC_MENU_ITEMS.specialists, ...PUBLIC_MENU_ITEMS.clients, ...Object.values(PUBLIC_MENU_PRIMARY), { label: 'Увійти', to: '/login' }]
    for (const link of links) {
      const resolved = appRouter.resolve(link.to)
      expect(resolved.matched.length, link.to).toBeGreaterThan(0)
      expect(resolved.matched.some((record) => record.path.includes(':pathMatch')), link.to).toBe(false)
    }
    expect(PUBLIC_MENU_ITEMS.specialists.map((item) => item.label)).toEqual(['Як це працює', 'Можливості', 'Тарифи', 'Часті питання'])
    expect(JSON.stringify(PUBLIC_MENU_ITEMS)).not.toContain('Блог')
    expect(PUBLIC_MENU_PRIMARY.specialists.to).toBe('/signup')
  })

  it('opens as a full-screen modal with audience switch, 56px rows and bottom actions', async () => {
    await renderMenu()
    expect(screen.queryByRole('dialog')).toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: 'Меню сайту' }))
    const dialog = await screen.findByRole('dialog', { name: 'Меню сайту' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('link', { name: 'Для спеціалістів' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Для клієнтів' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Створити простір' })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('link', { name: 'Увійти' })).toHaveAttribute('href', '/login')
    expect(document.body.style.overflow).toBe('hidden')
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Закрити меню' })))
  })

  it('closes with Escape and the close button, restoring scroll and trigger focus', async () => {
    await renderMenu()
    const trigger = screen.getByRole('button', { name: 'Меню сайту' })
    await fireEvent.click(trigger)
    await screen.findByRole('dialog')
    await fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.body.style.overflow).toBe('')
    await waitFor(() => expect(document.activeElement).toBe(trigger))
    await fireEvent.click(trigger)
    await fireEvent.click(await screen.findByRole('button', { name: 'Закрити меню' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('closes after navigating through an item and shows client items for the client audience', async () => {
    const { router } = await renderMenu('clients')
    await fireEvent.click(screen.getByRole('button', { name: 'Меню сайту' }))
    await screen.findByRole('dialog')
    expect(screen.getByRole('link', { name: 'Для клієнтів' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Створити кабінет клієнта' })).toHaveAttribute('href', '/signup-client')
    await fireEvent.click(screen.getByRole('link', { name: /Знайти спеціаліста/ }))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/specialists'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
