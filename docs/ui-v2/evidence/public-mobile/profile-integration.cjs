// KAN-158 public profile × Public-Mobile header: sticky section nav must meet the header without a gap,
// the restricted specialist-owned menu must stay free of product promotion. Browser fixtures only.
const assert = require('assert')
const { chromium, fs, out, path, candidate, baseline, context, settle, noOverflow } = require('./common.cjs')
const label = process.argv[2] || 'candidate'
const base = label === 'baseline' ? baseline : candidate

;(async () => {
  const browser = await chromium.launch()
  const results = []
  for (const width of [375, 390, 640, 768, 1280]) {
    const { c, p, errors } = await context(browser, width)
    await p.goto(`${base}/s/olena?ui=v2`)
    await p.locator('h1').filter({ hasText: 'Марія Коваль' }).first().waitFor()
    await settle(p, 900)
    const nav = p.locator('.pc2-profile-nav')
    await nav.scrollIntoViewIfNeeded()
    await p.evaluate(() => window.scrollBy(0, 900))
    await p.waitForTimeout(400)
    const geometry = await p.evaluate(() => {
      const header = document.querySelector('header.pc2-header').getBoundingClientRect()
      const navEl = document.querySelector('.pc2-profile-nav')
      const n = navEl.getBoundingClientRect()
      const h = document.querySelector('header.pc2-header')
      const visible = (el) => !!el && getComputedStyle(el).display !== 'none'
      return {
        headerBottom: Math.round(header.bottom), navTop: Math.round(n.top), navStuck: getComputedStyle(navEl).position === 'sticky' && Math.round(n.top) === parseInt(getComputedStyle(navEl).top),
        headerLinks: [...h.querySelectorAll('.nav > a')].filter(visible).map((a) => `${a.textContent.trim()} → ${a.getAttribute('href')}`),
        audience: visible(h.querySelector('.pc2-header__audience')),
      }
    })
    await p.screenshot({ path: path.join(out, `${label}-${width}-profile-sticky.png`) })
    const entry = { width, ...geometry, overflow: await noOverflow(p), errors }
    if (label === 'candidate' && width < 768) {
      const toggle = p.locator('.pc2-header__menu-toggle')
      await toggle.click()
      entry.menu = await p.evaluate(() => ({ dialog: !!document.getElementById('public-mobile-menu-v2'), inline: [...document.querySelectorAll('#public-navigation-v2 a')].map((a) => a.textContent.trim()), bodyOverflow: document.body.style.overflow }))
      await p.keyboard.press('Escape')
      entry.afterEscape = await p.evaluate(() => ({ inline: !!document.getElementById('public-navigation-v2'), focus: document.activeElement?.getAttribute('aria-label') }))
      assert.equal(entry.menu.dialog, false); assert.deepEqual(entry.menu.inline, ['Вхід']); assert.equal(entry.menu.bodyOverflow, '')
      assert.equal(entry.afterEscape.inline, false); assert.equal(entry.afterEscape.focus, 'Меню сайту')
      assert.deepEqual(entry.headerLinks, ['Увійти → /login'])
    }
    if (label === 'candidate') {
      assert.equal(entry.navTop, entry.headerBottom, `nav must meet the header at ${width}px`)
      assert.equal(entry.audience, false === (width >= 1101) ? false : entry.audience)
      assert.ok(entry.overflow.ok)
    }
    results.push(entry)
    await c.close()
    console.log(label, width, entry.headerBottom, entry.navTop)
  }
  fs.writeFileSync(path.join(out, `profile-integration-${label}.json`), JSON.stringify(results, null, 2) + '\n')
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
