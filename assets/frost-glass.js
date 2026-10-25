/* 窗面凝霜：边缘晶簇、六向细枝、半透明晶面和细颗粒，无独立茎秆。 */
(function () {
  'use strict';
  function build(w,h,dark,style='fern',round=false) {
    const canvas=document.createElement('canvas'),dpr=round?2:1.5;
    canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);
    const g=canvas.getContext('2d');g.scale(dpr,dpr);
    if(!w||!h)return canvas;
    let seed=39017;
    const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const between=(a,b)=>a+(b-a)*rand();
    const needle=style==='needle',edge=round?w*.105:Math.min(110,w*.17);
    const tint=dark?'187,215,229':'100,143,167',shine=dark?'234,247,252':'225,242,249';
    const r=Math.min(w,h)/2,cx=w/2,cy=h/2;
    if(round){g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.clip();}
    function boundary() {
      if(round){const a=rand()*Math.PI*2;return {x:cx+Math.cos(a)*(r-1),y:cy+Math.sin(a)*(r-1),inward:a+Math.PI};}
      const n=rand()*(w+h)*2;
      if(n<w)return {x:n,y:0,inward:Math.PI/2};
      if(n<w+h)return {x:w,y:n-w,inward:Math.PI};
      if(n<w*2+h)return {x:w-(n-w-h),y:h,inward:-Math.PI/2};
      return {x:0,y:h-(n-w*2-h),inward:0};
    }
    // Uneven translucent glass at the rim, rather than a continuous decorative border.
    if(round) {
      for(let i=0;i<20;i++) {
        g.strokeStyle='rgba('+tint+','+(.1*Math.pow(1-i/20,2))+')';g.lineWidth=edge/19;
        g.beginPath();g.arc(cx,cy,Math.max(1,r-i*edge/20),0,Math.PI*2);g.stroke();
      }
    } else {
      for(const side of ['left','right','top','bottom']) {
        g.save();
        if(side==='right'){g.translate(w,0);g.scale(-1,1);}
        if(side==='top'){g.rotate(Math.PI/2);g.scale(1,-1);}
        if(side==='bottom'){g.translate(0,h);g.rotate(-Math.PI/2);}
        const length=side==='top'||side==='bottom'?w:h;
        const gradient=g.createLinearGradient(0,0,edge*.6,0);
        gradient.addColorStop(0,'rgba('+tint+',.12)');gradient.addColorStop(.35,'rgba('+tint+',.045)');gradient.addColorStop(1,'rgba('+tint+',0)');
        g.fillStyle=gradient;g.fillRect(0,0,edge*.6,length);g.restore();
      }
    }
    const stems=new Path2D(),barbs=new Path2D(),highlights=new Path2D();
    let facets=0;
    function line(path,x,y,ex,ey){path.moveTo(x,y);path.lineTo(ex,ey);}
    function ray(x,y,length,angle) {
      const dx=Math.cos(angle),dy=Math.sin(angle),ex=x+dx*length,ey=y+dy*length;
      line(stems,x,y,ex,ey);line(highlights,x-dy*.4,y+dx*.4,ex-dy*.4,ey+dx*.4);
      const count=needle?3:4;
      for(let j=1;j<=count;j++) {
        if(rand()<.2)continue;
        const f=(j+between(-.18,.18))/(count+1),px=x+dx*length*f,py=y+dy*length*f;
        for(const sign of [-1,1]) {
          const a=angle+sign*(needle?Math.PI/6:Math.PI/3),len=length*(1-f)*between(needle?.12:.22,needle?.28:.46);
          const bx=px+Math.cos(a)*len,by=py+Math.sin(a)*len;line(barbs,px,py,bx,by);
          if(!needle&&len>5) {
            const tx=px+(bx-px)*.58,ty=py+(by-py)*.58,ta=a-sign*Math.PI/3;
            line(barbs,tx,ty,tx+Math.cos(ta)*len*.35,ty+Math.sin(ta)*len*.35);
          }
        }
      }
    }
    function facet(x,y,size,angle) {
      if(needle&&rand()<.75)return;
      const points=[];
      for(let i=0;i<6;i++){const a=angle+i*Math.PI/3,stretch=i%2?1:.72;points.push([x+Math.cos(a)*size*stretch,y+Math.sin(a)*size*stretch]);}
      const fill=g.createLinearGradient(x-size,y-size,x+size,y+size);
      fill.addColorStop(0,'rgba('+shine+',.2)');fill.addColorStop(.5,'rgba('+tint+',.035)');fill.addColorStop(1,'rgba('+shine+',.12)');
      g.fillStyle=fill;g.beginPath();points.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();
      for(let i=0;i<2;i++){const a=points[i],b=points[i+1];line(highlights,a[0],a[1],b[0],b[1]);}
      facets++;
    }
    function patch(x,y,size,angle) {
      const n=needle?3:5;
      for(let i=0;i<n;i++) {
        const a=between(0,Math.PI*2),distance=size*between(0,.48),px=x+Math.cos(a)*distance,py=y+Math.sin(a)*distance;
        const turn=angle+(i%2?Math.PI/6:0),arm=size*between(.22,.55);
        for(let k=0;k<6;k++)if(rand()>.19)ray(px,py,arm*between(.5,1.2),turn+k*Math.PI/3);
        facet(px,py,arm*between(.16,.37),turn);
      }
    }
    // Overlapping patches grow along the pane in several directions; corners have larger fields.
    const count=round?Math.ceil(w/17):Math.ceil((w+h)/64);
    for(let i=0;i<count;i++) {
      const b=boundary(),inset=between(-edge*.05,edge*.25),size=edge*between(.3,.7)*(needle?.8:1);
      patch(b.x+Math.cos(b.inward)*inset,b.y+Math.sin(b.inward)*inset,size,Math.floor(rand()*6)*Math.PI/6);
    }
    if(!round)for(const [x,y] of [[0,0],[w,0],[0,h],[w,h]])patch(x,y,edge*1.28,between(0,Math.PI/3));
    g.lineCap='butt';g.lineJoin='miter';
    g.strokeStyle='rgba('+tint+','+(needle?.36:.43)+')';g.lineWidth=needle?.42:.64;g.stroke(stems);
    g.strokeStyle='rgba('+tint+',.32)';g.lineWidth=.32;g.stroke(barbs);
    g.strokeStyle='rgba('+shine+',.4)';g.lineWidth=.3;g.stroke(highlights);
    // Tiny ice grains fuse the branch fields into a frosted surface at their base.
    const grains=Math.floor((w+h)*(round?3:3.5));
    for(let i=0;i<grains;i++) {
      const b=boundary(),inset=Math.pow(rand(),2.7)*edge*.65;
      const x=b.x+Math.cos(b.inward)*inset,y=b.y+Math.sin(b.inward)*inset;
      const size=between(.3,1.05),alpha=between(.05,.25)*(1-inset/edge);
      g.fillStyle='rgba('+(i%3?shine:tint)+','+alpha+')';g.fillRect(x,y,size,size*.65);
    }
    // Fade whole branch fields into the clear glass so they form a coating, not isolated emblems.
    const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;
    const m=mask.getContext('2d');m.scale(dpr,dpr);
    if(round) {
      const fade=m.createRadialGradient(cx,cy,Math.max(0,r-edge),cx,cy,r);
      fade.addColorStop(0,'#ffffff00');fade.addColorStop(.4,'#ffffff38');fade.addColorStop(.8,'#ffffffb0');fade.addColorStop(1,'#fff');m.fillStyle=fade;m.fillRect(0,0,w,h);
    } else for(const side of ['left','right','top','bottom']) {
      m.save();if(side==='right'){m.translate(w,0);m.scale(-1,1);}if(side==='top'){m.rotate(Math.PI/2);m.scale(1,-1);}if(side==='bottom'){m.translate(0,h);m.rotate(-Math.PI/2);}
      const fade=m.createLinearGradient(0,0,edge,0);fade.addColorStop(0,'#fff');fade.addColorStop(.25,'#ffffffb0');fade.addColorStop(.65,'#ffffff30');fade.addColorStop(1,'#ffffff00');m.fillStyle=fade;m.fillRect(0,0,edge,side==='top'||side==='bottom'?w:h);m.restore();
    }
    g.save();g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0,w,h);g.restore();
    canvas.dataset.geometry=needle?'needle-fields':'crystal-fields';canvas.dataset.facets=String(facets);
    return canvas;
  }
  window.FrostGlass={build};
})();
