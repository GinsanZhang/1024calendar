/* 三种六折雪晶的共享几何，供全站画布与四时画境共用。 */
(function () {
  'use strict';
  function crystal(variant) {
    const segments=[];
    const point=(x,y,angle)=>{
      const c=Math.cos(angle),s=Math.sin(angle);
      return (x*c-y*s).toFixed(4)+' '+(x*s+y*c).toFixed(4);
    };
    const line=(ax,ay,bx,by,a)=>segments.push('M'+point(ax,ay,a)+'L'+point(bx,by,a));
    for(let i=0;i<6;i++) {
      const a=i*Math.PI/3;
      line(0,0,0,-1,a);
      const branches=variant===0?[[.38,.18],[.65,.23],[.85,.12]]:variant===1?[[.51,.26],[.8,.17]]:[[.67,.22]];
      for(const [radius,length] of branches) {
        line(0,-radius,-length,-radius-length*.7,a);
        line(0,-radius,length,-radius-length*.7,a);
      }
      if(variant===1) {
        line(0,-.25,-.2165,-.125,a);
        line(0,-.25,.2165,-.125,a);
        line(-.14,-.82,0,-1,a);
        line(.14,-.82,0,-1,a);
      }
    }
    return segments.join('');
  }
  const data=[0,1,2].map(crystal);
  window.SnowCrystals={
    paths:data.map(path=>new Path2D(path)),
    masks:data.map(path=>'url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1.15 -1.15 2.3 2.3"><path d="'+path+'" fill="none" stroke="white" stroke-width=".065" stroke-linecap="round" stroke-linejoin="round"/></svg>')+'")')
  };
})();
