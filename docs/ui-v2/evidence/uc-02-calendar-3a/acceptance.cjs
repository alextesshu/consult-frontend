// Chromium acceptance for calendar 3a: 5 widths × 3 modes, the «Вигляд» menu, a mode/popover recording,
// read-only guarantees and the UI v1 entry. Writes acceptance.json, screenshots/ and recordings/.
const { chromium, fs, path, out, candidate, open, ready, warm, overflow } = require('./common.cjs')
const shots = path.join(out, 'screenshots')
const videos = path.join(out, 'recordings')
fs.mkdirSync(shots, { recursive: true })
fs.mkdirSync(videos, { recursive: true })
const WIDTHS = [375, 390, 440, 768, 1280, 1440]
const MODES = [['workday', 'Робочий день'], ['availability', 'Доступність'], ['actions', 'Потребує дії']]

;(async () => {
  const browser = await chromium.launch()
  await warm(browser, ['/cabinet/sessions?ui=v2', '/cabinet/sessions?ui=v1'])
  const rows = []
  const problems = []
  const fail = (message) => problems.push(message)

  for (const width of WIDTHS) for (const [mode, label] of MODES) {
    const mobile = width < 768
    const { c, p, errors, writes } = await open(browser, width)
    await p.goto(`${candidate}/cabinet/sessions?ui=v2&mode=${mode}`)
    await ready(p, '.pc2-cal__modes')
    await p.waitForSelector(mode === 'actions' ? '.pc2-cal-actions' : mobile ? '.pc2-cal-agenda' : '.pc2-cal-grid')
    if (mobile && mode !== 'actions') await p.getByRole('group', { name: 'Дні тижня' }).getByRole('button', { name: /П’ятниця, 23 жовтня/ }).click()
    const info = await p.evaluate(() => ({
      selectedTab: document.querySelector('.pc2-cal__mode[aria-selected="true"]')?.textContent?.replace(/\s+/g, ' ').trim(),
      badge: document.querySelector('.pc2-cal__badge')?.textContent?.trim() ?? null,
      card: document.querySelector('.pc2-cal-next')?.textContent?.replace(/\s+/g, ' ').trim(),
      grid: Boolean(document.querySelector('.pc2-cal-grid')),
      weekendColumn: Boolean(document.querySelector('.pc2-cal-grid__col--weekend')),
      windows: [...document.querySelectorAll('.pc2-cal-window, .pc2-cal-agenda__window')].map((el) => el.getAttribute('aria-label') || el.textContent.replace(/\s+/g, ' ').trim()),
      mutedNames: [...document.querySelectorAll('.pc2-cal-event.is-muted')].map((el) => el.getAttribute('aria-label')),
      actionGroups: [...document.querySelectorAll('.pc2-cal-actions__head')].map((el) => [...el.children].map((part) => part.textContent.trim()).join(' ')),
      range: document.querySelector('.pc2-cal-grid__range span')?.textContent?.trim() ?? null,
      smallTargets: [...document.querySelectorAll('.pc2-cal button, .pc2-cal a')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('.pc2-cal-grid') && (r.height < 44 || r.width < 44) })
        .map((el) => `${(el.textContent.trim() || el.getAttribute('aria-label') || '').slice(0, 24)} ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`),
    }))
    const of = await overflow(p)
    const file = `v2-${width}-${mode}.png`
    await p.screenshot({ path: path.join(shots, file), fullPage: true })
    rows.push({ width, mode, ...info, overflow: of, errors: [...errors], writes: [...writes], file })
    const id = `${width} ${mode}`
    if (!of.ok) fail(`${id}: horizontal overflow ${of.scrollWidth}`)
    if (errors.length) fail(`${id}: page errors ${errors.join(' | ')}`)
    if (writes.length) fail(`${id}: non-GET requests ${writes.join(', ')}`)
    if (!info.selectedTab?.startsWith(mobile && mode === 'actions' ? 'Дії' : label)) fail(`${id}: selected tab ${info.selectedTab}`)
    if (info.badge !== '6') fail(`${id}: badge ${info.badge}`)
    if (mobile && info.smallTargets.length) fail(`${id}: touch targets < 44px ${info.smallTargets.join('; ')}`)
    if (mode !== 'actions' && !mobile && !info.grid) fail(`${id}: no grid`)
    if (mode !== 'actions' && width === 768 && !info.weekendColumn) fail(`${id}: no weekend column`)
    if (mode !== 'actions' && width >= 1280 && info.weekendColumn) fail(`${id}: weekend folded on desktop`)
    if (mode === 'availability' && !info.windows.length) fail(`${id}: no availability windows`)
    if (mode === 'availability' && info.mutedNames.some((name) => name && !/^.+, Зайнято$/.test(name))) fail(`${id}: names in availability ${info.mutedNames}`)
    if (mode === 'workday' && !mobile && info.windows.length) fail(`${id}: single windows drawn in workday`)
    if (mode === 'actions' && info.actionGroups.join(' | ') !== 'Цей тиждень 4 дії | Поза цим тижнем 2 дії') fail(`${id}: action groups ${info.actionGroups}`)
    await c.close()
  }

  // «Вигляд»: desktop popover and phone bottom sheet.
  for (const width of [1440, 375]) {
    const { c, p } = await open(browser, width)
    await p.goto(`${candidate}/cabinet/sessions?ui=v2`)
    await ready(p, '.pc2-cal__modes')
    await p.getByRole('button', { name: width < 768 ? 'Вигляд календаря' : 'Вигляд ▾', exact: true }).click()
    await p.getByRole('checkbox', { name: /Зовнішні гостьові сесії/ }).click()
    await p.locator('.pc2-cal-view__legend summary').click()
    await p.screenshot({ path: path.join(shots, `v2-${width}-view-menu.png`) })
    await p.keyboard.press('Escape')
    const focusBack = await p.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim())
    const chip = await p.locator('.pc2-cal__deviation').first().textContent()
    if (!/Вигляд/.test(focusBack || '')) fail(`${width}: focus not returned after Esc (${focusBack})`)
    if (!/\+ зовнішні гостьові/.test(chip || '')) fail(`${width}: deviation chip ${chip}`)
    await p.screenshot({ path: path.join(shots, `v2-${width}-deviation-chip.png`) })
    rows.push({ viewMenu: width, focusBack, chip })
    await c.close()
  }

  // Recording: switching modes and the popover at 1440.
  {
    const { c, p } = await open(browser, 1440, { video: videos })
    await p.goto(`${candidate}/cabinet/sessions?ui=v2`)
    await ready(p, '.pc2-cal-grid')
    for (const [, label] of [MODES[1], MODES[2], MODES[0]]) {
      await p.getByRole('tab', { name: new RegExp(`^${label}`) }).click()
      await p.waitForTimeout(900)
    }
    await p.getByRole('button', { name: 'Вигляд ▾', exact: true }).click()
    await p.waitForTimeout(700)
    await p.getByRole('checkbox', { name: /Вільні слоти/ }).click()
    await p.waitForTimeout(900)
    await p.keyboard.press('Escape')
    await p.waitForTimeout(600)
    const video = p.video()
    await c.close()
    const recorded = await video.path()
    fs.renameSync(recorded, path.join(videos, 'modes-and-view-menu-1440.webm'))
  }

  // UI v1 keeps the existing sessions page; a deep link opens the actions mode directly.
  {
    const { c, p } = await open(browser, 1280)
    await p.goto(`${candidate}/cabinet/sessions?ui=v1`)
    await ready(p, 'main h1')
    const v1 = await p.evaluate(() => ({ h1: document.querySelector('main h1')?.textContent?.trim(), calendar: Boolean(document.querySelector('.pc2-cal')) }))
    if (v1.h1 !== 'Сесії' || v1.calendar) fail(`v1 sessions page changed ${JSON.stringify(v1)}`)
    rows.push({ v1 })
    await c.close()
  }

  fs.writeFileSync(path.join(out, 'acceptance.json'), JSON.stringify({ problems, rows }, null, 2) + '\n')
  console.log('rows', rows.length, 'problems', problems.length)
  for (const problem of problems) console.log(' -', problem)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
