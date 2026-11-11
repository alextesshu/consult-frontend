// Prospective integration only: incoming App/CSS are read via git show, never written.
const {chromium,context}=require('../kan-161-shell/common.cjs');
const fs=require('fs'),path=require('path'),assert=require('assert');
const stamp='2026-10-22T10:20:00Z';
(async()=>{const b=await chromium.launch({args:['--disable-gpu','--disable-lcd-text','--force-color-profile=srgb']});const rows=[];try{
for(const width of [375,390,640,768,1023,1024,1280,1440]){
 for(const label of ['baseline','candidate']){
  const {c,p,errors}=await context(b,width,{fixedTime:true,motion:'reduce',height:900});
  await c.route('**/api/inquiries/**',r=>r.fulfill({json:r.request().url().includes('/threads/')?[{id:91,specialist_id:1,client_id:191,created_at:stamp,last_message_at:stamp,inquiry_status:'OPEN',closed_reason:null,other_user:{id:191,role:'CLIENT',display_name:'Клієнт Альфа',photo_url:''},last_message_preview:'Останнє тестове повідомлення без персональних даних.',unread_count:0,can_client_send:false,client_send_reason_code:'FOLLOW_UP_REQUIRES_SPECIALIST_REPLY',can_specialist_reply:true,specialist_reply_reason_code:null}]:[{id:910,thread_id:91,sender_id:191,body:'Тестовий текст треду 91',created_at:stamp}]}));
  const base='http://127.0.0.1:'+(label==='baseline'?5364:5356);
  await p.goto(base+'/cabinet/inquiries?ui=v1',{waitUntil:'networkidle'});await p.locator('.inquiry-thread').waitFor();await p.evaluate(()=>document.fonts.ready);await p.mouse.move(0,0);await p.screenshot({path:path.join(__dirname,`incoming-${label}-v1-${width}.png`),fullPage:true,animations:'disabled'});
  if(label==='candidate'){
   await p.goto(base+'/cabinet/inquiries?ui=v2&thread_id=91',{waitUntil:'networkidle'});await p.locator('.pc2-inquiries__message').waitFor();const bounds=await p.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(bounds.scrollWidth<=width);assert.equal(await p.locator('a[href="/cabinet/external-sessions#guest-requests"]').count()>0,true);assert.equal(errors.length,0);rows.push({width,...bounds,pageErrors:errors});if([375,1280].includes(width))await p.screenshot({path:path.join(__dirname,`incoming-v2-${width}.png`),fullPage:true,animations:'disabled'});
  }
  await c.close();
 }
 console.log('incoming',width);
}
fs.writeFileSync(path.join(__dirname,'incoming-results.json'),JSON.stringify({targetDev:'6f91363f6fbed0f63d6fb181a6aa45ecffb3ba00',method:'read-only git-show overlay for App.vue and components-v2.css; no merge/rebase or shared-file edits',rows},null,2)+'\n');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
