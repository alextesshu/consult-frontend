// Render the unchanged immutable source for visual comparison, in a separate context.
const {chromium}=require('../kan-161-shell/common.cjs');
const path=require('path'),fs=require('fs'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch();const p=await browser.newPage({viewport:{width:1440,height:900}});
 const base='http://127.0.0.1:5354/docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/';
 try{
  await p.goto(base+'Inquiries.dc.html',{waitUntil:'domcontentloaded'});await p.getByRole('heading',{name:'Запити',exact:true}).waitFor({timeout:60000});await p.evaluate(()=>document.fonts.ready);
  await p.screenshot({path:path.join(__dirname,'claude-desktop-1440.png'),fullPage:true});
  await p.setViewportSize({width:375,height:900});await p.getByRole('heading',{name:'Запити',exact:true}).waitFor();await p.screenshot({path:path.join(__dirname,'claude-list-375.png'),fullPage:true});
  await p.setViewportSize({width:1800,height:1100});await p.goto(base+'Cabinet-Mobile-2.dc.html',{waitUntil:'domcontentloaded'});await p.locator('#m9').getByRole('heading',{name:'Запити',exact:true}).waitFor({timeout:60000});await p.evaluate(()=>document.fonts.ready);
  await p.locator('#m9 > div').nth(1).screenshot({path:path.join(__dirname,'claude-m9.png')});
  // Mask the design sample email; never copy personal contacts into task evidence.
  await p.locator('#m10 > div').nth(1).screenshot({path:path.join(__dirname,'claude-m10.png'),mask:[p.locator('#m10 span').filter({hasText:/@/})]});
  fs.writeFileSync(path.join(__dirname,'source-provenance.json'),JSON.stringify({snapshot:'claude-design-2026-10-23-4ff7cedd',archiveSHA256:'4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347',rendered:['Inquiries.dc.html','Cabinet-Mobile-2.dc.html M9/M10'],sourceFilesEdited:false,privacy:'Design sample email masked in M10 capture; no real API or real user data loaded'},null,2)+'\n');
  console.log('PASS: original Inquiries desktop/mobile and static M9/M10 rendered')
 }finally{await browser.close()}
})().catch(e=>{console.error(e.message);process.exit(1)});
