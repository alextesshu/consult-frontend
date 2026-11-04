// Real-backend smoke (UC-01): the calendar against an unmodified origin/dev backend on loopback with a
// disposable local database. Credentials are generated locally per run and read from UC01_SMOKE_CRED;
// they are never printed or committed. Records request methods to prove the calendar only reads.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')

const app = 'http://127.0.0.1:5407'
const cred = JSON.parse(fs.readFileSync(process.env.UC01_SMOKE_CRED, 'utf8'))

;(async () => {
  const browser = await chromium.launch()
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Europe/Kyiv', locale: 'uk-UA' })
  await c.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })))
  const p = await c.newPage()
  const requests = []
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  p.on('request', (req) => {
    const url = new URL(req.url())
    if (url.port === '8402' && url.pathname.startsWith('/api/')) requests.push(`${req.method()} ${url.pathname}`)
  })

  await p.goto(`${app}/login?ui=v2`)
  await p.locator('input[name="identifier"]').fill(cred.username)
  await p.locator('input[name="password"]').fill(cred.password)
  await p.getByRole('button', { name: 'Увійти', exact: true }).click()
  await p.waitForURL((url) => !url.pathname.startsWith('/login'))
  const loginRequests = requests.length

  await p.goto(`${app}/cabinet/sessions?ui=v2`)
  await p.waitForSelector('.pc2-cal-grid')
  await p.waitForLoadState('networkidle')
  const result = await p.evaluate(() => ({
    title: document.querySelector('.pc2-cal__title')?.textContent?.trim(),
    events: [...document.querySelectorAll('.pc2-cal-event')].map((el) => el.getAttribute('aria-label')),
    sessionLinks: [...document.querySelectorAll('a.pc2-cal-event')].map((el) => el.getAttribute('href')),
    hidden: document.querySelector('.pc2-cal__hidden')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    warning: document.querySelector('.pc2-cal__warning')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    error: document.querySelector('.pc2-cal__state[role="alert"]')?.textContent?.trim() ?? null,
  }))
  await p.getByRole('button', { name: 'Шари', exact: true }).click()
  await p.getByRole('checkbox', { name: 'Зовнішні гостьові сесії', exact: true }).click()
  await p.keyboard.press('Escape')
  const externalShown = await p.locator('.pc2-cal-event--external_guest_session').count()
  const conflicts = await p.locator('.pc2-cal-event.has-conflict').count()
  await p.screenshot({ path: path.join(__dirname, 'screenshots', 'real-backend-1440-week.png'), fullPage: true })

  const calendarRequests = requests.slice(loginRequests)
  const writes = calendarRequests.filter((line) => !line.startsWith('GET ') && !line.includes('/auth/'))
  const summary = { result, externalShown, conflicts, calendarRequests, writes, errors }
  fs.writeFileSync(path.join(__dirname, 'real-backend-smoke.json'), JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify(summary, null, 2))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
