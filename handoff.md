# 交接文档 · 一页千秋

> 最后更新：2026-10-26 18:50
> 当前状态：**v1 已发布上线（与本地逐字节一致）**，截图已按线上版本重出并入库；仅剩投稿表单与社媒加分项未提交。
> 工作范围：用户明确仅负责开发和优化。
> 本轮接手：修复跨年农历圆点与除夕漏标，修复三个时期画卷误用共和国场景，统一朝代解析并完成回归。详见 `docs/接手验证.md`。
> 参赛截止：2026-11-01 23:59

---

## 0. 三十秒速览

| 项 | 内容 |
|---|---|
| 作品名 | 一页千秋 · 中国历史穿越日历 |
| 一句话 | 翻一页日历，穿一回千年。 |
| 形态 | 纯前端单页，零依赖、零构建、无后端、可离线 |
| 线上链接 | https://yiye-qianqiu.app.workbuddy.host/?sharecode=VMESNWCWES |
| 本地目录 | `/Users/ginsan/WorkBuddy/1024创意/` |
| 内容量 | 267 条：公历纪事 131（覆盖 125 天）、农历纪事 20（覆盖 17 个农历日）、节气 24、朝代长卷 92（14 个时期） |
| 资源体积 | `assets/` 约 450 KiB，其中农历库约 304 KiB；**零位图请求** |
| 赛道评分 | 创意与场景价值 35 + 完成度 40 + 使用体验 25，社媒分享另加最高 30 |

**核心创意**：日历是入口，朝代长卷是纵深。点一条史事 → 墨晕从指尖铺开 → 画卷落下并逐笔画出该朝代场景 → 全站配色变成那个朝代的颜色。

---

## 1. 三条不可动的红线

这三条是作品的价值所在，后续任何改动都不该破坏。

1. **不伪造日期。** 公历纪事按公历归位，农历纪事按农历归位，两者分层展示、各带标签。绝不能把古代农历纪日硬映射到公历格子上。
2. **宁可留白，不凑数。** 366 天里只有 125 天有确切到日的记载，其余就是空的。空态文案已写好，并给出「本月另有 N 天有记载」的引导。不要为了填满而编条目。
3. **每条给得出出处。** 格式是朝代 + 纪年 + 出处（史书到篇目一级）。页脚已声明「部分年份为学界通行说法，精确卷次请核原书」。

另外两条工程红线：

4. **零外部依赖。** 不引 CDN、不调在线 API、不加位图。评审打开时必须能直接用，断网也能翻。
5. **动效可关闭。** `prefers-reduced-motion` 下粒子与转场退化为直接切换；`prefers-reduced-transparency` 下纸纹整层隐藏。

---

## 2. 先跑起来

```bash
cd "/Users/ginsan/WorkBuddy/1024创意"

# 方式 A：直接打开（全部资源都是相对路径，file:// 也能跑）
open index.html

# 方式 B：起个静态服务（推荐，避免个别浏览器对 file:// 的限制）
python3 -m http.server 8080
# 然后访问 http://localhost:8080
```

打开后自检三条：控制台无报错、日历渲染出 42 个格子、点任意一天右侧有内容或空态。

> 项目目前**不是 git 仓库**。继续改动前建议先 `git init && git add -A && git commit -m "baseline"`，把当前版本钉住。

---

## 3. 文件地图

