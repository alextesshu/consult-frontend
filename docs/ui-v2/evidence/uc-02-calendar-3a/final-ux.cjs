// Final UX acceptance: proportional grid scale for sparse/dense weeks and real mouse-wheel / touch scroll
// propagation (window.scrollY vs timeline scrollTop). Browser fixtures only.
// Usage: node final-ux.cjs [label] [baseUrl]  →  final-ux-<label>.json (+ screenshots/final-* for "after").
const { chromium, fs, path, out, candidate, open, ready, overflow } = require('./common.cjs')
const label = process.argv[2] || 'after'
const base = process.argv[3] || candidate
const shots = path.join(out, 'screenshots')
const snap = label === 'after'

// Friday 23 Oct (EEST, UTC+3) wall-clock time → ISO.
const fri = (hour, minute = 0) => new Date(Date.UTC(2026, 9, 23, hour - 3, minute)).toISOString()
const session = (id, start, name, minutes = 50) => ({
  id, status: 'CONFIRMED', slot_start_at: start, slot_end_at: new Date(Date.parse(start) + minutes * 60000).toISOString(),
  client_display_name: name, client_has_account: true, has_note: null, session_format: 'online', meeting_link_ready: true,
})
const SCENARIOS = {
  empty: [],
  one50: [session(91, fri(10), 'Одна Сесія')],
  twoApart: [session(91, fri(9), 'Ранкова'), session(92, fri(15), 'Пообідня')],
  five: [session(91, fri(9), 'Ранкова'), session(92, fri(13), 'Обідня')],
  twelve: [session(91, fri(7), 'Рання'), session(92, fri(18), 'Вечірня')],
  earlyLate: [session(91, fri(6), 'Світанок'), session(92, fri(21), 'Пізня')],
  overlap: [session(91, fri(10), 'Перша'), session(92, fri(10, 30), 'Друга'), session(93, fri(11), 'Третя')],
}

const freeSlot = (id, start) => ({
  type: 'available_slot', id: `slot-${id}`, slot_id: id, session_id: null, start_at: start,
  end_at: new Date(Date.parse(start) + 50 * 60000).toISOString(), status: 'available', title: 'Вільний час', client_display_name: null, client_kind: null,
})
// Sparse «Доступність»: one session and a 14:00–15:50 window (two adjacent slots).
const SPARSE_SLOTS = [freeSlot(301, fri(14)), freeSlot(302, fri(15))]

async function onlySessions(c, rows, events = []) {
  await c.route('**/api/booking/sessions/**', (r) => r.fulfill({ json: new URL(r.request().url()).searchParams.get('upcoming') === 'true' ? [] : rows }))
  for (const route of ['cabinet/availability-exceptions', 'cabinet/external-sessions', 'cabinet/guest-booking-requests', 'cabinet/sessions/reschedule-requests']) {
    await c.route(`**/api/${route}/**`, (r) => r.fulfill({ json: [] }))
  }
  await c.route('**/api/cabinet/schedule/**', (r) => r.fulfill({ json: { events } }))
}

const gridInfo = (p) => p.evaluate(() => {
  const scroll = document.querySelector('.pc2-cal-grid__scroll')
  const body = document.querySelector('.pc2-cal-grid__body')
  const hours = [...document.querySelectorAll('.pc2-cal-grid__hours span')].map((el) => el.textContent.trim())
  const bodyHeight = body.getBoundingClientRect().height
  return {
    range: document.querySelector('.pc2-cal-grid__range span')?.textContent?.trim(),
    hours: hours.length - 1,
    hourPx: Math.round((bodyHeight / Math.max(1, hours.length - 1)) * 10) / 10,
    bodyHeight: Math.round(bodyHeight),
    scrollBox: Math.round(scroll.clientHeight),
    innerScroll: scroll.scrollHeight > scroll.clientHeight + 1,
    halfLines: document.querySelectorAll('.pc2-cal-grid__line.is-half').length,
    events: [...document.querySelectorAll('.pc2-cal-grid__col .pc2-cal-grid__slot')].map((el) => {
      const r = el.getBoundingClientRect()
      return { label: el.querySelector('.pc2-cal-event')?.getAttribute('aria-label'), top: Math.round(r.top - body.getBoundingClientRect().top), height: Math.round(r.height), width: Math.round(r.width), left: Math.round(r.left) }
    }),
  }
})

// One real wheel gesture at (x, y); returns window/timeline scroll deltas.
async function wheel(p, x, y, dy) {
  const before = await p.evaluate(() => ({ y: window.scrollY, top: document.querySelector('.pc2-cal-grid__scroll').scrollTop }))
  await p.mouse.move(x, y)
  await p.mouse.wheel(0, dy)
  await p.waitForTimeout(450)
  const after = await p.evaluate(() => ({ y: window.scrollY, top: document.querySelector('.pc2-cal-grid__scroll').scrollTop }))
  return { pageDelta: Math.round(after.y - before.y), timelineDelta: Math.round(after.top - before.top), before, after }
}

