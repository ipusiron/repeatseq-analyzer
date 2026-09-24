// ページネーション設定
const ITEMS_PER_PAGE = 20;
let currentPage = 1;
let allMatches = [];

// ソート設定
let currentSortColumn = 'len';
let sortDirection = 'desc'; // 'asc' or 'desc'

// フィルター設定
let activeLengthFilters = new Set();

let analysis = null;

// ダークモード設定
let isDarkMode = false;

// ハイライト制御設定
let highlightEnabled = new Set(); // 有効な行の文字列

// ドラッグアンドドロップ機能
const dropZone = document.getElementById("drop-zone");
const cipherTextArea = document.getElementById("ciphertext");
const fileInput = document.getElementById("file-input");

// ファイル読み込み処理を共通化
function readFile(file) {
  invalidateResults();
  if (file.size > 1024 * 1024) {
    showMessage("ファイルは1MB以下にしてください。");
    return;
  }
  // テキストファイルかチェック
  if (file.type.startsWith("text/") || /\.txt$/i.test(file.name)) {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      cipherTextArea.value = event.target.result;
      // 自動的に解析を開始
      document.getElementById("analyze-btn").click();
    };
    
    reader.onerror = () => {
      showMessage("ファイルの読み込みに失敗しました。");
    };
    
    reader.readAsText(file);
  } else {
    showMessage("テキストファイル（.txt）を選択してください。");
  }
}

// クリックイベント
dropZone.addEventListener("click", () => {
  fileInput.click();
});

// ファイル選択時のイベント
fileInput.addEventListener("change", (e) => {
  const files = e.target.files;
  if (files.length > 0) {
    readFile(files[0]);
  }
});

// ドラッグオーバー時のイベント
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

// ドラッグが離れた時のイベント
dropZone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
});

// ドロップ時のイベント
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  
  const files = e.dataTransfer.files;
  
  if (files.length > 0) {
    readFile(files[0]);
  }
});


function node(tag, text = '', className = '') {
  const element = document.createElement(tag);
  element.textContent = String(text);
  if (className) element.className = className;
  return element;
}

function showMessage(message) {
  document.getElementById('input-message').textContent = message;
}

function invalidateResults() {
  analysis = null;
  allMatches = [];
  highlightEnabled.clear();
  document.querySelectorAll('[data-result]').forEach(el => { el.hidden = true; });
  showMessage('入力や設定を確認し、「解析する」を押してください。');
}

cipherTextArea.addEventListener('input', invalidateResults);
document.getElementById('ignore-spaces').addEventListener('change', invalidateResults);
document.getElementById('max-keylength').addEventListener('change', invalidateResults);

document.getElementById('analyze-btn').addEventListener('click', () => {
  const raw = cipherTextArea.value;
  const lettersOnly = document.getElementById('ignore-spaces').checked;
  const maxK = Number(document.getElementById('max-keylength').value);
  const text = RepeatSeqCore.normalize(raw, lettersOnly);
  invalidateResults();
  if (!text.length) {
    showMessage('解析する文字列を入力してください。');
    return;
  }
  if (text.length > 10000) {
    showMessage(`上限は10,000文字です（現在${text.length}文字）。`);
    return;
  }
  analysis = RepeatSeqCore.analyze(raw, { lettersOnly, maxK });
  allMatches = [...analysis.rows];
  currentPage = 1;
  currentSortColumn = 'len';
  sortDirection = 'desc';
  activeLengthFilters = new Set([3, 4, 5, 8]);
  highlightEnabled = new Set(allMatches.map(row => row.seq));
  renderAnalysis();
});

function renderAnalysis() {
  if (!analysis) return;
  document.querySelectorAll('[data-result]').forEach(el => { el.hidden = false; });
  showMessage(`解析しました。反復は${analysis.rows.length}件です。`);
  const warning = document.getElementById('truncated-warning');
  warning.hidden = !analysis.truncated;
  displayCipherTypeAnalysis(analysis.cipherType);
  generateLengthFilters();
  sortMatches();
  renderTableWithPagination();
  renderHighlights();
  renderStatisticsSummary();
  renderKeylengthHints();
  updateSortIndicators();
}

function lengthGroup(len) {
  return len >= 8 ? 8 : len >= 5 ? 5 : len;
}

