// Synthetic API fixtures; all mutations are intercepted. No backend writes.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const root = process.cwd(), origin = process.env.MANUAL_ORIGIN || 'http://127.0.0.1:5540'
const phase = process.env.MANUAL_PHASE || 'before', out = process.env.MANUAL_OUT || __dirname
fs.mkdirSync(out, { recursive: true })
const spec = fs.readFileSync(path.join(root, 'src/views/PublicProfileView.spec.ts'), 'utf8')
const base = new Function('return ({' + spec.split('const base: PublicSpecialistProfile = {')[1].split('\n  }')[0] + '})')()
const rows = [], failures = []
const widths = [[375,667], [390,844], [820,900], [1280,900]]
async function load(browser, width, height, ui = 'v2', mode = 'direct', overrides = {}) {
  const c = await browser.newContext({ viewport: { width, height }, locale: 'uk-UA', timezoneId: 'Europe/Kyiv', reducedMotion: 'reduce' })
  await c.clock.install({ time: new Date('2026-10-26T09:00:00Z') })
  await c.addInitScript(() => { localStorage.setItem('proconsult.product_analytics_consent.v1', '{"version":1,"preference":"denied"}') })
  const gets = [], mutations = [], errors = []
  const profile = { ...base, public_display_name: 'Олександр Константінов', display_name: 'Олександр Константінов', photo_url: origin + '/audit-photo.webp', video_url: origin + '/audit-video.webm', public_profile_summary: 'Психолог, гештальт-терапевт. Працюю з темами стосунків, самоцінності, тривоги, емоційного виснаження та складних життєвих змін. У роботі допомагаю краще розуміти себе.', couple_session_enabled: true, couple_session_price: '2000', couple_session_price_currency: 'UAH', couple_session_duration_minutes: 80 }
  if (mode === 'request') Object.assign(profile, { public_booking_mode: 'request_only', show_public_availability: false, public_direct_booking_enabled: false })
  Object.assign(profile, overrides)
  await c.route('**/*', route => {
    const req = route.request(), u = new URL(req.url())
    if (u.pathname.startsWith('/api/')) {
      if (req.method() !== 'GET') { mutations.push(u.pathname); return route.fulfill({ status: 401, json: {} }) }
      gets.push(u.pathname)
      let body = []
      if (/\/(s|public\/specialists)\/olena\/$/.test(u.pathname)) body = profile
      else if (u.pathname.endsWith('/booking/slots/')) body = mode === 'direct' ? [{ id: 100, therapist: 12, start_at: '2026-10-27T10:00:00Z', end_at: '2026-10-27T11:20:00Z', is_available: true }] : []
      else if (u.pathname.endsWith('/journal/')) body = [{ id: 31, title: 'Як турбуватися про себе', slug: 'synthetic', summary: 'Синтетичний матеріал для перевірки компонування.', body: 'Текст', is_featured: true, published_at: '2026-10-25T09:00:00Z', category: 'TIP', reading_time_minutes: 2 }]
      return route.fulfill({ json: body })
    }
    if (u.pathname === '/audit-photo.webp') return route.fulfill({ contentType: 'image/webp', body: fs.readFileSync(path.join(root,'docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/assets/maria-koval.webp')) })
    if (u.pathname === '/audit-video.webm') return route.fulfill({ contentType: 'video/webm', body: fs.readFileSync(path.join(root,'docs/ui-v2/evidence/kan-158/video-dialog/audit-video.webm')) })
    if (u.origin !== origin || !['GET','HEAD','OPTIONS'].includes(req.method())) return route.abort()
    return route.continue()
  })
  const p = await c.newPage(); p.on('pageerror', e => errors.push(e.message))
  await p.goto(`${origin}/s/olena?ui=${ui}`); await p.locator('h1').waitFor(); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready)
  return { c, p, gets, errors, mutations }
}
const geometry = p => p.evaluate(() => {
  const rect = s => { const e=document.querySelector(s); if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right} }
  return { width:innerWidth,scrollWidth:document.documentElement.scrollWidth,photo:rect('.hero-photo'),video:rect('.hero-video-button'),name:rect('h1'),blog:rect('#journal .panel__header-actions a') }
})
;(async () => {
 const browser=await chromium.launch()
 try {
  for (const [width,height] of widths) {
   const {c,p,gets,errors}=await load(browser,width,height)
   const row={width,height,geometry:await geometry(p)}
   await p.screenshot({path:path.join(out,`${phase}-hero-${width}.png`)})
   await p.locator('#journal .panel__header').evaluate(e=>e.scrollIntoView({block:'center'}));await p.screenshot({path:path.join(out,`${phase}-blog-${width}.png`)})
   const pageY=await p.evaluate(()=>scrollY)
   if(width<768) { await p.locator('.pc2-profile-mobile-cta').click(); await p.locator('dialog.pc2-profile-overlay--request[open]').waitFor() }
   const slot=p.locator('.slot-card').first();await slot.waitFor()
   if(phase==='after'&&width<768)await p.waitForFunction(()=>document.activeElement?.matches('.slot-card'))
   row.slotBeforeManualScroll=await slot.boundingBox()
   row.focusBeforeManualScroll=await p.evaluate(()=>document.activeElement?.className)
   row.scrollContainers=await slot.evaluate(e=>{const a=[];for(let p=e.parentElement;p;p=p.parentElement){const s=getComputedStyle(p);if(/auto|scroll/.test(s.overflowY))a.push({class:p.className,height:p.clientHeight,scrollHeight:p.scrollHeight})}return a})
   await p.screenshot({path:path.join(out,`${phase}-availability-${width}.png`)})
   const colors=()=>slot.evaluate(e=>({background:getComputedStyle(e).backgroundColor,text:getComputedStyle(e.querySelector('.slot-time')).color,outline:getComputedStyle(e).outlineWidth}))
   row.normalColors=await colors();await slot.hover();row.slotColors=await colors()
   await p.screenshot({path:path.join(out,`${phase}-slot-${width}.png`)})
   if(phase==='after') {
    assert(row.geometry.scrollWidth<=width)
    assert.equal(row.slotColors.text,'rgb(255, 255, 255)');assert.equal(row.slotColors.background,'rgb(18, 52, 90)')
    if(width<768){assert(row.geometry.video.y>=row.geometry.photo.bottom);assert(row.geometry.video.right<=row.geometry.name.x);assert(row.slotBeforeManualScroll.y>=0&&row.slotBeforeManualScroll.y+row.slotBeforeManualScroll.height<=height);assert.equal(await slot.evaluate(e=>e===document.activeElement),true);assert.equal(row.scrollContainers.length,1);assert.equal(await p.evaluate(()=>scrollY),pageY);const close=await p.locator('.pc2-profile-overlay--request .pc2-profile-overlay__close').boundingBox();assert(close.y>=0&&close.y+close.height<=height)}
    await slot.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');row.focusColors=await colors();assert.equal(row.focusColors.text,'rgb(255, 255, 255)');assert.equal(row.focusColors.outline,'2px')
    await slot.evaluate(e=>{e.disabled=true});await p.mouse.move(1,1);row.disabledColors=await colors();assert.equal(await slot.isDisabled(),true);await slot.evaluate(e=>{e.disabled=false})
    if(width<768){await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('dialog.pc2-profile-overlay--request')?.open)}
    const blog=p.locator('#journal .panel__header-actions a');await blog.evaluate(e=>{e.textContent='Переглянути всі статті спеціаліста українською'});const box=await blog.boundingBox();assert(box.width>=150&&box.height>=44);assert.equal(await blog.evaluate(e=>getComputedStyle(e).wordBreak),'normal')
    const video=p.getByRole('button',{name:'Відеовізитка',exact:true});await video.click();const videoDialog=p.getByRole('dialog',{name:'Відеовізитка',exact:true});await videoDialog.waitFor();await p.waitForFunction(()=>document.activeElement?.hasAttribute('data-video-initial-focus'))
    const videoY=await p.evaluate(()=>scrollY)
    for(const key of ['Tab','Shift+Tab'])for(let n=0;n<6;n++){await p.keyboard.press(key);assert(await videoDialog.evaluate(e=>e.contains(document.activeElement)))}
    await videoDialog.locator('video').focus();await p.keyboard.press('PageDown');assert.equal(await p.evaluate(()=>scrollY),videoY)
    await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('.pc2-profile-overlay--video')?.open);assert(await video.evaluate(e=>e===document.activeElement))
    if(width<768){await p.locator('.pc2-profile-mobile-cta').click();await p.waitForFunction(()=>document.activeElement?.matches('.slot-card'));await p.locator('.pc2-profile-overlay--request .pc2-profile-overlay__close').click();await p.waitForFunction(()=>!document.querySelector('.pc2-profile-overlay--request')?.open);assert.equal(await p.evaluate(()=>document.body.style.overflow),'');await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));row.footerClearance=await p.evaluate(()=>({footerBottom:document.querySelector('footer').getBoundingClientRect().bottom,contentBottom:Math.max(...[...document.querySelectorAll('footer a,footer p')].map(e=>e.getBoundingClientRect().bottom)),barTop:document.querySelector('.pc2-profile-bottom-bar').getBoundingClientRect().top,scrollY,scrollHeight:document.documentElement.scrollHeight,bodyPadding:document.body.style.paddingBottom}));await p.screenshot({path:path.join(out,`after-footer-${width}.png`)});assert(row.footerClearance.contentBottom<=row.footerClearance.barTop+1,JSON.stringify(row.footerClearance))}
   }
   assert.deepEqual(errors,[]);rows.push(row);await c.close()
   const legacy=await load(browser,width,height,'v1');await legacy.p.screenshot({path:path.join(out,`${phase}-v1-${width}.png`),fullPage:true});await legacy.c.close()
   console.log(`${phase} ${width} captured`)
  }
  if(phase==='after')for(const [width,height] of widths)for(const mode of ['empty','request']){
   const {c,p,gets}=await load(browser,width,height,'v2',mode,{public_display_name:'Олександра-Марія Константинопольська',display_name:'Олександра-Марія Константинопольська'})
   assert((await geometry(p)).scrollWidth<=width)
   if(width<768){await p.locator('.pc2-profile-mobile-cta').click();await p.locator('dialog[open]').waitFor()}
   assert.equal(await p.locator('.slot-card').count(),0)
   if(mode==='request')assert.equal(gets.filter(x=>x.endsWith('/booking/slots/')).length,0)
   await p.screenshot({path:path.join(out,`after-${mode}-${width}.png`)})
   await c.close();rows.push({width,height,mode,longName:true,noFabricatedSlots:true,requestOnlySlotGets:gets.filter(x=>x.endsWith('/booking/slots/')).length})
  }
 }catch(e){failures.push(e.stack);process.exitCode=1}finally{await browser.close();fs.writeFileSync(path.join(out,`${phase}.json`),JSON.stringify({fixtureOnly:true,rows,failures},null,2))}
})()
