// Unchanged pages: UI v1 /cabinet/sessions, /cabinet, /cabinet/slots and UI v2 /cabinet, /cabinet/slots against
// origin/dev 3085c1c, with a second baseline capture as noise control. Compared by compare.py.
const { chromium, fs, path, out, candidate, baseline, open, ready, warm } = require('./common.cjs')
const CASES = [
  ['v1', '/cabinet/sessions'], ['v1', '/cabinet'], ['v1', '/cabinet/slots'],
  ['v2', '/cabinet'], ['v2', '/cabinet/slots'],
]
;(async () => {
  const browser = await chromium.launch()
  await warm(browser, CASES.map(([ui, route]) => `${route}?ui=${ui}`))
  const dir = path.join(out, 'parity')
  fs.mkdirSync(dir, { recursive: true })
  const pairs = []
  for (const width of [375, 1280]) for (const [ui, route] of CASES) {
    const row = { width, ui, route }
    for (const [label, base] of [['baseline', baseline], ['control', baseline], ['candidate', candidate]]) {
      const { c, p } = await open(browser, width)
      await p.goto(`${base}${route}?ui=${ui}`)
      await ready(p)
      row[label] = path.join('parity', `${label}-${ui}-${width}${route.replace(/\//g, '-')}.png`)
      await p.screenshot({ path: path.join(out, row[label]), fullPage: true })
      await c.close()
    }
    pairs.push(row)
  }
  fs.writeFileSync(path.join(dir, 'pairs.json'), JSON.stringify(pairs, null, 2) + '\n')
  console.log('pairs', pairs.length)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