| 路径 | 职责 | 什么时候动它 |
|---|---|---|
| `index.html` | 页面骨架：顶栏、日历视图、长卷视图、搜索/图例浮层、画卷 `#detail`、Canvas `#fx`、纸纹层 `.fiber`、墨晕层 `.veil` | 加 DOM 结构、改 meta/og |
| `assets/style.css` | 全部样式（37 KB）。含 `@property` 变量、主题、纸纹、日历、长卷、画卷、动效 | 改视觉、加组件 |
| `assets/app.js` | 交互逻辑（32 KB）：日历渲染、面板、搜索、长卷、事件绑定、画卷开关 | 改行为、加数据源 |
| `assets/art.js` | 15 幅朝代场景插画，纯内联 SVG 线描 | 加/改插画 |
| `assets/fx.js` | 氛围引擎：`Atmos` 配色 / `Dust` 粒子 / `Veil` 墨晕 | 调动效 |
| `assets/data/day-a.js` | 公历纪事 1—6 月 | 加史事 |
| `assets/data/day-b.js` | 公历纪事 7—12 月 | 加史事 |
| `assets/data/lunar.js` | 农历纪事（含传统节令） | 加农历条目 |
| `assets/data/jieqi.js` | 二十四节气释义 | 改节气文案 |
| `assets/data/eras.js` | 14 个时期的定位短述 + 92 条大事记 + 每个时期的主色 | 加朝代、改长卷内容 |
| `assets/vendor/lunar.js` | lunar-javascript 1.7.4 min（MIT，304 KB），提供农历/节气/干支 | 不要动 |
| `docs/01~06*.jpg` | 投稿截图 6 张，3200×2120，324—473 KiB，2026-10-26 按线上版本重出 | 改版后重出 |
| `scripts/check-calendar-marks.js` / `check-app.js` / `check-search.js` | 在已加载应用的浏览器执行的回归脚本：跨年圆点、搜索、14 个时期画卷和跳转 | 改行为后回归 |
| `docs/投稿材料.md` | 简介、功能清单、设计决定、技术说明、社媒文案 | 投稿时直接抄 |
| `.workbuddy/memory/2026-10-22.md` | 逐轮工作日志与踩坑原始记录 | 查历史决策 |
| `.wbapp_*.genie` / `.workbuddy/applications.yaml` | 已发布应用的 ID 绑定（`wbapp_s4vWWIYuTUTFtcX8jmxqLk`） | **发布时不要新建应用** |

### 脚本加载顺序（不能乱）

`index.html` 底部：

```
vendor/lunar.js  →  art.js  →  fx.js  →  data/day-a.js  →  day-b.js
→  data/lunar.js  →  data/jieqi.js  →  data/eras.js  →  app.js
```

`day-a.js` 与 `day-b.js` 都用 `Object.assign(window.DAY, {...})` 累加，所以两个文件必须都在 `app.js` 之前。`art.js` 先在 `window.ART` 上挂 API，`fx.js` 依赖 `window.ERAS`（运行时读，不依赖加载顺序）。

---

## 4. 架构：一条点击链路

理解这一条链路，基本就理解了整个项目。

```
用户点某一天
  └─ selectDate(y,m,d)                       app.js:629
       ├─ renderCalendar()                   重画 42 格
       ├─ renderPanel()                      右侧档案 + 千年回望
       ├─ syncAtmos(date)                   取当天最早一条史事决定色调
       └─ spark(origin)                      从格子中心迸发 26 颗粒子

用户点一条史事
  └─ openDetail(e, ev)                       app.js:278
       ├─ ART.keyOf(e.era) → 场景 key（tang/qing/…）
       ├─ Atmos.set(key)                    全站改色（CSS 变量 + @property 插值 .68s）
       ├─ Veil(x, y, color, show)           从点击点扩散的墨晕，250ms 后回调
       └─ show()
            ├─ #dScene.innerHTML = ART.scene(key)     逐笔描画（CSS inkDraw）
            ├─ 填年份水印 / 朝代标签 / 标题 / 描述 / 出处
            └─ Dust.emit(...)                 画卷上方飘散粒子
```

### 层级关系（z-index）

| 层 | z-index | 说明 |
|---|---|---|
| `.grain` / `.fiber` | 0 | 背景光晕 + 程序化纸纹 |
| `.era-bar` | 40 | 顶部 2.5px 朝代色带 |
| 主内容 `.layout` | 1—3 | 常规内容 |
| toast | 90 | 提示 |
| `#detail` 画卷 | 110 | 卡片式浮层 |
| `#fx` Canvas | 115 | **在画卷之上**，所以粒子能飘在画上 |
| `.veil` 墨晕 | 120 | 最顶层，盖住一切做转场 |

---

## 5. 数据契约（加内容只改这里）

### 公历纪事 `window.DAY["MM-DD"]`

```js
"01-01": [
  // [公元年, 朝代, 纪年, 标题, 说明, 出处]
  [1912, "民国", "民国元年", "中华民国临时政府在南京成立",
   "孙中山宣誓就任临时大总统，中国两千余年帝制就此走向终点。",
   "《中华民国史》第一编"]
]
```

- 年份：负数表示公元前（`-221` = 前 221 年）。
- `朝代`：必须能命中 `ERA_GROUP`（见 `app.js:22`），否则筛选分组会落到「全部」之外。
- `纪年`：无年号时写 `"—"` 或 `""`，UI 会自动不显示。
- 出处：写史书 + 篇目，如 `《史记·秦始皇本纪》`。

### 农历纪事 `window.LUNAR["MM-DD"]`

