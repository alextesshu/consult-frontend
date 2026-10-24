// UI v2 public specialist profile shell — acceptance helpers. All API data are BROWSER FIXTURES (Playwright routes):
// the KAN-158 profile fixture plus fake auth (no credentials, no backend). Not backend acceptance.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')

const out = __dirname
const repo = path.resolve(__dirname, '../../../..')
const candidate = 'http://127.0.0.1:5403'
const baseline = 'http://127.0.0.1:5404'
const WIDTHS = [375, 390, 640, 768, 1024, 1280, 1440]
const ROLES = { guest: null, specialist: ['SPECIALIST'], client: ['CLIENT'] }
const fixture = JSON.parse(fs.readFileSync(path.join(repo, 'docs/ui-v2/evidence/kan-158/v66-v67/fixture.json'), 'utf8'))
const photo = fs.readFileSync(path.join(repo, 'docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/assets/maria-koval.webp'))
const NOW = new Date(2026, 9, 22, 15, 50, 0)
// Readiness: the app is mounted and the route's own page heading rendered (every captured route, v1 and v2, has one).
const READY_SELECTOR = 'main h1'

function me(roles) {
  return { user: { id: 1, username: 'fixture-user', email: 'fixture@example.test', roles, role: roles[0] }, access_state: 'OK',
    effective_entitlements: { plan: 'PRO' }, counts: { upcoming_sessions_count: 0 }, product_updates: [], server_time: NOW.toISOString() }
}

async function open(browser, width, { role = 'guest', height } = {}) {
  const h = height || (width < 768 ? 812 : 900)
  const c = await browser.newContext({ viewport: { width, height: h }, deviceScaleFactor: 1, hasTouch: width < 768, timezoneId: 'Europe/Kyiv', locale: 'uk-UA', reducedMotion: 'reduce' })
  await c.clock.setFixedTime(NOW)
  await c.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })))
  await c.route('**/*', (r) => (['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort()))
  const roles = ROLES[role]
  await c.route('**/api/**', (r) => {
    const u = new URL(r.request().url()).pathname
    if (u.endsWith('/auth/token/refresh/')) return roles ? r.fulfill({ json: { access: 'fixture-access' } }) : r.fulfill({ status: 401, json: {} })
    if (u.endsWith('/me/')) return roles ? r.fulfill({ json: me(roles) }) : r.fulfill({ status: 401, json: {} })
    if (/\/(s|public\/specialists|public\/therapists)\/olena\/$/.test(u)) return r.fulfill({ json: fixture.profile })
    if (u.endsWith('/booking/slots/')) return r.fulfill({ json: fixture.slots })
    if (u.includes('/notifications')) return r.fulfill({ json: { results: [], unread_count: 0, next_cursor: null } })
    if (u.includes('/chat/unread')) return r.fulfill({ json: { unread_count: 0 } })
    return r.fulfill({ json: [] })
  })
  await c.route('**/assets/maria-koval.webp', (r) => r.fulfill({ contentType: 'image/webp', body: photo }))
  const p = await c.newPage()
  p.setDefaultTimeout(30000)
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  return { c, p, errors }
}

// Never a fixed delay alone: wait for the route content, fonts, network idle, finished animations and a stable height.
async function ready(p, route) {
  await p.waitForSelector(READY_SELECTOR)
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
  return p.evaluate(() => ({ fonts: document.fonts.status, running: document.getAnimations().filter((a) => a.playState === 'running').length, height: document.documentElement.scrollHeight, scrollY: window.scrollY }))
}

// Cold Vite compiles must not land in a capture: load every route once per server first.
async function warm(browser, routes) {
  for (const base of [baseline, candidate]) for (const route of routes) {
    const { c, p } = await open(browser, 1280)
    await p.goto(`${base}${route}?ui=v1`)
    await ready(p, route)
    await c.close()
  }
}

const overflow = (p) => p.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, ok: document.documentElement.scrollWidth <= window.innerWidth }))
const slug = (route) => (route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-'))
module.exports = { chromium, fs, path, out, repo, candidate, baseline, WIDTHS, ROLES, open, ready, warm, overflow, slug }
