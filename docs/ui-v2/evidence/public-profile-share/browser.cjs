// Local-only share acceptance. Auth/API/clipboard/native-share are synthetic; no social post or business write.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const origin=process.env.SHARE_ORIGIN,baseline=process.env.SHARE_BASELINE,out=process.env.SHARE_EVIDENCE;
for(const x of [origin,baseline])if(!x||!['localhost','127.0.0.1'].includes(new URL(x).hostname))throw new Error('Local previews required');
if(!out||fs.existsSync(out))throw new Error('New evidence directory required');fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync('src/views/PublicProfileView.spec.ts','utf8');
const base=new Function('return ({'+source.split('const base: PublicSpecialistProfile = {')[1].split('\n  }')[0]+'})')();
Object.assign(base,{slug:'specialist-2',public_slug:'specialist-2',photo_url:null,video_url:null});
const rows=[],writes=[],external=[];
async function open(browser,width,role,copyMode='success'){
 const c=await browser.newContext({viewport:{width,height:900},hasTouch:width<768,locale:'uk-UA',timezoneId:'Europe/Kyiv',reducedMotion:'reduce'});
 await c.addInitScript((mode)=>{
  localStorage.setItem('proconsult.product_analytics_consent.v1',JSON.stringify({version:1,preference:'denied'}));
  window.__nativeShareCalls=0;window.__copied=[];window.__fallback=[];
  Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{window.__nativeShareCalls++}});
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{if(mode!=='success')throw new Error('Synthetic denied');window.__copied.push(text)}}});
  document.execCommand=()=>{window.__fallback.push({inside:!!document.activeElement.closest('dialog'),value:document.activeElement.value});return mode==='fallback'};
 },copyMode);
 await c.route('**/*',r=>{
  const q=r.request(),u=new URL(q.url()),x=u.pathname;
  if(!['GET','HEAD'].includes(q.method())){writes.push({method:q.method(),path:x});if(x.endsWith('/auth/token/refresh/'))return r.fulfill({status:role==='guest'?401:200,json:{access:'synthetic-access'}});return r.fulfill({status:405,json:{}})}
  if(x.startsWith('/api/')){
   const json=v=>r.fulfill({json:v});
   if(x.endsWith('/s/specialist-2/'))return json(base);
   if(x.endsWith('/me/'))return role==='guest'?r.fulfill({status:401,json:{}}):json({user:{id:role==='specialist'?1:2,username:'synthetic-'+role,roles:[role.toUpperCase()]},access_state:'OK',effective_entitlements:{plan:'PRO'},counts:{}});
   if(x.endsWith('/cabinet/profile/'))return json({...base,id:1,public_profile_enabled:true,is_search_visible:true,public_profile_path:'/s/specialist-2',public_profile_url:origin+'/s/specialist-2',timezone:'Europe/Kyiv',public_profile_readiness:{is_ready:true,completed_count:6,total_count:6,missing_items:[],items:[]}});
   if(x.includes('/notifications'))return json({results:[],unread_count:0});
   if(x.includes('/chat/unread'))return json({unread_count:0});
   if(x.endsWith('/cabinet/work-queue/'))return json({pending_guest_requests_count:0});
   if(x.endsWith('/booking/slots/'))return json([]);
   return json([]);
  }
  if(['www.threads.com','www.facebook.com','t.me','www.instagram.com'].includes(u.hostname)){external.push(u.href);return r.fulfill({contentType:'text/html',body:'<!doctype html><title>Intercepted share destination</title>'})}
  return ['localhost','127.0.0.1','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)?r.continue():r.abort();
 });
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));return {c,p,errors};
}
async function ready(p){await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready);await p.locator('main h1').first().waitFor()}
async function bounds(p){return p.evaluate(()=>{const d=document.querySelector('.pc2-profile-overlay--share[open]')||document.querySelector('.article-share-dialog__panel'),r=d?.getBoundingClientRect();return{scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,dialog:r?{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}:null,focusInside:!!d?.contains(document.activeElement)}})}
async function share(p){const trigger=p.getByRole('button',{name:'Поділитися профілем',exact:true});await trigger.focus();await trigger.click();const dialog=p.getByRole('dialog',{name:'Поділитися профілем'});await dialog.waitFor();return{trigger,dialog}}
async function one(b,width,role,ui,mode='success',cabinet=false){
 const {c,p,errors}=await open(b,width,role,mode),row={width,role,ui,mode,cabinet};
 try{
  await p.goto(origin+(cabinet?'/cabinet/profile':'/s/specialist-2')+'?ui='+ui);await ready(p);
  const {trigger,dialog}=await share(p);assert.equal(await p.evaluate(()=>window.__nativeShareCalls),0);
  const state=await bounds(p);assert(state.scrollWidth<=width);if(ui==='v2'){
   assert(state.dialog.x>=0&&state.dialog.right<=width);assert(state.dialog.y>=0&&state.dialog.bottom<=900);row.initial=state;
   const copy=await dialog.getByRole('button',{name:'Копіювати посилання',exact:true}).boundingBox();assert(copy&&copy.y>=state.dialog.y&&copy.y+copy.height<=state.dialog.bottom,'initial copy action clipped');
   if(role==='guest'&&!cabinet&&mode==='success')await p.screenshot({path:path.join(out,`share-${width}.png`)});
  }
  const canonical='https://proconsult.space/s/specialist-2';
  if(ui==='v2'){
   for(const platform of ['Telegram','Facebook','Threads']){
    const link=dialog.getByRole('link',{name:platform,exact:true});const url=new URL(await link.getAttribute('href'));assert([...url.searchParams.values()].includes(canonical));assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
    const pop=p.waitForEvent('popup');await link.click();await(await pop).close();
   }
   assert((await dialog.innerText()).includes('Threads не відкрився?'));
   const ig=dialog.getByRole('button',{name:/Instagram/});await ig.click();
   if(mode==='failure'){assert(await dialog.getByRole('alert').isVisible());assert.equal(await dialog.getByRole('textbox',{name:'Посилання профілю'}).inputValue(),canonical)}
   else{assert((await p.evaluate(()=>window.__copied)).includes(canonical)||mode==='fallback');assert(await dialog.getByRole('link',{name:'Відкрити Instagram'}).isVisible())}
   const fb=await p.evaluate(()=>window.__fallback);if(mode==='fallback'){assert(fb.length>0&&fb.every(x=>x.inside&&x.value===canonical))}
   row.expanded=await bounds(p);assert(row.expanded.dialog.bottom<=900&&row.expanded.dialog.right<=width);
   if(role==='guest'&&!cabinet&&mode==='success'){
    await dialog.getByRole('button',{name:'Скопійовано ✓',exact:true}).scrollIntoViewIfNeeded();
    await p.screenshot({path:path.join(out,`share-expanded-${width}.png`)});
   }
  }else{
   await dialog.getByRole('button',{name:'Копіювати посилання',exact:true}).click();assert((await p.evaluate(()=>window.__copied)).includes(canonical));
  }
  for(const key of ['Tab','Shift+Tab'])for(let i=0;i<10;i++){await p.keyboard.press(key);assert(await dialog.evaluate(e=>e.contains(document.activeElement)),'focus escaped modal')}
  await p.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await trigger.evaluate(e=>e===document.activeElement));
  const again=await share(p);await again.dialog.getByRole('button',{name:'Закрити',exact:true}).click();await again.dialog.waitFor({state:'hidden'});assert(await again.trigger.evaluate(e=>e===document.activeElement));
  assert.deepEqual(errors,[]);row.result='PASS';
 }catch(e){row.result='FAIL';row.error=e.stack;row.errors=errors;await p.screenshot({path:path.join(out,`FAIL-${width}-${role}-${ui}-${mode}-${cabinet}.png`)});console.log('FAIL',JSON.stringify(row))}
 rows.push(row);await c.close();
}
(async()=>{const b=await chromium.launch();try{
 // Baseline repro does not invoke the real operating-system sheet.
 for(const width of [375,1280]){const{c,p}=await open(b,width,'guest');await p.goto(baseline+'/s/specialist-2?ui=v2');await ready(p);await p.getByRole('button',{name:'Поділитися профілем',exact:true}).click();const calls=await p.evaluate(()=>window.__nativeShareCalls);rows.push({baseline:true,width,nativeCalls:calls,result:'BASELINE'});await p.screenshot({path:path.join(out,`before-${width}.png`)});await c.close()}
 for(const width of [375,390,1280])for(const role of ['guest','specialist','client'])for(const ui of ['v1','v2'])await one(b,width,role,ui);
 for(const width of [375,390,1280])for(const mode of ['fallback','failure'])await one(b,width,'guest','v2',mode);
 for(const width of [375,1280])await one(b,width,'specialist','v2','success',true);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({engine:b.version(),environment:'Windows Chromium headless, local synthetic auth/API/clipboard/native share; social popups intercepted',rows,writes,external},null,2));
}finally{await b.close()}console.log('CASES',rows.length,'FAIL',rows.filter(x=>x.result==='FAIL').length);if(rows.some(x=>x.result==='FAIL'))process.exitCode=1})().catch(e=>{console.error(e);process.exitCode=1});
