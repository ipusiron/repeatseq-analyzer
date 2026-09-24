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
let guessState = null;
let lettersText = '';
let selectedSequence = null;

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

function showMessage(key, params = {}, kind = 'error') {
  messageState = { key, params, kind };
  const message = document.getElementById('input-message');
  message.textContent = i18n.t(key, params);
  message.classList.toggle('is-error', kind === 'error');
  message.classList.toggle('is-info', kind === 'info');
}

function invalidateResults() {
  analysis = null;
  guessState = null;
  lettersText = '';
  selectedSequence = null;
  allMatches = [];
  highlightEnabled.clear();
  document.querySelectorAll('[data-result]').forEach(el => { el.hidden = true; });
  // Drop stale dynamic text too, including content inside hidden sections.
  const staleSelectors = [
    '#cipher-type-result', '#highlighted-text', '#result-table tbody', '#statistics-summary',
    '#kasiski-table tbody', '#column-ic-table tbody', '#keylength-summary', '#friedman-result',
    '#length-filters', '#page-info', '#guess-length', '#guess-reason', '#guessed-key',
    '#guess-table tbody', '#trial-preview', '#trial-count', '#gap-diagram', '#gap-description'
  ];
  staleSelectors.forEach(selector => document.querySelector(selector).replaceChildren());
  showMessage('input.stale', {}, 'info');
  renderGuide();
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
  lettersText = RepeatSeqCore.normalize(raw, true);
  setGuess(RepeatSeqCore.suggestedLength(analysis) ?? 1);
  allMatches = [...analysis.rows];
  selectedSequence = allMatches[0]?.seq ?? null;
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
  showMessage('input.done', { n: analysis.rows.length }, 'info');
  const warning = document.getElementById('truncated-warning');
  warning.hidden = !analysis.truncated;
  displayCipherTypeAnalysis(analysis.cipherType);
  generateLengthFilters();
  sortMatches();
  renderTableWithPagination();
  renderHighlights();
  renderStatisticsSummary();
  renderKeylengthHints();
  renderGuess();
  renderDiagram();
  renderGuide();
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
    const diagramCell = node('td');
    const diagramButton = node('button', i18n.t('diagram.button'));
    diagramButton.type = 'button';
    diagramButton.className = 'diagram-button';
    diagramButton.setAttribute('aria-pressed', String(selectedSequence === seq));
    diagramButton.addEventListener('click', () => {
      selectedSequence = seq;
      renderDiagram();
      document.querySelectorAll('.diagram-button').forEach(button => {
        button.setAttribute('aria-pressed', String(button === diagramButton));
      });
    });
    diagramCell.appendChild(diagramButton);
    tr.appendChild(diagramCell);
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
      link.href = text === 'Frequency Analyzer' && lettersText.length <= 5000 ? href + '?text=' + encodeURIComponent(lettersText) : href;
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
  else if (messageState) showMessage(messageState.key, messageState.params, messageState.kind);
  renderGuide();
  renderSamples();
});
function setGuess(L) {
  const result = RepeatSeqCore.guessKey(lettersText, L);
  guessState = { result, letters: [...result.key] };
}

function guessReason() {
  const k = analysis.kasiski.best, L = analysis.columnIC.best;
  if (L === 1) return i18n.t('guess.mono');
  if (k !== null && k === L) return i18n.t('guess.agree');
  if (k !== null && L !== null && (k % L === 0 || L % k === 0)) return i18n.t('guess.multiple');
  if (k !== null) return i18n.t('guess.kasiski');
  if (L !== null) return i18n.t('guess.ic');
  return i18n.t('guess.none');
}

function renderTrial() {
  const key = guessState.letters.join('');
  document.getElementById('guessed-key').textContent = key;
  const plain = RepeatSeqCore.vigenereDecrypt(lettersText, key);
  document.getElementById('trial-preview').textContent = (plain.slice(0, 300).match(/.{1,5}/g) || []).join(' ');
  document.getElementById('trial-count').textContent = i18n.t('guess.total', { n: plain.length });
  renderGuide();
}

function renderGuess() {
  if (!guessState) return;
  const length = document.getElementById('guess-length');
  length.replaceChildren();
  for (let L = 1; L <= analysis.kasiski.table.at(-1).k; L++) {
    const option = node('option', L);
    option.value = L;
    length.appendChild(option);
  }
  length.value = guessState.result.L;
  document.getElementById('guess-reason').textContent = guessReason();
  const body = document.querySelector('#guess-table tbody');
  body.replaceChildren();
  guessState.result.columns.forEach(col => {
    const row = node('tr');
    const select = node('select');
    select.setAttribute('aria-label', i18n.t('guess.label', { n: col.index + 1 }));
    for (const letter of RepeatSeqCore.ALPHA) {
      const option = node('option', letter);
      option.value = letter;
      select.appendChild(option);
    }
    select.value = guessState.letters[col.index];
    const manual = node('span', select.value !== col.best.letter ? i18n.t('guess.manual') : '', 'manual-marker');
    select.addEventListener('change', () => {
      guessState.letters[col.index] = select.value;
      manual.textContent = select.value !== col.best.letter ? i18n.t('guess.manual') : '';
      renderTrial();
    });
    const control = node('td');
    control.append(select, manual);
    row.append(node('td', col.index + 1), node('td', col.n), node('td', col.ic.toFixed(4)), control,
      node('td', col.best.letter + ' (' + col.best.chi.toFixed(1) + ')'),
      node('td', col.second.letter + ' (' + col.second.chi.toFixed(1) + ')'),
      node('td', col.second.chi < RepeatSeqCore.CLOSE_RATIO * col.best.chi ? i18n.t('guess.close') : '—', 'close-marker'));
    const destination = node('td');
    if (col.n <= 5000) {
      const link = node('a', i18n.t('guess.open'));
      link.href = 'https://ipusiron.github.io/frequency-analyzer/?text=' + encodeURIComponent(col.text);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      destination.appendChild(link);
    } else destination.textContent = i18n.t('guess.tooLong');
    row.appendChild(destination);
    body.appendChild(row);
  });
  renderTrial();
}

