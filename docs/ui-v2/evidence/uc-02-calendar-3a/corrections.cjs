// Visual corrections (review round 1): week-grid height for 1 / 5 / 12-hour and full-day ranges, empty-day
// labels, the next-action scope and the phone «Вигляд» sheet. Browser fixtures only. Writes corrections.json
// and screenshots/corr-*.png.
const { chromium, fs, path, out, candidate, open, ready, overflow } = require('./common.cjs')
const shots = path.join(out, 'screenshots')
fs.mkdirSync(shots, { recursive: true })

// Friday 23 Oct (EEST, UTC+3) wall-clock hour → ISO.
const fri = (hour) => new Date(Date.UTC(2026, 9, 23, hour - 3)).toISOString()
const session = (id, start, name) => ({
  id, status: 'CONFIRMED', slot_start_at: start, slot_end_at: new Date(Date.parse(start) + 50 * 60000).toISOString(),
  client_display_name: name, client_has_account: true, has_note: null, session_format: 'online', meeting_link_ready: true,
})
const RANGES = {
  '1h': [session(91, fri(10), 'Одна Година')],
  '5h': [session(91, fri(9), 'Ранкова'), session(92, fri(13), 'Обідня')],
  '12h': [session(91, fri(7), 'Рання'), session(92, fri(18), 'Вечірня')],
}

async function onlySessions(c, rows) {
  await c.route('**/api/booking/sessions/**', (r) => r.fulfill({ json: new URL(r.request().url()).searchParams.get('upcoming') === 'true' ? [] : rows }))
  await c.route('**/api/cabinet/schedule/**', (r) => r.fulfill({ json: { events: [] } }))
  await c.route('**/api/cabinet/availability-exceptions/**', (r) => r.fulfill({ json: [] }))
  await c.route('**/api/cabinet/external-sessions/**', (r) => r.fulfill({ json: [] }))
  await c.route('**/api/cabinet/guest-booking-requests/**', (r) => r.fulfill({ json: [] }))
  await c.route('**/api/cabinet/sessions/reschedule-requests/**', (r) => r.fulfill({ json: [] }))
}

const gridInfo = (p) => p.evaluate(() => {
  const scroll = document.querySelector('.pc2-cal-grid__scroll')
  const body = document.querySelector('.pc2-cal-grid__body')
  return {
    range: document.querySelector('.pc2-cal-grid__range span')?.textContent?.trim(),
    bodyHeight: Math.round(body.getBoundingClientRect().height),
    scrollBox: Math.round(scroll.clientHeight),
    innerScroll: scroll.scrollHeight > scroll.clientHeight + 1,
    hourLabels: [...document.querySelectorAll('.pc2-cal-grid__hours span')].map((el) => el.textContent.trim()),
    halfLines: document.querySelectorAll('.pc2-cal-grid__line.is-half').length > 0,
    events: [...document.querySelectorAll('.pc2-cal-grid .pc2-cal-event')].map((el) => el.getAttribute('aria-label')),
  }
})

