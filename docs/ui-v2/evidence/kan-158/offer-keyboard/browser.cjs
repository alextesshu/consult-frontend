// Synthetic, intercepted API only. No requests reach Django or a real specialist.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core')
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const root = process.cwd()
const spec = fs.readFileSync(path.join(root, 'src/views/PublicProfileView.spec.ts'), 'utf8')
const literal = spec.split('const base: PublicSpecialistProfile = {')[1].split('\n  }')[0]
const base = new Function(`return ({${literal}})`)()
const widths = [390, 1280]
const now = new Date('2026-10-26T09:00:00Z')
const output = process.env.OFFER_EVIDENCE || require('node:os').tmpdir() + '/kan158-offer-keyboard', shots = path.join(output, 'screenshots')
fs.mkdirSync(shots, { recursive: true })
async function load(browser, port, ui, mode, width, height = width < 768 ? 812 : 1024, options = {}) {
  const origin = `http://localhost:${port}`
  const context = await browser.newContext({ viewport: { width, height }, locale: 'uk-UA', timezoneId: options.timezoneId || 'Europe/Kyiv', reducedMotion: 'reduce' })
  await context.clock.install({ time: now })
  await context.addInitScript(() => {
    localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' }))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text } } })
  })
  const posts = [], gets = [], errors = []
  const profile = { ...base, public_profile_summary: 'Допомагаю краще розуміти себе, долати тривогу й будувати стосунки.', photo_url: '', video_url: '', public_display_name: 'Олександра Константинова', display_name: 'Олександра Константинова' }
  Object.assign(profile, options.profile || {})
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
      else if (u.pathname === '/api/booking/slots/') { body = mode === 'direct' ? (options.slots || [slot]) : []; const from = u.searchParams.get('date_from'), to = u.searchParams.get('date_to'); body = body.filter(s => (!from || s.start_at >= from) && (!to || s.start_at <= to)); }
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


const checks = [], failures = []
const port = Number(process.env.OFFER_PORT || 5520)
const names = ['Консультація', 'Ознайомча сесія', 'Парна консультація']
const prices = ['1500 грн', '600 грн', '2000 грн']
const types = ['standard', 'intro', 'couple']
const allOffers = { couple_session_enabled: true, couple_session_price: '2000', couple_session_price_currency: 'UAH', couple_session_duration_minutes: 80 }
const slots = [{ id: 100, therapist: 12, start_at: '2026-10-27T10:00:00Z', end_at: '2026-10-27T11:20:00Z', is_available: true }]
async function tabTo(p, locator) {
  for (let n = 0; n < 100; n++) {
    if (await locator.evaluate(el => el === document.activeElement)) return n
    await p.keyboard.press('Tab')
  }
  throw new Error('Tab did not reach '+await locator.getAttribute('aria-label'))
}
async function focused(locator) { assert.equal(await locator.evaluate(el => el === document.activeElement), true) }
async function openSheet(p, width) {
  if (width < 768 && !(await p.locator('.pc2-profile-overlay--request').evaluate(el => el.open))) {
    await tabTo(p, p.locator('.pc2-profile-mobile-cta')); await p.keyboard.press('Enter')
    await p.waitForFunction(() => document.querySelector('.pc2-profile-overlay--request')?.open)
  }
}
async function summary(p, width, index) {
  const final = await p.locator('.pc2-final-cta__summary').textContent()
  assert.ok(final.includes(names[index]) && final.includes(prices[index]), final)
  const pressed = p.locator('.identity-rail__service[aria-pressed="true"]')
  assert.equal(await pressed.count(), 1)
  assert.ok((await pressed.getAttribute('aria-label')).includes(names[index]))
  if (width < 768) {
    const bar = await p.locator('.pc2-profile-bottom-bar').innerText()
    assert.ok(bar.includes(names[index]) && bar.includes(prices[index]), bar)
  }
  return final
}
;(async () => {
  const browser = await chromium.launch()
  try {
    for (const width of widths) for (const mode of ['direct', 'empty', 'request']) {
      const { p, context, errors, gets } = await load(browser, port, 'v2', mode, width, 900, { profile: allOffers, slots })
      const posts = []; let release, reached
      const requestReached = new Promise(resolve => { reached = resolve })
      await context.route('**/guest-booking-requests/', async route => {
        posts.push(route.request().postDataJSON()); reached()
        await new Promise(resolve => { release = resolve })
        await route.fulfill({ status: 201, json: { request: { id: 901, status: 'PENDING', created_at: now.toISOString(), next_step: null } } })
      })
      assert.equal(await p.locator('.identity-rail__service[aria-pressed="true"]').count(), 0)
      await openSheet(p, width)
      const buttons = p.locator('.identity-rail__service')
      assert.equal(await buttons.count(), 3)
      for (let i = 0; i < 3; i++) assert.equal(await p.getByRole('button', {name: `${names[i]}: ${prices[i]}`, exact:true}).count(), 1)
      const tabSteps = await tabTo(p, buttons.nth(0))
      await p.keyboard.press('Tab'); await focused(buttons.nth(1))
      await p.keyboard.press('Tab'); await focused(buttons.nth(2))
      await p.keyboard.press('Shift+Tab'); await focused(buttons.nth(1))
      await p.keyboard.press('Shift+Tab'); await focused(buttons.nth(0))
      const focusStyle = await buttons.nth(0).evaluate(el => ({ visible:el.matches(':focus-visible'), width:getComputedStyle(el).outlineWidth, style:getComputedStyle(el).outlineStyle, color:getComputedStyle(el).outlineColor }))
      assert.equal(focusStyle.visible, true); assert.ok(parseFloat(focusStyle.width) >= 2); assert.notEqual(focusStyle.style, 'none')
      const selections = []
      await p.keyboard.press('Enter'); selections.push(await summary(p, width, 0))
      await p.keyboard.press('Tab'); await p.keyboard.press('Space'); selections.push(await summary(p, width, 1))
      await p.keyboard.press('Tab'); await p.keyboard.press('Enter'); selections.push(await summary(p, width, 2))
      // A second activation must not leave zero selected offers.
      await p.keyboard.press('Space'); await summary(p, width, 2)
      await p.screenshot({path:path.join(shots, `focus-${mode}-${width}.png`)})
      if (width < 768) {
        await p.keyboard.press('Escape')
        await p.waitForFunction(() => !document.querySelector('.pc2-profile-overlay--request')?.open)
        await focused(p.locator('.pc2-profile-mobile-cta'))
        const bar = await p.locator('.pc2-profile-bottom-bar').innerText()
        assert.ok(bar.includes('2000 грн') && bar.includes('Парна'), bar)
        await p.screenshot({path:path.join(shots, `sticky-${mode}-${width}.png`)})
        await p.keyboard.press('Enter'); await p.waitForFunction(() => document.querySelector('.pc2-profile-overlay--request')?.open)
      }
      const index = mode === 'direct' ? 2 : mode === 'empty' ? 0 : 1
      await tabTo(p, buttons.nth(index)); await p.keyboard.press(index === 1 ? 'Space' : 'Enter')
      await summary(p, width, index)
      const cta = mode === 'direct' ? p.getByRole('button', {name:'Надіслати запит на цей час',exact:true}).first() : p.locator('.identity-rail__actions button.btn--primary').first()
      await tabTo(p, cta); await p.keyboard.press('Enter')
      const form = p.locator('.guest-booking-form')
      await form.waitFor()
      assert.ok((await form.locator('.guest-offer-summary').innerText()).includes(names[index]))
      // Close the actual request form, then reach and activate an offer again.
      const close = p.locator('.guest-booking-modal .setting-modal__header button').first()
      await tabTo(p, close); await p.keyboard.press('Enter')
      if (width < 768) await openSheet(p, width)
      await tabTo(p, buttons.nth(index)); await p.keyboard.press('Space'); await summary(p, width, index)
      await tabTo(p, cta); await p.keyboard.press('Enter'); await form.waitFor()
      await p.getByLabel('Ім’я', {exact:true}).fill('Синтетичний гість')
      await p.getByLabel('Як спеціаліст може з вами зв’язатися?', {exact:true}).fill('guest@example.test')
      const consent = form.locator('.setting-check input'); if (await consent.count()) await consent.first().check()
      const submit = form.locator('button[type=submit]'); await tabTo(p, submit); await p.keyboard.press('Enter')
      await requestReached
      assert.equal(posts.length, 1); assert.equal(posts[0].offer_type, types[index]); assert.equal(posts[0].slot_id ?? null, mode === 'direct' ? 100 : null)
      assert.equal(await submit.isDisabled(), true)
      const change = form.getByRole('button', {name:'Змінити',exact:true})
      if (await change.count()) assert.equal(await change.isDisabled(), true)
      // Native disabled controls cannot receive keyboard focus or activate.
      await submit.evaluate(el => el.focus()); await p.keyboard.press('Enter'); await p.keyboard.press('Space')
      assert.equal(posts.length, 1)
      release(); await p.getByText(/^Запит(?: на обраний час)? надіслано$/).first().waitFor()
      assert.equal(posts.length, 1)
      assert.deepEqual(errors, []); assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      if(mode === 'request') assert.equal(gets.filter(s => s.includes('/booking/slots/')).length, 0)
      checks.push({width,mode,tabSteps,order:types,focusStyle,selections,payload:posts[0],pendingSubmissionLocked:true,afterDialogKeyboard:true,errors})
      await context.close(); console.log(`${width}/${mode} PASS`)
    }
    // Open without a choice, then use the request form's own native controls.
    for (const width of widths) {
      const {p,context,errors,posts} = await load(browser,port,'v2','request',width,900,{profile:allOffers})
      await openSheet(p,width)
      const cta=p.locator('.identity-rail__actions button.btn--primary').first()
      await tabTo(p,cta); await p.keyboard.press('Enter')
      const form=p.locator('.guest-booking-form'); await form.waitFor()
      const options=form.locator('.guest-offer-option'); assert.equal(await options.count(),3)
      await tabTo(p,options.nth(0)); await p.keyboard.press('Tab'); await focused(options.nth(1))
      await p.keyboard.press('Space'); await summary(p,width,1)
      await tabTo(p,form.getByRole('button',{name:'Змінити',exact:true})); await p.keyboard.press('Enter')
      assert.equal(await options.count(),3)
      assert.equal(await form.locator('.guest-offer-option[aria-pressed="true"]').count(),1)
      await tabTo(p,options.nth(2)); await p.keyboard.press('Enter'); await summary(p,width,2)
      assert.ok((await form.locator('.guest-offer-summary').innerText()).includes('2000 грн'))
      await p.screenshot({path:path.join(shots, `form-keyboard-${width}.png`)})
      assert.equal(posts.filter(post=>post.path.endsWith('/guest-booking-requests/')).length,0)
      assert.deepEqual(errors,[]); checks.push({width,mode:'form-keyboard',enter:true,space:true,mutuallyExclusive:true,errors}); await context.close()
    }
    // Missing public price/disabled service is absent, including after form open.
    for (const width of widths) {
      const {p,context,errors} = await load(browser,port,'v2','request',width,900,{profile:{intro_price:null,intro_price_currency:null,couple_session_enabled:false}})
      await openSheet(p,width)
      assert.equal(await p.locator('.identity-rail__service').count(),1)
      for(const name of names.slice(1)) assert.equal(await p.getByRole('button',{name:new RegExp('^'+name+':')}).count(),0)
      const only=p.locator('.identity-rail__service'); await tabTo(p,only); await p.keyboard.press('Space'); await summary(p,width,0)
      const cta=p.locator('.identity-rail__actions button.btn--primary').first(); await tabTo(p,cta); await p.keyboard.press('Enter')
      await p.locator('.guest-booking-form').waitFor(); assert.equal(await p.locator('.guest-offer-option').count(),0)
      assert.deepEqual(errors,[]); checks.push({width,mode:'unavailable',onlyStandard:true,errors}); await context.close()
    }
  } catch(e) { failures.push(e.stack); throw e }
  finally {await browser.close(); fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({fixtureOnly:true,checks,failures},null,2))}
})().catch(e=>{console.error(e);process.exitCode=1})
