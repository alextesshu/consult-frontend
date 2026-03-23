import { describe, expect, it } from 'vitest'
import {
  canJoinExternalMeeting,
  externalMeetingHint,
  externalMeetingProviderLabel,
  normalizeMeetingUrl,
} from './sessionExecution'

describe('sessionExecution', () => {
  it('normalizes only http and https meeting links', () => {
    expect(normalizeMeetingUrl(' https://meet.google.com/test-room ')).toBe(
      'https://meet.google.com/test-room'
    )
    expect(normalizeMeetingUrl('javascript:alert(1)')).toBe('')
    expect(normalizeMeetingUrl('/relative/path')).toBe('')
  })

  it('derives provider labels from explicit provider or URL hostname', () => {
    expect(externalMeetingProviderLabel('google_meet', null)).toBe('Google Meet')
    expect(externalMeetingProviderLabel(null, 'https://zoom.us/j/123')).toBe('Zoom')
    expect(externalMeetingProviderLabel(null, 'https://example.com/room')).toBe('Зовнішня зустріч')
  })

  it('shows join availability only for active sessions with a valid external link', () => {
    expect(
      canJoinExternalMeeting({
        status: 'CONFIRMED',
        meeting_url: 'https://meet.google.com/test-room',
      })
    ).toBe(true)

    expect(
      canJoinExternalMeeting({
        status: 'COMPLETED',
        meeting_url: 'https://meet.google.com/test-room',
      })
    ).toBe(false)

    expect(
      canJoinExternalMeeting({
        status: 'CONFIRMED',
        session_format: 'offline',
        meeting_url: 'https://meet.google.com/test-room',
      })
    ).toBe(false)
  })

  it('builds a human hint for external meeting links', () => {
    expect(
      externalMeetingHint({
        slot_start_at: '2026-03-12T10:00:00Z',
        meeting_provider: 'zoom',
        meeting_url: 'https://zoom.us/j/123',
      })
    ).toMatch(/Zoom/)
  })
})
