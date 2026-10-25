import { CALENDAR_LAYERS, PRESET_LAYERS, type CalendarLayer, type CalendarLayers } from './calendarItems'

// Calendar 3a modes (v6.8 CALENDAR_3A_SPEC §3). Each mode IS a UC-00 preset: selecting a mode
// applies that preset's documented layer collection; the «Усе» preset is no longer offered in
// the UI but stays reachable by adding layers in «Вигляд».
export const CALENDAR_MODES = ['workday', 'availability', 'needs_action'] as const
export type CalendarMode = (typeof CALENDAR_MODES)[number]

export const CALENDAR_MODE_LABELS: Record<CalendarMode, string> = {
  workday: 'Робочий день',
  availability: 'Доступність',
  needs_action: 'Потребує дії',
}
export const CALENDAR_MODE_SHORT_LABELS: Record<CalendarMode, string> = {
  workday: 'Робочий день',
  availability: 'Доступність',
  needs_action: 'Дії',
}

export const CALENDAR_MODE_DESCRIPTIONS: Record<CalendarMode, string> = {
  workday: 'Сесії й запити на повну силу; вільний час — кількістю вікон у заголовку дня.',
  availability: 'Вільні вікна — головні блоки з кількістю слотів; сесії приглушені до «Зайнято». Правила запису не змінюються.',
  needs_action: 'Список: спершу вибраний тиждень, потім усе поза ним. Сума = лічильник вкладки.',
}

export function modeLayers(mode: CalendarMode): CalendarLayers {
  return { ...PRESET_LAYERS[mode] }
}

export type LayerDeviation = { layer: CalendarLayer; visible: boolean }

/** Layers that differ from the mode's own collection (shown as removable chips). */
export function layerDeviations(mode: CalendarMode, layers: CalendarLayers): LayerDeviation[] {
  const base = PRESET_LAYERS[mode]
  return CALENDAR_LAYERS.filter((layer) => base[layer] !== layers[layer]).map((layer) => ({ layer, visible: layers[layer] }))
}

/** Lowercase layer names for deviation chips («+ зовнішні гостьові ×»). */
export const CALENDAR_LAYER_CHIP_LABELS: Record<CalendarLayer, string> = {
  sessions: 'заплановані сесії',
  past: 'минулі сесії',
  free_slots: 'вільні слоти',
  guest_requests: 'запити',
  absences: 'відсутності',
  external_guest_sessions: 'зовнішні гостьові',
}

export function parseCalendarMode(value: unknown): CalendarMode | null {
  if (value === 'actions') return 'needs_action'
  return CALENDAR_MODES.includes(value as CalendarMode) ? (value as CalendarMode) : null
}
