'use strict';
// E2E-ish tests for the MonoMusicFixer pipeline (js/chordhighlight.js).
// They load the real index.html + real jquery/highlight/chordhighlight scripts
// in jsdom, paste text into #text, call convert() and assert on the codepoints
// written into #hyp, because the output uses private-use superscript glyphs.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const INDEX = path.join(__dirname, '..', 'index.html');

// PUA superscripts, verified against the cmap of MonoMusic-Regular.ttf
const SUP = {
  '1': '\uE001', '2': '\uE002', '3': '\uE003', '4': '\uE004', '5': '\uE005',
  '6': '\uE006', '7': '\uE007', '8': '\uE008', '9': '\uE009',
  flat: '\uE00A', natural: '\uE00B', sharp: '\uE00C',
  M: '\uE015', o: '\uE016', oslash: '\uE017', Delta: '\uE018',
  minus: '\uE019', plus: '\uE01A', a: '\uE01B', d: '\uE01C',
  s: '\uE021', u: '\uE022',
};

let dom;
let win;

before(async () => {
  const virtualConsole = new VirtualConsole();
  // jsdom cannot parse the legacy foundation CSS; that must not fail the run
  const scriptErrors = [];
  virtualConsole.on('jsdomError', (err) => {
    if (!/Could not parse CSS/.test(String(err.message || err))) scriptErrors.push(err);
  });

  dom = await JSDOM.fromFile(INDEX, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole,
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('index.html load timed out')), 15000);
    dom.window.addEventListener('load', () => { clearTimeout(timer); resolve(); });
  });

  win = dom.window;
  assert.deepEqual(scriptErrors.map(String), [], 'no script errors while loading index.html');
  assert.equal(typeof win.convert, 'function',
    'convert() must exist — chordhighlight.js parses and loaded');
});

after(() => { if (dom) dom.window.close(); });

// Paste `input` into the fixer, press Fix, return the rendered text.
function fix(input) {
  win.document.getElementById('text').value = input;
  win.convert();
  return win.document.getElementById('hyp').textContent;
}

// The shrink step pads some replacements with spaces; they are cosmetic.
function trimmed(input) {
  return fix(input).trim();
}

test('chord with augmented fifth uses plus.sup, not nine.sup', () => {
  assert.equal(trimmed('C+'), 'C' + SUP.plus);
  assert.equal(SUP.plus, '\uE01A');
});

test('chord with minor third uses minus.sup, distinct from plus', () => {
  assert.equal(trimmed('C-'), 'C' + SUP.minus);
  assert.equal(SUP.minus, '\uE019');
  assert.notEqual(trimmed('C+'), trimmed('C-'));
});

test('maj7 renders as Delta7 superscripts', () => {
  assert.equal(trimmed('Cmaj7'), 'C' + SUP.Delta + SUP['7']);
  assert.equal(trimmed('Amaj7'), 'A' + SUP.Delta + SUP['7']);
  assert.equal(trimmed('CmM7'), 'Cm' + SUP.Delta + SUP['7']);
});

test('m7b5 renders as the half-diminished sign', () => {
  assert.equal(trimmed('Cm7b5'), 'C' + SUP.oslash);
});

test('A! is normalized to Delta (font ligature)', () => {
  assert.equal(trimmed('A!'), SUP.Delta);
});

test('sus and add chords encode every letter and digit as superscripts', () => {
  assert.equal(trimmed('Gsus4'), 'G' + SUP.s + SUP.u + SUP.s + SUP['4']);
  assert.equal(trimmed('Gadd9'), 'G' + SUP.a + SUP.d + SUP.d + SUP['9']);
});

test('flats and sharps land on flat.sup / sharp.sup, from ASCII and from unicode input', () => {
  assert.equal(trimmed('Bb7'), 'B' + SUP.flat + SUP['7']);
  assert.equal(trimmed('B\u266D7'), 'B' + SUP.flat + SUP['7'], 'U+266D flat input');
  assert.equal(trimmed('F#m7'), 'F' + SUP.sharp + 'm' + SUP['7']);
  assert.equal(trimmed('F\u266Fm7'), 'F' + SUP.sharp + 'm' + SUP['7'], 'U+266F sharp input');
  assert.equal(trimmed('E7#9'), 'E' + SUP['7'] + SUP.sharp + SUP['9']);
});

test('worded suffixes collapse to compact symbols', () => {
  assert.equal(trimmed('Caug'), 'C' + SUP.plus);
  assert.equal(trimmed('Cdim'), 'C' + SUP.o);
  assert.equal(trimmed('C\u00B0'), 'C' + SUP.o, 'degree sign input');
  assert.equal(trimmed('Amin7'), 'Am' + SUP['7']);
  assert.equal(trimmed('A-7'), 'A' + SUP.minus + SUP['7']);
});

test('danish H is a valid root', () => {
  assert.equal(trimmed('H7'), 'H' + SUP['7']);
});

test('tablature keeps its bar and digits: | becomes l! (font ligature for bar)', () => {
  assert.equal(trimmed('E|---5-7---'), 'El!---5-7---');
  assert.equal(fix('E|---5-7---').includes(SUP['5']), false, 'tab digits are not superscripted');
  assert.equal(fix('E|---5-7---').includes(SUP['7']), false);
});

test('bare note letters get highlighted so they enter the shrink step', () => {
  win.document.getElementById('text').value = 'C D E';
  win.convert();
  const spans = win.document.getElementById('hyp').querySelectorAll('.highlight');
  assert.equal(spans.length, 3, 'each bare root note is wrapped in .highlight');
});

test('prose around the chords is left untouched', () => {
  const prose = "Today is gonna be the day\nThat they're gonna throw it back to you";
  assert.equal(fix(prose), prose);
});

test('a full mixed passage converts end to end', () => {
  const out = fix('C+ C- Cmaj7 Cm7b5 A! Gsus4 Bb7\nE|---5-7---');
  const lines = out.split('\n').map((line) => line.trim());
  assert.equal(lines.length, 2);
  assert.deepEqual(lines[0].split(/\s+/), [
    'C' + SUP.plus,
    'C' + SUP.minus,
    'C' + SUP.Delta + SUP['7'],
    'C' + SUP.oslash,
    SUP.Delta,
    'G' + SUP.s + SUP.u + SUP.s + SUP['4'],
    'B' + SUP.flat + SUP['7'],
  ]);
  assert.equal(lines[1], 'El!---5-7---');
});