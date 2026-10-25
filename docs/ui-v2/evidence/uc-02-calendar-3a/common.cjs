// UC-02 calendar 3a acceptance helpers. All API data are BROWSER FIXTURES (Playwright routes) shaped like the
// existing endpoints; fake auth only. Not backend acceptance.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')

const out = __dirname
const candidate = 'http://127.0.0.1:5408'
const baseline = 'http://127.0.0.1:5406'
// Thursday 22 October 2026, 16:50 Kyiv (EEST). The week ends with the DST change on Sunday 25 October.
const NOW = new Date('2026-10-22T13:50:00Z')

const me = {
  user: { id: 1, username: 'fixture-specialist', email: 'fixture@example.test', roles: ['SPECIALIST'], role: 'SPECIALIST' },
  access_state: 'OK',
  effective_entitlements: { plan: 'PRO', active_client_limit: 20 },
  counts: { active_clients: 6, prospect_clients: 0, upcoming_sessions_count: 5 },
  product_updates: [],
  server_time: NOW.toISOString(),
}
const s = (id, status, start, minutes, name, extra = {}) => ({
  id, status, slot_start_at: start, slot_end_at: new Date(Date.parse(start) + minutes * 60000).toISOString(),
  client_display_name: name, client_has_account: true, has_note: null, session_format: 'online', meeting_link_ready: true, ...extra,
})
const sessions = [
  s(5, 'CANCELLED', '2026-10-19T15:00:00Z', 50, 'Олена Гнатюк'),
  s(3, 'NO_SHOW', '2026-10-20T08:00:00Z', 50, 'Олег Мельник'),
  s(4, 'COMPLETED', '2026-10-21T10:00:00Z', 50, 'Максим Бойко', { has_note: false }),
  s(8, 'COMPLETED', '2026-10-22T07:00:00Z', 50, 'Ірина Ткаченко', { has_note: true }),
  s(6, 'CONFIRMED', '2026-10-22T15:00:00Z', 50, 'Андрій Савчук', { meeting_link_ready: false }),
  s(1, 'CONFIRMED', '2026-10-23T10:00:00Z', 50, 'Ірина Ткаченко'),
  s(2, 'SCHEDULED', '2026-10-24T08:00:00Z', 50, 'Ганна С.', { client_has_account: false }),
  s(7, 'CONFIRMED', '2026-10-25T08:00:00Z', 50, 'Софія Кравець'),
]
const upcoming = [
  ...sessions.filter((row) => ['SCHEDULED', 'CONFIRMED'].includes(row.status) && Date.parse(row.slot_start_at) >= NOW.getTime()),
  s(9, 'SCHEDULED', '2026-11-03T08:00:00Z', 50, 'Тарас П.'),
]
const booked = (session, slotId) => ({
  type: 'booked_slot', id: `booked-slot-${slotId}`, slot_id: slotId, session_id: session.id, start_at: session.slot_start_at,
  end_at: session.slot_end_at, status: session.status, title: 'Сесія', client_display_name: session.client_display_name,
  client_kind: session.client_has_account ? 'registered' : 'guest',
})
// Friday 23 Oct (EEST): slots 09:00–12:40 every hour (50 min + 10 min buffer), the 13:00 session breaks the
// window, then 14:00–15:50, a gap, and 17:00–18:50.
const free = (slotId, start) => ({
  type: 'available_slot', id: `slot-${slotId}`, slot_id: slotId, session_id: null, start_at: start,
  end_at: new Date(Date.parse(start) + 50 * 60000).toISOString(), status: 'available', title: 'Вільний час', client_display_name: null, client_kind: null,
})
const fridaySlots = ['06:00', '07:00', '08:00', '09:00', '11:00', '12:00', '14:00', '15:00'].map((t, i) => free(200 + i, `2026-10-23T${t}:00Z`))
const schedule = [
  ...sessions.filter((row) => !['CANCELLED', 'NO_SHOW'].includes(row.status)).map((row, index) => booked(row, 100 + index)),
  ...fridaySlots,
  free(220, '2026-10-24T12:00:00Z'),
  { type: 'booked_slot', id: 'pending-requests-slot-230', slot_id: 230, session_id: null, start_at: '2026-10-24T13:00:00Z', end_at: '2026-10-24T13:50:00Z',
    status: 'pending', title: 'Запити на сесію', client_display_name: null, client_kind: null, requests_count: 1, request_ids: [301] },
]
const guestRequests = [
  { id: 301, status: 'PENDING', requested_slot_start: '2026-10-24T13:00:00Z', guest_name: 'Катерина', client_name: null },
  { id: 302, status: 'PENDING', requested_slot_start: null, guest_name: 'Дмитро', client_name: null },
  { id: 303, status: 'DECLINED', requested_slot_start: '2026-10-21T13:00:00Z', guest_name: 'Відхилений', client_name: null },
]
const absences = [
  { id: 41, specialist_id: 1, starts_at: '2026-10-21T21:00:00Z', ends_at: '2026-10-21T23:00:00Z', is_all_day: false, note: 'Конференція', is_active: true, created_at: '', updated_at: '' },
]
const externalSessions = [
  { id: 51, starts_at: '2026-10-23T10:30:00Z', ends_at: null, duration_minutes: 50, session_format: 'online', meeting_url: 'https://meet.example.test/x', offline_location_snapshot: null,
    guest_name: 'Віктор Г.', guest_email: null, status: 'SCHEDULED', cancelled_at: null, created_at: null, updated_at: null },
]
const rescheduleRequests = [{ id: 61, session_id: 7, requested_slot_id: 220, requested_slot_start_at: '2026-10-24T12:00:00Z', status: 'PENDING' }]

