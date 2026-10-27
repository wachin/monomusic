# MonoMusic notation guide

Everything you need to **write chords and tablature** with MonoMusic — what to type,
what prints, and how to fix it in one click.

---

## 1. Chords: type this → it prints like that

Run the text through the **MonoMusicFixer** (open `index.html`, paste, press *Fix*)
and your plain typing becomes proper chord notation:

| You type | Prints as | Meaning |
|----------|-----------|---------|
| `C` | `C` | major |
| `Cm` or `C-` | `Cm` / `C⁻` | minor |
| `C+` | `C⁺` | augmented |
| `Cmaj7`, `CM7` | `CΔ7` | major seventh |
| `C7` | `C7` | dominant seventh |
| `Cm7b5` | `Cø` | half-diminished |
| `Cdim`, `C°`, `Co` | `Cᵒ` | diminished |
| `Cmin7` | `Cm7` | minor seventh |
| `Csus2`, `Csus4` | `C` + superscript `sus2`/`sus4` | suspended |
| `Cadd9`, `Cadd11`, `Cadd13` | `C` + superscript `add9`/`add11`/`add13` | added tones |
| `C11`, `C13` | `C¹¹`, `C¹³` | extensions (11/13 ligate into one glyph) |
| `Bb7`, `B♭7` | `B♭7` | flat |
| `F#m7`, `F♯m7` | `F♯m7` | sharp |
| `E7#9` | `E7♯9` | altered chord |
| `G/B` | `G/B` | slash chord — `B` is the bass note |
| `A!` | `Δ` | shortcut for the major-seventh sign |
| `H7` | `H7` | `H` = `B` in Danish/Norwegian notation (button **B→H**) |

Accidentals can be typed either way: `#`/`b` or `♯`/`♭` — both are normalised.

## 2. Shortcuts the font understands (ligatures)

With MonoMusic active, these two-character combinations print as a single music
symbol — no fixer needed:

| You type | Prints as | Meaning |
|----------|-----------|---------|
| `A!` | `Δ` | major seventh |
| `b!` | `♭` | flat |
| `#!` | `♯` | sharp |
| `o!` | `ø` | half-diminished |
| `bb!` | `𝄫` | double flat |
| `##!` | `𝄪` | double sharp |
| `l!` | `│` (tab bar) | bar line in tablature (the fixer writes it for you from `\|`) |

> Ligatures are standard OpenType `liga` features — they are on by default in every
> browser and in most desktop apps. If nothing happens, enable
> `font-feature-settings: "liga"`.

## 3. The fixer, step by step

1. Open `index.html` (serve it: `python3 -m http.server 8123`).
2. Type or paste your song: chords above the lyrics, tabs below.
3. Press **Fix** (or <kbd>Enter</kbd>).
4. Copy the result anywhere — lyrics sheet, forum, chat, PDF.

Buttons:

| Button | What it does |
|--------|--------------|
| **Title** | show / hide the document title |
| **Adsu** | inserts the space that is sometimes missing after `add`/`sus` chords |
| **B→H** | `B` → `H` for Danish/Norwegian players |
| **+ / −** | font size up / down |
| **Done** | focus mode: only the document (<kbd>Esc</kbd> returns) |
| **Chords / Text** | colour pickers for chord and lyric colour |

## 4. Writing tablature

The font is monospaced, so tabs keep their columns in any editor:

```
Tab: Stairway to heaven intro

E|-------5-7-----7-|-8-----8-2-----2-|-0---------0-----|
B|-----5-----5-----|---5-------3-----|---1---1-----1---|
G|---5---------5---|-----5-------2---|-----2---------2-|
D|-7-------6-------|-5-------4-------|-3---------------|
A|-----------------|-----------------|-----------------|
E|-----------------|-----------------|-----------------|
```

Tips

- Use plain `-` for empty beats and `|` for bar lines — the fixer converts `|` into
  the font's bar glyph so it matches the note stems.
- Chords and tab can share one line: chord above, `e|---` below.
- Keep one space = one column; never mix tabs with a proportional font.

## 5. Using MonoMusic in your own app

```css
@font-face {
  font-family: 'MonoMusic';
  src: url('MonoMusic-Regular.woff2') format('woff2'),
       url('MonoMusic-Regular.woff') format('woff'),
       url('MonoMusic-Regular.ttf') format('truetype');
  font-display: swap;
}
.chords { font-family: 'MonoMusic', monospace; font-feature-settings: "liga", "clig"; }
```

### Private-use code points (for developers)

The superscript glyphs live in the Unicode Private Use Area, so you can write them
directly — in HTML (`&#xE01A;`), in CSS/JS (`\uE01A`) or in a text file:

| Code point | Glyph | Code point | Glyph |
|-----------|-------|-----------|-------|
| `U+E000`–`U+E009` | superscript `0`–`9` | `U+E015` | superscript `M` |
| `U+E00A` | superscript `♭` | `U+E016` | superscript `o` (dim) |
| `U+E00B` | superscript `♮` | `U+E017` | superscript `ø` |
| `U+E00C` | superscript `♯` | `U+E018` | superscript `Δ` |
| `U+E00D` / `U+E00E` | superscript `𝄪` / `𝄫` | `U+E019` / `U+E01A` | superscript `−` / `+` |
| `U+E00F`–`U+E014` | superscript `add2`…`add13` | `U+E01B` / `U+E01C` | superscript `a` / `d` |
| `U+E01F` / `U+E020` | superscript `sus2` / `sus4` | `U+E021` / `U+E022` | superscript `s` / `u` |
| `U+E040` / `U+E041` | superscript `11` / `13` | `U+E026`–`U+E030` | superscript + slash variants (`2/`, `4/`, `5/`, `♯/`, `♭/` …) |

Example: `CΔ7` is `C` `&#xE018;` `&#xE007;`.

> These code points are verified against the font by `test/font_contract.py`
> (`npm test`), so they will not silently change.

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Numbers and signs stay full-size | run the text through the **Fix** button — that is what converts them to superscripts |
| No ligature (`A!` stays `A!`) | enable `font-feature-settings: "liga"`; in Word/LibreOffice turn *Ligatures* on |
| Chords and lyrics do not line up | you are not using a monospaced font — apply MonoMusic to the whole block |
| `B` should be `H` | press **B→H** in the fixer |
| A symbol shows as a box (□) | that glyph only exists in MonoMusic — check the `@font-face` paths |
