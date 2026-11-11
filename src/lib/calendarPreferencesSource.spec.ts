import { describe, expect, it, vi } from 'vitest'
import { PRESET_LAYERS } from './calendarItems'
import { DEFAULT_CALENDAR_TIMEZONE, createLocalCalendarPreferences, modeForPreset } from './calendarPreferencesSource'

describe('temporary local calendar preferences (until UC-00 is deployed)', () => {
  it('starts in «Робочий день» and declares itself unsynced', () => {
    const prefs = createLocalCalendarPreferences()
    expect(prefs.synced).toBe(false)
    expect(prefs.timezoneSource).toBe('default')
    expect(prefs.state.value).toEqual({ view: 'week', preset: 'workday', mode: 'workday', layers: PRESET_LAYERS.workday, timezone: DEFAULT_CALENDAR_TIMEZONE })
  })

  it('maps modes to UC-00 presets and keeps the mode across layer deviations', () => {
    const prefs = createLocalCalendarPreferences()
    prefs.setMode('availability')
    expect(prefs.state.value).toMatchObject({ mode: 'availability', preset: 'availability', layers: PRESET_LAYERS.availability })
    prefs.setLayer('external_guest_sessions', true)
    expect(prefs.state.value).toMatchObject({ mode: 'availability', preset: 'custom' })
    prefs.setMode('availability')
    expect(prefs.state.value).toMatchObject({ preset: 'availability', layers: PRESET_LAYERS.availability })
    prefs.setMode('needs_action')
    expect(prefs.state.value).toMatchObject({ mode: 'needs_action', view: 'list' })
    prefs.setMode('workday')
    expect(prefs.state.value).toMatchObject({ mode: 'workday', view: 'week' })
  })

  it('keeps at least one layer visible and ignores no-op changes', () => {
    const prefs = createLocalCalendarPreferences({
      view: 'week',
      preset: 'custom',
      mode: 'workday',
      layers: { sessions: true, past: false, free_slots: false, guest_requests: false, absences: false, external_guest_sessions: false },
      timezone: 'Europe/Kyiv',
    })
    prefs.setLayer('sessions', false)
    expect(prefs.state.value.layers.sessions).toBe(true)
    prefs.setMode('workday')
    prefs.setLayer('sessions', true)
    expect(prefs.state.value.preset).toBe('workday')
  })

  it('maps UC-00 presets that are not modes to «Робочий день»', () => {
    expect(modeForPreset('all')).toBe('workday')
    expect(modeForPreset('custom')).toBe('workday')
    expect(modeForPreset('availability')).toBe('availability')
  })

  it('never touches browser storage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const prefs = createLocalCalendarPreferences()
    prefs.setMode('availability')
    prefs.setLayer('past', true)
    expect(setItem).not.toHaveBeenCalled()
    expect(getItem).not.toHaveBeenCalled()
    setItem.mockRestore()
    getItem.mockRestore()
  })
})
