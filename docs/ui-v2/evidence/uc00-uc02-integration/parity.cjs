// UI v1 comparison against the immutable #73 source archive; real isolated Django data.
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core')
const fs = require('fs'), path = require('path')
if (!process.env.UCI_CREDENTIALS || process.env.UCI_ISOLATED_DATABASE !== 'uc_integration') throw new Error('Disposable test credentials required')
const account = JSON.parse(fs.readFileSync(process.env.UCI_CREDENTIALS, 'utf8'))[0]
const out = __dirname, pairs = []
;(async () => {
 // Identical rendering configuration and viewport captures on both origins.
 const browser = await chromium.launch({ args: ['--disable-gpu'] })
 try {
  for (const width of process.env.UCI_PARITY_WIDTH ? [Number(process.env.UCI_PARITY_WIDTH)] : [375,390,768,1280,1440]) {
   const c = await browser.newContext({ viewport:{width,height:900}, timezoneId:'Europe/Kyiv', locale:'uk-UA', reducedMotion:'reduce' })
   await c.clock.setFixedTime(new Date('2026-10-25T16:00:00Z'))
   await c.addInitScript(() => localStorage.setItem('proconsult.product_analytics_consent.v1',JSON.stringify({version:1,preference:'denied'})))
   await c.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort())
   const p=await c.newPage()
   await p.goto('http://localhost:5414/login?ui=v1')
   await p.locator('input[name="identifier"]').fill(account.username)
   await p.locator('input[name="password"]').fill(account.password)
   await p.locator('button[type="submit"]').click()
   await p.waitForURL(u=>!u.pathname.startsWith('/login'))
   // Warm both independent origins before comparing their first painted header.
   for (const port of [5414,5412]) {
    await p.goto(`http://localhost:${port}/cabinet/sessions?ui=v1`)
    await p.waitForLoadState('networkidle')
    await p.evaluate(()=>document.fonts.ready)
   }
   const routes = process.env.UCI_PARITY_ROUTE ? [process.env.UCI_PARITY_ROUTE] : width===375||width===1280 ? ['sessions','slots','dashboard'] : ['sessions']
   for(const route of routes) {
    const files=[]
    for(const [label,port] of [['before',5414],['after',5412]]) {
     const preferences=[]
     const watch=r=>{if(r.url().includes('/api/cabinet/settings/calendar/'))preferences.push(r.method())}
     p.on('request',watch)
     await p.goto(`http://localhost:${port}/cabinet${route==='dashboard'?'':'/'+route}?ui=v1`)
     await p.waitForLoadState('networkidle')
     await p.evaluate(()=>document.fonts.ready)
     // Settle the capture/compositing surface before recording the viewport.
     await p.screenshot({animations:'disabled'})
     await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
     const file=`screenshots/v1-${width}-${route}-${label}.png`
     await p.screenshot({path:path.join(out,file),fullPage:false,animations:'disabled'})
     p.off('request',watch)
     if(preferences.length)throw new Error('UI v1 unexpectedly requested calendar preferences')
     files.push(file)
    }
    pairs.push({width,route,before:files[0],after:files[1]})
    console.log(`CAPTURED ${width} ${route}`)
   }
   await c.close()
  }
 } finally {
  await browser.close()
  const file=path.join(out,'parity-pairs.json')
  const previous=process.env.UCI_PARITY_WIDTH && fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')).pairs:[]
  const combined=[...previous.filter(old=>!pairs.some(next=>old.width===next.width&&old.route===next.route)),...pairs]
  fs.writeFileSync(file,JSON.stringify({baseline:'ad6c3a39361678c815b29f2f5eef5574b9ba7aac',pairs:combined},null,2))
 }
})().catch(e=>{console.error(e.message);process.exitCode=1})
