export type AnalyticsLevel = 'NONE' | 'ADVANCED' | 'LEADER'

export type AnalyticsRange = '7d' | '30d' | '90d'

export type AnalyticsInsights = {
  underused_weekdays: Array<{ weekday: string; count: number }>
  underused_hours: Array<{ hour: string; count: number }>
  reschedule_hotspots: Array<{ weekday: string; hour: string; count: number }>
  cancellation_hotspots: Array<{ weekday: string; hour: string; count: number }>
  recommendations: Array<{ code: string; message: string }>
}

export type AnalyticsOverview = {
  range: AnalyticsRange
  analytics_level: AnalyticsLevel | string
  leader_insights_min_bookings: number
  date_from: string
  date_to: string
  metrics: {
    bookings_count: number
    scheduled_count: number
    confirmed_count: number
    completed_count: number
    cancelled_count: number
    rescheduled_count: number
    confirmation_rate: number | null
    completion_rate: number | null
    cancellation_rate: number | null
  }
  sessions_by_day: Array<{ date: string; count: number }>
  bookings_by_day: Array<{ date: string; count: number }>
  top_weekdays: Array<{ weekday: string; count: number }>
  top_hours: Array<{ hour: string; count: number }>
  insights: AnalyticsInsights
}

export function isLeaderAnalyticsLevel(value: string | null | undefined): boolean {
  return String(value || '').trim().toUpperCase() === 'LEADER'
}