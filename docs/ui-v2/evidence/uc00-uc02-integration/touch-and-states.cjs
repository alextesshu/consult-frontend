// Real Chromium touch input and UI state screenshots against the disposable backend.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict')
if(process.env.UCI_ISOLATED_DATABASE!=='uc_integration')throw new Error('Disposable database confirmation required')
const account=JSON.parse(fs.readFileSync(process.env.UCI_CREDENTIALS,'utf8'))[0]
const rows=[]
;(async()=>{
 const browser=await chromium.launch()
 try {
  for(const width of [375,390]) {
   const c=await browser.newContext({viewport:{width,height:650},hasTouch:true,timezoneId:'Europe/Kyiv',locale:'uk-UA',reducedMotion:'no-preference'})
   await c.addInitScript(()=>localStorage.setItem('proconsult.product_analytics_consent.v1',JSON.stringify({version:1,preference:'denied'})))
   await c.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort())
   const p=await c.newPage()
   await p.goto('http://localhost:5412/login?ui=v2')
   await p.locator('input[name="identifier"]').fill(account.username);await p.locator('input[name="password"]').fill(account.password)
   await p.locator('button[type="submit"]').click();await p.waitForURL(u=>!u.pathname.startsWith('/login'))
   await p.goto('http://localhost:5412/cabinet/sessions?ui=v2')
   await p.locator('.pc2-cal__modes').waitFor();await p.waitForLoadState('networkidle')
   const before=await p.evaluate(()=>scrollY)
   const session=await c.newCDPSession(p)
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width/2,y:580}]})
   for(let step=1;step<=8;step++) {
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width/2,y:580-step*35}]})
    await p.evaluate(()=>new Promise(requestAnimationFrame))
   }
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
   await p.waitForFunction(initial=>scrollY>initial,before)
   const pageDelta=await p.evaluate(initial=>scrollY-initial,before)
   await p.getByRole('button',{name:'Вигляд календаря'}).tap()
   const close=p.getByRole('button',{name:'Закрити вигляд'})
   await close.waitFor()
   assert.equal(await p.evaluate(()=>document.documentElement.style.overflow),'hidden')
   const box=await close.boundingBox();assert.ok(box.height>=44)
   await p.screenshot({path:path.join(__dirname,'screenshots',`touch-${width}-view-sheet.png`),fullPage:true})
   await close.tap()
   assert.equal(await p.evaluate(()=>document.documentElement.style.overflow),'')
   assert.equal(await p.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Вигляд календаря')
   await p.goto('http://localhost:5412/cabinet/sessions?ui=v2&mode=actions')
   await p.getByTestId('calendar-mode-preview').waitFor();await p.waitForLoadState('networkidle')
   await p.screenshot({path:path.join(__dirname,'screenshots',`touch-${width}-actions-preview.png`),fullPage:true})
   rows.push({width,touchPageDelta:pageDelta,closeHeight:box.height,scrollLockRestored:true,focusReturned:true,documentOverflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)})
   assert.equal(rows.at(-1).documentOverflow,false)
   await c.close()
   console.log('PASS touch/sheet/preview '+width)
  }
 } finally {await browser.close();fs.writeFileSync(path.join(__dirname,'touch-and-states.json'),JSON.stringify({rows},null,2))}
})().catch(e=>{console.error(e.message);process.exitCode=1})
