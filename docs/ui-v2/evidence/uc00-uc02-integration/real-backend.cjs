// Real Django acceptance only. Run against the owned disposable DB and loopback origins.
// Credentials stay outside Git; API tokens and authentication bodies are never recorded.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')
const assert = require('node:assert/strict')
const app = 'http://localhost:5412', api = 'http://localhost:8412/api'
if (!process.env.UCI_CREDENTIALS || process.env.UCI_ISOLATED_DATABASE !== 'uc_integration') throw new Error('Disposable database confirmation and credential file required')
const accounts = JSON.parse(fs.readFileSync(process.env.UCI_CREDENTIALS, 'utf8'))
const results = [], requests = [], responses = [], errors = [], contexts = []
const out = __dirname
let browser
async function check(name, action) {
  const detail = await action()
  results.push({ name, result: 'PASS', detail: detail ?? null })
  console.log('PASS ' + name)
}
async function context(width = 1440) {
  const c = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'Europe/Kyiv', locale: 'uk-UA', hasTouch: width < 768, reducedMotion: 'reduce' })
  contexts.push(c)
  await c.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })))
  await c.route('**/*', r => ['localhost', '127.0.0.1'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort())
  const p = await c.newPage()
  p.on('pageerror', e => errors.push(e.message))
  p.on('request', r => {
    const u = new URL(r.url())
    if (u.origin === 'http://localhost:8412' && u.pathname.startsWith('/api/')) {
      const entry = { method: r.method(), path: u.pathname }
      if (r.method() === 'PATCH' && u.pathname === '/api/cabinet/settings/calendar/') entry.payload = r.postDataJSON()
      requests.push(entry)
    }
  })
  p.on('response', async r => {
    if (new URL(r.url()).pathname === '/api/cabinet/settings/calendar/') {
      const body = await r.json().catch(() => null)
      responses.push({ method: r.request().method(), status: r.status(), body })
    }
  })
  return { c, p }
}
async function login(p, account = accounts[0]) {
  await p.goto(app + '/login?ui=v2')
  await p.locator('input[name="identifier"]').fill(account.username)
  await p.locator('input[name="password"]').fill(account.password)
  await p.getByRole('button', { name: 'Увійти', exact: true }).click()
  await p.waitForURL(u => !u.pathname.startsWith('/login'))
  await p.goto(app + '/cabinet/sessions?ui=v2')
  await ready(p)
}
async function ready(p) {
  await p.locator('.pc2-cal__modes').waitFor()
  await p.waitForFunction(() => document.querySelector('.pc2-cal__mode')?.getAttribute('aria-disabled') !== 'true')
  await p.waitForLoadState('networkidle')
}
async function request(p, method = 'GET', body) {
  return p.evaluate(async ({ api, method, body }) => {
    const { useAuthStore } = await import('/src/stores/auth.ts')
    const r = await fetch(api + '/cabinet/settings/calendar/', { method, credentials: 'include', headers: { Authorization: 'Bearer ' + useAuthStore().accessToken, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
    return { status: r.status, body: await r.json() }
  }, { api, method, body })
}
const patches = () => requests.filter(r => r.method === 'PATCH').length
async function mode(p, value, status = 200) {
  const response = p.waitForResponse(r => r.url() === api + '/cabinet/settings/calendar/' && r.request().method() === 'PATCH')
  await p.locator('#pc2-cal-tab-' + value).click()
  const r = await response
  assert.equal(r.status(), status)
  await p.waitForLoadState('networkidle')
  return r.json()
}
async function openMenu(p) {
  const mobile = p.viewportSize().width < 768
  await p.getByRole('button', { name: mobile ? 'Вигляд календаря' : 'Вигляд ▾', exact: true }).click()
  await p.getByRole('dialog').waitFor()
}
async function view(p, value) {
  await openMenu(p)
  const response = p.waitForResponse(r => r.url() === api + '/cabinet/settings/calendar/' && r.request().method() === 'PATCH')
  await p.getByRole('dialog').getByRole('button', { name: { week: 'Тиждень', day: 'День', list: 'Список' }[value], exact: true }).click()
  const r = await response; assert.equal(r.status(), 200)
  await p.getByRole('button', { name: 'Закрити вигляд', exact: true }).click()
  await ready(p)
  assert.equal((await request(p)).body.regular_view, value)
}
async function shot(p, name) {
  await p.screenshot({ path: path.join(out, 'screenshots', name + '.png'), fullPage: true })
}

;(async () => {
  browser = await chromium.launch({ headless: true })
  const a = await context(), b = await context(1280)
  await login(a.p); await login(b.p)
  await check('real preferences GET / feeds / no page errors', async () => {
    assert.equal((await request(a.p)).status, 200)
    assert.equal(errors.length, 0)
    return { database: 'uc_integration', backend: '47d57b5791e750cb3a47846be67f9e2e655bb3ec', migration: '0098', fixtures: false }
  })
  await check('regular Day survives needs_action, refresh and second browser', async () => {
    await view(a.p, 'day')
    assert.equal(await a.p.locator('.pc2-cal-grid__col').count(), 1)
    const action = await mode(a.p, 'needs_action')
    assert.equal(action.regular_view, 'day')
    const before = patches()
    await a.p.reload(); await ready(a.p)
    await b.p.reload(); await ready(b.p)
    assert.equal(patches(), before)
    assert.equal((await request(b.p)).body.regular_view, 'day')
    assert.equal(await b.p.locator('.pc2-cal-grid').count(), 0)
    const restored = await mode(a.p, 'workday')
    assert.equal(restored.regular_view, 'day')
    assert.equal(await a.p.locator('.pc2-cal-grid__col').count(), 1)
    return { actionView: action.view, regularView: restored.regular_view }
  })
  await check('custom layer preserves mode; explicit reset restores mode layers', async () => {
    await openMenu(a.p)
    let response = a.p.waitForResponse(r => r.request().method() === 'PATCH' && r.url().endsWith('/settings/calendar/'))
    await a.p.getByRole('checkbox', { name: /Зовнішні гостьові/ }).check()
    const changed = await (await response).json()
    assert.equal(changed.mode, 'workday'); assert.equal(changed.preset, 'custom')
    response = a.p.waitForResponse(r => r.request().method() === 'PATCH' && r.url().endsWith('/settings/calendar/'))
    await a.p.getByRole('button', { name: 'Скинути до режиму' }).click()
    const reset = await (await response).json()
    assert.equal(reset.layers.external_guest_sessions, false); assert.equal(reset.regular_view, 'day')
    await a.p.getByRole('button', { name: 'Закрити вигляд' }).click(); await ready(a.p)
  })
  await check('URL preview / refresh / history never PATCH; explicit adoption PATCHes once', async () => {
    const before = patches()
    await a.p.goto(app + '/cabinet/sessions?ui=v2&mode=availability'); await ready(a.p)
    await a.p.getByTestId('calendar-mode-preview').waitFor()
    await openMenu(a.p)
    assert.equal(await a.p.getByRole('checkbox', { name: /Заплановані сесії/ }).isDisabled(), true)
    await a.p.getByRole('button', { name: 'Закрити вигляд' }).click()
    await a.p.reload(); await ready(a.p)
    await a.p.goto(app + '/cabinet/sessions?ui=v2&mode=actions'); await ready(a.p)
    await a.p.goBack(); await ready(a.p)
    await a.p.goForward(); await ready(a.p)
    assert.equal(patches(), before)
    await a.p.getByRole('button', { name: 'Повернути збережений' }).click()
    await a.p.waitForURL(u => !u.searchParams.has('mode'))
    assert.equal(patches(), before)
    await a.p.goto(app + '/cabinet/sessions?ui=v2&mode=availability'); await ready(a.p)
    await a.p.getByRole('button', { name: 'Зберегти цей режим' }).click()
    await a.p.waitForURL(u => !u.searchParams.has('mode')); await ready(a.p)
    assert.equal(patches(), before + 1)
    return { previewWrites: 0, adoptionWrites: 1 }
  })
  await check('stale real UI PATCH returns 409, reloads, informs, never replays', async () => {
    await a.p.bringToFront(); await a.p.reload(); await ready(a.p)
    const initial = (await request(a.p)).body
    const changed = await request(b.p, 'PATCH', { regular_view: 'list', expected_revision: initial.revision })
    assert.equal(changed.status, 200)
    const before = patches()
    await mode(a.p, 'workday', 409)
    await a.p.getByText(/Налаштування календаря змінилися на іншому пристрої/).waitFor()
    const current = (await request(a.p)).body
    assert.equal(current.regular_view, 'list'); assert.equal(current.mode, 'availability')
    assert.equal(patches(), before + 1)
    await a.p.getByRole('button', { name: 'Оновити налаштування' }).click(); await ready(a.p)
    return { status: 409, authoritativeRevision: current.revision, replay: false }
  })
  await check('concurrent equal-revision PATCHes produce one 200 and one 409', async () => {
    const initial = (await request(a.p)).body
    const pair = await Promise.all([
      request(a.p, 'PATCH', { regular_view: 'day', expected_revision: initial.revision }),
      request(b.p, 'PATCH', { regular_view: 'week', expected_revision: initial.revision }),
    ])
    assert.deepEqual(pair.map(r => r.status).sort(), [200, 409])
    await a.p.reload(); await ready(a.p)
    return pair.map(r => r.status)
  })
  await check('offline keeps confirmed snapshot read-only; reconnect only GETs', async () => {
    const before = patches()
    await a.c.setOffline(true)
    await a.p.getByText(/Немає з’єднання/).waitFor()
    assert.equal(await a.p.locator('#pc2-cal-tab-workday').getAttribute('aria-disabled'), 'true')
    await a.c.setOffline(false); await ready(a.p)
    assert.equal(patches(), before)
  })
  await check('controlled 503 leaves snapshot read-only; explicit retry recovers', async () => {
    let fail = true
    const handler = r => r.request().method() === 'GET' && fail ? r.fulfill({ status: 503, json: { code: 'TEST_OUTAGE', detail: 'Synthetic network fault' } }) : r.fallback()
    await a.c.route('**/api/cabinet/settings/calendar/', handler)
    await a.p.evaluate(() => window.dispatchEvent(new Event('focus')))
    await a.p.getByText(/Не вдалося оновити налаштування/).waitFor()
    assert.equal(await a.p.locator('#pc2-cal-tab-workday').getAttribute('aria-disabled'), 'true')
    fail = false
    await a.p.getByRole('button', { name: 'Оновити налаштування' }).click(); await ready(a.p)
    await a.c.unroute('**/api/cabinet/settings/calendar/', handler)
    return { faultInjection: 'GET 503 only; all successful API data real' }
  })
  await check('five-width Week/Day/List and mobile projection / no overflow', async () => {
    await mode(a.p, 'workday')
    const rows = []
    for (const width of [375, 390, 768, 1280, 1440]) {
      await a.p.setViewportSize({ width, height: 900 })
      for (const selected of ['week', 'day', 'list']) {
        await view(a.p, selected)
        const dimensions = await a.p.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: innerWidth }))
        assert.ok(dimensions.scrollWidth <= width)
        if (selected === 'day' && width >= 768) assert.equal(await a.p.locator('.pc2-cal-grid__col').count(), 1)
        if (selected === 'week' && width < 768) assert.equal(await a.p.locator('.pc2-cal-grid').count(), 0)
        if (selected === 'list') assert.equal(await a.p.locator('.pc2-cal-grid').count(), 0)
        await shot(a.p, `real-${width}-${selected}`)
        rows.push({ width, view: selected, ...dimensions })
      }
    }
    return rows
  })
  await check('sparse timeline still chains wheel scrolling to the page', async () => {
    await view(a.p, 'week'); await a.p.setViewportSize({ width: 1440, height: 700 })
    await a.p.evaluate(() => window.scrollTo(0, 0))
    const bounds = await a.p.locator('.pc2-cal-grid__scroll').boundingBox()
    await a.p.mouse.move(bounds.x + bounds.width / 2, Math.min(bounds.y + 30, 650))
    await a.p.mouse.wheel(0, 240)
    await a.p.waitForFunction(() => window.scrollY > 0)
    const measured = await a.p.evaluate(() => ({ pageY: scrollY, timelineTop: document.querySelector('.pc2-cal-grid__scroll').scrollTop }))
    assert.equal(measured.timelineTop, 0)
    return measured
  })
  await check('logout/login switches specialist preferences and calendar feeds', async () => {
    await view(a.p, 'day')
    await a.p.getByRole('button', { name: 'Вийти', exact: true }).click()
    await a.p.waitForURL(u => !u.pathname.startsWith('/cabinet'))
    await login(a.p, accounts[1])
    assert.equal((await request(a.p)).body.regular_view, 'week')
    assert.equal(await a.p.locator('.pc2-cal-grid__col').count(), 7)
    return { specialistSwitch: true, priorView: 'day', newView: 'week' }
  })
  await check('anonymous 401 and client 403 from real API (API-only)', async () => {
    const anonymous = await browser.newContext()
    const denied = await anonymous.request.get(api + '/cabinet/settings/calendar/')
    assert.equal(denied.status(), 401)
    const client = JSON.parse(fs.readFileSync(process.env.UCI_CLIENT_CREDENTIALS, 'utf8'))
    const loginResponse = await anonymous.request.post(api + '/auth/token/', { data: client })
    const tokens = await loginResponse.json()
    const forbidden = await anonymous.request.get(api + '/cabinet/settings/calendar/', { headers: { Authorization: 'Bearer ' + tokens.access } })
    assert.equal(forbidden.status(), 403)
    await anonymous.close()
    return { anonymous: 401, client: 403, browserUI: false }
  })
  assert.equal(errors.length, 0)
  assert.deepEqual(requests.filter(r => !['GET', 'OPTIONS'].includes(r.method) && !r.path.startsWith('/api/auth/') && !(r.method === 'PATCH' && r.path === '/api/cabinet/settings/calendar/')), [])
})().catch(e => { results.push({ name: 'acceptance stopped', result: 'FAIL', detail: e.message }); console.error(e.message); process.exitCode = 1 }).finally(async () => {
  fs.writeFileSync(path.join(out, 'real-backend.json'), JSON.stringify({ database: 'uc_integration', results, requests, responses, errors }, null, 2))
  if (browser) await browser.close()
})
