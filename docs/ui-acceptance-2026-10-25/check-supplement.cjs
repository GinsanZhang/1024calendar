/* Delivery UI review, product code is not changed. Requires local server :8765.
   PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright node <this file> */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const out=__dirname;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/chromium'});
 const context=await browser.newContext({viewport:{width:1440,height:900},timezoneId:'Asia/Shanghai',reducedMotion:'reduce'});
 const page=await context.newPage();
 const report={commit:'daf6f2a',browser:browser.version(),timezone:'Asia/Shanghai',dpr:1,checks:[],measurements:[],httpErrors:[],pageErrors:[],external:[]};
 page.on('pageerror',e=>report.pageErrors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({url:r.url(),status:r.status()});});
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('data:'))report.external.push(r.url());});
 const check=(name,ok,details)=>report.checks.push({name,ok:!!ok,...(details?{details}:{})});
 const snap=async name=>page.screenshot({path:path.join(out,name+'.png')});
 const metrics=async name=>{
  const data=await page.evaluate(()=>{
   const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
   const selectors=['#searchOpen','#themeToggle','#motionToggle','#todayButton','#randomButton','#calPrev','#calNext','#calendarCollapse','.day[aria-selected="true"]','.day[data-out] .d-num','.day[data-out] .d-lunar','.ev-desc','.ev-src','.cal-foot','.era-filter','.scale-btn[aria-current="true"]','.season-title','#jqOpenDate','#lbClose','.lb-opt'];
   return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,items:selectors.flatMap(selector=>{
    const n=document.querySelector(selector);if(!n||!n.checkVisibility())return [];
    const s=getComputedStyle(n);let alpha=1;for(let a=n;a;a=a.parentElement)alpha*=Number(getComputedStyle(a).opacity);
    return [{selector,text:n.textContent.trim().slice(0,90),...rect(n),fontSize:s.fontSize,lineHeight:s.lineHeight,color:s.color,background:s.backgroundColor,borderRadius:s.borderRadius,opacity:alpha}];
   })};
  });
  report.measurements.push({name,...data});return data;
 };
 try{
  await page.goto('http://127.0.0.1:8765/v2/');await page.evaluate(()=>document.fonts.ready);
  await snap('11-hero-static');await metrics('desktop hero');
  await page.locator('#heroScroll').click();await snap('12-portals');
  for(const [width,height] of [[1440,900],[1536,864],[768,1024],[390,844],[320,740]]){
   await page.setViewportSize({width,height});
   for(const view of ['calendar','scroll','seasons']){
    await page.evaluate(view=>{document.documentElement.dataset.theme='light';V2Views.switchView(view);if(view==='calendar')V2Views.pickDate(2026,7,11,true);if(view==='scroll')V2Views.scrollToEra(10,true);if(view==='seasons')V2Views.setSeason(18);},view);
    await page.waitForTimeout(150);
    const m=await metrics(`${width}x${height} ${view}`);
    check(`${width}x${height} ${view} 无页面横向溢出`,m.scrollWidth<=width);
    if(width===320||width===768)await snap(`13-${width}-${view}`);
   }
  }
  await page.setViewportSize({width:320,height:740});
  await page.locator('#searchOpen').click();await snap('14-search-320-empty');
  await page.locator('#searchInput').fill('无此史事<ui-review>');
  check('320px 搜索无结果安全显示',await page.locator('.search-empty').textContent().then(t=>t.includes('暂无')));await snap('14-search-320-none');
  await page.locator('#searchInput').fill('郑和');await snap('14-search-320-match');
  const focus=[];for(let i=0;i<12;i++){await page.keyboard.press('Tab');focus.push(await page.evaluate(()=>document.activeElement.closest('#search')!==null));}
  check('搜索Tab焦点约束',focus.every(Boolean));await page.keyboard.press('Escape');
  await page.evaluate(()=>{V2Views.switchView('calendar');V2Views.pickDate(2026,7,11,true);});
  const hit=await page.locator('.day[data-date="2026-07-15"]').boundingBox();
  await page.mouse.click(hit.x+hit.width/2,hit.y+hit.height/2);
  check('320px 日期中心实际命中',await page.evaluate(()=>V2State.sel.d===15));
  await page.evaluate(()=>V2Overlay.openLookback());await metrics('320x740 lookback');await snap('15-lookback-320');await page.keyboard.press('Escape');
  await page.evaluate(()=>document.getElementById('hero').scrollIntoView());await page.waitForTimeout(150);await snap('16-hero-320');
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(()=>{V2Views.switchView('scroll');V2Views.scrollToEra(0,true);});
  let eras=true,total=0;
  for(let i=0;i<14;i++){
   await page.locator(`.tick[data-i="${i}"]`).click();await page.waitForTimeout(100);
   const data=await page.evaluate(()=>({i:V2State.eraIndex,count:[...document.querySelectorAll('.era-ev')].filter(n=>n.checkVisibility()).length,expected:V2Data.ERAS[V2State.eraIndex].events.length}));
   eras&&=data.i===i&&data.count===data.expected;total+=data.count;
  }
  check('逐一点击14时期且显示92条年份史事',eras&&total===92,{total});
  await page.evaluate(()=>V2Views.switchView('seasons'));
  let seasons=true;
  for(let i=0;i<24;i++){
   await page.locator(`.node[data-i="${i}"] button`).click();
   seasons&&=await page.evaluate(i=>V2State.jqIndex===i&&document.querySelector('.season-title').textContent===V2Data.JQ_ORDER[i],i);
  }
  check('逐一点击24节气更新标题和选择',seasons);
  for(const view of ['calendar','scroll','seasons']){
   await page.evaluate(view=>{document.documentElement.dataset.theme='dark';V2Views.switchView(view);if(view==='calendar')V2Views.pickDate(2026,7,11,true);if(view==='scroll')V2Views.scrollToEra(10,true);if(view==='seasons')V2Views.setSeason(18);},view);
   await page.waitForTimeout(150);await metrics('dark '+view);await snap('17-dark-'+view);
  }
  await page.evaluate(()=>{document.documentElement.dataset.theme='light';V2Views.switchView('scroll');V2Views.scrollToEra(7,true);});
  const track=page.locator('#scrollTrack'),r=await track.boundingBox(),before=await track.evaluate(n=>n.scrollLeft);
  await page.mouse.move(r.x+r.width*.7,r.y+r.height*.5);await page.mouse.down();await page.mouse.move(r.x+r.width*.25,r.y+r.height*.5,{steps:12});await page.mouse.up();await page.waitForTimeout(200);
  check('长卷鼠标拖动改变横向位置',await track.evaluate((n,b)=>Math.abs(n.scrollLeft-b)>100,before));
  const y=await page.evaluate(()=>scrollY);await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.wheel(0,450);await page.waitForTimeout(250);
  check('长卷纵向滚轮允许页面滚动',await page.evaluate(y=>scrollY>y,y));
  // The existing suite explicitly checks animation; use its normal-motion precondition.
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('http://127.0.0.1:8765/v2/qa/ui-regressions.html');await page.waitForFunction(()=>document.querySelector('#result').dataset.ok,{timeout:15000});
  report.existingRegressions=JSON.parse(await page.locator('#result').textContent());
  check('既有真实页面回归',report.existingRegressions.ok);
 }catch(e){report.executionError=String(e);process.exitCode=1;}
 finally{await browser.close();fs.writeFileSync(path.join(out,'supplement-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();