async function open(browser, width, { height, video, touch } = {}) {
  const h = height || (width < 768 ? 812 : 900)
  const c = await browser.newContext({
    viewport: { width, height: h }, deviceScaleFactor: 1, hasTouch: touch ?? width < 768, timezoneId: 'Europe/Kyiv', locale: 'uk-UA', reducedMotion: 'reduce',
    ...(video ? { recordVideo: { dir: video, size: { width, height: h } } } : {}),
  })
  await c.clock.setFixedTime(NOW)
  await c.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })))
  await c.route('**/*', (r) => (['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort()))
  const writes = []
  await c.route('**/api/**', (r) => {
    const req = r.request()
    const url = new URL(req.url())
    const u = url.pathname
    if (req.method() !== 'GET' && !u.endsWith('/auth/token/refresh/')) writes.push(`${req.method()} ${u}`)
    if (u.endsWith('/auth/token/refresh/')) return r.fulfill({ json: { access: 'fixture-access' } })
    if (u.endsWith('/me/')) return r.fulfill({ json: me })
    if (u.endsWith('/cabinet/schedule/')) return r.fulfill({ json: { events: schedule } })
    if (u.endsWith('/booking/sessions/')) return r.fulfill({ json: url.searchParams.get('upcoming') === 'true' ? upcoming : sessions })
    if (u.endsWith('/cabinet/sessions/reschedule-requests/')) return r.fulfill({ json: rescheduleRequests })
    if (u.endsWith('/cabinet/guest-booking-requests/')) return r.fulfill({ json: guestRequests })
    if (u.endsWith('/cabinet/availability-exceptions/')) return r.fulfill({ json: absences })
    if (u.endsWith('/cabinet/external-sessions/')) return r.fulfill({ json: externalSessions })
    if (u.includes('/notifications')) return r.fulfill({ json: { results: [], unread_count: 0, next_cursor: null } })
    if (u.includes('/chat/unread')) return r.fulfill({ json: { unread_count: 0 } })
    return r.fulfill({ json: [] })
  })
  const p = await c.newPage()
  p.setDefaultTimeout(30000)
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  return { c, p, errors, writes }
}

// Real readiness: route heading, fonts, network idle, finished animations, stable height. Never a fixed delay alone.
async function ready(p, selector = 'main h1') {
  await p.waitForSelector(selector, { state: 'attached' })
  await p.waitForLoadState('networkidle')
  await p.evaluate(() => document.fonts.ready)
  await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' })
  await p.evaluate(() => { document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')); window.scrollTo(0, 0) })
  let last = -1
  for (let i = 0; i < 30; i++) {
    const h = await p.evaluate(() => document.documentElement.scrollHeight)
    if (h === last) break
    last = h
    await p.waitForTimeout(200)
  }
}
async function warm(browser, routes) {
  for (const base of [baseline, candidate]) for (const route of routes) {
    const { c, p } = await open(browser, 1280)
    await p.goto(`${base}${route}`)
    await ready(p)
    await c.close()
  }
}
const overflow = (p) => p.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, ok: document.documentElement.scrollWidth <= window.innerWidth }))
module.exports = { chromium, fs, path, out, candidate, baseline, NOW, open, ready, warm, overflow }
