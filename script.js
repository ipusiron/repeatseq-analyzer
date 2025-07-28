// ページネーション設定
const ITEMS_PER_PAGE = 20;
let currentPage = 1;
let allMatches = [];

// ソート設定
let currentSortColumn = 'len';
let sortDirection = 'desc'; // 'asc' or 'desc'

// フィルター設定
let activeLengthFilters = new Set();

// 鍵長候補フィルター設定
let hideShortKeys = false;
let hideLongKeys = false;

// ダークモード設定
let isDarkMode = false;

// ハイライト制御設定
let highlightEnabled = new Set(); // 有効なマッチのインデックス

// ドラッグアンドドロップ機能
const dropZone = document.getElementById("drop-zone");
const cipherTextArea = document.getElementById("ciphertext");
const fileInput = document.getElementById("file-input");

// ファイル読み込み処理を共通化
function readFile(file) {
  // テキストファイルかチェック
  if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      cipherTextArea.value = event.target.result;
      // 自動的に解析を開始
      document.getElementById("analyze-btn").click();
    };
    
    reader.onerror = () => {
      alert("ファイルの読み込みに失敗しました。");
    };
    
    reader.readAsText(file);
  } else {
    alert("テキストファイル（.txt）を選択してください。");
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

document.getElementById("analyze-btn").addEventListener("click", () => {
  const rawText = document.getElementById("ciphertext").value;
  const ignoreSymbols = document.getElementById("ignore-spaces").checked;

  // 前処理：英大文字だけを抽出
  let cleanedText = rawText.toUpperCase();
  if (ignoreSymbols) {
    cleanedText = cleanedText.replace(/[^A-Z]/g, '');
  }

  const minLen = 3;
  const maxLen = 10; // 検出する最大長

  const matches = [];
  const seen = {};

  // 文字列の全ての部分列を探索
  for (let len = minLen; len <= maxLen; len++) {
    for (let i = 0; i <= cleanedText.length - len; i++) {
      const seq = cleanedText.slice(i, i + len);

      if (seen[seq] !== undefined) {
        // 最初の出現はseen[seq]、2回目がi
        const first = seen[seq];
        const second = i;
        const gap = second - first;

        matches.push({
          seq,
          len,
          first,
          second,
          gap,
          divisors: getDivisors(gap),
          confidence: 0  // 後で計算
        });
      } else {
        seen[seq] = i;
      }
    }
  }

  // グローバル変数に保存
  allMatches = matches;
  currentPage = 1;
  
  // 信頼度スコアを計算
  calculateConfidenceScores(matches);
  
  // 初期ソート（長さの降順）
  sortMatches();
  
  // 初期状態で全てのハイライトを有効化
  highlightEnabled.clear();
  allMatches.forEach((_, index) => highlightEnabled.add(index));
  
  // フィルターコントロールを生成
  generateLengthFilters();

  renderHighlights(cleanedText, matches);
  renderTableWithPagination();
  renderStatisticsSummary(matches);
  renderKeylengthHints(matches);
});

// ページネーションイベントリスナー
document.getElementById("prev-page").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTableWithPagination();
  }
});

document.getElementById("next-page").addEventListener("click", () => {
  const totalPages = Math.ceil(allMatches.length / ITEMS_PER_PAGE);
  if (currentPage < totalPages) {
    currentPage++;
    renderTableWithPagination();
  }
});

// 公約数（1以外）を取得
function getDivisors(n) {
  const divs = [];
  for (let i = 2; i <= n; i++) {
    if (n % i === 0) divs.push(i);
  }
  return divs;
}

