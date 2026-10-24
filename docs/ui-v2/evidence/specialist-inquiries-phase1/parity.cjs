// Deterministic raster capture, identical settings and explicit fixtures for both sides.
const {chromium}=require('../kan-161-shell/common.cjs');
const {open,shot}=require('./browser.cjs');
(async()=>{const browser=await chromium.launch({args:['--force-color-profile=srgb']});try{
  for(const width of [375,390,640,768,1023,1024,1280,1440]){
    for(const [label,base] of [['baseline','http://127.0.0.1:5355'],['candidate','http://127.0.0.1:5354']]){
      const {c,p}=await open(browser,width,{base,version:'v1'});
      await p.locator('.inquiry-message__body').waitFor();
      await p.evaluate(()=>document.fonts.ready);
      await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await p.screenshot({fullPage:true,animations:'disabled'});
      await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await shot(p,`${label}-v1-${width}`);
      await c.close();
    }
    console.log('parity',width);
  }
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exit(1)});
