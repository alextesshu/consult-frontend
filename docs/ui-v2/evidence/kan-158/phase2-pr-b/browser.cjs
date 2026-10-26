// KAN-158 phase 2 · PR B (offer selection and pricing, v6.9.1). Real disposable Django (origin/dev backend,
// seed_therapists + CTA scenarios); candidate = this branch, baseline = origin/dev 041a705. One fixed clock.
// Guest request POSTs are intercepted (payload recorded, local stub response) so no backend write happens.
// Paced for the 30/min anonymous throttle. Writes browser.json, parity.json (compare.py) and screenshots/.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')
const out = __dirname
const shots = path.join(out, 'screenshots')
fs.mkdirSync(shots, { recursive: true })

const BUILDS = { candidate: 'http://127.0.0.1:5411', baseline: 'http://127.0.0.1:5406' }
const SCENARIOS = { direct: 'seed-therapist-1', request: 'seed-therapist-2', directEmpty: 'seed-therapist-4' }
const NOW = new Date()
const pace = () => new Promise((resolve) => setTimeout(resolve, 15000))

async function load(browser, build, version, width, slug) {
  const c = await browser.newContext({ viewport: { width, height: width < 860 ? 812 : 900 }, locale: 'uk-UA', timezoneId: 'Europe/Kyiv', reducedMotion: 'reduce' })
  await c.clock.setFixedTime(NOW)
  await c.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })))
  await c.route('**/*', (r) => (['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort()))
  const posts = []
  await c.route('**/guest-booking-requests/', (r) => {
    if (r.request().method() !== 'POST') return r.continue()
    posts.push(r.request().postDataJSON())
    return r.fulfill({ status: 201, json: { request: { id: 1, status: 'PENDING', created_at: NOW.toISOString(), next_step: null } } })
  })
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
  return { c, p, requests, errors, posts }
}

const state = (p) => p.evaluate(() => {
  const text = (el) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null
  const bar = document.querySelector('.pc2-profile-bottom-bar')
  return {
    pressedOffers: [...document.querySelectorAll('.identity-rail__service[aria-pressed="true"]')].map((el) => el.getAttribute('aria-label')),
    summary: text(document.querySelector('.pc2-final-cta__summary')),
    barContext: text(bar?.querySelector('span')),
    barHeadline: text(bar?.querySelector('strong')),
    barContextCut: (() => { const el = bar?.querySelector('span'); return el ? el.scrollWidth > el.clientWidth : null })(),
    barPriceVisible: (() => {
      const el = bar?.querySelector('span')
      const node = el?.firstChild
      const at = node?.textContent?.search(/\d[\d\s]* грн/) ?? -1
      if (!el || at < 0) return null
      const end = node.textContent.indexOf('грн', at) + 3
      const range = document.createRange()
      range.setStart(node, at)
      range.setEnd(node, end)
      return range.getBoundingClientRect().right <= el.getBoundingClientRect().right + 0.5
    })(),
    slotChips: document.querySelectorAll('.slot-time').length,
    formSummary: text(document.querySelector('.guest-offer-summary')),
    formOptions: document.querySelectorAll('.guest-offer-option').length,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }
})
const offer = (p, name, scope = '') => p.locator(`${scope} .identity-rail__service[aria-label^="${name}:"]`).first()

async function fillAndSubmit(p) {
  const form = p.locator('.guest-booking-form').first()
  await form.locator('#guestBookingName').fill('Синтетичний гість')
  await form.locator('#guestBookingContactValue').fill('guest@example.test')
  const consent = form.locator('.setting-check input')
  if (await consent.count()) await consent.first().check()
  await form.locator('button[type=submit]').click()
}

;(async () => {
  const browser = await chromium.launch()
  const rows = []
  const problems = []
  const fail = (message) => problems.push(message)
  const initialSummary = { direct: '3 формати · від 500 грн', request: '2 формати · від 1400 грн', directEmpty: 'Консультація · 1800 грн · 50 хв' }

  // 1. Initial state: nothing selected anywhere, «від» minimum, at every width.
  for (const [scenario, slug] of Object.entries(SCENARIOS)) for (const width of [375, 390, 768, 820, 1280]) {
    const { c, p, requests, errors } = await load(browser, 'candidate', 'v2', width, slug)
    const s = await state(p)
    await p.screenshot({ path: path.join(shots, `v2-${scenario}-${width}-initial.png`), fullPage: width >= 860 })
    const writes = requests.filter((r) => !r.startsWith('GET ') && !r.includes('/auth/token/refresh/'))
    rows.push({ check: 'initial', scenario, width, ...s, slotFetches: requests.filter((r) => r.includes('/booking/slots/')).length, writes, errors })
    const id = `initial ${scenario} ${width}`
    if (s.pressedOffers.length) fail(`${id}: preselected ${s.pressedOffers}`)
    if (s.summary !== initialSummary[scenario]) fail(`${id}: summary «${s.summary}»`)
    if (width < 860 && scenario !== 'directEmpty' && !/^від /.test(s.barContext + ' ' + s.barHeadline) && !/від /.test(s.barHeadline || s.barContext)) fail(`${id}: bar ${s.barContext} / ${s.barHeadline}`)
    if (scenario === 'request' && rows.at(-1).slotFetches) fail(`${id}: request_only fetched slots`)
    if (s.overflow) fail(`${id}: overflow`)
    if (writes.length || errors.length) fail(`${id}: writes ${writes} errors ${errors}`)
    await c.close()
    await pace()
  }

  // 2. Desktop direct: an explicit choice filters slots and sets the price; the request carries that offer.
  {
    const { c, p, posts } = await load(browser, 'candidate', 'v2', 1280, SCENARIOS.direct)
    await offer(p, 'Парна консультація').click()
    await p.waitForTimeout(300)
    const couple = await state(p)
    await offer(p, 'Ознайомча сесія').click()
    await p.waitForTimeout(300)
    const intro = await state(p)
    const slot = p.locator('.pc2-request-panel button:has(.slot-time)').first()
    const slotTime = (await slot.innerText()).trim()
    await slot.click()
    await p.locator('.guest-booking-form').first().waitFor()
    const form = await state(p)
    await p.screenshot({ path: path.join(shots, 'v2-direct-1280-intro-form.png') })
    await fillAndSubmit(p)
    await p.waitForTimeout(800)
    rows.push({ check: 'desktop-choice', couple, intro, slotTime, form, posts: [...posts] })
    if (couple.slotChips !== 0 || couple.summary !== 'Парна консультація · 80 хв · 2000 грн') fail(`couple: ${JSON.stringify(couple)}`)
    if (!intro.slotChips || intro.summary !== 'Ознайомча сесія · 20 хв · 500 грн' || JSON.stringify(intro.pressedOffers) !== JSON.stringify(['Ознайомча сесія: 500 грн'])) fail(`intro: ${JSON.stringify(intro)}`)
    if (!/Ознайомча сесія/.test(form.formSummary || '')) fail(`form summary ${form.formSummary}`)
    if (posts.length !== 1 || posts[0].offer_type !== 'intro' || !posts[0].slot_id) fail(`payload ${JSON.stringify(posts)}`)
    await c.close()
    await pace()
  }

  // 3. Desktop direct without a choice: the form asks; the answer drives the screen and the request.
  {
    const { c, p, posts } = await load(browser, 'candidate', 'v2', 1280, SCENARIOS.direct)
    await p.locator('.pc2-request-panel button:has(.slot-time)').first().click()
    await p.locator('.guest-booking-form').first().waitFor()
    const asked = await state(p)
    await p.locator('.guest-offer-option', { hasText: 'Консультація' }).first().click()
    await p.waitForTimeout(300)
    const answered = await state(p)
    await fillAndSubmit(p)
    await p.waitForTimeout(800)
    rows.push({ check: 'desktop-no-choice', asked, answered, posts: [...posts] })
    if (asked.formSummary || asked.formOptions < 2) fail(`no-choice form ${JSON.stringify(asked)}`)
    if (answered.summary !== 'Консультація · 50 хв · 1200 грн') fail(`answered summary ${answered.summary}`)
    if (posts.length !== 1 || posts[0].offer_type !== 'standard') fail(`no-choice payload ${JSON.stringify(posts)}`)
    await c.close()
    await pace()
  }

  // 4. Phones: choose inside the sheet, close it, the sticky bar shows the chosen offer.
  for (const [scenario, name, context, headline] of [
    ['direct', 'Ознайомча сесія', 'Ознайомча сесія · 20 хв', '500 грн'],
    ['request', 'Парна консультація', '2000 грн · Парна консультація', 'Час — після запиту'],
    ['directEmpty', 'Консультація', '1800 грн · Консультація', 'Вільного часу зараз немає'],
  ]) for (const width of [375, 390]) {
    const { c, p, requests } = await load(browser, 'candidate', 'v2', width, SCENARIOS[scenario])
    await p.locator('.pc2-profile-mobile-cta').click()
    await p.locator('dialog[open] .identity-rail__service').first().waitFor()
    await offer(p, name, 'dialog[open]').click()
    await p.locator('dialog[open]').getByRole('button', { name: 'Закрити' }).first().click()
    await p.waitForTimeout(500)
    const s = await state(p)
    await p.screenshot({ path: path.join(shots, `v2-${scenario}-${width}-chosen.png`) })
    rows.push({ check: 'phone-choice', scenario, width, ...s, slotFetches: requests.filter((r) => r.includes('/booking/slots/')).length })
    if (s.barContext !== context || s.barHeadline !== headline) fail(`phone ${scenario} ${width}: ${s.barContext} / ${s.barHeadline}`)
    // The chosen price must stay visible: the headline carries it, or it sits inside the visible part of the context.
    if (!/грн/.test(s.barHeadline) && !s.barPriceVisible) fail(`phone ${scenario} ${width}: price hidden`)
    if (scenario === 'request' && rows.at(-1).slotFetches) fail(`phone request_only fetched slots`)
    await c.close()
    await pace()
  }

  // 5. UI v1 parity against origin/dev: warm both builds, then identical captures.
  for (const build of ['baseline', 'candidate']) { const { c } = await load(browser, build, 'v1', 1280, SCENARIOS.direct); await c.close(); await pace() }
  for (const [scenario, slug] of Object.entries(SCENARIOS)) for (const width of [1280, 375]) for (const build of ['baseline', 'candidate']) {
    const { c, p } = await load(browser, build, 'v1', width, slug)
    await p.screenshot({ path: path.join(shots, `v1-${build}-${scenario}-${width}.png`), fullPage: true })
    await c.close()
    await pace()
  }

  fs.writeFileSync(path.join(out, 'browser.json'), JSON.stringify({ backend: 'origin/dev 9f11568 (disposable DB)', now: NOW.toISOString(), problems, rows }, null, 2) + '\n')
  console.log('rows', rows.length, 'problems', problems.length)
  for (const problem of problems) console.log(' -', problem)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
