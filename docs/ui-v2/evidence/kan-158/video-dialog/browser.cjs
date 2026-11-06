// Synthetic, intercepted API only. No requests reach Django or a real specialist.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core')
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const root = process.cwd()
const spec = fs.readFileSync(path.join(root, 'src/views/PublicProfileView.spec.ts'), 'utf8')
const literal = spec.split('const base: PublicSpecialistProfile = {')[1].split('\n  }')[0]
const base = new Function(`return ({${literal}})`)()
const widths = [375, 390, 768, 820, 1100, 1280]
const now = new Date('2026-10-26T09:00:00Z')
const output = process.env.VIDEO_EVIDENCE || require('node:os').tmpdir() + '/kan158-video-browser', shots = path.join(output, 'screenshots')
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
    if (u.pathname === '/audit-photo.svg') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="200"><rect width="160" height="200" fill="#abc"/><text x="16" y="100">Synthetic</text></svg>' });
    if (u.pathname === '/audit-video.webm') return route.fulfill({ contentType: 'video/webm', body: fs.readFileSync(path.join(__dirname, 'audit-video.webm')) });
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


const checks = [], parity = [], failures = []
const port = Number(process.env.VIDEO_PORT || 5510)
const baseline = Number(process.env.VIDEO_BASELINE_PORT || 5511)
;(async () => {
  const browser = await chromium.launch()
  try {
    for (const width of widths) {
      const before = await load(browser, baseline, 'v2', 'direct', width, 900, { profile: { video_url: `http://localhost:${baseline}/audit-video.webm` } }); await before.p.getByRole('button', {name: 'Відеовізитка',exact:true}).click(); const beforeGeometry = await before.p.locator('.profile-video-modal').boundingBox(); await before.p.screenshot({path:path.join(shots, `before-${width}.png`)}); await before.context.close();
      const { p, context, errors, posts } = await load(browser, port, 'v2', 'direct', width, 900, { profile: { video_url: `http://localhost:${port}/audit-video.webm` } })
      await p.emulateMedia({ reducedMotion: width < 768 ? 'reduce' : 'no-preference' }); const trigger = p.getByRole('button', { name: 'Відеовізитка', exact: true })
      await trigger.click()
      const dialog = p.getByRole('dialog', { name: 'Відеовізитка', exact: true })
      await dialog.waitFor()
      const close = dialog.getByRole('button', { name: 'Закрити', exact: true })
      await p.waitForFunction(() => document.activeElement?.hasAttribute('data-video-initial-focus'))
      assert.equal(await dialog.getAttribute('aria-modal'), 'true')
      assert.equal(await dialog.evaluate(el => el.matches(':modal')), true)
      await p.waitForFunction(() => document.querySelector('.profile-video-modal video')?.readyState >= 2)
      assert.equal(await dialog.locator('video').evaluate(v => v.error), null)
      const y = await p.evaluate(() => scrollY)
      const tabs = []
      for (const key of ['Tab', 'Shift+Tab']) for (let i = 0; i < 12; i++) {
        await p.keyboard.press(key)
        const inside = await dialog.evaluate(el => el.contains(document.activeElement))
        tabs.push({ key, inside, active: await p.evaluate(() => document.activeElement?.tagName) })
        assert.equal(inside, true, `focus escaped at ${width}/${key}/${i}`)
      }
      await dialog.locator('video').focus(); await p.keyboard.press('PageDown'); await p.keyboard.press('Space')
      await p.mouse.move(2, 2); await p.mouse.wheel(0, 900)
      await p.waitForTimeout(100)
      assert.equal(await p.evaluate(() => scrollY), y, 'background scroll')
      assert.deepEqual(await p.evaluate(() => [document.body.style.overflow, document.documentElement.style.overflow]), ['', 'hidden'])
      await p.screenshot({ path: path.join(shots, `after-${width}.png`) })
      const geometry = await p.locator('.profile-video-modal').boundingBox(); assert.deepEqual(geometry, beforeGeometry, 'video appearance geometry '+JSON.stringify({geometry,beforeGeometry})); assert.equal(await dialog.evaluate(el => getComputedStyle(el, '::backdrop').backgroundColor), 'rgba(0, 0, 0, 0)')
      await p.keyboard.press('Escape')
      await p.waitForFunction(() => !document.querySelector('dialog.pc2-profile-overlay--video')?.open)
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true)
      assert.deepEqual(await p.evaluate(() => [document.body.style.overflow, document.documentElement.style.overflow]), ['', ''])
      assert.equal(await p.locator('.profile-video-modal video').count(), 0, 'closed video must stop/unmount')
      await p.evaluate(() => scrollTo(0, 60)); const scrollBeforeReopen = await p.evaluate(() => scrollY); await trigger.evaluate(el => el.focus({preventScroll:true})); await p.keyboard.press('Enter'); await p.waitForFunction(() => document.querySelector('dialog.pc2-profile-overlay--video')?.open); assert.equal(await p.evaluate(() => scrollY), scrollBeforeReopen); await close.click(); await p.waitForFunction(() => !document.querySelector('dialog.pc2-profile-overlay--video')?.open); assert.equal(await p.evaluate(() => scrollY), scrollBeforeReopen)
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true)
      await trigger.click(); await p.mouse.click(2, 2)
      await p.waitForFunction(() => !document.querySelector('dialog.pc2-profile-overlay--video')?.open)
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true)
      // Trigger removal while open must not focus a detached element.
      await trigger.click(); await p.waitForFunction(() => document.querySelector('dialog.pc2-profile-overlay--video')?.open); await trigger.evaluate(el => el.remove())
      await p.keyboard.press('Escape')
      await p.waitForFunction(() => !document.querySelector('dialog.pc2-profile-overlay--video')?.open)
      assert.equal(await p.locator('.pc2-profile-hero-share').evaluate(el => el === document.activeElement), true)
      // Real route unmount restores global state and native top-layer isolation.
      await p.reload(); await p.locator('h1').waitFor(); await trigger.click()
      await p.evaluate(() => { history.pushState({}, '', '/for-clients?ui=v2'); dispatchEvent(new PopStateEvent('popstate')) })
      await p.waitForFunction(() => !document.querySelector('.pc2-profile-overlay--video'))
      assert.deepEqual(await p.evaluate(() => [document.body.style.overflow, document.documentElement.style.overflow]), ['', ''])
      assert.equal(await p.evaluate(() => !!document.querySelector(':modal')), false)
      assert.deepEqual(errors, []); assert.deepEqual(posts.filter(post => post.path !== '/api/auth/token/refresh/'), [])
      checks.push({ width, result: 'PASS', tabs, geometry, scrollY: y, escape: true, backdrop: true, reopen: true, removedTriggerFallback: true, unmount: true, errors, posts })
      await context.close()
      console.log(`v2 ${width} PASS`)
    }
    for (const width of widths) {
      const files = []
      for (const [label, server] of [['baseline', baseline], ['candidate', port]]) {
        const { p, context } = await load(browser, server, 'v1', 'direct', width, 900, { profile: { video_url: `http://localhost:${server}/audit-video.webm` } })
        for (const state of ['page', 'video']) {
          if (state === 'video') await p.getByRole('button', { name: 'Відеовізитка', exact: true }).click()
          if (state === 'video') { await p.waitForFunction(() => document.querySelector('.profile-video-modal video')?.readyState >= 2); await p.locator('video').evaluate(v => {v.pause(); v.currentTime = 0}); await p.waitForTimeout(150) }
          const file = path.join(output, `v1-${width}-${state}-${label}.png`)
          await p.screenshot({ path: file, mask: state === 'video' ? [p.locator('.profile-video-modal video')] : [] }); files.push({ state, label, file })
        }
        await context.close()
      }
      for (const state of ['page', 'video']) {
        const pair = files.filter(f => f.state === state).map(f => f.file)
        const code = 'from PIL import Image,ImageChops; import sys; a,b=[Image.open(p).convert("RGB") for p in sys.argv[1:]]; raw=ImageChops.difference(a,b).tobytes(); print(sum(1 for i in range(0,len(raw),3) if raw[i:i+3]!=bytes(3)))'
        const changed = Number(execFileSync('python', ['-c', code, ...pair], { encoding: 'utf8' }).trim())
        assert.equal(changed, 0, `v1 ${width}/${state}`)
        parity.push({ width, state, changedPixels: changed, mediaMasked: state === 'video' })
      }
      console.log(`v1 ${width} page/video parity PASS`)
    }
  } catch (e) { failures.push(e.stack); throw e }
  finally { await browser.close(); fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checks, parity, failures }, null, 2)) }
})().catch(e => { console.error(e); process.exitCode = 1 })
