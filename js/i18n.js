'use strict';

const messages = {
  "ja": {
    "guess.heading": "🔑 鍵の推定と試し読み",
    "guess.length": "試す鍵長",
    "guess.reset": "推定に戻す",
    "guess.note": "ヴィジュネル暗号（加算）を仮定しています。ボーフォート暗号などでは読めません。",
    "guess.region": "鍵の列の表",
    "guess.column": "列",
    "guess.n": "文字数",
    "guess.letter": "鍵の文字",
    "guess.best": "1位（χ²）",
    "guess.second": "2位（χ²）",
    "guess.close": "接戦",
    "guess.frequency": "頻度分析",
    "guess.mono": "単一換字",
    "guess.agree": "2つの方法が一致",
    "guess.multiple": "倍数の関係なので小さいほう",
    "guess.kasiski": "カシスキーの推定",
    "guess.ic": "列ICの推定",
    "guess.none": "鍵長の推定が出ていないので、1 から試してください",
    "guess.total": "平文は全{n}文字（先頭300文字まで表示）",
    "guess.label": "列 {n} の鍵の文字",
    "guess.manual": "（手で修正）",
    "guess.open": "頻度分析で開く",
    "guess.tooLong": "5,000文字を超えるため渡せません",
    "page.title": "RepeatSeq Analyzer - 暗号文反復パターン可視化ツール",
    "page.subtitle": "暗号文の中にある反復文字列（3文字以上）を検出・可視化し、鍵長推定に活用します。",
    "help.open": "詳細なヘルプとカシスキー検査法の解説を表示",
    "theme.toggle": "ダークテーマとライトテーマを切り替え（設定は自動保存）",
    "input.heading": "🔤 暗号文の入力",
    "input.dropTitle": "テキストファイルをここにドロップするか、クリックしてファイルを選択してください",
    "input.drop": "📁 テキストファイルをここにドラッグ&ドロップ",
    "input.or": "または",
    "input.choose": "クリックしてファイルを選択",
    "input.placeholder": "ここに暗号文を貼り付けてください（英字）",
    "input.title": "暗号文を入力してください。大文字・小文字は自動で統一されます",
    "input.label": "暗号文",
    "input.lettersTitle": "英字以外の文字（数字、記号、空白）を自動除去します（推奨）",
    "input.letters": "空白・記号を除去して処理",
    "input.analyzeTitle": "極大反復を検出し、倍率と列ICから鍵長を推定します",
    "input.analyze": "🔍 解析する",
    "type.heading": "🔍 暗号種別の事前判定",
    "highlight.heading": "🖍 ハイライト結果",
    "highlight.empty": "（ここにハイライト表示）",
    "repeat.heading": "📋 検出された反復文字列",
    "filter.title": "文字列の長さでフィルタリングできます。複数選択可能",
    "filter.label": "長さの絞り込み",
    "filter.allTitle": "すべての文字列長を選択して表示",
    "filter.all": "全選択",
    "filter.noneTitle": "すべての選択を解除（結果非表示）",
    "filter.none": "全解除",
    "page.prevTitle": "前のページを表示（20件ずつ表示）",
    "page.prev": "◀ 前へ",
    "page.infoTitle": "現在のページ位置と総件数",
    "page.nextTitle": "次のページを表示（20件ずつ表示）",
    "page.next": "次へ ▶",
    "repeat.truncated": "反復が多すぎるため途中で打ち切りました（同じ文字の連続など）。",
    "repeat.region": "反復の表",
    "highlight.title": "この項目のハイライト表示をON/OFFできます",
    "highlight.label": "ハイライト",
    "highlight.allTitle": "すべての項目のハイライトを有効化",
    "highlight.all": "すべて表示",
    "highlight.noneTitle": "すべての項目のハイライトを無効化",
    "highlight.none": "すべて隠す",
    "col.seq": "文字列",
    "col.len": "長さ",
    "col.count": "出現回数",
    "col.pos": "出現位置",
    "col.gaps": "間隔",
    "col.divisors": "間隔を割り切る数",
    "col.chance": "偶然の見込み",
    "stats.heading": "📊 統計情報",
    "key.heading": "🧠 鍵長の推定",
    "key.max": "鍵長の上限",
    "key.explain": "偶数の間隔はすべて2で割り切れるので、数だけ見ると小さい数が必ず上位に来ます。倍率は偶然の場合と比べた値です。",
    "key.kasiski": "カシスキーの倍率",
    "key.region": "カシスキーの表",
    "key.count": "割り切れる間隔の数",
    "key.expected": "偶然なら",
    "key.ratio": "倍率",
    "key.compare": "比較",
    "key.ic": "列IC",
    "key.icGuide": "最初に0.060以上になる鍵長が目安です（A-Zだけで計算）。",
    "key.icRegion": "列ICの表",
    "key.avg": "平均IC",
    "footer.repo": "🔗 GitHubリポジトリー",
    "help.heading": "🔁 RepeatSeq Analyzer ヘルプ",
    "help.close": "ヘルプを閉じる",
    "language.toggle": "EN",
    "error.fileSize": "ファイルは1MB以下にしてください。",
    "error.fileRead": "ファイルの読み込みに失敗しました。",
    "error.fileType": "テキストファイル（.txt）を選択してください。",
    "input.stale": "入力や設定を確認し、「解析する」を押してください。",
    "error.empty": "解析する文字列を入力してください。",
    "error.tooLong": "上限は10,000文字です（現在{n}文字）。",
    "input.done": "解析しました。反復は{n}件です。",
    "list.more": "…ほか{n}個",
    "seq.short": "{seq}…（全{n}文字）",
    "chance.large": "約{n}組",
    "chance.small": "{n}組",
    "highlight.row": "ハイライト: {seq}",
    "page.info": "{page} / {total} ページ（全{n}件）",
    "filter.three": "3文字",
    "filter.four": "4文字",
    "filter.medium": "5〜7文字",
    "filter.long": "8文字以上",
    "stats.characters": "解析した文字数",
    "stats.repeats": "反復の数",
    "stats.gaps": "隣り合う出現の間隔の数",
    "stats.longest": "最長の反復",
    "stats.sequence": "{seq}（{n}文字）",
    "chance.explain": "この長さの一致は、偶然でも約X組できる",
    "summary.mono": "単一換字（鍵長1）の可能性",
    "summary.agree": "2つの方法が一致: 鍵長 {k} が有力",
    "summary.disagree": "一致しない: カシスキー {k}、列 IC {L}",
    "summary.kasiski": "カシスキーだけが {k} を示す",
    "summary.ic": "列 ICだけが {L} を示す",
    "summary.none": "周期のはっきりした偏りは見つからない",
    "key.friedman": "フリードマンの目安: {value}",
    "key.unknown": "推定できない",
    "type.insufficient": "100文字未満のためデータ不足です。",
    "type.mono": "ICが0.060を超えるため、単一換字式暗号の可能性があります。",
    "type.poly": "ICが0.045未満のため、多表式暗号の可能性があります。",
    "type.uncertain": "暗号種別の判定が困難です。",
    "type.ic": "IC: {value}（A-Zだけで数えた値）",
    "noscript.ja": "JavaScriptを有効にしてください。",
    "noscript.en": "Please enable JavaScript."
  },
  "en": {
    "guess.heading": "🔑 Key guess and trial decryption",
    "guess.length": "Key length to try",
    "guess.reset": "Reset to guess",
    "guess.note": "This assumes additive Vigenere encryption. It will not decrypt Beaufort and other variants.",
    "guess.region": "Key columns table",
    "guess.column": "Column",
    "guess.n": "Letters",
    "guess.letter": "Key letter",
    "guess.best": "Best (χ²)",
    "guess.second": "Second (χ²)",
    "guess.close": "Close contest",
    "guess.frequency": "Frequency analysis",
    "guess.mono": "Monoalphabetic substitution",
    "guess.agree": "Both methods agree",
    "guess.multiple": "Multiples: use the smaller length",
    "guess.kasiski": "Kasiski estimate",
    "guess.ic": "Column IC estimate",
    "guess.none": "No key length estimate is available. Start by trying 1.",
    "guess.total": "{n} plaintext letters in total (showing at most the first 300)",
    "guess.label": "Key letter for column {n}",
    "guess.manual": "(manually edited)",
    "guess.open": "Open frequency analysis",
    "guess.tooLong": "Cannot transfer more than 5,000 letters",
    "page.title": "RepeatSeq Analyzer - Repeated Sequence Analysis",
    "page.subtitle": "Find repeated sequences of 3 or more characters and estimate the key length.",
    "help.open": "Open help and the Kasiski examination guide",
    "theme.toggle": "Switch light and dark themes (saved automatically)",
    "input.heading": "🔤 Ciphertext input",
    "input.dropTitle": "Drop a text file here or activate to choose a file",
    "input.drop": "📁 Drag and drop a text file here",
    "input.or": "or",
    "input.choose": "Choose a file",
    "input.placeholder": "Paste ciphertext here (Latin letters)",
    "input.title": "Enter ciphertext. Letter case is normalized automatically.",
    "input.label": "Ciphertext",
    "input.lettersTitle": "Remove nonletters (numbers, symbols and spaces), recommended",
    "input.letters": "Remove spaces and symbols",
    "input.analyzeTitle": "Find maximal repeats and estimate the key length using ratios and column IC",
    "input.analyze": "🔍 Analyze",
    "type.heading": "🔍 Preliminary cipher classification",
    "highlight.heading": "🖍 Highlighted text",
    "highlight.empty": "Highlighted text appears here.",
    "repeat.heading": "📋 Detected repeated sequences",
    "filter.title": "Filter by sequence length; multiple selections allowed",
    "filter.label": "Filter by length",
    "filter.allTitle": "Select all length groups",
    "filter.all": "Select all",
    "filter.noneTitle": "Clear all length groups (hide rows)",
    "filter.none": "Clear all",
    "page.prevTitle": "Previous page (20 rows per page)",
    "page.prev": "◀ Previous",
    "page.infoTitle": "Current page and total number of rows",
    "page.nextTitle": "Next page (20 rows per page)",
    "page.next": "Next ▶",
    "repeat.truncated": "Analysis was truncated because there were too many repeats (for example, a long run of one character).",
    "repeat.region": "Repeated sequences table",
    "highlight.title": "Toggle highlighting for each sequence",
    "highlight.label": "Highlight",
    "highlight.allTitle": "Enable highlighting for every sequence",
    "highlight.all": "Show all",
    "highlight.noneTitle": "Disable highlighting for every sequence",
    "highlight.none": "Hide all",
    "col.seq": "Sequence",
    "col.len": "Length",
    "col.count": "Occurrences",
    "col.pos": "Positions",
    "col.gaps": "Gaps",
    "col.divisors": "Common divisors of gaps",
    "col.chance": "Expected by chance",
    "stats.heading": "📊 Statistics",
    "key.heading": "🧠 Key length estimates",
    "key.max": "Maximum key length",
    "key.explain": "Every even gap is divisible by 2, so raw counts favor small factors. The ratio compares the count with the number expected by chance.",
    "key.kasiski": "Kasiski ratio",
    "key.region": "Kasiski table",
    "key.count": "Divisible gaps",
    "key.expected": "Expected",
    "key.ratio": "Ratio",
    "key.compare": "Comparison",
    "key.ic": "Column IC",
    "key.icGuide": "The first length reaching 0.060 is the estimate (A–Z only).",
    "key.icRegion": "Column IC table",
    "key.avg": "Mean IC",
    "footer.repo": "🔗 GitHub repository",
    "help.heading": "🔁 RepeatSeq Analyzer Help",
    "help.close": "Close help",
    "language.toggle": "JA",
    "error.fileSize": "Choose a file no larger than 1 MB.",
    "error.fileRead": "The file could not be read.",
    "error.fileType": "Choose a text file (.txt or text/*).",
    "input.stale": "Check the input and settings, then select Analyze.",
    "error.empty": "Enter text to analyze.",
    "error.tooLong": "The limit is 10,000 characters (currently {n}).",
    "input.done": "Analysis complete: {n} repeated sequences.",
    "list.more": "…{n} more",
    "seq.short": "{seq}… ({n} characters total)",
    "chance.large": "About {n} pairs",
    "chance.small": "{n} pairs",
    "highlight.row": "Highlight: {seq}",
    "page.info": "Page {page} / {total} ({n} rows)",
    "filter.three": "3 characters",
    "filter.four": "4 characters",
    "filter.medium": "5–7 characters",
    "filter.long": "8+ characters",
    "stats.characters": "Analyzed characters",
    "stats.repeats": "Repeated sequences",
    "stats.gaps": "Adjacent occurrence gaps",
    "stats.longest": "Longest repeat",
    "stats.sequence": "{seq} ({n} characters)",
    "chance.explain": "Expected pairs of matches of this length, even by chance",
    "summary.mono": "Possible monoalphabetic substitution (key length 1)",
    "summary.agree": "Both methods agree: key length {k} is a strong candidate",
    "summary.disagree": "Methods disagree: Kasiski {k}, column IC {L}",
    "summary.kasiski": "Only Kasiski suggests {k}",
    "summary.ic": "Only column IC suggests {L}",
    "summary.none": "No clear periodic bias was found",
    "key.friedman": "Friedman estimate (rough guide): {value}",
    "key.unknown": "Not estimable",
    "type.insufficient": "Insufficient data: fewer than 100 letters.",
    "type.mono": "IC exceeds 0.060: monoalphabetic substitution is possible.",
    "type.poly": "IC is below 0.045: a polyalphabetic cipher is possible.",
    "type.uncertain": "The cipher type is uncertain.",
    "type.ic": "IC: {value} (A–Z letters only)",
    "noscript.ja": "JavaScriptを有効にしてください。",
    "noscript.en": "Please enable JavaScript."
  }
};

