// ページネーション設定
const ITEMS_PER_PAGE = 20;
let currentPage = 1;
let allMatches = [];

// ソート設定
let currentSortColumn = 'len';
let sortDirection = 'desc'; // 'asc' or 'desc'

// フィルター設定
let activeLengthFilters = new Set();

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
          divisors: getDivisors(gap)
        });
      } else {
        seen[seq] = i;
      }
    }
  }

  // グローバル変数に保存
  allMatches = matches;
  currentPage = 1;
  
  // 初期ソート（長さの降順）
  sortMatches();
  
  // フィルターコントロールを生成
  generateLengthFilters();

  renderHighlights(cleanedText, matches);
  renderTableWithPagination();
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

function renderHighlights(text, matches) {
  let output = text.split('').map(c => `<span>${c}</span>`);

  matches.forEach(({ seq, first, second, len }) => {
    const cls = len >= 5 ? "highlight-important" : "highlight";
    for (let i = 0; i < len; i++) {
      output[first + i] = `<span class="${cls}">${text[first + i]}</span>`;
      output[second + i] = `<span class="${cls}">${text[second + i]}</span>`;
    }
  });

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
  pageMatches.forEach(({ seq, len, first, second, gap, divisors }) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${seq}</td>
      <td>${len}</td>
      <td>${first}</td>
      <td>${second}</td>
      <td>${gap}</td>
      <td>${divisors.join(", ")}</td>
    `;
    tbody.appendChild(row);
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

function renderKeylengthHints(matches) {
  const allDivisors = matches.map(m => m.divisors).flat();
  const freq = {};

  allDivisors.forEach(d => {
    freq[d] = (freq[d] || 0) + 1;
  });

  const hints = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])  // 頻度順
    .map(([k, v]) => `長さ ${k}（${v} 回）`);

  document.getElementById("keylength-hints").textContent = hints.length
    ? hints.join(", ")
    : "該当する公約数がありません。";
}
