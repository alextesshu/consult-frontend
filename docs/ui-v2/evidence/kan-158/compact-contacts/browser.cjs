// Synthetic, intercepted API only. No requests reach Django or a real specialist.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const root = path.resolve(__dirname, '../../../../..')
const spec = fs.readFileSync(path.join(root, 'src/views/PublicProfileView.spec.ts'), 'utf8')
const literal = spec.split('const base: PublicSpecialistProfile = {')[1].split('\n  }')[0]
const base = new Function(`return ({${literal}})`)()
const widths = [375, 390, 768, 820, 1100, 1280, 1440]
const modes = ['direct', 'empty', 'request']
const now = new Date('2026-10-26T09:00:00Z')
const output = __dirname, shots = path.join(output, 'screenshots')
const parityDir = path.join(process.env.TEMP, 'compact-contacts-parity')
fs.mkdirSync(shots, { recursive: true }); fs.mkdirSync(parityDir, { recursive: true })
const results = { fixtureOnly: true, rows: [], shortCard: [], parity: [] }
const closeDialog = async (p, selector) => {
  await p.keyboard.press('Escape')
  await p.waitForFunction(s => !document.querySelector(s)?.open, selector)
  assert.notEqual(await p.evaluate(() => document.body.style.overflow), 'hidden')
}
async function load(browser, port, ui, mode, width, height = width < 768 ? 812 : 1024, contacts = contactFixture) {
  const origin = `http://localhost:${port}`
  const context = await browser.newContext({ viewport: { width, height }, locale: 'uk-UA', timezoneId: 'Europe/Kyiv', reducedMotion: 'reduce' })
  await context.clock.install({ time: now })
  await context.addInitScript(() => {
    localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' }))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text } } })
  })
  const posts = [], gets = [], errors = []
  const profile = { ...base, public_profile_summary: 'Допомагаю краще розуміти себе, долати тривогу й будувати стосунки.', photo_url: '', video_url: '', public_display_name: 'Олександра Константинова', display_name: 'Олександра Константинова' }
  profile.contact_actions = contacts
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
        buttonHeight: row.querySelector('button').getBoundingClientRect().height,
        buttonWidth: row.querySelector('button').getBoundingClientRect().width,
        rowRadius: getComputedStyle(row).borderRadius,
        rowBackground: getComputedStyle(row).backgroundColor,
        lineCount: new Set(lines.map(r => Math.round(r.y))).size,
        widestTextLine: Math.max(0, ...lines.map(r => r.width)),
      }
    }),
  }
})
const pairs = [...widths.map(w => [w, w < 768 ? 812 : 900]), [1280, 600]]
;(async () => {
  const browser = await chromium.launch()
  try {
    for (const mode of modes) for (const [width, height] of pairs) {
      const measurements = {}
      for (const [label, port] of [['before', 5491], ['after', 5490]]) {
        const { p, context, errors, posts } = await load(browser, port, 'v2', mode, width, height)
        const info = await geometry(p)
        assert.equal(info.rows.length, contactFixture.length)
        assert.ok(info.scrollWidth <= width)
        assert.equal(info.inBookingPanel, false)
        assert.equal(info.cardOverflow, 'visible')
        assert.ok(info.cardScrollHeight <= info.cardClientHeight + 1)
        for (let i = 0; i < contactFixture.length; i++) {
          const row = info.rows[i], fixture = contactFixture[i]
          assert.equal(row.text, fixture.value)
          assert.ok(row.valueWidth >= Math.min(240, row.rowWidth * .8))
          assert.ok(row.buttonHeight >= 44 && row.buttonWidth >= 44)
          if (['PHONE', 'SECONDARY_PHONE', 'VIBER', 'WHATSAPP'].includes(fixture.channel)) assert.equal(row.lineCount, 1)
          if (label === 'after') {
            assert.equal(row.rowRadius, '0px')
            assert.equal(row.rowBackground, 'rgba(0, 0, 0, 0)')
            const button = p.getByRole('button', { name: `Скопіювати ${fixture.label}: ${fixture.value}`, exact: true })
            await button.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
            assert.equal(await button.evaluate(el => { const r = el.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('button') === el }), true)
            await button.click()
            assert.equal(await p.evaluate(() => window.__copied), fixture.value)
            if (await p.locator('.toast__close').count()) await p.locator('.toast__close').first().click()
          }
        }
        await p.locator('.pc2-profile-contacts').evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - 100, behavior: 'instant' }))
        await p.screenshot({ path: path.join(shots, `${label}-${mode}-${width}-${height}.png`) })
        if (mode === 'direct' && [375, 1280].includes(width) && height !== 600) {
          await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
          await p.screenshot({ path: path.join(shots, `${label}-full-${width}.png`), fullPage: true })
        }
        assert.deepEqual(errors, [])
        assert.equal(posts.filter(x => x.path.endsWith('/guest-booking-requests/')).length, 0)
        measurements[label] = info
        await context.close()
      }
      const { before, after } = measurements
      assert.ok(after.cardHeight < before.cardHeight * .9, `insufficient reduction ${mode}/${width}: ${before.cardHeight} -> ${after.cardHeight}`)
      results.rows.push({ mode, width, height, before, after, heightSaved: before.cardHeight - after.cardHeight, reductionPercent: 100 * (1 - after.cardHeight / before.cardHeight) })
      process.stdout.write(`${mode}/${width}x${height}: ${before.cardHeight.toFixed(1)} -> ${after.cardHeight.toFixed(1)}px\n`)
    }
    // Small cards must keep the existing sticky-versus-flow rule as well.
    for (const mode of modes) {
      const info = {}
      for (const [label, port] of [['before', 5491], ['after', 5490]]) {
        const { p, context } = await load(browser, port, 'v2', mode, 1280, 900, contactFixture.slice(0, 2))
        info[label] = await geometry(p)
        await context.close()
      }
      assert.equal(info.after.columnPosition, info.before.columnPosition)
      results.shortCard.push({ mode, before: info.before.cardHeight, after: info.after.cardHeight, columnPosition: info.after.columnPosition })
    }
    for (const mode of modes) for (const width of widths) {
      const files = []
      for (const [label, port] of [['before', 5491], ['after', 5490]]) {
        const { p, context } = await load(browser, port, 'v1', mode, width)
        const file = path.join(parityDir, `${mode}-${width}-${label}.png`)
        await p.screenshot({ path: file }); files.push(file); await context.close()
      }
      const code = 'from PIL import Image,ImageChops; import sys; a,b=[Image.open(p).convert("RGB") for p in sys.argv[1:]]; raw=ImageChops.difference(a,b).tobytes(); print(sum(1 for i in range(0,len(raw),3) if raw[i:i+3]!=bytes(3)))'
      const changed = Number(execFileSync('python', ['-c', code, ...files], { encoding: 'utf8' }).trim())
      assert.equal(changed, 0)
      results.parity.push({ mode, width, changedPixels: changed })
    }
  } finally {
    await browser.close()
    fs.writeFileSync(path.join(output, 'browser.json'), JSON.stringify(results, null, 2) + '\n')
  }
})().catch(e => { console.error(e); process.exitCode = 1 })
