const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');const fs=require('fs'),path=require('path'),assert=require('assert');
const root=process.cwd(),out=root+'/docs/ui-v2/evidence/kan-159/integration';fs.mkdirSync(out,{recursive:true});
async function open(b,width,pageName,{baseline=false,version='v2',motion='reduce',video=false,success=false,query=''}={}){
 const c=await b.newContext({viewport:{width,height:width<=390?677:900},reducedMotion:motion,...video?{recordVideo:{dir:process.env.TEMP+'/kan159-video',size:{width,height:677}}}:{}});
 await c.addInitScript(()=>localStorage.setItem('proconsult.product_analytics_consent.v1',JSON.stringify({version:1,preference:'denied'})));
 const posts=[],errors=[];let pending,resolvePost;let posted=new Promise(r=>resolvePost=r),registered=false;
 const user={id:159,username:'registration-fixture',email:'fixture@example.test',roles:[pageName==='signup'?'SPECIALIST':'CLIENT'],email_verification_state:'unverified'};
 await c.route('**/api/**',async r=>{const u=new URL(r.request().url()).pathname;
  if(u.includes('/auth/signup')){posts.push(r.request().postDataJSON());if(success){registered=true;return r.fulfill({status:201,json:{access:'registration-fixture-token',user}})}
   pending=r;resolvePost();return new Promise(resolve=>{pending.complete=async()=>{await r.fulfill({status:400,json:{email:['Fixture: email already registered']}});resolve()}})}
  if(u==='/api/me/'&&registered)return r.fulfill({json:{user,access_state:null,effective_entitlements:null,counts:null,server_time:'2026-10-24T00:00:00Z'}});
  return r.fulfill({status:u.includes('/auth/')?401:503,json:{detail:'Explicit registration fixture: endpoint out of scope'}});
 });
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto((baseline?'http://localhost:5371':'http://localhost:5370')+'/'+pageName+'?ui='+version+query,{waitUntil:'domcontentloaded'});await p.locator(['signup','signup-client','login'].includes(pageName)?'form':'main').waitFor();await p.evaluate(()=>document.fonts.ready);
 return{c,p,posts,errors,waitPost:()=>posted,finishPost:()=>pending.complete()};
}
async function settled(p){await p.evaluate(async()=>{const el=document.querySelector('.pc2-registration-wizard');if(el)await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
async function shot(p,name){await settled(p);assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'horizontal overflow');await p.screenshot({path:out+'/'+name+'.png',fullPage:true,animations:'disabled'})}
async function next(p){await p.getByRole('button',{name:'Далі',exact:true}).click();await settled(p)}
async function account(p,width,pageName,posts){
 await p.locator('[name=first_name]').fill('Олена');await p.locator('[name=first_name]').focus();
 const wizard=pageName==='signup'||width<768;
 if(wizard){await p.keyboard.press('Enter');await settled(p);assert.equal(posts.length,0);
  if(pageName==='signup'){await p.getByRole('radio',{name:'Психологічна практика',exact:true}).waitFor();await p.keyboard.press('Space');await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowLeft');assert(await p.getByRole('radio',{name:'Психологічна практика',exact:true}).isChecked());}
 }
 return wizard;
}
(async()=>{const b=await chromium.launch();const matrix=[],successRows=[],regression=[];try{
for(const width of [375,390,640,768,1280])for(const pageName of ['signup','signup-client']){
 console.log(width,pageName);const {c,p,posts,errors,waitPost,finishPost}=await open(b,width,pageName,{motion:width===375?'no-preference':'reduce',video:width===375});
 const wizard=pageName==='signup'||width<768;
 if(wizard){await p.getByRole('button',{name:'Далі',exact:true}).click();assert.equal(posts.length,0);assert.equal(await p.locator('[name=first_name]').getAttribute('aria-invalid'),'true')}
 await shot(p,pageName+'-'+width+'-name');await account(p,width,pageName,posts);
 if(wizard){await shot(p,pageName+'-'+width+'-step2');if(width<768){const geometry=await p.locator('.pc2-registration-progress,.pc2-registration-bars,.pc2-registration-actions .pc2-registration-next').evaluateAll(es=>es.map(e=>({class:e.className,x:e.getBoundingClientRect().x,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));assert(Math.abs(geometry[0].height-56)<1);assert(Math.abs(geometry[1].height-4)<1);assert(Math.abs(geometry[2].height-54)<1);}
  if(pageName==='signup'){await next(p)}else{await p.locator('[name=email]').fill('bad-email');await next(p);assert.equal(posts.length,0);assert(await p.locator('[name=email]').evaluate(e=>e.validity.typeMismatch));await p.locator('[name=email]').fill('fixture@example.test');await next(p)}
 }
 await p.locator('[name=email]').count().then(async count=>{if(count)await p.locator('[name=email]').fill('fixture@example.test')});
 await p.locator('[name=password]').fill('Fixture-P6-only-password');
 if(wizard){await p.getByRole('button',{name:'Назад',exact:true}).click();await settled(p);if(pageName==='signup')assert(await p.getByRole('radio',{name:'Психологічна практика',exact:true}).isChecked());else assert.equal(await p.locator('[name=email]').inputValue(),'fixture@example.test');await next(p);assert.equal(await p.locator('[name=password]').inputValue(),'Fixture-P6-only-password')}
 await p.getByRole('button',{name:'Показати пароль',exact:true}).click();assert.equal(await p.locator('[name=password]').getAttribute('type'),'text');await p.getByRole('button',{name:'Сховати пароль',exact:true}).click();assert.equal(await p.locator('[name=password_confirm]').count(),0);
 await shot(p,pageName+'-'+width+'-account');
 await p.getByRole('button',{name:'Створити акаунт',exact:true}).click();await waitPost();assert.equal(posts.length,1);assert.equal(posts[0].registration_contract_version,2);assert.equal(posts[0].first_name,'Олена');assert(!('password_confirm' in posts[0]));if(pageName==='signup')assert.equal(posts[0].professional_focus,'psychological_practice');else assert(!('professional_focus' in posts[0]));
 assert(await p.getByRole('button',{name:'Створення акаунта...',exact:true}).isDisabled());await p.locator('form').dispatchEvent('submit');assert.equal(posts.length,1);await shot(p,pageName+'-'+width+'-loading');await finishPost();await p.getByText('Fixture: email already registered',{exact:false}).first().waitFor();await shot(p,pageName+'-'+width+'-server-error');
 if(pageName==='signup-client'&&width<768)assert.equal(await p.locator('[name=email]').getAttribute('aria-invalid'),'true');assert.equal(errors.length,0);
 const storage=await p.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage},url:location.href}));assert(!storage.includes('Fixture-P6-only-password'));assert(!storage.includes('fixture@example.test'));
 const animations=await p.locator('.pc2-registration-wizard').count()?await p.locator('.pc2-registration-wizard').evaluate(e=>e.getAnimations({subtree:true}).length):0;
 const video=p.video();await c.close();if(video)fs.copyFileSync(await video.path(),out+'/'+pageName+'-375-motion.webm');matrix.push({width,pageName,backend:'explicit intercepted fixtures',wizardSteps:wizard?3:1,noEarlyPost:true,posts:1,contractVersion:2,nameValidation:true,keyboard:true,backValuesPreserved:true,duplicateGuard:true,serverFieldError:true,noCredentialStorage:true,pageErrors:errors,settledAnimations:animations});
 for(const[label,baseline]of[['baseline',true],['candidate',false]]){const {p,c}=await open(b,width,pageName,{baseline,version:'v1'});await shot(p,label+'-'+pageName+'-v1-'+width);assert.equal(await p.locator('[name=first_name]').count(),0);assert.equal(await p.locator('[name=password_confirm]').count(),1);await c.close()}
}
for(const pageName of ['signup','signup-client']){
 const {p,c,posts}=await open(b,375,pageName,{success:true,query:'&redirect=%2Fclient%2Finvite%2Ffixture'});await account(p,375,pageName,posts);if(pageName==='signup')await next(p);else{await p.locator('[name=email]').fill('fixture@example.test');await next(p)}
 if(pageName==='signup')await p.locator('[name=email]').fill('fixture@example.test');await p.locator('[name=password]').fill('Fixture-only-final');await p.locator('[name=password]').focus();await p.keyboard.press('Enter');const destination=pageName==='signup'?'/cabinet':'/client/invite/fixture';await p.waitForURL(u=>u.pathname===destination);assert.equal(posts.length,1);successRows.push({pageName,destination,evidence:'fixture-only frontend redirect, not real registration or publication'});await c.close();
}
for(const route of ['','for-clients','specialists','login']){const {p,c,errors}=await open(b,1280,route||'',{}).catch(e=>{throw e});assert.equal(errors.length,0);regression.push({route:route||'/',pageErrors:errors});await c.close()}
fs.writeFileSync(out+'/browser-results.json',JSON.stringify({matrix,successRows,regression,limits:'Fixtures throughout browser acceptance; separate isolated Django APIClient proof. No external email or production readiness claim.'},null,2)+'\n');console.log('PASS: five widths/two roles; steps/validation/loading/contracts/back/keyboard/storage; V1 captures; fixture redirects');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
