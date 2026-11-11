const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const fs = require('fs'), assert = require('assert');
const out = 'docs/ui-v2/evidence/kan-159/integration';
(async () => {
  const browser = await chromium.launch();
  const rows = [];
  try {
    for (const width of [375, 390, 640, 768, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1', JSON.stringify({ version: 1, preference: 'denied' })));
      await context.route('**/api/**', route => route.fulfill({ status: 401, json: { detail: 'Explicit auth navigation fixture' } }));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://localhost:5370/?ui=v2', { waitUntil: 'networkidle' });
      await page.locator('header a[href="/signup"]:visible').first().click();
      await page.waitForURL(url => url.pathname === '/signup');
      await page.locator('[name=first_name]').waitFor();
      assert.equal(await page.locator('html').getAttribute('data-ui'), 'v2');
      await page.goBack();
      await page.waitForURL(url => url.pathname === '/');
      await page.goForward();
      await page.waitForURL(url => url.pathname === '/signup');
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('.pc2-registration-wizard').count(), 1);
      await page.goto('http://localhost:5370/login?ui=v2', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Я спеціаліст', exact: true }).click();
      await page.locator('.pc2-login__foot a[href="/signup"]').click();
      await page.waitForURL(url => url.pathname === '/signup');
      const geometry = await page.evaluate(() => {
        const header = document.querySelector('header').getBoundingClientRect();
        const progress = document.querySelector('.pc2-registration-progress').getBoundingClientRect();
        const actions = document.querySelector('.pc2-registration-actions').getBoundingClientRect();
        return { headerBottom: header.bottom, progressTop: progress.top, actionsTop: actions.top, actionsBottom: actions.bottom, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert(!geometry.overflow);
      assert(geometry.progressTop >= geometry.headerBottom);
      assert.equal(await page.locator('.pc2-registration-actions').count(), 1);
      if (width < 768) assert.equal(geometry.actionsBottom, 900);
      if (width < 768) assert.equal(await page.locator('header a[href="/signup"]:visible').count(), 0);
      assert.equal(errors.length, 0);
      await page.screenshot({ path: `${out}/navigation-${width}.png`, fullPage: true, animations: 'disabled' });
      await page.goto('http://localhost:5370/signup-client?ui=v2', { waitUntil: 'networkidle' });
      await page.locator('main a[href="/login"]:visible').first().click();
      await page.waitForURL(url => url.pathname === '/login');
      await page.goBack();
      await page.waitForURL(url => url.pathname === '/signup-client');
      await page.locator('[name=first_name]').waitFor();
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('html').getAttribute('data-ui'), 'v2');
      assert.equal(errors.length, 0);
      rows.push({ width, homeCTA: true, browserBackForward: true, reload: true, loginToSignup: true, clientLoginBackReload: true, uiV2Preserved: true, singleWizard: true, geometry, pageErrors: errors });
      await context.close();
    }
    fs.writeFileSync(`${out}/navigation.json`, JSON.stringify(rows, null, 2) + '\n');
    console.log('PASS: public header CTA, login/signup, history, reload, single wizard and non-overlapping geometry at five widths');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
