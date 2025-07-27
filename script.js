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

  renderHighlights(cleanedText, matches);
  renderTable(matches);
  renderKeylengthHints(matches);
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

function renderTable(matches) {
  const tbody = document.querySelector("#result-table tbody");
  tbody.innerHTML = "";

  matches.forEach(({ seq, len, first, second, gap, divisors }) => {
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
}

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