// 信頼度スコアを計算
function calculateConfidenceScores(matches) {
  // 各文字列の出現回数をカウント
  const sequenceFreq = {};
  matches.forEach(match => {
    sequenceFreq[match.seq] = (sequenceFreq[match.seq] || 0) + 1;
  });
  
  // 間隔の分布を分析
  const gapFreq = {};
  matches.forEach(match => {
    gapFreq[match.gap] = (gapFreq[match.gap] || 0) + 1;
  });
  
  // 各マッチの信頼度を計算
  matches.forEach(match => {
    let score = 0;
    
    // 1. 文字列の長さによるスコア (0-40点)
    if (match.len >= 8) {
      score += 40;  // 8文字以上は最高点
    } else if (match.len >= 5) {
      score += 25 + (match.len - 5) * 5;  // 5-7文字は25-35点
    } else {
      score += match.len * 5;  // 3-4文字は15-20点
    }
    
    // 2. 文字列の出現頻度によるスコア (0-25点)
    const freq = sequenceFreq[match.seq];
    if (freq >= 3) {
      score += 25;  // 3回以上出現
    } else if (freq === 2) {
      score += 15;  // 2回出現（基本）
    } else {
      score += 5;   // 1回のみ
    }
    
    // 3. 間隔の妥当性スコア (0-20点)
    // 短すぎる間隔（偶然の可能性）や長すぎる間隔を減点
    if (match.gap >= 10 && match.gap <= 100) {
      score += 20;  // 適切な間隔
    } else if (match.gap >= 5 && match.gap <= 200) {
      score += 15;  // やや適切
    } else if (match.gap >= 3) {
      score += 10;  // 微妙
    } else {
      score += 0;   // 短すぎる（偶然の可能性大）
    }
    
    // 4. 公約数の有用性スコア (0-15点)
    const meaningfulDivisors = match.divisors.filter(d => d >= 3 && d <= 20);
    if (meaningfulDivisors.length >= 3) {
      score += 15;
    } else if (meaningfulDivisors.length >= 2) {
      score += 10;
    } else if (meaningfulDivisors.length >= 1) {
      score += 5;
    }
    
    // 最大100点にスケール
    match.confidence = Math.min(100, score);
  });
}

// 信頼度に基づくCSSクラスを取得
function getConfidenceClass(confidence) {
  if (confidence >= 80) {
    return 'confidence-high';
  } else if (confidence >= 60) {
    return 'confidence-medium';
  } else if (confidence >= 40) {
    return 'confidence-low';
  } else {
    return 'confidence-very-low';
  }
}

function renderHighlights(text, matches) {
  let output = text.split('').map(c => `<span>${c}</span>`);
  
  // 各文字位置での最高優先度を追跡
  let priorities = new Array(text.length).fill(0);
  let classes = new Array(text.length).fill('');
  
  // 優先度: 8文字以上=3, 5-7文字=2, 3-4文字=1
  matches.forEach((match, index) => {
    // ハイライトが無効化されている場合はスキップ
    if (!highlightEnabled.has(index)) {
      return;
    }
    
    const { seq, first, second, len } = match;
    let priority, cls;
    if (len >= 8) {
      priority = 3;
      cls = "highlight-important";  // 8文字以上: 赤色
    } else if (len >= 5) {
      priority = 2;
      cls = "highlight-medium";     // 5-7文字: 緑色
    } else {
      priority = 1;
      cls = "highlight";            // 3-4文字: 黄色
    }
    
    // 1回目の出現位置
    for (let i = 0; i < len; i++) {
      const pos = first + i;
      if (pos < text.length && priority > priorities[pos]) {
        priorities[pos] = priority;
        classes[pos] = cls;
      }
    }
    
    // 2回目の出現位置
    for (let i = 0; i < len; i++) {
      const pos = second + i;
      if (pos < text.length && priority > priorities[pos]) {
        priorities[pos] = priority;
        classes[pos] = cls;
      }
    }
  });
  
  // ハイライトを適用
  for (let i = 0; i < text.length; i++) {
    if (priorities[i] > 0) {
      output[i] = `<span class="${classes[i]}">${text[i]}</span>`;
    }
  }

  document.getElementById("highlighted-text").innerHTML = output.join('');
}

