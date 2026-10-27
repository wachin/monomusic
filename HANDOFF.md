# HANDOFF — MonoMusic (mantenimiento retomado por agentes de IA)

> Archivo de traspaso para agentes de IA (Freebuff y similares).
> Léelo completo antes de tocar código. Actualizado: 2026-10-27.

## 1. Situación del repositorio

- Proyecto: **MonoMusic** — tipografía monoespaciada para acordes + tablaturas
  de guitarra, con una herramienta web "MonoMusicFixer" que convierte texto a
  notación de acordes/tabs.
- Autor original: @andreaslarsendk. Último desarrollo real: **2015** (11 años abandono).
- Licencia: **SIL Open Font License 1.1** (ver `source/monomusic.sfdir/font.props`).
  Prohibido usar los nombres reservados en versiones modificadas sin permiso.
- ✅ El remoto `origin` ya apunta al **fork del usuario**
  (`github.com:wachin/monomusic`), no al repo original. Verificado con
  `git remote -v`. El desarrollo continúa aquí.
- ✅ Commit `1d23e41` (2026-10-27): `fixer: syntax fix, restore a!/|
  conversions, correct superscript codes` — `js/chordhighlight.js`, `styles.css`
  y `HANDOFF.md`.
- ✅ Commit `4f4926e` (2026-10-27): `add fixer tests, node:test + jsdom` —
  `test/fixer.test.js`, `package.json`, `package-lock.json`, `.gitignore`,
  `HANDOFF.md`. **Ninguno de los dos está push-eados.** El commit `174a2ef`
  que mencionaba este archivo en versiones anteriores no existe en este clon.
- ✅ Commit `09a2b53` (2026-10-27): `re-export font from sfdir, restore l!
  bar ligature` — `MonoMusic-Regular.{ttf,woff,woff2}` (re-export, ver §3e),
  `source/monomusic.sfdir/bar.glyph` y `HANDOFF.md`. **Working tree limpio.**
  Ningún commit de los tres está push-eados. El commit `174a2ef` que
  mencionaba este archivo en versiones anteriores no existe en este clon.

## 2. Cómo continuar

```bash
git status              # ver el estado de los cambios locales
git diff                # revisar el diff antes de commitear
npm install             # una vez, para los tests (jsdom)
npm test                # node --test → test/fixer.test.js
```

El remoto ya es el fork; no hace falta `git remote set-url` ni `cherry-pick`.
Si decides commitear, el repo original usa mensajes cortos y en minúsculas
("better linespacing", "ligature update, better ÷ sign").

## 3. Qué se hizo (working tree actual)

### `js/chordhighlight.js`

**a) Fix crítico: el archivo no compilaba.** Faltaba el `});` que cierra
`$(".text").each(...)` en el paso de normalización, así que *todo* el fixer
muerto con `SyntaxError: missing ) after argument list` → `convert is not
defined`. Restaurado.

**b) Conversiones restauradas** (se habían borrado en la iteración anterior y
rompían el checklist de la §4):

| Conversión | Dónde | Motivo |
|------------|-------|--------|
| `葎→Δ` (bold delta), `A!→Δ` | paso 1 | `A!` es la ligadura de la fuente para Δ; sin normalizar, highlight no lo matchea |
| `\|→l!` | paso 1 | la fuente liga `l`+`!` → glifo `bar`; sin esto la tablatura pierde sus barras |
| lista `wordsOnly` de notas simples (`A..G`, `H`, con bemoles) | 3ª llamada a `highlight` | sin ella, los acordes "pelados" (`C`, `G`, `E`…) no se resaltan ni entran al bloque shrink |
| `maj7→Δ7`, `M7→Δ7`, `min7→m7`, `min→m`, `aug→+`, `dim→o` | bloque shrink | sin ellas, `Cmaj7` salía como `C`+`ᵃj⁷` (basura) en vez de `CΔ7` |
| `♯/♭/♮/𝄪/𝄫 → E00C/E00A/E00B/E00D/E00E` | bloque shrink | los sostenidos/bemoles deben ir a los glifos **superíndice** PUA, no quedarse como caracteres base |

**c) Códigos PUA corregidos (antes apuntaban al glifo equivocado):**

| Código | Glifo real (verificado en `MonoMusic-Regular.ttf`) | Uso correcto |
|--------|-----------------------------------------------------|--------------|
| `E009` | `nine.sup` | solo el dígito **9** |
| `E00A` | `flat.sup` | **♭** superíndice |
| `E019` | `minus.sup` | **−** superíndice (`-`) |
| `E01A` | `plus.sup` | **+** superíndice (`+`) |

