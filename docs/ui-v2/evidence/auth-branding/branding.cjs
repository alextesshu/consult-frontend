// Header/footer branding matrix: role × UI version × route × width. Browser fixtures only (common.cjs).
// Usage: node branding.cjs <candidate|baseline> [--shots]
const { chromium, fs, path, out, candidate, baseline, context, settle, noOverflow } = require('./common.cjs')
const label = process.argv[2] || 'candidate'
const base = label === 'baseline' ? baseline : candidate
const shots = process.argv.includes('--shots')
const ROUTES = ['/', '/for-clients', '/specialists', '/faq', '/login', '/signup', '/s/olena', '/cabinet']
const WHO = { guest: { authed: false }, specialist: { roles: ['SPECIALIST'] }, client: { roles: ['CLIENT'] } }
const file = (src) => (src || '').split('/').pop().split('?')[0]
;(async () => {
  const browser = await chromium.launch()
  const rows = []
  for (const width of [375, 390, 768, 1280, 1440]) {
    for (const [who, opts] of Object.entries(WHO)) {
      for (const ui of ['v1', 'v2']) {
        const { c, p, errors } = await context(browser, width, opts)
        for (const route of ROUTES) {
          await p.goto(`${base}${route}?ui=${ui}`); await settle(p, 1400)
          const r = await p.evaluate(() => {
            const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'
            const header = document.querySelector('header.topbar'), footer = document.querySelector('footer.footer')
            const logos = (root, sel) => root ? [...root.querySelectorAll(sel)].filter(visible).map((i) => ({ src: i.getAttribute('src'), w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height) })) : []
            const hb = header?.getBoundingClientRect()
            return {
              path: location.pathname, headerClass: header ? [...header.classList].filter((x) => /pc2|topbar--/.test(x)).join(' ') : 'none', headerH: hb ? Math.round(hb.height) : 0,
              headerLogos: logos(header, '.brand img'), footerClass: footer ? [...footer.classList].filter((x) => /pc2|footer--/.test(x)).join(' ') : 'none',
              footerLogos: logos(footer, 'img:not(.pc2-footer__watermark)'), footerBg: footer ? getComputedStyle(footer).backgroundColor : '', bodyBg: getComputedStyle(document.body).backgroundColor,
            }
          })
          rows.push({ label, width, who, ui, route, ...r, headerLogos: r.headerLogos.map((l) => `${file(l.src)}@${l.w}x${l.h}`), footerLogos: r.footerLogos.map((l) => `${file(l.src)}@${l.w}x${l.h}`), overflow: (await noOverflow(p)).ok, errors: errors.length })
          if (shots && [375, 1280].includes(width) && ['/', '/for-clients', '/s/olena', '/cabinet'].includes(route) && who !== 'guest') {
            const name = `${label}-${ui}-${who}-${width}${route === '/' ? '-home' : route.replace(/\//g, '-')}`
            await p.screenshot({ path: path.join(out, `${name}-header.png`), clip: { x: 0, y: 0, width, height: 120 } })
            const fb = await p.evaluate(() => { const f = document.querySelector('footer.footer'); if (!f) return null; f.scrollIntoView(); const b = f.getBoundingClientRect(); return { y: b.top, h: b.height } })
            if (fb) { await p.waitForTimeout(200); await p.screenshot({ path: path.join(out, `${name}-footer.png`), clip: { x: 0, y: Math.max(0, fb.y), width, height: Math.min(260, fb.h) } }) }
          }
        }
        await c.close()
      }
    }
    console.log(label, width)
  }
  fs.writeFileSync(path.join(out, `branding-${label}.json`), JSON.stringify(rows, null, 2) + '\n')
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
