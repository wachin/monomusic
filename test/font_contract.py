#!/usr/bin/env python3
"""Contract test: font source (.sfdir) <-> shipped binaries <-> fixer code.

The MonoMusicFixer emits private-use code points (U+E0xx) that only make sense
if the shipped font maps them to the right superscript glyphs, and the shipped
binaries only make sense if they are a faithful export of the committed source.
Nothing enforced that before, which produced three real bugs:

  * the fixer mapped '+' to U+E009 (= nine.sup, so "C+" rendered as "C9")
  * eleven.sup/thirteen.sup existed in the source but were never exported
  * the l! -> bar ligature existed only in the binaries, so re-exporting the
    font silently deleted the tablature bars

Run it via `npm test` (after node --test). Skips cleanly without fontTools.
"""
from __future__ import annotations

import glob
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FAILURES: list[str] = []


def section(title: str) -> None:
    print(f"\n== {title} ==")


def check(ok: bool, msg: str) -> None:
    print(("  ok   " if ok else "  FAIL ") + msg)
    if not ok:
        FAILURES.append(msg)


try:
    from fontTools.ttLib import TTFont
except ImportError:
    print("SKIPPED: fontTools no esta instalado -> pip install fonttools")
    sys.exit(0)

# The PUA contract: every superscript code point the fixer/website can emit and
# the glyph name it must resolve to in MonoMusic-Regular.
PUA = {
    0xE000: "zero.sup", 0xE001: "one.sup", 0xE002: "two.sup", 0xE003: "three.sup",
    0xE004: "four.sup", 0xE005: "five.sup", 0xE006: "six.sup", 0xE007: "seven.sup",
    0xE008: "eight.sup", 0xE009: "nine.sup",
    0xE00A: "flat.sup", 0xE00B: "normal.sup", 0xE00C: "sharp.sup",
    0xE00D: "doublesharp.sup", 0xE00E: "doubleflat.sup",
    0xE00F: "add2.sup", 0xE010: "add4.sup", 0xE011: "add6.sup",
    0xE012: "add9.sup", 0xE013: "add11.sup", 0xE014: "add13.sup",
    0xE015: "M.sup", 0xE016: "o.sup", 0xE017: "oslash.sup", 0xE018: "Delta.sup",
    0xE019: "minus.sup", 0xE01A: "plus.sup", 0xE01B: "a.sup", 0xE01C: "d.sup",
    0xE01D: "exclam.sup", 0xE01E: "A.sup", 0xE01F: "sus2.sup", 0xE020: "sus4.sup",
    0xE021: "s.sup", 0xE022: "u.sup", 0xE023: "numbersign.sup", 0xE024: "b.sup",
    0xE025: "question.sup",
    0xE026: "two_slash", 0xE027: "four_slash", 0xE028: "five.slash",
    0xE029: "six.slash", 0xE02A: "seven.slash", 0xE02B: "eight.slash",
    0xE02C: "nine.slash", 0xE02D: "flat.slash", 0xE02E: "normal.slash",
    0xE02F: "sharp.slash", 0xE030: "doublesharp.slash",
    0xE040: "eleven.sup", 0xE041: "thirteen.sup",
}

# Glyphs FontForge always adds on export; they are not in the .sfdir.
FF_EXTRAS = {".notdef", ".null", "nonmarkingreturn"}


def read_source():
    """code point -> glyph name, and the set of Ligature2 rules of the .sfdir."""
    cps: dict[int, str] = {}
    ligs: set[tuple[tuple[str, ...], str]] = set()
    for path in glob.glob(str(ROOT / "source/monomusic.sfdir/*.glyph")):
        text = Path(path).read_text(encoding="utf-8", errors="replace")
        name = re.search(r"^StartChar:\s*(\S+)", text, re.M)
        enc = re.search(r"^Encoding:\s+(-?\d+)", text, re.M)
        char = name.group(1) if name else Path(path).stem
        if enc and int(enc.group(1)) >= 0:
            cps[int(enc.group(1))] = char
        for m in re.finditer(r'^Ligature2:\s*"[^"]*"\s+(.+)$', text, re.M):
            ligs.add((tuple(m.group(1).split()), char))
    return cps, ligs


def read_ligatures(font) -> set[tuple[tuple[str, ...], str]]:
    out: set[tuple[tuple[str, ...], str]] = set()
    if "GSUB" not in font:
        return out
    for lookup in font["GSUB"].table.LookupList.Lookup:
        if lookup.LookupType != 4:
            continue
        for sub in lookup.SubTable:
            for first, records in sub.ligatures.items():
                for rec in records:
                    out.add((tuple([first] + list(rec.Component)), rec.LigGlyph))
    return out


def emitted_code_points(*files: str) -> set[int]:
    """Every \\uE0xx literal used by the fixer / website / test expectations."""
    found: set[int] = set()
    for rel in files:
        text = (ROOT / rel).read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(r"\\uE0([0-9A-Fa-f]{2})", text):
            found.add(0xE000 + int(m.group(1), 16))
    return found


