/* Local server must serve repository on 8765. Override CHROME_PATH if needed.
   QA_OUTPUT_DIR selects an evidence directory without overwriting prior reviews. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve(process.env.QA_OUTPUT_DIR||path.join(__dirname,'../../docs/v2-interaction-acceptance'));
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const chrome=process.env.CHROME_PATH||['/usr/bin/chromium','/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p=>fs.existsSync(p));
 const b=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{})});
 const c=await b.newContext({viewport:{width:1440,height:900},timezoneId:'Asia/Shanghai',recordVideo:{dir:out,size:{width:1440,height:900}}});
 const p=await c.newPage(), tests=[],errors=[],external=[];
 p.on('pageerror',e=>errors.push(String(e)));p.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('data:'))external.push(r.url())});
 const check=async(name,fn)=>{const ok=await fn();if(!ok){await p.screenshot({path:path.join(out,'failure.png')});console.log(await p.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,nodes:[...document.querySelectorAll('body *')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.right>innerWidth+1}).slice(0,15).map(n=>({tag:n.tagName,cls:String(n.className),width:n.getBoundingClientRect().width,right:n.getBoundingClientRect().right}))})));}tests.push({name,ok:!!ok});if(!ok)throw Error(name)};
 const snap=async(name)=>{await p.screenshot({path:path.join(out,name+'.png')})};
 try{
 await p.goto('http://127.0.0.1:8765/v2/');await p.evaluate(()=>document.fonts.ready);
 await check('01 首页静态主题与三个入口可用',()=>p.evaluate(()=>document.querySelectorAll('.portal[data-go]').length===3&&document.querySelector('.hero-art').naturalWidth>0));
 await p.waitForTimeout(800);await check('01 云雾运行且周期在16–28秒',()=>p.evaluate(()=>[...document.querySelectorAll('.hero-mist')].every(n=>{const s=getComputedStyle(n);const t=parseFloat(s.animationDuration);return t>=16&&t<=28&&s.animationPlayState==='running'})));await snap('01-hero');await p.locator('#heroScroll').click();await p.waitForTimeout(600);
 await p.locator('.portal[data-go="calendar"]').click();await p.waitForTimeout(600);
 await check('02 闰年与跨年月份均为连续42格',()=>p.evaluate(()=>[[2024,2],[2026,12],[2027,1]].every(([y,m])=>{V2State.vis={y,m};V2Views.renderMonth();const cells=[...document.querySelectorAll('.day')];return cells.length===42&&cells.every((n,i)=>!i||new Date(n.dataset.date)-new Date(cells[i-1].dataset.date)===86400000)})));
 await p.evaluate(()=>V2Views.pickDate(2026,7,11,true));await snap('02-calendar');await p.locator('#calNext').click();await p.waitForTimeout(90);await snap('02-page-motion');await p.waitForTimeout(400);await check('02 翻页结束清理旧纸层',()=>p.evaluate(()=>document.querySelector('#calendarTurn').hidden&&!document.querySelector('#calendarTurn').children.length));await p.evaluate(()=>V2Views.pickDate(2026,7,11,true));
 await check('03 慢图立即响应、关闭后不会迟发重开',()=>p.evaluate(async()=>{const Original=window.Image;window.Image=class{set src(v){}decode(){return new Promise(()=>{})}};const pending=V2Overlay.openReader(V2Data.collect(2026,7,11),0,{origin:'calendar'});const now=V2Overlay.topmost()==='enter';V2Overlay.closeTop();await pending;await new Promise(r=>setTimeout(r,400));window.Image=Original;return now&&!V2Overlay.topmost()}));
 await p.locator('.ev').first().click();await p.waitForTimeout(85);await snap('03-ink-motion');await p.waitForTimeout(800);await snap('03-reader');
 await check('03 画作意象及出处说明可见',()=>p.locator('#enterArtNote').textContent().then(t=>t.includes('非事件实录')));
 await p.keyboard.press('Escape');
 await check('03 关闭恢复来源焦点',()=>p.evaluate(()=>!V2Overlay.topmost()&&document.activeElement.matches('.ev')));
 await p.evaluate(()=>{V2Views.switchView('scroll');V2Views.scrollToEra(10,true)});await p.waitForTimeout(650);
 await check('04 十四时期92条可访问且不伪造月日',()=>p.evaluate(()=>V2Data.ERAS.length===14&&V2Data.ERAS.reduce((s,e)=>s+e.events.length,0)===92&&document.querySelectorAll('.era-panel').length===14));
 await snap('04-scroll');const before=await p.locator('#scrollTrack').evaluate(n=>n.scrollLeft);
 await p.locator('.era-ev').first().click();await p.waitForTimeout(850);await p.keyboard.press('Escape');
 await check('04 返回保持长卷位置',()=>p.locator('#scrollTrack').evaluate((n,x)=>Math.abs(n.scrollLeft-x)<2,before));
 await p.evaluate(()=>{V2Views.switchView('seasons');V2Views.setSeason(18)});await p.waitForTimeout(650);await snap('05-seasons');
 await check('05 当前节气缩略图在可视范围',()=>p.evaluate(()=>{const n=document.querySelector('.node[data-on]').getBoundingClientRect(),r=document.querySelector('#ring').getBoundingClientRect();return n.left>=r.left&&n.right<=r.right}));
 await check('05 二十四节气节点与交节时间',()=>p.evaluate(()=>document.querySelectorAll('.node').length===24&&V2Data.JQ_ORDER.every(n=>V2Data.termDate(n,2026).startsWith('2026-'))&&V2State.jqIndex===18));
 await p.evaluate(()=>{V2Views.pickDate(2026,10,25,true);V2Overlay.openLookback()});
 await p.locator('.lb-opt[data-years="500"]').click();await snap('06-lookback');
 await check('06 2026回望500年为1526明',()=>p.locator('#lbRoute').textContent().then(t=>t.includes('1526')&&t.includes('明')));
 await p.waitForFunction(()=>!V2Overlay.topmost(),{},{timeout:2000});
 await check('06 回溯完成进入对应长卷',()=>p.evaluate(()=>!V2Overlay.topmost()&&V2State.view==='scroll'&&V2State.eraIndex===10));
 await p.evaluate(()=>V2Overlay.openSearch());
 for(const query of ['郑和','1405','永乐','赤壁']){await p.locator('#searchInput').fill(query);await check('07 搜索命中 '+query,()=>p.locator('.sr').count().then(n=>n>0))}
 await p.locator('#searchInput').fill('郑和');await snap('07-search');
 await p.locator('#searchInput').dispatchEvent('keydown',{key:'Enter',isComposing:true});await check('07 中文输入法Enter不抢占',()=>p.evaluate(()=>V2Overlay.topmost()==='search'));
 await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await p.waitForTimeout(850);await p.keyboard.press('Escape');
 await p.evaluate(()=>{V2Views.switchView('calendar');V2Views.pickDate(2026,10,12,true)});await p.waitForTimeout(550);await snap('08-blank');
 await check('08 示例空日无伪造史事且前后目标可达',()=>p.evaluate(()=>[12,24].every(d=>!V2Data.collect(2026,10,d).some(e=>e.cal==='公历'))&&document.querySelectorAll('.blank-btn').length===2));
 await p.locator('.blank-btn').first().click();await check('08 跳到真实有史日',()=>p.evaluate(()=>V2Data.collect(V2State.sel.y,V2State.sel.m,V2State.sel.d).some(e=>e.cal!=='节气')));
 for(const width of [320,390,820,1440]){await p.setViewportSize({width,height:900});for(const theme of ['light','dark'])for(const view of ['calendar','scroll','seasons']){await p.evaluate(({theme,view})=>{document.documentElement.dataset.theme=theme;V2Views.switchView(view)},{theme,view});await p.waitForTimeout(550);await check(`09 ${width}px ${theme} ${view} 无横向溢出`,()=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}if(width===390)await snap('09-mobile-seasons')}
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{document.documentElement.dataset.theme='light';V2Views.switchView('calendar');V2Views.pickDate(2026,7,11,true)});await p.waitForTimeout(600);await check('09 手机首屏可见首条史事标题',()=>p.locator('.ev-title').first().boundingBox().then(r=>r&&r.y+r.height<766));await snap('09-mobile-calendar');
 await p.locator('.ev').first().click();await p.waitForTimeout(850);await snap('09-mobile-reader');await p.goBack();await check('09 浏览器返回关闭画卷',()=>p.evaluate(()=>!V2Overlay.topmost()));
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>V2Overlay.openLookback());await p.locator('.lb-opt[data-years="500"]').click();await p.waitForTimeout(100);await check('10 减少动态直接落到长卷',()=>p.evaluate(()=>!V2Overlay.topmost()&&V2State.view==='scroll'));
 await p.route(/\.(webp|png)(\?|$)/,r=>r.abort());await p.reload();await p.evaluate(()=>{V2Views.switchView('calendar');V2Views.pickDate(2026,7,11,true)});await p.locator('.ev').first().click();await p.waitForTimeout(400);
 await check('03/10 全部画作失败保留线描与正文',()=>p.evaluate(()=>document.querySelector('#enterPlaceholder .fallback-sketch')&&document.querySelector('#enterImg').hidden&&document.querySelector('#enterTitle').textContent.length>0));await snap('10-image-fallback');await p.keyboard.press('Escape');
 await check('10 无运行时异常或外部网络请求',()=>!errors.length&&!external.length);
 await p.unroute(/\.(webp|png)(\?|$)/);await p.emulateMedia({reducedMotion:'no-preference'});await p.goto('http://127.0.0.1:8765/v2/qa/ui-regressions.html');await p.waitForFunction(()=>document.querySelector('#result').dataset.ok,{timeout:15000});await check('既有11条UI回归',()=>p.locator('#result').getAttribute('data-ok').then(v=>v==='true'));
 }catch(e){tests.push({error:String(e)});process.exitCode=1}finally{const video=p.video();const raw=video.path();await c.close();await video.saveAs(path.join(out,'walkthrough.webm'));fs.rmSync(await raw,{force:true});await b.close();const report={ok:!process.exitCode,tests,errors,external};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();
