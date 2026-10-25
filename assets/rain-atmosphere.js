/* 共用的雨幕：速度决定雨线方向，真实落点生成水纹；雷光与雨幕同一时钟。 */
(function () {
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  function create(width,height,profile,dark) {
    const storm=profile.base==='storm';
    const area=width<600?.4:Math.max(.6,Math.min(1.2,width*height/1296000));
    const count=Math.round(profile.density*area),drops=[],impacts=[];
    const tint=dark?'183,208,221':'74,111,132';
    let strike=null,nextStrike=null,wind=storm?.25:.07;
    const random=(a,b)=>a+Math.random()*(b-a);
    const sprites=[0,1,2].map(depth=>{
      const c=document.createElement('canvas');c.width=12;c.height=160;
      const g=c.getContext('2d'),fade=g.createLinearGradient(0,0,0,160);
      fade.addColorStop(0,'rgba('+tint+',0)');fade.addColorStop(.3,'rgba('+tint+',.18)');fade.addColorStop(.86,'rgba('+tint+',.8)');fade.addColorStop(1,'rgba('+tint+',1)');
      g.strokeStyle=fade;g.lineWidth=[1.1,1.7,2.6][depth];g.lineCap='round';g.beginPath();g.moveTo(6,2);g.lineTo(6,156);g.stroke();
      if(depth===2){g.strokeStyle=dark?'#eef7fd90':'#d8e7ed90';g.lineWidth=.7;g.stroke();}
      return c;
    });
    function drop(initial=false) {
      const r=Math.random(),depth=r<.43?0:r<.85?1:2;
      return {x:Math.random(),progress:initial?Math.random():random(-.22,-.02),depth,
        speed:(storm?random(480,720):random(190,290))*(.65+depth*.28)*(profile.speed||1),
        length:(storm?random(17,26):random(7,12))*(.65+depth*.42),
        alpha:[.23,.42,.65][depth]*random(.78,1),land:Math.random(),variant:Math.random()};
    }
    for(let i=0;i<count;i++)drops.push(drop(true));
    function channel(ax,ay,bx,by,roughness,levels) {
      let points=[[ax,ay],[bx,by]];
      for(let n=0;n<levels;n++) {
        const next=[];
        for(let i=0;i<points.length-1;i++) {
          const a=points[i],b=points[i+1],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
          const shift=random(-roughness,roughness);
          next.push(a,[(a[0]+b[0])/2-dy/length*shift,(a[1]+b[1])/2+dx/length*shift]);
        }
        next.push(points[points.length-1]);points=next;roughness*=.64;
      }
      return points;
    }
    function bolt(t) {
      const side=Math.random()<.5?-1:1,x=width*(side<0?random(.07,.15):random(.85,.93));
      const endX=x-side*width*random(.045,.095),endY=height*random(.48,.68);
      const trunk=channel(x,-12,endX,endY,Math.min(60,width*.105),5);
      const branches=[];
      for(const index of [7,13,19,24]) {
        const start=trunk[index],sign=index%2?-side:side;
        const length=random(.09,.2)*height;
        const points=channel(start[0],start[1],start[0]+sign*length*.55,start[1]+length*.68,length*.12,3);
        branches.push({points,width:.7});
        const twig=points[4];branches.push({points:channel(twig[0],twig[1],twig[0]-sign*length*.23,twig[1]+length*.25,length*.05,2),width:.35});
      }
      return {trunk,branches,born:t,x,side,age:0};
    }
    function energy() {
      if(!strike)return 0;
      const a=strike.age;
      // A single discharge with a short bright channel, then a long soft cloud afterglow.
      return a<.09?a/.09:a<.34?1-(a-.09)*1.8:Math.exp(-(a-.34)*3.6)*.55;
    }
    function advance(dt,t,weight) {
      wind=(storm?.25:.07)+Math.sin(t*(storm?.7:.35))*(storm?.045:.018);
      if(nextStrike===null)nextStrike=t+1.8;
      if(storm&&weight>.72&&t>=nextStrike){strike=bolt(t);nextStrike=t+random(9,16);}
      if(strike){strike.age=t-strike.born;if(strike.age>1.8)strike=null;}
      for(let i=impacts.length-1;i>=0;i--){impacts[i].age+=dt;if(impacts[i].age>impacts[i].life)impacts.splice(i,1);}
      for(let i=0;i<drops.length;i++) {
        const p=drops[i];p.progress+=dt*p.speed/height;p.x+=dt*p.speed*wind/width;
        if(p.progress>=1) {
          if(weight>.1&&p.depth>0&&Math.random()<(storm?.5:.38)&&impacts.length<90)impacts.push({x:p.x,land:p.land,age:0,life:random(.45,.85),radius:random(7,storm?22:15),seed:p.variant});
          drops[i]=drop();
        } else if(p.x>1.05){p.x=-.03;}
      }
    }
    function strokePath(g,points,lineWidth,alpha,color,tw,th) {
      g.globalAlpha=alpha;g.strokeStyle=color;g.lineWidth=lineWidth;g.beginPath();
      for(let i=0;i<points.length;i++){const x=points[i][0]/width*tw,y=points[i][1]/height*th;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
    }
    function drawSky(g,w,h,mini=false) {
      if(!storm)return;
      g.save();
      const shade=g.createLinearGradient(0,0,0,h*(mini?.55:.34));
      shade.addColorStop(0,dark?'#32455546':'#465f7536');shade.addColorStop(.5,dark?'#5264771c':'#5f75871c');shade.addColorStop(1,'#647c9100');
      g.fillStyle=shade;g.globalAlpha=1;g.fillRect(0,0,w,h*(mini?.55:.34));
      if(strike) {
        const e=energy()*(profile.lightning||1),x=strike.x/width*w,r=Math.min(w*.32,h*.5);
        const glow=g.createRadialGradient(x,h*.035,0,x,h*.035,r);
        glow.addColorStop(0,dark?'#d9e9ff':'#f5fbff');glow.addColorStop(.24,dark?'#a2c4ee70':'#afcbec80');glow.addColorStop(1,'#a9c8ed00');
        g.globalAlpha=e*(dark?.25:.34);g.fillStyle=glow;g.fillRect(x-r,0,r*2,r);
        const core=dark?'#f0f8ff':'#edf7ff',rim=dark?'#8cbae8':'#547b9f';
        const scale=mini?.58:1;
        g.lineCap='round';g.lineJoin='round';
        strokePath(g,strike.trunk,12*scale,e*.065,rim,w,h);
        strokePath(g,strike.trunk,4.5*scale,e*.24,rim,w,h);
        strokePath(g,strike.trunk,1.7*scale,e*.82,rim,w,h);
        strokePath(g,strike.trunk,.8*scale,e*.94,core,w,h);
        for(const branch of strike.branches){strokePath(g,branch.points,branch.width*scale,e*.52,rim,w,h);strokePath(g,branch.points,branch.width*.4*scale,e*.75,core,w,h);}
      }
      g.restore();
    }
    function ground(land,h,mini) {return mini?h*(.79+land*.17):h-8-(1-land)*48;}
    function drawRain(g,w,h,weight,mini=false) {
      if(weight<=0)return;
      g.save();
      const stride=mini?(storm?4:3):1;
      for(let i=0;i<drops.length;i+=stride) {
        const p=drops[i],x=p.x*w,land=ground(p.land,h,mini),y=p.progress*land;
        const length=p.length*(mini?.52:1),slope=wind*(w/width)*height/land;
        const inMiddle=x>w*.26&&x<w*.74;
        g.save();g.translate(x,y);g.rotate(-Math.atan(slope));
        g.globalAlpha=p.alpha*weight*(inMiddle&&!mini?.4:1)*(dark?1:.92);
        const thickness=mini?[.5,.7,.95][p.depth]:[.55,.85,1.3][p.depth];
        g.drawImage(sprites[p.depth],-3*thickness,-length,6*thickness,length);g.restore();
      }
      g.strokeStyle=dark?'#b5d2df':'#5f899e';g.lineCap='round';
      for(let i=0;i<impacts.length;i++) {
        const p=impacts[i];if(mini&&p.seed>.42)continue;
        const progress=p.age/p.life,x=p.x*w,y=ground(p.land,h,mini),r=p.radius*(mini?.52:1);
        const center=x>w*.26&&x<w*.74;
        const alpha=Math.pow(1-progress,1.5)*weight*(center&&!mini?.22:.48);
        g.globalAlpha=alpha;g.lineWidth=mini?.45:.65;
        g.beginPath();g.ellipse(x,y,1+r*progress,.5+r*.23*progress,0,0,Math.PI*2);g.stroke();
        if(progress>.22){g.globalAlpha=alpha*.48;g.beginPath();g.ellipse(x,y,1+r*progress*.65,.5+r*.14*progress,0,.15,Math.PI*1.8);g.stroke();}
        if(progress<.52)for(let j=0;j<3;j++) {
          const s=j-1,fall=progress/.52,dx=s*r*.45*fall,dy=-r*.53*Math.sin(fall*Math.PI);
          g.globalAlpha=alpha*.65;g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx-s*.6,y+dy+1.2);g.stroke();
        }
      }
      g.restore();
    }
    return {advance,drawSky,drawRain,count,
      get impacts(){return impacts.length;},get lightning(){return !!strike&&energy()>.045;},get branches(){return strike?strike.branches.length:0;}};
  }
  window.RainAtmosphere={create};
})();
