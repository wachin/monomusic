// MonoMusicFixer - pure port of the chord conversion pipeline
// (originally js/chordhighlight.js with jQuery + highlight.js).
//
// convert(inputText) -> HTML string where every chord token is wrapped in
// <span class="highlight"> and shrunk to MonoMusic superscript code points.
//
// The shrink step keeps the exact replacement order of the original fixer:
// that order is what makes e.g. Cmaj7 -> C+Delta+7 and Cm7b5 -> C+oslash come
// out right, and test/font_contract.py pins those assignments to the font's
// PUA code points.

export function nl2br(str) {
  // $2 already carries the newline; do not add another one.
  return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2');
}

// Step 1: normalize the raw input the way the original fixer did.
export function normalize(text) {
  let t = text;
  t = t.replace(/b\!/g, 'b');
  t = t.replace(/\u0023\!/g, '#');
  t = t.replace(/\u1D6AB/g, '\u0394'); // only greek Delta
  t = t.replace(/A\!/g, '\u0394'); // A! is the font ligature for Delta

  // musical symbols -> ASCII so the chord matcher can see them
  t = t.replace(/\u266F/g, '#'); // sharp sign -> #
  t = t.replace(/\u266D/g, 'b'); // flat sign -> b (NOT U+266E natural)
  t = t.replace(/\u00B0/g, 'o'); // degree sign -> o

  // tabs: | -> l!, the font ligates l! into the bar glyph
  t = t.replace(/\|/g, 'l!');
  return t;
}

// Step 2: chord detection. The original used highlight.js with phrase lists;
// this port uses one regex that matches the same vocabulary:
//   [A-H] root + optional accidental (#, b) + optional suffix + optional /bass
// Bare roots are only matched on word boundaries, like wordsOnly did.
const SUFFIX_SOURCE = [
  'm7b5', 'mM7', 'm\\/M7', 'm\\/maj7', 'm\\/ma7',
  'maj7\\+5', 'maj7b6', 'maj7\\#11', 'maj7\\#4', 'maj7', 'maj9', 'maj13', 'maj\\#4', 'maj',
  'ma7b6', 'ma7',
  'mb6', 'M7b6', 'M7', 'M',
  'min7', 'min', 'mi7', 'm7', 'm9', 'm11', 'm13', 'm6', 'm',
  'm\\u03947', 'm\\u0394', '-\\u03947',
  '\\-7', '-',
  '7\\#5', '7b5', '7\\#9', '7b9', '7\\#11', '7b13', '7\\#4', '7sus4', '7b9sus', '7',
  'b9sus', 'alt7', 'alt', 'phryg', 'dom',
  'sus2', 'sus4', 'sus',
  'dim7', 'dim', 'aug',
  'add13', 'add11', 'add9', 'add6', 'add2',
  '69', '6\\/9', '6', '5', '9', '11', '13',
  'o7', 'o', 'ø',
  '\\+',
];
// longest alternatives first so e.g. maj7 wins over maj, m7b5 over m7
SUFFIX_SOURCE.sort((a, b) => b.length - a.length);
const SUFFIX = '(?:' + SUFFIX_SOURCE.join('|') + ')';

const ROOT = '[A-H]';
const ACCIDENTAL = '(?:\\#|b|\\u266F|\\u266D)';
const BASS = '(?:\\/[A-H]' + ACCIDENTAL + '?)';
// A chord token: root + accidental + (suffix or bare) + optional slash bass.
const CHORD = new RegExp(
  '(?:' + ROOT + ACCIDENTAL + '?' + SUFFIX + '?' + BASS + '?' +
  '|\\u03947|\\u0394)',
  'g'
);
// Bare-root tokens (no suffix) must sit on word boundaries.
const WORDISH = /[A-Za-z0-9]/;

export function isChordToken(text, index, length) {
  const before = index > 0 ? text[index - 1] : '';
  const after = index + length < text.length ? text[index + length] : '';
  return !WORDISH.test(before) && !WORDISH.test(after);
}

