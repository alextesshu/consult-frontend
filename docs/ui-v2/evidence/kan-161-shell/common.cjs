// KAN-161 cabinet shell browser acceptance helpers. All API data here are BROWSER FIXTURES (Playwright routes),
// shaped like the existing cabinet DTOs; they are not backend acceptance.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')

const out = __dirname
const repo = path.resolve(__dirname, '../../../..')
const source = '/docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/'
const candidate = 'http://127.0.0.1:5391'
const baseline = 'http://127.0.0.1:5392'
const WIDTHS = [375, 390, 640, 768, 1280, 1440]
// Same moment as the source scenario: Thursday 22 October, 15:50 local time.
const NOW = new Date(2026, 9, 22, 15, 50, 0)
const at = (day, hour, minute = 0) => new Date(2026, 9, day, hour, minute).toISOString()

function me(roles = ['SPECIALIST']) {
  return {
    user: { id: 1, username: 'fixture-specialist', email: 'fixture@example.test', roles, role: roles[0] },
    access_state: 'OK',
    effective_entitlements: { plan: 'PRO', active_client_limit: 20 },
    counts: { active_clients: 14, prospect_clients: 0, upcoming_sessions_count: 3 },
    product_updates: [],
    server_time: NOW.toISOString(),
  }
}
const sessions = [
  { id: 11, status: 'CONFIRMED', client: 3, client_display_name: 'Андрій Савчук', session_format: 'online', meeting_url: 'https://meet.example.test/a', join_available: false, slot_start_at: at(22, 16, 30), slot_end_at: at(22, 17, 20) },
  { id: 15, status: 'CONFIRMED', client: 6, client_display_name: 'Олена Гнатюк', session_format: 'online', meeting_url: '', join_available: false, slot_start_at: at(22, 18), slot_end_at: at(22, 18, 50) },
  { id: 12, status: 'CONFIRMED', client: 4, client_display_name: 'Максим Бойко', session_format: 'online', slot_start_at: at(23, 9, 30), slot_end_at: at(23, 10, 20) },
  { id: 16, status: 'CONFIRMED', client: 7, client_display_name: 'Ірина Ткаченко', session_format: 'online', slot_start_at: at(23, 15), slot_end_at: at(23, 15, 50) },
  { id: 13, status: 'SCHEDULED', client: 5, client_display_name: 'Олег Мельник', session_format: 'offline', offline_location: 'Київ', slot_start_at: at(26, 10), slot_end_at: at(26, 10, 50) },
]
const workQueue = {
  today_sessions_count: 4, notes_reminders_count: 1, pending_guest_requests_count: 2, pending_slotless_guest_requests_count: 1,
  today_sessions: [
    { id: 10, client_display_name: 'Ірина Ткаченко', status: 'COMPLETED', has_note: false, session_format: 'online', starts_at: at(22, 10) },
    { id: 14, client_display_name: 'Олег Мельник', status: 'COMPLETED', has_note: true, session_format: 'online', starts_at: at(22, 13) },
    { id: 11, client_display_name: 'Андрій Савчук', status: 'CONFIRMED', has_note: false, session_format: 'online', starts_at: at(22, 16, 30) },
    { id: 15, client_display_name: 'Олена Гнатюк', status: 'CONFIRMED', has_note: false, session_format: 'online', starts_at: at(22, 18) },
  ],
  notes_reminders_preview: [{ id: 601, session_id: 10, client_display_name: 'Ірина Ткаченко', slot_start_at: at(22, 10) }],
  guest_requests_preview: [
    { id: 701, client_display_name: 'Катерина Лук’янчук', request_topics: ['anxiety'], session_format: 'online', requested_slot_start: at(23, 11) },
    { id: 702, client_display_name: 'Дмитро Вовк', request_topics: ['relationships'], session_format: 'online', requested_slot_start: null },
  ],
}
function analytics(range) {
  const r = { '7d': [11, 3, '12600.00'], '30d': [42, 9, '48600.00'], '90d': [118, 23, '139200.00'] }[range] || [42, 9, '48600.00']
  return {
    sessions: { completed: r[0], cancelled: 1, no_show: 0 }, acquisition: { guest_booking_requests: r[1] },
    payments: {
      paid_total_by_currency: [{ currency: 'UAH', amount: r[2] }], unconfirmed_total_by_currency: [{ currency: 'UAH', amount: '1200.00' }], unconfirmed_count: 1,
      unconfirmed_sessions: [{ session_id: 14, client_record_id: 2, client_user_id: null, client_name: 'Олег Мельник', starts_at: at(22, 13), price_amount: '1200.00', price_currency: 'UAH', payment_state: 'NOT_CONFIRMED', last_payment_action_at: null }],
      review_count: 0, no_price_count: 0, coverage: { ordinary_sessions_included: true, external_guest_sessions_included: false, external_guest_sessions_count: 0 },
    },
    prices: { scheduled_total_by_currency: [], upcoming_scheduled_total_by_currency: [], average_completed_by_currency: [] },
  }
}
const onboarding = {
  readiness: { public_display_name_exists: true, description_exists: false, topics_exist: true, work_format_exists: true, base_price_exists: false, client_entry_path_ready: true },
  missing_items: ['MISSING_DESCRIPTION', 'MISSING_BASE_PRICE'], warnings: [], next_actions: [], primary_cta_code: 'COMPLETE_PROFILE', cta_target: '/cabinet/profile',
}

