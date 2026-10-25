/* 全站节气氛围：独立于朝代配色，复用北京时间的交节历算。 */
(function () {
  'use strict';
  const root = document.documentElement;
  const canvas = document.getElementById('seasonalFx');
  const toggle = document.getElementById('seasonalToggle');
  if (!canvas || !toggle) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) { toggle.hidden = true; return; }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const weatherProfiles = {
    clear:{label:'晴朗',effect:'clear',clouds:0,intensity:0},
    cloudy:{label:'多云',effect:'cloud',clouds:1,intensity:0},
    drizzle:{label:'小雨',effect:'rain',clouds:.45,intensity:.3},
    storm:{label:'雷雨',effect:'rain',clouds:1.2,intensity:1},
    frost:{label:'结霜',effect:'leaf',clouds:.15,intensity:.35},
    'light-snow':{label:'小雪',effect:'snow',clouds:.25,intensity:.3},
    'heavy-snow':{label:'大雪',effect:'snow',clouds:.7,intensity:1},
    petal:{label:'花飞',effect:'petal',clouds:.08,intensity:.5},
    leaf:{label:'叶落',effect:'leaf',clouds:.05,intensity:.5},
    firefly:{label:'流萤',effect:'firefly',clouds:.08,intensity:.5}
  };
  // These are seasonal art directions, rather than local weather forecasts.
  const names = ['立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至','小寒','大寒'];
  const storageKey = 'yq-season-paused';
  const shapes = {
    leaf: new Path2D('M0 -1C.48 -.87 .84 -.38 .57 .19C.36 .66 .07 .86 0 1C-.4 .59 -.86 .14 -.61 -.39C-.45 -.72 -.16 -.83 0 -1Z'),
    maple: new Path2D('M0 -1.15L.12 -.84 .21 -.86 .22 -.64 .5 -.82 .46 -.57 .55 -.56 .47 -.3 1 -.43 .88 -.18 .95 -.15 .75 .08 .98 .23 .75 .34 .75 .42 .38 .57 .25 .91 .12 .82 0 .74 -.12 .82 -.25 .91 -.38 .57 -.75 .42 -.75 .34 -.98 .23 -.75 .08 -.95 -.15 -.88 -.18 -1 -.43 -.47 -.3 -.55 -.56 -.46 -.57 -.5 -.82 -.22 -.64 -.21 -.86 -.12 -.84Z'),
    ginkgo: new Path2D('M0 .8C-.18 .44 -.72 .22 -.95 -.12C-1.04 -.27 -1.09 -.4 -1 -.47Q-1.02 -.61 -.87 -.64Q-.86 -.79 -.69 -.77Q-.61 -.92 -.47 -.82Q-.35 -.92 -.25 -.75Q-.11 -.74 0 -.48Q.13 -.76 .25 -.75Q.36 -.93 .47 -.82Q.63 -.92 .69 -.77Q.88 -.79 .87 -.64Q1.02 -.61 1 -.47C1.13 -.33 .95 -.04 .75 .17C.48 .42 .14 .51 0 .8Z'),
    petal: new Path2D('M0 .9C-.7 .28 -.95 -.34 -.46 -.8Q-.12 -.98 0 -.59Q.15 -.98 .48 -.79C1 -.27 .57 .39 0 .9Z')
  };
  let paused = false;
  try { paused = (sessionStorage.getItem(storageKey) ?? sessionStorage.getItem('yq-scene-paused')) === '1'; } catch (_) {}
  let weather='leaf', profile=weatherProfiles.leaf, profileStart=0;
  let frostLayer=null, miniFrostLayer=null, cloudLayer=null, rainScene=null;
  let miniature=null, miniContext=null, miniWidth=0, miniHeight=0, miniObserver=null;
  let transition=null, ghostTransition=null;
  const ghost=document.createElement('canvas');ghost.id='seasonalGhost';ghost.setAttribute('aria-hidden','true');document.body.appendChild(ghost);
  let width = 0, height = 0, particles = [], raf = 0, last = 0, elapsed = 0, profileKey = '';
  let selectedInstant = Date.now(), followNow = true, knownTerm = null, term = '', season = 'autumn', effect = 'leaf', colors = [], dark = root.dataset.theme === 'dark';
  const inWelcome = () => root.classList.contains('welcome-pending');
  const parts = ms => {
    const d = new Date(ms + 8 * 3600000);
    return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),second:d.getUTCSeconds()};
  };
  const sameDay = (a,b) => a.year===b.year && a.month===b.month && a.day===b.day;
  function termAt(ms) {
    const p = parts(ms);
    try { return Solar.fromYmdHms(p.year,p.month,p.day,p.hour,p.minute,p.second).getLunar().getPrevJieQi().getName(); }
    catch (_) { return null; }
  }
  function palette(index) {
    if(profile.leafColors) return profile.leafColors;
    if (effect === 'rain') return dark ? ['#9fbcb5','#cad7ce'] : ['#658c85','#7e9b93'];
    if (effect === 'petal') return dark ? ['#e9bdc4','#e1c9ac','#f0d6d0'] : ['#bf7d89','#d69b9e','#bd9b72'];
    if (effect === 'firefly') return ['#d6d88b','#e5c777','#bfd9ac'];
    if (effect === 'snow') return dark ? ['#dbeaf1','#bed8e6','#ecf4f8'] : ['#7f9bab','#94afbc','#6f8f9f'];
    if (index === 12 || index === 13) return ['#8d9561','#c0a04f','#b08046'];
    if (index >= 16) return ['#aa613e','#c38b42','#8f7947','#c6985b'];
    return ['#bb8844','#bd713d','#c4a05b','#9b824d'];
  }
  function updateProfile() {
    const ms = inWelcome() || followNow ? Date.now() : selectedInstant;
    const name = !inWelcome() && !followNow && knownTerm ? knownTerm : termAt(ms);
    if (!name) { canvas.dataset.running='false'; return; }
    term = name;
    const index = names.indexOf(name);
    season = ['spring','summer','autumn','winter'][Math.floor(index/6)];
    const art=Phenology.profileFor(name);
    const changedScene=art.id!==profile.id;
    weather=art.base; profile={...weatherProfiles[weather],...art}; effect=profile.effect;
    dark = root.dataset.theme === 'dark';
    const key = name + '/' + dark;
    colors = palette(index);
    if (key !== profileKey) {
      if(profileKey&&changedScene) softenTransition();
      profileKey = key;
      canvas.dataset.season = season;
      canvas.dataset.effect = effect;
      canvas.dataset.weather=weather;
      canvas.dataset.intensity=String(profile.intensity);
      canvas.dataset.phenology=profile.id;
      root.dataset.weather=weather;
      root.dataset.phenology=profile.id;
      root.dataset.particle=effect;
      root.dataset.ice=profile.frost?profile.frostStyle||'fern':'';
      root.style.setProperty('--phenology-clouds',String(profile.clouds));
      canvas.dataset.phase='steady';root.dataset.rainPhase='steady';
      if(changedScene) profileStart=elapsed;
      seed(); buildAtmosphere();
      document.dispatchEvent(new CustomEvent('season:weather',{detail:{weather,effect,intensity:profile.intensity,id:profile.id,ice:profile.frost?profile.frostStyle||'fern':''}}));
    }
    const label = profile.label;
    toggle.querySelector('.seasonal-caption').textContent = term + ' · ' + label;
    toggle.dataset.effect = effect;
    const p=parts(ms);
    const action = reduce.matches ? '系统已减少动态效果' : paused ? '开启动效' : '暂停动效';
    toggle.setAttribute('aria-label', term+'，'+label+'。'+action);
    toggle.title = p.year+'年'+p.month+'月'+p.day+'日 · 随节气变化 · '+action+'（全站）';
    toggle.setAttribute('aria-pressed',String(paused || reduce.matches));
    toggle.disabled = reduce.matches;
    toggle.querySelector('.seasonal-action').textContent = reduce.matches ? '静' : paused ? '播' : '停';
  }
  function createParticle(initial) {
    const edge = Math.random()<.7;
    const p = {
      x: edge ? (Math.random()<.5 ? Math.random()*.24 : .76+Math.random()*.24)*width : Math.random()*width,
      y:initial ? Math.random()*height : -30-Math.random()*80,
      size:effect==='snow' ? 1.4+Math.random()*2.8 : effect==='rain' ? 7+Math.random()*8 : effect==='firefly' ? 1.5+Math.random()*1.7 : 6+Math.random()*8,
      speed:effect==='rain' ? 120+Math.random()*90 : effect==='snow' ? 18+Math.random()*20 : 22+Math.random()*28,
      phase:Math.random()*Math.PI*2,
      rotation:Math.random()*Math.PI*2,
      spin:(Math.random()-.5)*1.4,
      variant:Math.floor(Math.random()*3),
      color:Math.floor(Math.random()*4),
      alpha:.36+Math.random()*.34,
      edge
    };
    if(effect==='snow') {
      // Fine distant grains, lacy middle crystals, and a few larger foreground flakes.
      const depth=Math.random();
      p.depth=depth<.35?0:depth<(profile.intensity>.5?.7:.9)?1:2;
      p.size=p.depth===0?.8+Math.random()*.9:p.depth===1?3.5+Math.random()*2.5:7.5+Math.random()*3.5;
      p.speed=p.depth===0?9+Math.random()*6:p.depth===1?16+Math.random()*8:24+Math.random()*9;
      p.spin=(Math.random()-.5)*.3;
      p.alpha=p.depth===0?.22+Math.random()*.15:p.depth===1?.42+Math.random()*.16:.54+Math.random()*.13;
      if(p.depth===2) p.x=(Math.random()<.5?Math.random()*.23:.77+Math.random()*.23)*width;
      p.size*=profile.intensity>.5?1.15:.86;
      p.speed*=profile.intensity>.5?1.2:.78;
    }
    p.size*=profile.size||1;p.speed*=profile.speed||1;
    if(profile.leafVariant!==undefined)p.variant=profile.leafVariant;
    if(profile.leafVariants)p.variant=profile.leafVariants[Math.floor(Math.random()*profile.leafVariants.length)];
    return p;
  }
  function seed() {
    canvas.dataset.lightning='none';canvas.dataset.lightningBranches='0';canvas.dataset.rainImpacts='0';
    if(effect==='rain') {
      rainScene=RainAtmosphere.create(width,height,profile,dark);particles=[];
      canvas.dataset.density=String(rainScene.count);canvas.dataset.rainDepths='3';return;
    }
    rainScene=null;canvas.dataset.rainDepths='0';
    const base=Math.max(12,Math.round(width*height/42000));
    let count=effect==='clear'||effect==='cloud'?0:effect==='snow'?Math.min(width<600?profile.intensity>.5?34:9:profile.intensity>.5?72:22,Math.round(base*(profile.intensity>.5?2.4:.6)))
      :weather==='storm'?Math.min(width<600?65:150,base*5):Math.min(width<600?16:30,base);
    if(profile.density!==undefined) count=Math.round(profile.density*(width<600?.5:Math.max(.6,Math.min(1.1,width*height/1296000))));
    particles = Array.from({length:count},()=>createParticle(true));
    canvas.dataset.density=String(count);
  }
  function resize() {
    width=innerWidth; height=innerHeight;
    const dpr=Math.min(devicePixelRatio||1,1.75);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    seed(); buildAtmosphere();
    if (canRun()) paint(0);
  }
  function draw(p) {
    const flutter = Math.cos(elapsed*.9+p.phase);
    const x=p.x+Math.sin(elapsed*(effect==='snow'?.32:.52)+p.phase)*(effect==='rain'?5:effect==='snow'?12+p.depth*7:28);
    // Keep the reading column quieter while making the edges visibly seasonal.
    const middle=x>width*.24 && x<width*.76;
    const fade=effect==='snow'?Math.max(0,Math.min(1,(height+12-p.y)/65)):1;
    const alpha=p.alpha*(middle?.43:1)*(dark?1:.86)*fade*(effect==='rain'?rainWeight():1);
    ctx.save(); ctx.translate(x,p.y); ctx.globalAlpha=alpha;
    const color=colors[p.color%colors.length];
    ctx.fillStyle=color; ctx.strokeStyle=color;
    if(Phenology.drawParticle(ctx,p,elapsed,profile,dark,alpha)) {
      // Special particles share the scene's botanical geometry.
    } else if (effect==='leaf'||effect==='petal') {
      ctx.rotate(p.rotation);
      ctx.scale(p.size*(.36+.64*Math.abs(flutter)),p.size);
      ctx.fill(effect==='petal'?shapes.petal:p.variant===0?shapes.maple:p.variant===1?shapes.ginkgo:shapes.leaf);
      if(effect==='leaf') {
        ctx.strokeStyle=dark?'#e6ce9e':'#755833'; ctx.globalAlpha=alpha*.65; ctx.lineWidth=.045;
        ctx.beginPath();ctx.moveTo(0,.7);ctx.quadraticCurveTo(.03,.95,.08,1.24);ctx.stroke();
        ctx.lineWidth=.025;ctx.beginPath();
        if(p.variant===1) {
          for(let i=0;i<9;i++){const a=-Math.PI*.91+i*Math.PI*.105;ctx.moveTo(0,.7);ctx.quadraticCurveTo(Math.cos(a)*.2,.1,Math.cos(a)*.91,Math.sin(a)*.5-.27);}
        } else {
          ctx.moveTo(0,-.87);ctx.quadraticCurveTo(.06,.2,0,.8);
          for(let i=0;i<3;i++)for(const sign of [-1,1]){const y=.47-i*.29;ctx.moveTo(0,y);ctx.quadraticCurveTo(sign*.19,y-.06,sign*(p.variant===0?.61-i*.13:.4-i*.07),y-.36);}
        }
        ctx.stroke();
      } else {
        ctx.strokeStyle=dark?'#fff0ef':'#f2d2cc';ctx.globalAlpha=alpha*.48;ctx.lineWidth=.035;
        ctx.beginPath();ctx.moveTo(0,.7);ctx.quadraticCurveTo(-.16,-.1,0,-.55);ctx.stroke();
      }
    } else if(effect==='snow') {
      if(p.depth===0) {
        ctx.beginPath();ctx.arc(0,0,p.size,0,Math.PI*2);ctx.fill();
      } else {
        ctx.rotate(p.rotation);
        ctx.scale(p.size*(.88+.12*Math.cos(elapsed*.25+p.phase)),p.size);
        ctx.lineCap='round';ctx.lineJoin='round';
        const crystal=SnowCrystals.paths[p.variant];
        // A cool rim and a narrower icy highlight keep the branches clear on both papers.
        ctx.lineWidth=(p.depth===2?.65:.5)/p.size;
        ctx.stroke(crystal);
        ctx.strokeStyle=dark?'#ffffff':'#f5fbff';
        ctx.globalAlpha=alpha*(dark?.5:.7);
        ctx.lineWidth=(p.depth===2?.32:.24)/p.size;
        ctx.stroke(crystal);
      }
    } else {
      ctx.globalAlpha=alpha*(.2+.8*Math.pow(Math.sin(elapsed*.8+p.phase),2));
      const glow=ctx.createRadialGradient(0,0,0,0,0,p.size*4);
      glow.addColorStop(0,color);glow.addColorStop(.3,color+'a0');glow.addColorStop(1,color+'00');
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,p.size*4,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function buildAtmosphere() {
    if(!width||!height) return;
    cloudLayer=document.createElement('canvas');cloudLayer.width=780;cloudLayer.height=220;
    const clouds=cloudLayer.getContext('2d');
    const rgb=dark?'144,163,182':'115,137,149';
    for(let i=0;i<9;i++) {
      clouds.save();clouds.translate(55+i*82,100+Math.sin(i*2.2)*24);clouds.scale(1,.37);
      const haze=clouds.createRadialGradient(0,0,5,0,0,130);
      haze.addColorStop(0,'rgba('+rgb+',.24)');haze.addColorStop(.45,'rgba('+rgb+',.13)');haze.addColorStop(1,'rgba('+rgb+',0)');
      clouds.fillStyle=haze;clouds.beginPath();clouds.arc(0,0,130,0,Math.PI*2);clouds.fill();clouds.restore();
    }
    frostLayer=null;miniFrostLayer=null;canvas.dataset.frost='none';canvas.dataset.frostGeometry='none';
    if(profile.frost) {
      frostLayer=FrostGlass.build(width,height,dark,profile.frostStyle||'fern');
      canvas.dataset.frost=profile.frostStyle||'fern';canvas.dataset.frostGeometry=frostLayer.dataset.geometry;
      buildMiniFrost();
    }
  }
  function buildMiniFrost() {
    miniFrostLayer=profile.frost&&miniWidth&&miniHeight?FrostGlass.build(miniWidth,miniHeight,dark,profile.frostStyle||'fern',true):null;
  }
  function frostStrength() {
    const age=elapsed-profileStart;
    return (profile.melt?Math.max(.08,1-age/22):.15+.85*Math.min(1,age/5))*(profile.frost||0);
  }
  function drawAtmosphere() {
    ctx.save();
    if(cloudLayer&&profile.clouds) {
      const cloudWidth=Math.max(700,width*.9),cloudHeight=width<600?150:220;
      ctx.globalAlpha=profile.clouds*(weather==='storm'?.6:.43)*(profile.dissolve?.3+.7*(1-Math.min((elapsed-profileStart)/26,1)):1)*(profile.cycle?.25+.75*rainWeight():1);
      const travel=(elapsed*(weather==='storm'?10:4))%(width+cloudWidth);
      ctx.drawImage(cloudLayer,travel-cloudWidth*.5,-60,cloudWidth,cloudHeight);
      ctx.globalAlpha*=.65;
      ctx.drawImage(cloudLayer,width-travel*.55-cloudWidth*.45,height*.12,cloudWidth,cloudHeight*.85);
      if(profile.fog) {
        ctx.globalAlpha=profile.fog*.3;
        ctx.drawImage(cloudLayer,Math.sin(elapsed*.05)*80-width*.2,height*.62,width*1.4,height*.18);
        ctx.globalAlpha*=.5;ctx.drawImage(cloudLayer,Math.cos(elapsed*.04)*40,height*.31,width,height*.12);
      }
    }
    if(frostLayer) {
      ctx.globalAlpha=frostStrength();
      ctx.drawImage(frostLayer,0,0,width,height);
    }
    rainScene?.drawSky(ctx,width,height);
    ctx.restore();
  }
  function drawRipples() {
    ctx.save();ctx.lineWidth=.65;ctx.strokeStyle=dark?'#afc5cd':'#7b9ca9';
    const count=profile.ripples||4;
    for(let i=0;i<count;i++) {
      const phase=(elapsed*(weather==='storm'?1.1:.55)+i*.71)%2;
      const progress=phase/2;ctx.globalAlpha=(1-progress)*.16*(effect==='rain'?rainWeight():1);
      const x=width*((i*.317+.1)%1),y=height-10-(i%3)*9;
      ctx.beginPath();ctx.ellipse(x,y,2+progress*12,1+progress*3,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
  function paint(dt) {
    elapsed+=dt;
    if(rainScene) {
      rainScene.advance(dt,elapsed-profileStart,rainWeight());
      canvas.dataset.lightning=rainScene.lightning?'visible':weather==='storm'?'waiting':'none';
      canvas.dataset.lightningBranches=String(rainScene.branches);
      canvas.dataset.rainImpacts=String(rainScene.impacts);
    }
    if(profile.cycle) {
      const phase=rainWeight()>.5?'rain':'fireflies';
      if(canvas.dataset.phase!==phase){canvas.dataset.phase=phase;root.dataset.rainPhase=phase;}
    }
    ctx.clearRect(0,0,width,height);
    drawAtmosphere();
    Phenology.draw(ctx,width,height,profile,elapsed-profileStart,dark);
    for(let i=0;i<particles.length;i++) {
      const p=particles[i];
      p.y+=dt*p.speed*(effect==='firefly'?-.25:1);
      p.x+=dt*(profile.wind!==undefined?profile.wind:effect==='rain'?weather==='storm'?95:12:effect==='snow'?2+Math.sin(elapsed*.18+p.phase)*4:6+Math.sin(elapsed*.25+p.phase)*12);
      if(profile.orbit)p.x+=dt*Math.cos(elapsed*.45+p.phase)*12;
      p.rotation+=dt*p.spin;
      if(p.y>height+35||p.x>width+55||p.y< -120) {
        particles[i]=createParticle(false);
        if(effect==='firefly') particles[i].y=height+30;
      }
      draw(particles[i]);
    }
    if(rainScene)rainScene.drawRain(ctx,width,height,rainWeight());
    else if(profile.ripples)drawRipples();
    paintMiniature();
  }
  function rainWeight() {
    if(!profile.cycle)return 1;
    const t=(elapsed-profileStart)%28;
    const weight=t<8?1:t<12?1-(t-8)/4:t<24?0:(t-24)/4;
    return weight;
  }
  function softenTransition() {
    if(reduce.matches||paused||document.hidden)return;
    transition?.cancel();ghostTransition?.cancel();
    ghost.width=canvas.width;ghost.height=canvas.height;ghost.getContext('2d').drawImage(canvas,0,0);
    transition=canvas.animate([{opacity:0},{opacity:1}],{duration:700,easing:'ease-out'});
    ghostTransition=ghost.animate([{opacity:.9},{opacity:0}],{duration:700,easing:'ease-out',fill:'forwards'});
  }
  function resizeMiniature() {
    if(!miniature)return;
    miniWidth=miniature.clientWidth;miniHeight=miniature.clientHeight;
    const dpr=Math.min(devicePixelRatio||1,2);
    miniature.width=Math.round(miniWidth*dpr);miniature.height=Math.round(miniHeight*dpr);
    miniContext.setTransform(dpr,0,0,dpr,0,0);
    buildMiniFrost();paintMiniature();
  }
  function paintMiniature() {
    if(!miniContext||!miniWidth||!miniHeight)return;
    miniContext.clearRect(0,0,miniWidth,miniHeight);
    if(miniFrostLayer){miniContext.save();miniContext.globalAlpha=frostStrength();miniContext.drawImage(miniFrostLayer,0,0,miniWidth,miniHeight);miniContext.restore();}
    rainScene?.drawSky(miniContext,miniWidth,miniHeight,true);
    Phenology.draw(miniContext,miniWidth,miniHeight,profile,elapsed-profileStart,dark,true);
    rainScene?.drawRain(miniContext,miniWidth,miniHeight,rainWeight(),true);
  }
  function canRun() {return !paused&&!reduce.matches&&!document.hidden&&!document.body.classList.contains('locked')&&!!term;}
  function frame(now) {
    raf=0;
    if(!canRun()) {sync();return;}
    if(!last) last=now;
    if(now-last>=32) {paint(Math.min((now-last)/1000,.08));last=now;}
    raf=requestAnimationFrame(frame);
  }
  function sync() {
    updateProfile();
    const running=canRun();
    canvas.dataset.running=String(running);
    if(running&&!raf) {last=0;raf=requestAnimationFrame(frame);}
    if(!running) {cancelAnimationFrame(raf);raf=0;last=0;}
    if(!running){transition?.cancel();ghostTransition?.cancel();ghost.style.opacity='0';}
  }
  function setPaused(value) {
    paused=!!value;
    try {sessionStorage.setItem(storageKey,paused?'1':'0');} catch (_) {}
    sync();
    document.dispatchEvent(new CustomEvent('season:motion',{detail:{paused}}));
  }
  window.SeasonalFX = {
    setDate(date,forceCurrent=false) {
      const p={year:date.getFullYear(),month:date.getMonth()+1,day:date.getDate()};
      // Retain an exact instant chosen on the dial when entering that day's history.
      if(!forceCurrent&&knownTerm&&sameDay(p,parts(selectedInstant))){sync();return;}
      followNow=sameDay(p,parts(Date.now()));
      selectedInstant=Date.UTC(p.year,p.month-1,p.day,12)-8*3600000;
      knownTerm=null;sync();
    },
    setInstant(ms,currentTerm) {
      const oldDay=parts(selectedInstant);
      selectedInstant=ms;followNow=false;knownTerm=currentTerm;
      // The clock paints several times per second; a profile only changes at a term boundary.
      if(!inWelcome()&&currentTerm===term&&sameDay(oldDay,parts(ms))) return;
      sync();
    },
    setPaused,
    isPaused:()=>paused,
    attachScene(element) {
      if(!element)return;
      miniObserver?.disconnect();miniature=element;miniContext=element.getContext('2d');
      if(!miniContext)return;
      miniObserver=new ResizeObserver(resizeMiniature);miniObserver.observe(element);resizeMiniature();
    }
  };
  toggle.addEventListener('click',()=>setPaused(!paused));
  document.addEventListener('visibilitychange',sync);
  reduce.addEventListener('change',sync);
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['class','data-theme']});
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,120);});
  // Covers real-time term boundaries, including while the welcome screen is showing.
  setInterval(()=>{if(!document.hidden&&(inWelcome()||followNow))sync();},15000);
  resize();sync();
})();
