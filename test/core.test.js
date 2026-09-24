const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../js/repeatseq-core.js');
const round = (n, places) => n === null ? null : Number(n.toFixed(places));

const samples = [
  ['caesar', 614, 83, 149, 'WRVHHNWKH', 9, [425, 547],
    [[20, 13, 1.7450], [18, 13, 1.5705], [10, 21, 1.4094]], null, 1, 0.0651, 1, 'mono', 0.0651,
    [51.63, 3.35, 0.22, 0.01]],
  ['shift', 614, 83, 149, 'JEIUUAJXU', 9, [425, 547],
    [[20, 13, 1.7450], [18, 13, 1.5705], [10, 21, 1.4094]], null, 1, 0.0651, 1, 'mono', 0.0651,
    [51.63, 3.35, 0.22, 0.01]],
  ['vigenere1', 614, 39, 64, 'LRPHUP', 6, [230, 280, 360],
    [[20, 19, 5.9375], [5, 61, 4.7656], [10, 27, 4.2188]], 5, 5, 0.0667, 8.13, 'poly', 0.0417,
    [13.54, 0.56, 0.02, 0]],
  ['vigenere2', 4937, 288, 962, 'MEMLESJXEXZI', 2221, [0, 2716],
    [[14, 593, 8.6299], [7, 627, 4.5624], [18, 117, 2.1892]], 14, 14, 0.0716, 11.87, 'poly', 0.0407,
    [820.33, 33.37, 1.36, 0.06]],
  ['random', 2000, 116, 119, 'IAXA', 4, [427, 631],
    [[17, 13, 1.8571], [18, 10, 1.5126], [19, 8, 1.2773]], null, null, null, null, 'poly', 0.0384,
    [112.74, 4.32, 0.17, 0.01]]
];

for (const [name, n, rows, gaps, seq, len, positions, top, k, L, avg, friedman, type, ic, chance] of samples) {
  test(`known answer: ${name}`, () => {
    const file = name === 'random' ? 'random.txt' : 'ciphertext.txt';
    const a = core.analyze(fs.readFileSync(path.join(__dirname, '..', 'samples', name, file), 'utf8'));
    assert.equal(a.text.length, n);
    assert.equal(a.rows.length, rows);
    assert.equal(a.kasiski.gapCount, gaps);
    assert.equal(a.rows[0].seq.slice(0, 12), seq);
    assert.equal(a.rows[0].len, len);
    assert.deepEqual(a.rows[0].positions, positions);
    const ranked = [...a.kasiski.table].sort((a, b) => b.ratio - a.ratio).slice(0, 3);
    assert.deepEqual(ranked.map(r => [r.k, r.count, round(r.ratio, 4)]), top);
    assert.equal(a.kasiski.best, k);
    assert.equal(a.columnIC.best, L);
    if (L !== null) assert.equal(round(a.columnIC.table.find(r => r.L === L).avg, 4), avg);
    assert.equal(round(a.friedman, 2), friedman);
    assert.equal(a.cipherType.type, type);
    assert.equal(round(a.cipherType.ic, 4), ic);
    assert.deepEqual(a.chance.slice(0, 4).map(r => round(r.expected, 2)), chance);
    assert.equal(a.truncated, false);
  });
}

const examples = [
  ['ABCXYZABCQQQQXYZ', true, [['ABC', [0, 6], [6]], ['XYZ', [3, 13], [10]], ['QQQ', [9, 10], [1]]]],
  ['AAAAAA', true, [['AAAAA', [0, 1], [1]], ['AAAA', [0, 1, 2], [1, 1]], ['AAA', [0, 1, 2, 3], [1, 1, 1]]]],
  ['ABCDABCDABCD', true, [['ABCDABCD', [0, 4], [4]], ['ABCD', [0, 4, 8], [4, 4]]]],
  ['THEQUICKTHE', true, [['THE', [0, 8], [8]]]],
  ['ABCDEFG', true, []],
  ['AB CD AB CD AB CD', true, [['ABCDABCD', [0, 4], [4]], ['ABCD', [0, 4, 8], [4, 4]]]],
  ['AB CD AB CD AB CD', false, [['AB CD AB CD', [0, 6], [6]], ['AB CD', [0, 6, 12], [6, 6]]]]
];
for (const [raw, lettersOnly, expected] of examples) {
  test(`repeat example: ${raw}, ${lettersOnly}`, () => {
    const rows = core.findRepeats(core.normalize(raw, lettersOnly));
    assert.deepEqual(rows.map(r => [r.seq, r.positions, r.gaps]), expected);
    rows.forEach(r => {
      assert.equal(r.len, r.seq.length);
      assert.equal(r.count, r.positions.length);
    });
  });
}

