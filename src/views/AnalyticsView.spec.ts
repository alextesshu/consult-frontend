import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AnalyticsView from './AnalyticsView.vue'
import { apiGet } from '../lib/api'
import { type AnalyticsLevel, type AnalyticsOverview } from '../lib/analytics'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)

type OverviewOverrides = Omit<Partial<AnalyticsOverview>, 'metrics' | 'insights'> & {
  metrics?: Partial<AnalyticsOverview['metrics']>
  insights?: Partial<AnalyticsOverview['insights']>
}

function makeOverview(
  analyticsLevel: AnalyticsLevel,
  overrides: OverviewOverrides = {}
): AnalyticsOverview {
  const base: AnalyticsOverview = {
    range: '30d',
    analytics_level: analyticsLevel,
    leader_insights_min_bookings: 3,
    date_from: '2026-02-01',
    date_to: '2026-03-01',
    metrics: {
      bookings_count: 10,
      scheduled_count: 3,
      confirmed_count: 4,
      completed_count: 2,
      cancelled_count: 1,
      rescheduled_count: 2,
      online_sessions_count: 7,
      offline_sessions_count: 3,
      completed_online_sessions_count: 2,
      completed_offline_sessions_count: 1,
      confirmation_rate: 0.4,
      completion_rate: 0.5,
      cancellation_rate: 0.1,
    },
    sessions_by_day: [{ date: '2026-02-20', count: 3 }],
    bookings_by_day: [{ date: '2026-02-20', count: 3 }],
    sessions_by_offline_location: [{ location: 'Київ, кабінет 14', sessions_count: 3 }],
    top_weekdays: [{ weekday: 'monday', count: 3 }],
    top_hours: [{ hour: '10:00', count: 3 }],
    insights: {
      underused_weekdays: [{ weekday: 'tuesday', count: 1 }],
      underused_hours: [{ hour: '15:00', count: 1 }],
      reschedule_hotspots: [{ weekday: 'wednesday', hour: '12:00', count: 2 }],
      cancellation_hotspots: [{ weekday: 'thursday', hour: '09:00', count: 2 }],
      recommendations: [{ code: 'TEST', message: 'Test recommendation' }],
    },
  }

  return {
    ...base,
    ...overrides,
    metrics: {
      ...base.metrics,
      ...(overrides.metrics || {}),
    },
    insights: {
      ...base.insights,
      ...(overrides.insights || {}),
    },
    sessions_by_offline_location:
      overrides.sessions_by_offline_location ?? base.sessions_by_offline_location,
  }
}

function renderView() {
  return render(AnalyticsView, {
    global: {
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>',
        },
      },
    },
  })
}

function metricValueByLabel(label: string): string {
  const labelNode = screen.getByText(label)
  const card = labelNode.closest('.metric-card')
  if (!(card instanceof HTMLElement)) return ''
  const valueNode = within(card).queryByText(/^\d+$/)
  return valueNode?.textContent || ''
}

