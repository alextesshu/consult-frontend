// Real isolated Django responses, deliberately held to reproduce GET/PATCH ordering.
const {chromium}=require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict')
if(process.env.UCI_ISOLATED_DATABASE!=='uc_integration')throw new Error('Isolated DB confirmation required')
const accounts=JSON.parse(fs.readFileSync(process.env.UCI_CREDENTIALS,'utf8'))
const app='http://localhost:5412',api='http://localhost:8412/api/cabinet/settings/calendar/'
const results=[],patches=[],errors=[]
let browser,p
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return{resolve,promise}}
async function ready(){await p.locator('.pc2-cal__modes').waitFor();await p.waitForFunction(()=>document.querySelector('.pc2-cal__mode')?.getAttribute('aria-disabled')!=='true')}
async function login(account){await p.goto(app+'/login?ui=v2');await p.locator('input[name="identifier"]').fill(account.username);await p.locator('input[name="password"]').fill(account.password);await p.locator('button[type=submit]').click();await p.waitForURL(u=>!u.pathname.startsWith('/login'));await p.goto(app+'/cabinet/sessions?ui=v2');await ready();await p.waitForLoadState('networkidle')}
async function direct(body){return p.evaluate(async({api,body})=>{const{useAuthStore}=await import('/src/stores/auth.ts');const r=await fetch(api,{method:'PATCH',headers:{Authorization:'Bearer '+useAuthStore().accessToken,'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});return{status:r.status,body:await r.json()}},{api,body})}
async function check(name,fn){const detail=await fn();results.push({name,result:'PASS',detail:detail??null});console.log('PASS '+name)}
async function frames(){await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
;(async()=>{
 browser=await chromium.launch();const c=await browser.newContext({viewport:{width:1280,height:900},timezoneId:'Europe/Kyiv',locale:'uk-UA'})
 await c.addInitScript(()=>localStorage.setItem('proconsult.product_analytics_consent.v1',JSON.stringify({version:1,preference:'denied'})))
 await c.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort())
 p=await c.newPage();p.on('pageerror',e=>errors.push(e.message))
 p.on('request',r=>{if(r.url()===api&&r.method()==='PATCH')patches.push(r.postDataJSON())})
 await login(accounts[0])
 let pending=null,pendingWrite=null
 const hold=()=>{const captured=deferred(),release=deferred();pending={captured,release};return pending}
 await c.route('**/api/cabinet/settings/calendar/',async r=>{
  if(r.request().method()==='GET'&&pending){const gate=pending;pending=null;const response=await r.fetch();gate.captured.resolve(await response.json());await gate.release.promise;await r.fulfill({response}).catch(()=>{});return}
  if(r.request().method()==='PATCH'&&pendingWrite){const gate=pendingWrite;pendingWrite=null;const response=await r.fetch();gate.captured.resolve(await response.json());await gate.release.promise;await r.fulfill({response});return}
  await r.fallback()
 })
 await check('focus GET pending -> immediate mode click -> one real PATCH; stable status geometry',async()=>{
  const y=await p.locator('.pc2-cal__modes').evaluate(el=>el.getBoundingClientRect().top)
  const gate=hold();await p.evaluate(()=>window.dispatchEvent(new Event('focus')));const old=await gate.captured.promise
  assert.equal(await p.locator('.pc2-cal__modes').evaluate(el=>el.getBoundingClientRect().top),y)
  await p.screenshot({path:path.join(__dirname,'screenshots','desktop-refresh-pending.png'),fullPage:true})
  const writeGate={captured:deferred(),release:deferred()};pendingWrite=writeGate
  const before=patches.length,response=p.waitForResponse(r=>r.url()===api&&r.request().method()==='PATCH')
  await p.locator('#pc2-cal-tab-availability').click();await writeGate.captured.promise
  const savingTop=await p.locator('.pc2-cal__modes').evaluate(el=>el.getBoundingClientRect().top)
  assert.equal(savingTop,y)
  assert.equal(await p.locator('[role=status].pc2-cal-sr').textContent(),'Зберігаємо налаштування…')
  await p.screenshot({path:path.join(__dirname,'screenshots','desktop-save-pending.png'),fullPage:true})
  writeGate.release.resolve();assert.equal((await response).status(),200)
  await p.waitForFunction(()=>document.querySelector('#pc2-cal-tab-availability').getAttribute('aria-selected')==='true')
  assert.equal(await p.locator('.pc2-cal__modes').evaluate(el=>el.getBoundingClientRect().top),y)
  gate.release.resolve();await frames();assert.equal(patches.length,before+1)
  assert.equal(await p.locator('#pc2-cal-tab-availability').getAttribute('aria-selected'),'true')
  return{getRevision:old.revision,patch:patches.at(-1),modeTopBefore:y,modeTopDuring:savingTop,layoutShift:0,patchCount:1}
 })
 await check('visibility GET pending -> immediate layer click; late GET cannot undo it',async()=>{
  await p.getByRole('button',{name:'Вигляд ▾'}).click()
  const gate=hold();await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await gate.captured.promise
  const before=patches.length,response=p.waitForResponse(r=>r.url()===api&&r.request().method()==='PATCH')
  await p.getByRole('checkbox',{name:/Зовнішні гостьові/}).check();assert.equal((await response).status(),200)
  gate.release.resolve();await frames()
  assert.equal(await p.getByRole('checkbox',{name:/Зовнішні гостьові/}).isChecked(),true)
  assert.equal(patches.length,before+1)
  await p.getByRole('button',{name:'Закрити вигляд'}).click()
 })
 await check('real 409 recovery remains authoritative while older GET is pending',async()=>{
  const gate=hold();await p.evaluate(()=>window.dispatchEvent(new Event('focus')));const old=await gate.captured.promise
  assert.equal((await direct({regular_view:'day',expected_revision:old.revision})).status,200)
  const before=patches.length,response=p.waitForResponse(r=>r.url()===api&&r.request().method()==='PATCH')
  await p.locator('#pc2-cal-tab-workday').click();assert.equal((await response).status(),409)
  await p.getByText(/Налаштування календаря змінилися на іншому пристрої/).waitFor()
  gate.release.resolve();await frames()
  assert.equal(await p.getByText(/Налаштування календаря змінилися на іншому пристрої/).isVisible(),true)
  assert.equal(await p.locator('#pc2-cal-tab-availability').getAttribute('aria-selected'),'true')
  assert.equal(await p.locator('.pc2-cal-grid__col').count(),1)
  assert.equal(patches.length,before+1)
  await p.getByRole('button',{name:'Оновити налаштування'}).click();await ready()
 })
 await check('selected preview tab / return / refresh / history never implicitly persist',async()=>{
  const before=patches.length
  await p.goto(app+'/cabinet/sessions?ui=v2&mode=workday&keep=yes#calendar');await ready()
  await p.locator('#pc2-cal-tab-workday').click();await frames();assert.equal(patches.length,before)
  assert.equal(new URL(p.url()).searchParams.get('mode'),'workday')
  await p.reload();await ready()
  await p.goto(app+'/cabinet/sessions?ui=v2&mode=actions&keep=yes#calendar');await ready();await p.goBack();await ready();await p.goForward();await ready()
  assert.equal(patches.length,before)
  await p.getByRole('button',{name:'Повернути збережений'}).click();await p.waitForURL(u=>!u.searchParams.has('mode'))
  assert.equal(new URL(p.url()).hash,'#calendar');assert.equal(new URL(p.url()).searchParams.get('keep'),'yes');assert.equal(patches.length,before)
  await p.goto(app+'/cabinet/sessions?ui=v2&mode=workday');await ready()
  const response=p.waitForResponse(r=>r.url()===api&&r.request().method()==='PATCH')
  await p.getByRole('button',{name:'Зберегти цей режим'}).click();assert.equal((await response).status(),200)
  await p.waitForURL(u=>!u.searchParams.has('mode'));assert.equal(patches.length,before+1)
 })
 await check('375/390 mobile menu has Day/List only, Week projects Day without PATCH',async()=>{
  await direct({regular_view:'week',expected_revision:patches.at(-1).expected_revision+1});await p.reload();await ready()
  const rows=[]
  for(const width of [375,390]){
   await p.setViewportSize({width,height:850});await p.getByRole('button',{name:'Вигляд календаря'}).click()
   const dialog=p.getByRole('dialog'),before=patches.length
   assert.equal(await dialog.getByRole('button',{name:'Тиждень',exact:true}).count(),0)
   assert.equal(await dialog.getByRole('button',{name:'День',exact:true}).getAttribute('aria-pressed'),'true')
   assert.equal(await dialog.getByRole('group',{name:'Звичайний вигляд'}).count(),1)
   assert.equal(await dialog.getByRole('group',{name:'Видимість шарів'}).count(),1)
   await p.screenshot({path:path.join(__dirname,'screenshots',`mobile-${width}-view.png`),fullPage:true})
   assert.equal(patches.length,before)
   rows.push({width,options:['day','list'],selected:'day',writes:0,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)})
   await p.getByRole('button',{name:'Закрити вигляд'}).click()
  }
  return rows
 })
 await check('logout/specialist switch while a real background GET is pending',async()=>{
  await p.setViewportSize({width:1280,height:900})
  const gate=hold();await p.evaluate(()=>window.dispatchEvent(new Event('focus')));await gate.captured.promise
  await p.getByRole('button',{name:'Вийти',exact:true}).click();await p.waitForURL(u=>!u.pathname.startsWith('/cabinet'))
  await login(accounts[1]);gate.release.resolve();await frames()
  assert.equal(await p.locator('#pc2-cal-tab-workday').getAttribute('aria-selected'),'true')
  assert.equal(await p.locator('.pc2-cal-grid__col').count(),7)
 })
 assert.equal(errors.length,0)
})().catch(e=>{results.push({name:'acceptance stopped',result:'FAIL',detail:e.message});console.error(e.message);process.exitCode=1}).finally(async()=>{
 fs.writeFileSync(path.join(__dirname,'browser.json'),JSON.stringify({backend:'47d57b5791e750cb3a47846be67f9e2e655bb3ec',database:'uc_integration',realResponses:true,signals:'controlled focus/visibility; trusted clicks; real responses held, not replaced',results,patches,errors},null,2))
 if(browser)await browser.close()
})
