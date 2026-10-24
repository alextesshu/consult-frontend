// P2 acceptance in the real app shell (App.vue integration): 60px header, context action, menu dialog.
// API responses are browser fixtures (common.cjs), not backend acceptance.
const assert = require('assert')
const { chromium, fs, out, path, candidate, context, settle, noOverflow } = require('./common.cjs')
const READY = { '/': '#home-hero-title', '/for-clients': '#clients-title', '/specialists': '.pc2-specialist-card' }

async function open(p, route) {
  await p.goto(`${candidate}${route}?ui=v2`)
  await p.locator(READY[route]).first().waitFor()
  await settle(p, 700)
}
const header = (p) => p.evaluate(() => {
  const h = document.querySelector('header.pc2-header'), logo = h.querySelector('.pc2-brand-lockup'), toggle = h.querySelector('.pc2-header__menu-toggle')
  const visible = (el) => !!el && getComputedStyle(el).display !== 'none'
  const action = h.querySelector('.pc2-header__mobile-action')
  const links = [...h.querySelectorAll('.nav > a')].filter(visible).map((a) => `${a.textContent.trim()} → ${a.getAttribute('href')}`)
  return { height: Math.round(h.getBoundingClientRect().height), logoHeight: Math.round(logo.getBoundingClientRect().height), toggle: visible(toggle) ? [Math.round(toggle.getBoundingClientRect().width), Math.round(toggle.getBoundingClientRect().height)] : null, action: visible(action) ? `${action.textContent.trim()} → ${action.getAttribute('href')}` : null, visibleLinks: links }
})
const menuState = (p) => p.evaluate(() => {
  const panel = document.getElementById('public-mobile-menu-v2')
  const button = document.querySelector('.pc2-header__menu-toggle')
  return { open: !!panel, expanded: button?.getAttribute('aria-expanded'), bodyOverflow: document.body.style.overflow, htmlOverflow: document.documentElement.style.overflow, focus: document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim().slice(0, 30), panelWidth: panel ? Math.round(panel.getBoundingClientRect().width) : null, transition: panel ? getComputedStyle(panel).transition : null, rows: panel ? [...panel.querySelectorAll('.pc2-mobile-menu__links a')].map((a) => [a.textContent.replace('→', '').trim(), a.getAttribute('href'), Math.round(a.getBoundingClientRect().height)]) : [] }
})

;(async () => {
  const browser = await chromium.launch()
  const results = []
  for (const width of [375, 390, 640, 768, 1280]) {
    const { c, p, errors } = await context(browser, width, { video: width === 375 })
    const entry = { width, pages: {}, errors }
    for (const route of ['/', '/for-clients', '/specialists']) {
      await open(p, route)
      entry.pages[route] = { header: await header(p), overflow: await noOverflow(p) }
      await p.screenshot({ path: path.join(out, `vue-${width}-header-${route === '/' ? 'home' : route.slice(1)}.png`), clip: { x: 0, y: 0, width, height: 120 } })
    }
    await open(p, '/')
    const toggle = p.locator('.pc2-header__menu-toggle')
    if (width < 768) {
      // Keyboard: Enter opens, focus lands on ×, Tab stays inside, Escape closes and returns focus.
      await toggle.focus()
      await p.keyboard.press('Enter')
      await p.getByRole('dialog', { name: 'Меню сайту' }).waitFor()
      await p.waitForTimeout(200)
      entry.opened = await menuState(p)
      await p.screenshot({ path: path.join(out, `vue-${width}-menu-specialists.png`) })
      for (let i = 0; i < 12; i++) await p.keyboard.press('Tab')
      entry.tabTrapped = await p.evaluate(() => document.getElementById('public-mobile-menu-v2').contains(document.activeElement))
      await p.keyboard.press('Escape')
      await p.waitForTimeout(150)
      entry.afterEscape = await menuState(p)
      // Pointer: close button; backdrop where it is exposed (panel narrower than viewport).
      await toggle.click()
      await p.getByRole('button', { name: 'Закрити меню' }).click()
      entry.afterClose = await menuState(p)
      await toggle.click()
      if (entry.opened.panelWidth < width) {
        await p.locator('.pc2-mobile-menu__backdrop').click({ position: { x: 20, y: 300 } })
        entry.afterBackdrop = await menuState(p)
      } else {
        entry.afterBackdrop = 'panel covers the viewport (source P2 full-screen); backdrop not exposed'
        await p.keyboard.press('Escape')
      }
      // Navigation through an item closes the menu and lands on the section.
      await toggle.click()
      await p.getByRole('dialog').getByRole('link', { name: /Тарифи/ }).click()
      await p.waitForURL(/#pricing/)
      await p.waitForTimeout(300)
      entry.afterNavigate = { ...(await menuState(p)), url: new URL(p.url()).pathname + new URL(p.url()).hash }
      await open(p, '/for-clients')
      await toggle.click()
      await p.getByRole('dialog').waitFor()
      entry.clients = await menuState(p)
      await p.screenshot({ path: path.join(out, `vue-${width}-menu-clients.png`) })
      await p.keyboard.press('Escape')
      assert.equal(entry.opened.open, true); assert.equal(entry.opened.expanded, 'true'); assert.equal(entry.opened.bodyOverflow, 'hidden'); assert.equal(entry.opened.focus, 'Закрити меню')
      assert.ok(entry.opened.rows.every(([, , h]) => h === 56)); assert.ok(entry.tabTrapped)
      for (const s of [entry.afterEscape, entry.afterClose, entry.afterNavigate]) { assert.equal(s.open, false); assert.equal(s.bodyOverflow, ''); assert.equal(s.htmlOverflow, '') }
      assert.equal(entry.afterEscape.focus, 'Меню сайту'); assert.equal(entry.afterNavigate.url, '/#pricing')
      if (typeof entry.afterBackdrop === 'object') assert.equal(entry.afterBackdrop.open, false)
      for (const page of Object.values(entry.pages)) { assert.equal(page.header.height, 60); assert.equal(page.header.logoHeight, 30); assert.deepEqual(page.header.toggle, [44, 44]); assert.equal(page.header.visibleLinks.length, 1) }
      assert.equal(entry.pages['/'].header.action, 'Створити → /signup')
      assert.equal(entry.pages['/for-clients'].header.action, 'Увійти → /login')
    } else {
      if (await toggle.isVisible()) {
        await toggle.click()
        entry.inlineMenu = await p.evaluate(() => !!document.getElementById('public-navigation-v2'))
        entry.dialog = await p.getByRole('dialog').count()
        assert.ok(entry.inlineMenu); assert.equal(entry.dialog, 0)
      }
      for (const page of Object.values(entry.pages)) assert.equal(page.header.action, null)
    }
    for (const page of Object.values(entry.pages)) assert.ok(page.overflow.ok, JSON.stringify(page.overflow))
    results.push(entry)
    const video = p.video()
    await c.close()
    if (video) await video.saveAs(path.join(out, 'recordings', 'vue-375-p2-menu.webm'))
    console.log('menu', width)
  }
  // Reduced motion: the menu has no source animation; nothing transitions.
  {
    const { c, p } = await context(browser, 375, { motion: 'reduce' })
    await open(p, '/')
    await p.locator('.pc2-header__menu-toggle').click()
    await p.getByRole('dialog').waitFor()
    results.push({ reducedMotion: await menuState(p) })
    await c.close()
  }
  fs.writeFileSync(path.join(out, 'menu-acceptance.json'), JSON.stringify(results, null, 2) + '\n')
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