function renderHighlights() {
  if (!analysis) return;
  const text = analysis.text;
  const priorities = new Uint8Array(text.length);
  allMatches.forEach(({ seq, len, positions }) => {
    if (!highlightEnabled.has(seq)) return;
    const priority = len >= 8 ? 3 : len >= 5 ? 2 : 1;
    positions.forEach(start => {
      for (let p = start; p < start + len; p++) {
        priorities[p] = Math.max(priorities[p], priority);
      }
    });
  });
  const classes = ['', 'highlight', 'highlight-medium', 'highlight-important'];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < text.length; i++) {
    fragment.appendChild(node('span', text[i], classes[priorities[i]]));
  }
  document.getElementById('highlighted-text').replaceChildren(fragment);
}

function shortList(values) {
  return values.slice(0, 6).join(', ') + (values.length > 6 ? ` …ほか${values.length - 6}個` : '');
}

function shortSequence(seq) {
  return seq.length > 24 ? `${seq.slice(0, 24)}…（全${seq.length}文字）` : seq;
}

function chanceText(value) {
  return value >= 1 ? `約${Math.round(value)}組` : `${value.toFixed(2)}組`;
}

function filteredRows() {
  return allMatches.filter(row => activeLengthFilters.has(lengthGroup(row.len)));
}

function renderTableWithPagination() {
  if (!analysis) return;
  const tbody = document.querySelector('#result-table tbody');
  tbody.replaceChildren();
  const rows = filteredRows();
  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const maxK = analysis.kasiski.table.at(-1).k;
  rows.slice(start, start + ITEMS_PER_PAGE).forEach(match => {
    const { seq, len, count, positions, gaps } = match;
    const tr = node('tr');
    const toggle = node('input');
    toggle.type = 'checkbox';
    toggle.className = 'highlight-checkbox';
    toggle.dataset.seq = seq;
    toggle.checked = highlightEnabled.has(seq);
    toggle.setAttribute('aria-label', `ハイライト: ${shortSequence(seq)}`);
    toggle.addEventListener('change', handleHighlightToggle);
    const control = node('td');
    control.appendChild(toggle);
    tr.appendChild(control);
    const divisors = [];
    for (let k = 2; k <= maxK; k++) {
      if (gaps.every(gap => gap % k === 0)) divisors.push(k);
    }
    const chance = RepeatSeqCore.expectedByChance(analysis.text.length, len, analysis.kappa);
    [shortSequence(seq), len, count, shortList(positions), shortList(gaps),
      divisors.join(', ') || '—', chanceText(chance)].forEach(value => tr.appendChild(node('td', value)));
    tbody.appendChild(tr);
  });
  document.getElementById('pagination-controls').hidden = rows.length <= ITEMS_PER_PAGE;
  document.getElementById('page-info').textContent = `${currentPage} / ${totalPages} ページ（全${rows.length}件）`;
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage === totalPages;
}

function sortMatches() {
  const sign = sortDirection === 'asc' ? 1 : -1;
  allMatches.sort((a, b) => {
    const av = currentSortColumn === 'first' ? a.positions[0] : a[currentSortColumn];
    const bv = currentSortColumn === 'first' ? b.positions[0] : b[currentSortColumn];
    return (av > bv ? sign : av < bv ? -sign : 0) || a.positions[0] - b.positions[0];
  });
}

document.querySelectorAll('.sortable button').forEach(button => {
  button.addEventListener('click', () => {
    const column = button.parentElement.dataset.column;
    sortDirection = currentSortColumn === column && sortDirection === 'desc' ? 'asc' : 'desc';
    currentSortColumn = column;
    sortMatches();
    currentPage = 1;
    renderTableWithPagination();
    updateSortIndicators();
  });
});

