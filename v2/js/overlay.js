/* 一个模态层、可取消转场，以及完整的返回上下文。 */
window.V2Overlay = (() => {
  'use strict';
  const { $, $$, el, reduced, ms, anim, toast } = V2;
  const D = V2Data;
  let active = '', saved = null, ctx = null, version = 0, focusTimer;
  let searchIndex = null, results = [], visibleCount = 10, cur = 0, query = '';
  const containers = {enter:'#enter', search:'#search', lookback:'#lookback'};

  function saveContext() {
    const state=V2State;
    return {focus:document.activeElement, y:window.scrollY, x:window.scrollX,
      sel:{...state.sel}, vis:{...state.vis}, era:state.eraIndex,
      scroll:$('#scrollTrack').scrollLeft, filter:$('#eraFilter').value};
  }
  function enter(type) {
    if (active) close(active, false, true);
    saved=saveContext(); active=type; version++;
    $(containers[type]).dataset.open='1';
    document.body.style.overflow='hidden';
    [...document.body.children].forEach(node=>{
      if(node.id !== type && !['SCRIPT','STYLE','LINK'].includes(node.tagName) && node.id !== 'toast') node.inert=true;
    });
    history.scrollRestoration="manual";
    history.pushState({qianqiuOverlay:type},'');
    return version;
  }
  function close(type=active, restore=true, useHistory=true) {
    if (!type || active!==type) return;
    const prior=saved;
    version++; clearTimeout(focusTimer);
    const node=$(containers[type]);
    node.removeAttribute('data-open'); node.removeAttribute('data-sweep');
    [node,...node.querySelectorAll('*')].forEach(n=>n.getAnimations().forEach(a=>a.cancel()));
    active=''; ctx=null; saved=null;
    document.body.style.overflow='';
    [...document.body.children].forEach(n=>n.inert=false);
    if (useHistory && history.state?.qianqiuOverlay) {
      // 显式关闭时原地清掉弹层状态，避免紧接着打开另一入口被异步 popstate 吞掉。
      history.replaceState(null,'');
    }
    if (restore && prior) {
      const changed=JSON.stringify(V2State.sel)!==JSON.stringify(prior.sel) || JSON.stringify(V2State.vis)!==JSON.stringify(prior.vis);
      V2State.sel={...prior.sel}; V2State.vis={...prior.vis};
      if(changed){V2Views.renderMonth(); $('#eraFilter').value=prior.filter; V2Views.renderDaily(false);}
      $('#scrollTrack').scrollLeft=prior.scroll; V2State.eraIndex=prior.era;
      window.scrollTo({top:prior.y,left:prior.x,behavior:'instant'});
      const focus=prior.focus;
      if(focus?.isConnected && !focus.inert) focus.focus({preventScroll:true});
      else $('.day[aria-selected="true"]')?.focus({preventScroll:true});
    }
  }
  window.addEventListener('popstate',()=>{
    if(active)close(active,true,false);
  });
  document.addEventListener('keydown',e=>{
    if(!active || e.key!=='Tab')return;
    const nodes=$$('button:not(:disabled),input,select,a[href],[tabindex="0"]',$(containers[active])).filter(n=>n.getClientRects().length);
    if(!nodes.length)return;
    const first=nodes[0],last=nodes[nodes.length-1];
    if(e.shiftKey && (document.activeElement===first || !nodes.includes(document.activeElement))){e.preventDefault();last.focus();}
    else if(!e.shiftKey && (document.activeElement===last || !nodes.includes(document.activeElement))){e.preventDefault();first.focus();}
  });

  function artUrl(art) {
    return art.direct || art.url || (art.file ? '../assets/' + art.file + '-1536.webp' : '');
  }
  function loadImage(url) {
    return new Promise((resolve, reject) => {
      if (!url) { reject(new Error('empty image url')); return; }
      const probe = new Image();
      probe.onload = () => resolve(url); probe.onerror = reject; probe.src = url;
      if (probe.decode) probe.decode().then(() => resolve(url)).catch(() => {});
    });
  }
  async function warmReaderArt(item) {
    const art = D.artFor(item);
    if (art.missing) return;
    await Promise.race([
      loadImage(artUrl(art)).catch(() => undefined),
      new Promise(resolve => setTimeout(resolve, reduced() ? 0 : 300))
    ]);
  }
  async function openReader(items,index,origin={},event) {
    if(!items?.length)return;
    const safeIndex=Math.max(0,Math.min(index,items.length-1));
    // 先响应并建立可取消的模态层；图片加载不阻塞打开或关闭。
    void warmReaderArt(items[safeIndex]);
    const id=enter('enter');
    ctx={items:items.slice(),index:safeIndex,origin,eraKey:origin.eraKey,
      date:{...V2State.sel}};
    renderReader(false);
    const x=event?.clientX ?? innerWidth/2,y=event?.clientY ?? innerHeight/2;
    const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
    const ink=$('#enterInk');
    ink.style.setProperty('--ix',x+'px');ink.style.setProperty('--iy',y+'px');
    anim($('#enter .enter-stage'),[{clipPath:`circle(0px at ${x}px ${y}px)`},{clipPath:`circle(${radius}px at ${x}px ${y}px)`}],{duration:ms('--dur-ink')*.75,delay:ms('--dur-tap')});
    anim(ink,[{clipPath:`circle(0px at ${x}px ${y}px)`},{clipPath:`circle(${radius}px at ${x}px ${y}px)`}],{duration:ms('--dur-ink')*.65});
    anim($('#enterArt'),[{opacity:0,transform:'scale(1.035)'},{opacity:1,transform:'none'}],{duration:ms('--dur-ink')*.7,delay:ms('--dur-tap')});
    anim($('#enterCaption'),[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],{duration:ms('--dur-view'),delay:ms('--dur-tap')*2});
    $('#enterClose').focus({preventScroll:true});
    focusTimer=setTimeout(()=>{if(version===id && active==='enter')$('#enterClose').focus({preventScroll:true});},reduced()?0:100);
  }
  function renderReader(animate) {
    const item=ctx.items[ctx.index], art=D.artFor(item), img=$('#enterImg');
    img.dataset.eventId = item.id || "";
    img.dataset.assetId = art.assetId || art.id || "";
    const placeholder=$('#enterPlaceholder');
    placeholder.replaceChildren(V2Assets.slot(art.missing ? art : {id:'ART-LOADING',title:art.title,color:'#B6C7B7'}));
    img.hidden=true; img.onload=null;img.onerror=null;img.removeAttribute('srcset');img.removeAttribute('src');
    if(!art.missing){
      const url=artUrl(art);
      const fallbackUrl=item.eraKey && D.PAINT[item.eraKey]?.file
        ? D.PAINT[item.eraKey].file
        : V2Assets.manifest.empty.url;
      let fallbackTried=false;
      img.onload=()=>{img.hidden=false;};
      img.onerror=()=>{
        if(!fallbackTried && fallbackUrl && fallbackUrl!==img.getAttribute('src')){
          fallbackTried=true; img.alt=art.title+'，朝代意象替代画面'; img.src=fallbackUrl; return;
        }
        img.hidden=true;
        placeholder.replaceChildren(V2Assets.slot({id:'ART-FALLBACK',title:art.title+' · 图片暂不可用',color:'#B6C7B7',missing:true}));
      };
      img.src=url; img.alt=art.title+'，艺术意象，非事件实录';
    }
    $('#enterEra').textContent=item.era || '';
    $('#enterYear').textContent=item.y ? D.yearLabel(item.y)+' 年' : '';
    $('#enterJz').textContent=item.jz || '';
    $('#enterCalTag').textContent=item.cal || '';
    $('#enterTitle').textContent=item.t;
    $('#enterDesc').textContent=item.d || '本地资料仅收录标题与出处，更多叙述待补。';
    $('#enterSrc').textContent=item.s ? '出处 · '+item.s : '出处暂缺';
    $('#enterArtNote').replaceChildren(document.createTextNode(art.missing?'素材待补 · ': 'AI 生成画作 · 艺术意象，非事件实录 · '),el('span',{id:'enterArtName',text:art.title}));
    $('#enterOrder').textContent=ctx.origin.origin==='scroll'?'按当前长卷的年份顺序阅读；仅记年份的史事不归入日历。':'按公历 → 农历 → 节气阅读；跨日时取最近有记载的一日。';
    const back=$('#enterClose');
    back.lastChild.textContent=ctx.origin.origin==='scroll'?' 返回长卷':' 返回日历';
    [-1,1].forEach(dir=>{
      const target=neighbor(dir),btn=$(dir<0?'#enterPrev':'#enterNext');
      btn.disabled=!target;
      $('.nb-label',btn).textContent=target?.label || '已到边界';
      $('.nb-title',btn).textContent=target?.title || '暂无更多记载';
    });
    if(animate){
      [$('#enterCaption'),$('#enterArt')].forEach(n=>{
        n.getAnimations().forEach(a=>a.cancel());
        anim(n,[{opacity:.45},{opacity:1}],{duration:ms('--dur-focus')});
      });
      $('#enterCaption').scrollTop=0;
    }
  }
  const eraItems=era=>era.events.map(e=>({id:e[5] || `era:${era.k}:${e[0]}:${e[2]}`,y:e[0],jz:e[1],t:e[2],d:e[3],s:e[4],era:era.name,eraKey:era.k,cal:'长卷'}));
  function neighbor(dir){
    if(!ctx)return null;
    const i=ctx.index+dir;
    if(i>=0 && i<ctx.items.length)return {mode:'same',target:i,label:(ctx.origin.origin==='scroll'?'同一时期':'同一日')+' · '+(dir<0?'前一史事':'后一史事'),title:ctx.items[i].t};
    if(ctx.origin.origin==='scroll'){
      const index=D.eraIndex(ctx.eraKey)+dir, era=D.ERAS[index];
      return era ? {mode:'era',target:index,label:'跨时期 · '+era.name,title:era.events[dir<0?era.events.length-1:0][2]} : null;
    }
    const d=ctx.date,dt=D.nearest(d.y,d.m,d.d,dir,370);
    if(!dt)return null;
    const target={y:dt.getFullYear(),m:dt.getMonth()+1,d:dt.getDate()};
    const list=D.collect(target.y,target.m,target.d);
    return {mode:'day',target,label:`跨日 · ${target.m}月${target.d}日`,title:list[dir<0?list.length-1:0].t};
  }
  async function go(dir){
    const nb=neighbor(dir);if(!nb)return;
    if(nb.mode==='same')ctx.index=nb.target;
    else if(nb.mode==='era'){
      const era=D.ERAS[nb.target];ctx.eraKey=era.k;ctx.items=eraItems(era);ctx.index=dir<0?ctx.items.length-1:0;
    }else{ctx.date=nb.target;ctx.items=D.collect(ctx.date.y,ctx.date.m,ctx.date.d);ctx.index=dir<0?ctx.items.length-1:0;}
    void warmReaderArt(ctx.items[ctx.index]);
    renderReader(true);
  }
  function closeReader(){
    if(active!=='enter')return;
    // 先同步释放 inert 与滚动锁，确保关闭后紧接着触发的入口不会被吞掉。
    close('enter');
  }

  async function openLookback(){
    enter('lookback'); const base=V2State.sel.y;
    $('#lbHeading').textContent='回望千年';
    $('#lbCardEra').textContent='今';
    $('.lookback-depth').replaceChildren(...[1000,800,500,300,100].map((years,i)=>{let target=base-years;if(base>0&&target<=0)target--;const era=D.eraAt(target);return el('span',{style:`--depth:${i}`,text:era?.name||'远古'},[el('small',{text:D.yearLabel(target)+' 年'})]);}));
    $('#lbYear').textContent=D.yearLabel(base);$('#lbFrom').textContent='自选中年份 '+D.yearLabel(base)+' 年回望';
    $('#lbEra').textContent='选一段距离，回到那个时候';$('#lbRoute').textContent='';
    $$('.lb-opt').forEach(b=>b.setAttribute('aria-pressed','false'));
    $('.lb-opt').focus({preventScroll:true});
  }
  function closeLookback(){close('lookback');}
  async function runLookback(years){
    if(active!=='lookback')await openLookback();
    if(active!=='lookback')return;
    const id=++version,base=V2State.sel.y;
    let target=base-years;if(base>0 && target<=0)target--; // 公元纪年无0年
    const era=D.eraAt(target);
    $$('.lb-opt').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.years===years)));
    $('#lbRoute').textContent=`${D.yearLabel(base)} → ${D.yearLabel(target)}${era?' · '+era.name:''}`;
    if(!era){$('#lbEra').textContent='目标年份超出当前长卷收录范围';return;}
    $('#lbHeading').textContent=`回望 ${years} 年前`;
    $('#lbCardEra').textContent=era.name;
    $('#lookback').dataset.sweep='1';
    $('#lbEra').textContent=era.name+' · '+era.span;
    const duration=reduced()?0:ms('--dur-rewind');
    await new Promise(resolve=>{
      const start=performance.now();
      function frame(now){
        if(id!==version){resolve();return;}
        const p=duration?Math.min(1,(now-start)/duration):1;
        const year=Math.round(base+(target-base)*V2.easeOutCubic(p));
        $('#lbYear').textContent=D.yearLabel(year===0?-1:year);
        if(p<1)requestAnimationFrame(frame);else resolve();
      }
      requestAnimationFrame(frame);
    });
    if(id!==version || active!=='lookback')return;
    close('lookback',false);V2Views.switchView('scroll');
    requestAnimationFrame(()=>{V2Views.scrollToEra(D.eraIndex(era.k),true);V2Views.applyEra(era.k);});
    toast(`${D.yearLabel(base)} → ${D.yearLabel(target)} · ${era.name}，仅定位时期`);
  }
  function buildIndex(){
    if(searchIndex)return searchIndex;
    const list=[];
    Object.entries(window.DAY).forEach(([key,items])=>items.forEach(e=>list.push({kind:'day',key,id:e[6],y:e[0],era:e[1],jz:e[2],t:e[3],d:e[4],s:e[5]})));
    Object.entries(window.LUNAR).forEach(([key,items])=>items.forEach(e=>list.push({kind:'lunar',key,id:e[6],y:e[0],era:e[1],jz:e[2],t:e[3],d:e[4],s:e[5]})));
    D.ERAS.forEach(era=>eraItems(era).forEach((e,i)=>list.push({...e,kind:'era',i})));
    D.JQ_ORDER.forEach((name,i)=>list.push({kind:'term',i,t:name,d:JIEQI[name][1],s:JIEQI[name][2],era:'节气'}));
    return searchIndex=list;
  }
  async function openSearch(){
    buildIndex();enter('search');$('#searchInput').value='';visibleCount=10;renderResults('');$('#searchInput').focus({preventScroll:true});
  }
  function closeSearch(){close('search');}
  const kindNames={day:'公历史事',lunar:'农历纪事',era:'长卷大事',term:'节气'};
  function renderResults(value,more=false){
    buildIndex(); query=value.trim(); if(!more)visibleCount=10;
    const list=$('#searchResults');list.getAnimations().forEach(a=>a.cancel());list.replaceChildren();
    anim(list,[{opacity:.4},{opacity:1}],{duration:ms('--dur-focus')});
    const needle=query.toLowerCase();
    results=query?searchIndex.filter(r=>[r.t,r.era,r.jz,r.s,r.y,r.key,r.key?.replace('-','月')].filter(v=>v!==undefined).join(' ').toLowerCase().includes(needle)):[];
    cur=0;
    $('#searchCount').textContent=query?`${results.length} 条结果`:`${searchIndex.length} 条本地记录`;
    if(!query || !results.length){
      list.append(el('div',{class:'search-empty',text:query?'暂无匹配史事，可试试朝代或年份。':'以一人、一事、一年，寻找走进历史的入口。'}));
      if(query){const clear=el('button',{class:'btn btn--ghost',text:'清空搜索',type:'button'});clear.onclick=()=>{$('#searchInput').value='';renderResults('');$('#searchInput').focus();};list.append(clear);}
      return;
    }
    const shown=results.slice(0,visibleCount);
    Object.keys(kindNames).forEach(kind=>{
      const subset=shown.filter(r=>r.kind===kind); if(!subset.length)return;
      list.append(el('h3',{class:'search-group',text:kindNames[kind]}));
      subset.forEach(r=>{
        const date=r.kind==='day'?r.key.replace('-',' 月 ')+' 日':r.kind==='lunar'?(r.key==='12-00'?'农历岁末 · 除夕':'农历 '+r.key.replace('-',' 月 ')+' 日'):r.kind==='era'?'仅记年份':'时令';
        const thumb = el('span', {class:'sr-thumb', ariaHidden:'true'});
        const item = {...r, eraKey:r.eraKey || D.ERAS.find(e=>e.name===r.era)?.k};
        const art = r.kind === 'term' ? V2Assets.termFor(r.i) : D.artFor(item);
        const url = artUrl(art);
        if (url) {
          const image = el('img', {src:url, alt:'', loading:'lazy', decoding:'async'});
          image.onerror = () => { image.remove(); thumb.dataset.fallback = 'true'; };
          thumb.append(image);
        }
        const row=el('button',{class:'sr',type:'button'},[
          thumb,
          el('span',{class:'y',text:r.y?D.yearLabel(r.y):'—'}),
          el('span',{class:'t',text:r.t}),
          el('span',{class:'m',text:[date,r.era,r.jz].filter(Boolean).join(' · ')})
        ]);
        row.onclick=()=>openResult(r);list.append(row);
      });
    });
    const rows=$$('.sr',list);if(rows[0])rows[0].dataset.cur='1';
    if(results.length>visibleCount){const more=el('button',{type:'button',class:'search-more btn btn--ghost',text:`继续浏览 · 余 ${results.length-visibleCount} 条`});more.onclick=()=>{visibleCount+=10;renderResults(query,true);};list.append(more);}
  }
  function openResult(r){
    close('search',false);
    const year=V2State.sel.y;
    const navigate=()=>{
      if(r.kind==='term'){V2Views.switchView('seasons');V2Views.setSeason(r.i);return;}
      if(r.kind==='era'){
        V2Views.switchView('scroll');
        requestAnimationFrame(()=>{V2Views.scrollToEra(D.eraIndex(r.eraKey),true);openReader(eraItems(D.ERAS[D.eraIndex(r.eraKey)]),r.i,{origin:'scroll',eraKey:r.eraKey});});return;
      }
      const parts=r.key.split('-').map(Number), date=r.kind==='day'?new Date(year,parts[0]-1,parts[1]):D.lunarDate(r.key,year);
      if(!date){toast('选中年份内未找到对应农历日期');return;}
      const y=date.getFullYear(),m=date.getMonth()+1,d=date.getDate();
      V2Views.switchView('calendar');V2Views.pickDate(y,m,d);
      const items=D.collect(y,m,d), i=items.findIndex(e=>r.id ? e.id===r.id : e.t===r.t);
      if(i<0){toast('未找到对应记载');return;}
      requestAnimationFrame(()=>openReader(items,i,{origin:'calendar'}));
    };
    navigate();
  }
  function moveCur(dir){
    const rows=$$('.sr');if(!rows.length)return;
    cur=(cur+dir+rows.length)%rows.length;
    rows.forEach((n,i)=>{if(i===cur)n.dataset.cur='1';else delete n.dataset.cur;});
    rows[cur].scrollIntoView({block:'nearest'});
  }
  return {openReader,closeReader,go,neighbor,openLookback,closeLookback,runLookback,openSearch,closeSearch,renderResults,moveCur,openResult,
    topmost:()=>active,closeTop:()=>{if(!active)return false;if(active==='enter')closeReader();else close();return true;},get isEnterOpen(){return active==='enter';}};
})();
