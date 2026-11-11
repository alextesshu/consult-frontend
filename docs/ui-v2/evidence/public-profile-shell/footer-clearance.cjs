// Footer vs the profile's fixed mobile booking bar: at the end of the scroll, is every footer control above the bar
// and actually hit-testable (elementFromPoint), and does a real click on «Налаштування конфіденційності» work?
const { chromium, fs, path, out, candidate, baseline, open, ready } = require('./common.cjs')
const VIEWPORTS = [[375, 667], [390, 844], [1280, 800]]
// label: file prefix (e.g. before-fix / after-fix); 'baseline' measures origin/dev instead of this branch.
const label = process.argv[2] || 'after-fix'
const base = label === 'baseline' ? baseline : candidate
;(async () => {
  const browser = await chromium.launch()
  const rows = []
  for (const [width, height] of VIEWPORTS) for (const role of ['guest', 'client']) {
    const { c, p } = await open(browser, width, { role, height })
    await p.goto(`${base}/s/olena?ui=v2`)
    await ready(p, '/s/olena')
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await p.waitForTimeout(300)
    const geo = await p.evaluate(() => {
      const bar = [...document.querySelectorAll('.pc2-profile-bottom-bar, .pc2-profile-mobile-cta')].find((el) => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().height > 0)
      const barTop = bar ? Math.round(bar.getBoundingClientRect().top) : window.innerHeight
      const footer = document.querySelector('footer.footer')
      const f = footer.getBoundingClientRect()
      const controls = [...footer.querySelectorAll('a, button')].map((el) => {
        const r = el.getBoundingClientRect()
        const x = r.left + r.width / 2
        const y = r.top + r.height / 2
        const hit = document.elementFromPoint(x, y)
        return { name: el.textContent.trim() || el.getAttribute('aria-label'), top: Math.round(r.top), bottom: Math.round(r.bottom), aboveBar: r.bottom <= barTop, hittable: !!hit && (hit === el || el.contains(hit)) }
      })
      const disclaimer = footer.querySelector('.pc2-footer__bottom span')?.getBoundingClientRect()
      return { bar: bar ? bar.className : null, barTop, footerBottom: Math.round(f.bottom), viewport: window.innerHeight, scrollY: Math.round(window.scrollY), maxScroll: document.documentElement.scrollHeight - window.innerHeight, disclaimerBottom: disclaimer && Math.round(disclaimer.bottom), disclaimerAboveBar: !disclaimer || disclaimer.bottom <= barTop, controls }
    })
    await p.screenshot({ path: path.join(out, 'screenshots', `${label}-footer-clearance-${role}-${width}x${height}.png`) })
    // A real pointer click (not a programmatic one) must reach the privacy button.
    let clickOk = false
    try {
      await p.locator('footer').getByRole('button', { name: 'Налаштування конфіденційності' }).click({ timeout: 3000 })
      clickOk = await p.getByRole('region', { name: 'Файли cookie та аналітика' }).isVisible()
    } catch (e) { clickOk = false }
    const ok = geo.controls.every((x) => x.aboveBar && x.hittable) && geo.disclaimerAboveBar && clickOk
    rows.push({ width, height, role, ok, clickOk, ...geo })
    console.log(width, height, role, ok ? 'OK' : 'FAIL', 'barTop', geo.barTop, 'footerBottom', geo.footerBottom, 'disclaimerBottom', geo.disclaimerBottom, 'covered', geo.controls.filter((x) => !(x.aboveBar && x.hittable)).map((x) => x.name), 'click', clickOk)
    await c.close()
  }
  fs.writeFileSync(path.join(out, `footer-clearance-${label}.json`), JSON.stringify(rows, null, 2) + '\n')
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
