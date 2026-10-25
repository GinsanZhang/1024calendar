/* 卷首画境：不阻塞内容，可随时向下翻阅。 */
(function () {
  'use strict';
  const welcome = document.getElementById('welcome');
  const app = document.getElementById('appShell');
  const scene = document.getElementById('welcomeLife');
  const landscape = welcome.querySelector('.welcome-landscape');
  const boatImage = document.getElementById('boatImage');
  const motionButton = document.getElementById('welcomeMotion');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  try { paused = sessionStorage.getItem('yq-scene-paused') === '1'; } catch (_) {}
  if (window.SeasonalFX) paused = SeasonalFX.isPaused();

  function syncMotion() {
    const still = paused || reducedMotion.matches;
    welcome.classList.toggle('is-scene-paused', still || document.hidden);
    motionButton.setAttribute('aria-pressed', String(still));
    motionButton.disabled = reducedMotion.matches;
    motionButton.querySelector('span').textContent = reducedMotion.matches ? '静态画境' : paused ? '播放画境' : '暂停画境';
    motionButton.title = reducedMotion.matches ? '已遵循系统的减少动态效果设置' : '';
  }

  function fitScene() {
    const width = welcome.clientWidth, height = welcome.clientHeight;
    if (!width || !height) return;
    const scale = Math.max(width / 1536, height / 1024);
    const position = getComputedStyle(landscape).objectPosition.split(' ');
    const offsetX = (width - 1536 * scale) * (parseFloat(position[0]) / 100);
    const offsetY = (height - 1024 * scale) * .5;
    scene.style.transform = 'translate(' + offsetX + 'px,' + offsetY + 'px) scale(' + scale + ')';
  }

  let landscapeFailed = false;
  function readyScene() {
    welcome.classList.toggle('scene-ready', !landscapeFailed && landscape.complete && landscape.naturalWidth > 0 && boatImage.complete && boatImage.naturalWidth > 0);
  }
  function recoverLandscape() {
    if (landscapeFailed) return;
    landscapeFailed = true;
    welcome.classList.remove('scene-ready');
    landscape.removeAttribute('srcset');
    landscape.src = 'assets/dynasties/song-1536.webp';
  }
  landscape.addEventListener('load', readyScene);
  landscape.addEventListener('error', recoverLandscape);
  boatImage.addEventListener('load', readyScene);
  boatImage.addEventListener('error', () => welcome.classList.remove('scene-ready'));

  function updateDate() {
    const now = new Date();
    const months = ['一','二','三','四','五','六','七','八','九','十','十一','十二'];
    document.getElementById('welcomeMonth').textContent = months[now.getMonth()] + '月';
    document.getElementById('welcomeDay').textContent = now.getDate();
    try {
      const lunar = window.Solar.fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate()).getLunar();
      document.getElementById('welcomeLunar').textContent = lunar.getYearInGanZhi() + '年 ' + lunar.getMonthInChinese() + '月' + lunar.getDayInChinese();
    } catch (_) { document.getElementById('welcomeLunar').textContent = now.getFullYear() + '年'; }
  }

  function enter(view) {
    if (view === 'scroll') document.getElementById('tabScroll').click();
    else if (view === 'seasons') document.getElementById('tabSeasons').click();
    else document.getElementById('btnToday').click();
    app.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }

  motionButton.addEventListener('click', () => {
    paused = !paused;
    try { sessionStorage.setItem('yq-scene-paused', paused ? '1' : '0'); } catch (_) {}
    if (window.SeasonalFX) SeasonalFX.setPaused(paused);
    syncMotion();
  });
  document.addEventListener('season:motion', event => { paused = event.detail.paused; syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  reducedMotion.addEventListener('change', syncMotion);
  new ResizeObserver(fitScene).observe(welcome);
  new IntersectionObserver(entries => {
    welcome.classList.toggle('is-offscreen', !entries[0].isIntersecting);
  }, { threshold: .02 }).observe(welcome);

  document.getElementById('welcomeEnter').addEventListener('click', () => enter('cal'));
  document.getElementById('welcomeBrowse').addEventListener('click', () => enter('scroll'));
  document.getElementById('welcomeSeasons').addEventListener('click', () => enter('seasons'));
  document.getElementById('returnWelcome').addEventListener('click', () => {
    updateDate();
    welcome.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  });

  app.inert = false;
  updateDate();
  fitScene();
  readyScene();
  if (landscape.complete && !landscape.naturalWidth) recoverLandscape();
  syncMotion();
  if (window.location.hash === '#seasons') enter('seasons');
})();