function renderTableWithPagination() {
  const tbody = document.querySelector("#result-table tbody");
  tbody.innerHTML = "";

  // フィルタリング - フィルタが何も選択されていない場合は空の配列を表示
  let filteredMatches = [];
  if (activeLengthFilters.size > 0) {
    filteredMatches = allMatches.filter(match => activeLengthFilters.has(match.len));
  }

  // ページネーション計算
  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredMatches.length);
  const pageMatches = filteredMatches.slice(startIndex, endIndex);

  // テーブル行を描画
  pageMatches.forEach((match, pageIndex) => {
    const { seq, len, confidence, first, second, gap, divisors } = match;
    const globalIndex = filteredMatches.indexOf(match);
    const row = document.createElement("tr");

    // 信頼度に基づく表示形式
    const confidenceClass = getConfidenceClass(confidence);
    const confidenceDisplay = `<span class="confidence-score ${confidenceClass}">${confidence}%</span>`;

    row.innerHTML = `
      <td>
        <input type="checkbox" 
               class="highlight-checkbox" 
               data-index="${globalIndex}" 
               ${highlightEnabled.has(globalIndex) ? 'checked' : ''}>
      </td>
      <td>${seq}</td>
      <td>${len}</td>
      <td>${confidenceDisplay}</td>
      <td>${first}</td>
      <td>${second}</td>
      <td>${gap}</td>
      <td>${divisors.join(", ")}</td>
    `;
    tbody.appendChild(row);
  });
  
  // チェックボックスのイベントリスナーを追加
  document.querySelectorAll('.highlight-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', handleHighlightToggle);
  });

  // ページネーションコントロールの更新
  const paginationControls = document.getElementById("pagination-controls");
  const pageInfo = document.getElementById("page-info");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");

  if (filteredMatches.length > ITEMS_PER_PAGE) {
    paginationControls.style.display = "block";
    pageInfo.textContent = `${currentPage} / ${totalPages} ページ (全 ${filteredMatches.length} 件)`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  } else {
    paginationControls.style.display = "none";
  }
}

// ソート機能
function sortMatches() {
  allMatches.sort((a, b) => {
    let aVal = a[currentSortColumn];
    let bVal = b[currentSortColumn];
    
    // 文字列の場合
    if (currentSortColumn === 'seq') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });
}

// ソートヘッダーのクリックイベント
document.addEventListener('DOMContentLoaded', () => {
  const sortableHeaders = document.querySelectorAll('.sortable');
  
  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.column;
      
      // 同じ列をクリックした場合は方向を反転
      if (currentSortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortColumn = column;
        sortDirection = 'desc'; // 新しい列は降順から始める
      }
      
      // ソート実行
      sortMatches();
      currentPage = 1; // 最初のページに戻る
      renderTableWithPagination();
      
      // ソートインジケーターを更新
      updateSortIndicators();
    });
  });
});

// ソートインジケーターを更新
function updateSortIndicators() {
  const headers = document.querySelectorAll('.sortable');
  headers.forEach(header => {
    const indicator = header.querySelector('.sort-indicator');
    if (header.dataset.column === currentSortColumn) {
      indicator.textContent = sortDirection === 'asc' ? '▲' : '▼';
    } else {
      indicator.textContent = '';
    }
  });
}

