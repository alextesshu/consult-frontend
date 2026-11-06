import { render, screen, fireEvent, within, waitFor, cleanup } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { defineComponent } from 'vue'
import { createPinia } from 'pinia'
import AvailabilityRulesView from './AvailabilityRulesView.vue'
import SlotsView from './SlotsView.vue'
import { applyUiVersion } from '../lib/uiVersion'
import * as api from '../lib/api'

vi.mock('../lib/api', async importOriginal => ({
  ...await importOriginal<typeof import('../lib/api')>(),
  apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn(), apiDelete: vi.fn(),
  fetchSpecialistProfile: vi.fn(), getCabinetSchedule: vi.fn(),
  previewAvailabilityGeneration: vi.fn(), applyAvailabilityGeneration: vi.fn(),
}))
const rule = (id = 1, overrides = {}) => ({ id, specialist_id: 9, weekday: 0, start_time: '09:05:00', end_time: '12:05:00', session_duration_minutes: 45, buffer_minutes: 7, is_active: true, needs_regeneration: false, created_at: '', updated_at: '', ...overrides })
const pause = { id: 5, specialist_id: 9, starts_at: '2026-11-02T08:00:00Z', ends_at: '2026-11-02T11:00:00Z', is_all_day: false, note: 'Synthetic pause', is_active: false, created_at: '', updated_at: '' }
const preview = { date_range: { date_from: '2026-11-01', date_to: '2026-11-07' }, days_covered: 7, total_candidate_slots: 7, to_create_count: 4, existing_count: 1, to_delete_count: 2, skipped_duplicate_or_conflict_count: 1, booked_conflicts_count: 1, examples_to_create: [], examples_to_delete: [], booked_conflict_examples: [] }
const dialogStub = { props: ['label'], emits: ['close'], template: '<section role="dialog" :aria-label="label"><slot /></section>' }
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r }); return { promise, resolve } }

async function setup(path = '/cabinet/slots?tab=rules', realSlots = false) {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/cabinet/slots', component: realSlots ? SlotsView : AvailabilityRulesView },
    { path: '/cabinet/availability-exceptions', name: 'cabinet-schedule-vacation', component: AvailabilityRulesView },
    { path: '/cabinet/schedule', component: { template: '<p>Calendar</p>' } },
    { path: '/cabinet', component: { template: '<p>Cabinet</p>' } },
    { path: '/cabinet/availability-rules', redirect: '/cabinet/slots?tab=availability' },
  ] })
  await router.push(path); await router.isReady()
  const result = render(defineComponent({ template: '<RouterView />' }), { global: { plugins: [router, createPinia()], stubs: { ScheduleSlotDialogV2: dialogStub } } })
  await waitFor(() => expect(api.apiGet).toHaveBeenCalled())
  await waitFor(() => expect(screen.queryByText('Завантажуємо або зберігаємо…')).not.toBeInTheDocument())
  return { router, ...result }
}
async function openCreate() { await fireEvent.click(screen.getAllByRole('button', { name: '+ Проміжок' })[0]!); return within(screen.getByRole('dialog')) }
beforeEach(() => {
  vi.resetAllMocks(); applyUiVersion('v2')
  vi.mocked(api.apiGet).mockImplementation(async path => path.includes('exceptions') ? [pause] : path.includes('availability-rules') ? [rule(), rule(2, { start_time: '14:00:00', end_time: '17:00:00', session_duration_minutes: 60, buffer_minutes: 15, is_active: false })] : [])
  vi.mocked(api.fetchSpecialistProfile).mockResolvedValue({ standard_session_duration_minutes: 50 } as any)
  vi.mocked(api.getCabinetSchedule).mockResolvedValue({ results: [] } as any)
  vi.mocked(api.previewAvailabilityGeneration).mockResolvedValue(preview)
  vi.mocked(api.applyAvailabilityGeneration).mockResolvedValue({ ...preview, created_count: 3, deleted_count: 1 })
  vi.mocked(api.apiPost).mockResolvedValue(rule(3))
  vi.mocked(api.apiPatch).mockResolvedValue(rule())
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); applyUiVersion('v1') })

