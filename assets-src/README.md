# assets-src — 高清母版归档

站点只消费 `.webp` / `.svg` / `.woff2`。体积偏大的**生成母版**集中存放在这里，不参与发布，也不进版本库（见根目录 `.gitignore`）。

## 结构

与消费目录 `v2/assets/` 同构镜像，路径一一对应：

```
assets-src/v2/<组>/<名称>.png   ←→   v2/assets/<组>/<名称>.webp
assets-src/v2/fonts/*.woff2     ←→   未被 fonts.css 引用的静态字重
```

| 目录 | 内容 |
| --- | --- |
| `v2/brand/` | 书法字标、朱文印章母版 |
| `v2/hero/` | 首屏桌面 / 手机 / 全景母版（`*-master.png`） |
| `v2/textures/` | 绢纹、历纸平铺母版 |
| `v2/calendar/` | 纸历结构、翻页、四季枝叶母版 |
| `v2/scroll/` | 十四时代画段与过渡段母版 |
| `v2/events/` | 十一类入画史事背景母版 |
| `v2/seasons/` | 圆窗、四季枝叶、二十四节气小景母版 |
| `v2/lookback/` | 千年回望夜景母版 |
| `v2/fonts/` | 未启用的静态字重（运行时只用 `qianqiu-serif-variable.woff2`，仍留在站点目录） |

## 规则

- **不要**把这里的文件挪回 `v2/assets/`：站点按同名 `.webp` 取图，母版只用于重新导出和质检。
- 需要重新导出 WebP 时，从本目录取源图，输出到 `v2/assets/<组>/`。
- `v2/assets/fonts/qianqiu-serif-variable.woff2` 被 `fonts.css` 直接引用，**必须**留在站点目录内。
- `v2/assets/manifest.json` 的 `rasters` 只登记发布目录内实际存在的 WebP。原 PNG 快照保存在 `archivedSources`，其中 `originalPath` 为迁移前路径，`archivePath` 为本目录下的归档位置。母版不进版本库，发布校验不要求其存在；原生尺寸、Alpha 与 SHA-256 历史记录仍可查询。