// フィルターコントロールを生成
function generateLengthFilters() {
  const lengthFiltersDiv = document.getElementById("length-filters");
  lengthFiltersDiv.innerHTML = "";
  
  // 検出された全ての長さを取得
  const lengths = new Set(allMatches.map(m => m.len));
  const sortedLengths = Array.from(lengths).sort((a, b) => a - b);
  
  // 初期状態で全ての長さを選択
  activeLengthFilters = new Set(sortedLengths);
  
  // チェックボックスを生成
  sortedLengths.forEach(len => {
    const label = document.createElement("label");
    label.className = "length-filter-label";
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = len;
    checkbox.checked = true;
    checkbox.addEventListener("change", handleFilterChange);
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${len}文字`));
    
    lengthFiltersDiv.appendChild(label);
  });
}

// フィルター変更時の処理
function handleFilterChange(event) {
  const length = parseInt(event.target.value);
  
  if (event.target.checked) {
    activeLengthFilters.add(length);
  } else {
    activeLengthFilters.delete(length);
  }
  
  currentPage = 1;
  renderTableWithPagination();
}

// 全選択・全解除ボタンのイベントリスナー
document.getElementById("select-all-btn").addEventListener("click", () => {
  const checkboxes = document.querySelectorAll("#length-filters input[type='checkbox']");
  checkboxes.forEach(cb => {
    cb.checked = true;
    activeLengthFilters.add(parseInt(cb.value));
  });
  currentPage = 1;
  renderTableWithPagination();
});

document.getElementById("clear-all-btn").addEventListener("click", () => {
  const checkboxes = document.querySelectorAll("#length-filters input[type='checkbox']");
  checkboxes.forEach(cb => {
    cb.checked = false;
  });
  activeLengthFilters.clear();
  currentPage = 1;
  renderTableWithPagination();
});

// 鍵長候補フィルターのイベントリスナー
document.getElementById("hide-short-keys").addEventListener("change", (e) => {
  hideShortKeys = e.target.checked;
  renderKeylengthHints(allMatches);
});

document.getElementById("hide-long-keys").addEventListener("change", (e) => {
  hideLongKeys = e.target.checked;
  renderKeylengthHints(allMatches);
});

function renderKeylengthHints(matches) {
  const allDivisors = matches.map(m => m.divisors).flat();
  const freq = {};

  allDivisors.forEach(d => {
    freq[d] = (freq[d] || 0) + 1;
  });

  let hints = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])  // 頻度順
    .map(([k, v]) => ({ length: parseInt(k), count: v, text: `長さ ${k}（${v} 回）` }));

  // フィルタリング適用
  const originalHints = [...hints];
  if (hideShortKeys) {
    hints = hints.filter(h => h.length > 3);
  }
  if (hideLongKeys) {
    hints = hints.filter(h => h.length < 20);
  }

  // 表示
  document.getElementById("keylength-hints").textContent = hints.length
    ? hints.map(h => h.text).join(", ")
    : "該当する公約数がありません。";

  // 警告メッセージの表示
  showKeylengthWarning(originalHints);
}

// 統計サマリーを描画
function renderStatisticsSummary(matches) {
  const container = document.getElementById("statistics-summary");
  
  // 基本統計
  const totalMatches = matches.length;
  const uniqueSequences = new Set(matches.map(m => m.seq)).size;
  const avgConfidence = totalMatches > 0 ? Math.round(matches.reduce((sum, m) => sum + m.confidence, 0) / totalMatches) : 0;
  
  // 信頼度別分布
  const highConfidence = matches.filter(m => m.confidence >= 80).length;
  const mediumConfidence = matches.filter(m => m.confidence >= 60 && m.confidence < 80).length;
  const lowConfidence = matches.filter(m => m.confidence >= 40 && m.confidence < 60).length;
  const veryLowConfidence = matches.filter(m => m.confidence < 40).length;
  
  // 長さ別分布
  const longPatterns = matches.filter(m => m.len >= 8).length;
  const mediumPatterns = matches.filter(m => m.len >= 5 && m.len < 8).length;
  const shortPatterns = matches.filter(m => m.len < 5).length;
  
  // 最高信頼度のパターン
  const topPattern = matches.length > 0 ? matches.reduce((max, current) => current.confidence > max.confidence ? current : max) : null;
  
  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <h4>📈 基本統計</h4>
        <div class="stat-item">検出パターン数: <strong>${totalMatches}</strong></div>
        <div class="stat-item">ユニーク文字列: <strong>${uniqueSequences}</strong></div>
        <div class="stat-item">平均信頼度: <strong>${avgConfidence}%</strong></div>
      </div>
      
      <div class="stat-card">
        <h4>🎯 信頼度分布</h4>
        <div class="confidence-distribution">
          <div class="confidence-bar">
            <span class="confidence-label">高 (80%+)</span>
            <div class="confidence-meter">
              <div class="confidence-fill confidence-high" style="width: ${totalMatches > 0 ? (highConfidence / totalMatches * 100) : 0}%"></div>
            </div>
            <span class="confidence-count">${highConfidence}</span>
          </div>
          <div class="confidence-bar">
            <span class="confidence-label">中 (60-79%)</span>
            <div class="confidence-meter">
              <div class="confidence-fill confidence-medium" style="width: ${totalMatches > 0 ? (mediumConfidence / totalMatches * 100) : 0}%"></div>
            </div>
            <span class="confidence-count">${mediumConfidence}</span>
          </div>
          <div class="confidence-bar">
            <span class="confidence-label">低 (40-59%)</span>
            <div class="confidence-meter">
              <div class="confidence-fill confidence-low" style="width: ${totalMatches > 0 ? (lowConfidence / totalMatches * 100) : 0}%"></div>
            </div>
            <span class="confidence-count">${lowConfidence}</span>
          </div>
          <div class="confidence-bar">
            <span class="confidence-label">極低 (39%以下)</span>
            <div class="confidence-meter">
              <div class="confidence-fill confidence-very-low" style="width: ${totalMatches > 0 ? (veryLowConfidence / totalMatches * 100) : 0}%"></div>
            </div>
            <span class="confidence-count">${veryLowConfidence}</span>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <h4>📏 長さ分布</h4>
        <div class="stat-item">長いパターン (8文字+): <strong>${longPatterns}</strong></div>
        <div class="stat-item">中程度 (5-7文字): <strong>${mediumPatterns}</strong></div>
        <div class="stat-item">短いパターン (3-4文字): <strong>${shortPatterns}</strong></div>
      </div>
      
      ${topPattern ? `
      <div class="stat-card">
        <h4>⭐ 最高信頼度</h4>
        <div class="top-pattern">
          <div class="stat-item">文字列: <strong>${topPattern.seq}</strong></div>
          <div class="stat-item">信頼度: <strong class="confidence-score ${getConfidenceClass(topPattern.confidence)}">${topPattern.confidence}%</strong></div>
          <div class="stat-item">長さ: <strong>${topPattern.len}文字</strong></div>
          <div class="stat-item">間隔: <strong>${topPattern.gap}</strong></div>
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

function showKeylengthWarning(hints) {
  const warningElement = document.getElementById("keylength-warning");
  const hasShortKeys = hints.some(h => h.length <= 3);
  const hasLongKeys = hints.some(h => h.length >= 20);
  
  let warningMessages = [];
  
  if (hasShortKeys) {
    warningMessages.push("鍵長3以下は古典暗号では可能性が低いとされています");
  }
  
  if (hasLongKeys) {
    warningMessages.push("鍵長20以上は手動暗号では現実的でない可能性があります");
  }
  
  if (warningMessages.length > 0) {
    warningElement.textContent = `⚠️ ${warningMessages.join("。")}。`;
    warningElement.style.display = "block";
  } else {
    warningElement.style.display = "none";
  }
}

// ダークモード機能
function initializeDarkMode() {
  // ローカルストレージから設定を読み込み
  const savedTheme = localStorage.getItem('theme');
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
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
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
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // スクロールを無効化
}

function closeHelpModal() {
  const modal = document.getElementById('help-modal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto'; // スクロールを復元
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
    if (modal.style.display === 'block') {
      closeHelpModal();
    }
  }
});

// ハイライト制御機能
function handleHighlightToggle(event) {
  const index = parseInt(event.target.dataset.index);
  
  if (event.target.checked) {
    highlightEnabled.add(index);
  } else {
    highlightEnabled.delete(index);
  }
  
  // ハイライトを再描画
  const cleanedText = document.getElementById("ciphertext").value.toUpperCase().replace(/[^A-Z]/g, '');
  renderHighlights(cleanedText, allMatches);
}

// 全選択・全解除ボタン
document.getElementById("highlight-all-btn").addEventListener("click", () => {
  highlightEnabled.clear();
  allMatches.forEach((_, index) => highlightEnabled.add(index));
  
  // 現在表示されているチェックボックスを更新
  document.querySelectorAll('.highlight-checkbox').forEach(checkbox => {
    checkbox.checked = true;
  });
  
  // ハイライトを再描画
  const cleanedText = document.getElementById("ciphertext").value.toUpperCase().replace(/[^A-Z]/g, '');
  renderHighlights(cleanedText, allMatches);
});

document.getElementById("highlight-none-btn").addEventListener("click", () => {
  highlightEnabled.clear();
  
  // 現在表示されているチェックボックスを更新
  document.querySelectorAll('.highlight-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // ハイライトを再描画
  const cleanedText = document.getElementById("ciphertext").value.toUpperCase().replace(/[^A-Z]/g, '');
  renderHighlights(cleanedText, allMatches);
});

// ページ読み込み時にダークモードを初期化
document.addEventListener('DOMContentLoaded', () => {
  initializeDarkMode();
});