function updateSortIndicators() {
  document.querySelectorAll('.sortable').forEach(header => {
    const selected = header.dataset.column === currentSortColumn;
    header.setAttribute('aria-sort', selected ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
  });
}

function generateLengthFilters() {
  const container = document.getElementById('length-filters');
  container.replaceChildren();
  [[3, '3文字'], [4, '4文字'], [5, '5〜7文字'], [8, '8文字以上']].forEach(([value, text]) => {
    const label = node('label', '', 'length-filter-label');
    const checkbox = node('input');
    checkbox.type = 'checkbox';
    checkbox.value = value;
    checkbox.checked = activeLengthFilters.has(value);
    checkbox.addEventListener('change', handleFilterChange);
    label.append(checkbox, document.createTextNode(text));
    container.appendChild(label);
  });
}

function handleFilterChange(event) {
  const value = Number(event.target.value);
  if (event.target.checked) activeLengthFilters.add(value);
  else activeLengthFilters.delete(value);
  currentPage = 1;
  renderTableWithPagination();
}

document.getElementById('select-all-btn').addEventListener('click', () => {
  activeLengthFilters = new Set([3, 4, 5, 8]);
  generateLengthFilters();
  currentPage = 1;
  renderTableWithPagination();
});

document.getElementById('clear-all-btn').addEventListener('click', () => {
  activeLengthFilters.clear();
  generateLengthFilters();
  currentPage = 1;
  renderTableWithPagination();
});

document.getElementById('prev-page').addEventListener('click', () => {
  if (currentPage > 1) currentPage--;
  renderTableWithPagination();
});

document.getElementById('next-page').addEventListener('click', () => {
  if (currentPage < Math.ceil(filteredRows().length / ITEMS_PER_PAGE)) currentPage++;
  renderTableWithPagination();
});

function renderStatisticsSummary() {
  const box = document.getElementById('statistics-summary');
  box.replaceChildren();
  const longest = analysis.rows[0];
  const fields = [
    ['解析した文字数', analysis.text.length],
    ['IC', analysis.kappa.toFixed(4)],
    ['反復の数', analysis.rows.length],
    ['隣り合う出現の間隔の数', analysis.kasiski.gapCount],
    ['最長の反復', longest ? `${longest.seq.slice(0, 12)}${longest.len > 12 ? '…' : ''}（${longest.len}文字）` : '—'],
    ['出現位置', longest ? shortList(longest.positions) : '—']
  ];
  fields.forEach(([label, value]) => box.appendChild(node('p', `${label}: ${value}`)));
  const table = node('table');
  table.appendChild(node('caption', '偶然の見込み'));
  const head = node('tr');
  ['長さ', 'この長さの一致は、偶然でも約X組できる'].forEach(text => head.appendChild(node('th', text)));
  table.appendChild(head);
  analysis.chance.slice(0, 4).forEach(({ L, expected }) => {
    const row = node('tr');
    row.append(node('td', L), node('td', chanceText(expected)));
    table.appendChild(row);
  });
  box.appendChild(table);
}

function estimateSummary() {
  const k = analysis.kasiski.best;
  const L = analysis.columnIC.best;
  if (L === 1) return '単一換字（鍵長1）の可能性';
  if (k !== null && k === L) return `2つの方法が一致: 鍵長 ${k} が有力`;
  if (k !== null && L !== null) return `一致しない: カシスキー ${k}、列 IC ${L}`;
  if (k !== null) return `カシスキーだけが ${k} を示す`;
  if (L !== null) return `列 ICだけが ${L} を示す`;
  return '周期のはっきりした偏りは見つからない';
}

function addMeter(row, value, max) {
  const cell = node('td');
  const meter = node('meter');
  meter.min = 0;
  meter.max = Math.max(max, 0.001);
  meter.value = value;
  meter.setAttribute('aria-label', String(value));
  cell.appendChild(meter);
  row.appendChild(cell);
}

function renderKeylengthHints() {
  const kasiskiBody = document.querySelector('#kasiski-table tbody');
  const icBody = document.querySelector('#column-ic-table tbody');
  kasiskiBody.replaceChildren();
  icBody.replaceChildren();
  const maxRatio = Math.max(...analysis.kasiski.table.map(row => row.ratio));
  analysis.kasiski.table.forEach(({ k, count, expected, ratio }) => {
    const row = node('tr');
    row.dataset.key = k;
    const best = k === analysis.kasiski.best;
    row.classList.toggle('best-estimate', best);
    [`${best ? '★ ' : ''}${k}`, count, expected.toFixed(1), ratio.toFixed(2)]
      .forEach(value => row.appendChild(node('td', value)));
    addMeter(row, ratio, maxRatio);
    kasiskiBody.appendChild(row);
  });
  analysis.columnIC.table.forEach(({ L, avg }) => {
    const row = node('tr');
    row.dataset.key = L;
    const best = L === analysis.columnIC.best;
    row.classList.toggle('best-estimate', best);
    row.append(node('td', `${best ? '★ ' : ''}${L}`), node('td', avg.toFixed(4)));
    addMeter(row, avg, 0.08);
    icBody.appendChild(row);
  });
  document.getElementById('keylength-summary').textContent = estimateSummary();
  document.getElementById('friedman-result').textContent =
    `フリードマンの目安: ${analysis.friedman === null ? '推定できない' : analysis.friedman.toFixed(1)}`;
}

function displayCipherTypeAnalysis(result) {
  const messages = {
    insufficient: '100文字未満のためデータ不足です。',
    mono: 'ICが0.060を超えるため、単一換字式暗号の可能性があります。',
    poly: 'ICが0.045未満のため、多表式暗号の可能性があります。',
    uncertain: '暗号種別の判定が困難です。'
  };
  const box = document.getElementById('cipher-type-result');
  box.replaceChildren(node('p', messages[result.type]), node('p', `IC: ${result.ic.toFixed(4)}（A-Zだけで数えた値）`));
  if (result.type === 'mono' || result.type === 'uncertain') {
    const links = [
      ['Frequency Analyzer', 'https://ipusiron.github.io/frequency-analyzer/'],
      ['Caesar Cipher Breaker', 'https://github.com/ipusiron/caesar-cipher-breaker']
    ];
    links.forEach(([text, href]) => {
      const link = node('a', text);
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const paragraph = node('p');
      paragraph.appendChild(link);
      box.appendChild(paragraph);
    });
  }
}

// ダークモード機能
function initializeDarkMode() {
  // ローカルストレージから設定を読み込み
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('theme'); } catch { /* Storage may be unavailable. */ }
  isDarkMode = savedTheme === 'dark';
  
  // 初期設定を適用
  applyTheme();
  updateDarkModeIcon();
}

