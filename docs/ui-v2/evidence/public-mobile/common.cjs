// Browser acceptance helpers for Public Mobile P1–P6. API responses below are BROWSER FIXTURES
// (Playwright route interception), not backend acceptance. Real backend contracts are unchanged.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')

const out = __dirname
const repo = path.resolve(__dirname, '../../../..')
const source = '/docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/'
const candidate = 'http://127.0.0.1:5371'
const baseline = 'http://127.0.0.1:5372'
const WIDTHS = [375, 390, 640, 768, 1280, 1440]

const specialist = (i, extra) => ({
  slug: `fixture-${i}`, public_slug: `fixture-${i}`, public_profile_path: `/s/fixture-${i}`,
  display_name: extra.name, public_display_name: extra.name, public_profile_summary: 'Фікстура браузерного тесту.',
  specializations: extra.specializations, location: 'Київ', offers_online: true, offers_offline: Boolean(extra.offline),
  price: extra.price, price_currency: 'UAH', photo_url: extra.photo || null, match_kind: null,
})
const items = [
  specialist(1, { name: 'Марія Коваль', specializations: ['Психологиня · КПТ', 'тривога', 'вигорання', 'стосунки'], price: '500', photo: source + 'assets/maria-koval.webp' }),
  specialist(2, { name: 'Андрій Лисенко', specializations: ['Психолог · гештальт', 'тривога', 'стосунки'], price: '900', offline: true }),
  specialist(3, { name: 'Олена Бондар', specializations: ['Психотерапевтка', 'втрата', 'сон'], price: '1200' }),
]
function discovery(url) {
  const format = url.searchParams.get('format')
  const list = format === 'offline' ? items.filter((x) => x.offers_offline) : items
  return {
    query: url.searchParams.get('q'), resolved_request_groups: [], applied_filters: { request_group: url.searchParams.get('request_group'), direction: url.searchParams.get('direction'), format },
    groups: [{ code: 'all_specialists', label: 'Усі спеціалісти Pro Consult', total: list.length, items: list }],
    page: 1, page_size: 50, total: list.length, total_pages: list.length ? 1 : 0,
  }
}

async function context(browser, width, { motion = 'no-preference', video = false, height } = {}) {
  const h = height || (width < 768 ? 780 : 900)
  const c = await browser.newContext({ viewport: { width, height: h }, reducedMotion: motion, deviceScaleFactor: 1, hasTouch: width < 768, ...(video ? { recordVideo: { dir: path.join(out, 'recordings', '_tmp'), size: { width, height: h } } } : {}) })
  await c.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })))
  await c.route('**/*', (r) => {
    const host = new URL(r.request().url()).hostname
    return ['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(host) ? r.continue() : r.abort()
  })
  await c.route('**/api/**', async (r) => {
    const url = new URL(r.request().url())
    if (url.pathname.endsWith('/public/specialists/discovery/')) return r.fulfill({ json: discovery(url) })
    return r.fulfill({ status: url.pathname.includes('/auth/') ? 401 : 200, json: [] })
  })
  const p = await c.newPage()
  p.setDefaultTimeout(15000)
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  return { c, p, errors }
}
async function settle(p, ms = 700) {
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(ms)
}
async function noOverflow(p) {
  return p.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, ok: document.documentElement.scrollWidth <= window.innerWidth }))
}
module.exports = { chromium, fs, path, out, repo, source, candidate, baseline, WIDTHS, context, settle, noOverflow }