const helpSections = {
  "ja": [
    {
      "heading": "概要",
      "paragraphs": [
        "極大反復は、左右に伸ばせない出現の組を持つ、長さ3以上の反復文字列です。全出現位置を重なりも含めて数え、隣り合う位置の差を間隔とします。",
        "入力はNFKDで正規化し、結合文字を取り除いて大文字にします。空白・記号の除去をオフにすると、空白・改行・記号も位置に数えます。"
      ]
    },
    {
      "heading": "入力と操作",
      "paragraphs": [
        "解析対象の上限は10,000文字です。.txtまたはtext/*形式で1MB以下のファイルを読み込めます。解析結果は端末内で計算し、外部へ送りません。",
        "入力・記号の設定・鍵長の上限を変えたら、再度解析してください。表は20件ずつ表示し、長さで絞り込めます。見出しのボタンで並べ替えます。",
        "行のチェックと「すべて表示」「すべて隠す」で色を切り替えます。黄は3〜4文字、緑は5〜7文字、赤は8文字以上で、重なりは長い区分を優先します。"
      ]
    },
    {
      "heading": "偶然の見込み",
      "paragraphs": [
        "長さLの一致が偶然に起きる位置の組の期待数はC(n−L+1, 2)×κ^Lです。nは解析した文字列の長さ、κはその文字列のICです。この長さの一致が、偶然でも約何組できるかを表します。"
      ]
    },
    {
      "heading": "カシスキーの倍率",
      "paragraphs": [
        "偶数の間隔はすべて2で割り切れるため、数だけでは2などの小さな数が上位になります。倍率は「kで割り切れる間隔の数÷（全間隔の数÷k）」で、偶然なら1前後です。",
        "最大倍率のkの約数（k自身を含む）のうち、最大の0.8倍以上の倍率を持つ最小の数を推定します。最大倍率が2.5未満なら、はっきりした偏りなしとします。",
        "1つの間隔を割り切る数は約数、複数の間隔を共通して割り切る数は公約数です。表にはその行の全間隔の公約数を2から上限まで表示します。"
      ]
    },
    {
      "heading": "列ICとフリードマン",
      "paragraphs": [
        "列ICはA-Zだけの文字列を鍵長ごとの列に分け、列のICを平均します。最初に0.060以上になる長さを推定します。1なら単一換字の可能性があります。",
        "フリードマンの式は目安です。英語のIC約0.065と一様分布の1/26を前提にします。分母が0以下なら推定できず、1未満の推定は1とします。",
        "2つの方式が同じ鍵長を示すと強い根拠になりますが、正解の保証ではありません。短い文や反復が少ない文、英語と統計の異なる文では慎重に解釈してください。"
      ]
    },
    {
      "heading": "事前判定と制限",
      "paragraphs": [
        "事前判定はA-Zだけで計算し、100文字未満はデータ不足、ICが0.060を超えると単一換字、0.045未満は多表式、その間は判定困難です。",
        "同じ文字の連続などで候補が多すぎると、候補の文字数200万または出現位置20万の上限で打ち切ります。言語とテーマだけを同じブラウザー内に保存します。"
      ]
    }
  ],
  "en": [
    {
      "heading": "Overview",
      "paragraphs": [
        "A maximal repeat is a sequence of at least 3 characters with an occurrence pair that cannot extend l" +
      "eft or right. All occurrences, including overlaps, are counted; gaps are differences between adjacen" +
      "t positions.",
        "Input is normalized with NFKD, combining marks are removed, and letters are uppercased. With space a" +
      "nd symbol removal off, spaces, newlines and symbols also count toward positions."
      ]
    },
    {
      "heading": "Input and controls",
      "paragraphs": [
        "The analysis limit is 10,000 characters. Files must be .txt or text/* and no larger than 1 MB. Analy" +
      "sis stays on your device and is not transmitted.",
        "Analyze again after changing the input, symbol setting or key length limit. The table shows 20 rows " +
      "per page, supports length filters, and sorts using its heading buttons.",
        "Use row checkboxes, Show all and Hide all to control highlighting. Yellow means 3–4 characters, gree" +
      "n 5–7, and red 8 or more. Longer groups take priority at overlaps."
      ]
    },
    {
      "heading": "Expected by chance",
      "paragraphs": [
        "The expected number of matching position pairs of length L is C(n−L+1, 2) × κ^L. Here n is the analy" +
      "zed text length and κ is its IC. This estimates how many matching pairs could arise by chance."
      ]
    },
    {
      "heading": "Kasiski ratio",
      "paragraphs": [
        "Every even gap is divisible by 2, so raw counts favor small factors. The ratio is divisible gaps / (" +
      "all gaps / k); values near 1 are expected by chance.",
        "The estimate is the smallest divisor of the highest-ratio k, including k itself, whose ratio is at l" +
      "east 0.8 times the maximum. A maximum ratio below 2.5 indicates no clear bias.",
        "A divisor divides one gap; a common divisor divides several gaps. Each sequence row lists the common" +
      " divisors of all its gaps from 2 to the selected limit."
      ]
    },
    {
      "heading": "Column IC and Friedman",
      "paragraphs": [
        "Column IC splits the A–Z text into columns for each candidate length and averages their IC values. T" +
      "he first length reaching 0.060 is selected. A value of 1 may indicate monoalphabetic substitution.",
        "The Friedman formula is only a rough guide. It assumes English IC near 0.065 and uniform IC of 1/26." +
      " A nonpositive denominator gives no estimate; estimates below 1 are clamped to 1.",
        "Agreement between the two methods is strong evidence, not a guarantee. Interpret short texts, sparse" +
      " repeats and non-English statistics with care."
      ]
    },
    {
      "heading": "Classification and limits",
      "paragraphs": [
        "Classification uses A–Z only: fewer than 100 letters is insufficient; IC above 0.060 suggests monoal" +
      "phabetic substitution, below 0.045 suggests a polyalphabetic cipher, and intermediate values are unc" +
      "ertain.",
        "Degenerate inputs may be truncated at 2,000,000 candidate characters or 200,000 occurrence positions" +
      ". Only language and theme preferences are stored in the same browser."
      ]
    }
  ]
};

