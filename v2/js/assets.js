/* 正式素材注册表：路径以 v2/ 为基准，加载失败时自动退回山水线描。 */
window.V2Assets = (() => {
  const { el } = V2;
  const asset = (id, title, file, color) => ({ id, title, file, url:file, color, missing:false });

  const manifest = {
    wordmark: asset('BRD-001', '一页千秋书法字标', 'assets/brand/yiye-qianqiu-wordmark@2x.webp', '#CFC4AB'),
    seal: asset('BRD-002', '一页千秋朱文落款章', 'assets/brand/yiye-qianqiu-seal.webp', '#A6382E'),
    empty: asset('EMP-001', '史册留白山水', 'assets/calendar/blank-day-landscape.webp', '#D9D9C8'),
    night: asset('LBK-001', '千年回望夜山河', 'assets/lookback/night-landscape-2880.webp', '#253F43'),
    battle: asset('EVT-002', '题材 · 烽烟山河', 'assets/events/battle-v1.webp', '#9B8972'),
    assembly: asset('EVT-003', '题材 · 灯下集议', 'assets/events/assembly-v1.webp', '#B5A28B'),
    labour: asset('EVT-004', '题材 · 工区晨烟', 'assets/events/labour-v1.webp', '#9EA998'),
    spaceflight: asset('EVT-005', '题材 · 破云问天', 'assets/events/spaceflight-v1.webp', '#879AA4'),
    voyage: asset('EVT-001', '史事 · 郑和下西洋', 'assets/events/zhenghe-voyage.webp', '#9DB9B0'),
    diplomacy: asset('EVT-006', '题材 · 使节会晤', 'assets/events/diplomacy-v1.webp', '#C8BC9E'),
    disaster: asset('EVT-007', '题材 · 江河灾异', 'assets/events/disaster-v1.webp', '#A6B6B1'),
    engineering: asset('EVT-008', '题材 · 山河工程', 'assets/events/engineering-v1.webp', '#B7BDAB'),
    people: asset('EVT-009', '题材 · 书斋怀人', 'assets/events/people-v1.webp', '#CAB9A0'),
    memorial: asset('EVT-010', '题材 · 礼仪纪念', 'assets/events/memorial-v1.webp', '#C6AA98'),
    city: asset('EVT-011', '题材 · 城市市井', 'assets/events/city-v1.webp', '#B7C2B0'),
    spring: asset('SEA-SPRING', '春 · 桃枝新绿', 'assets/seasons/branch-spring.webp', '#C4D3B7'),
    summer: asset('SEA-SUMMER', '夏 · 荷风清润', 'assets/seasons/branch-summer.webp', '#AEC7B7'),
    autumn: asset('SEA-AUTUMN', '秋 · 霜叶金枝', 'assets/seasons/branch-autumn.webp', '#D2B78D'),
    winter: asset('SEA-WINTER', '冬 · 红梅映雪', 'assets/seasons/branch-winter.webp', '#BDCBCD')
  };

  const termFiles = {
    '立春':'jieqi-01-lichun.webp', '雨水':'jieqi-02-yushui.webp', '惊蛰':'jieqi-03-jingzhe.webp',
    '春分':'jieqi-04-chunfen.webp', '清明':'jieqi-05-qingming.webp', '谷雨':'jieqi-06-guyu.webp',
    '立夏':'jieqi-07-lixia.webp', '小满':'jieqi-08-xiaoman.webp', '芒种':'jieqi-09-mangzhong.webp',
    '夏至':'jieqi-10-xiazhi.webp', '小暑':'jieqi-11-xiaoshu.webp', '大暑':'jieqi-12-dashu.webp',
    '立秋':'jieqi-13-liqiu.webp', '处暑':'jieqi-14-chushu.webp', '白露':'jieqi-15-bailu.webp',
    '秋分':'jieqi-16-qiufen.webp', '寒露':'jieqi-17-hanlu.webp', '霜降':'jieqi-18-shuangjiang.webp',
    '立冬':'jieqi-19-lidong.webp', '小雪':'jieqi-20-xiaoxue.webp', '大雪':'jieqi-21-daxue.webp',
    '冬至':'jieqi-22-dongzhi.webp', '小寒':'jieqi-23-xiaohan.webp', '大寒':'jieqi-24-dahan.webp'
  };
  V2Data.JQ_ORDER.forEach((name, i) => {
    const file = termFiles[name];
    manifest['term' + i] = asset('JQ-' + String(i + 1).padStart(3, '0'), '节气 · ' + name, 'assets/seasons/' + file, '#B8C6AF');
  });

  function slot(item, compact = false) {
    const box = el('div', { class: 'asset-placeholder' + (compact ? ' asset-placeholder--compact' : ''), dataset: { asset: item.id } });
    box.style.setProperty('--asset-color', item.color);
    const status = el('small', {text:item.missing ? '画面暂不可用 · 山水线描' : '图片载入中'});
    const sketch = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    sketch.setAttribute('viewBox', '0 0 800 480');
    sketch.setAttribute('aria-hidden', 'true');
    sketch.classList.add('fallback-sketch');
    sketch.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="2"><path d="M0 340 90 230 150 280 270 100 400 310 480 210 610 350 710 240 800 320M180 300 270 100 300 230 350 200M0 380Q200 340 400 380T800 380M0 415Q200 385 430 415T800 415"/><circle cx="610" cy="110" r="35"/></g>';
    box.append(sketch);
    box.append(el('span', {class:'asset-id', text:item.id}), el('strong', {text:item.title}), status);
    if (item.url) {
      const image = el('img', {src:item.url, alt:item.title});
      image.onload = () => box.dataset.loaded = '1';
      image.onerror = () => {
        image.remove(); delete box.dataset.loaded; box.dataset.error = '1';
        status.textContent = '图片暂不可用 · 山水线描';
      };
      box.append(image);
    }
    return box;
  }

  function forEvent(item) {
    const art = window.EventArt && EventArt.resolve(item);
    if (!art || art.category === '朝代' || art.category === '节令') return null;
    return {...art, id:art.assetId, direct:'../assets/' + art.file + '-1536.webp', missing:false};
  }

  const termFor = index => manifest['term' + (((index % 24) + 24) % 24)];
  const branchFor = season => manifest[season];
  const calendarBranch = month => manifest[['winter','winter','spring','spring','spring','summer','summer','summer','autumn','autumn','autumn','winter'][month - 1]];

  return { manifest, slot, forEvent, termFor, branchFor, calendarBranch };
})();