async function context(browser, width, { motion = 'no-preference', video = false, height, roles = ['SPECIALIST'], authed = true, fixedTime = false, scenario = {} } = {}) {
  const h = height || (width < 768 ? 812 : 900)
  const c = await browser.newContext({ viewport: { width, height: h }, reducedMotion: motion, deviceScaleFactor: 1, hasTouch: width < 768, timezoneId: 'Europe/Kyiv', locale: 'uk-UA',
    ...(video ? { recordVideo: { dir: path.join(out, 'recordings', '_tmp'), size: { width, height: h } } } : {}) })
  if (fixedTime) await c.clock.setFixedTime(NOW)
  else await c.clock.install({ time: NOW })
  await c.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })))
  await c.route('**/*', (r) => {
    const host = new URL(r.request().url()).hostname
    return ['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com'].includes(host) ? r.continue() : r.abort()
  })
  await c.route('**/api/**', async (r) => {
    const url = new URL(r.request().url())
    const p = url.pathname
    if (p.endsWith('/auth/token/refresh/')) return authed ? r.fulfill({ json: { access: 'fixture-access' } }) : r.fulfill({ status: 401, json: { detail: 'no session' } })
    if (p.endsWith('/me/')) return r.fulfill({ json: me(roles) })
    if (p.endsWith('/booking/sessions/')) return r.fulfill({ json: url.searchParams.get('upcoming') === 'true' ? (scenario.sessions ?? sessions) : [] })
    if (p.endsWith('/cabinet/work-queue/')) return r.fulfill({ json: scenario.workQueue ?? workQueue })
    if (p.endsWith('/cabinet/practice-analytics/')) return r.fulfill({ json: analytics(url.searchParams.get('range')) })
    if (p.endsWith('/cabinet/entitlements/')) return r.fulfill({ json: { plan: 'PRO', limits: { active_clients: { used: 14, limit: 20 } } } })
    if (p.endsWith('/cabinet/onboarding-state/')) return r.fulfill({ json: scenario.onboarding ?? onboarding })
    if (p.includes('/notifications')) return r.fulfill({ json: { results: [], unread_count: 0, next_cursor: null } })
    if (p.includes('/chat/unread')) return r.fulfill({ json: { unread_count: 1 } })
    return r.fulfill({ json: [] })
  })
  const page = await c.newPage()
  page.setDefaultTimeout(20000)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  return { c, p: page, errors }
}
async function settle(p, ms = 900) { await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(ms) }
async function noOverflow(p) {
  return p.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, ok: document.documentElement.scrollWidth <= window.innerWidth }))
}
module.exports = { chromium, fs, path, out, repo, source, candidate, baseline, WIDTHS, NOW, context, settle, noOverflow }
