// KAN-161 cabinet shell Chromium acceptance. Browser fixtures only (common.cjs); not backend acceptance.
// Usage: node acceptance.cjs [--parity-only]
const assert = require('assert')
const { chromium, fs, path, out, repo, source, candidate, baseline, WIDTHS, context, settle, noOverflow } = require('./common.cjs')
const parityOnly = process.argv.includes('--parity-only')
const ROUTES = ['/cabinet', '/cabinet/profile', '/cabinet/clients', '/cabinet/slots', '/cabinet/sessions', '/cabinet/external-sessions', '/cabinet/inquiries', '/cabinet/practice-board', '/cabinet/reviews', '/cabinet/chat', '/cabinet/group-events', '/cabinet/journal', '/cabinet/analytics', '/cabinet/billing', '/cabinet/settings']
const shot = (p, name, opts = {}) => p.screenshot({ path: path.join(out, `${name}.png`), ...opts })
async function saveVideo(c, p, name) { const v = p.video(); await c.close(); if (v) await v.saveAs(path.join(out, 'recordings', `${name}.webm`)) }
async function open(p, route, ui = 'v2', base = candidate) {
  await p.goto(`${base}${route}?ui=${ui}`)
  await p.locator(ui === 'v2' ? '.pc2-cabinet-shell' : '.specialist-shell').first().waitFor()
  await settle(p, 1200)
}
const shellState = (p) => p.evaluate(() => {
  const vis = (el) => !!el && getComputedStyle(el).display !== 'none'
  const header = document.querySelector('header.topbar'), bar = document.querySelector('.pc2-cabinet-tabbar'), sheet = document.querySelector('.pc2-cabinet-more')
  return {
    headerH: Math.round(header.getBoundingClientRect().height), headerV2: header.classList.contains('pc2-cabinet-header'),
    sidebar: vis(document.querySelector('.pc2-cabinet-sidebar')), tabbar: vis(bar), tabbarTop: bar && vis(bar) ? Math.round(bar.getBoundingClientRect().top) : null,
    active: [...document.querySelectorAll('.pc2-cabinet-sidebar [aria-current="page"], .pc2-cabinet-tabbar .pc2-cabinet-tab.is-active')].filter((el) => el.getClientRects().length > 0).map((a) => a.textContent.replace(/,.*$/, '').replace(/\d+$/, '').trim()),
    moreOpen: sheet?.classList.contains('is-open') ?? false, bodyOverflow: document.body.style.overflow, focus: document.activeElement?.textContent?.trim().slice(0, 24) || document.activeElement?.getAttribute('aria-label'),
    legacyShell: !!document.querySelector('.specialist-shell'),
  }
})

