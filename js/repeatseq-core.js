// Day028 第1弾の参照実装（反復の検出・カシスキーの倍率・列IC・フリードマン・偶然の見込み）
'use strict';

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// 前処理: NFKD→結合文字（アクセント）を除く→大文字。lettersOnly=true ならさらに A-Z 以外を除く。false なら空白・記号・改行も1文字として残す
function normalize(raw, lettersOnly = true) {
  const up = String(raw).normalize('NFKD').replace(/\p{M}/gu, '').toUpperCase();
  return lettersOnly ? up.replace(/[^A-Z]/g, '') : up;
}

// 極大反復: どの2つの出現位置の組でも、左右どちらかに1文字も伸ばせない文字列（長さ minLen 以上）
// 位置の差（gap）ごとに対角線を走査し、一致が続く区間を1件の候補とする。候補の文字列の集合＝極大反復の集合
// 上限: 候補の文字数の合計 LIMIT_CHARS、出現位置の合計 LIMIT_POSITIONS。超えたら打ち切って truncated=true（同じ文字の連続などの退化した入力で固まらないため）
const LIMIT_CHARS = 2000000, LIMIT_POSITIONS = 200000;
function findRepeats(text, minLen = 3) {
  const n = text.length;
  const set = new Set();
  let chars = 0, truncated = false;
  scan: for (let gap = 1; gap < n; gap++) {
    let run = 0;
    for (let i = 0; i + gap <= n; i++) {
      const same = i + gap < n && text[i] === text[i + gap];
      if (same) { run++; continue; }
      if (run >= minLen) {
        const seq = text.slice(i - run, i);
        if (!set.has(seq)) {
          chars += run;
          if (chars > LIMIT_CHARS) { truncated = true; break scan; }
          set.add(seq);
        }
      }
      run = 0;
    }
  }
  const rows = [];
  let total = 0;
  for (const seq of set) {
    const positions = [];
    for (let p = text.indexOf(seq); p !== -1; p = text.indexOf(seq, p + 1)) positions.push(p);
    total += positions.length;
    if (total > LIMIT_POSITIONS) { truncated = true; break; }
    const gaps = positions.slice(1).map((p, k) => p - positions[k]);
    rows.push({ seq, len: seq.length, count: positions.length, positions, gaps });
  }
  // 既定の並び: 長さの降順→最初の位置の昇順
  rows.sort((a, b) => b.len - a.len || a.positions[0] - b.positions[0]);
  rows.truncated = truncated;
  return rows;
}

// 文字の一致率（IC）: 同じ文字を2つ選ぶ確率
function ic(text) {
  const n = text.length;
  if (n < 2) return 0;
  const f = new Map();
  for (const c of text) f.set(c, (f.get(c) || 0) + 1);
  let s = 0;
  for (const v of f.values()) s += v * (v - 1);
  return s / (n * (n - 1));
}

// 偶然の見込み: 長さLの一致が偶然に起きる組の期待数＝C(n-L+1, 2)×κ^L（κ＝この文字列のIC）
function expectedByChance(n, L, kappa) {
  const m = n - L + 1;
  if (m < 2) return 0;
  return (m * (m - 1) / 2) * Math.pow(kappa, L);
}

// 倍率の下限: これ未満なら「はっきりした偏りなし」（単一換字 caesar 1.74・random 1.86、ヴィジュネル vigenere1 5.94・vigenere2 8.63）
const RATIO_MIN = 2.5;
// カシスキー: 隣り合う出現の間隔をすべて集め、2〜maxKで割り切れる数を数える。倍率＝割り切れる数÷（全間隔÷k）
function kasiski(rows, maxK = 20) {
  const gaps = rows.flatMap(r => r.gaps);
  const G = gaps.length;
  const table = [];
  for (let k = 2; k <= maxK; k++) {
    const count = gaps.filter(g => g % k === 0).length;
    table.push({ k, count, expected: G / k, ratio: G ? count * k / G : 0 });
  }
  // 推定: 倍率が最大のkの約数（k自身を含む）のうち、倍率が最大の0.8倍以上ある最小のもの
  let best = null;
  if (G > 0) {
    const top = table.reduce((m, r) => r.ratio > m.ratio ? r : m);
    if (top.ratio >= RATIO_MIN) {
      best = table.filter(r => top.k % r.k === 0 && r.ratio >= 0.8 * top.ratio).sort((a, b) => a.k - b.k)[0].k;
    }
  }
  return { gapCount: G, table, best };
}

// 列IC: 鍵長Lで列に分け、列ごとのICを平均する。最初に threshold 以上になるLを推定とする
function columnIC(text, maxK = 20, threshold = 0.060) {
  const table = [];
  for (let L = 1; L <= maxK; L++) {
    let s = 0;
    for (let k = 0; k < L; k++) {
      let col = '';
      for (let i = k; i < text.length; i += L) col += text[i];
      s += ic(col);
    }
    table.push({ L, avg: s / L });
  }
  const hit = table.find(r => r.avg >= threshold);
  return { table, best: hit ? hit.L : null, threshold };
}

// フリードマンの式（英語 κp=0.065・一様 κr=1/26）。分母が0以下（ICが一様より低い）なら null、1未満は1とする（単一換字）
function friedman(text) {
  const n = text.length, I = ic(text);
  const kp = 0.065, kr = 1 / 26;
  const den = (kp - I) + n * (I - kr);
  if (n < 2 || den <= 0) return null;
  const v = (kp - kr) * n / den;
  return Math.max(1, v);
}

// 事前判定（A-Zだけで数える）: IC>0.060 単一換字／IC<0.045 多表式／その間 判定困難／100文字未満 データ不足
function cipherType(lettersText) {
  const v = ic(lettersText);
  if (lettersText.length < 100) return { type: 'insufficient', ic: v };
  if (v > 0.060) return { type: 'mono', ic: v };
  if (v < 0.045) return { type: 'poly', ic: v };
  return { type: 'uncertain', ic: v };
}

function analyze(raw, { lettersOnly = true, maxK = 20 } = {}) {
  const text = normalize(raw, lettersOnly);
  const letters = normalize(raw, true);
  const rows = findRepeats(text);
  const kappa = ic(text);
  return {
    text, rows, truncated: rows.truncated, kappa,
    chance: [3, 4, 5, 6, 7, 8].map(L => ({ L, expected: expectedByChance(text.length, L, kappa) })),
    kasiski: kasiski(rows, maxK),
    columnIC: columnIC(letters, maxK),
    friedman: friedman(letters),
    cipherType: cipherType(letters)
  };
}

const RepeatSeqCore = {
  ALPHA, LIMIT_CHARS, LIMIT_POSITIONS, RATIO_MIN,
  normalize, findRepeats, ic, expectedByChance, kasiski, columnIC, friedman, cipherType, analyze
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RepeatSeqCore;
}

