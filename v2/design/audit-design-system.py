"""Recalculate opaque token pairs. This does not validate rendered artwork or UI."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def declarations(selector):
    css = (ROOT / "css/tokens.css").read_text()
    match = re.search(re.escape(selector) + r"\s*\{([^}]+)\}", css)
    if not match:
        raise ValueError(f"Missing selector: {selector}")
    return dict(re.findall(r"(--[\w-]+)\s*:\s*(#[\da-fA-F]{6})\s*;", match[1]))


def luminance(value):
    channels = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in channels]
    return sum(v * w for v, w in zip(linear, (.2126, .7152, .0722)))


def ratio(foreground, background):
    a, b = sorted((luminance(foreground), luminance(background)))
    return (b + .05) / (a + .05)


light = declarations(":root")
themes = {"light": light, "dark": light | declarations('html[data-theme="dark"]')}
checks = []


def check(group, token, fg, bg, threshold=4.5):
    value = ratio(fg, bg)
    checks.append(dict(group=group, token=token, foreground=fg, background=bg,
                       ratio=round(value, 4), minimum=threshold, passed=value >= threshold))


for theme, values in themes.items():
    for surface in ("--paper", "--paper-2", "--card"):
        for token in ("--ink", "--ink-2", "--muted", "--zhu", "--qing", "--gold", "--era-ink", "--season-ink"):
            check(f"{theme}/{surface}", token, values[token], values[surface])
        for key in ("xia", "cq", "qin", "han", "sj", "sui", "tang", "wudai", "song", "yuan", "ming", "qing", "minguo", "prc"):
            token = f"--era-{key}-ink"
            check(f"canonical-era/{theme}/{surface}", token, values[token], values[surface])
    if "--on-zhu" in values:
        for surface in ("--zhu", "--zhu-deep"):
            check(f"{theme}/button/{surface}", "--on-zhu", values["--on-zhu"], values[surface])
    for season in ("spring", "summer", "autumn", "winter"):
        state = values | declarations(f'html[data-season="{season}"]')
        if theme == "dark":
            state |= declarations(f'html[data-theme="dark"][data-season="{season}"]')
        check(f"{theme}/{season}", "--season-ink", state["--season-ink"], state["--season-paper"])
        # Season chips are also placed on the neutral paper surface.
        check(f"{theme}/{season}/paper", "--season-ink", state["--season-ink"], values["--paper"])

source = (ROOT / "js/data.js").read_text()
palette = re.search(r"const ERA_INK = \{(.*?)\n  \};", source, re.S)[1]
for key, fg_light, fg_dark in re.findall(r'(\w+):\s*\["(#[\dA-Fa-f]{6})",\s*"(#[\dA-Fa-f]{6})"\]', palette):
    for theme, fg in (("light", fg_light), ("dark", fg_dark)):
        for surface in ("--paper", "--paper-2", "--card"):
            check(f"legacy-era/{theme}/{surface}", key, fg, themes[theme][surface])

report = {
    "method": "sRGB relative luminance; compare unrounded ratios against threshold",
    "scope": "Opaque token pairs only. No alpha compositing, images, focus, geometry or browser rendering.",
    "checks": checks,
    "failures": [item for item in checks if not item["passed"]],
    "canonical_failures": [item for item in checks if not item["passed"] and not item["group"].startswith("legacy-era/")],
    "legacy_failures": [item for item in checks if not item["passed"] and item["group"].startswith("legacy-era/")],
}
(ROOT / "design/contrast-audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"checks": len(checks), "canonical_failures": report["canonical_failures"],
                  "legacy_failures": len(report["legacy_failures"])}, ensure_ascii=False, indent=2))
raise SystemExit(1 if report["canonical_failures"] else 0)