# ---------------------------------------------------------------- binaries
section("shipped binaries agree with each other")
ttf = TTFont(str(ROOT / "MonoMusic-Regular.ttf"))
cmap = ttf.getBestCmap()
for rel in ("MonoMusic-Regular.woff", "MonoMusic-Regular.woff2"):
    other = TTFont(str(ROOT / rel))
    check(other.getBestCmap() == cmap, f"{rel}: cmap == ttf cmap")
    check(other.getGlyphOrder() == ttf.getGlyphOrder(), f"{rel}: glyph order == ttf glyph order")

# ------------------------------------------------------------------ source
section("source (.sfdir) <-> shipped ttf")
src_cps, src_ligs = read_source()
only_src = sorted(set(src_cps) - set(cmap))
only_ttf = sorted(set(cmap) - set(src_cps))
check(not only_src, f"every encoded source code point is in the ttf ({len(src_cps)}) "
                    f"[missing: {[hex(c) for c in only_src]}]")
check(not only_ttf, f"the ttf has no code point missing from the source "
                    f"[extra: {[hex(c) for c in only_ttf]}]")
bad_names = sorted((hex(cp), src_cps[cp], cmap[cp]) for cp in src_cps
                   if cp in cmap and src_cps[cp] != cmap[cp])
check(not bad_names, f"source and ttf glyph names match per code point [mismatches: {bad_names[:5]}]")
extras = sorted(set(ttf.getGlyphOrder()) - set(src_cps.values()))
check(set(extras) <= FF_EXTRAS, f"only FontForge's standard glyphs are unmapped [{extras}]")

section("ligatures: source <-> ttf GSUB")
ttf_ligs = read_ligatures(ttf)
check(src_ligs == ttf_ligs,
      f"identical ligature sets ({len(src_ligs)} source / {len(ttf_ligs)} ttf) "
      f"[only source: {sorted(src_ligs - ttf_ligs)[:3]} | only ttf: {sorted(ttf_ligs - src_ligs)[:3]}]")
check(("l", "exclam") in {c for c, _ in ttf_ligs} and
      next((t for c, t in ttf_ligs if c == ("l", "exclam")), None) == "bar",
      "tablature bar ligature l! -> bar is present (the fixer depends on it)")

# --------------------------------------------------------------------- PUA
section("PUA contract: every superscript code point maps to the right glyph")
for cp, expected in sorted(PUA.items()):
    actual = cmap.get(cp)
    check(actual == expected, f"U+{cp:04X} -> {expected} (font has {actual})")

# ------------------------------------------------------------------- fixer
section("fixer emits only code points the font actually has")
emitted = emitted_code_points("js/chordhighlight.js", "index.html", "test/fixer.test.js")
missing = sorted(cp for cp in emitted if cp not in cmap)
check(not missing, f"all {len(emitted)} \\uE0xx literals exist in the font "
                   f"[missing: {[hex(c) for c in missing]}]")

section("fixer's superscript assignments are the intended ones")
fixer = (ROOT / "js/chordhighlight.js").read_text(encoding="utf-8", errors="replace")
MAPPINGS = [
    (r'\\u002B/g, "\\uE01A"', "+ -> plus.sup (U+E01A), not nine.sup"),
    (r'\\u002D/g, "\\uE019"', "- -> minus.sup (U+E019), not flat.sup"),
    (r'\\u266D/g, "\\uE00A"', "flat -> flat.sup (U+E00A)"),
    (r'\\u266E/g, "\\uE00B"', "natural -> normal.sup (U+E00B)"),
    (r'\\u266F/g, "\\uE00C"', "sharp -> sharp.sup (U+E00C)"),
    (r'/m7b5/g, "', "m7b5 -> half-diminished"),
    (r'/maj7/g, "', "maj7 -> Delta7"),
    (r'/M7/g, "', "M7 -> Delta7"),
    (r'/aug/g, "', "aug -> +"),
    (r'/dim/g, "', "dim -> o"),
    (r'\\u0394/g, "\\uE018"', "Delta -> Delta.sup (U+E018)"),
]
for pattern, label in MAPPINGS:
    check(re.search(pattern, fixer) is not None, label)
for digit in range(1, 10):
    check(re.search(rf'/{digit}/g, "\\uE0{digit:02X}"', fixer) is not None,
          f"digit {digit} -> U+E0{digit:02X}")

# ------------------------------------------------------------------ manual
section("MonoManual.pdf coverage (optional)")
try:
    import pymupdf  # type: ignore
except ImportError:
    print("  skip  pymupdf no instalado -> no se audita el manual")
else:
    used = set()
    doc = pymupdf.open(str(ROOT / "resources/MonoManual.pdf"))
    for page in doc:
        for block in page.get_text("dict").get("blocks", []):
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    if span.get("font") == "MonoMusic-Regular":
                        used.update(span.get("text", ""))
    uncovered = sorted(c for c in used if not c.isspace() and ord(c) not in cmap)
    # U+2011 (non-breaking hyphen) is known: the manual draws it with the plain
    # hyphen glyph and the code point is absent from the source too.
    unexpected = [c for c in uncovered if ord(c) != 0x2011]
    check(not unexpected, f"every manual character is covered by the font "
                          f"[uncovered: {[f'U+{ord(c):04X}' for c in unexpected]}]")

# ------------------------------------------------------------------ result
print(f"\n{'FAILED' if FAILURES else 'PASSED'}: "
      f"{len(FAILURES)} failed check(s) out of the contract above.")
sys.exit(1 if FAILURES else 0)