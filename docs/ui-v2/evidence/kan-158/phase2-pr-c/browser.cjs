// Synthetic, intercepted API only. No requests reach Django or a real specialist.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const root = path.resolve(__dirname, '../../../../..')
const spec = fs.readFileSync(path.join(root, 'src/views/PublicProfileView.spec.ts'), 'utf8')
const literal = spec.split('const base: PublicSpecialistProfile = {')[1].split('\n  }')[0]
const base = new Function(`return ({${literal}})`)()
const widths = [375, 390, 767, 768, 820, 859, 860, 1099, 1100, 1280]
const modes = ['direct', 'empty', 'request']
const now = new Date('2026-10-26T09:00:00Z')
const candidatePort = Number(process.env.PRC_CANDIDATE_PORT || 5470)
const baselinePort = Number(process.env.PRC_BASELINE_PORT || 5471)
const output = process.env.PRC_EVIDENCE_OUT || __dirname, shots = path.join(output, 'screenshots')
const parityDir = path.join(process.env.TEMP, 'prc-parity-c1a77a3')
fs.mkdirSync(shots, { recursive: true }); fs.mkdirSync(parityDir, { recursive: true })
const results = { fixtureOnly: true, rows: [], interactions: [], shortDesktop: [], parity: [] }
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
const inspect = p => p.evaluate(() => {
  const rect = selector => { const el = document.querySelector(selector); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.bottom } }
  const contacts = document.querySelector('.pc2-profile-contacts'), panel = document.querySelector('.pc2-request-panel')
  return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, hero: rect('.hero-profile'), photo: rect('.pc2-profile-photo-fallback'), name: rect('h1'), contacts: rect('.pc2-profile-contacts'), panel: rect('.pc2-request-panel'), column: rect('.pc2-profile-booking-column'), bar: rect('.pc2-profile-bottom-bar'), contactsCount: document.querySelectorAll('.pc2-profile-contacts').length, contactsInPanel: !!contacts?.closest('.pc2-request-panel'), contactsDisplay: contacts && getComputedStyle(contacts).display, panelOverflow: panel && getComputedStyle(panel).overflowY, panelScrollHeight: panel?.scrollHeight, panelClientHeight: panel?.clientHeight, footer: rect('footer'), bodyPadding: document.body.style.paddingBottom }
})
async function interaction(p, mode, width, posts) {
  const phone = width < 768
  const about = p.getByRole('button', { name: 'Більше про мене', exact: true })
  await about.click()
  await p.locator('.pc2-profile-overlay--about[open]').waitFor()
  await closeDialog(p, '.pc2-profile-overlay--about')
  assert.equal(await about.evaluate(el => el === document.activeElement), true)
  const share = p.locator('.pc2-profile-hero-share')
  await share.click()
  await p.locator('.pc2-profile-overlay--share[open]').waitFor()
  await closeDialog(p, '.pc2-profile-overlay--share')
  assert.equal(await share.evaluate(el => el === document.activeElement), true)
  if (phone) {
    await p.locator('.pc2-profile-mobile-cta').click()
    await p.locator('.pc2-profile-overlay--request[open]').waitFor()
    assert.equal(await p.evaluate(() => document.body.style.overflow), 'hidden')
  }
  const panel = p.locator('.pc2-request-panel')
  await panel.locator('.identity-rail__service').filter({ hasText: 'Ознайомча' }).click()
  if (mode === 'direct') await panel.getByRole('button', { name: 'Надіслати запит на цей час', exact: true }).click()
  else await panel.locator('.identity-rail__actions').getByRole('button', { name: 'Залишити запит', exact: true }).click()
  const form = p.locator('.guest-booking-modal form')
  await form.waitFor()
  if (width >= 1100) {
    await p.locator('.pc2-profile-contacts').scrollIntoViewIfNeeded()
    const visible = await p.locator('.pc2-profile-contacts').evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.pc2-profile-contacts') === el })
    assert.equal(visible, true, 'contacts hidden during desktop request form')
  }
  if (width === 375 || width === 1280) await p.screenshot({ path: path.join(shots, `form-${mode}-${width}.png`) })
  await p.getByLabel('Ім’я', { exact: true }).fill('Тестова клієнтка')
  await p.getByLabel('Як спеціаліст може з вами зв’язатися?', { exact: true }).fill('synthetic@example.test')
  if (phone) {
    const dialog = p.locator('.pc2-profile-overlay--request')
    await p.getByLabel('Ім’я', { exact: true }).focus()
    await p.keyboard.press('Shift+Tab')
    assert.equal(await p.evaluate(() => !!document.activeElement?.closest('dialog[open]')), true)
    const focusCheck = await p.evaluate(() => {
      const controls = Array.from(document.querySelector('.pc2-profile-overlay--request').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')).filter(el => !el.closest('[inert],[hidden]') && el.getClientRects().length)
      controls.at(-1).focus()
      return { last: controls.at(-1).outerHTML.slice(0, 400), focused: document.activeElement === controls.at(-1), active: document.activeElement.tagName }
    })
    assert.equal(focusCheck.focused, true, JSON.stringify(focusCheck))
    await p.keyboard.press('Tab')
    assert.equal(await p.locator('.pc2-profile-overlay--request .pc2-profile-overlay__close').evaluate(el => el === document.activeElement), true)
    await closeDialog(p, '.pc2-profile-overlay--request')
    assert.equal(await p.locator('.pc2-profile-mobile-cta').evaluate(el => el === document.activeElement), true)
    await p.locator('.pc2-profile-mobile-cta').click()
    await p.getByLabel('Ім’я', { exact: true }).waitFor()
    assert.equal(await p.getByLabel('Ім’я', { exact: true }).inputValue(), 'Тестова клієнтка')
    await p.mouse.click(2, 2)
    await p.waitForFunction(() => !document.querySelector('.pc2-profile-overlay--request')?.open)
    assert.notEqual(await p.evaluate(() => document.body.style.overflow), 'hidden')
    await p.locator('.pc2-profile-mobile-cta').click()
    await p.setViewportSize({ width: 820, height: 1024 })
    await p.waitForFunction(() => !document.querySelector('.pc2-profile-overlay--request')?.open && document.body.style.overflow !== 'hidden')
    assert.equal(await p.locator('.pc2-profile-booking-column .guest-booking-modal').count(), 1)
    await p.setViewportSize({ width, height: 812 })
    await p.locator('.pc2-profile-mobile-cta').click()
    await dialog.locator('form').waitFor()
  }
  await form.evaluate(el => el.requestSubmit())
  await p.getByText(/^Запит(?: на обраний час)? надіслано$/).first().waitFor()
  const requests = posts.filter(x => x.path.endsWith('/guest-booking-requests/'))
  assert.equal(requests.length, 1)
  assert.equal(requests[0].payload.offer_type, 'intro')
  assert.equal(requests[0].payload.slot_id ?? null, mode === 'direct' ? 100 : null)
  return { mode, width, singleInterceptedPost: true, offerType: 'intro', aboutEscapeFocus: true, shareEscapeFocus: true, phoneSheetResizeIsolation: phone, phoneBackdropAndTabWrap: phone }
}
;(async () => {
  const browser = await chromium.launch()
  try {
    for (const mode of modes) for (const width of widths) {
      const { p, context, gets, posts, errors } = await load(browser, candidatePort, 'v2', mode, width)
      const info = await inspect(p)
      assert.ok(info.scrollWidth <= width)
      assert.equal(info.contactsCount, 1); assert.equal(info.contactsInPanel, false)
      assert.notEqual(info.contactsDisplay, 'none')
      assert.equal(!!info.bar, width < 768)
      assert.equal(info.photo.w, width < 768 ? 88 : width < 800 ? 180 : width < 1100 ? 200 : info.photo.w)
      if (width >= 768) assert.ok(info.contacts.y >= info.panel.bottom - 1, JSON.stringify({ mode, width, info }))
      await p.locator('.pc2-profile-contacts').scrollIntoViewIfNeeded()
      const visible = await p.locator('.pc2-profile-contacts').evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= -1 && r.bottom <= innerHeight + 1 && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.pc2-profile-contacts') === el })
      assert.equal(visible, true, `contacts not truly visible: ${mode}/${width}`)
      if (width < 768) assert.ok(await p.locator('.pc2-profile-contacts').evaluate(el => el.compareDocumentPosition(document.querySelector('.public__final-cta')) & Node.DOCUMENT_POSITION_FOLLOWING))
      if (mode === 'request') assert.equal(gets.filter(x => x.includes('/booking/slots/')).length, 0)
      if ([375, 768, 820, 860, 1100, 1280].includes(width)) {
        await p.evaluate(() => scrollTo(0, 0))
        await p.screenshot({ path: path.join(shots, `${mode}-${width}.png`) })
      }
      await p.locator('.pc2-profile-contacts__action').first().click()
      assert.equal(await p.evaluate(() => window.__copied), 'hello@example.com')
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
      const bottom = await inspect(p)
      let footerTextBottom = null
      if (bottom.bar && bottom.footer) {
        await p.screenshot({ path: path.join(shots, `bottom-${mode}-${width}.png`) })
        const contentBottom = await p.evaluate(() => {
          const walker = document.createTreeWalker(document.querySelector('footer'), NodeFilter.SHOW_TEXT)
          let node, bottom = 0
          while ((node = walker.nextNode())) { if (!node.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(node); const b = r.getBoundingClientRect(); if (b.width && b.height) bottom = Math.max(bottom, b.bottom) }
          return bottom
        })
        footerTextBottom = contentBottom
        assert.ok(contentBottom <= bottom.bar.y + 1, `footer text overlaps sticky bar: ${JSON.stringify({ contentBottom, bar: bottom.bar, footer: bottom.footer, padding: bottom.bodyPadding })}`)
      }
      results.interactions.push(await interaction(p, mode, width, posts))
      assert.deepEqual(errors, [])
      results.rows.push({ mode, width, ...info, actualContactsVisible: visible, footerClearance: bottom.bar ? bottom.bar.y - footerTextBottom : null, pageErrors: errors })
      process.stdout.write(`v2 ${mode}/${width} PASS\n`)
      await context.close()
    }
    for (const mode of modes) {
      const { p, context } = await load(browser, candidatePort, 'v2', mode, 1280, 600)
      await p.locator('.pc2-profile-contacts').scrollIntoViewIfNeeded()
      // Native scrolling rounds scrollTop to CSS pixels; allow subpixel border clipping.
      const visible = await p.locator('.pc2-profile-contacts').evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= -1 && r.bottom <= innerHeight + 1 && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.pc2-profile-contacts') === el })
      await p.screenshot({ path: path.join(shots, `short-${mode}-1280.png`) })
      assert.equal(visible, true, JSON.stringify(await inspect(p)))
      results.shortDesktop.push({ mode, width: 1280, height: 600, contactsVisibleByDocumentScroll: visible })
      await context.close()
    }
    // All requested widths and modes: exact v1 candidate/baseline viewport parity.
    for (const mode of modes) for (const width of widths) {
      const files = []
      for (const [label, port] of [['baseline', baselinePort], ['candidate', candidatePort]]) {
        const { p, context } = await load(browser, port, 'v1', mode, width)
        const file = path.join(parityDir, `${mode}-${width}-${label}.png`)
        await p.screenshot({ path: file }); files.push(file)
        await context.close()
      }
      const code = 'from PIL import Image,ImageChops; import sys; a,b=[Image.open(p).convert("RGB") for p in sys.argv[1:]]; raw=ImageChops.difference(a,b).tobytes(); print(sum(1 for i in range(0,len(raw),3) if raw[i:i+3]!=bytes(3)))'
      const changed = Number(execFileSync('python', ['-c', code, ...files], { encoding: 'utf8' }).trim())
      assert.equal(changed, 0, `v1 parity ${mode}/${width}`)
      results.parity.push({ mode, width, changedPixels: changed })
      process.stdout.write(`v1 ${mode}/${width} ${changed} changed pixels\n`)
    }
  } finally {
    await browser.close()
    fs.writeFileSync(path.join(output, 'browser.json'), JSON.stringify(results, null, 2) + '\n')
  }
})().catch(e => { console.error(e); process.exitCode = 1 })
