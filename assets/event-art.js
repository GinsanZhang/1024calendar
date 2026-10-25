/* Shared by the original reader and v2. Explicit event IDs outrank keywords. */
window.EventArt = (() => {
  'use strict';
  const registry = window.EVENT_ART;
  const rules = [
    ['nuclear', /原子弹|氢弹|核试验/],
    ['earthquake', /地震/],
    ['earthquake-tangshan', /地震/],
    ['handover', /香港回归|澳门回归/],
    ['spaceflight', /卫星|火箭|飞船|载人航天|东方红|神舟/],
    ['labour', /罢工|工运/],
    ['diplomacy', /建交|外交|邦交|联合国|访问苏联|访问美国/],
    ['assembly-modern', /会议|大会|全会/],
    ['assembly-early', /会议|大会|全会/],
    ['battle-modern', /战役|会战|战争|作战|抗美援朝/],
    ['battle-early', /战役|会战|战争|起义/]
  ];
  function available(asset, year) {
    return asset && asset.status === '画面验收通过' &&
      Number.isFinite(year) && year >= asset.from && year <= asset.to;
  }
  function resolve(item = {}) {
    const entry = registry.events[item.id];
    if (entry) {
      const asset = registry.assets[entry.asset];
      // Known entries never flow through keywords, even when a mapping is invalid.
      return available(asset, item.y) ? {...asset, assetId:entry.asset, eventId:item.id, mode:'id'} : null;
    }
    if (!(item.y >= 1840)) return null;
    for (const [id, pattern] of rules) {
      const asset = registry.assets[id];
      if (pattern.test(item.t || '') && available(asset, item.y)) return {...asset,assetId:id,mode:'keyword'};
    }
    return null;
  }
  return { resolve, registry };
})();
