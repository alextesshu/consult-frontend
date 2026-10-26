// Synthetic, intercepted API only. No requests reach Django or a real specialist.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const root = path.resolve(__dirname, '../../../../../..')
const spec = fs.readFileSync(path.join(root, 'src/views/PublicProfileView.spec.ts'), 'utf8')
const literal = spec.split('const base: PublicSpecialistProfile = {')[1].split('\n  }')[0]
const base = new Function(`return ({${literal}})`)()
const widths = [375, 390, 768, 820, 1100, 1280, 1440]
const modes = ['direct', 'empty', 'request']
const now = new Date('2026-10-26T09:00:00Z')
const output = __dirname, shots = path.join(output, 'screenshots')
const parityDir = path.join(process.env.TEMP, 'pr79-contacts-parity')
fs.mkdirSync(shots, { recursive: true }); fs.mkdirSync(parityDir, { recursive: true })
const results = { fixtureOnly: true, rows: [], parity: [] }
const closeDialog = async (p, selector) => {
  await p.keyboard.press('Escape')
  await p.waitForFunction(s => !document.querySelector(s)?.open, selector)
  assert.notEqual(await p.evaluate(() => document.body.style.overflow), 'hidden')
}
async function load(browser, port, ui, mode, width, height = width < 768 ? 812 : 1024) {
  const origin = `http://localhost:${port}`
  const context = await browser.newContext({ viewport: { width, height }, locale: 'uk-UA', timezoneId: 'Europe/Kyiv', reducedMotion: 'reduce' })
  await context.clock.install({ time: now })
  await context.addInitScript(() => {
    localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' }))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text } } })
  })
  const posts = [], gets = [], errors = []
  const profile = { ...base, public_profile_summary: 'Допомагаю краще розуміти себе, долати тривогу й будувати стосунки.', photo_url: '', video_url: '', public_display_name: 'Олександра Константинова', display_name: 'Олександра Константинова' }
  profile.contact_actions = contactFixture
  if (mode === 'request') Object.assign(profile, { public_booking_mode: 'request_only', show_public_availability: false, public_direct_booking_enabled: false })
  const slot = { id: 100, therapist: 12, start_at: '2026-10-27T10:00:00Z', end_at: '2026-10-27T10:50:00Z', is_available: true }
  await context.route('**/*', async route => {
    const req = route.request(), u = new URL(req.url())
    if (u.port === '8470') {
      if (req.method() !== 'GET') {
        posts.push({ path: u.pathname, method: req.method(), payload: req.postDataJSON() })
        if (u.pathname.endsWith('/guest-booking-requests/')) return route.fulfill({ status: 201, json: { request: { id: 901, status: 'PENDING', created_at: now.toISOString(), next_step: null } } })
        return route.fulfill({ status: 401, json: { detail: 'Synthetic anonymous fixture' } })
      }
      gets.push(u.pathname)
      let body = []
      if (u.pathname === '/api/s/olena/' || u.pathname === '/api/public/specialists/olena/') body = profile
      else if (u.pathname === '/api/booking/slots/') body = mode === 'direct' ? [slot] : []
      return route.fulfill({ status: 200, json: body })
    }
    if (u.origin !== origin) return route.abort()
    return route.continue()
  })
  const p = await context.newPage()
  p.on('pageerror', e => errors.push(e.message))
  await p.goto(`${origin}/s/olena?ui=${ui}`)
  await p.locator('h1').waitFor()
  await p.waitForLoadState('networkidle')
  await p.evaluate(() => document.fonts.ready)
  await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' })
  await p.mouse.move(1, 1)
  return { context, p, posts, gets, errors }
}