;(async () => {
  const browser = await chromium.launch()
  const results = { source: {}, routes: [], mobile: {}, desktop: {}, reduced: {}, roles: {} }

  if (!parityOnly) {
    // Source references (renderVals hook only exposes the instance).
    {
      const { c, p } = await context(browser, 1440)
      const raw = fs.readFileSync(path.join(repo, source, 'Cabinet-Dashboard.dc.html'), 'utf8')
      await c.route('**/Cabinet-Dashboard.dc.html', (r) => r.fulfill({ contentType: 'text/html', body: raw.replace('renderVals() {', 'renderVals() { window.__dash = this;') }))
      await p.goto(candidate + source + 'Cabinet-Dashboard.dc.html'); await p.waitForFunction(() => !!window.__dash); await p.waitForTimeout(2600)
      await shot(p, 'claude-1440-shell'); await shot(p, 'claude-1440-sidebar', { clip: { x: 0, y: 0, width: 260, height: 900 } })
      await c.close()
      const m = await context(browser, 1440, { height: 1000 })
      const rawM = fs.readFileSync(path.join(repo, source, 'Cabinet-Mobile.dc.html'), 'utf8')
      await m.c.route('**/Cabinet-Mobile.dc.html', (r) => r.fulfill({ contentType: 'text/html', body: rawM.replace('renderVals() {', 'renderVals() { window.__mob = this;') }))
      await m.p.goto(candidate + source + 'Cabinet-Mobile.dc.html')
      await m.p.waitForFunction(() => !!window.__mob && document.getElementById('m2')?.getBoundingClientRect().width > 0); await settle(m.p, 1200)
      await m.p.locator('#m1').screenshot({ path: path.join(out, 'claude-m1.png') })
      await m.p.locator('#m2').screenshot({ path: path.join(out, 'claude-m2.png') })
      await m.c.close()
    }

    // Every specialist route at every width: chrome, active state, no overflow, nothing hidden behind the tab bar.
    for (const width of WIDTHS) {
      const { c, p, errors } = await context(browser, width)
      for (const route of ROUTES) {
        await open(p, route)
        const state = await shellState(p)
        const covered = state.tabbar ? await p.evaluate((top) => {
          window.scrollTo(0, document.documentElement.scrollHeight)
          const content = document.querySelector('.pc2-cabinet-shell__content')
          const last = [...content.querySelectorAll('*')].filter((el) => el.getClientRects().length && getComputedStyle(el).position !== 'fixed').map((el) => el.getBoundingClientRect().bottom)
          const tabTop = document.querySelector('.pc2-cabinet-tabbar').getBoundingClientRect().top
          return Math.max(0, Math.round(Math.max(...last) - tabTop))
        }) : 0
        const entry = { width, route, ...state, overflow: await noOverflow(p), coveredByTabbar: covered }
        results.routes.push(entry)
        assert.ok(entry.headerV2 && !entry.legacyShell, `${route}@${width} v2 chrome`)
        if (!entry.overflow.ok) {
          // Only pre-existing page overflow is tolerated: the same route on origin/dev must be at least as wide.
          const base = await context(browser, width)
          await base.p.goto(`${baseline}${route}?ui=v2`); await base.p.waitForTimeout(3500)
          entry.baselineOverflow = await noOverflow(base.p)
          await base.c.close()
          assert.ok(entry.baselineOverflow.scrollWidth >= entry.overflow.scrollWidth, `${route}@${width} new overflow ${JSON.stringify(entry)}`)
        }
        assert.equal(entry.coveredByTabbar, 0, `${route}@${width} content behind tab bar`)
        if (width < 768) { assert.ok(entry.tabbar && !entry.sidebar); assert.equal(entry.headerH, 52) }
        else { assert.ok(entry.sidebar && !entry.tabbar); assert.equal(entry.headerH, 60) }
        assert.ok(entry.active.length >= 1, `${route}@${width} active item`)
        if ([375, 1440].includes(width) && ['/cabinet', '/cabinet/clients', '/cabinet/settings', '/cabinet/profile'].includes(route)) await shot(p, `vue-${width}${route.replace(/\//g, '-')}`)
      }
      results.routes.push({ width, errors })
      await c.close()
      console.log('routes', width)
    }

    // Mobile «Ще» at 375: keyboard, backdrop, swipe, navigation, focus return, scroll lock (+ recording).
    {
      const { c, p } = await context(browser, 375, { video: true })
      await open(p, '/cabinet')
      const more = p.locator('.pc2-cabinet-tabbar button')
      await more.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(500)
      const opened = await shellState(p)
      await shot(p, 'vue-375-more-open')
      for (let i = 0; i < 14; i++) await p.keyboard.press('Tab')
      const trapped = await p.evaluate(() => document.getElementById('cabinet-more-sheet').contains(document.activeElement))
      await p.keyboard.press('Escape'); await p.waitForTimeout(500)
      const afterEscape = await shellState(p)
      await more.click(); await p.waitForTimeout(500)
      await p.locator('.pc2-cabinet-more__backdrop').click({ position: { x: 180, y: 40 } }); await p.waitForTimeout(500)
      const afterBackdrop = await shellState(p)
      await more.click(); await p.waitForTimeout(500)
      await p.evaluate(() => {
        const el = document.getElementById('cabinet-more-sheet')
        const t = (y) => [new Touch({ identifier: 1, target: el, clientY: y, clientX: 180 })]
        el.dispatchEvent(new TouchEvent('touchstart', { touches: t(500), bubbles: true }))
        el.dispatchEvent(new TouchEvent('touchmove', { touches: t(620), bubbles: true }))
        el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }))
      })
      await p.waitForTimeout(500)
      const afterSwipe = await shellState(p)
      await p.locator('.pc2-cabinet-header__account').click(); await p.waitForTimeout(500)
      await p.locator('#cabinet-more-sheet').getByRole('link', { name: 'Розклад' }).click()
      await p.waitForURL(/\/cabinet\/slots/); await p.waitForTimeout(600)
      const afterNav = await shellState(p)
      await shot(p, 'vue-375-slots-more-active')
      results.mobile = { opened, trapped, afterEscape, afterBackdrop, afterSwipe, afterNav }
      assert.ok(opened.moreOpen); assert.equal(opened.bodyOverflow, 'hidden'); assert.ok(trapped)
      for (const s of [afterEscape, afterBackdrop, afterSwipe, afterNav]) { assert.equal(s.moreOpen, false); assert.equal(s.bodyOverflow, '') }
      assert.match(afterEscape.focus, /^Ще/)
      assert.deepEqual(afterNav.active, ['Ще'])
      await saveVideo(c, p, 'vue-375-more')
    }
    // Widening to 768 closes the sheet and restores scroll.
    {
      const { c, p } = await context(browser, 390)
      await open(p, '/cabinet')
      await p.locator('.pc2-cabinet-tabbar button').click(); await p.waitForTimeout(400)
      await p.setViewportSize({ width: 900, height: 900 }); await p.waitForTimeout(500)
      results.mobile.afterResize = await shellState(p)
      assert.equal(results.mobile.afterResize.moreOpen, false); assert.equal(results.mobile.afterResize.bodyOverflow, '')
      await c.close()
    }

    // Desktop: keyboard focus through the sidebar, navigation transitions and active indicator (+ recording).
    {
      const { c, p } = await context(browser, 1280, { video: true })
      await open(p, '/cabinet')
      const link = p.locator('.pc2-cabinet-sidebar__link', { hasText: 'Клієнти' })
      await link.focus()
      const focusRing = await link.evaluate((el) => getComputedStyle(el).outlineStyle)
      await p.keyboard.press('Enter'); await p.waitForURL(/\/cabinet\/clients/); await p.waitForTimeout(700)
      const afterClients = await shellState(p)
      await p.locator('.pc2-cabinet-sidebar__link', { hasText: 'Групові події' }).click(); await p.waitForURL(/group-events/); await p.waitForTimeout(700)
      const afterGroups = await shellState(p)
      await p.locator('.pc2-cabinet-sidebar__link', { hasText: 'Налаштування' }).hover(); await p.waitForTimeout(300)
      await shot(p, 'vue-1280-sidebar-hover', { clip: { x: 0, y: 0, width: 260, height: 900 } })
      await p.goBack(); await p.waitForURL(/\/cabinet\/clients/); await p.waitForTimeout(500)
      const afterBack = await shellState(p)
      results.desktop = { focusRing, afterClients: afterClients.active, afterGroups: afterGroups.active, afterBack: afterBack.active }
      assert.notEqual(focusRing, 'none'); assert.deepEqual(afterClients.active, ['Клієнти']); assert.deepEqual(afterGroups.active, ['Групові події']); assert.deepEqual(afterBack.active, ['Клієнти'])
      await saveVideo(c, p, 'vue-1280-navigation')
    }

    // Reduced motion: the sheet appears without transitions.
    {
      const { c, p } = await context(browser, 375, { motion: 'reduce' })
      await open(p, '/cabinet')
      await p.locator('.pc2-cabinet-tabbar button').click(); await p.waitForTimeout(60)
      results.reduced = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('.pc2-cabinet-more__sheet')); return { transition: s.transition, transform: s.transform } })
      assert.match(results.reduced.transition, /^all 0s|none|^transform 0s/)
      await c.close()
    }

    // Roles: guests → /login; clients never get the specialist shell.
    {
      const guest = await context(browser, 1280, { authed: false })
      await guest.p.goto(`${candidate}/cabinet/clients?ui=v2`); await guest.p.waitForURL(/\/login/)
      results.roles.guest = new URL(guest.p.url()).pathname; await guest.c.close()
      const client = await context(browser, 1280, { roles: ['CLIENT'] })
      await client.p.goto(`${candidate}/cabinet?ui=v2`); await client.p.waitForURL((u) => !u.pathname.startsWith('/cabinet'))
      results.roles.client = new URL(client.p.url()).pathname
      results.roles.clientShell = await client.p.locator('.pc2-cabinet-shell, .pc2-cabinet-header').count()
      await client.c.close()
      assert.equal(results.roles.guest, '/login'); assert.equal(results.roles.clientShell, 0)
    }
  }

  // V1 pixel parity (baseline, control, candidate) on representative cabinet routes.
  const pairs = []
  for (const width of [375, 768, 1280, 1440]) for (const route of ['/cabinet', '/cabinet/clients', '/cabinet/sessions', '/cabinet/settings']) {
    const files = {}
    for (const [label, base] of [['baseline', baseline], ['control', baseline], ['candidate', candidate]]) {
      const { c, p } = await context(browser, width, { motion: 'reduce', fixedTime: true })
      await open(p, route, 'v1', base)
      await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' })
      await p.waitForTimeout(300)
      files[label] = path.join(out, 'parity', `${label}-v1-${width}${route.replace(/\//g, '-')}.png`)
      await p.screenshot({ path: files[label], fullPage: true })
      await c.close()
    }
    pairs.push({ width, route, ...files })
  }
  fs.writeFileSync(path.join(out, 'parity', 'pairs.json'), JSON.stringify(pairs, null, 2) + '\n')
  if (!parityOnly) fs.writeFileSync(path.join(out, 'acceptance.json'), JSON.stringify(results, null, 2) + '\n')
  console.log('acceptance ok')
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