Antes el código hacía `+`→`E009` y `-`→`E00A`, o sea: `C+` se veía como `C⁹`
y `C-` como `C♭`. Ahora `+`→`E01A` y `-`→`E019`, **distintos y correctos**.

**d) Bug de codepoint:** la normalización de planos usaba `U+266E`, que es
**♮ natural**; el bemol es **`U+266D`**. Corregido en el paso 2 (`♭→b`) y en el
bloque shrink (`♭(266D)→E00A`).

**Flujo actual del fixer (respétalo si refactorizas):**

1. Marcadores legacy: `b!→b`, `#!→#`, `葎→Δ`, `A!→Δ`
2. Símbolos → ASCII: `♯(266F)→#`, `♭(266D)→b`, `°(00B0)→o`
3. Tabs: `|→l!` (ligadura de la fuente → glifo barra)
4. `$(this).text(text)` + cierre del `.each` + llamadas a `highlight.js`
   (3 listas: sufijos/voicings, acordes por nota con 200+ nombres, y notas
   simples con `wordsOnly: true`; todas con `caseSensitive: true`)
5. Bloque shrink sobre `.highlight`, **en este orden**:
   `m7b5→ø` (antes de `b→♭`), `#→♯`, `b→♭`,
   `maj7→Δ7`, `M7→Δ7`, `min7→m7`, `min→m`, `aug→+`, `dim→o`,
   `+→E01A`, `-→E019`, `♭→E00A`, `♮→E00B`, `♯→E00C`, `𝄪→E00D`, `𝄫→E00E`,
   luego encoding de letras/números (`a→E01B`, `d→E01C`, `s→E021`, `u→E022`,
   `1..9→E001..E009`, `o→E016`, `ø→E017`, `M→E015`, `Δ→E018`)

**Nota sobre `-`:** el autor original convertía `-→m` (mayúscula/minúscula
normal) para el acorde menor. Se decidió respetar el diseño del fixer actual:
`-` → superíndice `minus.sup` (U+E019), que también significa
menor y además sirve para alteraciones como `7-5`. Si prefieres `C-` → `Cm`,
restaura `text.replace(/-/g, "m")` **antes** del encoding a PUA (y quita la
línea `+`/`-`→PUA para `-`); es un cambio de un reemplazo.

### `styles.css` — 2 modernizaciones
- `font-display: swap` añadido a ambas reglas `@font-face`.
- Prefijos redundantes `-moz-`/`-ms-`/`-webkit-` de `font-feature-settings`
  eliminados de `.super`.

### e) Fuente: auditoría del manual + re-export desde `.sfdir` (2026-10-27)

**Auditoría `resources/MonoManual.pdf` ↔ `cmap`** (PyMuPDF + fontTools): el
manual compone 329 caracteres distintos en `MonoMusic-Regular`; 328 los cubre
la fuente. El único "faltante" es `U+2011` (NON-BREAKING HYPHEN) y **no es un
hueco de diseño**: en el PDF se dibuja con el glifo del guion normal (mismo
GID que `-`), y `U+2011` no está ni en la fuente ni en los binarios. Solo
afecta si alguien pega un guion no separable desde un procesador de textos.

**Deriva detectada entre `source/monomusic.sfdir/` y los binarios embarcados:**

- La fuente tenía `eleven.sup` (`U+E040`) y `thirteen.sup` (`U+E041`)
  **sin exportar** → `C11`/`C13` no ligaban en la web.
- Los binarios tenían `U+000D` y `U+25FC`, **ausentes de la fuente**.
- El binario tenía la ligadura **`l exclam → bar` que NO estaba en la fuente**
  (`bar.glyph` no tenía línea `Ligature2`): re-exportar a ciegas habría borrado
  las barras de tablatura que el fixer genera con `|→l!`. Detectado por la
  verificación del diff, antes de tocar los binarios.

**Acciones realizadas:**
1. `source/monomusic.sfdir/bar.glyph`: añadida
   `Ligature2: "'liga' Standard Ligatures lookup 1-1" l exclam`
   (mismo patrón que `flat.glyph`, `_Delta.glyph`, `oslash.glyph`: la línea va
   justo antes de `EndChar`).
2. Re-export con FontForge 20230101 → `MonoMusic-Regular.ttf`.
3. `WOFF` y `WOFF2` generados **desde ese TTF** con fontTools
   (`f.flavor = "woff" / "woff2"`), porque la exportación WOFF de FontForge
   omitía `.null` y `nonmarkingreturn` (444 glifos en vez de 446).

