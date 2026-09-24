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
    showMessage('error.fileSize');
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
      showMessage('error.fileRead');
    };
    
    reader.readAsText(file);
  } else {
    showMessage('error.fileType');
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

let messageState = null;

function showMessage(key, params = {}) {
  messageState = { key, params };
  document.getElementById('input-message').textContent = i18n.t(key, params);
}

function invalidateResults() {
  analysis = null;
  allMatches = [];
  highlightEnabled.clear();
  document.querySelectorAll('[data-result]').forEach(el => { el.hidden = true; });
  showMessage('input.stale');
}

cipherTextArea.addEventListener('input', invalidateResults);
document.getElementById('ignore-spaces').addEventListener('change', invalidateResults);
document.getElementById('max-keylength').addEventListener('change', invalidateResults);

document.getElementById('analyze-btn').addEventListener('click', () => {
  const raw = cipherTextArea.value;
  const lettersOnly = document.getElementById('ignore-spaces').checked;
  const chosenMax = Number(document.getElementById('max-keylength').value);
  const maxK = [20, 30, 40].includes(chosenMax) ? chosenMax : 20;
  const text = RepeatSeqCore.normalize(raw, lettersOnly);
  invalidateResults();
  if (!text.length) {
    showMessage('error.empty');
    return;
  }
  if (text.length > 10000) {
    showMessage('error.tooLong', { n: text.length });
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
  showMessage('input.done', { n: analysis.rows.length });
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
  return values.slice(0, 6).join(', ') + (values.length > 6 ? ' ' + i18n.t('list.more', { n: values.length - 6 }) : '');
}

function shortSequence(seq) {
  return seq.length > 24 ? i18n.t('seq.short', { seq: seq.slice(0, 24), n: seq.length }) : seq;
}

function chanceText(value) {
  return value >= 1 ? i18n.t('chance.large', { n: Math.round(value) }) : i18n.t('chance.small', { n: value.toFixed(2) });
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
    toggle.setAttribute('aria-label', i18n.t('highlight.row', { seq: shortSequence(seq) }));
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
  document.getElementById('page-info').textContent = i18n.t('page.info', { page: currentPage, total: totalPages, n: rows.length });
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
  [
    [3, i18n.t('filter.three')], [4, i18n.t('filter.four')],
    [5, i18n.t('filter.medium')], [8, i18n.t('filter.long')]
  ].forEach(([value, text]) => {
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
    [i18n.t('stats.characters'), analysis.text.length],
    ['IC', analysis.kappa.toFixed(4)],
    [i18n.t('stats.repeats'), analysis.rows.length],
    [i18n.t('stats.gaps'), analysis.kasiski.gapCount],
    [i18n.t('stats.longest'), longest ?
       i18n.t('stats.sequence', { seq: longest.seq.slice(0, 12) + (longest.len > 12 ? '…' : ''), n: longest.len }) : '—'],
    [i18n.t('col.pos'), longest ? shortList(longest.positions) : '—']
  ];
  fields.forEach(([label, value]) => box.appendChild(node('p', `${label}: ${value}`)));
  const table = node('table');
  table.appendChild(node('caption', i18n.t('col.chance')));
  const head = node('tr');
  [i18n.t('col.len'), i18n.t('chance.explain')].forEach(text => head.appendChild(node('th', text)));
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
  if (L === 1) return i18n.t('summary.mono');
  if (k !== null && k === L) return i18n.t('summary.agree', { k });
  if (k !== null && L !== null) return i18n.t('summary.disagree', { k, L });
  if (k !== null) return i18n.t('summary.kasiski', { k });
  if (L !== null) return i18n.t('summary.ic', { L });
  return i18n.t('summary.none');
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
    i18n.t('key.friedman', { value: analysis.friedman === null ? i18n.t('key.unknown') : analysis.friedman.toFixed(1) });
}

function displayCipherTypeAnalysis(result) {
  const messages = {
    insufficient: i18n.t('type.insufficient'),
    mono: i18n.t('type.mono'),
    poly: i18n.t('type.poly'),
    uncertain: i18n.t('type.uncertain')
  };
  const box = document.getElementById('cipher-type-result');
  box.replaceChildren(
    node('p', messages[result.type]), node('p', i18n.t('type.ic', { value: result.ic.toFixed(4) })));
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
  isDarkMode = document.documentElement.dataset.theme === 'dark';
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
  const body = document.documentElement;
  if (isDarkMode) {
    body.setAttribute('data-theme', 'dark');
  } else {
    body.setAttribute('data-theme', 'light');
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
  modal.showModal();
  document.body.classList.add('modal-open'); // スクロールを無効化
}

function closeHelpModal() {
  const modal = document.getElementById('help-modal');
  modal.close();
  document.body.classList.remove('modal-open'); // Restore scrolling.
  document.getElementById('help-button').focus();
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
    if (modal.open) {
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


dropZone.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});

document.getElementById('help-modal').addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  document.getElementById('help-button').focus();
});

document.getElementById('help-modal').addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = [...event.currentTarget.querySelectorAll('button, a[href], [tabindex="0"]')]
    .filter(element => element.getClientRects().length);
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

// Preserve the analysis, enabled sequences, sorting and page on language changes.
document.addEventListener('languagechange', () => {
  if (analysis) renderAnalysis();
  else if (messageState) showMessage(messageState.key, messageState.params);
});
i18n.initialize();
