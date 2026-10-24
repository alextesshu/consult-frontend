// Frontend acceptance only. All inquiry responses below are explicit API fixtures.
const { chromium, context } = require('../kan-161-shell/common.cjs');
const fs = require('fs'), path = require('path'), assert = require('assert');
const out = __dirname;
const origin = 'http://127.0.0.1:5354', baseline = 'http://127.0.0.1:5355';
const widths = [375,390,640,768,1023,1024,1280,1440];
const stamp = '2026-10-22T10:20:00Z';
function thread(id, status='OPEN', reply=true, unread=0) {
  return {id,specialist_id:1,client_id:id+100,created_at:stamp,last_message_at:stamp,inquiry_status:status,closed_reason:null,
    other_user:{id:id+100,role:'CLIENT',display_name:`Клієнт ${id===91?'Альфа':id===92?'Бета':id}`,photo_url:''},
    last_message_preview:'Останнє тестове повідомлення без персональних даних.',unread_count:unread,can_client_send:false,client_send_reason_code:'FOLLOW_UP_REQUIRES_SPECIALIST_REPLY',can_specialist_reply:reply,specialist_reply_reason_code:reply?null:status==='OPEN'?'WAIT_FOR_CLIENT_MESSAGE':status==='ACTIVE_CLIENT'?'ACTIVE_CLIENT_USE_CHAT':'THREAD_CLOSED'};
}
function message(id, body) {return {id:id*10,thread_id:id,sender_id:id+100,body,created_at:stamp}}
async function open(browser,width,{version='v2',base=origin,scenario='normal',motion='reduce',video=false,query=''}={}) {
  const recordingBrowser = video ? {newContext:options=>browser.newContext({...options,recordVideo:{dir:path.join(process.env.TEMP,'inquiries-v2-video'),size:{width,height:900}}})} : browser;
  const {c,p,errors}=await context(recordingBrowser,width,{fixedTime:true,motion,video:false,height:900});
  const data={threads:[thread(91,'OPEN',true,2),thread(92,'OPEN',true,1),thread(93,'OPEN',false),thread(94,'ACTIVE_CLIENT',false),thread(95,'CLOSED',false),thread(96,'BLOCKED',false),thread(97,'ARCHIVED',false)],posts:[],held:new Map(),listCalls:0,releaseSend:null};
  await c.route('**/api/inquiries/**',async route=>{
    const u=new URL(route.request().url());
    if(u.pathname.endsWith('/threads/')) {
      data.listCalls++;
      if(scenario==='forbidden'&&data.posts.length)return route.fulfill({status:403,json:{reason_code:'ACCESS_DENIED'}});
      if(scenario==='removed'&&data.posts.length)return route.fulfill({json:data.threads.filter(item=>item.id!==91)});
      if(scenario==='list-error'&&data.listCalls===1)return route.fulfill({status:503,json:{detail:'Fixture list unavailable'}});
      if(scenario==='list-loading'&&data.listCalls===1)return new Promise(resolve=>data.held.set('list',()=>route.fulfill({json:data.threads}).then(resolve)));
      return route.fulfill({json:scenario==='empty'?[]:data.threads});
    }
    if(u.pathname.endsWith('/messages/')) {
      const id=Number(u.searchParams.get('thread_id'));
      const fulfill=async()=>{const item=data.threads.find(t=>t.id===id);if(item)item.unread_count=0;await route.fulfill({json:[message(id,`Тестовий текст треду ${id}`)]})};
      if(scenario==='message-error')return route.fulfill({status:403,json:{reason_code:'ACCESS_DENIED'}});
      if(scenario==='switch'&&id===91)return new Promise(resolve=>data.held.set(id,()=>fulfill().then(resolve)));
      return fulfill();
    }
    if(u.pathname.endsWith('/messages/send/')) {
      const payload=route.request().postDataJSON();data.posts.push(payload);
      return new Promise(resolve=>{data.releaseSend=async()=>{
        if(scenario==='send-error')await route.fulfill({status:400,json:{reason_code:'WAIT_FOR_CLIENT_MESSAGE',code:'CLIENT_RECORD_SELECTION_STALE'}});
        else {const item=data.threads.find(t=>t.id===payload.thread_id);item.can_specialist_reply=false;item.specialist_reply_reason_code='WAIT_FOR_CLIENT_MESSAGE';if(scenario==='closed'){item.inquiry_status='CLOSED';item.specialist_reply_reason_code='THREAD_CLOSED'}await route.fulfill({status:201,json:message(payload.thread_id,payload.body)})}
        resolve();
      }})
    }
    return route.fulfill({status:404,json:{detail:'Fixture endpoint outside approved inquiry contract'}});
  });
  await p.goto(`${base}/cabinet/inquiries?ui=${version}${query}`,{waitUntil:scenario==='list-loading'?'domcontentloaded':'networkidle'});
  await p.locator(version==='v2'?'.pc2-inquiries':'.inquiries').waitFor();await p.evaluate(()=>document.fonts.ready);
  return {c,p,errors,data};
}
async function bounds(p) {const result=await p.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,root:document.querySelector('.pc2-inquiries')?.getBoundingClientRect().toJSON(),body:getComputedStyle(document.body).overflowX}));assert(result.scrollWidth<=result.innerWidth,JSON.stringify(result));return result}
async function shot(p,name) {await bounds(p);await p.mouse.move(0,0);await p.screenshot({path:path.join(out,name+'.png'),fullPage:true,animations:'disabled'})}
async function choose(p,id) {await p.locator('#inquiry-thread-'+id).click();await p.locator('.pc2-inquiries__message p').filter({hasText:`Тестовий текст треду ${id}`}).waitFor()}
async function waitSend(data) {for(let i=0;i<50&&!data.releaseSend;i++)await new Promise(r=>setTimeout(r,10));assert(data.releaseSend,'Fixture POST was not reached')}
async function main(){
 const browser=await chromium.launch({args:['--disable-gpu','--disable-lcd-text','--force-color-profile=srgb']});const matrix=[],states=[],parity=[];
 try {
  // Warm Chromium's font raster cache before comparing independent V1 contexts.
  const warm = await open(browser,375,{version:'v1',base:baseline});
  await warm.p.screenshot({fullPage:true,animations:'disabled'});await warm.c.close();
  for(const width of widths) {
    const {c,p,errors,data}=await open(browser,width);
    const initial=await bounds(p);assert.equal(await p.getByRole('tab',{name:'Чекають відповіді 2'}).getAttribute('aria-selected'),'true');
    if(width<1024)assert.equal(await p.locator('.pc2-inquiries__message:visible').count(),0);
    await shot(p,`v2-${width}-list`);
    await p.getByRole('tab',{name:'Чекають відповіді 2'}).focus();await p.keyboard.press('ArrowRight');assert.equal(await p.getByRole('tab',{name:'Чекають клієнта 1'}).getAttribute('aria-selected'),'true');
    await p.getByRole('tab',{name:'Чекають відповіді 2'}).click();await choose(p,92);
    assert.equal(await p.locator('.pc2-inquiries__header h2').evaluate(e=>e===document.activeElement),true);
    assert.equal(await p.locator('#inquiry-v2-reply').getAttribute('maxlength'),null);
    assert.equal(await p.locator('#inquiry-thread-92 .pc2-inquiries__unread').count(),0);
    assert(!(await p.locator('.pc2-inquiries').innerText()).match(/600|отримає.*email|Запропонувати сесію|Спам|Порадити іншого/));
    await shot(p,`v2-${width}-thread`);
    if(width<1024){await p.getByRole('button',{name:'Назад до запитів'}).click();assert.equal(await p.locator('#inquiry-thread-92').evaluate(e=>e===document.activeElement),true);await p.goBack();await p.locator('.pc2-inquiries.is-thread-open').waitFor();await p.goForward();await p.locator('.pc2-inquiries:not(.is-thread-open)').waitFor();await choose(p,92)}
    else{await p.goBack();await p.locator('.pc2-inquiries__header h2').filter({hasText:'Клієнт Альфа'}).waitFor();await p.goForward();await p.locator('.pc2-inquiries__header h2').filter({hasText:'Клієнт Бета'}).waitFor()}
    await p.locator('#inquiry-v2-reply').fill('Fixture reply B');await p.locator('.pc2-inquiries__composer').dispatchEvent('submit');await waitSend(data);
    await p.locator('.pc2-inquiries__composer').dispatchEvent('submit');assert.equal(data.posts.length,1);assert(await p.locator('#inquiry-v2-reply').isDisabled());await shot(p,`v2-${width}-sending`);
    if(width<1024)await p.getByRole('button',{name:'Назад до запитів'}).click();await choose(p,91);await p.locator('#inquiry-v2-reply').fill('Fixture draft A remains private');
    await data.releaseSend();await p.getByRole('status').filter({hasText:'Відповідь надіслано.'}).waitFor();assert.equal(await p.locator('#inquiry-v2-reply').inputValue(),'Fixture draft A remains private');assert.equal(data.posts.length,1);
    assert.equal(await p.getByRole('tab',{name:'Чекають клієнта 2',includeHidden:true}).count(),1);
    const storage=await p.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage},url:location.href}));assert(!storage.includes('Fixture draft')&&!storage.includes('Fixture reply'));
    assert.equal(errors.length,0);const final=await bounds(p);const tabbar=await p.locator('.pc2-cabinet-tabbar').isVisible();if(width<768)assert(tabbar);
    matrix.push({width,initial,final,filtersKeyboard:true,headingFocus:true,backHistory:true,doubleSubmitGuard:true,draftPreserved:true,unreadReconciled:true,privateDraftNotPersisted:true,shellTabbarRetained:tabbar,pageErrors:errors});await c.close();console.log('matrix',width);
    for(const [label,base] of [['baseline',baseline],['candidate',origin]]){const {c,p,errors}=await open(browser,width,{version:'v1',base});await shot(p,`${label}-v1-${width}`);assert.equal(errors.length,0);await c.close()}
    parity.push({width,baseline:`baseline-v1-${width}.png`,candidate:`candidate-v1-${width}.png`});
  }
  for(const scenario of ['empty','list-error','list-loading','message-error','send-error','switch','closed','removed','forbidden']) {
    const {c,p,data,errors}=await open(browser,375,{scenario});
    if(scenario==='empty')await p.getByText('Немає запитів, що чекають вашої відповіді.').waitFor();
    if(scenario==='list-error'){await p.getByRole('alert').waitFor();await shot(p,scenario);await p.getByRole('button',{name:'Спробувати ще раз'}).click();await p.locator('#inquiry-thread-91').waitFor()}
    if(scenario==='list-loading'){await p.getByText('Завантажуємо запити…').waitFor();await shot(p,scenario);await data.held.get('list')();await p.locator('#inquiry-thread-91').waitFor()}
    if(scenario==='message-error'){await p.locator('#inquiry-thread-91').click();await p.getByRole('alert').waitFor();assert.equal(await p.locator('#inquiry-thread-91 .pc2-inquiries__unread').count(),1)}
    if(scenario==='switch'){await p.locator('#inquiry-thread-91').click();await p.getByText('Завантажуємо повідомлення…').waitFor();await shot(p,'message-loading');await p.getByRole('button',{name:'Назад до запитів'}).click();await choose(p,92);await data.held.get(91)();assert.equal(await p.getByText('Тестовий текст треду 91',{exact:true}).count(),0)}
    if(['send-error','closed','removed','forbidden'].includes(scenario)){await choose(p,91);await p.locator('#inquiry-v2-reply').fill('Fixture retained or completed');await p.locator('.pc2-inquiries__composer').dispatchEvent('submit');await waitSend(data);await data.releaseSend();
      if(scenario==='send-error'){await p.getByRole('alert').waitFor();assert.equal(await p.locator('#inquiry-v2-reply').inputValue(),'Fixture retained or completed');assert(!(await p.locator('.pc2-inquiries').innerText()).includes('CLIENT_RECORD_SELECTION_STALE'))}
      else if(scenario==='closed'){await p.getByRole('tab',{name:'Завершені 5',includeHidden:true}).waitFor({state:'attached'});assert.equal(await p.locator('#inquiry-v2-reply').count(),0)}
      else{await p.locator('.pc2-inquiries:not(.is-thread-open)').waitFor();assert.equal(await p.locator('.pc2-inquiries__message').count(),0);if(scenario==='forbidden')await p.getByRole('alert').waitFor();else await p.locator('#inquiry-thread-92').waitFor()}
    }
    await shot(p,scenario+'-final');assert.equal(errors.length,0);states.push({scenario,passed:true,bounds:await bounds(p),pageErrors:errors});await c.close();console.log('state',scenario);
  }
  const motionResults=[];
  for(const motion of ['no-preference','reduce']) {
    const {c,p,data,errors}=await open(browser,1280,{motion,video:motion==='no-preference'});
    await p.locator('#inquiry-v2-reply').fill('Fixture motion answer');await p.locator('.pc2-inquiries__composer').dispatchEvent('submit');await waitSend(data);await data.releaseSend();
    await p.getByRole('status').filter({hasText:'Відповідь надіслано.'}).waitFor();
    const animation=await p.evaluate(()=>({rows:[...document.querySelectorAll('.pc2-inquiries__row.is-leaving')].map(e=>({disabled:e.querySelector('button').disabled,hidden:e.getAttribute('aria-hidden'),animations:e.getAnimations().map(a=>({duration:a.effect.getTiming().duration,delay:a.effect.getTiming().delay}))})),toast:document.querySelector('.pc2-inquiries__toast').getAnimations().map(a=>a.effect.getTiming().duration),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}));
    if(motion==='reduce'){assert.equal(animation.rows.length,0);assert.equal(animation.toast.length,0)}else{assert.equal(animation.rows.length,1);assert(animation.rows[0].disabled);assert.equal(animation.rows[0].hidden,'true');assert(animation.rows[0].animations.some(a=>a.duration===400&&a.delay===350));}
    await p.screenshot({path:path.join(out,`motion-${motion}.png`),fullPage:true});
    const video=p.video();await p.waitForTimeout(850);assert.equal(await p.locator('.pc2-inquiries__row.is-leaving').count(),0);assert.equal(errors.length,0);motionResults.push({motion,animation,pageErrors:errors});await c.close();if(video)fs.copyFileSync(await video.path(),path.join(out,'motion-1280.webm'));
  }
  fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({api:'explicit intercepted browser fixtures; no real backend acceptance',matrix,states,parity,motionResults},null,2)+'\n');
 }finally{await browser.close()}
}
module.exports={open,shot,bounds,choose,waitSend};
if(require.main===module)main().catch(error=>{console.error(error);process.exit(1)});