const i18n = (() => {
  let language = 'ja';

  function t(key, params = {}) {
    const value = messages[language][key];
    if (typeof value !== 'string') throw new Error('Missing translation: ' + key);
    return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? '{' + name + '}'));
  }

  function renderHelp() {
    const body = document.getElementById('help-body');
    body.replaceChildren();
    helpSections[language].forEach(section => {
      const container = document.createElement('section');
      container.className = 'help-section';
      const heading = document.createElement('h3');
      heading.textContent = section.heading;
      container.appendChild(heading);
      section.paragraphs.forEach(text => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        container.appendChild(paragraph);
      });
      body.appendChild(container);
    });
  }

  function apply() {
    document.documentElement.lang = language;
    document.title = t('page.title');
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (el.closest('noscript')) return;
      el.textContent = t(el.dataset.i18n);
    });
    ['title', 'placeholder', 'aria-label'].forEach(attribute => {
      document.querySelectorAll('[data-i18n-' + attribute + ']').forEach(el => {
        el.setAttribute(attribute, t(el.getAttribute('data-i18n-' + attribute)));
      });
    });
    const toggle = document.getElementById('language-toggle');
    toggle.setAttribute('aria-label', language === 'ja' ? 'Switch to English' : 'Switch to Japanese');
    renderHelp();
  }

  function setLanguage(value) {
    if (!['ja', 'en'].includes(value)) return;
    language = value;
    try { localStorage.setItem('repeatseq-language', value); } catch { /* Memory-only fallback. */ }
    apply();
    document.dispatchEvent(new Event('languagechange'));
  }

  function initialize() {
    const query = new URLSearchParams(location.search).get('lang');
    let saved = null;
    try { saved = localStorage.getItem('repeatseq-language'); } catch { /* Storage is optional. */ }
    language = ['ja', 'en'].includes(query) ? query
      : ['ja', 'en'].includes(saved) ? saved : navigator.language.startsWith('ja') ? 'ja' : 'en';
    apply();
    document.getElementById('language-toggle').addEventListener('click', () => {
      setLanguage(language === 'ja' ? 'en' : 'ja');
    });
  }

  return { t, initialize, setLanguage, get language() { return language; } };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { messages, helpSections, i18n };
}
