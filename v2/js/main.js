/* ============================================================
   一页千秋 · v2 · 启动与全局键位
   ============================================================ */
(function () {
  "use strict";

  const { $, $$, reduced, toast } = window.V2;
  const D = window.V2Data;

  window.V2.initTheme();

  const now = new Date();
  const S = {
    view: "calendar",
    sel: { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() },
    vis: { y: now.getFullYear(), m: now.getMonth() + 1 },
    eraIndex: 0,
    jqIndex: 0
  };
  window.V2State = S;

  /* 首次进入停在今天的节气上 */
  const todayLunar = D.lunarInfo(S.sel.y, S.sel.m, S.sel.d);
  const jqName = D.currentTerm(now);
  S.jqIndex = Math.max(0, D.JQ_ORDER.indexOf(jqName));

  window.V2Views.init(S);
  window.V2Views.setSeason(S.jqIndex);

  /* ── 首屏与舞台的观察状态 ── */
  const hero = $("#hero");
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      entries.forEach(en => {
        document.body.dataset.at = en.isIntersecting && en.intersectionRatio > .32 ? "hero" : "stage";
      });
    }, { threshold: [0, .32, .6] }).observe(hero);
  }

  /* ── 尺度尺 ── */
  $$("[data-go]").forEach(btn => {
    btn.addEventListener("click", () => window.V2Views.switchView(btn.dataset.go));
  });

  /* ── 开场 ── */
  $("#heroEnter").addEventListener("click", () => window.V2Views.switchView("calendar"));
  $("#heroScroll").addEventListener("click", () => {
    $("#portals").scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  });

  /* ── 明暗 ── */
  $("#themeToggle").addEventListener("click", () => {
    window.V2.toggleTheme();
    window.V2Views.refreshEraColors();
    toast(document.documentElement.dataset.theme === "dark" ? "夜观长卷" : "昼读日历");
  });

  /* ── 检索 ── */
  $("#searchOpen").addEventListener("click", () => window.V2Overlay.openSearch());
  $("#searchInput").addEventListener("input", e => window.V2Overlay.renderResults(e.target.value));

  /* ── 溯时 ── */
  $("#lookbackTrigger").addEventListener("click", () => window.V2Overlay.openLookback());
  $("#lookbackClose").addEventListener("click", () => window.V2Overlay.closeLookback());
  $$(".lb-opt").forEach(btn => {
    btn.addEventListener("click", () => window.V2Overlay.runLookback(Number(btn.dataset.years)));
  });

  /* ── 入画的前后一事 ── */
  $("#enterClose").addEventListener("click", () => window.V2Overlay.closeReader());
  $("#enterPrev").addEventListener("click", () => window.V2Overlay.go(-1));
  $("#enterNext").addEventListener("click", () => window.V2Overlay.go(1));

  /* ── 遮罩点击关闭 ── */
  $("#lookback").addEventListener("click", e => {
    if (e.target.id === "lookback") window.V2Overlay.closeLookback();
  });
  $("#search").addEventListener("click", e => {
    if (e.target.id === "search") window.V2Overlay.closeSearch();
  });

  /* ── 键盘：视图内是时间，视图间是尺度 ── */
  function stepDate(delta) {
    const dt = new Date(S.sel.y, S.sel.m - 1, S.sel.d + delta);
    window.V2Views.pickDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  }

  const DAY_STEP = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

  function onKey(e) {
    if (e.isComposing || e.keyCode === 229) return;
    const top = window.V2Overlay.topmost();

    if (e.key === "Escape") {
      if (window.V2Overlay.closeTop()) { e.preventDefault(); return; }
    }

    if (top === "search") {
      if (e.key === "ArrowDown") { e.preventDefault(); window.V2Overlay.moveCur(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); window.V2Overlay.moveCur(-1); }
      else if (e.key === "Enter") {
        const cur = $('.sr[data-cur="1"]');
        if (cur) { e.preventDefault(); cur.click(); }
      }
      return;
    }
    if (top === "lookback") return;
    if (top === "enter") {
      if (e.key === "ArrowLeft") { e.preventDefault(); window.V2Overlay.go(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); window.V2Overlay.go(1); }
      return;
    }

    if (e.target.closest("input,textarea,select,[contenteditable=true]")) return;
    if (e.key.toLowerCase() === "t") { $("#todayButton").click(); return; }
    if (e.key.toLowerCase() === "r") { $("#randomButton").click(); return; }
    if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
      e.preventDefault();
      window.V2Overlay.openSearch();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === "1") { window.V2Views.switchView("calendar"); return; }
    if (e.key === "2") { window.V2Views.switchView("scroll"); return; }
    if (e.key === "3") { window.V2Views.switchView("seasons"); return; }

    if (S.view === "calendar") {
      const delta = DAY_STEP[e.key];
      if (delta) { e.preventDefault(); stepDate(delta); }
      return;
    }

    if (S.view === "scroll") {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        window.V2Views.scrollToEra(Math.min(D.ERAS.length - 1, S.eraIndex + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        window.V2Views.scrollToEra(Math.max(0, S.eraIndex - 1));
      }
      return;
    }

    if (S.view === "seasons") {
      if (e.key === "ArrowRight") { e.preventDefault(); window.V2Views.setSeason(S.jqIndex + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); window.V2Views.setSeason(S.jqIndex - 1); }
    }
  }

  document.addEventListener("keydown", onKey);

  /* 滚动到长卷时同步一次，避免迟到的尺寸计算错位 */
  window.addEventListener("resize", () => {
    if (S.view === "scroll") window.V2Views.syncScroll();
    if (S.view === "seasons") window.V2Views.sizeRing();
  });
})();
