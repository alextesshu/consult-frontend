import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from './http'
import {
  createClientRegularTime,
  createNextSessionFromClientRegularTime,
  fetchClientRegularTimes,
  materializeClientRegularTimeSessions,
  pauseClientRegularTime,
  resumeClientRegularTime,
  updateClientRegularTime,
} from './api'

vi.mock('./http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

const mockedHttp = {
  get: vi.mocked(http.get),
  post: vi.mocked(http.post),
  patch: vi.mocked(http.patch),
}

const record = {
  id: 1,
  client_record: 5,
  weekday: 2,
  start_time: '15:00',
  duration_minutes: 50,
  frequency: 'weekly',
  starts_on: '2026-05-20',
  timezone: 'Europe/Kyiv',
  session_format: 'online',
  meeting_url: '',
  offline_location: '',
  status: 'active',
  paused_at: null,
  created_at: '2026-05-15T10:00:00Z',
  updated_at: '2026-05-15T10:00:00Z',
}

const payload = {
  weekday: 2,
  start_time: '15:00',
  duration_minutes: 50,
  frequency: 'weekly' as const,
  starts_on: '2026-05-20',
  session_format: 'online' as const,
  meeting_url: 'https://meet.example/test',
  offline_location: null,
}

describe('client regular times api', () => {
  beforeEach(() => {
    mockedHttp.get.mockReset()
    mockedHttp.post.mockReset()
    mockedHttp.patch.mockReset()
  })

  it('fetches list from array response', async () => {
    mockedHttp.get.mockResolvedValue({ data: [record] } as any)

    const result = await fetchClientRegularTimes(5)

    expect(mockedHttp.get).toHaveBeenCalledWith('/cabinet/client-records/5/regular-times/')
    expect(result).toEqual([record])
  })

  it('fetches list from results response', async () => {
    mockedHttp.get.mockResolvedValue({ data: { results: [record] } } as any)

    const result = await fetchClientRegularTimes(5)

    expect(result).toEqual([record])
  })

  it('creates regular time', async () => {
    mockedHttp.post.mockResolvedValue({ data: record } as any)

    await createClientRegularTime(5, payload)

    expect(mockedHttp.post).toHaveBeenCalledWith('/cabinet/client-records/5/regular-times/', payload)
  })

  it('updates regular time', async () => {
    mockedHttp.patch.mockResolvedValue({ data: record } as any)

    await updateClientRegularTime(5, 1, { duration_minutes: 60 })

    expect(mockedHttp.patch).toHaveBeenCalledWith('/cabinet/client-records/5/regular-times/1/', {
      duration_minutes: 60,
    })
  })

  it('pauses and resumes regular time', async () => {
    mockedHttp.post.mockResolvedValue({ data: record } as any)

    await pauseClientRegularTime(5, 1)
    await resumeClientRegularTime(5, 1)

    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      1,
      '/cabinet/client-records/5/regular-times/1/pause/',
      {}
    )
    expect(mockedHttp.post).toHaveBeenNthCalledWith(
      2,
      '/cabinet/client-records/5/regular-times/1/resume/',
      {}
    )
  })

  it('creates next session from regular time', async () => {
    const response = {
      created: true,
      regular_time_id: 1,
      occurrence_start_at: '2026-05-20T15:00:00+03:00',
      occurrence_end_at: '2026-05-20T15:50:00+03:00',
      session: { id: 99 },
    }
    mockedHttp.post.mockResolvedValue({ data: response } as any)

    const result = await createNextSessionFromClientRegularTime(5, 1)

    expect(mockedHttp.post).toHaveBeenCalledWith(
      '/cabinet/client-records/5/regular-times/1/create-next-session/',
      {}
    )
    expect(result).toEqual(response)
  })

  it('materializes future sessions from regular time', async () => {
    const response = {
      regular_time_id: 1,
      horizon_weeks: 4,
      max_occurrences: 4,
      occurrences_considered: 4,
      created_count: 3,
      skipped_existing_count: 1,
      skipped_conflicts_count: 0,
      created_sessions: [{ id: 99 }],
      skipped_existing_sessions: [{ id: 98 }],
      skipped_conflicts: [],
    }
    mockedHttp.post.mockResolvedValue({ data: response } as any)

    const result = await materializeClientRegularTimeSessions(5, 1)

    expect(mockedHttp.post).toHaveBeenCalledWith(
      '/cabinet/client-records/5/regular-times/1/materialize-sessions/',
      {}
    )
    expect(result).toEqual(response)
  })
})
