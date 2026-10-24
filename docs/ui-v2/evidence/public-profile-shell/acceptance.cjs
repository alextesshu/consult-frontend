// Chromium acceptance for /s/:slug header and footer: role × UI × width matrix, interactions, before/after captures
// and full-page v2 captures of other public pages for the unchanged-page comparison (compare.py).
const { chromium, fs, path, out, candidate, baseline, WIDTHS, open, ready, warm, overflow, slug } = require('./common.cjs')
const PROMO = ['/specialists', '/signup', '/pricing', '/faq', '/disclaimer', '/#features', '/for-clients']
const DISCLAIMER = 'Інформацію на сторінці надає спеціаліст. Pro Consult не перевіряє кваліфікацію і не бере комісію з консультацій.'
const shots = path.join(out, 'screenshots')
fs.mkdirSync(shots, { recursive: true })

function chrome(p) {
  return p.evaluate((promo) => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const control = (el) => ({ tag: el.tagName.toLowerCase(), name: (el.getAttribute('aria-label') || el.textContent).replace(/\s+/g, ' ').trim(), href: el.getAttribute('href') })
    const header = document.querySelector('header.topbar')
    const footer = document.querySelector('footer.footer')
    const lockup = header?.querySelector('.brand img:not([style*="display: none"])')
    const hControls = header ? [...header.querySelectorAll('a, button')].filter((el) => visible(el) && !el.closest('.mobile-menu, .notif-panel, .settings-menu')).map(control) : []
    const fControls = footer ? [...footer.querySelectorAll('a, button')].filter(visible).map(control) : []
    return {
      header: header && { classes: header.className, height: Math.round(header.getBoundingClientRect().height), position: getComputedStyle(header).position, lockup: lockup && { src: lockup.getAttribute('src').split('/').pop(), height: Math.round(lockup.getBoundingClientRect().height) }, controls: hControls },
      footer: footer && { classes: footer.className, controls: fControls, disclaimer: footer.textContent.includes('Інформацію на сторінці надає спеціаліст'), lockup: footer.querySelector('img:not(.pc2-footer__watermark)')?.getAttribute('src').split('/').pop() },
      promoInChrome: [...(header?.querySelectorAll('a') || []), ...(footer?.querySelectorAll('a') || [])].map((a) => a.getAttribute('href')).filter((h) => promo.includes(h)),
    }
  }, PROMO)
}

