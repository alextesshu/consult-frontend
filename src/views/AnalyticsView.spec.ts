import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AnalyticsView from './AnalyticsView.vue'
import { apiGet } from '../lib/api'
import { type AnalyticsLevel, type AnalyticsOverview } from '../lib/analytics'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)

function makeOverview(analyticsLevel: AnalyticsLevel): AnalyticsOverview {
  return {
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
      confirmation_rate: 0.4,
      completion_rate: 0.5,
      cancellation_rate: 0.1,
    },
    sessions_by_day: [{ date: '2026-02-20', count: 3 }],
    bookings_by_day: [{ date: '2026-02-20', count: 3 }],
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

describe('AnalyticsView conditional premium rendering', () => {
  beforeEach(() => {
    mockedApiGet.mockReset()
  })

  it('shows all leader analytics blocks for leader level', async () => {
    mockedApiGet.mockResolvedValue(makeOverview('LEADER'))

    renderView()

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
})
