/* ============================================================
   一页千秋 · v2 · 三个视图
   ------------------------------------------------------------
   日：纵向翻页   千年：横向展卷   四季：环形流转
   ============================================================ */
window.V2Views = (function () {
  "use strict";

  const { $, $$, pad, el, reduced, ms, anim, wait } = window.V2;
  const D = window.V2Data;

  const CN_MONTH = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const WEEK = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const WEEK_HEAD = ["一", "二", "三", "四", "五", "六", "日"];

  let S = null;
  let track, timeline, knob, daily, page, sheet;
  const eraCaptions = [];

  function init(state) {
    S = state;
    track = $("#scrollTrack");
    timeline = $("#timeline");
    knob = $("#timelineKnob");
    daily = $("#daily");
    page = $("#calPage");
    sheet = $("#calSheet");

    $('#calendarCollapse').addEventListener('click', () => {
      const collapsed = page.dataset.collapsed !== 'true';
      page.dataset.collapsed = String(collapsed);
      $('#calendarCollapse').setAttribute('aria-expanded', String(!collapsed));
      $('#calendarCollapse').textContent = collapsed ? '展开月历' : '收起月历';
    });
    buildGridShell();
    buildScroll();
    buildSeasons();
    renderMonth();
    renderDaily();
    bondMonthNav();
  }

  /* ============================================================
     日历
     ============================================================ */
  function buildGridShell() {
    const week = $("#calWeek");
    week.replaceChildren(...WEEK_HEAD.map((w, i) => {
      const s = el("span", { text: w });
      if (i >= 5) s.dataset.weekend = "1";
      return s;
    }));
  }

  function firstWeekday(y, m) {
    return (new Date(y, m - 1, 1).getDay() + 6) % 7; // 周一起
  }

  function renderMonth() {
    const y = S.vis.y, m = S.vis.m;
    $("#calMonth").textContent = CN_MONTH[m - 1];
    $("#calYear").textContent = String(y);
    const info = D.lunarInfo(y, m, 15);
    $("#calGanzhi").textContent = info ? info.ganzhi + "年 · " + info.zodiac : "";
    const branch = V2Assets.calendarBranch(m);
    const branchImg = $("#calendarBranch");
    if (branchImg && branch) {
      branchImg.src = branch.url;
      branchImg.alt = branch.title;
    }

    const grid = $("#calGrid");
    const first = firstWeekday(y, m);
    const origin = new Date(y, m - 1, 1 - first);
    const frag = document.createDocumentFragment();

    for (let i = 0; i < 42; i++) {
      const dt = new Date(origin.getFullYear(), origin.getMonth(), origin.getDate() + i);
      const cy = dt.getFullYear(), cm = dt.getMonth() + 1, cd = dt.getDate();
      const inMonth = cm === m;
      const lunar = D.lunarInfo(cy, cm, cd);
      const events = D.collect(cy, cm, cd);

      const btn = el("button", {
        class: "day",
        type: "button",
        dataset: { date: cy + "-" + pad(cm) + "-" + pad(cd) }
      });
      if (!inMonth) btn.dataset.out = "1";
      if (events.some(e => e.cal === "公历")) btn.dataset.solar = "1";
      if (events.some(e => e.cal === "农历")) btn.dataset.lunar = "1";
      if (lunar?.jq) btn.dataset.term = lunar.jq;
      btn.setAttribute("aria-pressed", String(cy === S.sel.y && cm === S.sel.m && cd === S.sel.d));
      if (cy === S.sel.y && cm === S.sel.m && cd === S.sel.d) btn.setAttribute("aria-selected", "true");

      const lunarText = lunar
        ? (lunar.day === "初一" ? lunar.month + "月" : lunar.day)
        : "";

      btn.append(
        el("span", { class: "d-num", text: String(cd) }),
        el("span", { class: "d-lunar", text: lunar?.jq || lunarText })
      );
      btn.setAttribute("aria-label",
        `${cm}月${cd}日${lunar ? "，农历" + lunar.text : ""}${events.length ? "，" + events.length + " 则记载" : "，无记载"}`);
      btn.addEventListener("click", () => pickDate(cy, cm, cd));
      frag.append(btn);
    }

    grid.replaceChildren(frag);
    markToday();
  }

  function markToday() {
    const now = new Date();
    $$(".day", $("#calGrid")).forEach(d => {
      const [y, m, dd] = d.dataset.date.split("-").map(Number);
      if (y === now.getFullYear() && m === now.getMonth() + 1 && dd === now.getDate()) d.dataset.today = "1";
    });
  }

  function bondMonthNav() {
    $("#calPrev").addEventListener("click", () => turnMonth(-1));
    $("#calNext").addEventListener("click", () => turnMonth(1));
  }

  /* 先提交月份，再播放可打断的翻纸；快速点击不排队。 */
  function turnMonth(dir) {
    const date = new Date(S.vis.y, S.vis.m - 1 + dir, 1);
    S.vis = { y: date.getFullYear(), m: date.getMonth()+1 };
    const previousSheet = sheet.cloneNode(true);
    renderMonth();
    animatePaper(dir, true, previousSheet);
  }

  function animatePaper(dir, fullPage = false, previousSheet) {
    const turn = $('#calendarTurn');
    [sheet, turn].filter(Boolean).forEach(n => n.getAnimations().forEach(a => a.cancel()));
    if (turn) { turn.hidden = true; turn.replaceChildren(); }
    if (reduced()) return;
    const duration = ms('--dur-page') * (fullPage ? 1 : .62);
    anim(sheet, [
      {transform:`perspective(1600px) rotateX(${dir*5}deg) translateY(${dir*12}px)`, opacity:.5},
      {transform:'none', opacity:1}
    ], {duration});
    if (turn) {
      const copy = previousSheet || sheet.cloneNode(true);
      [copy, ...copy.querySelectorAll('[id]')].forEach(n=>n.removeAttribute('id'));
      copy.querySelectorAll('button').forEach(n=>n.tabIndex=-1);
      turn.replaceChildren(copy);
      turn.hidden = false;
      const angle = dir > 0 ? -112 : 112;
      const paper = anim(turn, [
        {opacity:1,transform:'perspective(1500px) rotateX(0deg)',filter:'brightness(1)'},
        {opacity:1,offset:.5,transform:`perspective(1500px) rotateX(${angle*.55}deg)`,filter:'brightness(.86)'},
        {opacity:0,transform:`perspective(1500px) rotateX(${angle}deg)`,filter:'brightness(.76)'}
      ], {duration:ms('--dur-page'), easing:V2.token('--ease-standard')});
      paper.finished.then(() => { turn.hidden = true; turn.replaceChildren(); paper.cancel(); }).catch(() => {});
    }
  }

  function pickDate(y, m, d, silent) {
    const previous = new Date(S.sel.y, S.sel.m - 1, S.sel.d).getTime();
    const next = new Date(y, m - 1, d).getTime();
    S.sel = { y, m, d };
    if (S.vis.y !== y || S.vis.m !== m) {
      S.vis.y = y; S.vis.m = m;
      renderMonth();
    }
    $$(".day", $("#calGrid")).forEach(node => {
      if (node.dataset.date === y + "-" + pad(m) + "-" + pad(d)) node.setAttribute("aria-selected", "true");
      else node.removeAttribute("aria-selected");
      node.setAttribute("aria-pressed", String(node.hasAttribute("aria-selected")));
    });
    renderDaily(silent !== true);
    if (silent !== true && previous !== next) animatePaper(next > previous ? 1 : -1);
  }

  /* ── 当日展开 ── */
  function renderDaily(animateNum) {
    const { y, m, d } = S.sel;
    const lunar = D.lunarInfo(y, m, d);
    const allEvents = D.collect(y, m, d);
    const filter = $("#eraFilter");
    const chosen = filter.value;
    filter.replaceChildren(el("option", {value:"", text:"全部朝代"}), ...[...new Set(allEvents.map(e=>e.era))].map(name=>el("option",{value:name,text:name})));
    filter.value = [...filter.options].some(o=>o.value===chosen) ? chosen : "";
    const events = filter.value ? allEvents.filter(e=>e.era===filter.value) : allEvents;
    const dt = new Date(y, m - 1, d);

    $("#dailyDate").textContent = y + " 年 " + m + " 月 " + d + " 日";
    const num = $("#dailyNum");
    num.textContent = String(d);
    if (animateNum !== false && !reduced()) {
      num.removeAttribute("data-flip");
      void num.offsetWidth;
      num.setAttribute("data-flip", "1");
    }

    $("#dailyWeek").textContent = WEEK[dt.getDay()] + (y !== new Date().getFullYear() ? "" : "");
    $("#dailyLunar").textContent = lunar ? "农历 " + lunar.text : "";
    $("#dailyGanzhi").textContent = lunar ? lunar.ganzhi + "年 · " + lunar.zodiac : "";

    const chip = $("#dailyJq");
    if (lunar && lunar.jq) {
      chip.hidden = false;
      chip.textContent = lunar.jq;
      chip.dataset.jq = lunar.jq;
      document.documentElement.dataset.season =
        D.seasonOf(D.JQ_ORDER.indexOf(lunar.jq));
    } else {
      chip.hidden = true;
    }

    const count = $("#dailyCount");
    count.textContent = events.length ? events.length + " 则记载" : "史册留白";

    const list = $("#dailyList");
    if (!events.length) {
      list.replaceChildren(blankState(y, m, d));
      return;
    }

    const frag = document.createDocumentFragment();
    let group = "";
    events.forEach((ev, i) => {
      if (group !== ev.cal) { group = ev.cal; frag.append(el("h3", {class:"event-group", text:group === "公历" ? "公历史事" : group === "农历" ? "农历纪事" : "时令 · 节气"})); }
      const btn = el("button", { class: "ev", type: "button", dataset:{event:ev.id || ev.t}, id:"event-"+i });
      btn.append(
        el("span", { class: "ev-year", text: D.yearLabel(ev.y) }),
        el("span", {
          class: "ev-main"
        }, [
          el("span", { class: "ev-title", text: ev.t }),
          el("span", { class: "ev-desc", text: ev.d }),
          el("span", { class: "ev-src", text: [ev.era, ev.jz, ev.s].filter(Boolean).join(" · ") })
        ]),
        el("span", { class: "ev-go", text: "入画 →" })
      );
      btn.addEventListener("click", e => {
        window.V2Overlay.openReader(events, i, { origin: "calendar" }, e);
      });
      frag.append(btn);
    });
    list.replaceChildren(frag);
  }

  /* 空白日：不编内容，只把用户送到最近一段有记载的往事 */
  function blankState(y, m, d) {
    const wrap = el("div", { class: "blank" });
    wrap.append(V2Assets.slot(V2Assets.manifest.empty, true));
    wrap.append(
      el("div", { class: "blank-mark", html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 6h16M4 12h10M4 18h13"/></svg>' }),
      el("p", { class: "blank-title", text: "此日史册留白" }),
      el("p", { class: "blank-desc", text: "当前素材库尚未收录这一天的确切史事。不妨向前后翻一翻，听听岁月的回声。" })
    );

    const nav = el("div", { class: "blank-nav" });
    [[-1, "前一有史日"], [1, "后一有史日"]].forEach(([dir, label]) => {
      const target = D.nearest(y, m, d, dir, 370);
      if (!target) return;
      const ty = target.getFullYear(), tm = target.getMonth() + 1, td = target.getDate();
      const evs = D.collect(ty, tm, td);
      if (!evs.length) return;

      const btn = el("button", { class: "blank-btn", type: "button" });
      btn.append(
        el("span", { class: "dir", text: label }),
        el("span", { class: "what" }, [
          el("b", { text: evs[0].t }),
          el("span", { text: tm + " 月 " + td + " 日 · " + D.yearLabel(evs[0].y) + " " + evs[0].era })
        ]),
        el("span", { class: "arrow", text: dir < 0 ? "←" : "→" })
      );
      btn.addEventListener("click", () => {
        pickDate(ty, tm, td);
        if (S.vis.m !== tm || S.vis.y !== ty) { S.vis.y = ty; S.vis.m = tm; renderMonth(); }
        V2.toast("已翻到 " + tm + " 月 " + td + " 日");
      });
      nav.append(btn);
    });
    wrap.append(nav);
    return wrap;
  }

  /* ============================================================
     展卷
     ============================================================ */
  const TRANSITIONS = {
    xia:'transition-xia-cq.webp', cq:'transition-cq-qin.webp', qin:'transition-qin-han.webp',
    han:'transition-han-sj.webp', sj:'transition-sj-sui.webp', sui:'transition-sui-tang.webp',
    tang:'transition-tang-wudai.webp', wudai:'transition-wudai-song.webp', song:'transition-song-yuan.webp',
    yuan:'transition-yuan-ming.webp', ming:'transition-ming-qing.webp', qing:'transition-qing-minguo.webp',
    minguo:'transition-minguo-prc.webp'
  };

  function buildScroll() {
    const frag = document.createDocumentFragment();
    D.ERAS.forEach((era, eraIndex) => {
      const panel = el("article", { class: "era-panel", dataset: { key: era.k }, id: "era-" + era.k });
      const painting = D.PAINT[era.k] || D.PAINT.prc;

      const img = el("img", {
        class: "era-art",
        src: painting.file,
        alt: painting.title + "：" + era.name + "的意象画",
        width: 2400,
        height: 800,
        loading: era.k === D.ERAS[0].k ? "eager" : "lazy",
        decoding: "async"
      });

      const cap = el("div", { class: "era-caption" });
      cap.append(el("div", { class: "era-caption-head" }, [
        el("h2", { class: "era-name", text: era.name }),
        el("span", { class: "era-span", text: era.span })
      ]));
      cap.append(el("p", { class: "era-brief", text: era.brief }));
      cap.append(el("span",{class:"eyebrow",text:era.events.length+" 则大事 · 按年份记载"}));

      const list = el("div", { class: "era-events" });
      era.events.forEach((ev, i) => {
        const item = {
          y: ev[0], era: era.name, jz: ev[1], t: ev[2], d: ev[3], s: ev[4],
          cal: "长卷", eraKey: era.k
        };
        const row = el("button", { class: "era-ev", type: "button" }, [
          el("span", { class: "y", text: D.yearLabel(ev[0]) }),
          el("span", { class: "t", text: ev[2] })
        ]);
        row.addEventListener("click", e => {
          const all = era.events.map(x => ({
            y: x[0], era: era.name, jz: x[1], t: x[2], d: x[3], s: x[4],
            cal: "长卷", eraKey: era.k
          }));
          window.V2Overlay.openReader(all, i, { origin: "scroll", eraKey: era.k }, e);
        });
        list.append(row);
      });
      cap.append(list);


      img.onerror = () => {
        img.hidden = true;
        const fallback=V2Assets.slot({id:"ERA-"+era.k,title:era.name+" · "+D.PAINT[era.k].title,color:"#BBC9BA",missing:true});
        fallback.classList.add("era-fallback"); panel.prepend(fallback);
      };
      panel.append(img);
      if (TRANSITIONS[era.k]) panel.append(el('img', {
        class:'era-transition', src:'assets/scroll/' + TRANSITIONS[era.k], alt:'',
        loading:'lazy', decoding:'async', ariaHidden:'true'
      }));
      if (eraIndex === 0) panel.append(el('img', {class:'scroll-roller scroll-roller--left',src:'assets/scroll/roller-left.webp',alt:'',ariaHidden:'true'}));
      if (eraIndex === D.ERAS.length - 1) panel.append(el('img', {class:'scroll-roller scroll-roller--right',src:'assets/scroll/roller-right.webp',alt:'',ariaHidden:'true'}));
      eraCaptions.push(cap);
      panel.append(el('div', {class:'era-plaque'}, [
        el('strong', {text:era.name}), el('span', {text:era.span})
      ]));
      frag.append(panel);
    });
    track.replaceChildren(frag);

    buildTimeline();
    let raf = 0;
    track.addEventListener("scroll", () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; syncScroll(); });
    }, { passive: true });
    // 鼠标拖曳仅发生在画面；按钮和阅读区域保留点击/纵向滚动。
    let drag = null, moved = false;
    track.addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse" || e.button !== 0 || e.target.closest("button,.era-caption")) return;
      drag = { x:e.clientX, left:track.scrollLeft }; moved=false;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", e=>{
      if(!drag) return;
      if(Math.abs(e.clientX-drag.x)>5) moved=true;
      if(moved) { track.style.scrollSnapType="none"; track.scrollLeft=drag.left+drag.x-e.clientX; }
    });
    const stop=()=>{ if(!drag)return; drag=null; track.style.scrollSnapType=""; };
    track.addEventListener("pointerup",stop); track.addEventListener("pointercancel",stop);
    syncScroll();
  }

  function buildTimeline() {
    const line = el("div", { class: "timeline-line" });
    timeline.replaceChildren(line);
    D.ERAS.forEach((era, i) => {
      const tick = el("button", { class: "tick", type: "button", dataset: { i: String(i) } });
      tick.style.left = (i / (D.ERAS.length - 1) * 100) + "%";
      tick.append(el("span", { class: "tick-label", text: era.name }));
      tick.setAttribute("aria-label", "展卷至 " + era.name + " " + era.span);
      tick.addEventListener("click", () => scrollToEra(i));
      timeline.append(tick);
    });
    knob = el("div", { class: "timeline-knob", id: "timelineKnob" });
    timeline.append(knob);
  }

  function currentEraIndex() {
    if (!track || !track.clientWidth) return 0;
    return Math.min(D.ERAS.length - 1, Math.max(0, Math.round(track.scrollLeft / track.clientWidth)));
  }

  let eraToken = "";
  function applyEra(key) {
    if (!key || key === eraToken) return;
    eraToken = key;
    const root = document.documentElement;
    root.style.setProperty("--era", D.eraRaw(key));
    root.style.setProperty("--era-ink", D.eraInk(key));
    root.style.setProperty("--era-wash", hexWash(D.eraRaw(key), .12));
    root.dataset.era = key;
  }

  function hexWash(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function syncScroll() {
    if (!track || !track.clientWidth) return;
    const idx = currentEraIndex();
    const era = D.ERAS[idx];
    if (!era) return;
    if (S.eraIndex !== idx) {
      S.eraIndex = idx;
      applyEra(era.k);
    }
    const details = $('#eraDetails');
    if (details.dataset.era !== era.k) {
      details.replaceChildren(eraCaptions[idx]);
      details.dataset.era = era.k;
    }
    $("#eraPosition").textContent = era.name + " · " + (idx+1) + " / " + D.ERAS.length;
    $("#eraPrev").disabled = idx === 0; $("#eraNext").disabled = idx === D.ERAS.length-1;
    const pct = idx / (D.ERAS.length - 1) * 100;
    if (knob) knob.style.left = pct + "%";
    $$(".tick", timeline).forEach((t, i) => {
      if (i === idx) t.dataset.on = "1"; else delete t.dataset.on;
    });

    /* 视差：整条长卷只朝一个方向移动，强化「一卷到底」 */
    const vw = track.clientWidth;
    const center = track.scrollLeft + vw / 2;
    $$(".era-panel", track).forEach(panel => {
      const pc = panel.offsetLeft + panel.offsetWidth / 2;
      const delta = (pc - center) / vw;
      if (Math.abs(delta) > 1.4) return;
      const img = panel.querySelector(".era-art");
      if (img && !reduced()) img.style.transform = "translate3d(" + (delta * -38).toFixed(2) + "px,0,0)";
    });
  }

  let scrollJumpToken = 0;
  async function scrollToEra(i, instant) {
    if (!track) return;
    i = Math.min(D.ERAS.length - 1, Math.max(0, i));
    const distance = Math.abs(i - currentEraIndex());
    S.eraIndex = i;
    if (!instant && !reduced() && distance > 2) {
      const token = ++scrollJumpToken;
      await wait([anim(track,[{opacity:1},{opacity:.18}],{duration:ms('--dur-focus'),fill:'forwards'})]);
      if (token !== scrollJumpToken) return;
      track.scrollTo({left:i * track.clientWidth,behavior:'auto'});
      syncScroll();
      await wait([anim(track,[{opacity:.18},{opacity:1}],{duration:ms('--dur-arrive'),fill:'forwards'})]);
      return;
    }
    scrollJumpToken++;
    track.scrollTo({
      left: i * track.clientWidth,
      behavior: instant || reduced() ? "auto" : "smooth"
    });
  }

  /* ============================================================
     四时
     ============================================================ */
  function buildSeasons() {
    const ring = $("#ring");
    const frag = document.createDocumentFragment();
    D.JQ_ORDER.forEach((name, i) => {
      const node = el("div", { class: "node", dataset: { i: String(i) } });
      node.style.setProperty("--i", String(i));
      const btn = el("button", { type: "button", dataset: {term:name} }, [
        el('img', {src:V2Assets.termFor(i).url, alt:'', loading:'lazy', ariaHidden:'true'}),
        el('span', {text:name})
      ]);
      btn.setAttribute("aria-label", name);
      btn.addEventListener('click', () => {
        if (i === S.jqIndex) openTermDate();
        else setSeason(i);
      });
      node.append(btn);
      frag.append(node);
    });
    ring.replaceChildren(frag);

    $$(".season-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const key = tab.dataset.season;
        const start = D.SEASON_KEYS.indexOf(key) * 6;
        setSeason(start);
      });
    });

    $('#jqOpenDate').addEventListener('click', openTermDate);
    $("#jqPrev").addEventListener("click", () => setSeason((S.jqIndex + 23) % 24));
    $("#jqNext").addEventListener("click", () => setSeason((S.jqIndex + 1) % 24));
  }

  /* 半径必须用 px：translateY 的百分比取自元素自身高度（0），
     用百分比会让 24 个节点全部叠在圆心。 */
  function sizeRing() {
    const wrap = $(".ring-wrap");
    const ring = $("#ring");
    if (!wrap || !ring) return;
    const w = wrap.clientWidth;
    if (!w) return;
    ring.style.setProperty("--R", Math.round(w / 2 - 38) + "px");
    requestAnimationFrame(()=>{
      const selected=ring.querySelector('.node[data-on]');
      if(selected) ring.scrollTo({left:selected.offsetLeft-ring.clientWidth/2+selected.offsetWidth/2,behavior:"auto"});
    });
  }

  function openTermDate() {
    const when = D.termDate(D.JQ_ORDER[S.jqIndex], S.sel.y);
    if (!when) return;
    const [y, m, d] = when.slice(0, 10).split('-').map(Number);
    $('#eraFilter').value = '';
    pickDate(y, m, d);
    switchView('calendar');
    $('#daily').scrollIntoView({behavior:reduced() ? 'auto' : 'smooth', block:'start'});
  }

  let seasonToken = -1, seasonYear = null, seasonPaintToken = 0;
  function paintSeason(index, seasonKey) {
    const scene = $("#seasonScene"), token = ++seasonPaintToken;
    const termAsset = V2Assets.termFor(index), branchAsset = V2Assets.branchFor(seasonKey);
    const image = new Image();
    image.className = 'season-image'; image.alt = termAsset.title; image.decoding = 'async'; image.src = termAsset.url;
    const ready = image.decode ? image.decode() : new Promise((resolve, reject)=>{image.onload=resolve;image.onerror=reject;});
    ready.then(()=>{
      if(token!==seasonPaintToken)return;
      const old = $$('.season-image,.season-branch,.asset-placeholder',scene);
      const branch = el('img', {class:'season-branch',src:branchAsset.url,alt:'',ariaHidden:'true'});
      scene.append(image,branch);
      requestAnimationFrame(()=>{image.dataset.ready='1';branch.dataset.ready='1';});
      setTimeout(()=>old.forEach(n=>n.remove()),reduced()?0:520);
    }).catch(()=>{
      if(token!==seasonPaintToken)return;
      scene.replaceChildren(V2Assets.slot({...termAsset,missing:true,url:''}));
    });
  }

  function setSeason(i) {
    i = ((i % 24) + 24) % 24;
    if (i === seasonToken && seasonYear === S.sel.y) return;
    seasonToken = i;
    seasonYear = S.sel.y;
    S.jqIndex = i;

    const name = D.JQ_ORDER[i];
    const seasonKey = D.seasonOf(i);
    const meta = window.JIEQI[name] || ["", "", ""];

    document.documentElement.dataset.season = seasonKey;
    const ring = $("#ring");
    ring.style.setProperty("--rot", (-i * 15) + "deg");

    $$(".node", ring).forEach((n, k) => {
      if (k === i) n.dataset.on = "1"; else delete n.dataset.on;
      n.querySelector("button").setAttribute("aria-pressed", String(k === i));
    });

    paintSeason(i, seasonKey);
    $("#seasonScene").dataset.season = seasonKey;
    $("#seasonTitle").textContent = name;
    const when = D.termDate(name, S.sel.y);
    $('#jqOpenDate').disabled = !when;
    $('#jqOpenDate').textContent = when ? `翻到 ${Number(when.slice(5,7))} 月 ${Number(when.slice(8,10))} 日 →` : '交节日期暂不可用';
    $("#jqDate").textContent = when ? when.slice(0,16).replace("-"," 年 ").replace("-"," 月 ").replace(/(\d{2}) (\d{2}:)/,"$1 日 $2") + " · 交节（北京时间）" : "交节时刻暂不可用";
    window.dispatchEvent(new CustomEvent("qianqiu:term",{detail:name}));
    {
      const selected = ring.querySelector('.node[data-on]');
      if(selected) ring.scrollTo({left:selected.offsetLeft-ring.clientWidth/2+selected.offsetWidth/2,behavior:reduced()?"auto":"smooth"});
    }
    $("#jqName").textContent = name;
    $("#jqPos").textContent = meta[0] || "";
    $("#jqMeaning").textContent = meta[1] || "";
    $("#jqSource").textContent = meta[2] || "";
    $("#jqMotif").textContent = D.jqMotif(name);

    $$(".season-tab").forEach(t => {
      t.setAttribute("aria-selected", t.dataset.season === seasonKey ? "true" : "false");
    });
  }

  /* ============================================================
     视图切换
     ============================================================ */
  function switchView(name) {
    if (S.view === name) {
      const stage = $("#stage");
      if (stage) {
        stage.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
      }
      return;
    }
    S.view = name;
    const titles = {calendar:["壹 · 以日为单位","日历里的山河"],scroll:["贰 · 以千年为尺度","朝代长卷"],seasons:["叁 · 以四季为循环","四时流转"]};
    $("#viewKicker").textContent = titles[name][0]; $("#viewTitle").textContent = titles[name][1];
    $("#todayButton").hidden = name !== "calendar";
    document.body.dataset.stage = name;
    $$(".view").forEach(v => {
      if (v.dataset.view === name) v.dataset.active = "";
      else delete v.dataset.active;
    });
    $$(".scale-btn").forEach(b => b.setAttribute("aria-current", b.dataset.go === name ? "true" : "false"));

    if (name === "calendar") {
      eraToken = "";
      applyEra("prc");
    }
    if (name === "scroll") {
      requestAnimationFrame(() => {
        /* 进入长卷时强制着色一次：初次进入 S.eraIndex 与当前位置相同，
           若依赖差异判断，强调色会停在 CSS 初值上 */
        const idx = currentEraIndex();
        const era = D.ERAS[idx];
        if (era) {
          eraToken = "";
          applyEra(era.k);
          S.eraIndex = idx;
        }
        syncScroll();
      });
    }
    if (name === "seasons") { sizeRing(); setSeason(S.jqIndex); }

    const stage = $("#stage");
    if (stage) stage.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }

  /* 明暗切换后，可读墨色要整体重算一次 */
  function refreshEraColors() {
    const k = eraToken || "prc";
    eraToken = "";
    applyEra(k);
  }

  return {
    init, renderMonth, renderDaily, pickDate, turnMonth,
    switchView, scrollToEra, setSeason, syncScroll, sizeRing,
    currentEraIndex, applyEra, refreshEraColors, blankState
  };
})();
