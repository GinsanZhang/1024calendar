/* ============================================================
   一页千秋 · 氛围引擎
   Atmos  朝代配色（全站平滑换色）
   Dust   粒子层（环境浮尘 + 点击迸发）
   Veil   穿越转场（墨晕扩散）
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var motionQuery = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var REDUCE = motionQuery && motionQuery.matches;
  if (motionQuery && motionQuery.addEventListener) motionQuery.addEventListener("change", function (event) { REDUCE = event.matches; });
  var IS_DARK = function () { return root.getAttribute("data-theme") === "dark"; };

  /* ── 颜色工具 ── */
  function hex2rgb(h) {
    h = String(h).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    var h = 0, s = 0, l = (mx + mn) / 2, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  }
  var hsla = function (h, s, l, a) {
    return "hsla(" + h.toFixed(0) + "," + Math.max(0, Math.min(100, s)).toFixed(1) + "%," +
      Math.max(0, Math.min(100, l)).toFixed(1) + "%," + (a === undefined ? 1 : a) + ")";
  };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ── Atmos ── */
  var curKey = null, curHex = "#B23A2E";

  function eraOf(k) {
    if (!window.ERAS) return null;
    for (var i = 0; i < window.ERAS.length; i++) if (window.ERAS[i].k === k) return window.ERAS[i];
    return null;
  }

  function set(key) {
    var era = eraOf(key);
    if (!era) return;
    var rgb = hex2rgb(era.color);
    var hsl = rgb2hsl(rgb[0], rgb[1], rgb[2]);
    var h = hsl[0], s = hsl[1], L = hsl[2];
    var dark = IS_DARK();

    // 主色：保证在底纸上有足够对比
    var accentL = dark ? clamp(L, 62, 74) : clamp(L, 30, 46);
    var accentS = clamp(s * 1.05, 26, 72);
    var accent = hsla(h, accentS, accentL, 1);

    // 纸色：极轻的朝代色偏，保证可读性的同时让人感到「换了个时代」
    var paperL = dark ? 8.6 : 95.2;
    var paperS = dark ? 11 : clamp(s * 0.5, 6, 17);
    var cardL = dark ? 11.4 : 98.5;
    var cardS = dark ? 10 : clamp(s * 0.4, 5, 14);

    root.style.setProperty("--zhu", accent);
    root.style.setProperty("--zhu-soft", hsla(h, accentS, accentL, dark ? 0.15 : 0.1));
    root.style.setProperty("--paper", hsla(h, paperS, paperL, 1));
    root.style.setProperty("--paper-2", hsla(h, paperS * 0.9, dark ? paperL - 2 : paperL + 2, 1));
    root.style.setProperty("--card", hsla(h, cardS, cardL, 1));
    root.style.setProperty("--era", era.color);
    root.style.setProperty("--era-ink", hsla(h, clamp(s, 20, 62), dark ? 66 : clamp(L, 32, 48), 1));
    root.style.setProperty("--era-wash", hsla(h, clamp(s, 22, 64), dark ? 62 : 46, dark ? 0.24 : 0.16));

    curKey = key;
    curHex = accent;
    if (window.Gallery) window.Gallery.applyEra(key);
    if (window.Dust) window.Dust.setColor(accent, h);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "hsl(" + h.toFixed(0) + ",11%,8.6%)" : "hsl(" + h.toFixed(0) + "," + paperS.toFixed(0) + "%,95.2%)");
  }

  function refresh() {
    if (curKey) set(curKey);
  }

  /* ── Dust 粒子 ── */
  var Dust = (function () {
    var cv, ctx, W = 0, H = 0, DPR = 1, ready = false;
    var amb = [], burst = [], color = "#B23A2E", hue = 8, running = false;

    function resize() {
      if (!cv) return;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
      cv.style.width = W + "px";
      cv.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seed();
    }

    function seed() {
      amb = [];
      var n = 0; // Keep reading surfaces still; particles respond only to a date click.
      for (var i = 0; i < n; i++) {
        amb.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.6 + Math.random() * 1.7,
          sp: 0.06 + Math.random() * 0.26,
          ph: Math.random() * 6.283,
          sw: 0.12 + Math.random() * 0.4,
          a: 0.13 + Math.random() * 0.3
        });
      }
    }

    function setColor(c, h) {
      color = c;
      if (h !== undefined) hue = h;
    }

    function emit(x, y, n, opt) {
      if (REDUCE || !ready) return;
      opt = opt || {};
      var shape = opt.shape || "dot";
      var col = opt.color || color;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283;
        var v = (opt.power || 1) * (2.0 + Math.random() * 7.4);
        burst.push({
          x: x, y: y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 0.9,
          g: 0.038 + Math.random() * 0.045,
          r: 1.3 + Math.random() * 3.4,
          life: 1,
          dec: 0.007 + Math.random() * 0.010,
          col: col,
          shape: shape,
          rot: Math.random() * 6.283,
          vr: (Math.random() - 0.5) * 0.22
        });
      }
      if (burst.length > 60) burst.splice(0, burst.length - 60);
      if (!running && !document.hidden) { running = true; requestAnimationFrame(frame); }
    }

    function drawShape(p) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.col;
      if (p.shape === "petal") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * 1.7, p.r * 0.72, 0, 0, 6.283);
        ctx.fill();
        ctx.restore();
      } else if (p.shape === "square") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.r * 0.8, -p.r * 0.8, p.r * 1.6, p.r * 1.6);
        ctx.restore();
      } else if (p.shape === "streak") {
        ctx.strokeStyle = p.col;
        ctx.lineWidth = Math.max(0.7, p.r * 0.55);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 1.7, p.y - p.vy * 1.7);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      }
    }

    function frame() {
      if (!ready) return;
      if (document.hidden) { running = false; return; }
      ctx.clearRect(0, 0, W, H);
      if (REDUCE) { burst = []; running = false; return; }
      var t = performance.now() / 1000, i, p;

      // 环境浮尘
      for (i = 0; i < amb.length; i++) {
        p = amb[i];
        p.y -= p.sp;
        if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
        var x = p.x + Math.sin(t * 0.6 + p.ph) * p.sw * 8;
        ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t * 0.9 + p.ph));
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, 6.283);
        ctx.fill();
      }

      // 迸发
      for (i = burst.length - 1; i >= 0; i--) {
        p = burst[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.g;
        p.vx *= 0.988;
        p.vy *= 0.988;
        p.rot += p.vr;
        p.life -= p.dec;
        if (p.life <= 0 || p.y > H + 40) { burst.splice(i, 1); continue; }
        drawShape(p);
      }
      ctx.globalAlpha = 1;
      if (burst.length) requestAnimationFrame(frame);
      else running = false;
    }

    function init() {
      cv = document.getElementById("fx");
      if (!cv) return;
      ctx = cv.getContext("2d");
      if (!ctx) return;
      ready = true;
      resize();
      window.addEventListener("resize", function () {
        clearTimeout(init._t);
        init._t = setTimeout(resize, 160);
      });
      // No animation loop while the page is idle.
    }

    return { init: init, emit: emit, setColor: setColor, resize: resize };
  })();

  /* ── Veil 转场 ── */
  var veilEl = null;
  function veil(x, y, color, cb) {
    if (!veilEl) veilEl = document.getElementById("veil");
    if (!veilEl) { cb && cb(); return; }
    if (REDUCE) { cb && cb(); return; }
    veilEl.style.setProperty("--vx", (x || window.innerWidth / 2) + "px");
    veilEl.style.setProperty("--vy", (y || window.innerHeight / 2) + "px");
    veilEl.style.setProperty("--vc", color || curHex);
    veilEl.classList.remove("go");
    void veilEl.offsetWidth;
    veilEl.classList.add("go");
    setTimeout(function () { cb && cb(); }, 250);
    setTimeout(function () { veilEl.classList.remove("go"); }, 700);
  }

  /* ── 导出 ── */
  window.Atmos = { set: set, refresh: refresh, current: function () { return curKey; } };
  window.Dust = Dust;
  window.Veil = veil;

  document.addEventListener("DOMContentLoaded", function () {
    Dust.init();
    var watch = new MutationObserver(function () { Atmos.refresh(); });
    watch.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  });
})();
