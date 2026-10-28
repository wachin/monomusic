'use strict';
// Tests for the MonoMusicFixer pipeline (src/fixer.mjs), the module shared
// by the web app and these tests. They feed text into convert() and assert on
// the codepoints of the rendered output, because the result uses private-use
// superscript glyphs.
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

// PUA superscripts, verified against the cmap of MonoMusic-Regular.ttf
const SUP = {
  '1': '\uE001', '2': '\uE002', '3': '\uE003', '4': '\uE004', '5': '\uE005',
  '6': '\uE006', '7': '\uE007', '8': '\uE008', '9': '\uE009',
  flat: '\uE00A', natural: '\uE00B', sharp: '\uE00C',
  M: '\uE015', o: '\uE016', oslash: '\uE017', Delta: '\uE018',
  minus: '\uE019', plus: '\uE01A', a: '\uE01B', d: '\uE01C',
  s: '\uE021', u: '\uE022',
};

let convert;
let nl2br;

before(async () => {
  ({ convert, nl2br } = await import('../src/fixer.mjs'));
  assert.equal(typeof convert, 'function', 'fixer module exposes convert()');
});

// Render `input` through the fixer and return the text the user would see.
function fix(input) {
  const html = convert(input);
  const dom = new JSDOM(`<div id="hyp">${html}</div>`);
  return dom.window.document.getElementById('hyp').textContent;
}

// The shrink step pads some replacements with spaces; they are cosmetic.
function trimmed(input) {
  return fix(input).trim();
}

// Render and keep the document, for tests that inspect the markup.
function fixDom(input) {
  const html = convert(input);
  const dom = new JSDOM(`<div id="hyp">${html}</div>`);
  return dom.window.document.getElementById('hyp');
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
  const hyp = fixDom('C D E');
  const spans = hyp.querySelectorAll('.highlight');
  assert.equal(spans.length, 3, 'each bare root note is wrapped in .highlight');
});

test('line breaks are preserved once, not doubled by markup plus pre-wrap', () => {
  const input = 'first line\nsecond line\nthird line';
  const html = convert(input);
  const output = fix(input);
  assert.equal(nl2br(input), input);
  assert.equal((output.match(/\n/g) || []).length, 2);
  assert.equal((html.match(/<br\s*\/?\s*>/g) || []).length, 0);
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
