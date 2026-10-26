// KAN-158 phase 2 · PR A (v6.9.1 visual layer). Real disposable Django (origin/dev backend, seed_therapists +
// CTA scenarios). Candidate = this branch, baseline = origin/dev 5f0ce90. One fixed Playwright clock for every
// context. Paced for the 30/min anonymous throttle. Writes browser.json, parity.json and screenshots/.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')
const { PNG } = (() => { try { return require('pngjs') } catch { return {} } })()
const out = __dirname
const shots = path.join(out, 'screenshots')
fs.mkdirSync(shots, { recursive: true })

const BUILDS = { candidate: 'http://127.0.0.1:5411', baseline: 'http://127.0.0.1:5406' }
const SCENARIOS = { direct: 'seed-therapist-1', request: 'seed-therapist-2', directEmpty: 'seed-therapist-4' }
const NOW = new Date()
const pace = () => new Promise((resolve) => setTimeout(resolve, 15000))

async function load(browser, build, version, width, slug, { timezoneId = 'Europe/Kyiv', height } = {}) {
  const c = await browser.newContext({ viewport: { width, height: height || (width < 860 ? 812 : 900) }, locale: 'uk-UA', timezoneId, reducedMotion: 'reduce' })
  await c.clock.setFixedTime(NOW)
  await c.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })))
  // External hosts (seed photos on images.unsplash.com) are blocked, so every seeded photo is "broken".
  await c.route('**/*', (r) => (['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort()))
  const p = await c.newPage()
  const requests = []
  const errors = []
  p.on('request', (r) => { const u = new URL(r.url()); if (u.port === '8404') requests.push(`${r.method()} ${u.pathname}`) })
  p.on('pageerror', (e) => errors.push(e.message))
  await p.goto(`${BUILDS[build]}/s/${slug}?ui=${version}`)
  await p.locator('h1').first().waitFor({ timeout: 30000 })
  await p.waitForLoadState('networkidle')
  await p.evaluate(() => document.fonts.ready)
  await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' })
  await p.mouse.move(2, 2)
  await p.waitForTimeout(500)
  return { c, p, requests, errors }
}

const inspect = (p) => p.evaluate(() => {
  const text = (el) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null
  const panel = document.querySelector('.pc2-request-panel')
  const card = document.querySelector('.pc2-profile-contacts')
  const lead = document.querySelector('.hero-main__lead')
  const bar = document.querySelector('.pc2-profile-bottom-bar')
  return {
    railContacts: Boolean(document.querySelector('.identity-rail__contacts')),
    contactsCard: card ? (card.closest('.pc2-request-panel') ? 'panel' : 'page') : null,
    contactsTitle: text(card?.querySelector('h2')),
    timezone: text(document.querySelector('.pc2-profile-timezone')),
    finalTitle: text(document.querySelector('.closing-cta__title')),
    finalSummary: text(document.querySelector('.pc2-final-cta__summary')),
    noWindows: document.body.innerText.includes('Наразі немає доступних вікон') || Boolean(panel?.textContent?.includes('Наразі немає доступних вікон')),
    photoFallback: text(document.querySelector('.pc2-profile-photo-fallback')),
    leadClamped: lead ? lead.scrollHeight > lead.clientHeight + 1 : null,
    barContext: text(bar?.querySelector('span')),
    barHeadline: text(bar?.querySelector('strong')),
    barCta: text(bar?.querySelector('button')),
    bodyPaddingBottom: document.body.style.paddingBottom,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }
})

;(async () => {
  const browser = await chromium.launch()
  const rows = []
  const problems = []
  const fail = (message) => problems.push(message)
  const expected = {
    direct: { final: 'Оберіть час для консультації', headline: /^від /, timezone: 'Час за Києвом' },
    request: { final: 'Залиште запит', headline: /^Час — після запиту$/, timezone: null },
    directEmpty: { final: 'Залиште запит', headline: /^Вільного часу зараз немає$/, timezone: 'Час за Києвом' },
  }

  // Candidate UI v2: every scenario × width.
  for (const [scenario, slug] of Object.entries(SCENARIOS)) for (const width of [375, 390, 768, 820, 1280]) {
    const { c, p, requests, errors } = await load(browser, 'candidate', 'v2', width, slug)
    const info = await inspect(p)
    const compact = width < 860
    await p.screenshot({ path: path.join(shots, `v2-${scenario}-${width}.png`), fullPage: true })
    const writes = requests.filter((r) => !r.startsWith('GET ') && !r.includes('/auth/token/refresh/'))
    rows.push({ scenario, width, ...info, slotFetches: requests.filter((r) => r.includes('/booking/slots/')).length, writes, errors })
    const id = `v2 ${scenario} ${width}`
    const e = expected[scenario]
    if (info.overflow) fail(`${id}: horizontal overflow`)
    if (errors.length) fail(`${id}: page errors ${errors}`)
    if (writes.length) fail(`${id}: writes ${writes}`)
    if (info.railContacts) fail(`${id}: contacts still inside the rail`)
    // Every scenario profile has public contacts and enough sections for the final CTA (see README).
    if (info.contactsCard !== (compact ? 'page' : 'panel') || info.contactsTitle !== 'Написати напряму') fail(`${id}: contacts card ${info.contactsCard} ${info.contactsTitle}`)
    if (info.finalTitle !== e.final) fail(`${id}: final CTA «${info.finalTitle}»`)
    if (info.timezone !== e.timezone) fail(`${id}: timezone «${info.timezone}»`)
    if (scenario === 'request' && (info.noWindows || rows.at(-1).slotFetches)) fail(`${id}: request_only shows slots or «no windows»`)
    if (scenario === 'directEmpty' && !info.noWindows) fail(`${id}: no-slots fallback lost`)
    if (!info.photoFallback) fail(`${id}: no photo fallback for a broken photo`)
    if (info.leadClamped) fail(`${id}: short description clamped`)
    if (compact && (!e.headline.test(info.barHeadline || '') || !info.bodyPaddingBottom)) fail(`${id}: sticky bar ${JSON.stringify([info.barContext, info.barHeadline, info.bodyPaddingBottom])}`)
    if (!compact && info.barHeadline !== null) fail(`${id}: sticky bar on desktop`)
    await c.close()
    await pace()
  }

  // Non-Kyiv browser timezone.
  {
    const { c, p } = await load(browser, 'candidate', 'v2', 1280, SCENARIOS.direct, { timezoneId: 'Europe/Berlin' })
    const info = await inspect(p)
    rows.push({ check: 'timezone', timezoneId: 'Europe/Berlin', timezone: info.timezone })
    if (info.timezone !== 'Ваш місцевий час · Europe/Berlin') fail(`Berlin timezone label «${info.timezone}»`)
    await c.close()
    await pace()
  }

  // Full phone page: at the bottom the footer ends above the fixed bar.
  for (const width of [375, 390]) {
    const { c, p } = await load(browser, 'candidate', 'v2', width, SCENARIOS.direct)
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await p.waitForTimeout(300)
    const geometry = await p.evaluate(() => {
      const bar = document.querySelector('.pc2-profile-bottom-bar').getBoundingClientRect()
      const footer = document.querySelector('footer')
      const last = footer ? [...footer.querySelectorAll('*')].filter((el) => el.getClientRects().length && el.textContent.trim()).pop() : null
      return { barTop: Math.round(bar.top), footerBottom: footer ? Math.round(footer.getBoundingClientRect().bottom) : null, lastFooterTextBottom: last ? Math.round(last.getBoundingClientRect().bottom) : null, scrollY: Math.round(scrollY) }
    })
    await p.screenshot({ path: path.join(shots, `v2-direct-${width}-page-bottom.png`) })
    rows.push({ check: 'footer-clearance', width, ...geometry })
    if (geometry.lastFooterTextBottom === null || geometry.lastFooterTextBottom > geometry.barTop) fail(`${width}: footer text under the sticky bar ${JSON.stringify(geometry)}`)
    await c.close()
    await pace()
  }

  // UI v1 parity against origin/dev (same fixed clock).
  for (const [scenario, slug] of Object.entries(SCENARIOS)) for (const width of [1280, 375]) {
    for (const build of ['baseline', 'candidate']) {
      const { c, p } = await load(browser, build, 'v1', width, slug)
      await p.screenshot({ path: path.join(shots, `v1-${build}-${scenario}-${width}.png`), fullPage: true })
      await c.close()
      await pace()
    }
  }

  fs.writeFileSync(path.join(out, 'browser.json'), JSON.stringify({ backend: 'origin/dev 9f11568 (disposable DB)', now: NOW.toISOString(), problems, rows }, null, 2) + '\n')
  console.log('rows', rows.length, 'problems', problems.length)
  for (const problem of problems) console.log(' -', problem)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
