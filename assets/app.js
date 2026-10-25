/* ============================================================
   一页千秋 · 交互逻辑
   ============================================================ */
(function () {
  "use strict";

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const pad = n => (n < 10 ? "0" + n : "" + n);

  /* ── 朝代细表（用于「千年回望」与筛选归组） ── */
  const DYNASTY = [
    [-3000, -2071, "上古"], [-2070, -1601, "夏"], [-1600, -1047, "商"],
    [-1046, -772, "西周"], [-771, -477, "春秋"], [-476, -222, "战国"],
    [-221, -207, "秦"], [-206, 8, "西汉"], [9, 24, "新"], [25, 219, "东汉"],
    [220, 264, "三国"], [265, 315, "西晋"], [316, 419, "东晋"], [420, 580, "南北朝"],
    [581, 617, "隋"], [618, 906, "唐"], [907, 959, "五代"], [960, 1126, "北宋"],
    [1127, 1270, "南宋"], [1271, 1367, "元"], [1368, 1643, "明"], [1644, 1911, "清"],
    [1912, 1948, "民国"], [1949, 2200, "共和国"]
  ];

  const ERA_GROUP = {
    "上古": "先秦", "夏": "先秦", "商": "先秦", "西周": "先秦", "东周": "先秦", "春秋": "先秦", "战国": "先秦",
    "秦": "秦汉", "汉": "秦汉", "西汉": "秦汉", "东汉": "秦汉", "新": "秦汉",
    "三国": "魏晋", "晋": "魏晋", "西晋": "魏晋", "东晋": "魏晋", "南北朝": "魏晋", "魏": "魏晋", "蜀": "魏晋", "吴": "魏晋",
    "隋": "隋唐", "唐": "隋唐", "五代": "隋唐", "五代十国": "隋唐",
    "宋": "宋元", "北宋": "宋元", "南宋": "宋元", "辽": "宋元", "金": "宋元", "元": "宋元",
    "明": "明清", "清": "明清", "民国": "近现代", "共和国": "近现代", "节令": "节令"
  };

  const GROUPS = ["全部", "先秦", "秦汉", "魏晋", "隋唐", "宋元", "明清", "近现代"];
  const WEEK = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const GAN = "甲乙丙丁戊己庚辛壬癸";
  const ZHI = "子丑寅卯辰巳午未申酉戌亥";

  function dynastyOf(y) {
    for (let i = 0; i < DYNASTY.length; i++) {
      const d = DYNASTY[i];
      if (y >= d[0] && y <= d[1]) return d[2];
    }
    return "上古";
  }
  function ganzhi(y) {
    const n = ((y - 4) % 60 + 60) % 60;
    return GAN[n % 10] + ZHI[n % 12];
  }
  function yearLabel(y) {
    return y < 0 ? "前" + Math.abs(y) : String(y);
  }

  /* ── 农历工具 ── */
  function lunarOf(y, m, d) {
    try {
      const s = window.Solar.fromYmd(y, m, d);
      return s.getLunar();
    } catch (e) { return null; }
  }
  function lunarKey(l) {
    return pad(l.getMonth()) + "-" + pad(l.getDay());
  }
  function lunarText(l) {
    const m = l.getMonthInChinese();
    const d = l.getDayInChinese();
    return d === "初一" ? m + "月" : d;
  }

  /* ── 状态 ── */
  const today = new Date();
  const S = {
    vy: today.getFullYear(),
    vm: today.getMonth() + 1,
    sel: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    filter: "全部",
    view: "cal",
    eraOpen: null
  };

  const THEME_KEY = "yq-theme";
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#14120F" : "#F4EFE6");
  }
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) applyTheme(saved);
  } catch (e) {}

  /* ── Toast ── */
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("on"), 2200);
  }

  /* ── 当日事件 ── */
  function isLunarEve(date) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const lunar = lunarOf(next.getFullYear(), next.getMonth() + 1, next.getDate());
    return lunar && lunar.getMonth() === 1 && lunar.getDay() === 1;
  }

  function collect(date) {
    const m = date.getMonth() + 1, d = date.getDate();
    const k = pad(m) + "-" + pad(d);
    const out = [];

    (window.DAY[k] || []).forEach(e => out.push({
      id: e[6], y: e[0], era: e[1], jz: e[2], t: e[3], d: e[4], s: e[5], cal: "公历"
    }));

    const l = lunarOf(date.getFullYear(), m, d);
    if (l) {
      // 节气
      const jq = l.getJieQi();
      if (jq && window.JIEQI && window.JIEQI[jq]) {
        const q = window.JIEQI[jq];
        out.push({ y: 0, era: "节气", jz: q[0], t: jq, d: q[1], s: q[2], cal: "节气" });
      }
      const lk = lunarKey(l);
      (window.LUNAR[lk] || []).forEach(e => out.push({
        id: e[6], y: e[0], era: e[1], jz: e[2], t: e[3], d: e[4], s: e[5], cal: "农历"
      }));
      // 除夕：腊月最后一天
      if (isLunarEve(date)) {
        (window.LUNAR["12-00"] || []).forEach(e => out.push({
          id: e[6], y: e[0], era: e[1], jz: e[2], t: e[3], d: e[4], s: e[5], cal: "农历"
        }));
      }
    }
    return out;
  }

  function markCount(date) {
    // 与当日面板共用纪事规则，包含所选年份的农历换算和除夕。
    const events = collect(date);
    return {
      solar: events.filter(e => e.cal === "公历").length,
      lunar: events.filter(e => e.cal === "农历").length
    };
  }

  /* ── 月历 ── */
  function startWeekday(y, m) {
    return (new Date(y, m - 1, 1).getDay() + 6) % 7; // 周一起
  }

  function renderCalendar() {
    $("#calYear").textContent = S.vy;
    $("#calMonth").textContent = S.vm;

    const first = startWeekday(S.vy, S.vm);
    const cells = 42;
    const origin = new Date(S.vy, S.vm - 1, 1 - first);
    const grid = $("#grid");
    const frag = document.createDocumentFragment();

    for (let i = 0; i < cells; i++) {
      const dt = new Date(origin.getFullYear(), origin.getMonth(), origin.getDate() + i);
      const y = dt.getFullYear(), mo = dt.getMonth() + 1, da = dt.getDate();
      const l = lunarOf(y, mo, da);

      const b = document.createElement("button");
      b.type = "button";
      b.className = "day";
      b.dataset.y = y; b.dataset.m = mo; b.dataset.d = da;
      const selected = y === S.sel.getFullYear() && mo === S.sel.getMonth() + 1 && da === S.sel.getDate();
      b.tabIndex = selected ? 0 : -1;
      b.setAttribute("aria-pressed", String(selected));
      if (b.classList.contains("today")) b.setAttribute("aria-current", "date");

      if (mo !== S.vm) b.classList.add("out");
      if (y === today.getFullYear() && mo === today.getMonth() + 1 && da === today.getDate()) b.classList.add("today");
      if (y === S.sel.getFullYear() && mo === S.sel.getMonth() + 1 && da === S.sel.getDate()) b.classList.add("sel");

      const num = document.createElement("span");
      num.className = "num";
      num.textContent = da;
      b.appendChild(num);

      const lz = document.createElement("span");
      lz.className = "lz";
      if (l) {
        const jq = l.getJieQi();
        if (jq) { lz.textContent = jq; lz.classList.add("jq"); }
        else lz.textContent = lunarText(l);
      }
      b.appendChild(lz);

      const mk = mo === S.vm ? markCount(dt) : { solar: 0, lunar: 0 };
      const box = document.createElement("span");
      box.className = "mark";
      if (mk.solar) { const i = document.createElement("i"); i.className = "d1"; box.appendChild(i); }
      if (mk.lunar) { const i = document.createElement("i"); i.className = "d2"; box.appendChild(i); }
      b.appendChild(box);

      b.setAttribute("aria-label",
        `${y}年${mo}月${da}日${l ? "，农历" + l.getMonthInChinese() + "月" + l.getDayInChinese() : ""}` +
        (mk.solar ? `，${mk.solar}则公历纪事` : "") + (mk.lunar ? `，${mk.lunar}则农历纪事` : ""));

      frag.appendChild(b);
    }
    grid.innerHTML = "";
    grid.appendChild(frag);
  }

  /* ── 千年回望 ── */
  function renderLookback(date) {
    const m = date.getMonth() + 1, d = date.getDate();
    const cur = date.getFullYear();
    const offsets = [100, 300, 500, 800, 1000];
    const items = offsets.map(off => {
      const y = cur - off;
      let l = lunarOf(y, m, d);
      if (!l) l = lunarOf(y, m, Math.min(d, 28));
      return {
        y: y,
        dz: dynastyOf(y),
        gz: ganzhi(y),
        lunar: l ? l.getMonthInChinese() + "月" + l.getDayInChinese() : ""
      };
    });

    const wrap = document.createElement("div");
    wrap.className = "lookback";
    wrap.innerHTML = '<div class="lb-title">同一天的千年回望 · 这条日期落在五个朝代里</div>';
    const row = document.createElement("div");
    row.className = "lb-row";

    items.forEach(it => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "lb-item";
      cell.innerHTML =
        '<span class="lb-y">' + yearLabel(it.y) + '</span>' +
        '<span class="lb-d">' + it.dz + '</span>' +
        '<span class="lb-l">' + it.gz + '年 · ' + it.lunar + '</span>';
      cell.title = "去「" + it.dz + "」看看";
      cell.addEventListener("click", () => travelToEra(it, cell));
      row.appendChild(cell);
    });
    wrap.appendChild(row);
    return wrap;
  }

  /* ── 事件卡片 ── */
  const PARTICLE = {
    xia: "square", cq: "streak", qin: "square", han: "petal", sj: "dot",
    sui: "dot", tang: "petal", wudai: "square", song: "dot", yuan: "streak",
    ming: "dot", qing: "petal", minguo: "dot", prc: "dot", jieqi: "dot"
  };

  function evCard(e, idx, sequence) {
    const art = document.createElement("article");
    art.className = "ev";
    art.style.animationDelay = (idx * 42) + "ms";
    art.tabIndex = 0;
    art.setAttribute("role", "button");
    art.setAttribute("aria-label", e.t + "，展开画卷");
    const yl = e.y === 0 ? (e.era === "节气" ? "节气" : "节令") : yearLabel(e.y);
    const sub = e.jz && e.jz !== "—" ? e.jz : "";
    art.innerHTML =
      '<div class="ev-year">' + yl + (sub ? '<small>' + sub + '</small>' : '') + '</div>' +
      '<div class="ev-body">' +
        '<h3>' + e.t + '</h3>' +
        '<p>' + e.d + '</p>' +
        '<div class="ev-tags">' +
          '<span class="tag">' + e.era + '</span>' +
          '<span class="tag src">' + e.s + '</span>' +
        '</div>' +
        '<span class="ev-open" aria-hidden="true">展开画卷 <span>↗</span></span>' +
      '</div>';
    art.addEventListener("click", ev => openDetail(e, ev, sequence));
    art.addEventListener("keydown", ev => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openDetail(e, ev, sequence); }
    });
    return art;
  }

  /* ── 展卷：史事详情 ── */
  let lastFocus = null;
  let activeModal = null;
  let detailTimer = null;
  let detailItems = [];
  let detailIndex = -1;
  let detailScrollY = 0;
  const background = () => $$(".topbar, main.layout, .site-foot");
  function activateModal(modal, focus, origin) {
    lastFocus = origin || document.activeElement;
    activeModal = modal;
    modal.hidden = false;
    background().forEach(el => { el.inert = true; });
    document.body.classList.add("locked");
    focus.focus({ preventScroll: true });
  }
  function releaseModal(modal) {
    if (activeModal !== modal) return;
    activeModal = null;
    background().forEach(el => { el.inert = false; });
    document.body.classList.remove("locked");
    if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  }

  function sameEvent(a, b) {
    return a && b && (a.id && b.id ? a.id === b.id : a.y === b.y && a.t === b.t && a.era === b.era);
  }

  function syncDetailNav() {
    const prev = $("#dPrev"), next = $("#dNext");
    const hasSequence = detailItems.length > 1;
    prev.hidden = !hasSequence;
    next.hidden = !hasSequence;
    prev.disabled = detailIndex <= 0;
    next.disabled = detailIndex < 0 || detailIndex >= detailItems.length - 1;
    prev.title = !prev.disabled ? "前一事：" + detailItems[detailIndex - 1].t : "已是第一事";
    next.title = !next.disabled ? "后一事：" + detailItems[detailIndex + 1].t : "已是最后一事";
  }

  function openDetail(e, ev, sequence) {
    const key = window.ART ? window.ART.keyOf(e.era) : "prc";
    Atmos.set(key);
    const origin = ev && ev.currentTarget && ev.currentTarget.focus ? ev.currentTarget : document.activeElement;
    const d = $("#detail");
    const alreadyOpen = !d.hidden;
    if (sequence && sequence.length) detailItems = sequence.slice();
    else if (!alreadyOpen) detailItems = [e];
    detailIndex = detailItems.findIndex(item => sameEvent(item, e));
    if (detailIndex < 0) { detailItems = [e]; detailIndex = 0; }

    const point = ev && Number.isFinite(ev.clientX) && Number.isFinite(ev.clientY)
      ? { x: ev.clientX, y: ev.clientY }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    d.style.setProperty("--ink-x", point.x + "px");
    d.style.setProperty("--ink-y", point.y + "px");

    const show = () => {
      const ring = window.ART ? window.ART.scene(key) : "";

      if (window.Gallery) Gallery.mount($("#dScene"), key, e.t, e.y, e.id);
      else $("#dScene").innerHTML = ring;
      $("#dMark").textContent = e.y === 0 ? "节令" : yearLabel(e.y);
      $("#dEraTag").textContent = e.jz && e.jz !== "—" ? e.era + " · " + e.jz : e.era;

      $("#dYear").textContent = e.y === 0
        ? (e.era === "节气" ? "二十四节气" : "传统节令")
        : yearLabel(e.y) + " 年" + (e.jz && e.jz !== "—" ? " · " + e.jz : "");

      $("#dTitle").textContent = e.t;
      $("#dDesc").textContent = e.d;
      $("#dSrc").textContent = e.s;

      const go = $("#dEraGo");
      const eraKey = eraKeyOf(e.era);
      if (eraKey && window.ERAS.some(era => era.k === eraKey)) {
        go.hidden = false;
        go.textContent = "沿「" + e.era + "」往回走 →";
        go.onclick = () => { closeDetail(false); jumpToEra(e.era); };
      } else {
        go.hidden = true;
      }
      syncDetailNav();

      clearTimeout(detailTimer);
      if (!alreadyOpen) {
        detailScrollY = window.scrollY;
        activateModal(d, $("#dClose"), origin);
        requestAnimationFrame(() => { if (!d.hidden) d.classList.add("on"); });
      } else {
        const card = $(".d-card", d);
        card.classList.remove("story-shift");
        void card.offsetWidth;
        card.classList.add("story-shift");
        $(".d-body", d).scrollTop = 0;
      }
    };

    show();
  }

  function closeDetail(restorePosition) {
    const d = $("#detail");
    if (d.hidden) return;
    d.classList.remove("on");
    releaseModal(d);
    if (restorePosition !== false) window.scrollTo({ top: detailScrollY, behavior: "instant" });
    detailTimer = setTimeout(() => { d.hidden = true; }, 250);
  }

  function eraKeyOf(name) {
    return window.ART ? window.ART.resolve(name) : null;
  }

  function nearestRecordedDate(date) {
    for (let distance = 1; distance <= 366; distance++) {
      // 先向后寻，让“向前寻一段往事”与日历翻页方向一致。
      for (const direction of [1, -1]) {
        const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + distance * direction);
        if (collect(candidate).length) return candidate;
      }
    }
    return null;
  }

  function renderPanel() {
    const date = S.sel;
    const m = date.getMonth() + 1, d = date.getDate();
    const l = lunarOf(date.getFullYear(), m, d);

    $("#phMd").textContent = m + "月" + d + "日";
    let wk = WEEK[date.getDay()];
    // 与当前年不同时，补注年份
    if (date.getFullYear() !== today.getFullYear()) wk = date.getFullYear() + "年 · " + wk;
    $("#phWk").textContent = wk;

    const jq = l ? l.getJieQi() : "";
    $("#phLunar").textContent = l
      ? (ganzhi(date.getFullYear()) + "年 " + l.getMonthInChinese() + "月" + l.getDayInChinese()) + (jq ? " · " + jq : "")
      : "";

    const all = collect(date);
    const nSolar = all.filter(x => x.cal === "公历").length;
    const nLunar = all.filter(x => x.cal === "农历").length;

    const tl = $("#timeline");
    tl.innerHTML = "";
    tl.scrollTop = 0;
    renderMonthIndex(date);

    // 当日内容在前，千年回望作为阅读区底部的延伸入口。
    const lookback = renderLookback(date);

    // 筛选
    const chips = $("#filters");
    chips.innerHTML = "";
    const pool = all.filter(e => S.filter === "全部" || ERA_GROUP[e.era] === S.filter || e.era === S.filter);
    const counts = {};
    all.forEach(e => { const g = ERA_GROUP[e.era] || "其他"; counts[g] = (counts[g] || 0) + 1; });

    GROUPS.forEach(g => {
      if (g !== "全部" && !counts[g]) return;
      const c = document.createElement("button");
      c.type = "button";
      c.className = "chip" + (S.filter === g ? " on" : "");
      c.innerHTML = g + '<span class="n">' + (g === "全部" ? all.length : counts[g]) + '</span>';
      c.setAttribute("aria-pressed", S.filter === g ? "true" : "false");
      c.addEventListener("click", () => { S.filter = g; renderPanel(); });
      chips.appendChild(c);
    });

    if (!all.length) {
      const box = document.createElement("div");
      box.className = "empty";
      box.innerHTML =
        '<div class="e-mark">无 记</div>' +
        '<p class="e-quote">古史纪事，多详其年而略其日。<br>此处空白，非无史，乃无确切之日。</p>' +
        '<p class="e-sub">不过这一天仍然落在上面那五个朝代里——日期一直在走。</p>';
      const nearest = nearestRecordedDate(date);
      if (nearest) {
        const seek = document.createElement("button");
        seek.className = "empty-seek";
        seek.type = "button";
        seek.innerHTML = '<span>向前寻一段往事</span><b>' + (nearest.getMonth() + 1) + '月' + nearest.getDate() + '日 →</b>';
        seek.addEventListener("click", () => selectDate(nearest.getFullYear(), nearest.getMonth() + 1, nearest.getDate(), { pulse: true }));
        box.appendChild(seek);
      }
      const alt = document.createElement("div");
      alt.className = "alt-days";
      const found = [];
      for (let d2 = 1; d2 <= 31; d2++) {
        const t2 = new Date(S.vy, S.vm - 1, d2);
        if (t2.getMonth() !== S.vm - 1) break;
        if (collect(t2).length) found.push(d2);
      }
      if (found.length) {
        const label = document.createElement("div");
        label.className = "alt-title";
        label.textContent = "本月这些日子有记载";
        box.appendChild(label);
        const row = document.createElement("div");
        row.className = "alt-row";
        found.slice(0, 8).forEach(d2 => {
          const c = document.createElement("button");
          c.type = "button";
          c.className = "alt-chip";
          c.textContent = S.vm + "/" + d2;
          c.addEventListener("click", () => selectDate(S.vy, S.vm, d2, { pulse: true }));
          row.appendChild(c);
        });
        alt.appendChild(row);
        box.appendChild(alt);
      }
      const btn = document.createElement("button");
      btn.className = "linkbtn";
      btn.type = "button";
      btn.textContent = "沿朝代长卷往回走 →";
      btn.addEventListener("click", () => setView("scroll"));
      box.appendChild(btn);
      tl.appendChild(box);
      tl.appendChild(lookback);
      return;
    }

    if (!pool.length) {
      const box = document.createElement("div");
      box.className = "empty";
      box.innerHTML = '<div class="e-mark">无 记</div><p>这一天没有「' + S.filter + '」时期的记载，换个筛选试试。</p>';
      tl.appendChild(box);
      tl.appendChild(lookback);
      return;
    }

    ["节气", "公历", "农历"].forEach(cal => {
      const list = pool.filter(e => e.cal === cal).sort((a, b) => a.y - b.y);
      if (!list.length) return;
      const lab = document.createElement("div");
      lab.className = "group-label";
      lab.textContent = cal === "公历"
        ? "公历纪事 · " + list.length + " 则"
        : cal === "农历"
          ? "农历纪事 · " + list.length + " 则"
          : "今日节气";
      tl.appendChild(lab);
      list.forEach((e, i) => tl.appendChild(evCard(e, i, pool)));
    });
    tl.appendChild(lookback);
  }

  function renderMonthIndex(date) {
    const host = $("#monthIndex");
    host.replaceChildren();
    host.hidden = true;
    const d = date.getDate();
    const others = [];
    for (let d2 = 1; d2 <= 31; d2++) {
      const t2 = new Date(S.vy, S.vm - 1, d2);
      if (t2.getMonth() !== S.vm - 1) break;
      if (d2 === d) continue;
      const list = collect(t2);
      if (list.length) {
        const solar = list.filter(x => x.cal === "公历")[0];
        const entry = solar || list[0];
        others.push({ d: d2, entry });
      }
    }
    if (others.length) {
      const section = document.createElement("section");
      section.className = "mn-section";
      section.setAttribute("aria-label", S.vm + "月其他有记载的日子");
      const head = document.createElement("div");
      head.className = "mn-head";
      head.innerHTML = '<h3>本月拾遗</h3><span>另有 <b>' + others.length + '</b> 天记载</span>';
      section.appendChild(head);
      const box = document.createElement("div");
      box.className = "mn-list";
      others.forEach(o => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "mn-row";
        const e = o.entry;
        const seasonal = e.y === 0;
        row.classList.toggle("is-seasonal", seasonal);
        row.setAttribute("aria-label", S.vm + "月" + o.d + "日，" + e.t + "，查看当日记载");
        row.innerHTML = '<span class="mn-d" aria-hidden="true"><small>' + S.vm + '月</small><strong>' + pad(o.d) + '</strong></span>' +
          '<span class="mn-copy"><span class="mn-t">' + e.t + '</span><span class="mn-meta">' +
          (seasonal ? (e.cal === "节气" ? "二十四节气" : "传统节令") : yearLabel(e.y) + '年 · ' + e.era) +
          '</span></span><span class="mn-go" aria-hidden="true">›</span>';
        row.addEventListener("click", () => selectDate(S.vy, S.vm, o.d, { pulse: true }));
        box.appendChild(row);
      });
      section.appendChild(box);
      host.appendChild(section);
      host.hidden = false;
    }
  }

  /* ── 朝代长卷 ── */
  const RAIL_ORDER = ["prc", "minguo", "qing", "ming", "yuan", "song", "wudai", "tang", "sui", "sj", "han", "qin", "cq", "xia"];

  function renderRail() {
    const rail = $("#rail");
    rail.innerHTML = "";
    RAIL_ORDER.forEach(k => {
      const era = window.ERAS.find(e => e.k === k);
      if (!era) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "era-btn";
      b.style.setProperty("--ec", era.color);
      b.dataset.k = k;
      b.setAttribute("role", "tab");
      b.id = "era-" + k;
      b.setAttribute("aria-controls", "scrollBody");
      b.innerHTML = "<b>" + era.name + "</b><span>" + era.span.replace(" — ", "–") + "</span>";
      b.addEventListener("click", () => openEra(k));
      rail.appendChild(b);
    });
    // 默认停在今天所在的时期
    openEra("prc", true);
  }

  function revealEra(smooth) {
    const rail = $("#rail"), active = $(".era-btn.on");
    if (!active || !rail.clientWidth) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({
      left: active.offsetLeft - (rail.clientWidth - active.offsetWidth) / 2,
      behavior: smooth && !reduced ? "smooth" : "instant"
    });
  }

  function openEra(k, silent) {
    const era = window.ERAS.find(e => e.k === k);
    if (!era) return;
    S.eraOpen = k;
    $$(".era-btn").forEach(b => {
      const on = b.dataset.k === k;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    if (window.Atmos) Atmos.set(k);

    const body = $("#scrollBody");
    body.setAttribute("aria-labelledby", "era-" + k);
    body.innerHTML = "";

    const hero = document.createElement("div");
    hero.className = "era-hero";
    hero.style.setProperty("--ec", era.color);
    hero.innerHTML =
      '<div class="eh-art" aria-hidden="true">' + (window.ART ? window.ART.scene(k) : "") + '</div>' +
      '<h2 class="eh-name">' + era.name + '</h2>' +
      '<div class="eh-years">' + era.span + '</div>' +
      '<p class="eh-brief">' + era.brief + '</p>';
    if (window.Gallery) Gallery.mount($(".eh-art", hero), k);
    const note = document.createElement("span");
    note.className = "eh-art-note";
    note.textContent = "AI 艺术意象";
    hero.appendChild(note);
    body.appendChild(hero);

    const tl = document.createElement("div");
    tl.className = "era-timeline";
    tl.style.setProperty("--ec", era.color);
    const eraSequence = era.events.map(e => ({ id: e[5], y: e[0], era: era.name, jz: e[1], t: e[2], d: e[3], s: e[4], cal: "长卷" }));
    era.events.forEach((e, i) => {
      const art = document.createElement("article");
      art.className = "te";
      art.style.animationDelay = (i * 55) + "ms";
      art.tabIndex = 0;
      art.setAttribute("role", "button");
      art.setAttribute("aria-label", e[2] + "，展开画卷");
      art.innerHTML =
        '<div class="te-year">' + yearLabel(e[0]) + (e[1] && e[1] !== "—" ? '<em>' + e[1] + '</em>' : '') + '</div>' +
        '<h3>' + e[2] + '</h3>' +
        '<p>' + e[3] + '</p>' +
        '<div class="ev-tags"><span class="tag src">' + e[4] + '</span></div>';
      const obj = eraSequence[i];
      art.addEventListener("click", ev => openDetail(obj, ev, eraSequence));
      art.addEventListener("keydown", ev => {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openDetail(obj, ev, eraSequence); }
      });
      tl.appendChild(art);
    });
    body.appendChild(tl);

    if (!silent) {
      revealEra(true);

    }
  }

  function jumpToEra(dz) {
    const k = eraKeyOf(dz) || "prc";
    setView("scroll");
    openEra(k);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function travelToEra(item, origin) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const warp = $("#timeWarp"), year = $("#timeWarpYear"), label = $("#timeWarpLabel");
    const rect = origin.getBoundingClientRect();
    const arrive = () => {
      jumpToEra(item.dz);
      toast("回望至 " + yearLabel(item.y) + "年 · " + item.dz);
    };
    if (reduced) { arrive(); return; }
    label.textContent = "回望 " + (today.getFullYear() - item.y) + " 年前";
    warp.classList.add("on");
    const start = performance.now(), from = today.getFullYear(), duration = 500;
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      year.textContent = yearLabel(Math.round(from + (item.y - from) * eased));
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(() => warp.classList.remove("on"), 180);
    }
    requestAnimationFrame(tick);
    if (window.Veil) Veil(rect.left + rect.width / 2, rect.top + rect.height / 2, getComputedStyle(document.documentElement).getPropertyValue("--era"), arrive);
    else setTimeout(arrive, 260);
  }

  /* ── 视图切换 ── */
  function setView(v) {
    S.view = v;
    [["cal", "Cal"], ["scroll", "Scroll"], ["seasons", "Seasons"]].forEach(([name, suffix]) => {
      const selected = v === name, tab = $("#tab" + suffix), panel = $("#view" + suffix);
      panel.classList.toggle("is-on", selected);
      panel.inert = !selected;
      tab.classList.toggle("on", selected);
      tab.tabIndex = selected ? 0 : -1;
      tab.setAttribute("aria-selected", String(selected));
    });
    // 卷首已承担序章，主体直接进入三个时间尺度。
    $(".opening").hidden = true;
    const skipTarget = v === "seasons" ? "#seasonTimeTitle" : v === "scroll" ? "#rail" : "#timeline";
    $(".skip").href = skipTarget;
    $(".skip").textContent = v === "seasons" ? "跳到时间刻度" : v === "scroll" ? "跳到朝代选择" : "跳到当日史事";
    if (window.Atmos) {
      if (v === "scroll") Atmos.set(S.eraOpen || "prc");
      else if (v === "cal") syncAtmos(S.sel);
    }
    if (v === "scroll" && window.SeasonalFX) SeasonalFX.setDate(S.sel);
    if (window.SeasonClock) SeasonClock.activate(v === "seasons", S.sel);
    if (v === "scroll") requestAnimationFrame(() => revealEra(false));
  }

  /* ── 氛围同步：这一天里最早的那条史事，决定页面色调 ── */
  function syncAtmos(date) {
    if (window.SeasonalFX && S.view !== "seasons") SeasonalFX.setDate(date);
    const all = collect(date);
    if (!all.length) return;
    let pick = null;
    all.forEach(x => {
      if (x.y === 0) { if (!pick) pick = x; return; }
      if (!pick || pick.y === 0 || x.y < pick.y) pick = x;
    });
    const k = pick && eraKeyOf(pick.era);
    if (k && window.Atmos) Atmos.set(k);
    return k;
  }

  function spark(x, y, key, n) {
    if (!window.Dust) return;
    Dust.emit(x, y, n || 16, { shape: PARTICLE[key] || "dot", power: 1 });
  }

  let calendarMotionTimer = null;
  function animateCalendar(direction, fullPage) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = $(".cal-card");
    const cls = fullPage
      ? (direction === "back" ? "page-turn-back" : "page-turn-forward")
      : "date-turn-" + direction;
    card.classList.remove("page-turn-back", "page-turn-forward", "date-turn-back", "date-turn-forward", "date-turn-still");
    void card.offsetWidth;
    card.classList.add(cls);
    clearTimeout(calendarMotionTimer);
    calendarMotionTimer = setTimeout(() => card.classList.remove(cls), fullPage ? 320 : 220);
  }

  /* ── 选择日期 ── */
  function selectDate(y, m, d, opts) {
    opts = opts || {};
    const old = new Date(S.sel);
    S.sel = new Date(y, m - 1, d);
    S.filter = "全部";
    if (S.vy !== y || S.vm !== m) { S.vy = y; S.vm = m; }
    renderCalendar();
    renderPanel();
    const direction = S.sel > old ? "forward" : S.sel < old ? "back" : "still";
    animateCalendar(direction);

    const key = syncAtmos(S.sel);
    if (opts.origin && key) spark(opts.origin.x, opts.origin.y, key, 6);

    if (opts.pulse) {
      const el = $('.day.sel');
      if (el) { el.classList.add("just"); setTimeout(() => el.classList.remove("just"), 340); }
    }
    if (S.view === "scroll") setView("cal");
  }

  /* ── 搜索 ── */
  let IDX = null;
  function buildIndex() {
    if (IDX) return IDX;
    const out = [];
    Object.keys(window.DAY).forEach(k => {
      (window.DAY[k] || []).forEach(e => out.push({
        key: k, id: e[6], y: e[0], era: e[1], jz: e[2], t: e[3], d: e[4], s: e[5], cal: "公历"
      }));
    });
    Object.keys(window.LUNAR).forEach(k => {
      (window.LUNAR[k] || []).forEach(e => out.push({
        key: k, id: e[6], y: e[0], era: e[1], jz: e[2], t: e[3], d: e[4], s: e[5], cal: "农历"
      }));
    });
    const eraName = {};
    window.ERAS.forEach(er => {
      eraName[er.k] = er.name;
      er.events.forEach(e => out.push({
        id: e[5], eraKey: er.k, y: e[0], era: er.name, jz: e[1], t: e[2], d: e[3], s: e[4], cal: "长卷"
      }));
    });
    IDX = out;
    return out;
  }

  function doSearch(q) {
    const box = $("#searchResults");
    box.innerHTML = "";
    q = q.trim();
    if (!q) {
      box.innerHTML = '<div class="sr-empty">输入一个词开始找，比如「唐」「郑和」「1911」</div>';
      return;
    }
    const items = buildIndex().filter(e =>
      e.t.indexOf(q) > -1 || e.d.indexOf(q) > -1 || e.era.indexOf(q) > -1 ||
      String(Math.abs(e.y)).indexOf(q) > -1 || (e.jz && e.jz.indexOf(q) > -1) || (e.s && e.s.indexOf(q) > -1)
    ).slice(0, 40);

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "sr-empty";
      empty.textContent = "没找到「" + q + "」，换个词试试。";
      box.appendChild(empty);
      return;
    }
    items.forEach((e, i) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "sr-item" + (i === 0 ? " act" : "");
      row.dataset.i = i;
      let label;
      if (e.cal === "长卷") label = e.era + "·" + yearLabel(e.y);
      else if (e.cal === "农历") label = e.key === "12-00" ? "农历除夕" : "农历" + e.key;
      else label = e.key;
      row.innerHTML =
        '<span class="sr-date">' + label + '</span>' +
        '<span class="sr-text">' + e.t + '<i>' + (e.jz && e.jz !== "—" ? e.jz + " · " : "") + e.d.slice(0, 44) + '…　' + e.s + '</i></span>';
      row.addEventListener("focus", () => {
        $$(".sr-item", box).forEach(item => item.classList.toggle("act", item === row));
      });
      row.addEventListener("click", () => {
        closeOverlays();
        if (e.cal === "长卷") { jumpToEra(e.era); }
        else if (e.cal === "公历") {
          const p = e.key.split("-");
          selectDate(today.getFullYear(), +p[0], +p[1], { pulse: true });
        } else {
          // 农历：找出今年对应的公历日
          const p = e.key.split("-");
          const target = findSolarOfLunar(today.getFullYear(), +p[0], +p[1]);
          if (target) selectDate(target.getFullYear(), target.getMonth() + 1, target.getDate(), { pulse: true });
          else toast("这条农历纪事今年没有对应日期，可在日历中翻找");
        }
      });
      box.appendChild(row);
    });
  }

  function findSolarOfLunar(y, lm, ld) {
    for (let i = 0; i < 400; i++) {
      const dt = new Date(y, 0, 1 + i);
      if (dt.getFullYear() !== y) break;
      const l = lunarOf(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
      if (l && l.getMonth() === lm &&
        (ld === 0 && lm === 12 ? isLunarEve(dt) : l.getDay() === ld)) return dt;
    }
    return null;
  }

  function closeOverlays() {
    [$("#searchOverlay"), $("#legendOverlay")].forEach(modal => {
      if (!modal.hidden) { modal.hidden = true; releaseModal(modal); }
    });
  }

  /* ── 事件绑定 ── */
  function bind() {
    function animateMonth(delta) {
      animateCalendar(delta > 0 ? "forward" : "back", true);
    }

    function shiftMonth(delta) {
      let y = S.vy, m = S.vm + delta;
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      const last = new Date(y, m, 0).getDate();
      const keepDay = Math.min(S.sel.getDate(), last);
      S.vy = y; S.vm = m;
      S.sel = new Date(y, m - 1, keepDay);
      S.filter = "全部";
      renderCalendar();
      renderPanel();
      syncAtmos(S.sel);
      animateMonth(delta);
    }

    $("#prevMonth").addEventListener("click", () => shiftMonth(-1));
    $("#nextMonth").addEventListener("click", () => shiftMonth(1));

    $("#grid").addEventListener("click", ev => {
      const b = ev.target.closest(".day");
      if (!b) return;
      const r = b.getBoundingClientRect();
      selectDate(+b.dataset.y, +b.dataset.m, +b.dataset.d, {
        origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      });
    });

    $("#btnToday").addEventListener("click", () => {
      selectDate(today.getFullYear(), today.getMonth() + 1, today.getDate(), { pulse: true });
      setView("cal");
      if(window.SeasonClock?.resetNow) SeasonClock.resetNow();
      if(window.SeasonalFX) SeasonalFX.setDate(today,true);
      toast("回到今天 · " + (today.getMonth() + 1) + "月" + today.getDate() + "日");
    });

    function randomJump() {
      let tries = 0, dt;
      do {
        const m = 1 + Math.floor(Math.random() * 12);
        const d = 1 + Math.floor(Math.random() * new Date(2026, m, 0).getDate());
        dt = new Date(today.getFullYear(), m - 1, d);
        tries++;
      } while (collect(dt).length < 2 && tries < 60);
      selectDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), { pulse: true });
      setView("cal");
      toast("穿越到 " + (dt.getMonth() + 1) + "月" + dt.getDate() + "日");
    }
    $("#btnRandom").addEventListener("click", randomJump);

    $("#tabCal").addEventListener("click", () => setView("cal"));
    $("#tabScroll").addEventListener("click", () => setView("scroll"));
    $("#tabSeasons").addEventListener("click", () => setView("seasons"));
    $("#openingSeasons").addEventListener("click", () => setView("seasons"));
    document.addEventListener("season:date", event => {
      const date = event.detail;
      selectDate(date.year, date.month, date.day);
      setView("cal");
      $(".day.sel").focus({ preventScroll: true });
    });

    $("#btnTheme").addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "dark" ? "light" : "dark");
    });

    $("#btnSearch").addEventListener("click", () => {
      const inp = $("#searchInput");
      inp.value = "";
      doSearch("");
      activateModal($("#searchOverlay"), inp);
    });
    $("#searchClose").addEventListener("click", closeOverlays);
    $("#searchInput").addEventListener("input", e => doSearch(e.target.value));
    $("#searchInput").addEventListener("keydown", e => {
      if (e.isComposing || !["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) return;
      const rows = $$(".sr-item", $("#searchResults"));
      if (!rows.length) return;
      e.preventDefault();
      const index = Math.max(0, rows.findIndex(row => row.classList.contains("act")));
      if (e.key === "Enter") { rows[index].click(); return; }
      const next = (index + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
      rows.forEach((row, i) => row.classList.toggle("act", i === next));
      rows[next].scrollIntoView({ block: "nearest" });
    });
    $("#searchOverlay").addEventListener("click", e => {
      if (e.target.id === "searchOverlay") closeOverlays();
    });

    $("#btnLegend").addEventListener("click", () => activateModal($("#legendOverlay"), $("#legendClose")));
    $("#legendClose").addEventListener("click", closeOverlays);
    $("#legendOverlay").addEventListener("click", e => {
      if (e.target.id === "legendOverlay") closeOverlays();
    });

    /* 画卷关闭 */
    $("#dClose").addEventListener("click", closeDetail);
    $("#dDismiss").addEventListener("click", closeDetail);
    $("#dPrev").addEventListener("click", ev => {
      if (detailIndex > 0) openDetail(detailItems[detailIndex - 1], ev, detailItems);
    });
    $("#dNext").addEventListener("click", ev => {
      if (detailIndex < detailItems.length - 1) openDetail(detailItems[detailIndex + 1], ev, detailItems);
    });
    $("#openingExplore").addEventListener("click", () => {
      setView("scroll");
      $(".era-btn.on").focus({ preventScroll: true });
    });
    $$(".seg-btn").forEach((button, index) => button.addEventListener("keydown", ev => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(ev.key)) return;
      ev.preventDefault(); ev.stopPropagation();
      const buttons = $$(".seg-btn");
      const next = ev.key === "Home" ? 0 : ev.key === "End" ? buttons.length - 1 : (index + (ev.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      const target = buttons[next]; target.click(); target.focus();
    }));
    let railResize;
    window.addEventListener("resize", () => {
      clearTimeout(railResize);
      railResize = setTimeout(() => {
        if (S.view === "scroll") revealEra(false);
      }, 120);
    });
    if (window.ResizeObserver) {
      const railObserver = new ResizeObserver(() => { if (S.view === "scroll") revealEra(false); });
      railObserver.observe($("#rail"));
    }
    $("#rail").addEventListener("keydown", ev => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(ev.key)) return;
      ev.preventDefault(); ev.stopPropagation();
      const buttons = $$(".era-btn"), index = buttons.indexOf(ev.target);
      const next = ev.key === "Home" ? 0 : ev.key === "End" ? buttons.length - 1 : (index + (ev.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].click(); buttons[next].focus({ preventScroll: true });
    });
    $("#dBackdrop").addEventListener("click", closeDetail);

    document.addEventListener("keydown", e => {
      if (document.documentElement.classList.contains("welcome-pending")) return;
      if (activeModal && e.key === "Tab") {
        const items = $$("button:not([hidden]), input", activeModal).filter(el => !el.disabled && el.getClientRects().length);
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        return;
      }
      if (e.key === "Escape") { closeDetail(); closeOverlays(); return; }
      if (!$("#searchOverlay").hidden || !$("#legendOverlay").hidden) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (!$("#detail").hidden) return;

      if (e.key === "t" || e.key === "T") {
        $("#btnToday").click(); return;
      }
      if (e.key === "r" || e.key === "R") { randomJump(); return; }
      if (e.key === "/") { e.preventDefault(); $("#btnSearch").click(); return; }
      if (S.view !== "cal") return;

      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (step && (e.target === document.body || e.target.closest("#grid"))) {
        e.preventDefault();
        const dt = new Date(S.sel.getFullYear(), S.sel.getMonth(), S.sel.getDate() + step);
        selectDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
        $(".day.sel").focus({ preventScroll: true });
      }
    });
  }

  /* ── 启动 ── */
  function boot() {
    if (!window.Solar) {
      console.warn("农历库未加载");
    }
    renderRail();
    renderCalendar();
    renderPanel();
    bind();
    setView("cal");
    syncAtmos(S.sel);
    try {
      if (!sessionStorage.getItem("yq-hint")) {
        sessionStorage.setItem("yq-hint", "1");
        setTimeout(() => {
          if (!document.documentElement.classList.contains("welcome-pending")) toast("点日历上任意一天，看这一天在中国历史上发生过什么");
        }, 900);
      }
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