function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  applyTheme();
  updateDarkModeIcon();
  
  // ローカルストレージに保存
  try { localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); } catch { /* Use memory only. */ }
}

function applyTheme() {
  const body = document.body;
  if (isDarkMode) {
    body.setAttribute('data-theme', 'dark');
  } else {
    body.removeAttribute('data-theme');
  }
}

function updateDarkModeIcon() {
  const icon = document.querySelector('.dark-mode-icon');
  icon.textContent = isDarkMode ? '☀️' : '🌙';
}

// ダークモードトグルボタンのイベントリスナー
document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

// ヘルプモーダル機能
function openHelpModal() {
  const modal = document.getElementById('help-modal');
  modal.hidden = false;
  document.body.classList.add('modal-open'); // スクロールを無効化
}

function closeHelpModal() {
  const modal = document.getElementById('help-modal');
  modal.hidden = true;
  document.body.classList.remove('modal-open'); // スクロールを復元
}

// ヘルプボタンのイベントリスナー
document.getElementById('help-button').addEventListener('click', openHelpModal);

// ヘルプモーダルのクローズボタン
document.getElementById('help-modal-close').addEventListener('click', closeHelpModal);

// モーダル背景をクリックして閉じる
document.getElementById('help-modal').addEventListener('click', (e) => {
  if (e.target.id === 'help-modal') {
    closeHelpModal();
  }
});

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('help-modal');
    if (!modal.hidden) {
      closeHelpModal();
    }
  }
});

// ハイライト制御機能
function handleHighlightToggle(event) {
  const seq = event.target.dataset.seq;
  
  if (event.target.checked) {
    highlightEnabled.add(seq);
  } else {
    highlightEnabled.delete(seq);
  }
  
  // ハイライトを再描画
  renderHighlights();
}

// 全選択・全解除ボタン
document.getElementById("highlight-all-btn").addEventListener("click", () => {
  highlightEnabled.clear();
  allMatches.forEach(({ seq }) => highlightEnabled.add(seq));
  
  // 現在表示されているチェックボックスを更新
  document.querySelectorAll('.highlight-checkbox').forEach(checkbox => {
    checkbox.checked = true;
  });
  
  // ハイライトを再描画
  renderHighlights();
});

document.getElementById("highlight-none-btn").addEventListener("click", () => {
  highlightEnabled.clear();
  
  // 現在表示されているチェックボックスを更新
  document.querySelectorAll('.highlight-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // ハイライトを再描画
  renderHighlights();
});

// ページ読み込み時にダークモードを初期化
document.addEventListener('DOMContentLoaded', () => {
  initializeDarkMode();
});
