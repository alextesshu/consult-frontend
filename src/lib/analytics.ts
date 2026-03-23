export type AnalyticsLevel = 'NONE' | 'ADVANCED' | 'LEADER'

export type AnalyticsRange = '7d' | '30d' | '90d'

export type AnalyticsInsights = {
  underused_weekdays: Array<{ weekday: string; count: number }>
  underused_hours: Array<{ hour: string; count: number }>
  reschedule_hotspots: Array<{ weekday: string; hour: string; count: number }>
  cancellation_hotspots: Array<{ weekday: string; hour: string; count: number }>
  recommendations: Array<{ code: string; message: string }>
}

export type AnalyticsOfflineLocation = {
  location: string
  sessions_count: number
}

export type AnalyticsOverview = {
  range: AnalyticsRange
  analytics_level: AnalyticsLevel | string
  leader_insights_min_bookings: number
  date_from: string
  date_to: string
  metrics: AnalyticsMetrics
  sessions_by_day: Array<{ date: string; count: number }>
  bookings_by_day: Array<{ date: string; count: number }>
  sessions_by_offline_location: AnalyticsOfflineLocation[]
  top_weekdays: Array<{ weekday: string; count: number }>
  top_hours: Array<{ hour: string; count: number }>
  insights: AnalyticsInsights
}

export type AnalyticsMetrics = {
  bookings_count: number
  scheduled_count: number
  confirmed_count: number
  completed_count: number
  cancelled_count: number
  rescheduled_count: number
  online_sessions_count: number
  offline_sessions_count: number
  completed_online_sessions_count: number
  completed_offline_sessions_count: number
  confirmation_rate: number | null
  completion_rate: number | null
  cancellation_rate: number | null
}

export function getDefaultAnalyticsMetrics(): AnalyticsMetrics {
  return {
    bookings_count: 0,
    scheduled_count: 0,
    confirmed_count: 0,
    completed_count: 0,
    cancelled_count: 0,
    rescheduled_count: 0,
    online_sessions_count: 0,
    offline_sessions_count: 0,
    completed_online_sessions_count: 0,
    completed_offline_sessions_count: 0,
    confirmation_rate: null,
    completion_rate: null,
    cancellation_rate: null,
  }
}

export function isLeaderAnalyticsLevel(value: string | null | undefined): boolean {
  return String(value || '').trim().toUpperCase() === 'LEADER'
}
