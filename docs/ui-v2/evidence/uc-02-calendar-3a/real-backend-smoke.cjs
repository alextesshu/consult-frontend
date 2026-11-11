// Real-backend smoke (UC-02 corrections): the calendar against an unmodified origin/dev backend on loopback
// with a disposable local database seeded relative to "today" (25.10.2026, Sunday, the DST day).
// Credentials are generated locally per run and read from UC02_SMOKE_CRED; never printed or committed.
// Records request methods to prove the calendar only reads.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')

const app = 'http://127.0.0.1:5409'
const cred = JSON.parse(fs.readFileSync(process.env.UC02_SMOKE_CRED, 'utf8'))
const shots = path.join(__dirname, 'screenshots')

;(async () => {
  const browser = await chromium.launch()
  const problems = []
  const fail = (message) => problems.push(message)
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Europe/Kyiv', locale: 'uk-UA' })
  await c.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })))
  const p = await c.newPage()
  const requests = []
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  p.on('request', (req) => {
    const url = new URL(req.url())
    if (url.port === '8403' && url.pathname.startsWith('/api/')) requests.push(`${req.method()} ${url.pathname}${url.search.includes('upcoming') ? '?upcoming' : ''}`)
  })

  await p.goto(`${app}/login?ui=v2`)
  await p.locator('input[name="identifier"]').fill(cred.username)
  await p.locator('input[name="password"]').fill(cred.password)
  await p.getByRole('button', { name: 'Увійти', exact: true }).click()
  await p.waitForURL((url) => !url.pathname.startsWith('/login'))
  const loginRequests = requests.length

  const grid = () => p.evaluate(() => {
    const scroll = document.querySelector('.pc2-cal-grid__scroll')
    return {
      week: document.querySelector('.pc2-cal__title, .pc2-cal__navrow h2')?.textContent?.trim(),
      range: document.querySelector('.pc2-cal-grid__range span')?.textContent?.trim(),
      bodyHeight: Math.round(document.querySelector('.pc2-cal-grid__body').getBoundingClientRect().height),
      innerScroll: scroll.scrollHeight > scroll.clientHeight + 1,
      events: [...document.querySelectorAll('.pc2-cal-grid .pc2-cal-event')].map((el) => el.getAttribute('aria-label')),
      windows: [...document.querySelectorAll('.pc2-cal-window')].map((el) => el.getAttribute('aria-label')),
      empty: [...document.querySelectorAll('.pc2-cal-grid__col')].map((el) => `${el.getAttribute('aria-label')?.split(':')[0]} → ${el.querySelector('.pc2-cal-grid__empty')?.textContent?.trim() ?? '—'}`),
      card: document.querySelector('.pc2-cal-next')?.textContent?.replace(/\s+/g, ' ').trim(),
      badge: document.querySelector('.pc2-cal__badge')?.textContent?.trim() ?? null,
    }
  })
  const settle = async (selector) => { await p.waitForSelector(selector); await p.waitForLoadState('networkidle') }

  // Current week (19–25 Oct): only a completed session on Friday → a 1-hour real range.
  await p.goto(`${app}/cabinet/sessions?ui=v2`)
  await settle('.pc2-cal-grid')
  await p.waitForSelector('.pc2-cal-next:not(.is-loading)')
  const workday = await grid()
  await p.screenshot({ path: path.join(shots, 'real-backend-1440-workday-sparse.png') })
  // Real mouse wheel over the fitting timeline must scroll the page, not the timeline.
  await p.evaluate(() => window.scrollTo(0, 0))
  const box = await p.locator('.pc2-cal-grid__scroll').boundingBox()
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await p.mouse.wheel(0, 240)
  await p.waitForTimeout(450)
  const wheel = await p.evaluate(() => ({ pageY: window.scrollY, timelineTop: document.querySelector('.pc2-cal-grid__scroll').scrollTop }))
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.getByRole('tab', { name: 'Доступність' }).click()
  const availability = await grid()
  await p.screenshot({ path: path.join(shots, 'real-backend-1440-availability-empty.png') })
  // Next week (26 Oct–1 Nov): confirmed session without a link, three adjacent slots, a confirmation, an absence.
  await p.getByRole('button', { name: 'Наступний тиждень' }).click()
  await settle('.pc2-cal-grid')
  const nextAvailability = await grid()
  await p.getByRole('tab', { name: 'Робочий день' }).click()
  const nextWorkday = await grid()
  await p.screenshot({ path: path.join(shots, 'real-backend-1440-next-week.png') })

  const calendarRequests = requests.slice(loginRequests)
  const writes = calendarRequests.filter((line) => !line.startsWith('GET ') && !line.includes('/auth/token/refresh/'))
  if (writes.length) fail(`writes ${writes}`)
  if (errors.length) fail(`page errors ${errors}`)
  if (workday.bodyHeight < 300 || workday.bodyHeight > 420 || workday.innerScroll) fail(`sparse grid ${workday.bodyHeight} scroll ${workday.innerScroll}`)
  if (wheel.pageY <= 0 || wheel.timelineTop !== 0) fail(`wheel over timeline ${JSON.stringify(wheel)}`)
  if (!/поза вибраним тижнем/.test(workday.card || '')) fail(`card scope ${workday.card}`)
  if (!availability.empty.some((line) => line.startsWith('П’ятниця') && line.endsWith('Немає вільних слотів · є зайняті події'))) fail(`Friday label ${availability.empty}`)
  if (!nextAvailability.windows.some((label) => /3 слоти/.test(label))) fail(`windows ${nextAvailability.windows}`)

  const result = { problems, loginRequests, calendarRequests, writes, errors, wheel, workday, availability, nextAvailability, nextWorkday }
  fs.writeFileSync(path.join(__dirname, 'real-backend-smoke.json'), JSON.stringify(result, null, 2) + '\n')
  console.log('problems', problems.length)
  for (const problem of problems) console.log(' -', problem)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
