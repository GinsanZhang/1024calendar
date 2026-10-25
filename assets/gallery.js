/* Local AI-painted landscapes. Decorative imagery, never historical evidence. */
(function () {
  "use strict";
  const paintings = {
    xia: { file: "dynasties/xia", title: "鼎火初兴", alt: "青铜礼器、夯土台基与古代山川的夏商周意象画" },
    cq: { file: "dynasties/cq", title: "列国山河", alt: "夯土城邑、河谷与古道的春秋战国意象画" },
    qin: { file: "dynasties/qin", height: 768, title: "秦关烽燧", alt: "夯土边墙沿山岭延伸，烽燧遥相呼应的秦代意象画" },
    han: { file: "dynasties/han", title: "汉阙通远", alt: "双阙、车马与大道的汉代建筑意象画" },
    sj: { file: "dynasties/sj", title: "竹林清谈", alt: "竹林间文士相聚、溪水绕过山石的魏晋意象画" },
    sui: { file: "dynasties/sui", height: 768, title: "运河初开", alt: "运河漕船、纤道与拱桥的隋代意象画" },
    tang: { file: "dynasties/tang", title: "长安晓色", alt: "唐式城阙、朱墙与远处佛塔的长安意象画" },
    wudai: { file: "dynasties/wudai", title: "江城烟雨", alt: "江畔旧城、残垣与旗帜的五代十国意象画" },
    song: { file: "dynasties/song", title: "江山入画", alt: "青绿群山、云雾与江上小舟的宋代山水意象画" },
    yuan: { file: "dynasties/yuan", title: "草原秋声", alt: "草原毡帐、牧马与远山的元代意象画" },
    ming: { file: "dynasties/ming", title: "宝船远航", alt: "木质海船扬起硬帆驶向远海的明代航海意象画" },
    qing: { file: "dynasties/qing", title: "园林听雨", alt: "月洞门、太湖石与竹影的清代园林意象画" },
    minguo: { file: "dynasties/minguo", height: 768, title: "街巷晨光", alt: "电车、砖石街巷与路灯的民国城市意象画" },
    prc: { file: "dynasties/prc", title: "山河新章", alt: "火车驶过江上钢桥的共和国建设意象画" },
    jieqi: { file: "dynasties/song", title: "山川时序", alt: "山川与云气交织的节令意象画" }
  };
  function motifOf(title, year, id) {
    const art = window.EventArt && EventArt.resolve({id, t:title, y:year});
    return art && art.category !== "朝代" && art.category !== "节令" ? art.assetId : "";
  }
  function artOf(era, title, year, id) {
    return (window.EventArt && EventArt.resolve({id, t:title, y:year})) || paintings[keyOf(era)];
  }
  function keyOf(era) { return Object.hasOwn(paintings, era) ? era : "jieqi"; }
  function sourceOf(era, width, title, year, id) {
    return "assets/" + artOf(era, title, year, id).file + "-" + width + ".webp";
  }
  function setSource(img, era, title, year, id) {
    img.dataset.painting = keyOf(era);
    img.srcset = sourceOf(era, 768, title, year, id) + " 768w, " + sourceOf(era, 1536, title, year, id) + " 1536w";
    img.src = sourceOf(era, 1536, title, year, id);
  }
  function applyEra(era) {
    const key = keyOf(era), root = document.documentElement;
    if (key === "jieqi" || root.dataset.era === key) return;
    root.dataset.era = key;
    document.querySelectorAll(".era-ornament").forEach(target => {
      target.dataset.eraArt = key;
      target.innerHTML = window.ART ? ART.scene(key) : "";
    });
    const opening = document.querySelector(".opening-painting");
    if (opening) {
      opening.hidden = false;
      setSource(opening, key);
    }
    const caption = document.querySelector(".opening-caption");
    if (caption) caption.textContent = paintings[key].title;
  }
  function mount(target, era, title, year, id) {
    const motifKey = motifOf(title, year, id);
    const key = motifKey || keyOf(era);
    const art = artOf(era, title, year, id);
    const frame = document.createElement("div");
    frame.className = "painting";
    frame.dataset.painting = key;
    if (id) frame.dataset.eventId = id;
    const fallback = document.createElement("div");
    fallback.className = "painting-fallback";
    fallback.innerHTML = window.ART ? ART.scene(era) : "";
    const img = document.createElement("img");
    img.alt = art.alt || art.title + "，艺术意象，非事件实录";
    img.width = 1536; img.height = art.height || 1024;
    img.decoding = "async";
    img.sizes = target.id === "dScene" ? "(max-width: 720px) 100vw, 860px" : "(max-width: 720px) 100vw, 65vw";
    img.addEventListener("load", () => frame.classList.add("loaded"), { once: true });
    img.addEventListener("error", () => { img.hidden = true; frame.classList.remove("loaded"); frame.classList.add("failed"); }, { once: true });
    setSource(img, era, title, year, id);
    frame.append(fallback, img);
    target.replaceChildren(frame);
    return art.title;
  }
  // The opening banner has no painting frame; keep its paper background on failure.
  const opening = document.querySelector(".opening-painting");
  if (opening) opening.addEventListener("error", () => { opening.hidden = true; });
  window.Gallery = { mount, keyOf, sourceOf, applyEra, motifOf };
})();
