const {chromium,fs,out,source,base,setup}=require('./kan158-v67-common.cjs');
(async()=>{const b=await chromium.launch();const results=[];for(const width of [375,768,1280,1440]){
 const mobile=width<860;const filename=mobile?'Specialist-Profile-Mobile.dc.html':'Specialist-Profile.dc.html';const {c,p,errors}=await setup(b,width,'no-preference',[375,1440].includes(width));
 await c.route('https://unpkg.com/**',r=>r.continue());
 const raw=fs.readFileSync(require('./kan158-v67-common.cjs').repo+source+filename,'utf8');
 await c.route('**/'+filename,r=>r.fulfill({contentType:'text/html',body:raw.replace('<script src="./brand-listen.js"></script>','').replace('componentDidMount() {','componentDidMount() { window.__profilePrototype = this;')}));
 await p.goto(base+source+filename);await p.waitForFunction(()=>!!window.__profilePrototype);await p.evaluate(()=>document.fonts.ready);
 if(mobile) await p.evaluate(({width,height})=>{const frame=Array.from(document.querySelectorAll('div')).find(e=>e.style.width==='390px'&&e.style.height==='844px');if(!frame)throw Error('Missing original phone scaffold');Object.assign(frame.style,{width:width+'px',height:height+'px',borderRadius:'0',boxShadow:'none'});Object.assign(frame.parentElement.style,{padding:'0',gap:'0'});for(const child of frame.parentElement.children)if(child!==frame)child.style.display='none'},{width,height:width===375?677:900});
 await p.waitForTimeout(600);await p.screenshot({path:out+`/claude-${width}-profile.png`});
 for(const state of ['request','about','share']){
  await p.evaluate(({mobile,state})=>window.__profilePrototype.setState(mobile?{view:state==='request'?'sheet':state}:{about:state==='about',share:state==='share',mode:state==='request'?'form':'pick',noTime:true}),{mobile,state});
  await p.waitForTimeout(130);await p.screenshot({path:out+`/claude-${width}-${state}-transition.png`});await p.waitForTimeout(450);await p.screenshot({path:out+`/claude-${width}-${state}.png`});
 }
 results.push({width,filename,errors,adaptation:mobile?'Only outer phone-board scaffold resized to viewport; source content/styles/handlers retained.':'BrandListen registration script omitted because profile has no animated listen component; source profile script retained.'});await c.close();if(p.video())await p.video().saveAs(out+`/recordings/claude-${width}.webm`);console.log('source',width)
}fs.writeFileSync(out+'/source-captures.json',JSON.stringify(results,null,2));await b.close()})().catch(e=>{console.error(e);process.exit(1)})
