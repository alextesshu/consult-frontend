// UI v2 Vue captures at every acceptance width (top viewport + 375 full page) and the open P4 sheet.
const { chromium, fs, out, path, candidate, WIDTHS, context, settle, noOverflow } = require('./common.cjs')
const PAGES = { home: '/?ui=v2', 'for-clients': '/for-clients?ui=v2', discovery: '/specialists?ui=v2', login: '/login?ui=v2' }
const READY = { home: '#home-hero-title', 'for-clients': '#clients-title', discovery: '.pc2-specialist-card', login: '#login-title' }
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : WIDTHS
;(async () => {
  const browser = await chromium.launch()
  const results = []
  for (const width of only) {
    const { c, p, errors } = await context(browser, width)
    for (const [name, url] of Object.entries(PAGES)) {
      await p.goto(candidate + url)
      await p.locator(READY[name]).first().waitFor()
      await settle(p, 900)
      await p.screenshot({ path: path.join(out, `vue-${width}-${name}.png`) })
      if (width === 375) await p.screenshot({ path: path.join(out, `vue-375-${name}-full.png`), fullPage: true })
      results.push({ width, page: name, overflow: await noOverflow(p) })
    }
    if (width < 768) {
      await p.goto(candidate + PAGES.discovery)
      await p.getByRole('heading', { name: '3 спеціалісти' }).waitFor()
      await settle(p)
      await p.getByRole('button', { name: /^Фільтри/ }).click()
      await p.waitForTimeout(150)
      await p.screenshot({ path: path.join(out, `vue-${width}-discovery-sheet-opening.png`) })
      await p.waitForTimeout(600)
      await p.screenshot({ path: path.join(out, `vue-${width}-discovery-sheet.png`) })
    }
    results.push({ width, errors })
    await c.close()
    console.log('captured', width)
  }
  fs.writeFileSync(path.join(out, `vue-captures${process.argv[2] ? '-' + process.argv[2] : ''}.json`), JSON.stringify(results, null, 2) + '\n')
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
