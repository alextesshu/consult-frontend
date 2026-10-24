// KAN-161 Chromium acceptance: Claude source vs Vue, interactions, roles, states, motion, v1 parity.
// Browser fixtures only (common.cjs). Usage: node acceptance.cjs [--parity-only]
const assert = require('assert')
const { chromium, fs, path, out, repo, source, candidate, baseline, WIDTHS, context, settle, noOverflow } = require('./common.cjs')
const parityOnly = process.argv.includes('--parity-only')
const shot = (p, name, opts = {}) => p.screenshot({ path: path.join(out, `${name}.png`), ...opts })
async function saveVideo(c, p, name) { const v = p.video(); await c.close(); if (v) await v.saveAs(path.join(out, 'recordings', `${name}.webm`)) }
async function openDashboard(p, base = candidate, ui = 'v2') {
  await p.goto(`${base}/cabinet?ui=${ui}`)
  await p.locator(ui === 'v2' ? '.pc2-dashboard__hero, .pc2-dashboard__state' : '.cabinet__title').first().waitFor()
  await settle(p, 1500)
}

;(async () => {
  const browser = await chromium.launch()
  const results = { source: {}, widths: [], interactions: {}, roles: {}, states: {}, motion: {} }

  if (!parityOnly) {
    // 1. Claude source (renderVals hook only exposes the instance; content/styles untouched).
    for (const width of [1280, 1440]) {
      const { c, p, errors } = await context(browser, width, { video: width === 1440 })
      const raw = fs.readFileSync(path.join(repo, source, 'Cabinet-Dashboard.dc.html'), 'utf8')
      await c.route('**/Cabinet-Dashboard.dc.html', (r) => r.fulfill({ contentType: 'text/html', body: raw.replace('renderVals() {', 'renderVals() { window.__dash = this;') }))
      await p.goto(candidate + source + 'Cabinet-Dashboard.dc.html')
      await p.waitForFunction(() => !!window.__dash)
      await p.waitForTimeout(400)
      await shot(p, `claude-${width}-loading`)
      await p.waitForTimeout(2600)
      await shot(p, `claude-${width}-dashboard`)
      results.source[width] = { errors }
      if (width === 1440) await saveVideo(c, p, 'claude-1440-dashboard'); else await c.close()
    }
    {
      const { c, p } = await context(browser, 1440, { height: 1000 })
      const raw = fs.readFileSync(path.join(repo, source, 'Cabinet-Mobile.dc.html'), 'utf8')
      await c.route('**/Cabinet-Mobile.dc.html', (r) => r.fulfill({ contentType: 'text/html', body: raw.replace('renderVals() {', 'renderVals() { window.__mob = this;') }))
      await p.goto(candidate + source + 'Cabinet-Mobile.dc.html')
      await p.waitForFunction(() => !!window.__mob && document.getElementById('m1')?.getBoundingClientRect().width > 0)
      await settle(p, 1200)
      await p.locator('#m1').screenshot({ path: path.join(out, 'claude-m1-mobile.png') })
      await c.close()
    }

    // 2. Vue at every width (+ motion recordings at 375 and 1440).
    for (const width of WIDTHS) {
      const record = width === 375 || width === 1440
      const { c, p, errors } = await context(browser, width, { video: record })
      await openDashboard(p)
      await shot(p, `vue-${width}-dashboard`)
      if (width === 375 || width === 1440) await shot(p, `vue-${width}-dashboard-full`, { fullPage: true })
      const geometry = await p.evaluate(() => {
        const q = (s) => document.querySelector(s)
        const visible = (el) => !!el && getComputedStyle(el).display !== 'none'
        return {
          heroName: getComputedStyle(q('.pc2-dashboard__hero-name')).fontSize, clock: getComputedStyle(q('.pc2-dashboard__clock')).fontSize,
          columns: getComputedStyle(q('.pc2-dashboard__columns')).gridTemplateColumns.split(' ').length,
          stripScrolls: q('.pc2-dashboard__today').scrollWidth > q('.pc2-dashboard__today').clientWidth,
          queueButtonHeight: Math.round(q('.pc2-dashboard__card .pc2-dashboard__btn').getBoundingClientRect().height),
          readinessFull: visible(q('.pc2-dashboard__readiness')), readinessRow: visible(q('.pc2-dashboard__readiness-row')),
        }
      })
      const entry = { width, geometry, overflow: await noOverflow(p), errors }
      assert.ok(entry.overflow.ok, `overflow at ${width}: ${JSON.stringify(entry.overflow)}`)
      if (width < 768) { assert.equal(geometry.heroName, '26px'); assert.equal(geometry.clock, '40px'); assert.equal(geometry.queueButtonHeight, 44); assert.ok(geometry.readinessRow && !geometry.readinessFull) }
      else { assert.equal(geometry.heroName, '40px'); assert.equal(geometry.clock, '88px'); assert.ok(geometry.readinessFull && !geometry.readinessRow) }
      results.widths.push(entry)
      if (record) {
        // Motion: range change replays the count-up; timer toggle starts the countdown.
        await p.getByRole('button', { name: '7 днів' }).click()
        await p.waitForTimeout(400)
        const toggle = p.getByRole('button', { name: 'Показати таймер' })
        if (await toggle.isVisible()) await toggle.click()
        else await p.locator('.pc2-dashboard__today').evaluate((el) => el.scrollBy({ left: 240, behavior: 'smooth' }))
        await p.waitForTimeout(2200)
        await saveVideo(c, p, `vue-${width}-dashboard`)
      } else await c.close()
      console.log('width', width)
    }

    // 3. Interactions at 1280: timer, persistence, ranges, keyboard, deep links.
    {
      const { c, p, errors } = await context(browser, 1280)
      await openDashboard(p)
      await p.getByRole('button', { name: 'Показати таймер' }).click()
      const c1 = await p.locator('.pc2-dashboard__clock').textContent()
      await p.waitForTimeout(2100)
      const c2 = await p.locator('.pc2-dashboard__clock').textContent()
      await shot(p, 'vue-1280-timer')
      await p.reload(); await p.locator('.pc2-dashboard__hero').waitFor(); await settle(p, 1200)
      const persisted = await p.getByRole('button', { name: 'Сховати таймер' }).count()
      const range = p.getByRole('button', { name: '90 днів' })
      await range.focus(); await p.keyboard.press('Enter')
      await p.waitForFunction(() => document.querySelector('.pc2-dashboard__metrics strong')?.textContent === '118')
      const pressed = await range.getAttribute('aria-pressed')
      const links = await p.$$eval('.pc2-dashboard a', (as) => [...new Set(as.map((a) => a.getAttribute('href')))])
      results.interactions = { countdown: [c1, c2], persisted: persisted === 1, rangePressed: pressed, links, errors }
      assert.notEqual(c1, c2); assert.match(c1, /^\d\d:\d\d$/); assert.equal(persisted, 1); assert.equal(pressed, 'true')
      for (const href of links) assert.match(href, /^\/cabinet(\/|\?|$)|^https:\/\/meet\.example\.test/)
      await c.close()
    }

    // 4. Reduced motion: content visible at once, no transitions, no pulse timer.
    {
      const { c, p } = await context(browser, 1280, { motion: 'reduce' })
      await p.goto(`${candidate}/cabinet?ui=v2`)
      await p.locator('.pc2-dashboard__hero').waitFor()
      await p.waitForTimeout(150)
      results.motion.reduced = await p.evaluate(() => {
        const hero = document.querySelector('.pc2-dashboard__hero'), s = getComputedStyle(hero)
        return { opacity: s.opacity, transform: s.transform, transition: s.transition, metric: document.querySelector('.pc2-dashboard__metrics strong')?.textContent }
      })
      assert.equal(results.motion.reduced.opacity, '1'); assert.equal(results.motion.reduced.transform, 'none')
      await c.close()
    }

    // 5. Roles and auth: guests go to login, clients cannot open the specialist dashboard.
    {
      const guest = await context(browser, 1280, { authed: false })
      await guest.p.goto(`${candidate}/cabinet?ui=v2`)
      await guest.p.waitForURL(/\/login/)
      results.roles.guest = new URL(guest.p.url()).pathname
      await guest.c.close()
      const client = await context(browser, 1280, { roles: ['CLIENT'] })
      await client.p.goto(`${candidate}/cabinet?ui=v2`)
      await client.p.waitForURL((u) => !u.pathname.startsWith('/cabinet'))
      results.roles.client = new URL(client.p.url()).pathname
      results.roles.clientDashboard = await client.p.locator('.pc2-dashboard').count()
      await client.c.close()
      assert.equal(results.roles.guest, '/login'); assert.equal(results.roles.clientDashboard, 0)
    }

    // 6. Loading, empty and error states.
    {
      const { c, p } = await context(browser, 1280)
      await c.route('**/api/booking/sessions/**', async (r) => { await new Promise((res) => setTimeout(res, 2500)); return r.fallback() })
      await p.goto(`${candidate}/cabinet?ui=v2`)
      await p.locator('.pc2-dashboard__skeleton').waitFor()
      await shot(p, 'vue-1280-loading')
      results.states.skeleton = true
      await c.close()
      const empty = await context(browser, 1280, { scenario: { sessions: [], workQueue: { today_sessions: [], guest_requests_preview: [], notes_reminders_preview: [], pending_guest_requests_count: 0, notes_reminders_count: 0 }, onboarding: { readiness: true, missing_items: [], warnings: [], next_actions: [], primary_cta_code: null, cta_target: null } } })
      await empty.c.route('**/api/cabinet/practice-analytics/**', (r) => r.fulfill({ status: 500, json: {} }))
      await openDashboard(empty.p)
      await shot(empty.p, 'vue-1280-empty-error')
      results.states.empty = await empty.p.evaluate(() => ({
        hero: document.querySelector('.pc2-dashboard__hero-empty')?.textContent?.trim(), queue: document.querySelector('.pc2-dashboard__queue-empty')?.textContent?.trim(),
        practice: document.querySelector('.pc2-dashboard__practice .pc2-dashboard__inline-error')?.textContent?.trim(), ready: document.querySelector('.pc2-dashboard__ready-line')?.textContent?.trim(),
      }))
      await empty.c.close()
      assert.ok(results.states.empty.hero && results.states.empty.queue && results.states.empty.practice)
    }
  }

  // 7. V1 pixel parity against origin/dev (three captures: baseline, control, candidate).
  const parity = []
  for (const width of [375, 768, 1280, 1440]) {
    const shots = {}
    for (const [label, base] of [['baseline', baseline], ['control', baseline], ['candidate', candidate]]) {
      const { c, p } = await context(browser, width, { motion: 'reduce', fixedTime: true })
      await openDashboard(p, base, 'v1')
      await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' })
      await p.waitForTimeout(300)
      const file = path.join(out, 'parity', `${label}-v1-${width}.png`)
      await p.screenshot({ path: file, fullPage: true })
      shots[label] = file
      await c.close()
    }
    parity.push({ width, ...shots })
  }
  fs.writeFileSync(path.join(out, 'parity', 'pairs.json'), JSON.stringify(parity, null, 2) + '\n')
  if (!parityOnly) fs.writeFileSync(path.join(out, 'acceptance.json'), JSON.stringify(results, null, 2) + '\n')
  console.log('acceptance ok')
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
