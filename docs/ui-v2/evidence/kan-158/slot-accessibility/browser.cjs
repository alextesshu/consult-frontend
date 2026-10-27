// Isolated fixture APIs only; every mutation is intercepted before networking.
const pw=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs=require('fs'),path=require('path'),assert=require('assert/strict')
const engine=process.argv[2]||'chromium',root=process.cwd(),out=path.join(process.env.SLOT_EVIDENCE||__dirname,engine)
fs.mkdirSync(out,{recursive:true})
const spec=fs.readFileSync(path.join(root,'src/views/PublicProfileView.spec.ts'),'utf8')
const base=new Function('return ({'+spec.split('const base: PublicSpecialistProfile = {')[1].split('\n  }')[0]+'})')()
const builds={baseline:process.env.SLOT_BASELINE||'http://127.0.0.1:5543',candidate:process.env.SLOT_CANDIDATE||'http://127.0.0.1:5542'}
const widths=[[375,667],[390,844],[1280,900]],rows=[],failures=[]
async function open(browser,build,width,height,ui='v2',mode='direct',reduced=false,touch=false){
 const origin=builds[build],c=await browser.newContext({viewport:{width,height},locale:'uk-UA',timezoneId:'Europe/Kyiv',...(engine==='chromium'?{reducedMotion:reduced?'reduce':'no-preference'}:{}),...(touch?{hasTouch:true,isMobile:true}:{})})
 await c.clock.setFixedTime(new Date('2026-10-26T09:00:00Z'))
 await c.addInitScript(allowed=>{if(location.origin===allowed)localStorage.setItem('proconsult.product_analytics_consent.v1','{"version":1,"preference":"denied"}')},origin)
 const profile={...base,photo_url:'',video_url:'',public_profile_summary:'Синтетичний опис для ізольованої перевірки.'},gets=[],mutations=[]
 if(mode==='request')Object.assign(profile,{public_booking_mode:'request_only',show_public_availability:false,public_direct_booking_enabled:false})
 await c.route('**/*',r=>{const q=r.request(),u=new URL(q.url()),headers={'access-control-allow-origin':origin,'access-control-allow-credentials':'true'}
  if(!['GET','HEAD','OPTIONS'].includes(q.method())){mutations.push({host:u.hostname,path:u.pathname,method:q.method()});return r.fulfill({status:401,headers,json:{}})}
  if(u.pathname.startsWith('/api/')){gets.push(u.pathname);let body=[];if(q.method()==='OPTIONS')return r.fulfill({status:204,headers:{...headers,'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization'}});if(/\/(s|public\/specialists)\/olena\/$/.test(u.pathname))body=profile;else if(u.pathname.endsWith('/booking/slots/'))body=mode==='direct'?[{id:100,therapist:12,start_at:'2026-10-27T10:00:00Z',end_at:'2026-10-27T11:20:00Z',is_available:true},{id:101,therapist:12,start_at:'2026-10-27T12:00:00Z',end_at:'2026-10-27T13:20:00Z',is_available:true}]:[];return r.fulfill({headers,json:body})}
  if(u.origin!==origin)return r.abort();return r.continue()
 })
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(15000)
 await p.goto(origin+'/s/olena?ui='+ui);await p.locator('h1').waitFor();await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready)
 return{c,p,errors,gets,mutations}
}
const luma=rgb=>rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)
function contrast(s){const a=luma(s.background),b=luma(s.text);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}
async function sample(p,chip,event,activate){
 await chip.evaluate((e,event)=>{window.__samples=[];window.__sampleDone=false;e.addEventListener(event,()=>{const began=performance.now();function step(){const s=getComputedStyle(e),t=getComputedStyle(e.querySelector('.slot-time')),time=performance.now()-began;window.__samples.push({time,background:s.backgroundColor,text:t.color});if(time<180)requestAnimationFrame(step);else window.__sampleDone=true}step()},{once:true})},event)
 await activate();await p.waitForFunction(()=>window.__sampleDone);const values=await p.evaluate(()=>window.__samples);for(const s of values)s.contrast=contrast(s);return{minimum:Math.min(...values.map(s=>s.contrast)),values}
}
async function runMotion(browser,reduced){for(const [width,height] of widths)for(const build of reduced?['candidate']:['baseline','candidate']){
 const {c,p,errors,mutations}=await open(browser,build,width,height,'v2','direct',reduced)
 try{
  assert.equal(await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),reduced)
  if(width<768){await p.locator('.pc2-profile-mobile-cta').click();await p.waitForFunction(()=>{const e=document.querySelector('.slot-card'),r=e?.getBoundingClientRect();return r&&r.top>=0&&r.bottom<=innerHeight})}
  const chips=p.locator('.slot-card'),chip=chips.first();await chip.waitFor();await chip.scrollIntoViewIfNeeded()
  const names=await chips.evaluateAll(es=>es.map(e=>({time:e.querySelector('.slot-time').textContent.trim(),name:e.getAttribute('aria-label')})))
  if(build==='candidate')for(const n of names){assert.equal(n.name,`${n.time} — Надіслати запит на цей час`);assert.equal(n.name.split(n.time).length,2);assert.equal(await p.getByRole('button',{name:n.name,exact:true}).count(),1)}
  await p.mouse.move(0,0);await chip.evaluate(e=>e.blur());await chip.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))))
  const normal=await chip.evaluate(e=>({background:getComputedStyle(e).backgroundColor,text:getComputedStyle(e.querySelector('.slot-time')).color}));assert(contrast(normal)>=4.5)
  const hover=await sample(p,chip,'pointerenter',()=>chip.hover())
  if(build==='candidate')assert(hover.minimum>=4.5);else assert(hover.minimum<4.5)
  await p.screenshot({path:path.join(out,`${build}-${reduced?'reduced':'normal'}-${width}.png`)})
  await p.mouse.move(0,0);await chip.evaluate(e=>e.blur());await chip.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));await p.keyboard.press('Tab')
  const focus=await sample(p,chip,'focus',()=>chip.focus())
  const focusStyle=await chip.evaluate(e=>({visible:e.matches(':focus-visible'),width:getComputedStyle(e).outlineWidth}));assert(focusStyle.visible&&parseFloat(focusStyle.width)>=2)
  if(build==='candidate')assert(focus.minimum>=4.5)
  await chip.evaluate(e=>{e.disabled=true});await chip.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));const disabled=await chip.evaluate(e=>{const s=getComputedStyle(e),v={disabled:e.disabled,background:s.backgroundColor,text:getComputedStyle(e.querySelector('.slot-time')).color,opacity:s.opacity};e.disabled=false;return v});assert(disabled.disabled);assert.notEqual(disabled.text,disabled.background)
  assert.deepEqual(errors,[]);assert.equal(mutations.filter(m=>m.path.startsWith('/api/')&&!m.path.includes('/auth/token/refresh/')).length,0)
  rows.push({build,reduced,width,height,names,normal,hover,focus,focusStyle,disabled,errors});console.log(engine+' '+build+' '+width+' reduced='+reduced+' PASS')
 }finally{await c.close()}
}}
async function parity(browser){for(const [width,height] of widths)for(const build of ['baseline','candidate']){const{c,p}=await open(browser,build,width,height,'v1');await p.mouse.move(0,0);await p.screenshot({path:path.join(out,`v1-${build}-${width}.png`),fullPage:true});await c.close()}}
async function empty(browser){for(const [width,height] of widths)for(const mode of ['empty','request']){const{c,p,gets}=await open(browser,'candidate',width,height,'v2',mode);if(width<768){await p.locator('.pc2-profile-mobile-cta').click();await p.locator('dialog[open]').waitFor()}assert.equal(await p.locator('.slot-card').count(),0);if(mode==='request')assert.equal(gets.filter(x=>x.endsWith('/booking/slots/')).length,0);rows.push({width,height,mode,noFabricatedSlots:true,slotGets:gets.filter(x=>x.endsWith('/booking/slots/')).length});await c.close()}}
async function touch(browser){if(engine!=='chromium')return;for(const [width,height] of widths.slice(0,2)){const{c,p,mutations}=await open(browser,'candidate',width,height,'v2','direct',false,true);await p.locator('.pc2-profile-mobile-cta').tap();await p.waitForFunction(()=>document.activeElement?.matches('.slot-card'));await p.locator('.pc2-profile-overlay--request').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));const chip=p.locator('.slot-card').first(),r=await chip.boundingBox(),cdp=await c.newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});const s=await chip.evaluate(e=>({background:getComputedStyle(e).backgroundColor,text:getComputedStyle(e.querySelector('.slot-time')).color}));assert(contrast(s)>=4.5);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.locator('.guest-booking-form').waitFor();assert.equal(mutations.filter(x=>x.path.startsWith('/api/')&&!x.path.includes('/auth/token/refresh/')).length,0);rows.push({width,height,touchEmulation:true,contrast:contrast(s),requestFormOpened:true});await c.close()}}
async function main(){let b;try{for(const reduced of [false,true]){b=await pw[engine].launch(engine==='firefox'?{channel:'moz-firefox',executablePath:'C:/Program Files/Mozilla Firefox/firefox.exe',headless:true,firefoxUserPrefs:{'ui.prefersReducedMotion':reduced?1:0}}:{});const version=b.version();await runMotion(b,reduced);if(!reduced){await parity(b);await empty(b);await touch(b)}await b.close();b=null;rows.push({engine,version,reduced,browserClosed:true})}}catch(e){failures.push(e.stack);console.error(e.message);process.exitCode=1}finally{if(b)await b.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({engine,environment:'Windows 11 Pro x64; headless; Firefox via native WebDriver BiDi',rows,failures},null,2))}}
main().catch(e=>{console.error(e);process.exitCode=1})