格式同上，但 key 是**农历月-日**（`"01-01"` = 正月初一）。`y = 0` 表示传统节令（非法定年份事件），UI 会显示「节令」而不是年份。除夕用特殊 key `"12-00"`，由 `collect()` 在检测到次日为初一时刻意挂上。

### 节气 `window.JIEQI`

```js
"立春": ["正月节", "立，建始也。……", "《月令七十二候集解》"]
//      [所在月份与位置, 释义, 出处]
```

key 必须与 lunar-javascript 的 `getJieQi()` 返回值完全一致（就用这 24 个标准名）。

### 朝代长卷 `window.ERAS`

```js
{
  k: "tang",                        // 场景 key，必须存在于 art.js 的 S 里
  name: "唐", span: "618 — 907",
  from: 618, to: 907,
  color: "#B4552F",                 // 该朝代主色，驱动全站换色
  brief: "……",                      // 长卷页首短述
  events: [
    // [公元年, 纪年, 标题, 说明, 出处]
    [626, "武德九年", "玄武门之变", "……", "《资治通鉴》卷一九一"]
  ]
}
```

**注意**：`app.js:498` 的 `RAIL_ORDER` 决定长卷里时期的展示顺序（从今往古）。新增时期必须同时加进 `RAIL_ORDER`，否则不会出现在轴上。

---

## 6. 全局 API 速查

```js
// 场景插画（art.js）
ART.scene("tang")        // → SVG 字符串
ART.keyOf("北宋")        // → "song"（朝代名 → 场景 key，含别名表）
ART.resolve("魏晋南北朝") // → "sj"；未知名称返回 null；先查 ERAS 全称，再查 BY_ERA 别名
ART.exists("qing")       // → true

// 配色（fx.js）
Atmos.set("qing")        // 全站切到清代配色
Atmos.refresh()          // 主题切换后重算（已由 MutationObserver 自动调用）
Atmos.current()          // → "qing"

// 粒子（fx.js）
Dust.emit(x, y, 26, { shape: "petal", power: 1.2 })
// shape: square(先秦) / streak(春秋、元) / petal(汉、唐、清) / dot(其余)
Dust.setColor(color, hue)

// 墨晕转场（fx.js）
Veil(x, y, "#B4552F", callback)   // 250ms 后执行 callback，700ms 后自动清理
```

朝代解析统一由 `ART.resolve()` 完成：先按 `ERAS.name` 查时期全称，再查 `art.js` 的唯一 `BY_ERA` 别名表。`ART.keyOf()`、`app.js` 的 `eraKeyOf()` 和 `jumpToEra()` 均复用它；`PARTICLE` 只负责场景 key → 粒子形状。文中旧行号仅作参考，以函数名定位为准。

---

## 7. 常见改动怎么做

**加一条公历史事**：在 `day-a.js` / `day-b.js` 对应日期数组里 push 一条六元组。注意按年份升序排列更易读，代码不强制。

**加一条农历纪事**：`data/lunar.js` 里按农历月日加；若是纯节令，年份写 `0`。

**加一个朝代**：① `eras.js` 加对象（含 `k/name/span/from/to/color/brief/events`）；② `art.js` 加 `S.新key` 场景，额外别名只加到 `BY_ERA`，时期全称由 `ERAS` 自动解析；③ `app.js` 更新筛选 `ERA_GROUP`、粒子 `PARTICLE` 和轴顺序 `RAIL_ORDER`。不再维护额外的场景或跳转映射。

**改某朝代颜色**：只改 `eras.js` 里的 `color`，其余由 `Atmos.set()` 自动派生（主色、纸色、卡片色、光晕、色带全部跟着变）。

**画一幅新场景**：只写 `inner`，由 `wrap()` 统一包 `<svg viewBox="0 0 440 280">`，笔画用 `stroke="currentColor"`、`fill="none"`，需要色块用 `WASH` 常量。**不要写死颜色**，否则换朝代不跟随。

**调纸纹**：`style.css` 顶部 4 个 `--tex-*` 变量（`mottle` 云斑 / `swell` 中频 / `grain` 颗粒），改 `baseFrequency` 与 `width/height` 时要成对计算（见 §8 第 1 条）。

---

## 8. 踩过的坑（复现条件已写明，别再踩）

1. **`feTurbulence` 无缝平铺的前提是 `baseFrequency × 画布尺寸 = 整数`。**
   曾经 400×0.013=5.2、240×0.92=220.8，页面上出现大片可见方块。现用 0.01×300=3（云斑）、0.04×200=8（中频）、0.85×200=170（颗粒），全部整除。