;(async () => {
  const browser = await chromium.launch()
  await warm(browser, ['/s/olena', '/', '/for-clients', '/specialists', '/faq', '/s/olena/journal', '/login'])
  const rows = []
  const problems = []
  const fail = (msg) => problems.push(msg)

  // 1. Matrix: /s/olena on the candidate; v1 rows are also compared with the origin/dev baseline.
  for (const width of WIDTHS) for (const role of ['guest', 'specialist', 'client']) for (const ui of ['v1', 'v2']) {
    const row = { width, role, ui }
    for (const [label, base] of [['candidate', candidate], ['baseline', baseline]]) {
      const { c, p, errors } = await open(browser, width, { role })
      await p.goto(`${base}/s/olena?ui=${ui}`)
      const state = await ready(p, '/s/olena')
      row[label] = { ...(await chrome(p)), overflow: await overflow(p), errors, state }
      await c.close()
    }
    const cand = row.candidate
    const id = `${ui} ${role} ${width}`
    if (!cand.overflow.ok) fail(`${id}: horizontal overflow ${cand.overflow.scrollWidth}`)
    if (cand.errors.length) fail(`${id}: page errors ${cand.errors.join(' | ')}`)
    if (cand.promoInChrome.length) fail(`${id}: promotion in chrome ${cand.promoInChrome}`)
    if (ui === 'v1') {
      if (JSON.stringify({ h: cand.header, f: cand.footer }) !== JSON.stringify({ h: row.baseline.header, f: row.baseline.footer })) fail(`${id}: v1 chrome differs from baseline`)
    } else {
      const signedIn = role !== 'guest'
      const mobile = width < 768
      if (!cand.header.classes.includes(signedIn ? 'pc2-public-auth-header' : 'pc2-header')) fail(`${id}: header class ${cand.header.classes}`)
      if (cand.header.height !== (mobile ? 60 : 76)) fail(`${id}: header height ${cand.header.height}`)
      if (cand.header.position !== 'sticky') fail(`${id}: header position ${cand.header.position}`)
      if (cand.header.lockup?.src !== 'proconsult-fennec-header.svg' || cand.header.lockup.height !== (mobile ? 30 : 32)) fail(`${id}: lockup ${JSON.stringify(cand.header.lockup)}`)
      const hrefs = cand.header.controls.map((x) => x.href)
      if (!signedIn && !hrefs.includes('/login')) fail(`${id}: guest login not visible`)
      if (signedIn && !hrefs.includes(role === 'specialist' ? '/cabinet' : '/client')) fail(`${id}: cabinet entry not visible`)
      if (signedIn && !cand.header.controls.some((x) => x.name === 'Сповіщення')) fail(`${id}: notifications not visible`)
      if (signedIn && !cand.header.controls.some((x) => x.name === (mobile ? 'Меню' : 'Вийти'))) fail(`${id}: ${mobile ? 'menu' : 'logout'} not visible`)
      if (!cand.footer.classes.includes('pc2-footer') || !cand.footer.classes.includes('footer--specialist-owned')) fail(`${id}: footer class ${cand.footer.classes}`)
      if (!cand.footer.disclaimer) fail(`${id}: footer disclaimer missing`)
      if (cand.footer.lockup !== 'proconsult-fennec-lockup.svg') fail(`${id}: footer lockup ${cand.footer.lockup}`)
      const fh = cand.footer.controls.map((x) => x.href || x.name)
      for (const need of ['/privacy', '/terms', '/support-and-data-requests', 'Налаштування конфіденційності']) if (!fh.includes(need)) fail(`${id}: footer missing ${need}`)
    }
    rows.push(row)
  }

  // 2. Interactions on the candidate (v2).
  const interactions = []
  const note = (name, ok, detail) => { interactions.push({ name, ok, detail }); if (!ok) fail(`interaction ${name}: ${JSON.stringify(detail)}`) }
  for (const role of ['client', 'specialist']) {
    const { c, p } = await open(browser, 375, { role })
    await p.goto(`${candidate}/s/olena?ui=v2`); await ready(p, '/s/olena')
    const btn = p.locator('header').getByRole('button', { name: 'Меню', exact: true })
    await btn.click()
    const items = await p.locator('.mobile-menu').evaluate((m) => [...m.querySelectorAll('a, button')].map((x) => x.textContent.trim()))
    await p.screenshot({ path: path.join(shots, `after-v2-${role}-375-mobile-menu.png`) })
    await p.keyboard.press('Escape')
    const closed = (await p.locator('.mobile-menu').count()) === 0
    const focusBack = await p.evaluate(() => document.activeElement?.getAttribute('aria-label'))
    note(`${role} 375 mobile menu open/Escape`, items.length > 0 && closed && focusBack === 'Меню', { items, closed, focusBack, expanded: await btn.getAttribute('aria-expanded') })
    await c.close()
  }
  {
    const { c, p } = await open(browser, 1440, { role: 'specialist' })
    await p.goto(`${candidate}/s/olena?ui=v2`); await ready(p, '/s/olena')
    const settings = p.locator('header').getByRole('button', { name: 'Налаштування', exact: true })
    await settings.click()
    const open1 = await p.locator('.settings-menu').isVisible()
    await p.screenshot({ path: path.join(shots, `after-v2-specialist-1440-settings.png`) })
    await p.keyboard.press('Escape')
    note('specialist 1440 settings menu open/Escape', open1 && (await p.locator('.settings-menu').count()) === 0, { open: open1, focus: await p.evaluate(() => document.activeElement?.getAttribute('aria-label')) })
    await p.locator('header').getByRole('button', { name: 'Сповіщення', exact: true }).click()
    const open2 = await p.locator('.notif-panel').isVisible()
    await p.screenshot({ path: path.join(shots, `after-v2-specialist-1440-notifications.png`) })
    await p.keyboard.press('Escape')
    note('specialist 1440 notifications open/Escape', open2 && (await p.locator('.notif-panel').count()) === 0, { open: open2 })
    // Keyboard order through the header from a fresh page load, and a visible focus ring on every stop.
    await p.reload(); await ready(p, '/s/olena')
    const order = []
    for (let i = 0; i < 8; i++) {
      await p.keyboard.press('Tab')
      order.push(await p.evaluate(() => { const el = document.activeElement; const s = getComputedStyle(el); return { name: (el.getAttribute('aria-label') || el.innerText.trim() || el.querySelector('img')?.alt || '').replace(/\s+/g, ' ').trim(), inHeader: !!el.closest('header.topbar'), outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 } }))
    }
    const headerStops = order.filter((x) => x.inHeader).map((x) => x.name)
    const expected = ['Pro Consult', 'Мій кабінет', 'Публічний профіль', 'Чат', 'Налаштування', 'Сповіщення', 'Вийти']
    note('specialist 1440 keyboard order and focus ring', JSON.stringify(headerStops) === JSON.stringify(expected) && order.every((x) => x.outline), { order })
    await c.close()
  }
  for (const width of [375, 1024]) {
    const { c, p } = await open(browser, width)
    await p.goto(`${candidate}/s/olena?ui=v2`); await ready(p, '/s/olena')
    await p.locator('header a[href="/login"]:visible').first().click()
    await p.waitForURL('**/login**')
    note(`guest ${width} login action`, true, { url: new URL(p.url()).pathname })
    await c.close()
  }
  for (const role of ['guest', 'client']) {
    const { c, p } = await open(browser, 1440, { role })
    await p.goto(`${candidate}/s/olena?ui=v2`); await ready(p, '/s/olena')
    await p.locator('footer').getByRole('button', { name: 'Налаштування конфіденційності' }).click()
    note(`${role} footer privacy controls`, await p.getByRole('region', { name: 'Файли cookie та аналітика' }).isVisible(), {})
    await c.close()
  }
  for (const [role, width] of [['client', 1440], ['client', 375], ['guest', 1440]]) {
    const { c, p } = await open(browser, width, { role })
    await p.goto(`${candidate}/s/olena?ui=v2`); await ready(p, '/s/olena')
    await p.evaluate(() => window.scrollTo(0, 1400))
    await p.waitForTimeout(200)
    const geo = await p.evaluate(() => { const h = document.querySelector('header.topbar').getBoundingClientRect(); const n = document.querySelector('.pc2-profile-nav')?.getBoundingClientRect(); return { headerTop: Math.round(h.top), headerBottom: Math.round(h.bottom), navTop: n && Math.round(n.top) } })
    note(`${role} ${width} sticky header and profile tabs`, geo.headerTop === 0 && (geo.navTop == null || geo.navTop >= geo.headerBottom - 1), geo)
    await c.close()
  }

  // 3. Before/after captures: v2 header (viewport top) and footer (scrolled to the end, as a visitor sees it).
  for (const width of [375, 768, 1440]) for (const role of ['guest', 'specialist', 'client']) for (const [label, base] of [['before', baseline], ['after', candidate]]) {
    const { c, p } = await open(browser, width, { role })
    await p.goto(`${base}/s/olena?ui=v2`); await ready(p, '/s/olena')
    await p.screenshot({ path: path.join(shots, `${label}-v2-${role}-${width}-header.png`), clip: { x: 0, y: 0, width, height: width < 768 ? 120 : 140 } })
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await p.waitForTimeout(200)
    await p.screenshot({ path: path.join(shots, `${label}-v2-${role}-${width}-footer.png`) })
    await c.close()
  }

  // 4. Other public pages in v2 must be unchanged: full-page baseline/control/candidate (compared by compare.py).
  const others = []
  for (const width of [375, 1440]) for (const role of ['guest', 'client']) for (const route of ['/', '/for-clients', '/specialists', '/faq']) {
    const files = {}
    for (const [label, base] of [['baseline', baseline], ['control', baseline], ['candidate', candidate]]) {
      const { c, p } = await open(browser, width, { role })
      await p.goto(`${base}${route}?ui=v2`)
      await ready(p, route)
      files[label] = path.join('v2-other', `${label}-${role}-${width}-${slug(route)}.png`)
      fs.mkdirSync(path.join(out, 'v2-other'), { recursive: true })
      await p.screenshot({ path: path.join(out, files[label]), fullPage: true })
      await c.close()
    }
    others.push({ width, role, route, ...files })
  }
  fs.writeFileSync(path.join(out, 'v2-other', 'pairs.json'), JSON.stringify(others, null, 2) + '\n')

  fs.writeFileSync(path.join(out, 'acceptance.json'), JSON.stringify({ problems, interactions, rows }, null, 2) + '\n')
  console.log('matrix rows', rows.length, 'interactions', interactions.length, 'problems', problems.length)
  for (const x of problems) console.log(' -', x)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