// Step 3: the shrink step, in the original order.
export function shrink(text) {
  let t = text;
  // m7b5 BEFORE the flat conversion, so the pattern can match
  t = t.replace(/m7b5/g, '\u00F8   ');

  // accidentals back to their musical symbols (encoded to PUA below)
  t = t.replace(/\#/g, '\u266F');
  t = t.replace(/b/g, '\u266D');

  // worded chord suffixes -> compact symbols
  t = t.replace(/maj7/g, '\u03947  ');
  t = t.replace(/ma7/g, '\u03947');
  t = t.replace(/M7/g, '\u03947');
  t = t.replace(/min7/g, 'm7  ');
  t = t.replace(/min/g, 'm  ');
  t = t.replace(/aug/g, '+  ');
  t = t.replace(/dim/g, 'o  ');
  t = t.replace(/maj(?![0-9])/g, '\u0394  ');

  // + and - get DISTINCT superscripts: plus.sup vs minus.sup
  t = t.replace(/\u002B/g, '\uE01A');
  t = t.replace(/\u002D/g, '\uE019');

  // encode accidentals to their superscript glyphs
  t = t.replace(/\u266D/g, '\uE00A'); // flat
  t = t.replace(/\u266E/g, '\uE00B'); // natural
  t = t.replace(/\u266F/g, '\uE00C'); // sharp
  t = t.replace(/\u1D12A/g, '\uE00D'); // double sharp
  t = t.replace(/\u1D12B/g, '\uE00E'); // double flat

  // protect 'alt' and 'maj' from letter superscripting
  t = t.replace(/alt/g, 'ALT_PLACEHOLDER');
  t = t.replace(/maj/g, 'MAJ_PLACEHOLDER');

  // hardcoded superscripts
  t = t.replace(/a/g, '\uE01B');
  t = t.replace(/d/g, '\uE01C');
  t = t.replace(/s/g, '\uE021');
  t = t.replace(/u/g, '\uE022');
  t = t.replace(/ALT_PLACEHOLDER/g, 'alt');
  t = t.replace(/MAJ_PLACEHOLDER/g, '\u0394');
  t = t.replace(/1/g, '\uE001');
  t = t.replace(/2/g, '\uE002');
  t = t.replace(/3/g, '\uE003');
  t = t.replace(/4/g, '\uE004');
  t = t.replace(/5/g, '\uE005');
  t = t.replace(/6/g, '\uE006');
  t = t.replace(/7/g, '\uE007');
  t = t.replace(/8/g, '\uE008');
  t = t.replace(/9/g, '\uE009');
  t = t.replace(/o/g, '\uE016');
  t = t.replace(/\u00F8/g, '\uE017'); // oslash (was already a symbol)
  t = t.replace(/M/g, '\uE015');
  t = t.replace(/\u0394/g, '\uE018'); // Delta
  return t;
}

// Escape text for HTML so lyrics with < > & stay literal.
export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Full pipeline: normalized text -> HTML with highlighted, shrunk chords.
export function convert(inputText) {
  const text = normalize(inputText);
  let html = '';
  let last = 0;
  CHORD.lastIndex = 0;
  let match;
  while ((match = CHORD.exec(text)) !== null) {
    const token = match[0];
    const at = match.index;
    // avoid zero-width matches
    if (token.length === 0) {
      CHORD.lastIndex += 1;
      continue;
    }
    if (!isChordToken(text, at, token.length)) {
      continue; // regex is global; keep scanning from after this attempt
    }
    html += nl2br(escapeHtml(text.slice(last, at)));
    html += '<span class="highlight">' + escapeHtml(shrink(token)) + '</span>';
    last = at + token.length;
    CHORD.lastIndex = last;
  }
  html += nl2br(escapeHtml(text.slice(last)));
  return html;
}

export default { convert, nl2br, normalize, shrink, escapeHtml };
