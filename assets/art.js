/* ============================================================
   一页千秋 · 朝代场景插画
   14 个历史时期 + 节气，纯 SVG 线描，currentColor 描边
   零外部图片依赖，离线可用
   ============================================================ */
(function () {
  "use strict";

  var rep = function (n, fn) { var s = "", i; for (i = 0; i < n; i++) s += fn(i); return s; };

  function wrap(inner) {
    return '<svg class="scene-svg" viewBox="0 0 440 280" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
      '<g class="bg" fill="currentColor" stroke="none">' +
        '<ellipse cx="220" cy="266" rx="214" ry="42" opacity=".045"/>' +
        '<ellipse cx="220" cy="132" rx="156" ry="88" opacity=".026"/>' +
      '</g>' +
      '<g class="ink" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round">' +
      inner +
      '</g></svg>';
  }

  var G = '<path d="M40 218h360" opacity=".28"/>';   // 地平线
  var WASH = 'fill="currentColor" stroke="none" opacity=".13"';

  var S = {};

  /* 夏商周 · 青铜鼎 */
  S.xia = function () {
    return wrap(
      '<path d="M40 218h360" opacity=".28"/>' +
      '<path d="M60 218 L112 184 L152 204 L200 176 L250 218" opacity=".38"/>' +
      /* 口沿 */
      '<path d="M144 122 h152 v16 h-152 z" ' + WASH + '/>' +
      '<path d="M144 122 h152 v16 h-152 z"/>' +
      /* 鼎腹 */
      '<path d="M152 138 h136 l-14 74 h-108 z" ' + WASH + '/>' +
      '<path d="M152 138 h136 l-14 74 h-108 z"/>' +
      /* 立耳 */
      '<path d="M164 122 v-24 h20 v24"/>' +
      '<path d="M256 122 v-24 h20 v24"/>' +
      /* 三足 */
      '<path d="M170 212 l-10 24"/><path d="M220 212 v24"/><path d="M270 212 l10 24"/>' +
      /* 云雷纹 */
      rep(5, function (i) {
        return '<path d="M' + (166 + i * 24) + ' 156 h15 v11 h-15" opacity=".45"/>';
      }) +
      /* 兽面 */
      '<path d="M186 178 h14 v12 h-14 z" opacity=".45"/>' +
      '<path d="M240 178 h14 v12 h-14 z" opacity=".45"/>' +
      '<path d="M220 178 v14" opacity=".4"/>'
    );
  };

  /* 春秋战国 · 竹简与剑 */
  S.cq = function () {
    return wrap(
      G +
      rep(7, function (i) {
        var x = 116 + i * 17, top = 92 + (i % 3) * 4;
        return '<path d="M' + x + ' ' + top + ' v' + (112 - (i % 3) * 4) + '" opacity=".85"/>';
      }) +
      '<path d="M112 112 h110" /><path d="M112 188 h110"/>' +
      '<path d="M138 112 v76" opacity=".18"/><path d="M199 112 v76" opacity=".18"/>' +
      /* 剑：身 · 格 · 柄 · 首 */
      '<path d="M303 54 L308 76 V206 H298 V76 Z" ' + WASH + '/>' +
      '<path d="M303 54 L308 76 V206 H298 V76 Z"/>' +
      '<path d="M284 206 h38"/>' +
      '<path d="M299 206 v28 h8 v-28"/>' +
      '<circle cx="303" cy="240" r="7"/>' +
      '<circle cx="252" cy="96" r="4" opacity=".3"/><circle cx="264" cy="124" r="3" opacity=".24"/>' +
      '<path d="M58 152 q22 -18 44 0 q-22 18 -44 0" opacity=".2"/>'
    );
  };

  /* 秦 · 长城与烽燧 */
  S.qin = function () {
    return wrap(
      G +
      '<circle cx="342" cy="82" r="30" opacity=".38"/>' +
      '<path d="M40 192 L96 148 L150 180 L214 140 L282 176 L344 142 L400 174" opacity=".5"/>' +
      '<path d="M40 208 L96 164 L150 196 L214 156 L282 192 L344 158 L400 190"/>' +
      '<path d="M204 156 v-28 h20 v28"/>' +
      '<path d="M200 128 h28"/><path d="M204 120 h20"/>' +
      rep(8, function (i) {
        var x = 52 + i * 18;
        if (x > 190 && x < 232) return '';
        return '<path d="M' + x + ' ' + (162 + (i % 3) * -6) + ' v-7" opacity=".7"/>';
      }) +
      '<path d="M356 190 v-14 M372 190 v-14 M388 190 v-14" opacity=".3"/>'
    );
  };

  /* 汉 · 双阙与云气 */
  S.han = function () {
    return wrap(
      G +
      '<circle cx="372" cy="66" r="21" opacity=".28"/>' +
      /* 主阙 */
      '<path d="M100 218 V124 h48 v94" ' + WASH + '/>' +
      '<path d="M100 218 V124 h48 v94"/>' +
      '<path d="M92 124 h64"/>' +
      '<path d="M96 110 h56 v14"/>' +
      '<path d="M90 110 h68"/>' +
      '<path d="M116 124 v94" opacity=".2"/>' +
      /* 副阙 */
      '<path d="M300 218 V156 h44 v62" ' + WASH + '/>' +
      '<path d="M300 218 V156 h44 v62"/>' +
      '<path d="M292 156 h60"/>' +
      '<path d="M296 142 h52"/>' +
      '<path d="M316 156 v62" opacity=".2"/>' +
      /* 云气纹 */
      rep(2, function (i) {
        return '<path d="M170 ' + (126 + i * 26) + ' q26 -12 52 0 q26 12 52 0" opacity=".26"/>';
      }) +
      /* 五铢钱 */
      '<circle cx="220" cy="196" r="17" opacity=".55"/>' +
      '<path d="M213 189 h14 v14 h-14 z" opacity=".55"/>' +
      /* 飞鸟 */
      '<path d="M256 92 q7 -7 14 0" opacity=".35"/>' +
      '<path d="M276 82 q6 -6 12 0" opacity=".28"/>'
    );
  };

  /* 魏晋南北朝 · 竹林与佛光 */
  S.sj = function () {
    return wrap(
      G +
      rep(5, function (i) {
        var x = 74 + i * 26, top = 96 + (i % 2) * 26;
        return '<path d="M' + x + ' 218 V' + top + '" opacity=".8"/>' +
          '<path d="M' + x + ' ' + (150 + (i % 2) * 12) + ' h13" opacity=".55"/>' +
          '<path d="M' + x + ' ' + (186 - (i % 2) * 8) + ' h-11" opacity=".45"/>';
      }) +
      '<path d="M300 218 L322 86 L404 218" opacity=".4"/>' +
      '<circle cx="322" cy="112" r="19" opacity=".45"/>' +
      '<circle cx="322" cy="112" r="11" opacity=".25"/>' +
      '<path d="M296 196 q20 -16 42 0" />' +
      '<path d="M301 176 h32" opacity=".5"/>' +
      '<path d="M250 118 q18 -22 36 -6 q-16 20 -36 6" opacity=".22"/>'
    );
  };

  /* 隋 · 运河与拱桥 */
  S.sui = function () {
    return wrap(
      '<path d="M40 226h360" opacity=".28"/>' +
      rep(4, function (i) {
        return '<path d="M40 ' + (194 + i * 11) + ' q30 -7 60 0 t60 0 t60 0 t60 0 t60 0" opacity="' + (0.36 - i * 0.07).toFixed(2) + '"/>';
      }) +
      /* 拱桥 */
      '<path d="M118 196 q62 -78 124 0" ' + WASH + '/>' +
      '<path d="M118 196 q62 -78 124 0"/>' +
      '<path d="M106 196 h148"/>' +
      rep(8, function (i) {
        var t = i / 7, x = 118 + 124 * t, y = 196 - 156 * t * (1 - t);
        return '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' v-11" opacity=".5"/>';
      }) +
      rep(7, function (i) {
        var t0 = i / 7, t1 = (i + 1) / 7;
        var x0 = 118 + 124 * t0, y0 = 196 - 156 * t0 * (1 - t0) - 11;
        var x1 = 118 + 124 * t1, y1 = 196 - 156 * t1 * (1 - t1) - 11;
        return '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" opacity=".4"/>';
      }) +
      /* 桥下舟 */
      '<path d="M288 210 q26 15 52 0"/>' +
      '<path d="M314 210 v-48"/>' +
      '<path d="M314 168 q26 11 26 40 q-26 8 -26 0 z" ' + WASH + '/>' +
      '<path d="M314 168 q26 11 26 40 q-26 8 -26 0"/>' +
      '<circle cx="392" cy="72" r="18" opacity=".26"/>'
    );
  };

  /* 唐 · 城楼与浮屠 */
  S.tang = function () {
    return wrap(
      '<path d="M40 218h360" opacity=".28"/>' +
      '<circle cx="372" cy="58" r="23" opacity=".4"/>' +
      /* 城台 */
      '<path d="M96 218 V160 h140 v58" ' + WASH + '/>' +
      '<path d="M96 218 V160 h140 v58"/>' +
      '<path d="M86 160 h160"/>' +
      /* 门洞 */
      '<path d="M150 218 v-28 a17 17 0 0 1 34 0 v28"/>' +
      /* 窗 */
      '<path d="M120 176 h16 v16 h-16 z" opacity=".55"/>' +
      '<path d="M198 176 h16 v16 h-16 z" opacity=".55"/>' +
      /* 城楼 */
      '<path d="M120 160 v-32 h94 v32"/>' +
      /* 重檐 */
      '<path d="M104 128 q42 -32 126 0"/>' +
      '<path d="M112 128 h110"/>' +
      '<path d="M130 96 q30 -26 74 0"/>' +
      '<path d="M138 96 h58"/>' +
      '<path d="M167 96 v-14"/>' +
      /* 浮屠 */
      '<path d="M312 202 L326 76 M348 202 L334 76" opacity=".55"/>' +
      rep(6, function (i) {
        var w = 46 - i * 3, y = 202 - i * 24, x = 330 - w / 2;
        return '<path d="M' + x + ' ' + y + ' h' + w + '"/>';
      }) +
      '<path d="M326 76 h8"/><path d="M330 64 v12"/>' +
      '<path d="M330 52 l4 8 h-8 z" ' + WASH + '/>'
    );
  };

  /* 五代十国 · 断壁与残旗 */
  S.wudai = function () {
    return wrap(
      G +
      /* 左段城墙 */
      '<path d="M48 218 V136 h100 v82" ' + WASH + '/>' +
      '<path d="M48 218 V136 h100 v82"/>' +
      rep(4, function (i) {
        return '<path d="M' + (56 + i * 24) + ' 136 v-12 h12 v12"/>';
      }) +
      /* 右段城墙 */
      '<path d="M252 218 V136 h100 v82" ' + WASH + '/>' +
      '<path d="M252 218 V136 h100 v82"/>' +
      rep(4, function (i) {
        return '<path d="M' + (260 + i * 24) + ' 136 v-12 h12 v12"/>';
      }) +
      /* 断口 */
      '<path d="M148 136 l16 -18 l-7 22"/>' +
      '<path d="M252 136 l-14 -20"/>' +
      /* 飞石 */
      rep(3, function (i) {
        return '<path d="M' + (180 + i * 26) + ' ' + (98 - i * 12) + ' l9 -11 l7 9 z" opacity=".38"/>';
      }) +
      /* 残旗 */
      '<path d="M318 136 v-48"/>' +
      '<path d="M318 88 l40 11 l-40 12" ' + WASH + '/>' +
      '<path d="M318 88 l40 11 l-40 12"/>'
    );
  };

  /* 宋 · 山水与舟 */
  S.song = function () {
    return wrap(
      G +
      '<circle cx="352" cy="70" r="24" opacity=".28"/>' +
      /* 远山 */
      '<path d="M268 192 q34 -34 66 -20 q26 12 44 -4" opacity=".15"/>' +
      /* 主峰：山脊是圆缓的曲线，不是三角 */
      '<path d="M118 218 C136 178 154 148 174 130 C184 120 194 112 205 105 C213 100 221 103 227 111 C240 128 252 154 266 218" ' + WASH + '/>' +
      '<path d="M118 218 C136 178 154 148 174 130 C184 120 194 112 205 105 C213 100 221 103 227 111 C240 128 252 154 266 218"/>' +
      /* 左次峰 */
      '<path d="M52 218 C68 190 84 172 100 160 C108 154 117 157 123 166 C136 184 144 200 150 218" opacity=".7"/>' +
      /* 右次峰，与主峰留出山谷 */
      '<path d="M276 218 q22 -40 46 -54 q14 -8 22 5 q12 20 20 49" opacity=".5"/>' +
      /* 皴：山体肌理 */
      '<path d="M178 170 l14 26" opacity=".22"/>' +
      '<path d="M198 148 l10 30" opacity=".2"/>' +
      '<path d="M218 132 l8 34" opacity=".18"/>' +
      '<path d="M166 188 l10 20" opacity=".2"/>' +
      /* 水面 */
      rep(3, function (i) {
        return '<path d="M' + (66 + i * 70) + ' ' + (204 + i * 5) + ' q30 -7 60 0" opacity="' + (0.28 - i * 0.07).toFixed(2) + '"/>';
      }) +
      /* 一叶小舟 */
      '<path d="M258 214 q22 10 44 0 z"/>' +
      '<path d="M280 214 v-16"/>' +
      '<path d="M280 200 l14 8" opacity=".45"/>'
    );
  };

  /* 元 · 草原与弓 */
  S.yuan = function () {
    return wrap(
      G +
      '<path d="M40 210 q90 -46 180 0 t180 0" opacity=".4"/>' +
      '<path d="M104 202 q0 -52 42 -52 t42 52" ' + WASH + '/>' +
      '<path d="M104 202 q0 -52 42 -52 t42 52"/>' +
      '<path d="M130 202 v-26 h32 v26"/>' +
      '<path d="M124 158 h52"/><path d="M132 148 h36" opacity=".5"/>' +
      '<path d="M318 94 q58 62 0 120" stroke-width="2.1"/>' +
      '<path d="M318 94 L318 214"/>' +
      '<path d="M286 154 h64"/>' +
      '<path d="M286 154 l10 -6 v12 z" ' + WASH + '/>' +
      '<path d="M286 154 l10 -6 v12 z"/>' +
      '<path d="M220 96 q12 -10 24 0" opacity=".25"/>'
    );
  };

  /* 明 · 宝船与浪 */
  S.ming = function () {
    return wrap(
      '<path d="M40 190h360" opacity=".28"/>' +
      '<path d="M118 192 q72 44 204 0" ' + WASH + '/>' +
      '<path d="M118 192 q72 44 204 0"/>' +
      '<path d="M128 192 h184"/>' +
      rep(3, function (i) {
        var x = 176 + i * 54;
        return '<path d="M' + x + ' 192 V' + (108 + i * 8) + '"/>' +
          '<path d="M' + (x + 2) + ' ' + (118 + i * 8) + ' q32 12 32 48 q-32 8 -32 0 z" ' + WASH + '/>' +
          '<path d="M' + (x + 2) + ' ' + (118 + i * 8) + ' q32 12 32 48 q-32 8 -32 0"/>';
      }) +
      rep(3, function (i) {
        return '<path d="M40 ' + (216 + i * 13) + ' q40 -9 80 0 t80 0 t80 0 t80 0" opacity="' + (0.36 - i * 0.09).toFixed(2) + '"/>';
      }) +
      '<circle cx="80" cy="72" r="18" opacity=".25"/>'
    );
  };

  /* 清 · 园林月洞门与太湖石 */
  S.qing = function () {
    return wrap(
      G +
      /* 粉墙 */
      '<path d="M96 108 V218" /><path d="M286 108 V218"/>' +
      '<path d="M90 108 H292"/>' +
      /* 瓦檐与小瓦当 */
      '<path d="M94 98 H288" opacity=".55"/>' +
      rep(9, function (i) {
        return '<path d="M' + (101 + i * 21) + ' 98 v-6" opacity=".26"/>';
      }) +
      '<path d="M96 112 H286" opacity=".28"/>' +
      /* 月洞门：圆心落在地平线上，洞底与地面齐 */
      '<circle cx="191" cy="170" r="48" ' + WASH + '/>' +
      '<circle cx="191" cy="170" r="48"/>' +
      /* 洞内竹影 */
      '<path d="M180 218 V160" opacity=".2"/>' +
      '<path d="M191 218 V150" opacity=".16"/>' +
      '<path d="M202 218 V164" opacity=".2"/>' +
      /* 太湖石：瘦、皱、漏、透 —— 折线轮廓才有石的棱角 */
      '<path d="M304 218 L311 198 L306 182 L315 166 L310 150 L320 139 L331 146 L326 161 L335 173 L329 186 L338 200 L332 213 L336 218" ' + WASH + '/>' +
      '<path d="M304 218 L311 198 L306 182 L315 166 L310 150 L320 139 L331 146 L326 161 L335 173 L329 186 L338 200 L332 213 L336 218"/>' +
      /* 皱：石面皴线 */
      '<path d="M316 158 L320 172" opacity=".3"/>' +
      '<path d="M328 180 L324 194" opacity=".28"/>' +
      '<path d="M314 196 L318 208" opacity=".26"/>' +
      /* 透：孔洞 */
      '<path d="M315 170 L322 168 L321 176 L314 175 Z" opacity=".42"/>' +
      '<path d="M330 190 L335 192 L333 199 L328 197 Z" opacity=".38"/>' +
      /* 竹 */
      '<path d="M382 218 V146" opacity=".4"/>' +
      '<path d="M382 176 q20 -12 32 -4" opacity=".34"/>' +
      '<path d="M382 198 q-18 -8 -28 -2" opacity=".34"/>' +
      '<path d="M382 160 q16 -10 26 -3" opacity=".28"/>' +
      /* 墙外树影 */
      '<path d="M50 218 v-46" opacity=".16"/>' +
      '<path d="M32 176 q16 -26 40 -14 q16 8 6 22" opacity=".2"/>'
    );
  };

  /* 民国 · 洋楼与路灯 */
  S.minguo = function () {
    return wrap(
      G +
      '<path d="M92 218 V112 h152 v106" ' + WASH + '/>' +
      '<path d="M92 218 V112 h152 v106"/>' +
      '<path d="M86 112 h164"/>' +
      '<path d="M110 112 v-15 h34 v15" opacity=".6"/>' +
      rep(3, function (i) {
        return rep(3, function (j) {
          return '<path d="M' + (108 + j * 46) + ' ' + (134 + i * 30) + ' h22 v17 h-22 z" opacity=".55"/>';
        });
      }) +
      '<path d="M300 218 V96"/><circle cx="300" cy="84" r="11"/>' +
      '<path d="M280 96 h40"/>' +
      '<path d="M320 178 h52 v38 h-52 z" ' + WASH + '/>' +
      '<path d="M320 178 h52 v38 h-52 z"/>' +
      rep(3, function (i) {
        return '<path d="M326 ' + (187 + i * 9) + ' h40" opacity=".5"/>';
      })
    );
  };

  /* 共和国 · 天际线与卫星 */
  S.prc = function () {
    return wrap(
      '<path d="M40 218h360" opacity=".28"/>' +
      rep(11, function (i) {
        var h = 40 + ((i * 37) % 74), x = 68 + i * 28;
        return '<path d="M' + x + ' 218 v-' + h + ' h20 v' + h + ' z" ' + WASH + '/>' +
          '<path d="M' + x + ' 218 v-' + h + ' h20 v' + h + '"/>';
      }) +
      '<path d="M52 128 q150 -74 340 -20" opacity=".22"/>' +
      '<circle cx="150" cy="76" r="9"/>' +
      '<path d="M129 76 h9 M162 76 h9" opacity=".6"/>' +
      '<path d="M132 62 q18 -12 36 0" opacity=".5"/>' +
      '<path d="M150 55 v10" opacity=".4"/>'
    );
  };

  /* 节令 · 圭表与云 */
  S.jieqi = function () {
    return wrap(
      G +
      '<circle cx="220" cy="132" r="60" opacity=".4"/>' +
      '<circle cx="220" cy="132" r="44" opacity=".18"/>' +
      '<path d="M220 132 V72"/>' +
      rep(12, function (i) {
        var a = i * Math.PI / 6;
        return '<path d="M' + (220 + 60 * Math.sin(a)).toFixed(1) + ' ' + (132 - 60 * Math.cos(a)).toFixed(1) +
          ' L' + (220 + 68 * Math.sin(a)).toFixed(1) + ' ' + (132 - 68 * Math.cos(a)).toFixed(1) + '" opacity=".5"/>';
      }) +
      '<path d="M220 132 L268 170" stroke-width="2.2"/>' +
      '<circle cx="220" cy="132" r="4"/>' +
      '<path d="M62 96 q22 -20 44 -4 q16 -14 32 4" opacity=".3"/>' +
      '<path d="M300 96 q22 -20 44 -4 q16 -14 32 4" opacity=".2"/>'
    );
  };

  /* ── 后处理：加 pathLength 与逐笔延迟 ── */
  function paint(svg) {
    var i = 0;
    return svg.replace(/<(path|circle|ellipse|line|polyline|polygon)\b([^>]*)>/g, function (m, tag, attrs) {
      var d = (i++ * 0.03).toFixed(3);
      return '<' + tag + ' pathLength="1" style="--d:' + d + 's"' + attrs + '>';
    });
  }

  /* ── 事件类型 → 场景兜底 ── */
  var BY_ERA = {
    "先秦": "xia", "夏": "xia", "商": "xia", "西周": "xia", "上古": "xia",
    "春秋": "cq", "战国": "cq", "东周": "cq",
    "秦": "qin", "汉": "han", "西汉": "han", "东汉": "han", "新": "han",
    "三国": "sj", "西晋": "sj", "东晋": "sj", "晋": "sj", "魏": "sj", "蜀": "sj", "吴": "sj",
    "南北朝": "sj", "魏晋": "sj",
    "隋": "sui", "唐": "tang", "五代": "wudai", "五代十国": "wudai",
    "宋": "song", "北宋": "song", "南宋": "song", "辽": "song", "金": "song",
    "元": "yuan", "明": "ming", "清": "qing",
    "民国": "minguo", "共和国": "prc", "节气": "jieqi", "节令": "jieqi"
  };

  function resolve(eraName) {
    // 长卷中的时期全称直接使用数据定义；别名只在此维护。
    var eras = window.ERAS || [];
    for (var i = 0; i < eras.length; i++) {
      if (eras[i].name === eraName) return eras[i].k;
    }
    return BY_ERA[eraName] || null;
  }

  window.ART = {
    scene: function (k) { return paint((S[k] || S.prc)()); },
    resolve: resolve,
    keyOf: function (eraName) { return resolve(eraName) || "prc"; },
    exists: function (k) { return !!S[k]; }
  };
})();
