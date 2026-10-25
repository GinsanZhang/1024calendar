const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (ok, message) => {
  if (!ok) throw new Error(message);
};

const html = read('index.html');
const assets = read('js/assets.js');
const data = read('js/data.js');
const views = read('js/views.js');

assert(html.includes('assets/fonts/fonts.css'), '本地字体尚未接入页面');
assert(html.includes('hero/qianqiu-landscape-reference-v2.webp'), '桌面首屏素材尚未接入');
assert(html.includes('hero/qianqiu-landscape-mobile-1080.webp'), '手机首屏素材尚未接入');
assert(html.includes('brand/yiye-qianqiu-wordmark@2x.webp'), '正式书法字标尚未接入');
assert(html.includes('lookback/night-landscape-2880.webp'), '回望夜景尚未接入');
assert(html.includes('calendar/page-turn-sheet.webp') && html.includes('calendar/paper-edge-curl.webp'), '日历翻页与卷边素材尚未接入');
assert(html.includes('assets/icons/tools.svg') && html.includes('assets/icons/motion.svg'), '界面图标集尚未接入');
assert(!html.includes('书法字标待补'), '页面仍显示品牌占位提示');
assert(!html.includes('千年回望夜山河待补'), '页面仍显示回望占位提示');

for (const key of ['battle', 'assembly', 'labour', 'spaceflight', 'voyage', 'diplomacy', 'disaster', 'engineering', 'people', 'memorial', 'city']) {
  assert(new RegExp(`${key}:\\s*asset\\([^\\n]*'assets/events/`).test(assets), `史事素材 ${key} 尚未接入`);
}
assert((assets.match(/jieqi-\d{2}-[a-z]+\.webp/g) || []).length >= 24, '二十四节气素材未完整登记');
assert(data.includes('assets/scroll/era-xia-dinghuo.webp'), '长卷正式素材尚未接入');
assert(views.includes('transition-') && views.includes('roller-left.webp'), '长卷接景或木轴尚未接入');
assert(views.includes('distance > 2') && views.includes('opacity:.18'), '跨时期远距离跳转尚未使用隐现转场');
assert(read('js/overlay.js').includes('warmReaderArt'), '事件阅读器尚未预载画作');

const manifest = JSON.parse(read('assets/manifest.json'));
for (const item of manifest.rasters || []) {
  const rel = item.path.replace(/^assets\//, 'assets/');
  assert(fs.existsSync(path.join(root, rel)), `素材清单文件缺失：${rel}`);
}

console.log(JSON.stringify({
  ok: true,
  checkedRasters: (manifest.rasters || []).length,
  integrated: ['font', 'hero', 'brand', 'calendar', 'scroll', 'events', 'seasons', 'lookback']
}, null, 2));