describe('UI v2 working hours and vacation', () => {
  it('renders seven days, multiple persisted intervals and own settings without writes', async () => {
    await setup(); expect(screen.getAllByRole('heading', { level: 2 }).map(x => x.textContent)).toEqual(expect.arrayContaining(['Понеділок', 'Неділя']))
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByText('45 хв · пауза 7 хв')).toBeInTheDocument()
    expect(screen.getByText('60 хв · пауза 15 хв')).toBeInTheDocument()
    expect(screen.getAllByRole('switch')[1]).toHaveAttribute('aria-checked', 'false')
    expect(api.apiPost).not.toHaveBeenCalled(); expect(api.apiPatch).not.toHaveBeenCalled()
  })
  it('preserves rule ID, nonstandard times, duration and buffer on individual edit', async () => {
    await setup(); await fireEvent.click(screen.getAllByRole('button', { name: 'Редагувати' })[0]!)
    const form = screen.getByRole('button', { name: 'Зберегти проміжок' }).closest('form')!
    expect(within(form).getByLabelText('Початок')).toHaveValue('09:05')
    await fireEvent.update(within(form).getByLabelText('Кінець'), '13:05')
    await fireEvent.submit(form)
    await waitFor(() => expect(api.apiPatch).toHaveBeenCalledWith('/cabinet/availability-rules/1/', expect.objectContaining({ end_time: '13:05', session_duration_minutes: 45, buffer_minutes: 7 })))
  })
  it('creates one inactive interval explicitly and blocks duplicate submission', async () => {
    await setup(); const ui = await openCreate(); await fireEvent.click(ui.getByLabelText('Активний проміжок'))
    const pending = deferred<any>(); vi.mocked(api.apiPost).mockReturnValue(pending.promise)
    const form = ui.getByRole('button', { name: 'Зберегти проміжок' }).closest('form')!
    await fireEvent.submit(form); await fireEvent.submit(form)
    expect(api.apiPost).toHaveBeenCalledTimes(1)
    expect(api.apiPost).toHaveBeenCalledWith('/cabinet/availability-rules/', expect.objectContaining({ is_active: false, weekday: 0 }))
    pending.resolve(rule(3)); await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
  it('keeps draft and other intervals after failed save', async () => {
    await setup(); const ui = await openCreate(); await fireEvent.update(ui.getByLabelText('Початок'), '10:00')
    vi.mocked(api.apiPost).mockRejectedValue(new Error('Synthetic rejected interval'))
    await fireEvent.submit(ui.getByRole('button', { name: 'Зберегти проміжок' }).closest('form')!)
    await waitFor(() => expect(ui.getByRole('alert')).toBeInTheDocument())
    expect(ui.getByLabelText('Початок')).toHaveValue('10:00'); expect(screen.getAllByRole('article')).toHaveLength(2)
  })
  it('rejects reversed interval without POST', async () => {
    await setup(); const ui = await openCreate(); await fireEvent.update(ui.getByLabelText('Кінець'), '08:00')
    await fireEvent.submit(ui.getByRole('button', { name: 'Зберегти проміжок' }).closest('form')!)
    expect(ui.getByRole('alert')).toHaveTextContent('пізніше'); expect(api.apiPost).not.toHaveBeenCalled()
  })
  it('toggles only the chosen persisted rule', async () => {
    await setup(); await fireEvent.click(screen.getAllByRole('switch')[1]!)
    expect(api.apiPatch).toHaveBeenCalledWith('/cabinet/availability-rules/2/', { is_active: true })
  })
  it('deletes only after explicit confirmation', async () => {
    await setup(); await fireEvent.click(screen.getAllByRole('button', { name: 'Видалити' })[0]!)
    expect(api.apiDelete).not.toHaveBeenCalled()
    const modal = screen.getByRole('dialog'); await fireEvent.click(within(modal).getByRole('button', { name: 'Видалити' }))
    await waitFor(() => expect(api.apiDelete).toHaveBeenCalledWith('/cabinet/availability-rules/1/'))
  })
  it('previews chosen period without applying and invalidates preview on period change', async () => {
    await setup(); await fireEvent.click(screen.getByRole('button', { name: 'Переглянути генерацію' }))
    await screen.findByText('Попередній перегляд — не створені вікна')
    expect(screen.getByText(/До створення: 4/)).toHaveTextContent('До видалення: 2')
    expect(api.applyAvailabilityGeneration).not.toHaveBeenCalled()
    await fireEvent.update(screen.getByLabelText('По'), '2026-12-01')
    expect(screen.queryByRole('button', { name: 'Підтвердити генерацію' })).not.toBeInTheDocument()
  })
  it('requires destructive confirmation, applies once and reloads persisted slots', async () => {
    await setup(); await fireEvent.click(screen.getByRole('button', { name: 'Переглянути генерацію' })); await screen.findByText('Попередній перегляд — не створені вікна')
    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити генерацію' }))
    expect(api.applyAvailabilityGeneration).not.toHaveBeenCalled()
    await fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Застосувати' }))
    await waitFor(() => expect(api.apiGet).toHaveBeenCalledWith('/cabinet/slots/'))
    expect(api.applyAvailabilityGeneration).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByText(/Створено: 3 · Видалено: 1/)).toBeInTheDocument())
  })
  it('invalidates a rejected apply and requires a new preview', async () => {
    await setup(); vi.mocked(api.previewAvailabilityGeneration).mockResolvedValue({ ...preview, to_delete_count: 0 })
    await fireEvent.click(screen.getByRole('button', { name: 'Переглянути генерацію' })); await screen.findByText('Попередній перегляд — не створені вікна')
    vi.mocked(api.applyAvailabilityGeneration).mockRejectedValue(new Error('Stale server state'))
    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити генерацію' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Підтвердити генерацію' })).not.toBeInTheDocument()
  })
  it('prevents navigation discarding a changed interval and does not PATCH', async () => {
    const { router } = await setup(); const ui = await openCreate(); await fireEvent.update(ui.getByLabelText('Початок'), '10:00')
    vi.mocked(window.confirm).mockReturnValue(false)
    await router.push('/cabinet/availability-exceptions')
    expect(router.currentRoute.value.path).toBe('/cabinet/slots'); expect(api.apiPost).not.toHaveBeenCalled()
    expect(window.confirm).toHaveBeenCalled()
  })
  it('preserves partial-day inactive pauses and private notes', async () => {
    await setup('/cabinet/availability-exceptions')
    expect(screen.getByText('Частина дня · Неактивна')).toBeInTheDocument()
    expect(screen.getByText('Synthetic pause')).toBeInTheDocument()
    expect(screen.getByText(/Пауза враховується/)).toHaveTextContent('не скасовуються')
    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати' }))
    const form = screen.getByRole('button', { name: 'Зберегти паузу' }).closest('form')!
    await fireEvent.update(within(form).getByLabelText('Примітка — бачите лише ви'), 'Synthetic changed')
    await fireEvent.submit(form)
    await waitFor(() => expect(api.apiPatch).toHaveBeenCalledWith('/cabinet/availability-exceptions/5/', expect.objectContaining({ is_all_day: false, is_active: false, starts_at: new Date(pause.starts_at).toISOString(), ends_at: new Date(pause.ends_at).toISOString(), note: 'Synthetic changed' })))
  })
  it('creates all-day pauses only on submit', async () => {
    await setup('/cabinet/availability-exceptions')
    const form = screen.getByRole('button', { name: 'Додати паузу' }).closest('form')!
    for (const [label, value] of [['Дата початку', '2026-11-10'], ['Дата завершення', '2026-11-11'], ['Час початку', '00:00'], ['Час завершення', '00:00']]) await fireEvent.update(within(form).getByLabelText(label!), value!)
    expect(api.apiPost).not.toHaveBeenCalled(); await fireEvent.submit(form)
    await waitFor(() => expect(api.apiPost).toHaveBeenCalledWith('/cabinet/availability-exceptions/', expect.objectContaining({ is_all_day: true, is_active: true })))
  })
  it('mounts rules from SlotsView deep link without parallel slot/calendar loads', async () => {
    await setup('/cabinet/slots?tab=rules', true)
    expect(screen.getByRole('heading', { name: 'Робочі години', level: 1 })).toBeInTheDocument()
    expect(api.apiGet).not.toHaveBeenCalledWith('/cabinet/slots/')
    expect(api.getCabinetSchedule).not.toHaveBeenCalled()
  })
  it('keeps legacy vacation composition for v1', async () => {
    applyUiVersion('v1'); const { container } = await setup('/cabinet/availability-exceptions')
    expect(container.querySelector('.availability-rules')).toBeInTheDocument()
    expect(container.querySelector('.pc2-schedule-editor')).not.toBeInTheDocument()
    expect(api.apiPost).not.toHaveBeenCalled()
  })
  it('does not enable editing until the initial profile defaults are resolved', async () => {
    const pending = deferred<any>(); vi.mocked(api.fetchSpecialistProfile).mockReturnValue(pending.promise)
    const mounting = setup()
    await screen.findByRole('heading', { name: 'Робочі години', level: 1 })
    expect(screen.queryAllByRole('button', { name: '+ Проміжок' })).toHaveLength(0)
    pending.resolve({ standard_session_duration_minutes: 55 }); await mounting
    const ui = await openCreate(); expect(ui.getByLabelText('Тривалість сесії, хв')).toHaveValue(55)
  })
  it('reports loading errors without pretending there are no saved intervals', async () => {
    vi.mocked(api.apiGet).mockRejectedValue(new Error('Synthetic unavailable'))
    await setup(); expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(api.apiPost).not.toHaveBeenCalled()
  })
  it('requires another preview after a saved rule changes', async () => {
    await setup(); await fireEvent.click(screen.getByRole('button', { name: 'Переглянути генерацію' }))
    await screen.findByText('Попередній перегляд — не створені вікна')
    await fireEvent.click(screen.getAllByRole('switch')[0]!)
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Підтвердити генерацію' })).not.toBeInTheDocument())
    expect(api.applyAvailabilityGeneration).not.toHaveBeenCalled()
  })
  it('clears a failed preview without an apply control', async () => {
    await setup(); vi.mocked(api.previewAvailabilityGeneration).mockRejectedValue(new Error('Synthetic preview conflict'))
    await fireEvent.click(screen.getByRole('button', { name: 'Переглянути генерацію' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Підтвердити генерацію' })).not.toBeInTheDocument()
  })
  it('reports confirmed application separately from a failed slot reload', async () => {
    await setup(); vi.mocked(api.previewAvailabilityGeneration).mockResolvedValue({ ...preview, to_delete_count: 0 })
    await fireEvent.click(screen.getByRole('button', { name: 'Переглянути генерацію' })); await screen.findByText('Попередній перегляд — не створені вікна')
    vi.mocked(api.apiGet).mockImplementation(async path => { if (path === '/cabinet/slots/') throw new Error('Synthetic reload failure'); return [rule()] })
    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити генерацію' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Генерацію застосовано'))
    expect(api.applyAvailabilityGeneration).toHaveBeenCalledTimes(1)
  })
  it('retains a failed pause draft and rejects reversed dates without POST', async () => {
    await setup('/cabinet/availability-exceptions')
    const form = screen.getByRole('button', { name: 'Додати паузу' }).closest('form')!
    for (const [label, value] of [['Дата початку', '2026-11-11'], ['Дата завершення', '2026-11-10'], ['Час початку', '00:00'], ['Час завершення', '00:00']]) await fireEvent.update(within(form).getByLabelText(label!), value!)
    await fireEvent.submit(form); expect(api.apiPost).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('пізніше')
    await fireEvent.update(within(form).getByLabelText('Дата завершення'), '2026-11-12')
    vi.mocked(api.apiPost).mockRejectedValue(new Error('Synthetic pause failure'))
    await fireEvent.submit(form); await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(within(form).getByLabelText('Дата початку')).toHaveValue('2026-11-11')
  })
  it('deletes a pause only after confirmation and reloads server state', async () => {
    await setup('/cabinet/availability-exceptions'); await fireEvent.click(screen.getByRole('button', { name: 'Видалити' }))
    expect(api.apiDelete).not.toHaveBeenCalled()
    await fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Видалити' }))
    await waitFor(() => expect(api.apiDelete).toHaveBeenCalledWith('/cabinet/availability-exceptions/5/'))
    expect(vi.mocked(api.apiGet).mock.calls.filter(([path]) => path === '/cabinet/availability-exceptions/').length).toBe(2)
  })
  it('restores section state through browser history without mutations', async () => {
    const { router } = await setup('/cabinet/slots?tab=rules', true)
    await router.push('/cabinet/availability-exceptions'); await screen.findByRole('heading', { name: 'Відпустка й паузи' })
    router.back(); await screen.findByRole('heading', { name: 'Робочі години', level: 1 })
    router.forward(); await screen.findByRole('heading', { name: 'Відпустка й паузи' })
    expect(api.apiPost).not.toHaveBeenCalled(); expect(api.apiPatch).not.toHaveBeenCalled()
  })
  it('preserves the legacy rules redirect', async () => {
    const { router } = await setup('/cabinet/availability-rules')
    expect(router.currentRoute.value.fullPath).toBe('/cabinet/slots?tab=availability')
  })
  it('does not mark another pause draft saved when one record succeeds', async () => {
    const { router } = await setup('/cabinet/availability-exceptions')
    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати' }))
    const creation = screen.getByRole('button', { name: 'Додати паузу' }).closest('form')!
    await fireEvent.update(within(creation).getByLabelText('Примітка — бачите лише ви'), 'Unsaved second draft')
    const editing = screen.getByRole('button', { name: 'Зберегти паузу' }).closest('form')!
    await fireEvent.update(within(editing).getByLabelText('Примітка — бачите лише ви'), 'Saved first draft')
    await fireEvent.submit(editing)
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Зберегти паузу' })).not.toBeInTheDocument())
    vi.mocked(window.confirm).mockReturnValue(false)
    await router.push('/cabinet/slots?tab=rules')
    expect(router.currentRoute.value.path).toBe('/cabinet/availability-exceptions')
    expect(window.confirm).toHaveBeenCalled()
    expect(within(creation).getByLabelText('Примітка — бачите лише ви')).toHaveValue('Unsaved second draft')
  })
  it('keeps dirty sheet closing confirmation inside the dialog', async () => {
    await setup(); const ui = await openCreate()
    await fireEvent.update(ui.getByLabelText('Початок'), '10:15')
    await fireEvent.click(ui.getByRole('button', { name: 'Закрити' }))
    expect(window.confirm).not.toHaveBeenCalled()
    expect(ui.getByRole('button', { name: 'Зберегти проміжок' })).toBeDisabled()
    await fireEvent.click(ui.getByRole('button', { name: 'Продовжити редагування' }))
    expect(ui.getByLabelText('Початок')).toHaveValue('10:15')
    await fireEvent.click(ui.getByRole('button', { name: 'Закрити' }))
    await fireEvent.click(ui.getByRole('button', { name: 'Відкинути зміни' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.apiPost).not.toHaveBeenCalled()
  })
  it('clears only an explicitly discarded edit when opening a new interval', async () => {
    await setup(); await fireEvent.click(screen.getAllByRole('button', { name: 'Редагувати' })[0]!)
    await fireEvent.update(screen.getByLabelText('Кінець'), '13:00')
    await openCreate()
    expect(window.confirm).toHaveBeenCalledTimes(1)
    await fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Закрити' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.apiPatch).not.toHaveBeenCalled()
  })
})
