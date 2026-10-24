const {chromium}=require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core');
const fs=require('fs'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'../../../../..'),out=root+'/docs/ui-v2/evidence/kan-158/offer-contrast';fs.mkdirSync(out,{recursive:true});const cache=new Map();
async function open(b,width,baseline=false,version='v2'){
 const c=await b.newContext({viewport:{width,height:width===375?677:900},reducedMotion:'reduce'}),network=[],errors=[];
 await c.addInitScript(()=>localStorage.setItem('proconsult.product_analytics_consent.v1',JSON.stringify({version:1,preference:'denied'})));
 if(baseline||version==='v1')await c.route('**/api/**',async r=>{const u=new URL(r.request().url()),key=u.pathname+u.search;let v=cache.get(key);if(!v){const response=await r.fetch();v={status:response.status(),contentType:'application/json',body:await response.text()};if(v.status===200)cache.set(key,v)}await r.fulfill(v)});
 await c.route('**/guest-booking-requests/',()=>{throw Error('Unexpected guest POST')});
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',async r=>{if(r.url().includes('/api/')){const u=new URL(r.url());network.push({path:u.pathname,status:r.status()});if(!baseline&&version==='v2'&&r.status()===200)cache.set(u.pathname+u.search,{status:200,contentType:'application/json',body:await r.text()})}});
 await p.goto((baseline?'http://localhost:5366':'http://localhost:5173')+'/s/specialist?ui='+version,{waitUntil:'domcontentloaded'});await p.locator('h1').waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);return{c,p,network,errors};
}
async function settle(p){await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
async function click(p,target){await target.evaluate(e=>{const a=e.closest('dialog[open]')??e.closest('.pc2-request-panel');if(!a)return;const r=e.getBoundingClientRect(),b=a.getBoundingClientRect();if(r.top<b.top+12||r.bottom>Math.min(innerHeight,b.bottom)-12)a.scrollTop+=r.top-b.top-24});const r=await target.boundingBox();await p.mouse.click(r.x+r.width/2,r.y+r.height/2);await settle(p)}
function rgb(s){return s.match(/[\d.]+/g).slice(0,3).map(Number)}
function luminance(rgb){return rgb.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0)}
function ratio(f,b){const a=luminance(rgb(f)),z=luminance(rgb(b));return(Math.max(a,z)+.05)/(Math.min(a,z)+.05)}
async function measure(target){return target.evaluate(e=>{const s=getComputedStyle(e);return{label:e.querySelector('.guest-offer-option__label')?.textContent,pressed:e.getAttribute('aria-pressed'),disabled:e.disabled,background:s.backgroundColor,opacity:Number(s.opacity),borderStyle:s.borderStyle,outline:s.outlineStyle,outlineWidth:s.outlineWidth,text:[...e.querySelectorAll('.guest-offer-option__label,.guest-offer-option__meta')].map(x=>({class:x.className,color:getComputedStyle(x).color,text:x.textContent}))}})}
async function record(p,target,width,offer,state,rows){const result=await measure(target);for(const x of result.text)x.contrast=ratio(x.color,result.background);assert(result.text.every(x=>x.contrast>=4.5),JSON.stringify(result));assert.equal(result.opacity,1);rows.push({width,offer,state,...result});await p.screenshot({path:out+'/'+width+'-'+offer+'-'+state+'.png'});}
async function request(p,width){await p.evaluate(()=>scrollTo({top:500,behavior:'instant'}));if(width<860){await click(p,p.locator('.pc2-profile-mobile-cta'));await p.locator('.pc2-profile-overlay--request[open]').waitFor()}await click(p,p.locator('.identity-rail__actions').getByRole('button',{name:'Залишити запит',exact:true}));await p.locator('.guest-offer-option').first().waitFor()}
(async()=>{const b=await chromium.launch();const rows=[],smoke=[],summaries=[];try{
 for(const width of [375,768,1280,1440]){console.log('width',width);const{p,c,network,errors}=await open(b,width);await request(p,width);const pageY=await p.evaluate(()=>scrollY);
  for(const [index,offer] of [[0,'standard'],[1,'intro']]){
   if(await p.locator('.guest-offer-summary').isVisible())await click(p,p.locator('.guest-offer-summary button'));
   const card=p.locator('.guest-offer-option').nth(index),other=p.locator('.guest-offer-option').nth(1-index);
   await click(p,card);await p.locator('.guest-offer-summary').waitFor();
   const summary=await p.locator('.guest-offer-summary').evaluate(e=>({background:getComputedStyle(e).backgroundColor,text:[...e.querySelectorAll('strong,.guest-offer-summary__meta,.guest-offer-summary__eyebrow')].map(x=>({color:getComputedStyle(x).color,text:x.textContent}))}));for(const x of summary.text)x.contrast=ratio(x.color,summary.background);assert(summary.text.every(x=>x.contrast>=4.5),JSON.stringify(summary));summaries.push({width,offer,...summary});await p.screenshot({path:out+'/'+width+'-'+offer+'-summary.png'});
   await click(p,p.locator('.guest-offer-summary button'));await p.mouse.move(5,5);await record(p,card,width,offer,'selected',rows);
   await record(p,other,width,index?'standard':'intro','unselected',rows);
   const otherBox=await other.boundingBox();await p.mouse.move(otherBox.x+otherBox.width/2,otherBox.y+otherBox.height/2);await record(p,other,width,index?'standard':'intro','unselected-hover',rows);
   await other.evaluate(e=>e.focus({preventScroll:true}));await p.keyboard.press('Shift+Tab');await p.keyboard.press('Tab');await record(p,other,width,index?'standard':'intro','unselected-focus',rows);
   const r=await card.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await record(p,card,width,offer,'hover',rows);
   await card.evaluate(e=>e.focus({preventScroll:true}));await p.keyboard.press('Shift+Tab');await p.keyboard.press('Tab');await record(p,card,width,offer,'focus',rows);const focus=await measure(card);assert.notEqual(focus.outline,'none');assert(parseFloat(focus.outlineWidth)>=2);
   await card.evaluate(e=>e.disabled=true);await other.evaluate(e=>e.disabled=true);await record(p,card,width,offer,'selected-disabled',rows);await record(p,other,width,index?'standard':'intro','unselected-disabled',rows);await card.evaluate(e=>e.disabled=false);await other.evaluate(e=>e.disabled=false);
   assert.equal(await p.evaluate(()=>scrollY),pageY,'document scroll changed');
  }
  const owner=width<860?'.pc2-profile-overlay--request':'.pc2-request-panel';await p.locator(owner).evaluate(e=>e.scrollTop=0);const box=await p.locator(owner).boundingBox();await p.mouse.move(box.x+box.width/2,box.y+Math.min(350,box.height/2));await p.mouse.wheel(0,500);await p.waitForFunction(owner=>document.querySelector(owner).scrollTop>0,owner);assert.equal(await p.evaluate(()=>scrollY),pageY);await p.locator(owner).evaluate(e=>e.scrollTop=e.scrollHeight);assert.equal(errors.length,0);smoke.push({width,network,errors,scrollOwner:owner,documentY:pageY,wheel:true});await c.close();
  for(const[label,base]of[['baseline',true],['candidate',false]]){const{p,c}=await open(b,width,base,'v1');await p.screenshot({path:out+'/'+label+'-v1-'+width+'.png',fullPage:true});await c.close()}
 }
 const before=await open(b,1440,true);await request(before.p,1440);const broken=await measure(before.p.locator('.guest-offer-option--active'));for(const x of broken.text)x.contrast=ratio(x.color,broken.background);await before.p.screenshot({path:out+'/before-1440.png'});await before.c.close();
 fs.writeFileSync(out+'/contrast-results.json',JSON.stringify({baseline:'7a535bd6577dc4321c05f1d65cb65ba669a7b415',source:'direct local Django profile; baseline/V1 reuse public DTOs; disabled states are DOM-only presentation probes, not eligibility changes',before:broken,rows,summaries,smoke},null,2)+'\n');console.log('PASS: computed AA contrast across selected/unselected/hover/focus/disabled, both offers, all widths; summary step and scroll; V1 captures');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
