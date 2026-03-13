import { formatUkTime } from './dateTime'

type SessionSlot = {
  start_at?: string | null
  end_at?: string | null
}

export type SessionExecutionLike = {
  status: string
  slot?: SessionSlot | number | null
  slot_start_at?: string | null
  slot_end_at?: string | null
  meeting_url?: string | null
  meeting_provider?: string | null
}

const ACTIVE_SESSION_STATUSES = new Set(['SCHEDULED', 'CONFIRMED'])

function sessionStartAt(session: Pick<SessionExecutionLike, 'slot' | 'slot_start_at'>) {
  if (session.slot && typeof session.slot === 'object') {
    return session.slot.start_at || session.slot_start_at || null
  }
  return session.slot_start_at || null
}

export function normalizeMeetingUrl(value?: string | null) {
  const raw = value?.trim()
  if (!raw) return ''

  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return ''
    }
    return parsed.toString()
  } catch {
    return ''
  }
}

export function hasExternalMeetingLink(session: Pick<SessionExecutionLike, 'meeting_url'>) {
  return Boolean(normalizeMeetingUrl(session.meeting_url))
}

export function canJoinExternalMeeting(
  session: Pick<SessionExecutionLike, 'status' | 'meeting_url'>
) {
  return ACTIVE_SESSION_STATUSES.has(session.status) && hasExternalMeetingLink(session)
}

export function externalMeetingProviderLabel(
  provider?: string | null,
  meetingUrl?: string | null
) {
  const normalizedProvider = provider?.trim().toLowerCase()
  if (normalizedProvider === 'google_meet' || normalizedProvider === 'google-meet') {
    return 'Google Meet'
  }
  if (normalizedProvider === 'zoom') {
    return 'Zoom'
  }

  const normalizedUrl = normalizeMeetingUrl(meetingUrl)
  if (normalizedUrl) {
    try {
      const host = new URL(normalizedUrl).hostname.toLowerCase()
      if (host === 'meet.google.com' || host.endsWith('.meet.google.com')) {
        return 'Google Meet'
      }
      if (host === 'zoom.us' || host.endsWith('.zoom.us')) {
        return 'Zoom'
      }
    } catch {
      return 'Зовнішня зустріч'
    }
  }

  return 'Зовнішня зустріч'
}

export function externalMeetingHint(
  session: Pick<SessionExecutionLike, 'slot' | 'slot_start_at' | 'meeting_provider' | 'meeting_url'>
) {
  const providerLabel = externalMeetingProviderLabel(session.meeting_provider, session.meeting_url)
  const timeLabel = formatUkTime(sessionStartAt(session), '')
  if (timeLabel) {
    return `${providerLabel} о ${timeLabel}. Посилання відкриється в новій вкладці.`
  }
  return `${providerLabel}. Посилання відкриється в новій вкладці.`
}
