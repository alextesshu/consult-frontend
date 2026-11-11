// Chromium acceptance for /cabinet/sessions?ui=v2 (UC-01 read-only calendar) across widths, views and panels,
// plus the UI v1 entry check. Writes acceptance.json and screenshots/.
const { chromium, fs, path, out, candidate, WIDTHS, open, ready, warm, overflow } = require('./common.cjs')
const shots = path.join(out, 'screenshots')
fs.mkdirSync(shots, { recursive: true })

;(async () => {
  const browser = await chromium.launch()
  await warm(browser, ['/cabinet/sessions?ui=v2', '/cabinet/sessions?ui=v1'])
  const rows = []
  const problems = []
  const fail = (msg) => problems.push(msg)

  for (const width of WIDTHS) {
    const mobile = width < 768
    const { c, p, errors, writes } = await open(browser, width)
    await p.goto(`${candidate}/cabinet/sessions?ui=v2`)
    await ready(p, '.pc2-cal__title')
    await p.waitForSelector(mobile ? '.pc2-cal-agenda, .pc2-cal__state' : '.pc2-cal-grid')
    const info = await p.evaluate(() => ({
      title: document.querySelector('.pc2-cal__title')?.textContent?.trim(),
      views: [...document.querySelectorAll('.pc2-cal__views button')].map((b) => `${b.textContent.trim()}${b.getAttribute('aria-pressed') === 'true' ? '*' : ''}`),
      grid: Boolean(document.querySelector('.pc2-cal-grid')),
      events: document.querySelectorAll('.pc2-cal-event').length,
      strip: document.querySelectorAll('.pc2-cal__strip-day').length,
      smallTargets: [...document.querySelectorAll('.pc2-cal button, .pc2-cal a')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('.pc2-cal-grid') && (r.height < 44 || r.width < 44) })
        .map((el) => `${el.textContent.trim().slice(0, 24) || el.getAttribute('aria-label')} ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`),
    }))
    const of = await overflow(p)
    await p.screenshot({ path: path.join(shots, `v2-${width}-${mobile ? 'day' : 'week'}.png`), fullPage: true })
    const row = { width, ...info, overflow: of, errors: [...errors] }
    if (!of.ok) fail(`${width}: horizontal overflow ${of.scrollWidth}`)
    if (errors.length) fail(`${width}: page errors ${errors.join(' | ')}`)
    if (mobile && (info.grid || info.strip !== 7 || info.views.some((v) => v.startsWith('Тиждень')))) fail(`${width}: mobile layout ${JSON.stringify(info)}`)
    if (!mobile && (!info.grid || !info.views.includes('Тиждень*'))) fail(`${width}: desktop week missing ${JSON.stringify(info.views)}`)
    if (mobile && info.smallTargets.length) fail(`${width}: touch targets < 44px ${info.smallTargets.join('; ')}`)
    if (info.events === 0) fail(`${width}: no events rendered`)

    // Views and panels at representative widths.
    if (width === 1440 || width === 375) {
      if (width === 1440) {
        await p.getByRole('button', { name: 'День', exact: true }).click()
        await p.getByRole('button', { name: 'Наступний день', exact: true }).click()
        await p.screenshot({ path: path.join(shots, `v2-1440-day.png`) })
        await p.getByRole('button', { name: 'Список', exact: true }).click()
        await p.screenshot({ path: path.join(shots, `v2-1440-list.png`), fullPage: true })
        await p.getByRole('button', { name: 'Потребує дії', exact: true }).click()
        await p.screenshot({ path: path.join(shots, `v2-1440-needs-action.png`), fullPage: true })
        await p.getByRole('button', { name: 'Усе', exact: true }).click()
        await p.getByRole('button', { name: 'Тиждень', exact: true }).click()
        await p.getByRole('button', { name: /Вільне вікно/ }).first().click()
        await p.screenshot({ path: path.join(shots, `v2-1440-details.png`) })
        await p.keyboard.press('Escape')
      } else {
        await p.getByRole('group', { name: 'Дні тижня' }).getByRole('button', { name: /П’ятниця, 23 жовтня/ }).click()
        await p.screenshot({ path: path.join(shots, `v2-375-day-friday.png`), fullPage: true })
        await p.getByRole('button', { name: 'Список', exact: true }).click()
        await p.screenshot({ path: path.join(shots, `v2-375-list.png`), fullPage: true })
      }
      await p.getByRole('button', { name: 'Шари', exact: true }).click()
      await p.getByRole('checkbox', { name: 'Заявки на час', exact: true }).click()
      await p.getByRole('checkbox', { name: 'Зовнішні гостьові сесії', exact: true }).click()
      await p.screenshot({ path: path.join(shots, `v2-${width}-layers.png`) })
      await p.keyboard.press('Escape')
      const hidden = await p.locator('.pc2-cal__hidden').textContent()
      row.hiddenBanner = hidden?.replace(/\s+/g, ' ').trim()
      if (!/Заявки на час — 1, потребують дії: 1/.test(row.hiddenBanner || '')) fail(`${width}: hidden banner ${row.hiddenBanner}`)
      await p.screenshot({ path: path.join(shots, `v2-${width}-hidden-banner.png`) })
      const of2 = await overflow(p)
      if (!of2.ok) fail(`${width}: overflow after interactions ${of2.scrollWidth}`)
    }
    row.writes = [...writes]
    if (writes.length) fail(`${width}: non-GET API requests ${writes.join(', ')}`)
    rows.push(row)
    await c.close()
  }

  // UI v1 keeps the existing sessions page.
  {
    const { c, p, errors, writes } = await open(browser, 1280)
    await p.goto(`${candidate}/cabinet/sessions?ui=v1`)
    await ready(p, 'main h1')
    const v1 = await p.evaluate(() => ({ h1: document.querySelector('main h1')?.textContent?.trim(), calendar: Boolean(document.querySelector('.pc2-cal')) }))
    if (v1.h1 !== 'Сесії' || v1.calendar) fail(`v1 sessions page changed ${JSON.stringify(v1)}`)
    rows.push({ v1, errors, writes })
    await c.close()
  }
  // Session links reach the existing detail route.
  {
    const { c, p } = await open(browser, 1440)
    await p.goto(`${candidate}/cabinet/sessions?ui=v2`)
    await ready(p, '.pc2-cal-grid')
    await p.getByRole('link', { name: /Андрій Савчук/ }).click()
    await p.waitForURL('**/cabinet/sessions/6')
    rows.push({ deepLink: new URL(p.url()).pathname })
    await c.close()
  }

  fs.writeFileSync(path.join(out, 'acceptance.json'), JSON.stringify({ problems, rows }, null, 2) + '\n')
  console.log('rows', rows.length, 'problems', problems.length)
  for (const problem of problems) console.log(' -', problem)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
