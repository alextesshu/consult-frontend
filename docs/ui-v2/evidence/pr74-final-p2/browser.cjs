// PR #74 final P2: selected view state and the phone Week projection. Browser fixtures only
// (preferences GET/PATCH answered by a Playwright route that records every PATCH); reuses the
// UC-02 fixture helpers. Writes browser.json and screenshots/. Pointer is moved off the controls
// before every style read and screenshot, so nothing relies on hover.
const { chromium, fs, path, candidate, open, ready, overflow } = require('../uc-02-calendar-3a/common.cjs')
const out = __dirname
const shots = path.join(out, 'screenshots')
fs.mkdirSync(shots, { recursive: true })

const LAYERS = { sessions: true, past: true, free_slots: false, guest_requests: true, absences: true, external_guest_sessions: false }
const NAVY = 'rgb(18, 52, 90)'

async function withPreferences(c, saved) {
  let state = { mode: 'workday', view: saved, regular_view: saved, preset: 'workday', layers: LAYERS, revision: 3, updated_at: null, timezone: 'Europe/Kyiv' }
  const patches = []
  await c.route('**/api/cabinet/settings/calendar/', async (route) => {
    const request = route.request()
    if (request.method() === 'PATCH') {
      const body = request.postDataJSON()
      patches.push(body)
      if (body.expected_revision !== state.revision) return route.fulfill({ status: 409, json: { code: 'CALENDAR_PREFERENCES_STALE', detail: 'stale' } })
      if (body.regular_view) state = { ...state, regular_view: body.regular_view, view: body.regular_view, revision: state.revision + 1 }
      return route.fulfill({ json: state })
    }
    return route.fulfill({ json: state })
  })
  return patches
}

async function settled(p) {
  await ready(p, '.pc2-cal__modes')
  await p.waitForFunction(() => document.querySelector('.pc2-cal__mode')?.getAttribute('aria-disabled') !== 'true')
}

const viewButtons = (p) => p.evaluate(() => [...document.querySelectorAll('.pc2-cal__views > button')].map((el) => {
  const style = getComputedStyle(el)
  return { name: el.textContent.trim(), pressed: el.getAttribute('aria-pressed'), background: style.backgroundColor, color: style.color }
}))

