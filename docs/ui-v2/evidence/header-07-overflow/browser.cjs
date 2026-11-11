// Real Chromium layout regression with synthetic roles/APIs. Local previews only.
// HEADER_ORIGIN=http://127.0.0.1:5453 HEADER_EVIDENCE=<new directory>
// PLAYWRIGHT_MODULE=<existing playwright-core path> node docs/ui-v2/evidence/header-07-overflow/browser.cjs
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const origin = process.env.HEADER_ORIGIN;
if (!origin || !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('Local preview required');
const out = process.env.HEADER_EVIDENCE;
if (!out || fs.existsSync(out)) throw new Error('New evidence directory required');
fs.mkdirSync(out, { recursive: true });
const spec = fs.readFileSync('src/views/PublicProfileView.spec.ts', 'utf8');
const profile = new Function('return ({' + spec.split('const base: PublicSpecialistProfile = {')[1].split('\n  }')[0] + '})')();
Object.assign(profile, { public_slug: 'specialist-2', photo_url: null, video_url: null });
const results = [], writes = [];
const visible = async (locator) => await locator.count() > 0 && await locator.isVisible();
async function geometry(p) {
  return p.evaluate(() => {
    const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x:r.x, y:r.y+scrollY, w:r.width, h:r.height, right:r.right }; };
    const header = document.querySelector('header'), menu = header?.querySelector('.mobile-menu');
    return { viewport:innerWidth, scroll:document.documentElement.scrollWidth, header:box(header),
      brand:box(header?.querySelector('.brand')), nav:box(header?.querySelector('.nav')), main:box(document.querySelector('main')),
      menu:menu ? { ...box(menu), position:getComputedStyle(menu).position } : null,
      controls:[...header.querySelectorAll('.nav > *')].filter(e=>e.getBoundingClientRect().width && getComputedStyle(e).display!=='none')
        .map(e=>({ cls:e.className, ...box(e) })) };
  });
}
async function one(browser, width, role, ui) {
  const c = await browser.newContext({ viewport:{width,height:900}, hasTouch:width<768, locale:'uk-UA', timezoneId:'Europe/Kyiv' });
  await c.addInitScript(()=>localStorage.setItem('proconsult.product_analytics_consent.v1',JSON.stringify({version:1,preference:'denied'})));
  await c.route('**/*', r => {
    const req=r.request(), u=new URL(req.url());
    if (!['GET','HEAD'].includes(req.method())) {
      writes.push({role,width,path:u.pathname,method:req.method()});
      if (u.pathname.endsWith('/auth/token/refresh/')) return r.fulfill({status:role==='guest'?401:200,json:{access:'synthetic-only'}});
      if (u.pathname.endsWith('/auth/logout/')) return r.fulfill({status:204,body:''});
      return r.fulfill({status:405,json:{detail:'Blocked synthetic mutation'}});
    }
    if (u.pathname.startsWith('/api/')) {
      const x=u.pathname, json=(data)=>r.fulfill({json:data});
      if (x.endsWith('/s/specialist-2/') || x.endsWith('/public/specialists/specialist-2/')) return json(profile);
      if (x.endsWith('/me/')) return role==='guest'?r.fulfill({status:401,json:{}}):json({user:{id:role==='specialist'?1:2,username:'synthetic-'+role,roles:[role.toUpperCase()]},access_state:'OK',effective_entitlements:{plan:'PRO'},counts:{}});
      if (x.includes('/notifications')) return json({results:[],unread_count:3});
      if (x.includes('/chat/unread')) return json({unread_count:0});
      if (x.endsWith('/cabinet/settings/calendar/')) return json({mode:'workday',view:'week',regular_view:'week',preset:'workday',layers:{sessions:true,past:true,free_slots:true,guest_requests:true,absences:true,external_guest_sessions:false},timezone:'Europe/Kyiv',revision:0,updated_at:null});
      if (x.endsWith('/cabinet/schedule/')) return json({events:[]});
      if (x.endsWith('/cabinet/profile/')) return json({...profile,id:1,timezone:'Europe/Kyiv'});
      if (x.endsWith('/cabinet/work-queue/')) return json({pending_guest_requests_count:0});
      return json([]);
    }
    return ['127.0.0.1','localhost','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)?r.continue():r.abort();
  });
  const p=await c.newPage(), errors=[];p.on('pageerror',e=>errors.push(e.message));
  for (const route of ['/','/for-clients','/s/specialist-2','/cabinet/sessions']) {
    const row={width,role,ui,route};
    try {
      await p.goto(origin+route+'?ui='+ui);await p.waitForLoadState('networkidle');await p.locator('header .brand').waitFor();
      if(role!=='guest') await p.locator('header button[aria-label="Меню"]').waitFor({state:'attached'});
      await p.evaluate(()=>document.fonts.ready); row.actualRoute=new URL(p.url()).pathname;
      row.closed=await geometry(p);assert(row.closed.scroll<=width,'closed document overflow');
      if (ui==='v2') {
        assert.equal(row.closed.header.h,width<768?94:76);
        const header=p.locator('header');
        assert.equal(await header.locator('.nav > .nav__primary-action').isVisible(),false);
        assert.equal(await visible(header.locator('.nav > a[aria-label="Чат"]')),false);
        assert.equal(await visible(header.locator('.nav > button.btn--ghost')),false);
        assert.equal(await visible(header.locator('.nav > a.header07__mobile-avatar')),role!=='guest'&&width<768);
        if(role==='specialist'&&width>1100) assert(await header.locator('.header07__profile-link').isVisible());
      }
      if (role==='specialist'&&ui==='v2'&&route==='/cabinet/sessions') assert(await p.locator('.pc2-cal').count()>0,'Calendar 3a fixture must render');
      const trigger=p.locator('header button[aria-label="Меню"]');
      if(role!=='guest'&&await visible(trigger)) {
        if(ui==='v2'&&role==='specialist'&&route==='/'&&[375,1280].includes(width)) await p.screenshot({path:path.join(out,`${width}-closed.png`)});
        await trigger.focus();await p.keyboard.press('Enter');const menu=p.locator('header .mobile-menu');await menu.waitFor();
        row.open=await geometry(p);assert(row.open.scroll<=width,'open document overflow');
        assert.equal(row.open.menu.position,'absolute');assert(row.open.menu.x>=0&&row.open.menu.right<=width,'dropdown out of viewport');
        if(ui==='v2'&&width<768)assert(row.open.menu.y>=row.open.header.y+row.open.header.h,'dropdown obscures mobile slogan strip');
        for(const key of ['brand','nav','main']) {
          for(const axis of ['x','w','right']) assert.equal(row.open[key][axis],row.closed[key][axis],key+' shifted horizontally on open');
        }
        if(ui==='v2') {
          for(const item of row.open.controls.filter(x=>!x.cls.includes('mobile-menu')))assert(item.x>=0&&item.right<=width,'header control outside viewport');
          assert.equal(await menu.getByRole('link',{name:'Чат',exact:true}).count(),1);
          if(role==='specialist') assert(await menu.getByRole('link',{name:'Публічний профіль (перегляд)',exact:true}).isVisible());
          if(role==='specialist'&&route==='/'&&[375,1280].includes(width))await p.screenshot({path:path.join(out,`${width}-open.png`)});
        }
        await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');assert(await p.evaluate(()=>document.activeElement!==document.body));
        await p.keyboard.press('Escape');assert(await trigger.evaluate(e=>e===document.activeElement));
        await p.keyboard.press('Space');await menu.waitFor();
        if(ui==='v2') {
          await menu.getByRole('button',{name:'Сповіщення',exact:true}).focus();await p.keyboard.press('Enter');const panel=p.getByRole('region',{name:'Сповіщення'});await panel.waitFor();
          assert(await panel.evaluate(e=>e===document.activeElement));await p.keyboard.press('Tab');assert(await panel.evaluate(e=>e.contains(document.activeElement)));
          await p.keyboard.press('Shift+Tab');assert(await p.evaluate(()=>document.activeElement!==document.body));await p.keyboard.press('Escape');assert(await trigger.evaluate(e=>e===document.activeElement));
        }else await p.keyboard.press('Escape');
      }
      if(ui==='v2'&&role==='guest'&&route==='/'&&width<768){const menu=p.getByRole('button',{name:'Меню сайту'});await menu.click();await p.getByRole('dialog',{name:'Меню сайту'}).waitFor();await p.keyboard.press('Escape');assert(await menu.evaluate(e=>e===document.activeElement));}
      assert.deepEqual(errors,[]);row.result='PASS';
    }catch(e){row.result='FAIL';row.error=e.stack;row.errors=errors;await p.screenshot({path:path.join(out,`FAIL-${width}-${role}-${ui}-${route.replaceAll('/','_')}.png`)});console.log('FAIL',width,role,ui,route,e.message)}
    results.push(row);
  }
  await c.close();
}
(async()=>{const b=await chromium.launch();try{
  const widths=process.env.HEADER_WIDTHS?process.env.HEADER_WIDTHS.split(',').map(Number):[375,390,768,1024,1280,1440,1920];
  const jobs=[];for(const width of widths)for(const role of ['guest','specialist','client'])for(const ui of ['v1','v2'])jobs.push({width,role,ui});
  const queue=[...jobs];await Promise.all([0,1,2].map(async()=>{while(queue.length){const j=queue.shift();await one(b,j.width,j.role,j.ui)}}));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({engine:b.version(),environment:'Windows Chromium headless; synthetic authenticated API fixtures only',origin,results,writes},null,2));
}finally{await b.close()}const failed=results.filter(x=>x.result==='FAIL');console.log('CASES',results.length,'FAILURES',failed.length);if(failed.length)process.exitCode=1})().catch(e=>{console.error(e);process.exitCode=1});
