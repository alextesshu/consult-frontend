// P2 isolated-component evidence via a temporary local harness (_p2-harness.html, not committed).
const { chromium, fs, out, path, candidate, context, settle, noOverflow } = require('./common.cjs')
;(async () => {
  const browser = await chromium.launch()
  const results = []
  for (const width of [375, 390, 640]) {
    for (const audience of ['specialists', 'clients']) {
      const { c, p, errors } = await context(browser, width)
      await p.goto(`${candidate}/_p2-harness.html?audience=${audience}`)
      await p.getByRole('dialog', { name: 'Меню сайту' }).waitFor()
      await settle(p)
      await p.screenshot({ path: path.join(out, `vue-${width}-menu-${audience}.png`) })
      const rows = await p.$$eval('.pc2-mobile-menu__links a', (els) => els.map((e) => ({ text: e.textContent, height: e.getBoundingClientRect().height, href: e.getAttribute('href') })))
      const scrollLocked = await p.evaluate(() => document.body.style.overflow)
      await p.keyboard.press('Escape')
      const closed = await p.getByRole('dialog').count() === 0
      const focusReturned = await p.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
      results.push({ width, audience, rows, scrollLocked, closedOnEscape: closed, focusAfterClose: focusReturned, overflow: await noOverflow(p), errors })
      await c.close()
    }
  }
  fs.writeFileSync(path.join(out, 'menu-acceptance.json'), JSON.stringify(results, null, 2) + '\n')
  console.log(JSON.stringify(results.map((r) => [r.width, r.audience, r.rows.map((x) => x.height), r.scrollLocked, r.closedOnEscape])))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
