const {chromium}=require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../../../../..');
const out=root+'/docs/ui-v2/evidence/kan-158/local-polish';fs.mkdirSync(out,{recursive:true});
const replay=new Map();
async function open(b,width,origin,version='v2',baseline=false,name=null){
 const c=await b.newContext({viewport:{width,height:width===375?677:900},reducedMotion:'reduce'});
 await c.addInitScript(()=>localStorage.setItem('proconsult.product_analytics_consent.v1',JSON.stringify({version:1,preference:'denied'})));
 // Only baseline captures proxy real GETs: its temporary port is deliberately not added to Django CORS.
 const useReplay=baseline||version==='v1'||Boolean(name);
 if(useReplay)await c.route('**/api/**',async r=>{
  const key=new URL(r.request().url()).pathname+new URL(r.request().url()).search;
  assert(r.request().method()==='GET'||key.includes('/auth/token/refresh/'));
  let value=replay.get(key);
  if(!value){const response=await r.fetch();value={status:response.status(),contentType:'application/json',body:await response.text()};if(value.status===200)replay.set(key,value)}
  if(name&&key==='/api/s/specialist/')value={...value,body:JSON.stringify({...JSON.parse(value.body),public_display_name:name,display_name:name})};
  await r.fulfill(value);
 });
 const p=await c.newPage(),network=[],errors=[],consoleErrors=[],writes=[];
 p.on('response',async r=>{if(r.url().includes('/api/')){const u=new URL(r.url());network.push({path:u.pathname,status:r.status()});if(!useReplay&&r.status()===200){const body=await r.text();replay.set(u.pathname+u.search,{status:200,contentType:'application/json',body})}}});
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
 p.on('request',r=>{if(['POST','PATCH','DELETE','PUT'].includes(r.method()))writes.push({method:r.method(),path:new URL(r.url()).pathname})});
 await p.goto(origin+'/s/specialist?ui='+version,{waitUntil:'domcontentloaded'});try{await p.locator('h1').waitFor()}catch(e){console.log(JSON.stringify({width,origin,version,network,errors,body:(await p.locator('body').innerText()).slice(0,800)}));throw e}await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(1300);
 return {c,p,network,errors,consoleErrors,writes};
}
async function titleMetrics(p){return p.locator('h1').evaluate(e=>{
 const walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),runs=[];let text;
 while(text=walker.nextNode()){const words=text.textContent.match(/\S+/g)||[];let offset=0;for(const word of words){const start=text.textContent.indexOf(word,offset),r=document.createRange();r.setStart(text,start);r.setEnd(text,start+word.length);const rects=[...r.getClientRects()];runs.push({word,lines:new Set(rects.map(r=>Math.round(r.y))).size,width:Math.max(...rects.map(r=>r.width)),available:e.clientWidth});offset=start+word.length;}}
 return {fontSize:getComputedStyle(e).fontSize,runs,overflow:document.documentElement.scrollWidth>innerWidth};
})}
async function shot(p,name,fullPage=true){await p.screenshot({path:out+'/'+name+'.png',fullPage})}
(async()=>{const b=await chromium.launch({headless:true});const results=[];
try{for(const width of [375,768,1280,1440]){
 for(const [label,origin,baseline] of [['before','http://localhost:5364',true],['after','http://localhost:5173',false]]){
  console.log('capture',width,label);
  const {p,c,network,errors,consoleErrors,writes}=await open(b,width,origin,'v2',baseline);
  await shot(p,label+'-v2-'+width);const title=await titleMetrics(p);
  const sections=await p.locator('.profile-content-section,.panel--trust').evaluateAll(es=>es.map(e=>({class:e.className,alignContent:getComputedStyle(e).alignContent,height:e.getBoundingClientRect().height,headerHeight:e.querySelector('.panel__header')?.getBoundingClientRect().height})));
  if(!baseline){assert(!title.overflow);assert(title.runs.every(w=>w.lines===1&&w.width<=w.available+1));assert(sections.every(s=>s.alignContent==='start'));
   await p.getByRole('button',{name:'Більше про мене',exact:true}).click();await p.locator('.pc2-profile-overlay--about[open]').waitFor();await shot(p,'after-about-'+width,false);await p.keyboard.press('Escape');await p.waitForTimeout(100);assert.equal(await p.locator('dialog[open]').count(),0);
   await p.getByRole('button',{name:'Поділитися профілем',exact:true}).click();await p.locator('.pc2-profile-overlay--share[open]').waitFor();await shot(p,'after-share-'+width,false);await p.keyboard.press('Escape');await p.waitForTimeout(100);
   if(width<860){await p.locator('.pc2-profile-mobile-cta').click();await p.locator('.pc2-profile-overlay--request[open]').waitFor();assert.equal(await p.locator('.pc2-request-panel').count(),1);await shot(p,'after-request-'+width,false)}
   else{
    await p.evaluate(()=>window.scrollTo(0,600));await p.waitForTimeout(100);
    const panel=await p.locator('.pc2-request-panel').evaluate(e=>({top:e.getBoundingClientRect().top,height:e.clientHeight,scrollHeight:e.scrollHeight,overflow:getComputedStyle(e).overflowY,overscroll:getComputedStyle(e).overscrollBehavior,scrollbar:getComputedStyle(e).scrollbarWidth}));
    assert.equal(panel.top,96);assert.equal(panel.overflow,'auto');assert.equal(panel.overscroll,'contain');
    await p.locator('.identity-rail__contact').first().focus();assert(await p.locator('.identity-rail__contact').first().evaluate(e=>e===document.activeElement));
    await p.locator('.pc2-request-panel').evaluate(e=>e.scrollTop=e.scrollHeight);await shot(p,'after-panel-bottom-'+width,false);
    await p.mouse.move(200,500);const y=await p.evaluate(()=>scrollY);await p.mouse.wheel(0,400);await p.waitForTimeout(150);assert((await p.evaluate(()=>scrollY))>y);
   }
   const actions=p.locator('.identity-rail__actions');await actions.getByRole('button',{name:'Залишити запит',exact:true}).click();await p.getByLabel('Ім’я',{exact:true}).waitFor();assert.equal(await p.locator('.guest-booking-form').count(),1);
   await shot(p,'after-contact-'+width,false);
   assert.equal(writes.filter(x=>!x.path.includes('/auth/')).length,0);assert.equal(errors.length,0);
  }
  results.push({width,label,title,sections,network,errors,consoleErrors,writes,requestSubmission:'NOT EXECUTED: actual local SMTP delivery is not isolated'});await c.close();
 }
 for(const [label,origin,baseline] of [['baseline','http://localhost:5364',true],['candidate','http://localhost:5173',false]]){const {p,c}=await open(b,width,origin,'v1',baseline);await shot(p,label+'-v1-'+width);await c.close()}
}
const names=[];
for(const width of [375,768,1280,1440])for(const name of ['Анна Лі','Олександр Константінов','Олександра Константінопольська-Вишневецька']){
 const {c,p}=await open(b,width,'http://localhost:5173','v2',false,name);const metrics=await titleMetrics(p);assert(!metrics.overflow);assert(metrics.runs.every(r=>r.lines===1&&r.width<=r.available+1),JSON.stringify({name,width,metrics}));names.push({width,name,...metrics,source:'name variants on replay of actual local DTOs; separate from direct real smoke'});await shot(p,'name-'+width+'-'+names.length,false);await c.close();
}
fs.writeFileSync(out+'/browser-results.json',JSON.stringify({backend:'http://127.0.0.1:8000',candidateOrigin:'http://localhost:5173',baseline:'f84a329; temporary Vite load hook; baseline/V1/names replay actual local DTOs; after-v2 direct API',results,names},null,2)+'\n');console.log('PASS: four-width real local GET/form/overlay/panel checks; 12 name variants; parity captures; no guest POST executed');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
