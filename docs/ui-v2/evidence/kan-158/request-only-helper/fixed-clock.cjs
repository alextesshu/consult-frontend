// Targeted re-check of the only non-text pixel difference (direct, v2, 1280): both builds with the
// same fixed Playwright clock, two captures each. Writes fixed-clock.json.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')
const NOW = new Date('2026-10-26T10:00:00+02:00')
;(async () => {
  const browser = await chromium.launch()
  const files = []
  for (const [build, base] of [['baseline', 'http://127.0.0.1:5406'], ['candidate', 'http://127.0.0.1:5411']]) for (const run of [1, 2]) {
    const c = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'uk-UA', timezoneId: 'Europe/Kyiv', reducedMotion: 'reduce' })
    await c.clock.setFixedTime(NOW)
    await c.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })))
    await c.route('**/*', (r) => (['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort()))
    const p = await c.newPage()
    await p.goto(`${base}/s/seed-therapist-1?ui=v2`)
    await p.locator('h1').first().waitFor()
    await p.waitForLoadState('networkidle')
    await p.evaluate(() => document.fonts.ready)
    await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' })
    await p.mouse.move(2, 2)
    await p.waitForTimeout(800)
    const file = path.join(__dirname, 'screenshots', `fixed-${build}-${run}.png`)
    await p.screenshot({ path: file })
    files.push(file)
    await c.close()
    await new Promise((resolve) => setTimeout(resolve, 15000))
  }
  fs.writeFileSync(path.join(__dirname, 'fixed-clock.json'), JSON.stringify({ now: NOW.toISOString(), files: files.map((f) => path.basename(f)) }, null, 2) + '\n')
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