describe('AnalyticsView conditional premium rendering', () => {
  beforeEach(() => {
    mockedApiGet.mockReset()
  })

  it('shows all leader analytics blocks for leader level', async () => {
    mockedApiGet.mockResolvedValue(makeOverview('LEADER'))

    renderView()

    expect(
      await screen.findByText('Аналітика відображає основні сесії практики. Сесії без реєстрації сюди не входять.')
    ).toBeInTheDocument()
    expect(await screen.findByText('Рекомендації')).toBeInTheDocument()
    expect(screen.getByText('Часті перенесення')).toBeInTheDocument()
    expect(screen.getByText('Часті скасування')).toBeInTheDocument()
    expect(screen.getByText('Менш завантажені дні')).toBeInTheDocument()
    expect(screen.getByText('Менш завантажені години')).toBeInTheDocument()
    expect(screen.queryByText('Розширена аналітика')).not.toBeInTheDocument()
  })

  it('shows teaser and hides leader blocks for non-leader', async () => {
    mockedApiGet.mockResolvedValue(makeOverview('ADVANCED'))

    renderView()

    expect(await screen.findByText('Розширена аналітика')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Рекомендації')).not.toBeInTheDocument()
      expect(screen.queryByText('Часті перенесення')).not.toBeInTheDocument()
      expect(screen.queryByText('Часті скасування')).not.toBeInTheDocument()
      expect(screen.queryByText('Менш завантажені дні')).not.toBeInTheDocument()
      expect(screen.queryByText('Менш завантажені години')).not.toBeInTheDocument()
    })
  })

  it('shows empty state without teaser for non-leader when there is no data', async () => {
    const overview = makeOverview('ADVANCED')
    overview.metrics.bookings_count = 0
    mockedApiGet.mockResolvedValue(overview)

    renderView()

    expect(await screen.findByText('Поки що недостатньо даних для аналітики')).toBeInTheDocument()
    expect(screen.queryByText('Розширена аналітика')).not.toBeInTheDocument()
  })

  it('shows leader empty state threshold text when leader insights are not yet available', async () => {
    const overview = makeOverview('LEADER')
    overview.insights = {
      underused_weekdays: [],
      underused_hours: [],
      reschedule_hotspots: [],
      cancellation_hotspots: [],
      recommendations: [],
    }
    overview.leader_insights_min_bookings = 3
    overview.metrics.bookings_count = 2
    mockedApiGet.mockResolvedValue(overview)

    renderView()

    expect(await screen.findByText('Інсайти з’являться після щонайменше 3 записів.')).toBeInTheDocument()
    expect(screen.queryByText('Розширена аналітика')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Рекомендації')).not.toBeInTheDocument()
      expect(screen.queryByText('Часті перенесення')).not.toBeInTheDocument()
      expect(screen.queryByText('Часті скасування')).not.toBeInTheDocument()
      expect(screen.queryByText('Менш завантажені дні')).not.toBeInTheDocument()
      expect(screen.queryByText('Менш завантажені години')).not.toBeInTheDocument()
    })
  })

  it('renders new session format metrics and offline locations list', async () => {
    mockedApiGet.mockResolvedValue(
      makeOverview('LEADER', {
        metrics: {
          online_sessions_count: 12,
          offline_sessions_count: 5,
          completed_online_sessions_count: 7,
          completed_offline_sessions_count: 3,
        },
        sessions_by_offline_location: [
          { location: 'Київ, кабінет 14', sessions_count: 4 },
          { location: 'Львів, офіс 7', sessions_count: 1 },
        ],
      })
    )

    renderView()

    expect(await screen.findByText('Сесії за форматом')).toBeInTheDocument()
    expect(metricValueByLabel('Онлайн сесії')).toBe('12')
    expect(metricValueByLabel('Офлайн сесії')).toBe('5')
    expect(metricValueByLabel('Завершені онлайн')).toBe('7')
    expect(metricValueByLabel('Завершені офлайн')).toBe('3')

    expect(screen.getByText('Офлайн-локації')).toBeInTheDocument()
    expect(screen.getByText('Київ, кабінет 14')).toBeInTheDocument()
    expect(screen.getByText('Львів, офіс 7')).toBeInTheDocument()
  })

  it('renders clean empty state when offline locations list is empty', async () => {
    mockedApiGet.mockResolvedValue(
      makeOverview('ADVANCED', {
        sessions_by_offline_location: [],
      })
    )

    renderView()

    expect(await screen.findByText('Офлайн-локації')).toBeInTheDocument()
    expect(screen.getByText('Немає офлайн-сесій за цей період.')).toBeInTheDocument()
  })

  it('refreshes new format metrics and locations together when range changes', async () => {
    mockedApiGet.mockImplementation(async (_url, config) => {
      const range = (config as { params?: { range?: string } } | undefined)?.params?.range
      if (range === '7d') {
        return makeOverview('ADVANCED', {
          range: '7d',
          date_from: '2026-02-24',
          date_to: '2026-03-01',
          metrics: {
            online_sessions_count: 2,
            offline_sessions_count: 6,
            completed_online_sessions_count: 1,
            completed_offline_sessions_count: 5,
          },
          sessions_by_offline_location: [{ location: 'Одеса, кабінет 3', sessions_count: 6 }],
        })
      }
      return makeOverview('ADVANCED', {
        range: '30d',
        metrics: {
          online_sessions_count: 9,
          offline_sessions_count: 1,
          completed_online_sessions_count: 4,
          completed_offline_sessions_count: 1,
        },
        sessions_by_offline_location: [{ location: 'Київ, кабінет 14', sessions_count: 1 }],
      })
    })

    renderView()

    expect(await screen.findByText('Київ, кабінет 14')).toBeInTheDocument()
    expect(metricValueByLabel('Онлайн сесії')).toBe('9')
    expect(screen.getByText('Динаміка по днях')).toBeInTheDocument()
    expect(screen.getByText('Найчастіші дні')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: '7 днів' }))

    await waitFor(() => {
      expect(metricValueByLabel('Онлайн сесії')).toBe('2')
      expect(metricValueByLabel('Офлайн сесії')).toBe('6')
      expect(screen.getByText('Одеса, кабінет 3')).toBeInTheDocument()
      expect(screen.queryByText('Київ, кабінет 14')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Динаміка по днях')).toBeInTheDocument()
    expect(screen.getByText('Найчастіші дні')).toBeInTheDocument()
  })
})
