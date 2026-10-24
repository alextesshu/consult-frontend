// Chromium acceptance for Public Mobile P1–P5 (browser fixtures; not backend acceptance).
const assert = require('assert')
const { chromium, fs, out, path, candidate, baseline, context, settle, noOverflow } = require('./common.cjs')
const ready = { '/': '#home-hero-title', '/for-clients': '#clients-title, #home-hero-title', '/specialists': '.pc2-specialist-card, .result-card', '/login': '#login-title, .auth__title' }

async function open(p, base, route, ui) {
  await p.goto(`${base}${route}${route.includes('?') ? '&' : '?'}ui=${ui}`)
  await p.locator(ready[route.split('?')[0]] || 'main').first().waitFor()
  await settle(p, 900)
}
const sheetState = (p) => p.evaluate(() => {
  const root = document.querySelector('.pc2-discovery-sheet'), panel = root.querySelector('.pc2-discovery-sheet__panel'), dim = root.querySelector('.pc2-discovery-sheet__backdrop')
  const ps = getComputedStyle(panel), ds = getComputedStyle(dim)
  return { open: root.classList.contains('is-open'), visibility: getComputedStyle(root).visibility, heightRatio: +(panel.getBoundingClientRect().height / innerHeight).toFixed(3), panelTransition: ps.transition, transform: ps.transform, dimTransition: ds.transition, dimOpacity: ds.opacity, bodyOverflow: document.body.style.overflow, focusInSheet: panel.contains(document.activeElement) }
})

