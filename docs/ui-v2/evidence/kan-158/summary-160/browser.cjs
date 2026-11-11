// Fixture-only editor acceptance. No real backend or private account data.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const root = path.resolve(__dirname, '../../../../..')
const testSource = fs.readFileSync(path.join(root, 'src/views/TherapistProfileView.spec.ts'), 'utf8')
const fixtureBody = testSource.split('function makeProfile(')[1].split('  return {')[1].split('\n}\n')[0]
const makeProfile = new Function('overrides', 'window', `return {${fixtureBody}`)
const origin = process.env.SUMMARY_BROWSER_ORIGIN || 'http://localhost:5460'
const rows = []
;(async () => {
  const browser = await chromium.launch()
  try {
    for (const ui of ['v1', 'v2']) for (const width of [375, 1280]) {
      let profile = makeProfile({}, { location: { origin } })
      const patches = []
      const errors = []
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
      await context.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })))
      await context.route('**/*', async route => {
        const req = route.request()
        const url = new URL(req.url())
        if (url.port === '8460') {
          let body = []
          if (url.pathname === '/api/auth/token/refresh/') body = { access: 'synthetic-editor-fixture' }
          else if (url.pathname === '/api/me/') body = {
            user: { id: 5, email: 'synthetic@example.test', role: 'SPECIALIST', roles: ['SPECIALIST'], email_verification_state: 'verified' },
            access_state: 'active', effective_entitlements: { plan: 'pro', active_client_limit: 10, pair_enabled: true, group_room_enabled: true },
            counts: { active_clients: 0, prospect_clients: 0, upcoming_sessions_count: 0 }, product_updates: [], server_time: '2026-10-26T09:00:00Z'
          }
          else if (url.pathname === '/api/cabinet/profile/') {
            if (req.method() === 'PATCH') {
              const payload = req.postDataJSON()
              patches.push(payload)
              profile = { ...profile, ...payload }
            }
            body = profile
          }
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
        }
        if (url.origin !== origin) return route.abort()
        return route.continue()
      })
      const page = await context.newPage()
      page.on('pageerror', e => errors.push(e.message))
      const load = async () => {
        await page.goto(`${origin}/cabinet/profile?ui=${ui}`)
        await page.locator('#publicProfileSummary').waitFor()
      }
      const save = () => page.getByRole('button', { name: 'Зберегти зміни', exact: true }).click()
      const field = page.locator('#publicProfileSummary')
      await load()
      await field.fill('я'.repeat(161))
      await save()
      assert.equal(patches.length, 0)
      assert.equal(await field.inputValue(), 'я'.repeat(161))
      assert.equal(await field.getAttribute('aria-invalid'), 'true')
      assert.equal(await field.evaluate(el => el === document.activeElement), true)
      await field.locator('..').screenshot({ path: path.join(__dirname, `invalid-${ui}-${width}.png`) })
      for (const length of [0, 159, 160]) {
        const summary = length ? ` ${'я'.repeat(length - 2)} ` : ''
        await field.fill(summary)
        const before = patches.length
        await save()
        await page.waitForFunction(() => document.querySelector('.profile-save-feedback--success'))
        assert.equal(patches.length, before + 1)
        assert.equal(patches.at(-1).public_profile_summary, summary)
        assert.equal(await field.inputValue(), summary)
        if (length === 160) await field.locator('..').screenshot({ path: path.join(__dirname, `normal-${ui}-${width}.png`) })
      }
      const legacy = ` ${'я'.repeat(238)} `
      profile.public_profile_summary = legacy
      await load()
      assert.equal(await field.inputValue(), legacy)
      assert.equal(await field.getAttribute('aria-invalid'), 'false')
      await page.getByLabel('Публічне ім’я', { exact: true }).fill('Тестовий спеціаліст')
      let before = patches.length
      await save()
      await page.waitForFunction(() => document.querySelector('.profile-save-feedback--success'))
      assert.equal(patches.length, before + 1)
      assert.equal(Object.hasOwn(patches.at(-1), 'public_profile_summary'), false)
      assert.equal(await field.inputValue(), legacy)
      await page.reload()
      await field.waitFor()
      assert.equal(await field.inputValue(), legacy)
      await field.locator('..').screenshot({ path: path.join(__dirname, `legacy-${ui}-${width}.png`) })
      await field.fill('я'.repeat(239))
      before = patches.length
      await save()
      assert.equal(patches.length, before)
      await field.fill('я'.repeat(160))
      await save()
      await page.waitForFunction(() => document.querySelector('.profile-save-feedback--success'))
      assert.equal(patches.length, before + 1)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
      assert.equal(overflow, false)
      assert.deepEqual(errors, [])
      rows.push({ ui, width, result: 'PASS', boundaryLengths: [0, 159, 160, 161], legacyLength: 240, legacyOmittedFromPatch: true, legacyReloadExact: true, editedLegacyBlocked: true, patches: patches.length, overflow, pageErrors: errors })
      await context.close()
    }
  } finally {
    await browser.close()
    fs.writeFileSync(path.join(__dirname, 'browser.json'), JSON.stringify({ mode: 'isolated browser fixtures; no real backend validation', rows }, null, 2) + '\n')
  }
})().catch(e => { console.error(e); process.exitCode = 1 })
