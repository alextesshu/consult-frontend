// KAN-158 phase 1: request_only helper copy. Real disposable Django (origin/dev backend, seeded
// with seed_therapists + four CTA scenarios); candidate = this branch, baseline = origin/dev 3085c1c.
// Records copy, CTAs, slot fetches, non-GET requests, errors and overflow; captures candidate and
// baseline screenshots for pixel comparison (compare.py). Paced for the 30/min anonymous throttle.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')
const out = __dirname
const shots = path.join(out, 'screenshots')
fs.mkdirSync(shots, { recursive: true })

const BUILDS = { candidate: 'http://127.0.0.1:5411', baseline: 'http://127.0.0.1:5406' }
const SCENARIOS = { direct: 'seed-therapist-1', request: 'seed-therapist-2', requestAvail: 'seed-therapist-3', directEmpty: 'seed-therapist-4' }
const NO_WINDOWS = 'Наразі немає доступних вікон'
const REQUEST_HELPER = 'Опишіть коротко, з чим хочете звернутися'
const pace = () => new Promise((resolve) => setTimeout(resolve, 15000))

async function load(browser, build, version, width, slug) {
  const c = await browser.newContext({ viewport: { width, height: width < 768 ? 812 : 900 }, locale: 'uk-UA', timezoneId: 'Europe/Kyiv', reducedMotion: 'reduce' })
  await c.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })))
  await c.route('**/*', (r) => (['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort()))
  const p = await c.newPage()
  const requests = []
  const statuses = []
  const errors = []
  p.on('request', (r) => { const u = new URL(r.url()); if (u.port === '8404') requests.push(`${r.method()} ${u.pathname}`) })
  p.on('response', (r) => { const u = new URL(r.url()); if (u.port === '8404') statuses.push(r.status()) })
  p.on('pageerror', (e) => errors.push(e.message))
  await p.goto(`${BUILDS[build]}/s/${slug}?ui=${version}`)
  await p.locator('h1').first().waitFor({ timeout: 30000 })
  await p.waitForLoadState('networkidle')
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(600)
  return { c, p, requests, statuses, errors }
}

;(async () => {
  const browser = await chromium.launch()
  const rows = []
  const problems = []
  const fail = (message) => problems.push(message)

  // Candidate: every scenario × version × width.
  for (const [scenario, slug] of Object.entries(SCENARIOS)) for (const version of ['v1', 'v2']) for (const width of [375, 390, 768, 1280]) {
    const { c, p, requests, statuses, errors } = await load(browser, 'candidate', version, width, slug)
    const info = await p.evaluate(({ NO_WINDOWS, REQUEST_HELPER }) => {
      const html = document.body.innerText + ' ' + [...document.querySelectorAll('dialog, [hidden]')].map((el) => el.textContent).join(' ')
      const count = (needle) => html.split(needle).length - 1
      const visibleButtons = [...document.querySelectorAll('button, a')].filter((el) => el.getClientRects().length).map((el) => el.textContent.replace(/\s+/g, ' ').trim())
      return {
        noWindows: count(NO_WINDOWS),
        requestHelper: count(REQUEST_HELPER),
        chooseTime: visibleButtons.filter((t) => t === 'Обрати час').length,
        leaveRequest: visibleButtons.filter((t) => t === 'Залишити запит' || t === 'Залишити запит без вибору часу').length,
        slotChips: document.querySelectorAll('.slot-time').length,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }
    }, { NO_WINDOWS, REQUEST_HELPER })
    const slotFetches = requests.filter((r) => r.includes('/booking/slots/')).length
    const writes = requests.filter((r) => !r.startsWith('GET ') && !r.includes('/auth/token/refresh/'))
    if ((width === 1280) || (version === 'v1' && width === 375)) await p.screenshot({ path: path.join(shots, `candidate-${scenario}-${version}-${width}.png`), fullPage: width !== 1280 })
    rows.push({ build: 'candidate', scenario, version, width, ...info, slotFetches, writes, throttled: statuses.filter((s) => s === 429).length, errors })
    const id = `${scenario} ${version} ${width}`
    if (info.overflow) fail(`${id}: horizontal overflow`)
    if (errors.length) fail(`${id}: page errors ${errors}`)
    if (writes.length) fail(`${id}: writes ${writes}`)
    if (statuses.includes(429)) fail(`${id}: throttled`)
    // v2 offers «Обрати час»; v1 keeps its own slot chips (no such button) — both must show slots.
    if (scenario === 'direct' && (info.noWindows || !slotFetches || !info.slotChips || (version === 'v2' && !info.chooseTime))) fail(`${id}: direct booking ${JSON.stringify(info)}`)
    if ((scenario === 'request' || scenario === 'requestAvail') && (info.noWindows || !info.requestHelper || slotFetches || info.slotChips || info.chooseTime || !info.leaveRequest)) fail(`${id}: request_only ${JSON.stringify({ ...info, slotFetches })}`)
    if (scenario === 'directEmpty' && (!info.noWindows || !info.leaveRequest || info.chooseTime)) fail(`${id}: direct without slots ${JSON.stringify(info)}`)
    await c.close()
    await pace()
  }

  // Baseline (origin/dev) for the before/after record and pixel parity.
  for (const [scenario, slug] of Object.entries(SCENARIOS)) for (const [version, width] of [['v1', 1280], ['v2', 1280], ['v1', 375]]) {
    const { c, p } = await load(browser, 'baseline', version, width, slug)
    const noWindows = await p.evaluate((needle) => (document.body.innerText + ' ' + [...document.querySelectorAll('dialog, [hidden]')].map((el) => el.textContent).join(' ')).split(needle).length - 1, NO_WINDOWS)
    await p.screenshot({ path: path.join(shots, `baseline-${scenario}-${version}-${width}.png`), fullPage: width !== 1280 })
    rows.push({ build: 'baseline', scenario, version, width, noWindows })
    await c.close()
    await pace()
  }

  // Noise control: a second baseline capture of the v2 desktop pages (compare.py: baseline vs control).
  for (const [scenario, slug] of Object.entries(SCENARIOS)) {
    const { c, p } = await load(browser, 'baseline', 'v2', 1280, slug)
    await p.screenshot({ path: path.join(shots, `control-${scenario}-v2-1280.png`) })
    await c.close()
    await pace()
  }

  fs.writeFileSync(path.join(out, 'browser.json'), JSON.stringify({ backend: 'origin/dev 9f11568 (disposable DB)', problems, rows }, null, 2) + '\n')
  console.log('rows', rows.length, 'problems', problems.length)
  for (const problem of problems) console.log(' -', problem)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