// Points over the timeline: an empty cell, a session, an availability window, near the top and the bottom edge.
const targets = (p) => p.evaluate(() => {
  const box = document.querySelector('.pc2-cal-grid__scroll').getBoundingClientRect()
  const center = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: Math.min(Math.max(r.top + r.height / 2, box.top + 12), box.bottom - 12) } }
  const emptyCol = [...document.querySelectorAll('.pc2-cal-grid__col')].find((col) => !col.querySelector('.pc2-cal-grid__slot'))
  const firstCol = document.querySelector('.pc2-cal-grid__col').getBoundingClientRect()
  return {
    emptyCell: emptyCol ? { x: emptyCol.getBoundingClientRect().left + 30, y: box.top + box.height / 2 } : null,
    session: center([...document.querySelectorAll('.pc2-cal-grid__col .pc2-cal-event')].find((el) => { const r = el.getBoundingClientRect(); return r.top > box.top && r.bottom < box.bottom })),
    window: center([...document.querySelectorAll('.pc2-cal-grid__col .pc2-cal-window')].find((el) => { const r = el.getBoundingClientRect(); return r.top > box.top && r.bottom < box.bottom })),
    nearTop: { x: firstCol.left + 20, y: box.top + 8 },
    nearBottom: { x: firstCol.left + 20, y: box.bottom - 8 },
  }
})

