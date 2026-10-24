// UI v1 full-page pixel parity against origin/dev: baseline, a second baseline capture (noise control) and candidate.
// Servers are warmed first and every capture waits for real readiness (common.cjs ready), never a fixed delay alone.
const { chromium, fs, path, out, candidate, baseline, open, ready, warm, slug } = require('./common.cjs')
const ROUTES = {
  guest: ['/', '/for-clients', '/specialists', '/faq', '/s/olena', '/s/olena/journal'],
  specialist: ['/', '/specialists', '/s/olena', '/s/olena/journal', '/cabinet'],
  client: ['/', '/specialists', '/s/olena', '/s/olena/journal'],
}
;(async () => {
  const browser = await chromium.launch()
  await warm(browser, [...new Set(Object.values(ROUTES).flat())])
  const dir = path.join(out, 'v1-parity')
  fs.mkdirSync(dir, { recursive: true })
  const pairs = []
  for (const width of [375, 768, 1280, 1440]) for (const [role, routes] of Object.entries(ROUTES)) for (const route of routes) {
    const row = { width, role, route }
    for (const [label, base] of [['baseline', baseline], ['control', baseline], ['candidate', candidate]]) {
      const { c, p } = await open(browser, width, { role })
      await p.goto(`${base}${route}?ui=v1`)
      row[`${label}State`] = await ready(p, route)
      row[label] = path.join('v1-parity', `${label}-${role}-${width}-${slug(route)}.png`)
      await p.screenshot({ path: path.join(out, row[label]), fullPage: true })
      await c.close()
    }
    pairs.push(row)
  }
  fs.writeFileSync(path.join(dir, 'pairs.json'), JSON.stringify(pairs, null, 2) + '\n')
  console.log('pairs', pairs.length)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