**Diff verificado (embarcado → nuevo)** — los tres formatos son idénticos entre
sí (446 glifos, mismo `cmap`, mismo orden de glifos):

| | antes | después |
|---|---|---|
| `cmap` | 443 | 443: `+U+E040 eleven.sup`, `+U+E041 thirteen.sup`, `−U+000D`, `−U+25FC` |
| ligaduras GSUB | 62 | **64**: `+ one.sup one.sup→eleven.sup`, `+ one.sup three.sup→thirteen.sup`, `l exclam→bar` conservada |
| `OS/2.fsType` | 4 | 0 — el `font.props` declara `FSType: 0`, así que el nuevo respeta la fuente |
| `name` id 4 | `MonoMusic regular` | `MonoMusic Regular` |
| tablas | incluía `webf` (basura) | sin `webf` |

**Verificación tras el cambio:** `npm test` 13/13 ✅ y prueba visual en el
navegador con la fuente nueva servida por HTTP (sha256 del `woff2` comprobado
contra el disco): barras de tablatura ✅, `C⁺ C⁻ CΔ7 Cø Gsus4 B♭7` ✅ y
`C¹¹`/`C¹³` ahora ligados en el glifo diseñado ✅.

**Cómo re-exportar** (no requiere root: FontForge se descarga y extrae en
local; en este entorno `sudo` pedía contraseña):

```bash
# 1. dependencias: solo las que falten, extraídas en local
mkdir -p .fontforge-local/debs && cd .fontforge-local
LC_ALL=C apt-cache depends --recurse --no-recommends --no-suggests \
  fontforge python3-fontforge | grep -E '^\s+(Depends|PreDepends):' \
  | awk '{print $2}' | sed 's/[<>]//g' | sort -u > all_deps.txt
# filtrar las ya instaladas y descargar (apt-get download no necesita root)
cd debs && apt-get download fontforge fontforge-common libfontforge4 \
  libspiro1 libwoff1 libtextwrap1
cd .. && mkdir -p root && for d in debs/*.deb; do dpkg-deb -x "$d" root/; done

# 2. exportar (lang=ff evita necesitar python3-fontforge)
export LD_LIBRARY_PATH=$PWD/root/usr/lib/x86_64-linux-gnu
export FONTFORGE_SHARE=$PWD/root/usr/share/fontforge
root/usr/bin/fontforge -lang=ff -c 'Open($1); Generate($2); Close();' \
  ../source/monomusic.sfdir "$PWD/MonoMusic-Regular.ttf"

# 3. woff/woff2 desde el ttf (fontTools) + diff de cmap/GSUB con fontTools
# 4. borrar .fontforge-local cuando termines (~25 MB)
```

## 4. Estado de verificación (hecho ✅)

- **Tests automatizados añadidos** (2026-10-27): `npm test` → `node --test` →
  `test/fixer.test.js` (13 tests, node:test + jsdom como devDependency).
  Cargan el `index.html` real con el jquery/highlight/chordhighlight reales,
  pegan texto en `#text`, llaman `convert()` y afirman los **codepoints** de
  `#hyp` (hace falta, porque la salida usa glifos superíndice del PUA).
  Cubren: `C+`/`C-` distintos, maj7, m7b5, `A!`, sus/add, ♭♯ desde ASCII y
  unicode, dim/aug/°/min, `H`, tablatura `|→l!` con dígitos intactos, notas
  simples resaltadas, prosa intacta y una pasada mixta completa.
  Verificado con mutación: cambiar `+`→`E01A` por otro código hace fallar 3
  tests, así que la suite detecta la regresión.
- **E2E manual con navegador ejecutado el 2026-10-27** con Chrome headless sobre el `index.html`
  real (servido con `python3 -m http.server`), pegando la entrada
  `C+ C- Cmaj7 Cm7b5 A! Gsus4 Bb7` + `E|---5-7---` y llamando `convert()`.
- Resultado (codepoints leídos del DOM, todos correctos):

| Entrada | Salida esperada | Salida real |
|---------|-----------------|-------------|
| `C+` | C + plus.sup | `C U+E01A` ✅ |
| `C-` | C + minus.sup (distinto de `+`) | `C U+E019` ✅ |
| `Cmaj7` | CΔ7 | `C U+E018 U+E007` ✅ |
| `Cm7b5` | Cø | `C U+E017` ✅ |
| `A!` | Δ | `U+E018` ✅ |
| `Gsus4` | G + sus4 superíndice | `G U+E021 U+E022 U+E021 U+E004` ✅ |
| `Bb7` / `B♭7` | B♭7 | `B U+E00A U+E007` ✅ |
| `F♯m7` / `F#m7` | F♯m7 | `F U+E00C m U+E007` ✅ |
| `Amin7`, `Caug`, `Cdim`, `C°`, `H7`, `E7#9`, `CmM7`, `Gadd9` | correctos | todos ✅ |
| `E\|---5-7---` | barra + números intactos | `E l ! - - - 5 - 7 - - -` (la fuente liga `l!`→barra) ✅ |

