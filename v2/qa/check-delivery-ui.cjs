/* Run against the repository HTTP server on :8765. Requires Playwright/Chromium.
   QA_OUTPUT_DIR keeps new evidence separate from prior acceptance snapshots. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve(process.env.QA_OUTPUT_DIR||path.join(__dirname,'../../docs/ui-restoration-2026-10-25'));

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const chrome=process.env.CHROME_PATH||['/usr/bin/chromium','/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p=>fs.existsSync(p));
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:900},timezoneId:'Asia/Shanghai',reducedMotion:'reduce'});
 const page=await context.newPage();
 const report={browser:browser.version(),timezone:'Asia/Shanghai',dpr:1,checks:[],metrics:[],pageErrors:[],httpErrors:[],external:[]};
 page.on('pageerror',e=>report.pageErrors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({url:r.url(),status:r.status()});});
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('data:'))report.external.push(r.url());});
 const check=(name,ok,details)=>report.checks.push({name,ok:!!ok,...(details?{details}:{})});
 const shot=name=>page.screenshot({path:path.join(out,name+'.png')});
 // Canvas resolves both rgb() and color-mix() serialization to actual RGBA.
 const measure=()=>{
  const color=value=>{const c=document.createElement('canvas');c.width=c.height=1;const x=c.getContext('2d');x.fillStyle=value;x.fillRect(0,0,1,1);return [...x.getImageData(0,0,1,1).data];};
  const luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const $=s=>document.querySelector(s),style=n=>getComputedStyle(n);
  const selected=$('.day[aria-selected="true"] .d-num'),neighbor=$('.day[data-out] .d-lunar');
  const opacity=n=>{let value=1;for(;n;n=n.parentElement)value*=Number(style(n).opacity);return value;};
  const card=color(style(document.documentElement).getPropertyValue('--card'));
  const controls=[...document.querySelectorAll('.rail-tool,#motionToggle,#todayButton,#randomButton,#calPrev,#calNext,#calendarCollapse,#eraFilter,.rewind-shortcut')].filter(n=>n.checkVisibility()).map(n=>({id:n.id||n.textContent.trim(),...rect(n)}));
  const onBackdrop=(n,backdrop=n)=>{
   const bg=color(style(backdrop).backgroundColor),fg=color(style(n).color),alpha=bg[3]/255;
   const worst=Math.min(...[0,255].map(value=>contrast(fg,bg.slice(0,3).map(c=>c*alpha+value*(1-alpha)))));
   return {text:n.textContent.trim(),foreground:fg,background:bg,worstContrast:worst};
  };
  const nav=[...document.querySelectorAll('.scale-btn')].map(n=>onBackdrop(n.querySelector('b'),n));
  const tools=[...document.querySelectorAll('.rail-foot button')].filter(n=>n.checkVisibility()).map(n=>onBackdrop(n,$('.rail-foot')));
  return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,controls,nav,toolContrast:tools,
   title:$('.ev-title')?rect($('.ev-title')):null,footer:rect($('.scale-rail')),header:rect($('.stage-heading')),tools:rect($('.rail-foot')),
   selected:{foreground:style(selected).color,mask:getComputedStyle(selected,'::before').maskImage,opacity:getComputedStyle(selected,'::before').opacity,contrast:contrast(color(style(selected).color),color(getComputedStyle(selected,'::before').backgroundColor))},
   neighbor:{opacity:opacity(neighbor),contrast:contrast(color(style(neighbor).color),card)},
   descriptionSize:parseFloat(style($('.ev-desc')).fontSize),sourceSize:parseFloat(style($('.ev-src')).fontSize)};
 };
 try{
  await page.goto('http://127.0.0.1:8765/v2/');await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>V2Views.pickDate(2026,7,11,true));
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   const m=await page.evaluate(measure);report.metrics.push({scene:'hero',theme,...m});
   check(`UI-01 ${theme} 首页三导航对最深/最浅背景均达4.5:1`,m.nav.every(n=>n.worstContrast>=4.5),m.nav);
   check(`${theme} 首页工具在主题切换后仍达4.5:1`,m.toolContrast.every(n=>n.worstContrast>=4.5),m.toolContrast);
   await shot('hero-'+theme);
  }
  for(const [width,height] of [[1440,900],[1536,864],[1024,768],[768,1024],[390,844],[320,740]]){
   await page.setViewportSize({width,height});
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    await page.evaluate(()=>{V2Views.switchView('calendar');V2Views.pickDate(2026,7,11,true)});
    await page.waitForFunction(()=>document.body.dataset.at==='stage');
    const m=await page.evaluate(measure);report.metrics.push({scene:'calendar',theme,...m});
    const key=`${width}x${height} ${theme}`;
    check(`${key} 月历42格且无横溢`,m.scrollWidth<=width&&await page.locator('#calGrid .day').count()===42);
    check(`UI-02 ${key} 通用触区至少44px`,m.controls.every(r=>r.width>=43.99&&r.height>=43.99),m.controls.filter(r=>r.width<43.99||r.height<43.99));
    check(`UI-04 ${key} 圆印与文字对比度`,m.selected.mask.includes('date-seal-mask.svg')&&Number(m.selected.opacity)===1&&m.selected.contrast>=4.5,m.selected);
    check(`UI-05 ${key} 摘要16px出处12px`,m.descriptionSize>=16&&m.sourceSize>=12);
    check(`UI-05 ${key} 跨月农历无透明衰减且4.5:1`,m.neighbor.opacity===1&&m.neighbor.contrast>=4.5,m.neighbor);
    if(width<=390){
     check(`UI-03 ${key} 首条史事标题完整在底栏上方`,m.title.bottom<m.footer.y,{title:m.title,footer:m.footer});
     check(`${key} 顶部工具不遮挡标题操作`,m.tools.bottom<=m.header.y+60);
    }
    if([1440,768,390,320].includes(width)&&(theme==='light'||width!==768))await shot(`${width}-calendar-${theme}`);
    for(const view of ['scroll','seasons']){
     await page.evaluate(view=>{V2Views.switchView(view);if(view==='scroll')V2Views.scrollToEra(10,true);if(view==='seasons')V2Views.setSeason(18)},view);
     await page.waitForTimeout(180);
     check(`${key} ${view} 无横溢`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
     if(view==='seasons'){
      await page.waitForFunction(()=>document.querySelector('.ring-wrap>.season-branch[data-ready]'));
      check(`${key} 枝叶位于圆窗裁切之外`,await page.locator('.ring-wrap>.season-branch').count()===1);
     }
     if([1440,390,320].includes(width))await shot(`${width}-${view}-${theme}`);
    }
   }
  }
  await page.setViewportSize({width:320,height:740});
  await page.evaluate(()=>{document.documentElement.dataset.theme='light';V2Views.switchView('calendar')});
  for(const month of [1,11,12]){
   await page.evaluate(month=>V2Views.pickDate(2026,month,11,true),month);
   const fits=await page.evaluate(()=>{const r=document.querySelector('.cal-page').getBoundingClientRect();return [...document.querySelectorAll('.cal-nav button')].every(n=>n.getBoundingClientRect().right<=r.right)});
   check(`320px ${month}月翻月控件不超出纸面`,fits);
  }
  await page.evaluate(()=>V2Views.pickDate(2026,7,11,true));
  await page.locator('#calendarCollapse').click();
  check('收起月历保留日期和正确语义',await page.evaluate(()=>document.querySelector('#calendarCollapse').getAttribute('aria-expanded')==='false'&&!document.querySelector('#calSheet').checkVisibility()&&V2State.sel.d===11));
  await page.locator('#calendarCollapse').click();
  check('展开月历恢复全部日期',await page.locator('#calGrid .day:visible').count()===42);await shot('320-calendar-expanded');
  await page.evaluate(()=>V2Overlay.openSearch());await page.locator('#searchInput').fill('郑和');await shot('320-search');await page.keyboard.press('Escape');
  await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>{V2Views.switchView('calendar');V2Views.pickDate(2026,7,11,true)});
  await page.locator('.ev').first().click();await page.waitForTimeout(150);await shot('reader-desktop');
  await page.setViewportSize({width:390,height:844});await shot('reader-mobile');await page.keyboard.press('Escape');
  check('无异常或HTTP错误及外部请求',!report.pageErrors.length&&!report.httpErrors.length&&!report.external.length);
 }catch(e){report.fatal=String(e);}
 finally{
  await browser.close();report.ok=!report.fatal&&report.checks.every(t=>t.ok);
  fs.writeFileSync(path.join(out,'delivery-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({ok:report.ok,checks:report.checks.length,failures:report.checks.filter(t=>!t.ok),fatal:report.fatal,errors:report.pageErrors,http:report.httpErrors},null,2));
  if(!report.ok)process.exitCode=1;
 }
})();