const contactFixture = [
  { channel: 'EMAIL', label: 'Email', value: 'consultation.specialist.long.public.contact@example.test', action_url: 'mailto:consultation.specialist.long.public.contact@example.test' },
  { channel: 'TELEGRAM', label: 'Telegram', value: '@proconsult_specialist_calendar', action_url: 'https://t.me/proconsult_specialist_calendar' },
  { channel: 'VIBER', label: 'Viber', value: '+380931234567', action_url: 'viber://chat?number=380931234567' },
  { channel: 'PHONE', label: 'Телефон', value: '+380501234567', action_url: 'tel:+380501234567' },
  { channel: 'SECONDARY_PHONE', label: 'Додатковий телефон', value: '+380671234567', action_url: 'tel:+380671234567' },
  { channel: 'WHATSAPP', label: 'WhatsApp', value: '+380951234567', action_url: 'https://wa.me/380951234567' },
  { channel: 'MESSENGER', label: 'Messenger / Signal', value: 'synthetic' + 'x'.repeat(140), action_url: 'https://example.test/contact' },
]
const geometry = p => p.evaluate(() => {
  const card = document.querySelector('.pc2-profile-contacts')
  const column = card.closest('.pc2-profile-booking-column')
  return {
    width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
    cardHeight: card.getBoundingClientRect().height, cardClientHeight: card.clientHeight,
    cardScrollHeight: card.scrollHeight, cardOverflow: getComputedStyle(card).overflowY,
    inBookingPanel: !!card.closest('.pc2-request-panel'),
    columnPosition: column && getComputedStyle(column).position,
    rows: [...card.querySelectorAll('.pc2-profile-contacts__row')].map(row => {
      const value = row.querySelector('.pc2-profile-contacts__value')
      const range = document.createRange(); range.selectNodeContents(value)
      const lines = [...range.getClientRects()].filter(r => r.width && r.height)
      return {
        label: row.querySelector('.pc2-profile-contacts__label').textContent,
        text: value.textContent, valueWidth: value.getBoundingClientRect().width,
        rowWidth: row.getBoundingClientRect().width, rowHeight: row.getBoundingClientRect().height,
        lineCount: new Set(lines.map(r => Math.round(r.y))).size,
        widestTextLine: Math.max(0, ...lines.map(r => r.width)),
      }
    }),
  }
})
;(async () => {
  const browser = await chromium.launch()
  const before = process.env.CONTACT_LAYOUT_PHASE === 'before'
  try {
    for (const mode of modes) for (const [width, height] of [...widths.map(w => [w, w < 768 ? 812 : 900]), [1280, 600]]) {
      const { p, context, posts, errors } = await load(browser, before ? 5481 : 5480, 'v2', mode, width, height)
      const info = await geometry(p)
      const failures = []
      if (info.scrollWidth > width) failures.push('document overflow')
      if (info.inBookingPanel) failures.push('contacts in booking panel')
      if (info.cardOverflow !== 'visible' || info.cardScrollHeight > info.cardClientHeight + 1) failures.push('card internal overflow')
      assert.equal(info.rows.length, contactFixture.length)
      for (let i = 0; i < info.rows.length; i++) {
        const row = info.rows[i], fixture = contactFixture[i]
        assert.equal(row.text, fixture.value)
        if (row.valueWidth < Math.min(240, row.rowWidth * .8)) failures.push(`${fixture.channel}: narrow value ${row.valueWidth}`)
        if (['PHONE', 'SECONDARY_PHONE', 'VIBER', 'WHATSAPP'].includes(fixture.channel) && row.lineCount !== 1) failures.push(`${fixture.channel}: phone wraps into ${row.lineCount} lines`)
        if (row.widestTextLine < 120 && fixture.value.length > 20) failures.push(`${fixture.channel}: text squeezed`)
        if (!before) {
          const button = p.getByRole('button', { name: `Скопіювати ${fixture.label}: ${fixture.value}`, exact: true })
          // Scroll the page to a usable position, clear of fixed header/phone CTA.
          await button.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
          const hit = await button.evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= -1 && r.bottom <= innerHeight + 1 && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('button') === el })
          assert.equal(hit, true, JSON.stringify({ mode, width, channel: fixture.channel, geometry: await button.evaluate(el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, x: r.x, y: r.y, centerHit: document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.className, scrollY, viewport: innerHeight } }) }))
          await button.click()
          assert.equal(await p.evaluate(() => window.__copied), fixture.value)
          const toastClose = p.locator('.toast__close')
          if (await toastClose.count()) await toastClose.first().click()
        }
      }
      await p.locator('.pc2-profile-contacts').scrollIntoViewIfNeeded()
      await p.screenshot({ path: path.join(shots, `${before ? 'before' : 'after'}-${mode}-${width}-${height}.png`) })
      if (!before && ((width === 1280 && height === 900) || (width === 375 && mode === 'direct'))) {
        await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
        await p.screenshot({ path: path.join(shots, `after-full-${mode}-${width}-${height}.png`), fullPage: true })
      }
      if (!before) {
        assert.deepEqual(failures, [], JSON.stringify({ mode, width, info, failures }))
        assert.equal(posts.filter(x => x.path.endsWith('/guest-booking-requests/')).length, 0)
        assert.deepEqual(errors, [])
      }
      results.rows.push({ mode, ...info, failures, allCopyButtonsReachable: !before })
      await context.close()
      process.stdout.write(`${before ? 'before' : 'after'} ${mode}/${width}x${height}: ${failures.length} layout failures\n`)
    }
    if (before) assert.ok(results.rows.some(row => row.failures.length), 'Before run must reproduce the regression')
    else for (const mode of modes) for (const width of widths) {
      const files = []
      for (const [label, port] of [['baseline', 5481], ['candidate', 5480]]) {
        const { p, context } = await load(browser, port, 'v1', mode, width)
        const file = path.join(parityDir, `${mode}-${width}-${label}.png`)
        await p.screenshot({ path: file }); files.push(file); await context.close()
      }
      const code = 'from PIL import Image,ImageChops; import sys; a,b=[Image.open(p).convert("RGB") for p in sys.argv[1:]]; raw=ImageChops.difference(a,b).tobytes(); print(sum(1 for i in range(0,len(raw),3) if raw[i:i+3]!=bytes(3)))'
      const changed = Number(execFileSync('python', ['-c', code, ...files], { encoding: 'utf8' }).trim())
      assert.equal(changed, 0, `v1 parity ${mode}/${width}`)
      results.parity.push({ mode, width, changedPixels: changed })
    }
  } finally {
    await browser.close()
    fs.writeFileSync(path.join(output, before ? 'before.json' : 'after.json'), JSON.stringify(results, null, 2) + '\n')
  }
})().catch(e => { console.error(e); process.exitCode = 1 })
