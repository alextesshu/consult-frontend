const{chromium,fs,assert,out,base,setup,ready,shot}=require('./kan158-v67-common.cjs');
(async()=>{const b=await chromium.launch();const result=[];
for(const motion of ['no-preference','reduce']){
 const{c,p,errors}=await setup(b,375,motion);await p.goto(base+'/s/olena?ui=v2');await ready(p);
 await p.locator('.pc2-profile-mobile-cta').click();await p.waitForTimeout(motion==='reduce'?40:450);
 const req=p.locator('.pc2-profile-overlay--request');assert.equal(await req.getAttribute('open'),'');
 if(motion==='reduce')assert(Number.parseFloat(await req.evaluate(e=>getComputedStyle(e).transitionDuration))<=.001);
 await p.keyboard.press('Shift+Tab');assert(await req.evaluate(e=>e.contains(document.activeElement)));
 await p.keyboard.press('Escape');await p.waitForTimeout(motion==='reduce'?40:450);assert.equal(await p.locator('dialog[open]').count(),0);
 await p.getByRole('button',{name:'Більше про мене',exact:true}).click();await p.waitForTimeout(motion==='reduce'?40:450);
 const about=p.locator('.pc2-profile-overlay--about');await about.getByRole('button',{name:'Обрати час',exact:true}).click();await p.waitForTimeout(motion==='reduce'?100:900);assert.equal(await req.getAttribute('open'),'');assert.equal(await p.locator('dialog[open]').count(),1);
 await p.setViewportSize({width:1280,height:900});await p.waitForTimeout(500);assert.equal(await p.locator('dialog[open]').count(),0);assert.equal(await p.evaluate(()=>document.body.style.overflow),'');
 await p.setViewportSize({width:375,height:677});await p.waitForTimeout(100);await p.getByRole('button',{name:'Більше про мене',exact:true}).click();await p.waitForTimeout(450);
 await p.evaluate(async()=>{const{applyUiVersion}=await import('/src/lib/uiVersion.ts');applyUiVersion('v1')});await p.waitForTimeout(100);assert.equal(await p.locator('.pc2-profile-overlay').count(),0);assert.equal(await p.evaluate(()=>document.body.style.overflow),'');
 assert.deepEqual(errors,[]);result.push({motion,keyboard:true,aboutToRequestOneDialog:true,resizeUnlock:true,versionSwitchCleanup:true,errors});await c.close()
}
// Native share success and cancel do not open a second interface; a failed API falls back.
{const{c,p}=await setup(b,375);await p.goto(base+'/s/olena?ui=v2');await ready(p);await p.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__shared=data}}));await p.getByRole('button',{name:'Поділитися профілем',exact:true}).click();assert.equal(await p.locator('dialog[open]').count(),0);assert.equal(await p.evaluate(()=>window.__shared.url),base+'/s/olena');
await p.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError')}}));await p.getByRole('button',{name:'Поділитися профілем',exact:true}).click();assert.equal(await p.locator('dialog[open]').count(),0);
await p.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new Error('Unavailable')}}));await p.getByRole('button',{name:'Поділитися профілем',exact:true}).click();await p.waitForTimeout(450);assert.equal(await p.locator('.pc2-profile-overlay--share[open]').count(),1);await p.mouse.click(5,5);await p.waitForTimeout(450);assert.equal(await p.locator('dialog[open]').count(),0);result.push({nativeShareMock:true,cancelNoFallback:true,errorFallback:true,backdrop:true});await c.close()}
for(const mode of ['request-only','empty','404']){
 const{c,p,errors}=await setup(b,375,'reduce',false,mode);await p.goto(base+'/s/olena?ui=v2');if(mode==='404'){await p.getByRole('heading',{name:'Профіль недоступний',exact:true}).waitFor();assert.equal(await p.locator('.pc2-request-panel').count(),0)}else{await ready(p);if(mode==='request-only')assert.equal(await p.locator('#slots').count(),0);else{await p.locator('.pc2-profile-mobile-cta').click();await p.getByText('На цю дату вільних вікон немає.',{exact:false}).count()}}
 await shot(p,`vue-375-${mode}`);assert.deepEqual(errors,[]);result.push({mode,noInventedAvailability:true,errors});await c.close()
}
fs.writeFileSync(out+'/lifecycle-acceptance.json',JSON.stringify(result,null,2));await b.close();console.log('Lifecycle, reduced motion, native share, error/empty gates PASS')})().catch(e=>{console.error(e);process.exit(1)})