;(async () => {
  const browser = await chromium.launch()
  const rows = []
  const problems = []
  const fail = (message) => problems.push(message)
  const writesAll = []

  // P1 grid height: 1 / 5 / 12 hours and the full day at desktop and tablet widths.
  for (const width of [1440, 1280, 768]) for (const [name, sessions] of Object.entries(RANGES)) {
    const { c, p, errors, writes } = await open(browser, width)
    await onlySessions(c, sessions)
    await p.goto(`${candidate}/cabinet/sessions?ui=v2`)
    await ready(p, '.pc2-cal-grid')
    const info = await gridInfo(p)
    if (width === 1440) await p.locator('.pc2-cal-grid').screenshot({ path: path.join(shots, `corr-${width}-grid-${name}.png`) })
    let full = null
    if (name === '1h') {
      await p.getByRole('button', { name: 'Показати всю добу' }).click()
      full = await gridInfo(p)
      if (width === 1440) await p.locator('.pc2-cal-grid').screenshot({ path: path.join(shots, `corr-${width}-grid-fullday.png`) })
    }
    rows.push({ check: 'grid-height', width, range: name, ...info, full, errors: [...errors], overflow: await overflow(p) })
    writesAll.push(...writes)
    const id = `${width} ${name}`
    if (info.bodyHeight < 360) fail(`${id}: grid body only ${info.bodyHeight}px`)
    if (sessions.some((row) => !info.events.some((label) => label?.includes(row.client_display_name)))) fail(`${id}: an event is missing`)
    if (name === '12h' && !info.range.startsWith('Показано 07:00–19:00')) fail(`${id}: range ${info.range}`)
    if (name !== '12h' && info.innerScroll) fail(`${id}: short range still scrolls inside`)
    if (full && (!full.innerScroll || full.hourLabels.length !== 25)) fail(`${id}: full day ${JSON.stringify(full.hourLabels.length)}`)
    if (errors.length) fail(`${id}: page errors ${errors}`)
    await c.close()
  }

  // P1 empty labels in «Доступність» (desktop columns) and on a phone day.
  {
    const { c, p, writes } = await open(browser, 1440)
    await p.goto(`${candidate}/cabinet/sessions?ui=v2&mode=availability`)
    await ready(p, '.pc2-cal-grid')
    const days = await p.evaluate(() => [...document.querySelectorAll('.pc2-cal-grid__col')].map((el) => ({
      day: el.getAttribute('aria-label')?.split(':')[0], empty: el.querySelector('.pc2-cal-grid__empty')?.textContent?.trim() ?? null,
    })))
    await p.screenshot({ path: path.join(shots, 'corr-1440-availability-empty-labels.png') })
    rows.push({ check: 'empty-labels', width: 1440, days })
    writesAll.push(...writes)
    const label = (prefix) => days.find((day) => day.day?.startsWith(prefix))?.empty
    // Wed 21: completed session (hidden «Минулі сесії») and no slots. Mon 19: only a cancelled session.
    if (label('Середа') !== 'Немає вільних слотів · є зайняті події') fail(`Wed label ${label('Середа')}`)
    if (label('Понеділок') !== 'Порожній день') fail(`Mon label ${label('Понеділок')}`)
    if (label('П’ятниця') !== null) fail(`Fri label ${label('П’ятниця')}`)
    await c.close()
  }

  // P2 next-action card: scope wording, other week, compact on phones without truncation.
  for (const width of [1440, 768, 390, 375]) {
    const { c, p, writes } = await open(browser, width)
    await p.goto(`${candidate}/cabinet/sessions?ui=v2`)
    await ready(p, '.pc2-cal-next')
    const read = () => p.evaluate(() => {
      const card = document.querySelector('.pc2-cal-next')
      const who = card.querySelector('.pc2-cal-next__who')
      const btn = card.querySelector('.pc2-cal-next__btn')
      return {
        meta: card.querySelector('.pc2-cal-next__meta')?.textContent?.replace(/\s+/g, ' ').trim(),
        who: who?.textContent?.trim(), truncated: who ? who.scrollWidth > who.clientWidth + 1 : null,
        height: Math.round(card.getBoundingClientRect().height),
        button: btn ? `${Math.round(btn.getBoundingClientRect().width)}x${Math.round(btn.getBoundingClientRect().height)}` : null,
      }
    })
    const current = await read()
    await p.screenshot({ path: path.join(shots, `corr-${width}-next-action.png`), clip: { x: 0, y: 0, width, height: Math.min(560, width < 768 ? 420 : 320) } })
    await p.getByRole('button', { name: 'Наступний тиждень' }).first().click()
    const nextWeek = await read()
    rows.push({ check: 'next-action', width, current, nextWeek })
    writesAll.push(...writes)
    if (!/^Найближча з усіх дій · /.test(current.meta) || /поза вибраним/.test(current.meta)) fail(`${width}: card meta ${current.meta}`)
    if (!/поза вибраним тижнем$/.test(nextWeek.meta)) fail(`${width}: other week meta ${nextWeek.meta}`)
    if (current.truncated) fail(`${width}: name truncated`)
    if (width < 768 && Number(current.button.split('x')[1]) < 44) fail(`${width}: card button ${current.button}`)
    await c.close()
  }

  // P2 phone sheet: short viewport, header and close visible, scrolling only inside, Esc and close return focus.
  for (const [width, height] of [[375, 600], [390, 844]]) {
    const { c, p, errors, writes } = await open(browser, width, { height })
    await p.goto(`${candidate}/cabinet/sessions?ui=v2`)
    await ready(p, '.pc2-cal__modes')
    const trigger = p.getByRole('button', { name: 'Вигляд календаря' })
    await trigger.click()
    await p.locator('.pc2-cal-view__legend summary').click()
    const before = await p.evaluate(() => window.scrollY)
    await p.mouse.move(width / 2, height - 80)
    await p.mouse.wheel(0, 600)
    await p.waitForTimeout(300)
    const sheet = await p.evaluate(() => {
      const panel = document.querySelector('.pc2-cal-view')
      const body = panel.querySelector('.pc2-cal-view__body')
      const head = panel.querySelector('.pc2-cal-view__head').getBoundingClientRect()
      const close = panel.querySelector('.pc2-cal-view__close').getBoundingClientRect()
      return {
        headTop: Math.round(head.top), headVisible: head.top >= 0 && head.bottom <= window.innerHeight,
        close: `${Math.round(close.width)}x${Math.round(close.height)}`, closeVisible: close.top >= 0 && close.right <= window.innerWidth,
        bodyScrolls: body.scrollHeight > body.clientHeight, bodyScrollTop: Math.round(body.scrollTop), pageScrollY: window.scrollY,
        rootOverflow: document.documentElement.style.overflow, panelWidth: Math.round(panel.getBoundingClientRect().width),
      }
    })
    const of = await overflow(p)
    await p.screenshot({ path: path.join(shots, `corr-${width}x${height}-view-sheet.png`) })
    await p.keyboard.press('Escape')
    const afterEsc = await p.evaluate(() => ({ focus: document.activeElement?.getAttribute('aria-label'), rootOverflow: document.documentElement.style.overflow }))
    await trigger.click()
    await p.getByRole('button', { name: 'Закрити вигляд' }).click()
    const afterClose = await p.evaluate(() => ({ open: Boolean(document.querySelector('.pc2-cal-view')), focus: document.activeElement?.getAttribute('aria-label') }))
    rows.push({ check: 'view-sheet', width, height, sheet, pageScrollBefore: before, overflow: of, afterEsc, afterClose, errors: [...errors] })
    writesAll.push(...writes)
    const id = `${width}x${height} sheet`
    if (!sheet.headVisible || !sheet.closeVisible) fail(`${id}: header/close not visible`)
    if (sheet.close !== '44x44') fail(`${id}: close ${sheet.close}`)
    if (height === 600 && (!sheet.bodyScrolls || sheet.bodyScrollTop === 0)) fail(`${id}: sheet body did not scroll`)
    if (sheet.pageScrollY !== before) fail(`${id}: page scrolled behind the sheet`)
    if (sheet.rootOverflow !== 'hidden' || afterEsc.rootOverflow !== '') fail(`${id}: page scroll lock ${sheet.rootOverflow}/${afterEsc.rootOverflow}`)
    if (afterEsc.focus !== 'Вигляд календаря' || afterClose.focus !== 'Вигляд календаря' || afterClose.open) fail(`${id}: focus return ${JSON.stringify([afterEsc, afterClose])}`)
    if (!of.ok) fail(`${id}: horizontal overflow ${of.scrollWidth}`)
    if (errors.length) fail(`${id}: page errors ${errors}`)
    await c.close()
  }

  if (writesAll.length) fail(`non-GET requests ${writesAll.join(', ')}`)
  fs.writeFileSync(path.join(out, 'corrections.json'), JSON.stringify({ problems, rows }, null, 2) + '\n')
  console.log('rows', rows.length, 'problems', problems.length)
  for (const problem of problems) console.log(' -', problem)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