- Verificado además con `node --check js/chordhighlight.js` (parse OK) y con
  inspección del `cmap`/`GSUB` de `MonoMusic-Regular.ttf` vía fontTools:
  ligaduras reales `l!→bar`, `A!→Delta`, `b!→flat`, `#!→sharp`, `o!→oslash`,
  y el mapa PUA completo (E000–E030, ver tabla de la §3c).
- Las ligaduras están activas: `font-feature-settings: "liga","clig"` en
  `body`/`textarea` (`styles.css`), heredado por `#hyp`.

**Reproduce las pruebas:**
```bash
npm install && npm test          # suite automática (13 tests)

python3 -m http.server 8123      # y/o la prueba visual manual:
# abrir http://localhost:8123/index.html, pegar el texto del checklist, clic "Fix"
```

## 5. Tareas pendientes (prioridad sugerida)

1. ~~Prueba visual E2E del fixer~~ **HECHA** (ver §4).
2. ~~Glifos faltantes en `source/monomusic.sfdir/`~~ **AUDITORÍA HECHA** (§3e):
   el manual no descubre ningún hueco real de diseño; solo queda **opcional**
   mapear `U+2011` (guion no separable) al glifo `hyphen` existente en
   FontForge, sin dibujar nada nuevo.
3. **Prefijos CSS restantes** en `body, textarea` (`styles.css` líneas ~23-25)
   — redundantes hoy, se dejaron por escopo mínimo.
4. **Dependencias vintage**: jQuery + Foundation 5.x (`js/vendor/`, `js/foundation/`).
   Modernizar solo si hay un objetivo concreto; no refactorizar por refactorear.
5. Actualizar `README.md` (enlaces raw a GitHub del repo original, imagen rota potencial).
6. ~~Commitear el re-export de la fuente~~ **HECHO** (`09a2b53`): binarios,
   `bar.glyph` y este `HANDOFF.md`. (Fixer: `1d23e41`; tests: `4f4926e`.)
   **Falta hacer `git push` a `origin` (fork `wachin/monomusic`).**
7. **Test de contrato fuente↔fixer**: que todo código que emite
   `chordhighlight.js` y todo carácter que usa el manual exista en el `cmap`
   con el nombre de glifo esperado (`E01A=plus.sup`, `E019=minus.sup`, …) —
   evita repetir el bug `+→nine.sup` y detecta deriva binario↔fuente en CI.

## 6. Convenciones del proyecto

- Los acordes se detectan con `$('.text').highlight([...], {caseSensitive: true})`
  en `js/highlight.js` (plugin jQuery de Johann Burkard/Bartek Szopka).
- `js/prefix.js` (StyleFix/PrefixFree de Lea Verou) y `js/color.js`
  (jquery-simplecolorpicker) son librerías de terceros: **no editarlas**, actualizarlas
  como bloque completo si hace falta.
- Códigos privados `U+E0xx` = glifos superíndice de la fuente MonoMusic.
  **Verifica siempre el glifo real antes de reasignar un código** — la única
  fuente de verdad es el `cmap` de `MonoMusic-Regular.ttf` (o los `.glyph` de
  `source/monomusic.sfdir/`), no el comentario de una línea de código.
- El repo original usa mensajes de commit cortos y en minúsculas
  ("better linespacing", "ligature update, better ÷ sign"). Seguir ese estilo.

## 7. Contexto de dominio (acordes)

- `H` = nota B (notación escandinava/alemana; el fixer tiene botón "B→H").
- `Δ7` = maj7, `ø` = m7b5 (semidisminuido), `°`/`o` = dim, `+` = aug,
  `-`/`m` = menor, `sus2`/`sus4`/`add2..add13` = acordes suspendidos/añadidos.
- Notación de entrada aceptada por el fixer: `#`/`b` para sostenido/bemol,
  y también `♯`/`♭` directos (se normalizan en el paso 2).
- Atajos de escritura que la fuente convierte por ligadura: `A!`→Δ, `b!`→♭,
  `#!`→♯, `o!`→ø, `bb!`→𝄫, `##!`→𝄪, `l!`→barra de tablatura.