;(async () => {
  const browser = await chromium.launch()
  const results = { interactions: {}, overflow: [], motion: {} }
  const parityOnly = process.argv.includes('--parity-only')
  if (!parityOnly) {

  // P4: sheet motion, keyboard, scroll lock, focus return, live count, history.
  {
    const { c, p, errors } = await context(browser, 375, { video: true })
    await open(p, candidate, '/specialists', 'v2')
    const closed = await sheetState(p)
    const toggle = p.getByRole('button', { name: /^Фільтри/ })
    await toggle.focus()
    await p.keyboard.press('Enter')
    await p.waitForTimeout(500)
    const opened = await sheetState(p)
    await p.keyboard.press('Shift+Tab')
    const trapped = await p.evaluate(() => document.querySelector('.pc2-discovery-sheet__panel').contains(document.activeElement))
    await p.locator('#discovery-filter-sheet').getByText('Офлайн', { exact: true }).click()
    await p.waitForURL(/format=offline/)
    await p.getByRole('button', { name: 'Показати 1 спеціаліст' }).waitFor()
    const badge = await p.locator('.pc2-discovery__filters-count').textContent()
    await p.keyboard.press('Escape')
    await p.waitForTimeout(500)
    const afterEscape = await sheetState(p)
    const focusReturned = await p.evaluate(() => document.activeElement?.classList.contains('pc2-discovery__filters-toggle'))
    await p.goBack()
    await p.waitForURL((u) => !u.search.includes('format=offline'))
    await p.getByRole('heading', { name: '3 спеціалісти' }).waitFor()
    await p.goForward()
    await p.getByRole('heading', { name: '1 спеціаліст' }).waitFor()
    // Touch: tap the backdrop to close.
    await toggle.tap()
    await p.waitForTimeout(500)
    await p.locator('.pc2-discovery-sheet__backdrop').tap({ position: { x: 180, y: 60 } })
    await p.waitForTimeout(500)
    const afterBackdrop = await sheetState(p)
    // Sticky search bar stays under the header after scrolling.
    await p.evaluate(() => window.scrollTo(0, 600))
    await p.waitForTimeout(200)
    const sticky = await p.evaluate(() => ({ barTop: Math.round(document.querySelector('.pc2-discovery__bar').getBoundingClientRect().top), headerBottom: Math.round(document.querySelector('header').getBoundingClientRect().bottom) }))
    results.interactions.discovery = { closed, opened, trapped, badge, afterEscape, focusReturned, afterBackdrop, sticky, errors }
    assert.equal(opened.open, true); assert.equal(opened.heightRatio, 0.72); assert.equal(opened.bodyOverflow, 'hidden'); assert.ok(opened.focusInSheet)
    assert.match(opened.panelTransition, /transform 0\.4s cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)/); assert.match(opened.dimTransition, /opacity 0\.3s/)
    assert.equal(closed.visibility, 'hidden'); assert.ok(trapped); assert.equal(badge, '1')
    assert.equal(afterEscape.open, false); assert.equal(afterEscape.bodyOverflow, ''); assert.ok(focusReturned); assert.equal(afterBackdrop.open, false)
    assert.ok(Math.abs(sticky.barTop - sticky.headerBottom) <= 1, JSON.stringify(sticky))
    const video = p.video(); await c.close(); if (video) await video.saveAs(path.join(out, 'recordings', 'vue-375-p4-sheet.webm'))
  }

  // P4 reduced motion: no transitions on the sheet.
  {
    const { c, p } = await context(browser, 375, { motion: 'reduce' })
    await open(p, candidate, '/specialists', 'v2')
    await p.getByRole('button', { name: /^Фільтри/ }).click()
    await p.waitForTimeout(50)
    results.motion.reducedSheet = await sheetState(p)
    assert.match(results.motion.reducedSheet.panelTransition, /^all 0s ease 0s$|none/)
    await c.close()
  }

  // P1: horizontal snap strip, dots follow swipe, keyboard dots, desktop panel hidden on mobile.
  {
    const { c, p, errors } = await context(browser, 375, { video: true })
    await open(p, candidate, '/', 'v2')
    await p.locator('.pc2-home__strip').scrollIntoViewIfNeeded()
    const geometry = await p.evaluate(() => {
      const card = document.querySelector('.pc2-home__strip-card').getBoundingClientRect(), track = document.querySelector('.pc2-home__strip-track')
      const listen = document.querySelector('.pc2-home__listen'), mark = document.querySelector('.pc2-home__hero-mark')
      return { cardWidth: Math.round(card.width), trackWidth: track.clientWidth, snap: getComputedStyle(track).scrollSnapType, listen: [listen.offsetWidth, listen.offsetHeight], mark: [mark.offsetWidth, mark.offsetHeight], panelHidden: getComputedStyle(document.querySelector('.pc2-home__journey-panel')).display }
    })
    await p.evaluate(() => document.querySelector('.pc2-home__strip-track').scrollBy({ left: 330 }))
    await p.waitForTimeout(800)
    const afterSwipe = await p.evaluate(() => [...document.querySelectorAll('.pc2-home__dots button')].findIndex((b) => b.getAttribute('aria-current') === 'step'))
    await p.getByRole('button', { name: /^Крок 4 з 4/ }).focus()
    await p.keyboard.press('Enter')
    await p.waitForTimeout(900)
    const afterDot = await p.evaluate(() => ({ index: [...document.querySelectorAll('.pc2-home__dots button')].findIndex((b) => b.getAttribute('aria-current') === 'step'), scrollLeft: Math.round(document.querySelector('.pc2-home__strip-track').scrollLeft) }))
    await p.screenshot({ path: path.join(out, 'vue-375-home-strip-step4.png') })
    await p.getByRole('link', { name: 'Як це працює' }).click()
    await p.waitForURL(/#how-it-works/)
    results.interactions.home = { geometry, afterSwipe, afterDot, errors }
    assert.deepEqual(geometry.listen, [72, 72]); assert.deepEqual(geometry.mark, [44, 44]); assert.equal(geometry.snap, 'x mandatory'); assert.equal(geometry.panelHidden, 'none')
    assert.ok(Math.abs(geometry.cardWidth - Math.round(geometry.trackWidth * 0.82 - 0.82 * 40)) <= 2, JSON.stringify(geometry))
    assert.equal(afterSwipe, 1); assert.equal(afterDot.index, 3)
    const video = p.video(); await c.close(); if (video) await video.saveAs(path.join(out, 'recordings', 'vue-375-p1-strip.webm'))
  }

  // P3: search submits ?q= like desktop; topic chip strip scrolls horizontally.
  {
    const { c, p, errors } = await context(browser, 375)
    await open(p, candidate, '/for-clients', 'v2')
    const chips = await p.evaluate(() => { const n = document.querySelector('.pc2-for-clients .pc2-chips'); return { scrollable: n.scrollWidth > n.clientWidth, wrap: getComputedStyle(n).flexWrap } })
    const preview = await p.evaluate(() => getComputedStyle(document.querySelector('.pc2-for-clients__preview')).display)
    await p.locator('#client-search').fill('не можу заснути')
    await p.getByRole('button', { name: 'Знайти спеціаліста' }).click()
    await p.waitForURL(/\/specialists\?/)
    const url = new URL(p.url())
    results.interactions.forClients = { chips, preview, q: url.searchParams.get('q'), errors }
    assert.ok(chips.scrollable); assert.equal(chips.wrap, 'nowrap'); assert.equal(preview, 'none'); assert.equal(url.searchParams.get('q'), 'не можу заснути')
    await c.close()
  }

  // P5: role switch, forgot link in field label, 54px fields, keyboard submit with fixture 401.
  {
    const { c, p, errors } = await context(browser, 375)
    await open(p, candidate, '/login', 'v2')
    const fields = await p.$$eval('.pc2-login__field input', (els) => els.map((e) => Math.round(e.getBoundingClientRect().height)))
    await p.getByRole('button', { name: 'Я спеціаліст' }).click()
    const footer = await p.locator('.pc2-login__foot a').getAttribute('href')
    await p.locator('input[name=identifier]').fill('fixture@example.test')
    await p.locator('#login-password').fill('fixture-password')
    await p.keyboard.press('Enter')
    await p.getByRole('alert').waitFor()
    const alert = await p.getByRole('alert').textContent()
    await p.screenshot({ path: path.join(out, 'vue-375-login-error.png') })
    results.interactions.login = { fields, footer, alert, errors }
    assert.deepEqual(fields, [54, 54]); assert.equal(footer, '/signup')
    await c.close()
  }

  // No horizontal overflow at every width on every page, v1 and v2.
  for (const width of [375, 390, 640, 768, 1280, 1440]) {
    const { c, p } = await context(browser, width)
    for (const ui of ['v1', 'v2']) for (const route of ['/', '/for-clients', '/specialists', '/login']) {
      await open(p, candidate, route, ui)
      results.overflow.push({ width, ui, route, ...(await noOverflow(p)) })
    }
    await c.close()
  }
  assert.ok(results.overflow.every((r) => r.ok), JSON.stringify(results.overflow.filter((r) => !r.ok)))
  }

  // Pixel parity: v1 at all checked widths and v2 desktop (>= 768) against origin/dev.
  const parity = []
  const routes = [['home', '/'], ['for-clients', '/for-clients'], ['discovery', '/specialists'], ['login', '/login']]
  for (const [ui, widths, names] of [['v1', [375, 768, 1280, 1440], routes], ['v2', [768, 1280, 1440], routes.filter(([n]) => n !== 'login')]]) {
    for (const width of widths) {
      for (const [name, route] of names) {
        for (const [label, base] of [['baseline', baseline], ['control', baseline], ['candidate', candidate]]) {
          const { c, p } = await context(browser, width, { motion: 'reduce' })
          await open(p, base, route, ui)
          await p.evaluate(() => { document.querySelectorAll('input').forEach((i) => i.blur()); window.scrollTo(0, 0) })
          await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' })
          await p.waitForTimeout(300)
          await p.screenshot({ path: path.join(out, 'parity', `${label}-${ui}-${width}-${name}.png`), fullPage: true })
          await c.close()
        }
        parity.push({ ui, width, page: name })
      }
    }
  }
  fs.writeFileSync(path.join(out, 'parity', 'pairs.json'), JSON.stringify(parity, null, 2) + '\n')
  fs.writeFileSync(path.join(out, 'acceptance.json'), JSON.stringify(results, null, 2) + '\n')
  console.log('acceptance ok')
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
