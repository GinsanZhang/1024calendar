/* Stable gallery frames; serve repository on :8765. Lookback uses Playwright Clock. */
const {chromium}=require('playwright'),fs=require('fs');
const path=require('node:path');
const out=path.resolve(process.env.QA_OUTPUT_DIR||path.join(__dirname,'../../docs/ui-restoration-2026-10-25'));
fs.mkdirSync(out,{recursive:true});
(async()=>{const chrome=process.env.CHROME_PATH||['/usr/bin/chromium','/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p=>fs.existsSync(p));
const b=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{})});
const c=await b.newContext({viewport:{width:1440,height:900},timezoneId:'Asia/Shanghai',reducedMotion:'reduce'}),p=await c.newPage();
await p.goto('http://127.0.0.1:8765/v2/');await p.evaluate(()=>document.fonts.ready);
await p.evaluate(()=>{V2Views.switchView('scroll');V2Views.scrollToEra(10,true);});await p.locator('#searchOpen').click();await p.locator('#searchInput').fill('郑和');await p.waitForTimeout(200);await p.screenshot({path:out+'/search-stable.png'});await p.keyboard.press('Escape');
await p.evaluate(()=>{V2Views.switchView('calendar');V2Views.pickDate(2026,10,12,true)});await p.waitForFunction(()=>document.querySelector('#dailyList .asset-placeholder[data-loaded]'));await p.screenshot({path:out+'/blank-stable.png'});
await p.setViewportSize({width:390,height:844});await p.evaluate(()=>document.getElementById('hero').scrollIntoView());await p.waitForFunction(()=>document.body.dataset.at==='hero');await p.screenshot({path:out+'/hero-mobile.png'});
const motion=await b.newContext({viewport:{width:1440,height:900},timezoneId:'Asia/Shanghai'}),q=await motion.newPage();
await q.clock.install();await q.goto('http://127.0.0.1:8765/v2/');await q.evaluate(()=>document.fonts.ready);await q.clock.pauseAt(new Date(Date.now()+10000));
await q.evaluate(()=>{V2Views.pickDate(2026,10,25,true);void V2Overlay.openLookback();const option=document.querySelector('.lb-opt[data-years="500"]');option.focus();option.click()});await q.clock.runFor(580);
await q.screenshot({path:out+'/lookback-500-static.png',timeout:10000});
const evidence=await q.evaluate(()=>({year:document.querySelector('#lbYear').textContent,era:document.querySelector('#lbCardEra').textContent,selected:document.querySelector('.lb-opt[aria-pressed="true"]').dataset.years,selectedBackground:getComputedStyle(document.querySelector('.lb-opt[aria-pressed="true"]')).backgroundColor,overlay:V2Overlay.topmost()}));
fs.writeFileSync(out+'/capture-notes.json',JSON.stringify({lookback:{method:'Playwright browser clock paused after 580ms of the real runLookback animation; no app text/state overwritten',...evidence}},null,2));console.log(evidence);await b.close();})();
