import { describe, expect, it } from 'vitest'
import { PRESET_LAYERS } from './calendarItems'
import { layerDeviations, modeLayers, parseCalendarMode } from './calendarModes'

describe('calendar 3a modes', () => {
  it('uses the UC-00 preset collections', () => {
    expect(modeLayers('workday')).toEqual(PRESET_LAYERS.workday)
    expect(modeLayers('workday').free_slots).toBe(false)
    expect(modeLayers('availability')).toMatchObject({ free_slots: true, past: false })
    expect(modeLayers('needs_action')).toEqual(PRESET_LAYERS.needs_action)
  })

  it('lists deviations from the mode as added or removed layers', () => {
    expect(layerDeviations('workday', PRESET_LAYERS.workday)).toEqual([])
    expect(layerDeviations('workday', { ...PRESET_LAYERS.workday, external_guest_sessions: true, past: false })).toEqual([
      { layer: 'past', visible: false },
      { layer: 'external_guest_sessions', visible: true },
    ])
    // «Усе» = «Робочий день» + free slots.
    expect(layerDeviations('workday', PRESET_LAYERS.all)).toEqual([{ layer: 'free_slots', visible: true }])
  })

  it('parses the ?mode= deep link, including the dashboard alias «actions»', () => {
    expect(parseCalendarMode('actions')).toBe('needs_action')
    expect(parseCalendarMode('availability')).toBe('availability')
    expect(parseCalendarMode('board')).toBeNull()
    expect(parseCalendarMode(undefined)).toBeNull()
  })
})
