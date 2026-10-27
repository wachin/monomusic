# MonoMusic

[![License: OFL 1.1](https://img.shields.io/badge/license-OFL%201.1-blue.svg)](https://github.com/wachin/monomusic/blob/master/source/monomusic.sfdir/font.props)
[![Tests](https://img.shields.io/badge/tests-13%20passing%20%2B%20font%20contract-brightgreen.svg)](#testing)
[![Font version](https://img.shields.io/badge/font%20version-2.0-informational.svg)](#download)
[![Formats](https://img.shields.io/badge/formats-woff2%20%7C%20woff%20%7C%20ttf-lightgrey.svg)](#download)
[![GitHub last commit](https://img.shields.io/github/last-commit/wachin/monomusic.svg)](https://github.com/wachin/monomusic)

A monospaced font for **chords and guitar tablature**, plus a small browser tool — the
**MonoMusicFixer** — that turns the way you *type* chords into the way they should be
*printed*: proper superscripts, music accidentals and tab bars, all on a fixed pitch so
everything stays aligned.

![MonoMusic specimen: chords, superscripts, ligatures and tablature](resources/monomusic-specimen.png)

## Why MonoMusic

- **Chords line up with the lyrics.** Every character has the same advance width, so
  a chord sits exactly above the syllable it belongs to — in a text editor, a forum
  post or a PDF.
- **Real chord notation, not approximations.** `Cmaj7` prints as `CΔ7`, `Cm7b5` as `Cø`,
  `Bb7` as `B♭7`, `C11` as `C¹¹` — using dedicated superscript glyphs, not small text.
- **Tablature that stays tablature.** Dashes, numbers and bar lines keep their columns,
  and `|` is turned into a proper tab bar glyph.
- **Ligatures built in:** `A!` `b!` `#!` `o!` `l!` become `Δ` `♭` `♯` `ø` `|`.

## Download

| File | Use it for |
|------|------------|
| [`MonoMusic-Regular.woff2`](MonoMusic-Regular.woff2) | the web (smallest) |
| [`MonoMusic-Regular.woff`](MonoMusic-Regular.woff) | older browsers |
| [`MonoMusic-Regular.ttf`](MonoMusic-Regular.ttf) | desktop apps, word processors, FontForge |
| [`resources/MonoManual.pdf`](resources/MonoManual.pdf) | the original 2015 manual |
| [`NOTATION.md`](NOTATION.md) | chord & tab cheat sheet for musicians |

```css
@font-face {
  font-family: 'MonoMusic';
  src: url('MonoMusic-Regular.woff2') format('woff2'),
       url('MonoMusic-Regular.woff') format('woff'),
       url('MonoMusic-Regular.ttf') format('truetype');
  font-display: swap;
}
body { font-family: 'MonoMusic', monospace; font-feature-settings: "liga", "clig"; }
```

## The MonoMusicFixer

The fixer is a plain static page — no build step, no server-side code:

```bash
python3 -m http.server 8123
# open http://localhost:8123/index.html
```

Paste your chords and tab, press **Fix**, copy the result.

```
C+ C- Cmaj7 Cm7b5 Gsus4 Bb7 A!      →  C⁺ C⁻ CΔ7 Cø Csus4 B♭⁷ Δ
E|-------5-7-----7-|-8-----8-2-----  →  E│───────5─7─────7─│─8…
```

| Button | What it does |
|--------|--------------|
| **Fix** | converts the text (also on <kbd>Enter</kbd>) |
| **Title** | show / hide the document title |
| **Adsu** | adds the missing space(s) after `add` and `sus` chords |
| **B→H** | converts `B` to `H` for Danish/Norwegian notation |
| **+ / −** | font size |
| **Done** | hide everything but the document (press <kbd>Esc</kbd> to come back) |

Full notation reference — every symbol, shortcut and code point: **[NOTATION.md](NOTATION.md)**.

## Testing

```bash
npm install   # once (installs jsdom)
npm test      # node --test + font contract
```

- **13 fixer tests** (`test/fixer.test.js`) load the real `index.html` in jsdom, press
  *Fix* and assert the exact private-use code points of the output.
- **Font contract test** (`test/font_contract.py`, needs `fontTools`) asserts that the
  FontForge source (`.sfdir`), the three shipped binaries and the fixer agree: same
  `cmap`, same glyph names, same ligature set, every `U+E0xx` the fixer emits maps to
  the right superscript glyph, and every character of the manual is covered.

Both must pass after any change to the font or to `js/chordhighlight.js`.

## Building the font

The source is a FontForge directory: [`source/monomusic.sfdir/`](source/monomusic.sfdir)
(`SplineFontDB: 3.0`). To re-export:

```bash
fontforge -lang=ff -c 'Open($1); Generate($2); Close();' \
  source/monomusic.sfdir MonoMusic-Regular.ttf

python3 -c "from fontTools.ttLib import TTFont; \
f=TTFont('MonoMusic-Regular.ttf'); f.flavor='woff';  f.save('MonoMusic-Regular.woff'); \
f=TTFont('MonoMusic-Regular.ttf'); f.flavor='woff2'; f.save('MonoMusic-Regular.woff2')"
```

Then run `npm test` — the contract test is what keeps source, binaries and fixer in step.

## Credits & license

- Original design and tool: [@andreaslarsendk](https://github.com/andreaslarsen) (2015),
  based on outlines from the **M+ FONTS PROJECT** (`Copyright(c) 2008 M+ FONTS PROJECT`,
  `Copyright(c) 2015 @andreaslarsendk`).
- Licensed under the **[SIL Open Font License 1.1](source/monomusic.sfdir/font.props)** —
  you may use, study, modify and redistribute it; the font names are reserved, so
  modified versions may not use the reserved names.
- Third-party code in `js/`: [jQuery.highlight](https://github.com/bartaz/jquery.highlight)
  (Johann Burkard / Bartek Szopka), jQuery, Foundation 5, PrefixFree (Lea Verou),
  jquery-simplecolorpicker — untouched upstream libraries.
