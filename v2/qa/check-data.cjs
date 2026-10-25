const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const sandbox={console,Date};sandbox.window=sandbox;
vm.createContext(sandbox);
for(const file of ['assets/vendor/lunar.js','assets/data/day-a.js','assets/data/day-b.js','assets/data/lunar.js','assets/data/jieqi.js','assets/data/eras.js','v2/js/data.js'])
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
const D=sandbox.V2Data;
assert.equal(D.collect(2026,10,24).filter(x=>x.cal==='公历').length,0);
assert.equal(D.collect(2026,10,25).filter(x=>x.cal==='公历').length,2);
assert(D.collect(2026,7,11).some(x=>x.y===1405 && x.t.includes('郑和')));
assert.equal(D.ERAS.length,14);
const counts={calendar:Object.values(sandbox.DAY).flat().length,lunar:Object.values(sandbox.LUNAR).flat().length,timeline:D.ERAS.reduce((n,e)=>n+e.events.length,0)};
for(let year=2025;year<=2028;year++) {
  const date=D.lunarDate('12-00',year);
  assert(date,`${year} 除夕可检索`);
  assert(D.collect(date.getFullYear(),date.getMonth()+1,date.getDate()).some(x=>x.t.includes('除夕')));
  assert(D.isLunarEve(date.getFullYear(),date.getMonth()+1,date.getDate()));
}
assert.equal(D.eraAt(1526).k,'ming');
for(const n of [100,300,500,800,1000])assert(D.eraAt(2026-n));
assert.equal(D.eraAt(-3000),null);
assert.equal(D.currentTerm(new Date(2026,9,24,12)), '霜降');
for(const term of D.JQ_ORDER) {
  const date=D.termDate(term,2026);assert(date.startsWith('2026-'),`${term}: ${date}`);
}
const a=D.nearest(2026,1,1,-1,370),b=D.nearest(2026,12,31,1,370);
assert(a && b);
console.log(JSON.stringify({ok:true,counts,lunarEveYears:'2025–2028',terms:24,lookbacks:5,crossYear:true},null,2));