;(async () => {
  const browser = await chromium.launch()
  const rows = []
  const problems = []
  const fail = (message) => problems.push(message)
  const table = [
    ['week', 'День', 'День', null],
    ['day', 'День', 'День', null],
    ['list', 'Список', 'День', 'day'],
    ['week', 'День', 'Список', 'list'],
  ]

  for (const width of [375, 390]) for (const [saved, shown, pressed, written] of table) {
    const { c, p, errors } = await open(browser, width)
    const patches = await withPreferences(c, saved)
    await p.goto(`${candidate}/cabinet/sessions?ui=v2`)
    await settled(p)
    await p.getByRole('button', { name: 'Вигляд календаря' }).click()
    const dialog = p.getByRole('dialog')
    await p.mouse.move(2, 2)
    const buttons = await viewButtons(p)
    const selected = buttons.find((button) => button.pressed === 'true')
    const other = buttons.find((button) => button.pressed !== 'true')
    if (written === null && pressed === 'День') {
      await p.screenshot({ path: path.join(shots, `phone-${width}-saved-${saved}.png`) })
    }
    // Keyboard focus: Tab from the close button reaches the first view button.
    await dialog.getByRole('button', { name: 'Закрити вигляд' }).focus()
    await p.keyboard.press('Tab')
    const focus = await p.evaluate(() => ({ name: document.activeElement?.textContent?.trim(), outline: getComputedStyle(document.activeElement).outlineStyle, pressed: document.activeElement?.getAttribute('aria-pressed') }))
    await dialog.getByRole('button', { name: pressed, exact: true }).click()
    await p.waitForTimeout(500)
    const of = await overflow(p)
    const id = `${width} saved=${saved} press=${pressed}`
    rows.push({ width, saved, shown, pressed, expectedWrite: written, patches: [...patches], buttons, focus, overflow: of.ok, errors: [...errors] })
    if (buttons.some((button) => button.name === 'Тиждень')) fail(`${id}: Week offered on a phone`)
    if (selected?.name !== shown) fail(`${id}: selected ${selected?.name}, expected ${shown}`)
    if (selected?.background !== NAVY || selected?.color !== 'rgb(255, 255, 255)') fail(`${id}: selected style ${JSON.stringify(selected)}`)
    if (other && other.background === selected?.background) fail(`${id}: unselected looks selected ${JSON.stringify(other)}`)
    if (focus.outline !== 'solid') fail(`${id}: no visible keyboard focus ${JSON.stringify(focus)}`)
    const expected = written ? [{ regular_view: written, expected_revision: 3 }] : []
    if (JSON.stringify(patches) !== JSON.stringify(expected)) fail(`${id}: patches ${JSON.stringify(patches)}`)
    if (!of.ok) fail(`${id}: horizontal overflow`)
    if (errors.length) fail(`${id}: page errors ${errors}`)
    await c.close()
  }

  // Desktop is unchanged: Week/Day/List offered; the selected Week is a no-op; Day writes once.
  {
    const { c, p, errors } = await open(browser, 1280)
    const patches = await withPreferences(c, 'week')
    await p.goto(`${candidate}/cabinet/sessions?ui=v2`)
    await settled(p)
    await p.getByRole('button', { name: 'Вигляд ▾', exact: true }).click()
    await p.mouse.move(2, 2)
    const buttons = await viewButtons(p)
    await p.screenshot({ path: path.join(shots, 'desktop-1280-view-menu.png') })
    const dialog = p.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Тиждень', exact: true }).click()
    await p.waitForTimeout(400)
    const afterWeek = patches.length
    await dialog.getByRole('button', { name: 'День', exact: true }).click()
    await p.waitForFunction(() => document.querySelectorAll('.pc2-cal-grid__col').length === 1)
    rows.push({ width: 1280, buttons: buttons.map((button) => button.name), afterWeekClick: afterWeek, patches: [...patches], errors: [...errors] })
    if (buttons.map((button) => button.name).join() !== 'Тиждень,День,Список') fail(`desktop options ${buttons.map((b) => b.name)}`)
    if (afterWeek !== 0) fail('desktop: selected Week click wrote')
    if (JSON.stringify(patches) !== JSON.stringify([{ regular_view: 'day', expected_revision: 3 }])) fail(`desktop patches ${JSON.stringify(patches)}`)
    if (errors.length) fail(`desktop page errors ${errors}`)
    await c.close()
  }

  // URL preview is unchanged: the selected preview tab and Back/Forward never write.
  {
    const { c, p } = await open(browser, 1280)
    const patches = await withPreferences(c, 'week')
    await p.goto(`${candidate}/cabinet/sessions?ui=v2`)
    await settled(p)
    await p.goto(`${candidate}/cabinet/sessions?ui=v2&mode=actions`)
    await p.getByTestId('calendar-mode-preview').waitFor()
    await p.getByRole('tab', { name: /Потребує дії/ }).click()
    await p.goBack(); await settled(p); await p.goForward(); await p.getByTestId('calendar-mode-preview').waitFor()
    await p.waitForTimeout(300)
    rows.push({ check: 'url-preview', patches: [...patches] })
    if (patches.length) fail(`preview wrote ${JSON.stringify(patches)}`)
    await c.close()
  }

  fs.writeFileSync(path.join(out, 'browser.json'), JSON.stringify({ fixtures: true, problems, rows }, null, 2) + '\n')
  console.log('rows', rows.length, 'problems', problems.length)
  for (const problem of problems) console.log(' -', problem)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
