/* ============================================================
   一页千秋 · v2 · 数据桥
   ------------------------------------------------------------
   只读取 v1 的数据文件（window.DAY / LUNAR / JIEQI / ERAS），
   不复制、不修改任何一条史料。v2 只做视图与排序。
   ============================================================ */
window.V2Data = (function () {
  "use strict";

  const pad = n => (n < 10 ? "0" + n : "" + n);

  /* ── 画作清单：与 assets 目录一一对应 ── */
  const PAINT = {
    xia:    { file: "assets/scroll/era-xia-dinghuo.webp",       title: "鼎火初兴" },
    cq:     { file: "assets/scroll/era-cq-lieguo.webp",         title: "列国山河" },
    qin:    { file: "assets/scroll/era-qin-fengsui.webp",       title: "秦关烽燧" },
    han:    { file: "assets/scroll/era-han-hanque.webp",        title: "汉阙通远" },
    sj:     { file: "assets/scroll/era-sj-zhulin.webp",         title: "竹林清谈" },
    sui:    { file: "assets/scroll/era-sui-canal.webp",         title: "运河初开" },
    tang:   { file: "assets/scroll/era-tang-changan.webp",      title: "长安晓色" },
    wudai:  { file: "assets/scroll/era-wudai-jiangcheng.webp",  title: "江城烟雨" },
    song:   { file: "assets/scroll/era-song-jiangshan.webp",    title: "江山入画" },
    yuan:   { file: "assets/scroll/era-yuan-grassland.webp",   title: "草原秋声" },
    ming:   { file: "assets/scroll/era-ming-voyage.webp",       title: "宝船远航" },
    qing:   { file: "assets/scroll/era-qing-garden.webp",       title: "园林听雨" },
    minguo: { file: "assets/scroll/era-minguo-street.webp",     title: "街巷晨光" },
    prc:    { file: "assets/scroll/era-prc-newchapter.webp",    title: "山河新章" },
    jieqi:  { file: "assets/seasons/jieqi-05-qingming.webp",    title: "山川时序" }
  };

  /* ── 朝代 ── */
  const ERAS = (window.ERAS || []).slice();
  const ERA_NAME = {};
  ERAS.forEach(e => { ERA_NAME[e.name] = e.k; });
  ERA_NAME["节令"] = "jieqi";
  ERA_NAME["节气"] = "jieqi";

  /* 同一朝代的「可读墨色」：原色作装饰，压深一档才做文字。
     数值由对比度推导，浅底 ≥4.5:1，深底 ≥4.5:1。 */
  const ERA_INK = {
    xia:    ["#866647", "#9B7652"], cq:   ["#65714D", "#758259"],
    qin:    ["#39332C", "#897B68"], han:  ["#9A3C2E", "#C95B49"],
    sj:     ["#5B6A79", "#6D7F91"], sui:  ["#795B45", "#9B7559"],
    tang:   ["#94631B", "#C28223"], wudai:["#6A6053", "#887B6B"],
    song:   ["#4B7567", "#568676"], yuan: ["#4E5A8B", "#6F7BAE"],
    ming:   ["#AE3F2F", "#CE5947"], qing: ["#3D6A8B", "#4C83AB"],
    minguo: ["#6D594D", "#927868"], prc:  ["#B0392E", "#D05548"]
  };

  function eraInk(key) {
    const css = getComputedStyle(document.documentElement).getPropertyValue("--era-" + key + "-ink").trim();
    if(css) return css;
    const pair = ERA_INK[key] || ERA_INK.prc;
    return document.documentElement.dataset.theme === "dark" ? pair[1] : pair[0];
  }
  function eraRaw(key) {
    const e = ERAS.find(x => x.k === key);
    return e ? e.color : "#B23A2E";
  }
  function eraAt(year) {
    let hit = ERAS.find(e => year >= e.from && year <= e.to);
    if (hit) return hit;
    return null;
  }
  function eraIndex(key) {
    return Math.max(0, ERAS.findIndex(e => e.k === key));
  }

  /* ── 农历 ── */
  function lunarOf(y, m, d) {
    try {
      if (!window.Solar) return null;
      return window.Solar.fromYmd(y, m, d).getLunar();
    } catch (e) { return null; }
  }
  function lunarInfo(y, m, d) {
    const l = lunarOf(y, m, d);
    if (!l) return null;
    let month = "";
    try { month = l.getMonthInChinese(); } catch (e) { month = ""; }
    let day = "";
    try { day = l.getDayInChinese(); } catch (e) { day = ""; }
    let jq = "";
    try { jq = l.getJieQi() || ""; } catch (e) { jq = ""; }
    if (jq && !window.JIEQI[jq]) jq = "";
    return {
      month, day,
      text: month + "月" + day,
      ganzhi: (() => { try { return l.getYearInGanZhi(); } catch (e) { return ""; } })(),
      zodiac: (() => { try { return l.getYearShengXiao(); } catch (e) { return ""; } })(),
      jq,
      key: pad(Math.abs(l.getMonth())) + "-" + pad(l.getDay())
    };
  }

  /* ── 当日纪事 ── */
  function norm(e, cal) {
    const name = e[1];
    return {
      id: e[6] || [cal, e[0], e[3]].join(":"), y: e[0], era: name, jz: e[2] || "", t: e[3], d: e[4] || "", s: e[5] || "",
      cal, eraKey: ERA_NAME[name] || ""
    };
  }

  function isLunarEve(y, m, d) {
    const next = new Date(y, m - 1, d + 1);
    const l = lunarOf(next.getFullYear(), next.getMonth() + 1, next.getDate());
    return l && l.getMonth() === 1 && l.getDay() === 1;
  }

  function collect(y, m, d) {
    const key = pad(m) + "-" + pad(d);
    const solar = (window.DAY[key] || []).map(e => norm(e, "公历"));
    const lunar = [];
    const jieqi = [];

    const l = lunarOf(y, m, d);
    if (l) {
      if (l.getJieQi && window.JIEQI[l.getJieQi()]) {
        const name = l.getJieQi();
        const q = window.JIEQI[name];
        jieqi.push({ y: 0, era: "节气", jz: q[0], t: name, d: q[1], s: q[2], cal: "节气", eraKey: "jieqi" });
      }
      const lk = pad(Math.abs(l.getMonth())) + "-" + pad(l.getDay());
      if (l.getMonth() > 0) (window.LUNAR[lk] || []).forEach(e => lunar.push(norm(e, "农历")));
      if (isLunarEve(y, m, d)) {
        (window.LUNAR["12-00"] || []).forEach(e => lunar.push(norm(e, "农历")));
      }
    }

    solar.sort((a, b) => a.y - b.y);
    lunar.sort((a, b) => (a.y || 0) - (b.y || 0));

    /* 排序即语义：同日之内，公历 → 农历 → 节气。
       只表示阅读顺序，不暗示历史因果。 */
    return solar.concat(lunar, jieqi);
  }

  function dateKey(date) {
    return pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  /* 找最近有记载的一天：只作探索引导，不伪造内容 */
  function nearest(y, m, d, dir, maxDays) {
    const limit = maxDays || 370;
    for (let i = 1; i <= limit; i++) {
      const dt = new Date(y, m - 1, d + dir * i);
      if (collect(dt.getFullYear(), dt.getMonth() + 1, dt.getDate()).some(e => e.cal !== "节气")) {
        return dt;
      }
    }
    return null;
  }

  /* ── 画作取图 ── */
  function artFor(item) {
    const eventAsset = window.V2Assets && window.V2Assets.forEvent(item);
    if (eventAsset) return eventAsset;
    const k = item.eraKey && PAINT[item.eraKey] ? item.eraKey : "song";
    return {...PAINT[k], direct:PAINT[k].file, missing:false};
  }
  function photoFor(item, width) {
    if (artFor(item).missing) return "";
    return artFor(item).direct || artFor(item).file;
  }

  function yearLabel(y) {
    if (y === 0) return "";
    return y < 0 ? "前 " + Math.abs(y) : String(y);
  }

  /* ── 二十四节气 ── */
  const JQ_ORDER = [
    "立春", "雨水", "惊蛰", "春分", "清明", "谷雨",
    "立夏", "小满", "芒种", "夏至", "小暑", "大暑",
    "立秋", "处暑", "白露", "秋分", "寒露", "霜降",
    "立冬", "小雪", "大雪", "冬至", "小寒", "大寒"
  ];
  const SEASON_KEYS = ["spring", "summer", "autumn", "winter"];
  const SEASON_NAMES = { spring: "春", summer: "夏", autumn: "秋", winter: "冬" };
  const seasonOf = i => SEASON_KEYS[Math.floor(i / 6)];

  function jqMotif(name) {
    try {
      const p = window.Phenology && window.Phenology.profileFor(name);
      return p ? p.label : "";
    } catch (e) { return ""; }
  }

  function currentTerm(date = new Date()) {
    try { return window.Solar.fromDate(date).getLunar().getPrevJieQi(false).getName(); }
    catch (_) { return "立春"; }
  }
  function termDate(name, year) {
    try {
      const table = window.Solar.fromYmd(year, 7, 1).getLunar().getJieQiTable();
      const hit = Object.values(table).find(s => s.getYear() === year && s.getLunar().getJieQi() === name);
      return hit ? hit.toYmdHms() : "";
    } catch (_) { return ""; }
  }
  function lunarDate(key, year) {
    for (let i = 0; i < 366; i++) {
      const dt = new Date(year, 0, i + 1);
      if (dt.getFullYear() !== year) break;
      const y = dt.getFullYear(), m = dt.getMonth()+1, d = dt.getDate();
      if (key === "12-00" ? isLunarEve(y,m,d) : lunarInfo(y,m,d)?.key === key && lunarOf(y,m,d).getMonth() > 0) return dt;
    }
    return null;
  }
  return {
    currentTerm, termDate, lunarDate, isLunarEve,
    ERAS, PAINT, ERA_NAME,
    eraInk, eraRaw, eraAt, eraIndex,
    lunarOf, lunarInfo, collect, dateKey, nearest,
    artFor, photoFor, yearLabel,
    JQ_ORDER, SEASON_KEYS, SEASON_NAMES, seasonOf, jqMotif
  };
})();