;(async () => {
  const browser = await chromium.launch()
  const result = { label, base, grid: [], wheel: [], touch: [], keyboard: [], writes: [], errors: [] }

  // 1. Grid scale per scenario (1440 and 1280; plus 768 for the sparse cases).
  for (const width of [1440, 1280, 768]) for (const [name, rows] of Object.entries(SCENARIOS)) {
    if (width === 768 && !['empty', 'one50', 'overlap'].includes(name)) continue
    const { c, p, errors, writes } = await open(browser, width)
    await onlySessions(c, rows)
    await p.goto(`${base}/cabinet/sessions?ui=v2`)
    await ready(p, '.pc2-cal-grid')
    const info = await gridInfo(p)
    if (snap && width === 1440) await p.locator('.pc2-cal-grid').screenshot({ path: path.join(shots, `final-1440-grid-${name}.png`) })
    let fullDay = null
    if (name === 'one50') {
      await p.getByRole('button', { name: 'Показати всю добу' }).click()
      fullDay = await gridInfo(p)
      if (snap && width === 1440) await p.locator('.pc2-cal-grid').screenshot({ path: path.join(shots, 'final-1440-grid-fullday.png') })
    }
    result.grid.push({ width, scenario: name, ...info, fullDay })
    result.writes.push(...writes)
    result.errors.push(...errors)
    await c.close()
  }

  // 2. Mouse wheel. Sparse (fits) and dense (main fixture, «Доступність», 00:00–19:00 overflows) at 1440 and 1280.
  for (const width of [1440, 1280]) for (const kind of ['sparse', 'dense']) {
    const { c, p, errors, writes } = await open(browser, width)
    if (kind === 'sparse') await onlySessions(c, SCENARIOS.one50, SPARSE_SLOTS)
    await p.goto(`${base}/cabinet/sessions?ui=v2&mode=availability`)
    await ready(p, '.pc2-cal-grid')
    // Put the timeline fully inside the viewport with page room above and below.
    const place = async () => p.evaluate(() => { const r = document.querySelector('.pc2-cal-grid__scroll').getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top - 140) })
    const setTop = (value) => p.evaluate((v) => { const s = document.querySelector('.pc2-cal-grid__scroll'); s.scrollTop = v === 'max' ? s.scrollHeight : v === 'mid' ? (s.scrollHeight - s.clientHeight) / 2 : v }, value)
    const meta = await p.evaluate(() => { const s = document.querySelector('.pc2-cal-grid__scroll'); return { overflows: s.scrollHeight > s.clientHeight + 1, scrollHeight: s.scrollHeight, clientHeight: s.clientHeight, pageHeight: document.documentElement.scrollHeight, overscroll: getComputedStyle(s).overscrollBehaviorY } })
    for (const point of ['emptyCell', 'session', 'window', 'nearTop', 'nearBottom']) {
      const cases = kind === 'sparse' ? [['fitsDown', 0, 240], ['fitsUp', 0, -240]] : [['middle', 'mid', 240], ['atBottom', 'max', 240], ['atTop', 0, -240]]
      for (const [state, top, dy] of cases) {
        // A fitting timeline is tested from the page top (wheel down) and the page end (wheel up).
        if (state === 'fitsDown') await p.evaluate(() => window.scrollTo(0, 0))
        else if (state === 'fitsUp') await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
        else await place()
        if (state === 'atTop') await p.evaluate(() => window.scrollBy(0, 200))
        await setTop(top)
        const t = (await targets(p))[point]
        if (!t) { result.wheel.push({ width, kind, point, state, skipped: 'no such element in view' }); continue }
        result.wheel.push({ width, kind, point, state, dy, ...(await wheel(p, t.x, t.y, dy)) })
      }
    }
    result.wheel.push({ width, kind, meta })
    if (kind === 'sparse') {
      const blocks = await p.evaluate(() => [...document.querySelectorAll('.pc2-cal-grid__slot--window')].map((el) => ({ label: el.querySelector('button').getAttribute('aria-label'), height: Math.round(el.getBoundingClientRect().height) })))
      result.grid.push({ width, scenario: 'sparseAvailability', ...(await gridInfo(p)), windowBlocks: blocks })
      if (snap && width === 1440) await p.locator('.pc2-cal-grid').screenshot({ path: path.join(shots, 'final-1440-grid-sparse-availability.png') })
    }
    if (snap && width === 1440 && kind === 'dense') await p.screenshot({ path: path.join(shots, 'final-1440-dense-after-wheel.png') })
    result.writes.push(...writes)
    result.errors.push(...errors)
    await c.close()
  }

  // 3. Keyboard: Tab to the last event of a dense week brings it into the timeline view; End scrolls the page.
  {
    const { c, p } = await open(browser, 1440)
    await p.goto(`${base}/cabinet/sessions?ui=v2&mode=availability`)
    await ready(p, '.pc2-cal-grid')
    const r = await p.evaluate(async () => {
      const s = document.querySelector('.pc2-cal-grid__scroll')
      s.scrollTop = 0
      const last = [...s.querySelectorAll('a, button')].pop()
      last.focus()
      await new Promise((resolve) => setTimeout(resolve, 200))
      const box = s.getBoundingClientRect()
      const el = last.getBoundingClientRect()
      return { scrollTop: Math.round(s.scrollTop), visible: el.top >= box.top - 1 && el.bottom <= box.bottom + 1, label: last.getAttribute('aria-label') }
    })
    await p.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0) })
    const before = await p.evaluate(() => window.scrollY)
    await p.keyboard.press('End')
    await p.waitForTimeout(400)
    result.keyboard.push({ ...r, endPageDelta: Math.round((await p.evaluate(() => window.scrollY)) - before) })
    await c.close()
  }

  // 4. Phones and tablet: touch scroll of the page over the calendar, also after closing the «Вигляд» sheet.
  for (const width of [375, 390, 440, 768]) {
    const { c, p, errors, writes } = await open(browser, width, { touch: true })
    // Sparse week on the tablet so the grid fits; the phone shows its day agenda (no inner scroller).
    if (width >= 768) await onlySessions(c, SCENARIOS.one50)
    await p.goto(`${base}/cabinet/sessions?ui=v2`)
    await ready(p, width < 768 ? '.pc2-cal-agenda' : '.pc2-cal-grid')
    const session = await c.newCDPSession(p)
    // A real touch drag (touchStart → touchMove × 12 → touchEnd) starting over the calendar.
    const swipe = async () => {
      const target = await p.evaluate((sel) => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(Math.min(Math.max(r.top + 40, 300), window.innerHeight - 60)) } }, width < 768 ? '.pc2-cal-agenda' : '.pc2-cal-grid__scroll')
      const before = await p.evaluate(() => window.scrollY)
      const at = (y) => [{ x: target.x, y }]
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(target.y) })
      for (let step = 1; step <= 12; step++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(target.y - step * 18) })
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await p.waitForTimeout(600)
      return { at: target, pageDelta: Math.round((await p.evaluate(() => window.scrollY)) - before) }
    }
    await p.evaluate(() => window.scrollTo(0, 0))
    const first = await swipe()
    let afterSheet = null
    if (width < 768) {
      await p.evaluate(() => window.scrollTo(0, 0))
      await p.getByRole('button', { name: 'Вигляд календаря' }).click()
      await p.getByRole('button', { name: 'Закрити вигляд' }).click()
      afterSheet = { rootOverflow: await p.evaluate(() => document.documentElement.style.overflow), pageDelta: await swipe() }
    }
    result.touch.push({ width, pageDelta: first, afterSheet, overflow: await overflow(p) })
    result.writes.push(...writes)
    result.errors.push(...errors)
    await c.close()
  }

  fs.writeFileSync(path.join(out, `final-ux-${label}.json`), JSON.stringify(result, null, 2) + '\n')
  console.log(label, 'grid', result.grid.length, 'wheel', result.wheel.length, 'writes', result.writes.length, 'errors', result.errors.length)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
