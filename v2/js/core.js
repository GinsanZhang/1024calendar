/* ============================================================
   一页千秋 · v2 · 核心工具
   ============================================================ */
window.V2 = (function () {
  "use strict";

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const pad = n => (n < 10 ? "0" + n : "" + n);

  function el(tag, props, kids) {
    const node = document.createElement(tag);
    if (props) for (const k in props) {
      if (k === "class") node.className = props[k];
      else if (k === "text") node.textContent = props[k];
      else if (k === "html") node.innerHTML = props[k];
      else if (k === "dataset") Object.assign(node.dataset, props[k]);
      else if (k in node) node[k] = props[k];
      else node.setAttribute(k, props[k]);
    }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(k => k && node.append(k));
    return node;
  }

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  };
  const reduced = () => document.documentElement.dataset.motion === "paused" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 动效令牌的唯一读取口：JS 不写字面时长 */
  function token(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  const ms = name => {
    const v = token(name);
    if (!v) return 300;
    return v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000;
  };

  function anim(node, frames, opts) {
    if (!node) return { finished: Promise.resolve() };
    if (reduced()) {
      // 降级：直接落到末态，不做位移
      const last = frames[frames.length - 1];
      Object.assign(node.style, { opacity: last.opacity ?? "1", transform: last.transform || "", clipPath: last.clipPath || "" });
      return { finished: Promise.resolve(), cancel() {} };
    }
    return node.animate(frames, Object.assign({ fill: "both", easing: token("--ease-out") || "ease-out" }, opts));
  }

  function wait(anims) {
    return Promise.all(anims.map(a => (a && a.finished ? a.finished : Promise.resolve()))).catch(() => {});
  }

  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  let toastTimer;
  function toast(msg) {
    const node = $("#toast");
    if (!node) return;
    node.textContent = msg;
    node.dataset.on = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { delete node.dataset.on; }, 2400);
  }

  /* 主题：跟随系统，可手动切换并记忆 */
  function initTheme() {
    const saved = storage.get("v2-theme");
    const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    return dark;
  }
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    storage.set("v2-theme", next);
    return next;
  }

  /* 数字滚动：用于溯时的纪年回溯 */
  function countTo(node, from, to, durationMs) {
    return new Promise(resolve => {
      if (reduced()) { node.textContent = String(to); resolve(); return; }
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / durationMs);
        const v = Math.round(from + (to - from) * easeOutCubic(p));
        node.textContent = String(v);
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  return { storage, $, $$, pad, el, reduced, token, ms, anim, wait, toast, initTheme, toggleTheme, countTo, easeOutCubic };
})();
