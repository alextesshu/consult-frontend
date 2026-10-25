// Week-grid time scale (CALENDAR_3A_SPEC §5). The visible range adapts to the week's events but always
// shows some context, and an hour is drawn between HOUR_MIN_PX and HOUR_MAX_PX: a sparse week gets a
// compact ~320–400px grid with true-to-duration events, a dense week keeps 52px hours and scrolls.

export const HOUR_MIN_PX = 52
export const HOUR_MAX_PX = 80
/** At least this many hours are shown around the events (an empty week shows 09:00–18:00). */
export const MIN_VISIBLE_HOURS = 4
/** Grid height cap; matches the scroll box `max-height: min(70vh, 720px)`. */
export const gridHeightCap = (viewportHeight: number) => Math.min(viewportHeight * 0.7, 720)

/**
 * Whole hours covering [fromMinute, toMinute] of the day, widened to MIN_VISIBLE_HOURS: the missing
 * hours are split before (rounded down) and after the events, shifted back inside 00:00–24:00.
 */
export function visibleHours(fromMinute: number, toMinute: number, minHours = MIN_VISIBLE_HOURS) {
  let start = Math.max(0, Math.floor(fromMinute / 60))
  let end = Math.min(24, Math.max(start + 1, Math.ceil(toMinute / 60)))
  const missing = minHours - (end - start)
  if (missing > 0) {
    start -= Math.floor(missing / 2)
    end += Math.ceil(missing / 2)
    if (start < 0) { end -= start; start = 0 }
    if (end > 24) { start -= end - 24; end = 24 }
    start = Math.max(0, start)
  }
  return { start, end }
}

/** Pixels per hour: fill the height cap when that stays within 52–80px; never below 52 (then scroll). */
export function hourPixels(hours: number, heightCap: number) {
  return Math.min(HOUR_MAX_PX, Math.max(HOUR_MIN_PX, heightCap / Math.max(1, hours)))
}
