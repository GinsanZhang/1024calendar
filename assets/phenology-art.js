/* 二十四节气的物象与运动语言。几何均为矢量，不依赖外部图片或天气服务。 */
(function () {
  'use strict';
  const profiles={
    '立春':{id:'thaw',label:'残雪迎春',base:'petal',density:8,size:.7,speed:.6,frost:.3,melt:true,motif:'buds'},
    '雨水':{id:'spring-rain',label:'春雨润物',base:'drizzle',density:120,speed:.85,ripples:5},
    '惊蛰':{id:'spring-thunder',label:'春雷初动',base:'storm',density:290,clouds:.95,lightning:1,speed:.92,ripples:7},
    '春分':{id:'swallows',label:'燕归花飞',base:'petal',density:10,size:.75,speed:.65,motif:'swallows'},
    '清明':{id:'willow-mist',label:'柳烟薄雾',base:'cloudy',effect:'catkin',density:14,clouds:.45,fog:.6,motif:'willow'},
    '谷雨':{id:'grain-rain',label:'雨生百谷',base:'drizzle',density:190,clouds:.65,speed:1.05,ripples:9,motif:'sprouts'},
    '立夏':{id:'green-canopy',label:'绿荫流光',base:'cloudy',density:0,clouds:.05,motif:'canopy'},
    '小满':{id:'green-wheat',label:'麦穗将盈',base:'cloudy',density:0,clouds:.15,motif:'wheat',maturity:.2},
    '芒种':{id:'golden-awn',label:'芒穗随风',base:'cloudy',effect:'grain',density:13,clouds:.1,motif:'wheat',maturity:1,wind:12},
    '夏至':{id:'sun-solstice',label:'日影流转',base:'cloudy',density:0,clouds:0,motif:'sun'},
    '小暑':{id:'lotus-breeze',label:'荷风微雨',base:'petal',effect:'lotus',density:9,size:.7,speed:.55,ripples:7,motif:'lotus'},
    '大暑':{id:'storm-fireflies',label:'骤雨流萤',base:'storm',density:430,clouds:1.1,ripples:11,lightning:1,cycle:true,motif:'fireflies'},
    '立秋':{id:'first-autumn-leaf',label:'一叶知秋',base:'leaf',density:8,size:.8,speed:.65,leafVariant:2,leafColors:['#89925a','#b79a50','#9b8e59']},
    '处暑':{id:'summer-relief',label:'浮云散暑',base:'cloudy',density:0,clouds:.95,dissolve:true,motif:'heat'},
    '白露':{id:'white-dew',label:'叶尖凝露',base:'cloudy',density:0,clouds:.12,motif:'dew'},
    '秋分':{id:'golden-leaf-dance',label:'金叶旋舞',base:'leaf',density:27,size:1.05,speed:.7,wind:3,orbit:true,leafColors:['#c29a4f','#b78940','#bc9b59'],leafVariants:[0,1]},
    '寒露':{id:'cold-dew',label:'冷雾凝珠',base:'leaf',density:5,size:.65,speed:.4,clouds:.3,fog:.85,motif:'cold-dew',leafColors:['#a49374','#918676','#af9f81']},
    '霜降':{id:'fern-frost',label:'霜花蔓延',base:'frost',effect:'cloud',density:0,frost:1,clouds:.08,frostStyle:'fern'},
    '立冬':{id:'winter-wind',label:'寒风收叶',base:'leaf',density:6,speed:1.05,size:.8,wind:32,clouds:.25,motif:'wind',leafVariant:2,leafColors:['#8b7358','#9a8065','#80725e']},
    '小雪':{id:'sparse-snow',label:'疏雪轻扬',base:'light-snow',density:17,speed:.8,size:.85,clouds:.2},
    '大雪':{id:'deep-snow',label:'密雪纷飞',base:'heavy-snow',density:64,size:1.08,speed:1.05,clouds:.6},
    '冬至':{id:'long-night',label:'雪夜微光',base:'light-snow',density:10,size:.7,speed:.55,clouds:.08,motif:'night'},
    '小寒':{id:'needle-ice',label:'冰窗细纹',base:'light-snow',density:12,size:.7,speed:.5,frost:.6,frostStyle:'needle',clouds:.1},
    '大寒':{id:'winter-blizzard',label:'冰霜风雪',base:'heavy-snow',density:76,size:1.1,speed:1.3,wind:24,frost:.95,frostStyle:'fern',clouds:.75}
  };
  const leaf=new Path2D('M0 0C-10 -7 -14 -19 -2 -33C5 -24 9 -10 0 0Z');
  const lotusPetal=new Path2D('M0 1C-.8 .2 -.6 -.65 0 -1.2C.6 -.65 .8 .2 0 1Z');
  const random=i=>{const x=Math.sin(i*127.1+47.7)*43758.5453;return x-Math.floor(x);};
  const clamp=x=>Math.max(0,Math.min(1,x));
  const blade=new Path2D('M0 0C-.5 -.18 -.57 -.57 0 -1C.35 -.63 .5 -.23 0 0Z');
  const bladeVein=new Path2D('M0 -.04Q-.07 -.47 0 -.94M-.02 -.3Q-.22 -.37 -.29 -.5M-.03 -.52Q.13 -.59 .18 -.69');
  function foliage(ctx,x,y,length,width,angle,fill,vein,alpha) {
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(width,length);
    ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.fill(blade);
    ctx.strokeStyle=vein;ctx.lineWidth=.45/length;ctx.globalAlpha=alpha*.65;ctx.stroke(bladeVein);ctx.restore();
  }
  // Detailed ears are painted once at 3×. Stems and the ear's secondary sway remain live.
  // The cache is bounded by two maturities × two palettes × five botanical variations.
  const earCache=new Map();
  function wheatEar(mature,dark,variant) {
    const key=[mature,dark,variant].join('/');if(earCache.has(key))return earCache.get(key);
    const image=document.createElement('canvas');image.width=216;image.height=324;
    const c=image.getContext('2d');c.scale(3,3);c.translate(36,103);c.lineCap='round';c.lineJoin='round';
    const hue=mature?(dark?['#8f713d','#d4b66e','#f2dfaa','#ad8a48']:['#88703c','#b59b57','#e8d499','#8f743e']):(dark?['#536e50','#a8bc83','#dbe1a8','#70845b']:['#587448','#91a867','#d1d89b','#647c4e']);
    const bend=(variant-2)*.55;
    const axis=y=>bend*Math.pow(-y/58,1.5);
    c.strokeStyle=hue[0];c.lineWidth=.85;c.beginPath();c.moveTo(0,2);c.quadraticCurveTo(bend*.2,-30,bend,-62);c.stroke();
    // Lower spikelets are smaller; the full middle narrows to an asymmetric terminal spikelet.
    for(let row=0;row<10;row++)for(const sign of [-1,1]) {
      const y=-row*5.35+(sign>0?-1.5:0),taper=Math.sin((row+2)/13*Math.PI)*.8+.12;
      const sx=axis(y),spread=(6.4+random(row+variant*13)*1.3)*taper;
      const len=(10.4+random(row+41)*1.5)*(row>7?.82:1),tipX=sx+sign*spread,tipY=y-len;
      c.save();c.translate(sx,y);c.scale(sign,1);
      const hull=new Path2D();hull.moveTo(0,1.5);hull.bezierCurveTo(spread*.95,1,spread+2,-len*.48,spread,-len);hull.bezierCurveTo(spread*.35,-len*.85,-1,-len*.26,0,1.5);hull.closePath();
      const shading=c.createLinearGradient(-1,0,spread+1,-len*.4);shading.addColorStop(0,hue[0]);shading.addColorStop(.43,hue[1]);shading.addColorStop(.72,hue[2]);shading.addColorStop(1,hue[1]);
      c.fillStyle=shading;c.fill(hull);c.strokeStyle=hue[3];c.lineWidth=.3;c.stroke(hull);
      // Overlapping glumes and the fine crease make each spikelet read as a husk, not a bead.
      c.strokeStyle=hue[2];c.lineWidth=.38;c.beginPath();c.moveTo(.7,.3);c.bezierCurveTo(spread*.32,-1,spread*.77,-len*.42,spread*.91,-len*.88);c.stroke();
      c.strokeStyle=hue[0];c.globalAlpha=.65;c.lineWidth=.25;c.beginPath();c.moveTo(1,-.9);c.quadraticCurveTo(spread*.25,-len*.4,spread*.68,-len*.78);c.stroke();
      c.strokeStyle=hue[2];c.globalAlpha=.44;c.lineWidth=.24;c.beginPath();c.moveTo(spread*.25,-len*.25);c.quadraticCurveTo(spread*.6,-len*.27,spread*.82,-len*.64);c.stroke();c.restore();
      const awn=(mature?24:13)+random(row+variant*7)*9-row*.3;
      c.strokeStyle=hue[mature?1:3];c.globalAlpha=.7;c.lineWidth=.33;c.beginPath();c.moveTo(tipX,tipY);c.quadraticCurveTo(tipX+sign*2,tipY-awn*.52,tipX+sign*(3+random(row+8)*4),tipY-awn);c.stroke();
      c.globalAlpha=1;
    }
    c.strokeStyle=hue[2];c.lineWidth=.45;c.beginPath();c.moveTo(bend,-61);c.quadraticCurveTo(bend+1,-70,bend+2,-82);c.stroke();
    earCache.set(key,image);return image;
  }
  function draw(ctx,w,h,p,t,dark,mini=false) {
    const ink=dark?'#c0d3cb':'#4f7969',light=dark?'#dce7c9':'#b2c17d';
    const edge=Math.min(mini?65:105,w*.17),small=w<600;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    function stroke(color,alpha,width=1) {ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width;}
    function ellipse(x,y,rx,ry,color,alpha,rotation=0) {ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);ctx.fill();}
    function sprout(x,y,scale,phase,grown=false) {
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*.55+phase)*.055);ctx.scale(scale,scale);
      stroke(ink,.48,.85);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(3,-10,-4,-23,-1,grown?-46:-29);ctx.stroke();
      for(let j=0;j<(grown?3:2);j++) {
        const y=-9-j*10,sign=j%2?1:-1;
        foliage(ctx,-1,y,(grown?21:14)-j*2,grown?12:10,sign*1.05,j%2?ink:light,dark?'#dde5bb':'#516c46',.49);
        stroke(ink,.3,.5);ctx.beginPath();ctx.moveTo(-1,y+1);ctx.lineTo(sign*3,y-2);ctx.stroke();
      }
      foliage(ctx,-1,grown?-39:-24,9,3.5,.15,light,ink,.55);
      ctx.restore();
    }
    if(p.motif==='buds'||p.motif==='sprouts') {
      const count=small?7:15;
      for(let i=0;i<count;i++) {
        const x=w*(i+.35)/count,center=x>w*.3&&x<w*.7;
        if(center&&i%2)continue;
        sprout(x,h+2,.62+random(i)*.65,(i+1)*1.9,p.motif==='sprouts');
      }
    }
    if(p.motif==='swallows') {
      const period=mini?18:23,journey=((t+period*.38)%period)/period;
      for(let b=0;b<2;b++) {
        const s=small?10:16,x=-50+journey*(w+120)-b*s*2.8,y=h*.18+Math.sin(journey*Math.PI*2)*h*.035+b*s*1.2;
        const wing=Math.sin(t*7+b*.7)*.2;
        ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(-.08+Math.cos(journey*Math.PI)*.1);
        ctx.fillStyle=dark?'#c2ccd0':'#65766e';ctx.globalAlpha=mini?.55:.52;
        ctx.beginPath();ctx.moveTo(-.18,0);ctx.quadraticCurveTo(-.85,-.3-wing,-1.32,-.75-wing);ctx.quadraticCurveTo(-.75,.25,-.13,.19);ctx.lineTo(.12,.38);ctx.lineTo(.31,.18);ctx.quadraticCurveTo(.9,.25,1.35,-.6-wing);ctx.quadraticCurveTo(.68,-.1,.12,-.06);ctx.lineTo(.03,-.23);ctx.lineTo(-.07,-.25);ctx.closePath();ctx.fill();
        stroke(dark?'#d1d9d8':'#53675d',.6,.055);ctx.beginPath();ctx.moveTo(-.08,.1);ctx.lineTo(-.32,.65);ctx.lineTo(.03,.4);ctx.lineTo(.36,.63);ctx.lineTo(.12,.1);ctx.stroke();ctx.restore();
      }
    }
    if(p.motif==='willow') {
      for(let side=0;side<2;side++) {
        ctx.save();if(side){ctx.translate(w,0);ctx.scale(-1,1);}ctx.translate(-9,small?18:52);
        for(let b=0;b<4;b++) {
          const sway=Math.sin(t*.36+b*.6+side)*7,len=(small?75:130)+b*17;
          const ax=30+b*8,bx=40+sway+b*10,cx=25+sway+b*12;
          stroke(ink,.32,.65);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(ax,8,bx,len*.55,cx,len);ctx.stroke();
          for(let j=1;j<11;j++) {
            const f=j/11,u=1-f,x=3*u*u*f*ax+3*u*f*f*bx+f*f*f*cx,y=3*u*u*f*8+3*u*f*f*len*.55+f*f*f*len;
            const dx=3*u*u*ax+6*u*f*(bx-ax)+3*f*f*(cx-bx),dy=24*u*u+6*u*f*(len*.55-8)+3*f*f*(len*.45);
            const angle=Math.atan2(dy,dx)+Math.PI/2+(j%2?.48:-.52);
            foliage(ctx,x,y,(small?10:15)*(1-f*.28),3.6,angle,j%2?ink:light,ink,.4);
          }
        }
        ctx.restore();
      }
    }
    if(p.motif==='canopy') {
      for(let side=0;side<2;side++) {
        ctx.save();ctx.translate(side?w:0,0);ctx.scale(side?-1:1,1);ctx.rotate(Math.sin(t*.12+side)*.025);
        stroke(ink,.07,2);ctx.beginPath();ctx.moveTo(-20,-5);ctx.quadraticCurveTo(90,35,edge*1.9,170);ctx.stroke();
        for(let i=0;i<13;i++) {
          ctx.save();ctx.translate(i*edge/10,18+i*10);ctx.rotate((i%2?1:-1)*(.7+Math.sin(t*.15+i)*.03));ctx.scale((small?1.1:1.8),1.5);
          ctx.fillStyle=ink;ctx.globalAlpha=dark?.07:.045;ctx.fill(leaf);ctx.restore();
        }
        ctx.restore();
      }
      for(let i=0;i<6;i++) ellipse(w*(.13+random(i)*.72)+Math.sin(t*.1+i)*12,h*(.08+random(i+7)*.25),13+i*3,8+i,light,.04,.4);
    }
    if(p.motif==='wheat') {
      const count=mini?5:small?8:18,mature=p.maturity>.5;
      for(let i=0;i<count;i++) {
        const x=(i+.3+random(i+60)*.45)*w/count,center=x>w*.25&&x<w*.75;
        const depth=.74+random(i+9)*.34,hero=!mini&&(i<2||i>=count-2),scale=(mini?.47:small?.62:.81)*depth*(hero?1.17:1);
        const tall=((mini?45:small?67:96)+random(i)*37)*(center&&!mini?.75:1);
        const breeze=Math.sin(t*(mature?.68:.42)-i*.65),sway=breeze*(mature?.075:.045)+(random(i+31)-.5)*.1;
        const bow=(mature?8:3)+(random(i+5)-.5)*7,alpha=center&&!mini?.18:(dark?.63:.55)*depth*(hero?1.08:1);
        const stem=mature?(dark?'#c5ab76':'#9d8c59'):(dark?'#9aaf7f':'#788e59');
        ctx.save();ctx.translate(x,h+9);ctx.rotate(sway);
        stroke(stem,alpha,.65*depth);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-3,-tall*.4,bow,-tall*.77,bow,-tall);ctx.stroke();
        for(let j=0;j<2;j++) {
          const sign=(i+j)%2?1:-1,y=-tall*(.28+j*.26),length=(mini?19:small?28:43)*(1-j*.12)*depth;
          ctx.save();ctx.translate(j?bow*.4:0,y);ctx.scale(sign,1);
          ctx.globalAlpha=alpha*.72;ctx.fillStyle=stem;ctx.beginPath();ctx.moveTo(0,1);ctx.bezierCurveTo(length*.2,-length*.34,length*.7,-length*.6,length,-length*.49);ctx.bezierCurveTo(length*.65,-length*.6,length*.3,-length*.11,0,1);ctx.fill();
          ctx.strokeStyle=dark?'#d5dab0':'#b4be84';ctx.globalAlpha=alpha*.62;ctx.lineWidth=.35;ctx.beginPath();ctx.moveTo(1,0);ctx.quadraticCurveTo(length*.55,-length*.47,length*.92,-length*.49);ctx.stroke();ctx.restore();
          stroke(stem,alpha*.7,.85);ctx.beginPath();ctx.moveTo(-1,y+1);ctx.lineTo(2,y);ctx.stroke();
        }
        ctx.translate(bow,-tall);ctx.rotate((mature?.11:.025)+breeze*.035+Math.sin(t*.95-i)*.016);
        ctx.globalAlpha=alpha;ctx.drawImage(wheatEar(mature,dark,i%5),-36*scale,-103*scale,72*scale,108*scale);ctx.restore();
      }
    }
    if(p.motif==='sun') {
      const r=Math.min(w*.22,mini?80:240),cx=w*.82+Math.sin(t*.035)*w*.05,cy=h*.08+Math.cos(t*.035)*12;
      const halo=ctx.createRadialGradient(cx,cy,r*.07,cx,cy,r);
      halo.addColorStop(0,dark?'#e5bf6f17':'#dfbc5720');halo.addColorStop(.4,dark?'#d9b76c0c':'#e6c6750f');halo.addColorStop(1,'#e5bd6900');ctx.fillStyle=halo;ctx.globalAlpha=1;ctx.fillRect(cx-r,cy-r,r*2,r*2);
      stroke(dark?'#dec68b':'#c6a65e',.13,.7);ctx.beginPath();ctx.arc(cx,cy,r*.3,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=.075;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(cx,cy,r*.52,Math.PI*.18,Math.PI*.8);ctx.stroke();
      ctx.globalAlpha=.04;ctx.lineWidth=.55;ctx.beginPath();ctx.arc(cx,cy,r*.55,Math.PI*.19,Math.PI*.79);ctx.stroke();
      stroke(dark?'#e9ce8f':'#d4b56d',.07,1);for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(cx-r*.1,cy+r*.2);ctx.lineTo(cx-r*(.9+i*.35)+Math.sin(t*.03)*20,cy+r*2);ctx.stroke();}
    }
    if(p.motif==='lotus') {
      const x=w*.07,y=h-18,r=mini?28:small?38:64;
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*.4)*.025);
      const pad=new Path2D();pad.moveTo(2,1);pad.lineTo(r*.47,r*.25);pad.bezierCurveTo(r*.95,r*.19,r*1.12,-r*.17,r*.63,-r*.3);pad.bezierCurveTo(r*.15,-r*.5,-r*.55,-r*.39,-r*.95,-r*.12);pad.bezierCurveTo(-r*1.18,r*.11,-r*.5,r*.35,0,1);pad.closePath();
      const green=ctx.createLinearGradient(0,-r*.4,0,r*.3);green.addColorStop(0,dark?'#91b79b':'#7b9e84');green.addColorStop(1,dark?'#506e68':'#496f62');
      ctx.fillStyle=green;ctx.globalAlpha=.34;ctx.fill(pad);stroke(ink,.43,.65);ctx.stroke(pad);
      ctx.save();ctx.clip(pad);stroke(dark?'#c6d8b5':'#b5c49a',.31,.4);
      for(let i=0;i<11;i++){const a=i/11*Math.PI*2,ex=Math.cos(a)*r,ey=Math.sin(a)*r*.42;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(ex*.55,ey*.4,ex,ey);ctx.stroke();}
      ctx.restore();ellipse(0,-1,2,1,light,.65);ctx.restore();
      const fx=w*.92,fy=h-(mini?21:small?30:38),s=mini?.66:small?.8:1;
      ctx.save();ctx.translate(fx,fy);ctx.scale(s,s);ctx.rotate(Math.sin(t*.45)*.045);
      stroke(ink,.42,.8);ctx.beginPath();ctx.moveTo(0,8);ctx.quadraticCurveTo(-4,20,-2,48);ctx.stroke();
      for(let layer=0;layer<2;layer++)for(let i=0;i<(layer?3:5);i++) {
        const spread=layer?(i-1)*.34:(i-2)*.43;
        ctx.save();ctx.translate(0,layer?0:-2);ctx.rotate(spread);ctx.scale(layer?7.5:8.5,layer?14:20);
        const rose=ctx.createLinearGradient(0,-1.2,0,1);rose.addColorStop(0,dark?'#edc4d3':'#bd7d92');rose.addColorStop(.55,dark?'#bb889f':'#deb2bf');rose.addColorStop(1,dark?'#806c83':'#a3ac8b');
        ctx.globalAlpha=layer?.65:.44;ctx.fillStyle=rose;ctx.fill(lotusPetal);ctx.strokeStyle=dark?'#efd2dd':'#a97387';ctx.lineWidth=.035;ctx.stroke(lotusPetal);
        ctx.globalAlpha=.37;ctx.beginPath();ctx.moveTo(0,.65);ctx.quadraticCurveTo(.12,-.15,0,-1.03);ctx.stroke();ctx.restore();
      }
      for(let i=0;i<5;i++){stroke(dark?'#e5d7a1':'#b59b56',.6,.5);ctx.beginPath();ctx.moveTo((i-2)*1.3,1);ctx.lineTo((i-2)*1.9,-4-random(i)*2);ctx.stroke();}
      ctx.restore();
      stroke(dark?'#a2bfcb':'#8ba9b2',.13,.6);for(let i=0;i<8;i++){const y=(t*40+i*37)%(h+30)-15,x=w*(.8+random(i)*.17);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-1,y+6);ctx.stroke();}
    }
    if(p.motif==='heat') {
      const fade=.1*(1-clamp(t/30))+.025;
      for(let i=0;i<3;i++) {
        stroke(dark?'#d0b98f':'#baa373',fade,.8);ctx.beginPath();
        const x=(i%2?w*.96:w*.04)+(i-1)*5;
        ctx.moveTo(x,h*.35);ctx.bezierCurveTo(x+Math.sin(t*.2+i)*8,h*.3,x-Math.cos(t*.2+i)*8,h*.22,x,h*.13);ctx.stroke();
      }
    }
    if(p.motif==='dew'||p.motif==='cold-dew') {
      const cold=p.motif==='cold-dew',count=mini?4:small?7:12;
      for(let i=0;i<count;i++) {
        const side=i%2,x=side?w-(8+random(i)*edge*.55):8+random(i)*edge*.55,y=h*(.12+random(i+23)*.78);
        const grow=.65+.35*clamp(t/6),r=(cold?2:3)+random(i+8)*(cold?2:3);
        const tint=dark?'#b6d8e6':'#6f9aab';
        const drift=Math.sin(t*.24+i)*.6,sign=side?1:-1;
        ctx.save();ctx.translate(x,y+drift);
        // The droplet sits on an actual blade tip; its rim, reflected light and caustic differ.
        ctx.globalAlpha=cold?.23:.3;ctx.fillStyle=cold?(dark?'#94b1ad':'#778f86'):ink;
        ctx.beginPath();ctx.moveTo(sign*edge,21);ctx.bezierCurveTo(sign*24,-5,sign*8,-10,0,-r);ctx.bezierCurveTo(sign*22,-4,sign*27,10,sign*edge,21);ctx.fill();
        stroke(cold?tint:ink,.25,.5);ctx.beginPath();ctx.moveTo(sign*edge,21);ctx.quadraticCurveTo(sign*25,-4,0,-r);ctx.stroke();
        ctx.scale(grow,grow);
        const water=ctx.createRadialGradient(-r*.3,-r*.48,.1,r*.1,r*.2,r*1.5);
        water.addColorStop(0,dark?'#effbff90':'#ffffffb0');water.addColorStop(.35,dark?'#a2c9dd18':'#8ab8c21a');water.addColorStop(.8,dark?'#bedbe85c':'#6c9ca953');water.addColorStop(1,'#d1edf055');
        ctx.globalAlpha=.7;ctx.fillStyle=water;ctx.beginPath();ctx.moveTo(0,-r*1.35);ctx.bezierCurveTo(-r*.35,-r,-r*1.18,-r*.2,-r*.83,r*.65);ctx.bezierCurveTo(-r*.5,r*1.45,r*.7,r*1.4,r*.91,r*.54);ctx.bezierCurveTo(r*1.1,-r*.23,r*.3,-r,0,-r*1.35);ctx.closePath();ctx.fill();
        ctx.strokeStyle=tint;ctx.lineWidth=.45;ctx.globalAlpha=.5;ctx.stroke();
        stroke(dark?'#e1f4ff':'#fff',.62+.1*Math.sin(t*.4+i),.5);ctx.beginPath();ctx.ellipse(-r*.26,-r*.28,r*.24,r*.47,.4,Math.PI*.8,Math.PI*1.8);ctx.stroke();
        ellipse(r*.2,r*.72,r*.4,r*.13,dark?'#e1f4ff':'#ffffff',.52);ctx.restore();
      }
    }
    if(p.motif==='wind') {
      for(let i=0;i<3;i++) {
        const x=(t*18+i*w*.31)%(w+180)-180,y=h*(.25+i*.17);
        stroke(dark?'#acbbc2':'#899ca4',.11,.65);ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+45,y-5,x+85,y+4,x+135,y-2);ctx.stroke();
      }
    }
    if(p.motif==='night') {
      const x=w*(mini?.7:.86),y=h*(mini?.21:.12),r=mini?12:small?15:25;
      const glow=ctx.createRadialGradient(x,y,0,x,y,r*4);glow.addColorStop(0,dark?'#dfe7ec1f':'#899fb51a');glow.addColorStop(1,'#a4b8c800');ctx.globalAlpha=1;ctx.fillStyle=glow;ctx.fillRect(x-r*4,y-r*4,r*8,r*8);
      const moon=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.05,x,y,r);
      moon.addColorStop(0,dark?'#eef1de':'#c7d2cf');moon.addColorStop(.68,dark?'#c7d7d9':'#a4b8c1');moon.addColorStop(1,dark?'#95b0bf':'#809faf');
      ctx.save();ctx.globalAlpha=dark?.52:.34;ctx.fillStyle=moon;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.clip();
      for(let i=0;i<8;i++) {
        const mx=x+(random(i+203)-.5)*r*1.5,my=y+(random(i+119)-.5)*r*1.5,mr=r*(.09+random(i+57)*.17);
        const sea=ctx.createRadialGradient(mx-mr*.2,my-mr*.2,0,mx,my,mr);sea.addColorStop(0,dark?'#788f9c38':'#64819428');sea.addColorStop(1,'#7894a000');ctx.globalAlpha=.5;ctx.fillStyle=sea;ctx.beginPath();ctx.arc(mx,my,mr,0,Math.PI*2);ctx.fill();
      }
      stroke(dark?'#e7edda':'#d3dcd7',.28,.45);ctx.beginPath();ctx.arc(x,y,r-.5,Math.PI*.96,Math.PI*1.72);ctx.stroke();ctx.restore();
      for(let i=0;i<10;i++) {
        const sx=w*(.04+random(i+91)*.92),sy=h*(.04+random(i+17)*.2);
        stroke(dark?'#d8e4e9':'#7490a7',.16+.07*Math.sin(t*.3+i),.6);ctx.beginPath();ctx.moveTo(sx-2,sy);ctx.lineTo(sx+2,sy);ctx.moveTo(sx,sy-2);ctx.lineTo(sx,sy+2);ctx.stroke();
      }
    }
    if(p.motif==='fireflies') {
      const c=t%28,alpha=clamp((c-8)/3)*clamp((28-c)/4);
      if(alpha>0)for(let i=0;i<(mini?7:small?12:24);i++) {
        const x=w*(.04+random(i)*.92)+Math.sin(t*.3+i)*12,y=h*(.65+random(i+12)*.28)+Math.cos(t*.4+i)*12;
        const r=1.4+random(i)*1.2,g=ctx.createRadialGradient(x,y,0,x,y,r*4);
        g.addColorStop(0,'#e1d99f');g.addColorStop(.2,'#d8d590a0');g.addColorStop(1,'#d8d59000');ctx.fillStyle=g;ctx.globalAlpha=alpha*(.22+.3*Math.pow(Math.sin(t*.8+i),2));ctx.beginPath();ctx.arc(x,y,r*4,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawParticle(ctx,p,t,profile,dark,alpha) {
    const type=profile.effect;
    if(type!=='catkin'&&type!=='grain'&&type!=='lotus') return false;
    ctx.save();ctx.rotate(p.rotation*.35);ctx.globalAlpha=alpha;
    if(type==='catkin') {
      ctx.strokeStyle=dark?'#e3e9db':'#9fac9e';ctx.lineWidth=.55;
      ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(0,-2);ctx.stroke();
      for(let i=0;i<7;i++){const a=i*Math.PI/3.5;ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(Math.cos(a)*p.size*.65,Math.sin(a)*p.size*.65-2);ctx.stroke();}
      ctx.fillStyle=dark?'#e3e9db':'#a2ad9e';ctx.beginPath();ctx.ellipse(0,4,1,2,0,0,Math.PI*2);ctx.fill();
    } else if(type==='grain') {
      ctx.fillStyle=dark?'#d1b67a':'#a88b4e';ctx.beginPath();ctx.ellipse(0,0,1.2,p.size*.36,-.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=dark?'#d9c497':'#b8a174';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(p.size*.5,-p.size*1.1);ctx.stroke();
    } else {
      ctx.scale(p.size*.7,p.size);ctx.fillStyle=dark?'#d6a8ba':'#c78fa4';ctx.fill(lotusPetal);
      ctx.strokeStyle=dark?'#f1d8e4':'#e8b9c8';ctx.lineWidth=.05;ctx.beginPath();ctx.moveTo(0,.75);ctx.quadraticCurveTo(.1,-.2,0,-.9);ctx.stroke();
    }
    ctx.restore();return true;
  }
  window.Phenology={profiles,profileFor:name=>profiles[name],draw,drawParticle};
})();
