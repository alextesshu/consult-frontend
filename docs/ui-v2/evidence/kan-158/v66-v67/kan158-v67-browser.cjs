const {chromium,fs,assert,out,source,base,setup,ready,shot}=require('./kan158-v67-common.cjs');
(async()=>{const b=await chromium.launch();const results=[];
for(const width of [375,768,1280,1440]){
 const {c,p,posts,errors}=await setup(b,width,'no-preference',[375,1440].includes(width));
 await p.goto(base+'/s/olena?ui=v2');await ready(p);await shot(p,`vue-${width}-profile`);
 assert.equal(await p.locator('.pc2-request-panel').count(),1);assert.equal(await p.locator('body').evaluate(e=>e.scrollWidth>innerWidth),false);
 const compact=width<860;
 if(compact){await p.locator('.pc2-profile-mobile-cta').click();await p.waitForTimeout(120);await shot(p,`vue-${width}-request-enter`);await p.waitForTimeout(400);const h=await p.locator('dialog[open]').evaluate(e=>e.getBoundingClientRect().height/innerHeight);assert(Math.abs(h-.86)<.02);await shot(p,`vue-${width}-request`)}
 const noTime=p.getByRole('button',{name:'Не обирати час — домовимось',exact:true});await noTime.scrollIntoViewIfNeeded();await noTime.click();await p.locator('.guest-booking-form').waitFor();await shot(p,`vue-${width}-contact`);
 assert.equal(await p.locator('.guest-booking-form').count(),1);assert.equal(posts.length,0);
 await p.getByLabel('Ім’я',{exact:true}).fill('Ірина');await p.getByLabel('Як спеціаліст може з вами зв’язатися?').fill('iryna@example.test');await p.locator('.guest-booking-form').getByRole('button',{name:'Надіслати запит',exact:true}).click();await p.getByText('Це ще не підтверджена сесія.',{exact:false}).waitFor();assert.equal(posts.length,1);assert.equal(posts[0].contact_channel,'email');assert(!('slot_id' in posts[0]));await shot(p,`vue-${width}-pending`);
 if(compact){await p.keyboard.press('Escape');await p.waitForTimeout(450);assert.equal(await p.locator('dialog[open]').count(),0);assert.equal(await p.evaluate(()=>document.body.style.overflow),'');assert.equal(await p.locator('.pc2-profile-mobile-cta').evaluate(e=>e===document.activeElement),true)}
 await p.reload();await ready(p);
 const about=p.getByRole('button',{name:'Більше про мене',exact:true});await about.click();await p.waitForTimeout(140);await shot(p,`vue-${width}-about-enter`);await p.waitForTimeout(400);await shot(p,`vue-${width}-about`);
 const dlg=p.locator('.pc2-profile-overlay--about[open]');assert.equal(await dlg.count(),1);await p.keyboard.press('Shift+Tab');assert(await dlg.evaluate(e=>e.contains(document.activeElement)));
 await p.keyboard.press('Escape');await p.waitForTimeout(450);assert.equal(await about.evaluate(e=>e===document.activeElement),true);
 await p.getByRole('button',{name:'Поділитися профілем',exact:true}).click();await p.waitForTimeout(140);await shot(p,`vue-${width}-share-enter`);await p.waitForTimeout(400);await shot(p,`vue-${width}-share`);
 await c.grantPermissions(['clipboard-read','clipboard-write']);await p.getByRole('button',{name:'Копіювати посилання',exact:true}).click();await p.getByRole('button',{name:'Скопійовано ✓',exact:true}).waitFor();assert.equal(await p.evaluate(()=>navigator.clipboard.readText()),base+'/s/olena');
 await p.keyboard.press('Escape');await p.waitForTimeout(450);
 const fq=p.getByRole('button',{name:'Як відбувається оплата?',exact:true});await fq.scrollIntoViewIfNeeded();await fq.click();await p.waitForTimeout(150);await shot(p,`vue-${width}-faq-transition`);await p.waitForTimeout(350);assert.equal(await fq.getAttribute('aria-expanded'),'true');
 await p.getByRole('button',{name:/Показати документи/}).click();await p.waitForTimeout(180);await shot(p,`vue-${width}-documents-transition`);
 assert.deepEqual(errors,[]);results.push({width,noOverflow:true,requestPanels:1,requestForms:1,slotlessPending:true,aboutFocusEscape:true,shareClipboard:true,faq:true,errors});
 await c.close();if(p.video())await p.video().saveAs(out+`/recordings/vue-${width}.webm`);console.log('vue',width);
}
fs.writeFileSync(out+'/browser-acceptance.json',JSON.stringify(results,null,2));await b.close()})().catch(e=>{console.error(e);process.exit(1)})
