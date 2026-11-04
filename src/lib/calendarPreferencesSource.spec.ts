import { describe, expect, it, vi } from 'vitest'
import { PRESET_LAYERS } from './calendarItems'
import { DEFAULT_CALENDAR_TIMEZONE, createLocalCalendarPreferences } from './calendarPreferencesSource'

describe('local calendar preferences (until UC-00 is deployed)', () => {
  it('starts from the documented defaults and declares itself unsynced', () => {
    const prefs = createLocalCalendarPreferences()
    expect(prefs.synced).toBe(false)
    expect(prefs.timezoneSource).toBe('default')
    expect(prefs.state.value).toEqual({ view: 'week', preset: 'all', layers: PRESET_LAYERS.all, timezone: DEFAULT_CALENDAR_TIMEZONE })
  })

  it('applies UC-00 preset rules', () => {
    const prefs = createLocalCalendarPreferences()
    prefs.setPreset('needs_action')
    expect(prefs.state.value).toMatchObject({ preset: 'needs_action', view: 'list', layers: PRESET_LAYERS.needs_action })
    prefs.setView('week')
    expect(prefs.state.value).toMatchObject({ preset: 'custom', view: 'week' })
    prefs.setPreset('workday')
    prefs.setView('day')
    expect(prefs.state.value).toMatchObject({ preset: 'workday', view: 'day' })
    prefs.setLayer('free_slots', true)
    expect(prefs.state.value).toMatchObject({ preset: 'custom', layers: { ...PRESET_LAYERS.workday, free_slots: true } })
  })

  it('keeps at least one layer visible and ignores no-op changes', () => {
    const prefs = createLocalCalendarPreferences({
      view: 'week',
      preset: 'custom',
      layers: { sessions: true, past: false, free_slots: false, guest_requests: false, absences: false, external_guest_sessions: false },
      timezone: 'Europe/Kyiv',
    })
    prefs.setLayer('sessions', false)
    expect(prefs.state.value.layers.sessions).toBe(true)
    prefs.setPreset('all')
    prefs.setLayer('sessions', true)
    expect(prefs.state.value.preset).toBe('all')
  })

  it('never touches browser storage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const prefs = createLocalCalendarPreferences()
    prefs.setPreset('availability')
    prefs.setLayer('past', true)
    expect(setItem).not.toHaveBeenCalled()
    expect(getItem).not.toHaveBeenCalled()
    setItem.mockRestore()
    getItem.mockRestore()
  })
})