2. **x/y 频率相差悬殊会长出「连续横纹」**，观感像木纹或拉丝金属。试过横竖两层补偿，结果变成十字网格，更假。**最终全部各向同性（x=y）**，靠多尺度叠加出纸感。

3. **深色模式下 `soft-light` + opacity .5 会把整页压浑**，文字丢对比。现用 `overlay` + .12，并**去掉低频云斑**——暗底上低频平铺边界会被 overlay 放大成可见方框。

4. **纸色别调过头。** 首版 `paperS` 给到 46%，清代日期把整页压成阴天灰，纸感尽失。现在 `paperL = 95.2`、`paperS = clamp(s*0.5, 6, 17)`，只做极轻色偏，「换了个时代」的感觉交给 `--zhu` 和光晕。

5. **粒子太小看不见。** 首版 r 0.9—2.6、初速 1.4—5.2，几乎不可见。现为 r 1.3—3.4、初速 2.0—7.4。

6. **测试主题切换不能直接改 `data-theme`。** 那样会绕过 `Atmos` 的颜色重算，朝代 inline 变量仍是浅色值，结论是假的。必须点按钮。

7. **别用缩略图判断渲染问题。** 曾在截图里看到「方块接缝」，用 ffmpeg 转 rgb24 做逐像素差分后确认背景 `(30,27,26)→(52,45,42)` 是连续渐变，最大跳变只在文字边缘——是查看器缩放伪影。**先量像素，再下结论。**

8. **抛物线别混用贝塞尔。** 隋代拱桥首版栏杆悬空，因为桥面用 `y = 196 - 156t(1-t)`，栏杆控制点却按贝塞尔算。统一公式后正常。

9. **场景插画最容易「像别的东西」。** 首版鼎画成小房子带笑脸、剑画成权杖、汉车马像手推车、五代像两个集装箱、唐城楼像凳子、清月洞门竖椭圆悬空。改法：先定地平线 `y=218`、结构必须有基座接地、对称物先算中心线。

10. **移动端多层 blend 拖累滚动。** ≤760px 时纹理从五层减到两层。

---

## 9. 验证怎么做

本项目没有测试框架，靠 headless 浏览器实测。本轮使用 agent-browser + 本机 Chrome，启动本地 HTTP 服务后执行以下浏览器回归脚本（均无项目运行依赖）：

```bash
agent-browser --session yiye open http://127.0.0.1:8765
agent-browser --session yiye eval --stdin < scripts/check-calendar-marks.js
agent-browser --session yiye eval --stdin < scripts/check-app.js
agent-browser --session yiye eval --stdin < scripts/check-search.js
agent-browser --session yiye --json errors
agent-browser --session yiye --json console
```

`check-calendar-marks.js` 遍历 2025—2027 共 1,095 天，检查 42 格、农历圆点及无障碍计数，覆盖闰月和除夕；`check-app.js` 验证搜索、14 个时期的实际 SVG、配色、返回朝代跳转、节令画卷隐藏无效朝代入口、空态、主题切换与资源加载；`check-search.js` 验证除夕查找、纪年匹配、键盘选择、字面量空态及公历/农历跳转。下方保留原 Puppeteer 方法供参考。

```bash
# 依赖（已装在 Node 托管工作区）
NODE_PATH=/Users/ginsan/.workbuddy/binaries/node/workspace/node_modules \
  /Users/ginsan/.workbuddy/binaries/node/versions/22.22.2-6/bin/node script.js
```

用 `puppeteer-core` 连本机 Chrome（`executablePath` 指向 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`）。**不要用 `chrome --dump-dom`**，拿不到渲染后的 DOM。

### 改动后必过清单

- [ ] `pageerror` / `console.error` 为空
- [ ] 无 404（监听 `requestfailed`）
- [ ] 日历渲染 42 个 `.day`
- [ ] 点一天 → 右侧有卡片或空态；空格子给出「本月另有 N 天有记载」
- [ ] 搜索「贞观」→ 结果含唐；搜索跳转正确
- [ ] 点史事 → 画卷打开，`#dScene svg` 存在，尺寸约 600×382
- [ ] 关闭画卷 → 页面色调已切到该朝代
- [ ] 长卷 14 个 `.era-btn`，逐个点开无报错
- [ ] 深色模式下线条与文字仍可读（点按钮切，不要改属性）
- [ ] 视口 390×844 下卡片单列、不横向溢出
- [ ] 系统开启「减弱动态效果」后无粒子、无墨晕、直接切换

