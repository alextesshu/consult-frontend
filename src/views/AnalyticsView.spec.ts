import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AnalyticsView from './AnalyticsView.vue'
import { apiGet } from '../lib/api'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}))

type RateValue = number | null

type MockOverview = {
  range: '7d' | '30d' | '90d'
  analytics_level: string
  date_from: string
  date_to: string
  metrics: {
    bookings_count: number
    scheduled_count: number
    confirmed_count: number
    completed_count: number
    cancelled_count: number
    rescheduled_count: number
    confirmation_rate: RateValue
    completion_rate: RateValue
    cancellation_rate: RateValue
  }
  sessions_by_day: Array<{ date: string; count: number }>
  bookings_by_day: Array<{ date: string; count: number }>
  top_weekdays: Array<{ weekday: string; count: number }>
  top_hours: Array<{ hour: string; count: number }>
  insights: {
    underused_weekdays: Array<{ weekday: string; count: number }>
    underused_hours: Array<{ hour: string; count: number }>
    reschedule_hotspots: Array<{ weekday: string; hour: string; count: number }>
    cancellation_hotspots: Array<{ weekday: string; hour: string; count: number }>
    recommendations: Array<{ code: string; message: string }>
  }
}

const mockedApiGet = vi.mocked(apiGet)

function makeOverview(analyticsLevel: string): MockOverview {
  return {
    range: '30d',
    analytics_level: analyticsLevel,
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
    mockedApiGet.mockResolvedValue(makeOverview('leader'))

    renderView()

    expect(await screen.findByText('Рекомендації')).toBeInTheDocument()
    expect(screen.getByText('Часті перенесення')).toBeInTheDocument()
    expect(screen.getByText('Часті скасування')).toBeInTheDocument()
    expect(screen.getByText('Менш завантажені дні')).toBeInTheDocument()
    expect(screen.getByText('Менш завантажені години')).toBeInTheDocument()
    expect(screen.queryByText('Розширена аналітика')).not.toBeInTheDocument()
  })

  it('shows teaser and hides leader blocks for non-leader', async () => {
    mockedApiGet.mockResolvedValue(makeOverview('basic'))

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
})
