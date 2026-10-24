// Actual browser fixtures only. Compare the same shell before/after local mobile CSS changes.
const {chromium}=require('../kan-161-shell/common.cjs');
const {open,shot,bounds,choose,waitSend}=require('./browser.cjs');
const fs=require('fs'),path=require('path'),assert=require('assert');
async function filterGeometry(p){return p.locator('.pc2-inquiries__filters').evaluate(el=>{const box=el.getBoundingClientRect();return {left:box.left,right:box.right,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,tabs:[...el.querySelectorAll('button')].map(tab=>{const b=tab.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,height:b.height,text:tab.textContent.trim()}})}})}
(async()=>{const browser=await chromium.launch({args:['--disable-gpu','--disable-lcd-text','--force-color-profile=srgb']});const rows=[];try{
  const warm=await open(browser,375,{base:'http://127.0.0.1:5360'});await warm.p.screenshot({fullPage:true});await warm.c.close();
  for(const width of [375,390,640,768,1280]){
    const row={width};
    for(const [label,base] of [['before','http://127.0.0.1:5360'],['after','http://127.0.0.1:5354']]){
      const {c,p,data,errors}=await open(browser,width,{base});
      row[label]={list:await bounds(p),filters:await filterGeometry(p)};
      await shot(p,`polish-${label}-${width}-list`);
      if(label==='after'){
        const filters=row.after.filters;assert(filters.scrollWidth<=filters.clientWidth);assert.equal(filters.tabs.length,3);
        filters.tabs.forEach(tab=>{assert(tab.left>=filters.left-.5&&tab.right<=filters.right+.5);assert(tab.height>=35)});
        for(const key of ['wait','done','reply']){const tab=p.locator(`[data-filter="${key}"]`);await tab.click();assert.equal(await tab.getAttribute('aria-selected'),'true');assert(await p.locator('.pc2-inquiries__thread').count()>0);await bounds(p)}
        await p.locator('[data-filter="reply"]').focus();await p.keyboard.press('End');assert.equal(await p.locator('[data-filter="done"]').getAttribute('aria-selected'),'true');await p.keyboard.press('Home');assert.equal(await p.locator('[data-filter="reply"]').getAttribute('aria-selected'),'true');
        await choose(p,92);row.after.detail=await bounds(p);await shot(p,`polish-after-${width}-detail`);
        await p.locator('#inquiry-v2-reply').fill('Fixture mobile polish reply');await p.locator('.pc2-inquiries__composer').dispatchEvent('submit');await waitSend(data);assert(await p.locator('#inquiry-v2-reply').isDisabled());row.after.sending=await bounds(p);await shot(p,`polish-after-${width}-sending`);await data.releaseSend();await p.locator('.pc2-inquiries__toast').waitFor();assert.equal(data.posts.length,1);
      }
      assert.equal(errors.length,0);await c.close();
      const empty=await open(browser,width,{base,scenario:'empty'});await empty.p.locator('.pc2-inquiries__empty').waitFor();row[label].empty=await bounds(empty.p);await shot(empty.p,`polish-${label}-${width}-empty`);
      if(label==='after'&&width<1024){assert(row.after.empty.root.height<row.before.empty.root.height);assert(row.after.empty.root.height<400)}
      for(const key of ['wait','done','reply']){await empty.p.locator(`[data-filter="${key}"]`).click();await empty.p.locator('.pc2-inquiries__empty').waitFor();await bounds(empty.p)}
      assert.equal(empty.errors.length,0);await empty.c.close();
    }
    rows.push(row);console.log('polish',width);
  }
  fs.writeFileSync(path.join(__dirname,'polish-browser-results.json'),JSON.stringify({beforeHead:'6395039d1795ba3a1642d923d3fd2171de3573fb',api:'explicit browser fixtures; not backend E2E',rows},null,2)+'\n');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exit(1)});
