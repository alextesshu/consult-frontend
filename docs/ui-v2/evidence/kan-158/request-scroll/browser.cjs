const {chromium}=require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core');
const fs=require('fs'),assert=require('assert');
const root=require('path').resolve(__dirname,'../../../../..'),out=root+'/docs/ui-v2/evidence/kan-158/request-scroll';fs.mkdirSync(out,{recursive:true});
const cache=new Map();
async function open(b,width,{baseline=false,version='v2',reduced=false,replay=false}={}){
 const c=await b.newContext({viewport:{width,height:width===375?677:900},reducedMotion:reduced?'reduce':'no-preference'});
 await c.addInitScript(()=>localStorage.setItem('proconsult.product_analytics_consent.v1',JSON.stringify({version:1,preference:'denied'})));
 const useReplay=baseline||version==='v1'||replay;
 if(useReplay)await c.route('**/api/**',async r=>{const u=new URL(r.request().url()),key=u.pathname+u.search;let response=cache.get(key);if(!response){const live=await r.fetch();response={status:live.status(),contentType:'application/json',body:await live.text()};if(response.status===200)cache.set(key,response)}await r.fulfill(response)});
 const p=await c.newPage(),network=[],errors=[],posts=[];
 await c.route('**/guest-booking-requests/',r=>{posts.push(r.request().method());return r.abort()});
 p.on('response',async r=>{if(r.url().includes('/api/')){const u=new URL(r.url());network.push({path:u.pathname,status:r.status()});if(!useReplay&&r.status()===200)cache.set(u.pathname+u.search,{status:200,contentType:'application/json',body:await r.text()})}});
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto((baseline?'http://localhost:5365':'http://localhost:5173')+'/s/specialist?ui='+version,{waitUntil:'domcontentloaded'});await p.locator('h1').waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
 return {c,p,network,errors,posts};
}
async function settled(p){await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
async function geometry(p){return p.locator('.pc2-request-panel,.pc2-profile-inline,.guest-booking-modal,.guest-booking-modal .setting-modal__body').evaluateAll(es=>es.map(e=>({class:e.className,top:e.getBoundingClientRect().top,height:e.clientHeight,scrollHeight:e.scrollHeight,scrollTop:e.scrollTop,overflow:getComputedStyle(e).overflowY})))}
async function visible(p,selector,owner){return p.locator(selector).evaluate((e,owner)=>{const panel=e.closest(owner),r=e.getBoundingClientRect(),a=panel.getBoundingClientRect();return r.top>=Math.max(0,a.top)-1&&r.bottom<=Math.min(innerHeight,a.bottom)+1},owner)}
async function shot(p,name){await p.screenshot({path:out+'/'+name+'.png'})}
async function click(p,target){
 await target.evaluate(e=>{const owner=e.closest('dialog[open]')??e.closest('.pc2-request-panel');if(!owner)return;const r=e.getBoundingClientRect(),a=owner.getBoundingClientRect();if(r.top<a.top+12||r.bottom>Math.min(innerHeight,a.bottom)-12)owner.scrollTop+=r.top-a.top-24});
 const r=await target.boundingBox();await p.mouse.click(r.x+r.width/2,r.y+r.height/2);
}
async function exercise(p,width,name){
 const mobile=width<860,owner=mobile?'.pc2-profile-overlay--request':'.pc2-request-panel';
 await p.evaluate(()=>scrollTo({top:500,behavior:'instant'}));
 if(mobile){await click(p,p.locator('.pc2-profile-mobile-cta'));await p.locator('.pc2-profile-overlay--request[open]').waitFor();await p.waitForTimeout(450)}
 const beforeY=await p.evaluate(()=>scrollY);
 await click(p,p.locator('.identity-rail__actions').getByRole('button',{name:'Залишити запит',exact:true}));await p.locator('.guest-booking-form').waitFor();await settled(p);
 assert.equal(await p.evaluate(()=>scrollY),beforeY,'document moved on CTA');
 if(!mobile)assert.equal(await p.locator(owner).evaluate(e=>e.scrollTop),0);
 const structure=await geometry(p);assert(structure.slice(1).every(r=>r.overflow==='visible'));
 await shot(p,name+'-open');
 const bounds=await p.locator(owner).boundingBox();await p.mouse.move(bounds.x+bounds.width/2,bounds.y+Math.min(350,bounds.height/2));
 const initial=await p.locator(owner).evaluate(e=>e.scrollTop);await p.mouse.wheel(0,480);await p.waitForFunction(({owner,initial})=>document.querySelector(owner).scrollTop>initial,{owner,initial});
 assert.equal(await p.evaluate(()=>scrollY),beforeY,'document moved on wheel');
 const checkbox=p.locator('.guest-booking-form .setting-check input');if(await checkbox.count()){await click(p,checkbox);await settled(p);assert(await checkbox.isChecked())}
 await p.locator('#guestBookingName').evaluate((e,mobile)=>e.focus(mobile?undefined:{preventScroll:true}),mobile);await settled(p);assert(await visible(p,'#guestBookingName',owner));
 let tabSteps=0,reachedSubmit=false;
 for(let i=0;i<80;i++){
  await p.keyboard.press('Tab');await settled(p);
  const focused=await p.evaluate(owner=>{const el=document.activeElement,r=el.getBoundingClientRect(),box=el.closest(owner)?.getBoundingClientRect();return {inside:Boolean(box),visible:Boolean(box&&r.top>=Math.max(box.top,0)-1&&r.bottom<=Math.min(box.bottom,innerHeight)+1)}},owner);
  assert(focused.inside&&focused.visible,JSON.stringify({width,step:i,focused}));
  assert.equal(await p.evaluate(()=>scrollY),beforeY,'document moved on Tab');
  tabSteps++;
  if(await p.evaluate(()=>document.activeElement.matches('.guest-booking-form button[type=submit]'))){reachedSubmit=true;break}
 }
 assert(reachedSubmit,'Tab did not reach submit');
 await p.locator('#guestBookingMessage').fill('Local scroll acceptance. '.repeat(10));await settled(p);
 const typingTop=await p.locator(owner).evaluate(e=>e.scrollTop);await p.locator('#guestBookingMessage').press('End');await p.keyboard.type('More text');await settled(p);assert.equal(await p.locator(owner).evaluate(e=>e.scrollTop),typingTop,'typing moved owner unexpectedly');
 const topic=p.locator('.guest-request-topic-chip').first();await topic.evaluate((e,mobile)=>e.focus(mobile?undefined:{preventScroll:true}),mobile);await settled(p);const topicTop=await p.locator(owner).evaluate(e=>e.scrollTop);await click(p,topic);await settled(p);assert.equal(await p.locator(owner).evaluate(e=>e.scrollTop),topicTop,'topic selection jumped');
 if(await checkbox.count())assert(await checkbox.isChecked());
 await click(p,p.locator('.guest-booking-form button[type=submit]'));await p.locator('#guestBookingNameError').waitFor();await settled(p);
 assert(await visible(p,'#guestBookingName',owner));assert(await visible(p,'#guestBookingNameError',owner));assert.equal(await p.evaluate(()=>scrollY),beforeY);
 await p.locator('#guestBookingName').fill('Local scroll test');await click(p,p.locator('.guest-booking-form button[type=submit]'));await p.locator('#guestBookingContactValueError').waitFor();await settled(p);
 assert(await visible(p,'#guestBookingContactValueError',owner));assert.equal(await p.evaluate(()=>scrollY),beforeY);await shot(p,name+'-validation');
 await p.locator(owner).evaluate(e=>e.scrollTop=e.scrollHeight);assert(await visible(p,'.guest-booking-form button[type=submit]',owner));if(await checkbox.count())assert(await visible(p,'.guest-booking-form .setting-check',owner));await shot(p,name+'-bottom');
 for(let cycle=0;cycle<2;cycle++){
  await click(p,p.locator('.guest-booking-modal .setting-modal__header button'));await p.locator('.guest-booking-form').waitFor({state:'detached'});await settled(p);
  await click(p,p.locator('.identity-rail__actions').getByRole('button',{name:'Залишити запит',exact:true}));await p.locator('.guest-booking-form').waitFor();await settled(p);
  if(!mobile)assert.equal(await p.locator(owner).evaluate(e=>e.scrollTop),0);assert.equal(await p.evaluate(()=>scrollY),beforeY);
 }
 if(mobile){
  assert.equal(await p.evaluate(()=>document.body.style.overflow),'hidden');await p.keyboard.press('Escape');await p.locator('dialog[open]').waitFor({state:'detached'}).catch(()=>{});await p.waitForTimeout(450);
  assert.notEqual(await p.evaluate(()=>document.body.style.overflow),'hidden');assert(await p.locator('.pc2-profile-mobile-cta').evaluate(e=>e===document.activeElement));
  await p.locator('.pc2-profile-mobile-cta').click();await p.waitForTimeout(450);await p.mouse.click(2,10);await p.waitForTimeout(450);assert.equal(await p.locator('dialog[open]').count(),0);
 }
 return {documentY:beforeY,structure,wheel:true,tabSteps,reachedSubmit,validation:true,typingAndTopicsStable:true,repeatCycles:2,mobileNativeLifecycle:mobile};
}
(async()=>{const b=await chromium.launch();const result=[];try{
 for(const width of [1280,1440,375,768]){
  console.log('real',width);const {c,p,network,errors,posts}=await open(b,width);const checks=await exercise(p,width,'after-'+width);assert.equal(posts.length,0);assert.equal(errors.length,0);result.push({width,evidence:'direct actual local Django GETs; only potential guest POST is blocked as a safety guard',network,errors,posts,checks});await c.close();
  for(const [label,baseline] of [['baseline',true],['candidate',false]]){const {p,c}=await open(b,width,{baseline,version:'v1',reduced:true});await p.screenshot({path:out+'/'+label+'-v1-'+width+'.png',fullPage:true});await c.close()}
 }
 for(const width of [1440,375]){console.log('reduced',width);const {p,c}=await open(b,width,{reduced:true,replay:true});result.push({width,evidence:'reduced-motion replay of actual public DTOs',checks:await exercise(p,width,'reduced-'+width)});await c.close()}
 const before=await open(b,1440,{baseline:true});await before.p.evaluate(()=>scrollTo({top:500,behavior:'instant'}));await before.p.locator('.identity-rail__actions').getByRole('button',{name:'Залишити запит',exact:true}).click();await settled(before.p);await shot(before.p,'before-1440');const beforeStructure=await geometry(before.p);await before.c.close();
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({baseline:'5b294accb50d874a013c4f7f1cb13abe8e84f341',backend:'http://127.0.0.1:8000',candidateOrigin:'http://localhost:5173',beforeStructure,result,limits:'Chromium wheel models pointer scrolling, not physical OS trackpad hardware. No real guest POST or PENDING claim.'},null,2)+'\n');console.log('PASS: real four-width scroll/focus/errors/cycles; reduced modes; parity captures');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
