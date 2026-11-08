import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { CalendarAction } from '../../lib/calendarActions'
import CalendarActionsList from './CalendarActionsList.vue'

const action: CalendarAction = { key: 'confirm:1', kind: 'confirm', when: Date.parse('2026-11-09T16:00Z'), who: 'Синтетичний клієнт', reason: 'сесія чекає підтвердження', marker: '? Підтвердити', primaryLabel: 'Підтвердити', href: '/cabinet/sessions/1', sessionId: 1 }
function mount(thisWeek: CalendarAction[] = [], elsewhere: CalendarAction[] = [], complete = true) {
  const retry = vi.fn()
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }] })
  return { ...render(CalendarActionsList, { props: { thisWeek, elsewhere, complete, failedLabels: 'запити на сесію', timeZone: 'UTC', onRetry: retry }, global: { plugins: [router] } }), retry }
}
describe('CalendarActionsList guidance', () => {
  it('explains actionable work without counter arithmetic or internal implementation details', () => {
    const { container } = mount([action])
    expect(screen.getByRole('heading', { name: 'Потребує вашої уваги' })).toBeInTheDocument()
    expect(screen.getByText(/Підтверджуйте сесії, додавайте посилання/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Підтвердити: Синтетичний клієнт' })).toHaveAttribute('href', '/cabinet/sessions/1')
    expect(container).not.toHaveTextContent(/Як рахуємо|Сума|API|загального лічильника/)
    expect(screen.queryByText(/Лічильник вкладки/)).not.toBeInTheDocument()
  })
  it('clarifies the global scope only when another date or an undated request is present', () => {
    mount([action], [{ ...action, key: 'request:2', when: null }])
    expect(screen.getByText('Лічильник вкладки не обмежений вибраним тижнем.')).toBeInTheDocument()
    expect(screen.getByText('Без часу')).toBeInTheDocument()
    expect(screen.getAllByText('1 дія')).toHaveLength(2)
  })
  it('does not add a zero-count explanation to the empty state', () => {
    const { container } = mount()
    expect(container.querySelector('.pc2-cal-actions__how')).not.toHaveTextContent(/0|Лічильник/)
    expect(screen.getByText('У вибраному тижні дій немає.')).toBeInTheDocument()
  })
  it('retains partial-data feedback and retry without claiming a complete global count', async () => {
    const { retry } = mount([action], [], false)
    expect(screen.getByText(/Не вдалося завантажити: запити на сесію. Показані лише доступні справи/)).toBeInTheDocument()
    expect(screen.queryByText(/Лічильник вкладки/)).not.toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Повторити' }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
