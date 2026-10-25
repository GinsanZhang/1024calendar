/* 首版连接：入口、全局操作、素材清单及节气物象。 */
(() => {
  const {$,$$,storage,reduced}=V2;
  const D=V2Data;
  const previewDate = new Date();
  $('.portal-mini-calendar>span').textContent = `${previewDate.getFullYear()} · ${previewDate.getMonth()+1}月`;
  $('.portal-mini-calendar b').textContent = previewDate.getDate();
  function today(){const d=new Date();V2Views.switchView('calendar');$('#eraFilter').value='';V2Views.pickDate(d.getFullYear(),d.getMonth()+1,d.getDate());}
  $('#todayButton').onclick=today;
  $('#eraFilter').onchange=()=>V2Views.renderDaily(false);
  $('#randomButton').onclick=()=>{
    const keys=Object.keys(DAY), key=keys[Math.floor(Math.random()*keys.length)];
    const [m,d]=key.split('-').map(Number);
    V2Views.switchView('calendar');$('#eraFilter').value='';V2Views.pickDate(V2State.sel.y,m,d);
    V2.toast(`已翻到 ${m} 月 ${d} 日`);
  };
  $('#homeButton').onclick=()=>$('#hero').scrollIntoView({behavior:reduced()?'auto':'smooth'});
  $('#searchClose').onclick=()=>V2Overlay.closeSearch();
  $$('.search-examples button').forEach(b=>b.onclick=()=>{$('#searchInput').value=b.dataset.query;V2Overlay.renderResults(b.dataset.query);$('#searchInput').focus();});
  $$('.rewind-shortcut').forEach(b=>b.onclick=async()=>{await V2Overlay.openLookback();V2Overlay.runLookback(+b.dataset.years);});
  $('#eraPrev').onclick=()=>V2Views.scrollToEra(Math.max(0,V2State.eraIndex-1));
  $('#eraNext').onclick=()=>V2Views.scrollToEra(Math.min(D.ERAS.length-1,V2State.eraIndex+1));
  $('#currentTerm').onclick=()=>V2Views.setSeason(D.JQ_ORDER.indexOf(D.currentTerm()));
  function motion(){
    const paused=storage.get('v2-motion')==='paused';
    if(paused) document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).forEach(a=>{try{a.finish();}catch(_){a.cancel();}});
    document.documentElement.dataset.motion=paused?'paused':'playing';
    $('#motionToggle span').textContent=paused?'恢复动效':'暂停动效';
    $('#motionToggle use').setAttribute('href',paused?'assets/icons/motion.svg#play':'assets/icons/motion.svg#pause');
    $('#motionToggle').setAttribute('aria-pressed',String(paused));
  }
  motion();
  document.documentElement.dataset.performance = (navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4) ? 'low' : 'normal';
  const heroArt=$('.hero-art');
  function heroFallback(){heroArt.hidden=true;const slot=V2Assets.slot({id:'HER-001',title:'千秋山水首屏',color:'#AFC3AD',missing:true});slot.classList.add('hero-fallback');$('#hero').prepend(slot);}
  heroArt.addEventListener('error',heroFallback,{once:true});
  if(heroArt.complete && !heroArt.naturalWidth)heroFallback();
  $('#motionToggle').onclick=()=>{storage.set('v2-motion',document.documentElement.dataset.motion==='paused'?'playing':'paused');motion();drawOnce();};
  $('#themeToggle').addEventListener('click',drawOnce);
  $('#assetRegister').replaceChildren(...Object.values(V2Assets.manifest).map(a=>{
    const row=document.createElement('p');row.textContent=`${a.id} · ${a.title} → v2/${a.file}`;return row;
  }));
  // 已有24组矢量物象复用；离开四时、弹层、后台和暂停时均停帧。
  const canvas=$('#phenologyCanvas'), context=canvas.getContext('2d');
  let clock=0,last=0,raf=0;
  function drawOnce(){
    const size=Math.round(canvas.clientWidth);if(!size || !context)return;
    const ratio=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(size*ratio)){canvas.width=canvas.height=Math.round(size*ratio);}
    context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,size,size);
    const profile=Phenology.profileFor(D.JQ_ORDER[V2State.jqIndex]);
    if(profile)Phenology.draw(context,size,size,profile,clock,document.documentElement.dataset.theme==='dark',true);
  }
  function frame(now){
    const running=!document.hidden && V2State.view==='seasons' && !V2Overlay.topmost() && !reduced();
    if(running && now-last>50){clock+=Math.min((now-last)/1000,.06);drawOnce();last=now;}
    else if(!running)last=now;
    raf=requestAnimationFrame(frame);
  }
  window.addEventListener('qianqiu:term',drawOnce);window.addEventListener('resize',drawOnce);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',drawOnce);
  window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));
  drawOnce();raf=requestAnimationFrame(frame);
})();
