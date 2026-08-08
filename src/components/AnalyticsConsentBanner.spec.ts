import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import AnalyticsConsentBanner from './AnalyticsConsentBanner.vue'

function renderBanner(preference: 'unknown' | 'allowed' | 'denied' = 'unknown') {
  return render(AnalyticsConsentBanner, {
    props: { open: true, preference, error: '' },
    global: { stubs: { RouterLink: { template: '<a href="/privacy"><slot /></a>' } } },
  })
}

describe('AnalyticsConsentBanner', () => {
  it('offers equally accessible allow and decline choices without a preselected state', () => {
    renderBanner()

    expect(screen.getByRole('heading', { name: 'Файли cookie та аналітика' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Лише необхідні' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Дозволити аналітику' })).toBeEnabled()
    expect(screen.getByText('Ми не передаємо в аналітику чутливі дані або інформацію, яку ви вводите у Pro Consult.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Налаштування конфіденційності' })).toBeInTheDocument()
  })

  it('emits an explicit choice and focuses the opened panel', async () => {
    const { emitted } = renderBanner()

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Файли cookie та аналітика' })).toHaveFocus()
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Дозволити аналітику' }))

    expect(emitted().select).toEqual([['allowed']])
  })

  it('shows the current preference and permits closing a reopened panel', async () => {
    const { emitted } = renderBanner('denied')

    expect(screen.getByText('Поточний вибір аналітики: вимкнено.')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Закрити налаштування аналітики' }))
    expect(emitted().close).toEqual([[]])
  })
})