for (const [raw, letters, all] of [
  ['Attack at dawn!', 'ATTACKATDAWN', 'ATTACK AT DAWN!'],
  ['ｈｅｌｌｏ　ＷＯＲＬＤ', 'HELLOWORLD', 'HELLO WORLD'],
  ['Ünïcode ß 123', 'UNICODESS', 'UNICODE SS 123'],
  ['', '', '']
]) {
  test(`normalize: ${raw}`, () => {
    assert.equal(core.normalize(raw), letters);
    assert.equal(core.normalize(raw, false), all);
  });
}

function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function brute(text) {
  const found = new Map();
  for (let i = 0; i < text.length; i++) {
    for (let j = i + 3; j <= text.length; j++) {
      const seq = text.slice(i, j);
      if (!found.has(seq)) found.set(seq, []);
      found.get(seq).push(i);
    }
  }
  return [...found].filter(([seq, ps]) => {
    const left = new Set(ps.map(p => p === 0 ? '<start>' : text[p - 1]));
    const right = new Set(ps.map(p => p + seq.length === text.length ? '<end>' : text[p + seq.length]));
    return ps.length > 1 && left.size > 1 && right.size > 1;
  }).sort((a, b) => a[0].localeCompare(b[0]));
}

test('500 seeded brute-force comparisons, lengths 5-64 and alphabets 2-5', () => {
  const next = random(20260925);
  for (let trial = 0; trial < 500; trial++) {
    const length = 5 + trial % 60;
    const alphabet = 2 + trial % 4;
    const text = Array.from({ length }, () => core.ALPHA[Math.floor(next() * alphabet)]).join('');
    const actual = core.findRepeats(text).map(r => [r.seq, r.positions]).sort((a, b) => a[0].localeCompare(b[0]));
    assert.deepEqual(actual, brute(text), text);
  }
});

test('degenerate input is bounded', () => {
  const started = performance.now();
  const a = core.analyze('A'.repeat(10000));
  assert.equal(a.truncated, true);
  assert.ok(a.rows.length <= 300);
  assert.ok(performance.now() - started < 3000);
});

test('uniform seeded 10000 letters are not truncated', () => {
  const next = random(8128);
  const text = Array.from({ length: 10000 }, () => core.ALPHA[Math.floor(next() * 26)]).join('');
  assert.equal(core.analyze(text).truncated, false);
});

test('kasiski selects smallest qualifying divisor, including top itself', () => {
  assert.equal(core.kasiski([{ gaps: [20, 20, 20, 20, 20] }]).best, 20);
  const gaps = [...Array(19).fill(20), ...Array(42).fill(5), 3, 3, 3];
  assert.equal(core.kasiski([{ gaps }]).best, 5);
  assert.equal(core.RATIO_MIN, 2.5);
  assert.equal(core.kasiski([{ gaps: Array.from({ length: 100 }, (_, i) => i + 1) }]).best, null);
  assert.equal(core.kasiski([]).best, null);
});

test('pure API and boundary values', () => {
  assert.equal(core.ic(''), 0);
  assert.equal(core.ic('A'), 0);
  assert.equal(core.expectedByChance(2, 3, 1), 0);
  assert.equal(core.friedman(''), null);
  assert.equal(core.cipherType('A'.repeat(99)).type, 'insufficient');
  assert.equal(core.LIMIT_CHARS, 2000000);
  assert.equal(core.LIMIT_POSITIONS, 200000);
});
