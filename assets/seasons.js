/* 四时：交节按 lunar.js 的北京时间历算值，一天刻度为民用钟时。 */
(function () {
  'use strict';
  const root = document.getElementById('viewSeasons');
  if (!root) return;
  const HOUR = 3600000, DAY = 24 * HOUR, OFFSET = 8 * HOUR;
  const MIN_YEAR = 1901, MAX_YEAR = 2099;
  const NAMES = ['立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至','小寒','大寒'];
  const ALIASES = {DA_XUE:'大雪',DONG_ZHI:'冬至',XIAO_HAN:'小寒',DA_HAN:'大寒',LI_CHUN:'立春',YU_SHUI:'雨水',JING_ZHE:'惊蛰'};
  const SEASONS = ['春','夏','秋','冬'];
  const COLORS = ['#66835e','#337b74','#a06b39','#637f92'];
  const POEMS = ['东风解冻，草木初生。','雨润万物，春山渐醒。','一声春雷，万物萌动。','春色中分，花开正好。','风清景明，柳绿花繁。','雨生百谷，春将归去。','绿荫渐浓，万物并秀。','小得盈满，麦香初成。','有芒可种，田野正忙。','日长之至，蝉声入夏。','温风初至，荷香渐起。','流萤照夜，盛夏如歌。','一叶知秋，凉风有信。','暑气渐退，禾谷将熟。','露从今夜白，风自此时凉。','秋色平分，山河澄明。','露气渐寒，雁过秋山。','霜染层林，秋意将尽。','万物收藏，山河入冬。','寒意初凝，静候一场雪。','雪意渐深，天地留白。','一阳初生，静待春归。','雁归北乡，寒意未尽。','岁寒将尽，春信已近。'];
  const cache = new Map();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = false, playing = false, paused = window.SeasonalFX ? SeasonalFX.isPaused() : false, live = true;
  let instant = Date.now(), frame = 0, lastFrame = 0, lastPaint = 0, termKey = '', ringYear = 0, calendarKey = '';
  const $ = selector => root.querySelector(selector);
  const pad = n => String(n).padStart(2,'0');
  const parts = ms => {
    const d = new Date(ms + OFFSET);
    return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),second:d.getUTCSeconds()};
  };
  const stamp = (y,m,d,h=0,min=0,s=0) => Date.UTC(y,m-1,d,h,min,s)-OFFSET;
  const dateKey = p => p.year+'-'+pad(p.month)+'-'+pad(p.day);
  const fmtDate = ms => { const p=parts(ms); return p.month+'月'+p.day+'日'; };
  const fmtTerm = ms => { const p=parts(Math.round(ms/60000)*60000); return p.month+'月'+p.day+'日 '+pad(p.hour)+':'+pad(p.minute); };
  const polar = (r,deg) => ({x:300+r*Math.sin(deg*Math.PI/180),y:300-r*Math.cos(deg*Math.PI/180)});
  function yearTerms(year) {
    if (!cache.has(year)) {
      const table = Solar.fromYmd(year,6,1).getLunar().getJieQiTable();
      const terms = Object.entries(table).map(([key,s]) => ({
        name:ALIASES[key]||key,
        at:stamp(s.getYear(),s.getMonth(),s.getDay(),s.getHour(),s.getMinute(),s.getSecond())
      })).filter(t => parts(t.at).year === year && NAMES.includes(t.name)).sort((a,b)=>a.at-b.at);
      if (terms.length !== 24) throw new Error('节气历算数据不完整：'+year);
      cache.set(year,terms);
      // A small bounded cache also supports browsing through many years.
      if (cache.size>9) cache.delete(cache.keys().next().value);
    }
    return cache.get(year);
  }
  function neighbors(ms) {
    const y=parts(ms).year;
    const terms=[...yearTerms(y-1),...yearTerms(y),...yearTerms(y+1)];
    const i=terms.findIndex(t=>t.at>ms);
    return {current:terms[i-1],next:terms[i]};
  }
  SnowCrystals.masks.forEach((mask,i)=>root.style.setProperty('--snow-mask-'+i,mask));
  root.dataset.weather=document.documentElement.dataset.weather||'leaf';
  root.dataset.phenology=document.documentElement.dataset.phenology||'';
  root.dataset.particle=document.documentElement.dataset.particle||'leaf';
  root.dataset.ice=document.documentElement.dataset.ice||'';
  document.addEventListener('season:weather',event=>{
    root.dataset.weather=event.detail.weather;root.dataset.phenology=event.detail.id;
    root.dataset.particle=event.detail.effect;root.dataset.ice=event.detail.ice;
  });
  const particleMarkup=(count,offset=0)=>Array.from({length:count},(_,n)=>{const i=n+offset;return '<i style="--i:'+i+';--x:'+((i*37+9)%100)+'%;--delay:-'+(i*1.71)+'s;--duration:'+(8+i%7)+'s;--snow-size:'+(i%4===0?2:i%3===0?12:8)+'px;--snow-opacity:'+(i%4===0?.35:.76)+';--snow-duration:'+(18+i%9)+'s;--snow-drift:'+((i%2?1:-1)*(12+i%5*5))+'px;--snow-turn:'+((i%2?1:-1)*(30+i%4*12))+'deg"></i>';}).join('');
  const particles=particleMarkup(19),extraSnow=particleMarkup(13,19);
  root.innerHTML=`
    <header class="season-header">
      <div><p class="season-kicker">一页千秋 · 天地的刻度</p><h1>看见时间，<span>也看见四季。</span></h1><p class="season-intro">日有轮转，岁有节序。让每一个日子，有可感知的模样。</p></div>
      <div class="season-year"><button type="button" id="seasonPrevYear" aria-label="上一年">‹</button><strong id="seasonYear"></strong><span>年</span><button type="button" id="seasonNextYear" aria-label="下一年">›</button></div>
    </header>
    <div class="season-observatory">
      <div class="season-instrument">
        <div class="season-dial" id="seasonDial">
          <svg class="season-rings" viewBox="0 0 600 600" aria-hidden="true">
            <circle class="season-guide" cx="300" cy="300" r="231"/>
            <g id="seasonTicks"></g>
            <circle class="season-inner-guide" cx="300" cy="300" r="203"/>
            <circle class="season-year-arc" id="seasonYearArc" cx="300" cy="300" r="231" transform="rotate(-90 300 300)"/>
            <line class="season-needle" id="seasonNeedle" x1="300" y1="97" x2="300" y2="62"/>
            <circle class="season-marker" id="seasonMarker" r="6"/>
          </svg>
          <div id="seasonLabels"></div>
          <div class="season-world" role="img" aria-label="随节气变化的四季山水意象">
            <svg class="season-landscape" viewBox="0 0 400 400" aria-hidden="true">
              <defs><linearGradient id="seasonSky" x2="0" y2="1"><stop class="season-sky-top"/><stop class="season-sky-bottom" offset="1"/></linearGradient><linearGradient id="seasonWater" x2="0" y2="1"><stop stop-color="var(--s-water)"/><stop offset="1" stop-color="var(--s-ground)"/></linearGradient></defs>
              <rect width="400" height="400" fill="url(#seasonSky)"/>
              <g class="season-stars" fill="#f2e6c2"><circle cx="75" cy="75" r="1.2"/><circle cx="125" cy="47" r="1"/><circle cx="278" cy="60" r="1.3"/><circle cx="325" cy="113" r="1"/><circle cx="176" cy="81" r="1"/><circle cx="235" cy="33" r="1"/></g>
              <circle class="season-orb" id="seasonOrb" cx="278" cy="110" r="23"/>
              <path class="season-cloud season-cloud-far" d="M-20 140Q35 119 80 137T186 128T320 138T440 116" fill="none" stroke-width="10"/>
              <path class="season-mountain far" d="M-20 254L39 183 66 202 115 133 152 188 190 158 242 221 287 165 340 211 385 169 420 234V400H-20Z"/>
              <path class="season-mountain middle" d="M-20 295L32 256 82 275 142 214 187 263 232 223 287 257 332 230 420 286V400H-20Z"/>
              <path d="M-20 310Q91 281 192 303T420 288V400H-20Z" fill="url(#seasonWater)"/>
              <g class="season-water-lines" fill="none" stroke-width="1"><path d="M138 327h62m-26 12h95m-165 17h64m67-7h67m-111 23h58"/><path d="M169 313h50m26 16h55m-183 46h59"/></g>
              <path class="season-mountain near" d="M-20 320Q50 298 105 326T218 382L242 420H-20ZM420 320Q354 308 325 357L299 420H420Z"/>
              <g class="season-tree" fill="none" stroke-linecap="round"><path d="M74 350Q86 290 67 231M82 303L112 267M78 282L48 256M73 262L91 239" stroke="#655849" stroke-width="4"/><g class="season-foliage"><ellipse cx="62" cy="239" rx="26" ry="15"/><ellipse cx="90" cy="249" rx="30" ry="17"/><ellipse cx="42" cy="257" rx="27" ry="13"/><ellipse cx="104" cy="270" rx="29" ry="15"/><ellipse cx="70" cy="272" rx="32" ry="16"/></g></g>
              <g class="season-boat" stroke="#635a49" fill="none" stroke-linecap="round"><path d="M241 347q15 6 29-2l-5 7h-19Z" fill="#635a49"/><path d="M255 346v-15l10 12h-10" fill="#ede3c4"/><path d="m249 340-9 12"/></g>
              <path class="season-cloud season-cloud-near" d="M-15 264Q89 240 168 259T420 248" fill="none" stroke-width="13"/>
            </svg>
            <div class="season-particles" aria-hidden="true">${particles}</div>
            <div class="season-particles season-particles-extra" aria-hidden="true">${extraSnow}</div>
            <canvas class="season-phenology" id="seasonPhenology" aria-hidden="true"></canvas>
            <div class="season-world-caption"><span id="seasonWorldSeason"></span><span>山河入序</span></div>
          </div>
          <span class="season-compass season-north">冬藏</span><span class="season-compass season-east">春生</span><span class="season-compass season-south">夏长</span><span class="season-compass season-west">秋收</span>
        </div>
        <p class="season-dial-note"><span class="season-dot"></span> 光点随太阳黄经前行 · 点击节气，走进那一天</p>
      </div>
      <div class="season-reading">
        <div class="season-nowline"><span id="seasonMode">此时此刻</span><time id="seasonDateLabel"></time></div>
        <p class="season-sequence" id="seasonSequence"></p>
        <h2 id="seasonName"></h2>
        <p class="season-poem" id="seasonPoem"></p>
        <p class="season-definition" id="seasonDefinition"></p>
        <div class="season-term-progress"><div class="season-between"><span id="seasonStart"></span><span id="seasonEnd"></span></div><div class="season-progress-track"><i id="seasonTermProgress"></i></div><p id="seasonProgressText"></p></div>
        <div class="season-next"><div><span>下一节气</span><strong id="seasonNextName"></strong></div><div class="season-countdown"><strong id="seasonCountdown"></strong><span id="seasonNextAt"></span></div></div>
        <p class="season-today-term" id="seasonTodayTerm" hidden></p>
        <button class="season-read-day" type="button" id="seasonReadDay">读这一天的历史 <span aria-hidden="true">↗</span></button>
      </div>
    </div>
    <section class="season-time" aria-labelledby="seasonTimeTitle">
      <div class="season-time-label"><h3 id="seasonTimeTitle">一日之间</h3><time id="seasonClock"></time><span id="seasonHourName"></span></div>
      <div class="season-day-track"><div class="season-day-gradient"></div><input id="seasonTime" aria-label="一天中的时间，北京时间" type="range" min="0" max="1439" step="1"><div class="season-day-labels"><span>子夜 00:00</span><span>清晨 06:00</span><span>正午 12:00</span><span>入夜 18:00</span><span>24:00</span></div></div>
    </section>
    <section class="season-year-control" aria-labelledby="seasonYearTitle">
      <div class="season-controls-head"><div><h3 id="seasonYearTitle">一年一轮回</h3><span id="seasonYearProgress"></span></div><div class="season-controls"><button type="button" id="seasonMotion" aria-pressed="false">暂停景物</button><button type="button" id="seasonLive">回到此刻</button><button type="button" class="season-play" id="seasonPlay" aria-pressed="false"><span aria-hidden="true">▷</span> 播放全年</button></div></div>
      <div class="season-year-slider"><input id="seasonDay" type="range" min="0" max="364" step="1" aria-label="拖动浏览全年日期"><div class="season-months">${Array.from({length:12},(_,i)=>'<span>'+(i+1)+'月</span>').join('')}</div></div>
      <div class="season-year-foot"><label for="seasonDate">走到这一天 <input id="seasonDate" type="date" min="1901-01-01" max="2099-12-31"></label><span id="seasonTravelStatus" role="status" aria-live="polite"></span><span class="season-year-hint">拖动刻度，让四季在眼前流转</span></div>
    </section>
    <div class="season-almanac" id="seasonAlmanac"></div>
    <p class="season-source">时间统一为北京时间（UTC+8）；交节时刻为历算近似值，约至分钟。山水与物象为四季意象，日内刻度不代表实际日出日落。<a href="https://www.hko.gov.hk/en/gts/astron2026/files/HKO_almanac_2026.pdf" target="_blank" rel="noopener noreferrer">参阅天文台年历</a></p>`;
  if(window.SeasonalFX) SeasonalFX.attachScene($('#seasonPhenology'));
  const ticks = [];
  for(let i=0;i<120;i++) {
    const a=polar(i%5===0?217:224,i*3),b=polar(231,i*3);
    ticks.push('<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" class="'+(i%5===0?'major':'minor')+'"/>');
  }
  $('#seasonTicks').innerHTML=ticks.join('');
  // Winter solstice is north, spring equinox east, summer solstice south.
  $('#seasonLabels').innerHTML=NAMES.map((name,i)=>{
    const angle=(i*15+45)%360, p=polar(267,angle);
    return '<button type="button" class="season-term" data-term="'+name+'" style="left:'+p.x/6+'%;top:'+p.y/6+'%"><span>'+name+'</span></button>';
  }).join('');
  $('#seasonAlmanac').innerHTML=SEASONS.map((name,i)=>'<section class="season-quarter" style="--quarter:'+COLORS[i]+'"><h3><span>'+name+'</span>'+['万物生','万物长','万物收','万物藏'][i]+'</h3><div>'+NAMES.slice(i*6,i*6+6).map(n=>'<button type="button" data-term="'+n+'"><span>'+n+'</span><time></time></button>').join('')+'</div></section>').join('');

  function drawRing(year) {
    if (ringYear===year) return;
    ringYear=year;
    const terms=yearTerms(year);
    root.querySelectorAll('[data-term]').forEach(button=>{
      const t=terms.find(item=>item.name===button.dataset.term);
      button.setAttribute('aria-label',year+'年'+button.dataset.term+'，'+fmtTerm(t.at)+'，北京时间');
      const date=button.querySelector('time'); if(date) date.textContent=fmtDate(t.at);
    });
  }
  function render() {
    const p=parts(instant), {current,next}=neighbors(instant);
    const index=NAMES.indexOf(current.name), season=Math.floor(index/6), progress=(instant-current.at)/(next.at-current.at);
    if(active && window.SeasonalFX) SeasonalFX.setInstant(instant,current.name);
    const start=stamp(p.year,1,1), end=stamp(p.year+1,1,1), yearProgress=(instant-start)/(end-start);
    const days=Math.round((end-start)/DAY), dayIndex=Math.floor((instant-start)/DAY);
    drawRing(p.year);
    root.dataset.season=['spring','summer','autumn','winter'][season];
    root.style.setProperty('--season',COLORS[season]);
    const night=p.hour<6||p.hour>=18;
    root.classList.toggle('season-night',night);
    $('#seasonYear').textContent=p.year;
    $('#seasonPrevYear').disabled=p.year<=MIN_YEAR;
    $('#seasonNextYear').disabled=p.year>=MAX_YEAR;
    $('#seasonDateLabel').textContent=p.year+'年'+p.month+'月'+p.day+'日';
    $('#seasonDateLabel').dateTime=dateKey(p);
    if(document.activeElement!==$('#seasonDate')) $('#seasonDate').value=dateKey(p);
    $('#seasonMode').textContent=playing?'四时漫游':live?'此时此刻':'正在看这一天';
    $('#seasonWorldSeason').textContent=SEASONS[season];
    const key=current.name+current.at;
    if(key!==termKey) {
      termKey=key;
      $('#seasonName').textContent=current.name;
      $('#seasonSequence').textContent=SEASONS[season]+'季 · 第'+(index+1)+'个节气';
      $('#seasonPoem').textContent=POEMS[index];
      $('#seasonDefinition').textContent=window.JIEQI?.[current.name]?.[1]||'';
      root.querySelectorAll('[data-term]').forEach(button=>{
        const selected=button.dataset.term===current.name;
        button.classList.toggle('is-current',selected);
        button.setAttribute('aria-pressed',String(selected));
      });
    }
    $('#seasonStart').textContent=current.name+' '+fmtDate(current.at);
    $('#seasonEnd').textContent=next.name+' '+fmtDate(next.at);
    $('#seasonTermProgress').style.width=progress*100+'%';
    $('#seasonProgressText').textContent='本节气已过 '+(progress*100).toFixed(1)+'% · '+fmtTerm(current.at)+' 交节';
    $('#seasonNextName').textContent=next.name;
    const seconds=Math.max(0,Math.floor((next.at-instant)/1000));
    $('#seasonCountdown').textContent=Math.floor(seconds/86400)+'天 '+pad(Math.floor(seconds/3600)%24)+':'+pad(Math.floor(seconds/60)%60)+':'+pad(seconds%60);
    $('#seasonNextAt').textContent=parts(next.at).year+'年 '+fmtTerm(next.at)+' 交节';
    const isTodayTerm=dateKey(parts(next.at))===dateKey(p)||dateKey(parts(current.at))===dateKey(p);
    $('#seasonTodayTerm').hidden=!isTodayTerm;
    if(isTodayTerm) {
      const t=dateKey(parts(next.at))===dateKey(p)?next:current;
      $('#seasonTodayTerm').textContent='这一天交节 · '+t.name+' '+fmtTerm(t.at).split(' ')[1]+(instant<t.at?'，此刻尚未交节':'，已交节');
    }
    const longitudeAngle=(index*15+45+progress*15)%360;
    const pos=polar(231,longitudeAngle), needleIn=polar(202,longitudeAngle), needleOut=polar(239,longitudeAngle);
    $('#seasonMarker').setAttribute('cx',pos.x); $('#seasonMarker').setAttribute('cy',pos.y);
    $('#seasonNeedle').setAttribute('x1',needleIn.x); $('#seasonNeedle').setAttribute('y1',needleIn.y);
    $('#seasonNeedle').setAttribute('x2',needleOut.x); $('#seasonNeedle').setAttribute('y2',needleOut.y);
    // The outer arc expresses elapsed civil-year time; the light dot expresses solar longitude.
    $('#seasonYearArc').style.strokeDasharray=(yearProgress*1451.416)+' 1451.416';
    $('#seasonYearArc').style.opacity='.22';
    $('#seasonClock').textContent=pad(p.hour)+':'+pad(p.minute)+':'+pad(p.second);
    $('#seasonClock').dateTime=pad(p.hour)+':'+pad(p.minute)+':'+pad(p.second)+'+08:00';
    $('#seasonHourName').textContent='子丑寅卯辰巳午未申酉戌亥'[Math.floor((p.hour+1)/2)%12]+'时 · 北京时间';
    $('#seasonTime').value=p.hour*60+p.minute;
    $('#seasonTime').setAttribute('aria-valuetext',p.hour+'点'+p.minute+'分，北京时间');
    $('#seasonDay').max=days-1; $('#seasonDay').value=dayIndex;
    $('#seasonDay').setAttribute('aria-valuetext',p.year+'年'+p.month+'月'+p.day+'日');
    $('#seasonYearProgress').textContent='第 '+(dayIndex+1)+' / '+days+' 天 · 这一年已过 '+(yearProgress*100).toFixed(1)+'%';
    const dayFraction=(p.hour*3600+p.minute*60+p.second)/86400;
    $('#seasonOrb').setAttribute('cx',200+105*Math.sin((dayFraction-.25)*Math.PI*2));
    $('#seasonOrb').setAttribute('cy',124-38*Math.cos((dayFraction-.5)*Math.PI*2));
    syncButtons();
  }
  function syncButtons() {
    $('#seasonPlay').setAttribute('aria-pressed',String(playing));
    $('#seasonPlay').innerHTML=playing?'<span aria-hidden="true">Ⅱ</span> 暂停漫游':'<span aria-hidden="true">▷</span> 播放全年';
    $('#seasonMotion').setAttribute('aria-pressed',String(paused||reduced.matches));
    $('#seasonMotion').textContent=reduced.matches?'静态景物':paused?'播放景物':'暂停景物';
    $('#seasonMotion').disabled=reduced.matches;
    root.classList.toggle('season-still',paused||reduced.matches||!canRun());
  }
  function announce() {
    const p=parts(instant),t=neighbors(instant).current;
    $('#seasonTravelStatus').textContent=p.month+'月'+p.day+'日 · '+t.name;
  }
  function stop() {playing=false;syncButtons();}
  function travel(ms, tell=true) {
    stop(); live=false;
    instant=Math.min(stamp(MAX_YEAR+1,1,1)-1000,Math.max(stamp(MIN_YEAR,1,1),ms));
    render(); if(tell) announce();
  }
  function changeYear(delta) {
    const p=parts(instant), y=p.year+delta;
    if(y<MIN_YEAR||y>MAX_YEAR) return;
    const last=new Date(Date.UTC(y,p.month,0)).getUTCDate();
    travel(stamp(y,p.month,Math.min(p.day,last),p.hour,p.minute,p.second));
  }
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-term]'); if(!button) return;
    const t=yearTerms(parts(instant).year).find(t=>t.name===button.dataset.term);
    travel(t.at);
  });
  $('#seasonPrevYear').addEventListener('click',()=>changeYear(-1));
  $('#seasonNextYear').addEventListener('click',()=>changeYear(1));
  $('#seasonLive').addEventListener('click',()=>{stop(); live=true; instant=Date.now(); render(); announce();});
  $('#seasonDate').addEventListener('change',event=>{
    if(!event.target.value||!event.target.validity.valid) {render();return;}
    const [y,m,d]=event.target.value.split('-').map(Number),p=parts(instant);
    travel(stamp(y,m,d,p.hour,p.minute));
  });
  $('#seasonDay').addEventListener('input',event=>{
    const p=parts(instant);travel(stamp(p.year,1,1,p.hour,p.minute)+Number(event.target.value)*DAY,false);
  });
  $('#seasonDay').addEventListener('change',announce);
  $('#seasonTime').addEventListener('input',event=>{
    const p=parts(instant);travel(stamp(p.year,p.month,p.day)+Number(event.target.value)*60000,false);
  });
  $('#seasonTime').addEventListener('change',announce);
  $('#seasonPlay').addEventListener('click',()=>{
    if(playing) {stop();return;}
    live=false; const p=parts(instant);
    if(instant>=stamp(p.year+1,1,1)-DAY) instant=stamp(p.year,1,1,12);
    playing=true; lastFrame=0;
    $('#seasonTravelStatus').textContent='正在播放 '+parts(instant).year+' 年的四季';
    render(); syncRunning();
  });
  $('#seasonMotion').addEventListener('click',()=>{
    paused=!paused;
    if(window.SeasonalFX) SeasonalFX.setPaused(paused);
    syncButtons();
  });
  document.addEventListener('season:motion',event=>{paused=event.detail.paused;syncButtons();});
  $('#seasonReadDay').addEventListener('click',()=>{
    const p=parts(instant);
    document.dispatchEvent(new CustomEvent('season:date',{detail:{year:p.year,month:p.month,day:p.day}}));
  });
  $('#seasonLabels').addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    const buttons=[...$('#seasonLabels').querySelectorAll('button')], i=buttons.indexOf(event.target);
    if(i<0) return;
    event.preventDefault();
    const n=event.key==='Home'?0:event.key==='End'?23:(i+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)+24)%24;
    buttons[n].focus();buttons[n].click();
  });
  function canRun() {return active&&!document.hidden&&!document.documentElement.classList.contains('welcome-pending');}
  function tick(now) {
    frame=0;
    if(!canRun()) return;
    const changing=playing||live;
    if(playing&&lastFrame) {
      const p=parts(instant),yearEnd=stamp(p.year+1,1,1)-1000;
      instant+=Math.min(now-lastFrame,250)*DAY/100;
      if(instant>=yearEnd) {instant=yearEnd;stop();announce();}
    } else if(live) instant=Date.now();
    lastFrame=now;
    if(changing&&now-lastPaint>160) {render();lastPaint=now;}
    frame=requestAnimationFrame(tick);
  }
  function syncRunning() {
    if(!canRun()) {cancelAnimationFrame(frame);frame=0;lastFrame=0;stop();}
    else if(!frame) {lastFrame=0;frame=requestAnimationFrame(tick);}
    syncButtons();
  }
  document.addEventListener('visibilitychange',syncRunning);
  reduced.addEventListener('change',()=>{if(reduced.matches)stop();syncButtons();});
  new MutationObserver(syncRunning).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  window.SeasonClock={
    activate(value,date) {
      active=value;
      if(value&&date) {
        const key=date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate());
        if(key!==calendarKey&&key!==dateKey(parts(instant))) {
          live=key===dateKey(parts(Date.now()));
          instant=live?Date.now():stamp(date.getFullYear(),date.getMonth()+1,date.getDate(),12);
        }
        calendarKey=key;
        render();
      }
      syncRunning();
    },
    resetNow() {
      stop();live=true;instant=Date.now();calendarKey=dateKey(parts(instant));
      if(active)render();
    }
  };
  try {render();} catch(error) {
    root.innerHTML='<div class="season-unavailable"><h1>四时历算暂未就绪</h1><p>请刷新页面，重新加载节气历算数据。</p></div>';
    console.error(error);
    window.SeasonClock={activate(){}};
  }
})();