### 重出投稿截图

视口 1600×1060、`deviceScaleFactor: 2` → 得到 3200×2120 PNG（单张 2.5—5.5 MB），再压：

```bash
ffmpeg -i shot.png -q:v 3 shot.jpg    # → 250—450 KB
```

五张分别是：01 日历视图、02 史事画卷、03 朝代长卷、04 画卷·唐、05 深色模式。改版后需全部重出，因为截图里带朝代配色和纸纹。

---

## 10. 当前状态与待办

| 项 | 状态 | 说明 |
|---|---|---|
| 本地代码 | ✅ 完成 | 沉浸层、纸纹、跨年圆点和朝代解析修复均已验证 |
| 线上部署 | ✅ **已是最新** | 2026-10-26 按 v1（根目录 `index.html` + `assets/`）重新发布，首页 17,381 字节与本地逐字节一致；v2 未上线 |
| 投稿表单 | ❌ 未提交 | 截止 2026-11-01 23:59，需在活动页提交并勾选授权 |
| 社媒加分 | ❌ 未发布 | 文案在 `docs/投稿材料.md` 第六节，须带话题 `#WorkBuddy #1024程序员节` |
| 截图 | ✅ 已备 | 2026-10-26 按线上版本重出 6 张 3200×2120，324—473 KiB，共 2.4 MB，已入库 |
| git 版本管理 | ✅ 已推送 | https://github.com/GinsanZhang/1024calendar ，`main` 与线上内容同 tree |

### 发布方式

用 WorkBuddy 的「发布为应用」重新部署即可。**应用已存在**（`wbapp_s4vWWIYuTUTFtcX8jmxqLk`，记录在 `.wbapp_*.genie` 与 `.workbuddy/applications.yaml`），走更新而不是新建，链接和 sharecode 才不会变。发布属于对外动作，需本人确认后再执行。

---

## 11. 已知限制（诚实清单，不要当成 bug 惊喜）

1. **公历只覆盖 125/366 天**，农历只覆盖 17 个农历日。这是「不伪造」的代价，不是遗漏。
2. **跨年圆点问题已修复**：`markCount(date)` 与面板共用 `collect(date)`，按实际年份换算，并包含除夕。2025—2027 共 1,095 天回归从 67 处不一致降到 0。
3. **「千年回望」固定 100/300/500/800/1000 五档**，写在 `renderLookback()` 里。翻到公元 1000 年以前时 lunar-javascript 可能返回 null，该格农历留空，不报错。
4. **朝代映射已统一**：本轮实际复现夏商周、春秋战国、魏晋南北朝的画卷误用共和国场景。现由 `ART.resolve` 统一解析时期全称和别名，14 个时期的 SVG、配色及返回朝代跳转均通过回归。
5. **无分享图生成、无 PWA、无 Service Worker、无收藏**。离线可用只是因为全部资源本地且无网络请求，不是靠 SW。
6. **首屏最大资源是 304 KB 的农历库**。若要做极致性能，可按需裁剪年份范围，但会牺牲「任意年份可翻」的能力。

---

## 12. 接手第一步

```bash
cd "/Users/ginsan/WorkBuddy/1024创意"
git init && git add -A && git commit -m "一页千秋 baseline · 2026-10-22"
open index.html          # 确认能跑
```

然后按这个顺序推进：

1. **确认线上版本**：对比线上与本地差异，决定是否重新发布（需本人同意）。
2. **重出截图**：发布后线上即最新版，截图需与线上一致。
3. **提交投稿表单**：文案直接取 `docs/投稿材料.md` 第一、二、五节。
4. **发社媒**：小红书/公众号/知乎任一，公开可见、带话题、链接可点。
5. 本轮已修圆点与朝代解析问题。后续改动可直接运行 `scripts/` 中的三个浏览器回归脚本。

---

*本文档随代码走。改动了架构或红线，请同步更新本文，不要只留在聊天记录里。*

## 2026-10-25 事件素材清单更新

当前仓库已使用Git；本轮起点提交为 `7a54bd1`。所有243条史事新增固定事件ID（公历/农历元组第7列、长卷元组第6列），历史正文不变。取图已统一为 `assets/data/event-art.js` 注册表 + `assets/event-art.js` 解析器，主站和v2共用；ID优先，关键词仅为未登记ID兜底。明细、验收和验证命令见 `docs/事件素材映射清单.md`、`docs/事件素材验收记录.md`。本节优先于上文旧版的六列/五列数据契约及纯SVG限制。