document.getElementById('guess-length').addEventListener('change', event => {
  if (!analysis) return;
  const L = Number(event.target.value);
  if (!Number.isInteger(L) || L < 1 || L > analysis.kasiski.table.at(-1).k) return;
  setGuess(L);
  renderGuess();
});
document.getElementById('guess-reset').addEventListener('click', () => {
  if (!guessState) return;
  guessState.letters = [...guessState.result.key];
  renderGuess();
});
function renderGuide() {
  const summaries = Array(5).fill(i18n.t('guide.pending'));
  if (analysis) {
    summaries[0] = i18n.t('guide.input', { n: analysis.text.length, m: lettersText.length });
    summaries[1] = i18n.t('type.ic', { value: analysis.cipherType.ic.toFixed(4) }) + ' ' + i18n.t(`type.${analysis.cipherType.type}`);
    summaries[2] = i18n.t('guide.repeats', { n: analysis.rows.length, len: analysis.rows[0]?.len ?? 0 });
    summaries[3] = estimateSummary();
    if (guessState) {
      summaries[4] = i18n.t('guide.key', { key: guessState.letters.join(''), L: guessState.result.L });
      if (guessState.letters.join('') !== guessState.result.key) summaries[4] += ' ' + i18n.t('guess.manual');
    }
  }
  const list = document.getElementById('guide-steps');
  list.replaceChildren();
  ['input', 'type', 'repeat', 'key', 'guess'].forEach((id, index) => {
    const item = node('li');
    const button = node('button', i18n.t('guide.go'));
    button.type = 'button';
    button.disabled = index > 0 && !analysis;
    button.addEventListener('click', () => {
      const heading = document.getElementById(id + '-heading');
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    });
    item.append(node('strong', i18n.t(`guide.step${index + 1}`)), node('p', summaries[index]), button);
    list.appendChild(item);
  });
}

function renderSamples() {
  const select = document.getElementById('sample-select');
  const current = select.value;
  const placeholder = node('option', i18n.t('sample.choose'));
  placeholder.value = '';
  select.replaceChildren(placeholder);
  RepeatSeqSamples.forEach(sample => {
    const option = node('option', i18n.t(`sample.${sample.id}`));
    option.value = sample.id;
    select.appendChild(option);
  });
  select.value = current;
}

document.getElementById('sample-load').addEventListener('click', () => {
  const sample = RepeatSeqSamples.find(s => s.id === document.getElementById('sample-select').value);
  if (!sample) return;
  cipherTextArea.value = sample.text;
  document.getElementById('ignore-spaces').checked = true;
  document.getElementById('analyze-btn').click();
});

function svgNode(tag, attributes) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function renderDiagram() {
  const host = document.getElementById('gap-diagram');
  const description = document.getElementById('gap-description');
  host.replaceChildren();
  description.replaceChildren();
  const row = analysis?.rows.find(r => r.seq === selectedSequence);
  if (!row) {
    description.textContent = i18n.t('diagram.empty');
    return;
  }
  const svg = svgNode('svg', { viewBox: '0 0 1000 140', role: 'img', 'aria-labelledby': 'gap-description' });
  svg.appendChild(svgNode('line', { x1: 20, x2: 980, y1: 120, y2: 120, class: 'gap-axis' }));
  const x = position => 20 + position / analysis.text.length * 960;
  const largest = Math.max(...row.gaps);
  row.gaps.slice(0, 12).forEach((gap, i) => {
    const a = x(row.positions[i]), b = x(row.positions[i + 1]);
    const height = Math.min(100, gap / largest * 100);
    svg.appendChild(svgNode('path', { d: `M ${a} 120 Q ${(a + b) / 2} ${120 - height} ${b} 120`, class: 'gap-arc' }));
  });
  row.positions.forEach(position => {
    svg.appendChild(svgNode('rect', { x: x(position), y: 116, width: Math.max(3, row.len / analysis.text.length * 960),
      height: 8, class: 'gap-band' }));
  });
  host.appendChild(svg);
  const positions = row.positions.slice(0, 20).join(', ') +
    (row.positions.length > 20 ? ' ' + i18n.t('list.more', { n: row.positions.length - 20 }) : '');
  const gaps = row.gaps.map((gap, i) => i18n.t('diagram.gap', { gap, from: row.positions[i], to: row.positions[i + 1] })).join(', ');
  const divisors = [];
  for (let k = 2; k <= analysis.kasiski.table.at(-1).k; k++) if (row.gaps.every(g => g % k === 0)) divisors.push(k);
  description.append(node('p', i18n.t('diagram.sequence', { seq: shortSequence(row.seq) })),
    node('p', i18n.t('diagram.positions', { positions })), node('p', i18n.t('diagram.gaps', { gaps })),
    node('p', i18n.t('diagram.divisors', { divisors: divisors.join(', ') || '—' })));
  if (row.gaps.length > 12) description.appendChild(node('p', i18n.t('diagram.omitted', { n: row.gaps.length - 12 })));
}

i18n.initialize();
renderSamples();
renderGuide();
