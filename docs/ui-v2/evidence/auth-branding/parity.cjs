// V1 pixel parity: origin/dev baseline, a second baseline capture (noise control) and candidate.
const { chromium, fs, path, out, candidate, baseline, context, settle } = require('./common.cjs')
const CASES = [['guest', { authed: false }, ['/', '/specialists', '/faq', '/login', '/s/olena']], ['specialist', { roles: ['SPECIALIST'] }, ['/', '/specialists', '/faq', '/s/olena', '/cabinet']], ['client', { roles: ['CLIENT'] }, ['/', '/specialists', '/faq', '/s/olena']]]
;(async () => {
  const browser = await chromium.launch()
  const pairs = []
  for (const width of [375, 768, 1280, 1440]) for (const [who, opts, routes] of CASES) for (const route of routes) {
    const files = {}
    for (const [label, base] of [['baseline', baseline], ['control', baseline], ['candidate', candidate]]) {
      const { c, p } = await context(browser, width, { ...opts, motion: 'reduce', fixedTime: true })
      await p.goto(`${base}${route}?ui=v1`); await settle(p, 1500)
      await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' })
      await p.evaluate(() => { document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')); window.scrollTo(0, 0) })
      await p.waitForTimeout(400)
      files[label] = path.join(out, 'parity', `${label}-${who}-${width}${route === '/' ? '-home' : route.replace(/\//g, '-')}.png`)
      await p.screenshot({ path: files[label], fullPage: true })
      await c.close()
    }
    pairs.push({ width, who, route, ...files })
  }
  fs.writeFileSync(path.join(out, 'parity', 'pairs.json'), JSON.stringify(pairs, null, 2) + '\n')
  console.log('pairs', pairs.length)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
