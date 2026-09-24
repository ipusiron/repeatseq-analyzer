日本語: [README.md](README.md)

# RepeatSeq Analyzer - Repeated Sequence Detection Tool

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/repeatseq-analyzer?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/repeatseq-analyzer?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/repeatseq-analyzer)
![GitHub license](https://img.shields.io/github/license/ipusiron/repeatseq-analyzer)

[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/repeatseq-analyzer/)

**Day028 - 100 Security Tools Built with Generative AI**

RepeatSeq Analyzer detects repeated sequences of at least 3 characters in ciphertext and uses their positions and gaps to help estimate key length.
For classical cryptanalysis practice and learning the Kasiski method, it calculates maximal repeats, Kasiski ratios and column IC entirely in your browser.

## 🌐 Demo

[Open RepeatSeq Analyzer](https://ipusiron.github.io/repeatseq-analyzer/)

## 📸 Screenshots

![Both methods suggest key length 14](assets/screenshot.png)
> *Light Japanese view of vigenere2: the Kasiski ratio is 8.63 and both methods select 14. 1280×1200, 101,131 bytes.*

![Highlighted repeats and the results table](assets/screenshot2.png)
> *Vigenere1 highlights and LRPHUP: length 6, positions 230, 280 and 360. 1280×1000, 112,165 bytes.*

![Dark English input and classification](assets/screenshot3.png)
> *The top of the dark English page after analyzing vigenere1. 1280×1200, 89,063 bytes.*

## ✨ Features

- Maximal repeats of at least 3 characters, with every occurrence and adjacent gap
- Preliminary cipher classification using the IC of A–Z letters only
- Key length estimates from Kasiski ratios, column IC and the Friedman formula
- Expected matching pairs by chance for each repeat and lengths 3–6
- Yellow (3–4 characters), green (5–7) and red (8+) highlights, with longer groups taking priority at overlaps
- Per-row highlighting, Show all and Hide all
- 20 rows per page, sorting by four columns and four length filter groups
- Text file selection and drag and drop
- Japanese/English switching, light/dark themes, keyboard controls and a help dialog

## 📖 Usage

### Basic steps

1. Paste ciphertext into the input, or select or drop a text file.
2. Check Remove spaces and symbols and the maximum key length (20, 30 or 40; default 20).
3. Select 🔍 Analyze. Loading a file starts analysis automatically.
4. Inspect classification, highlights, repeated sequences, statistics and key length estimates.

The analysis limit is 10,000 characters. Files must be .txt or text/* and no larger than 1 MB.
Input is normalized using NFKD, stripped of combining marks and uppercased. Space and symbol removal is on by default.
Turning it off preserves spaces, newlines and symbols in positions and repeated sequences; column IC, Friedman and classification always use A–Z only.

Changing the input, symbol setting or maximum length hides old results. Analyze again.
Switching languages redraws the same result without rerunning analysis.
Sequences are abbreviated after 24 characters; positions and gaps show the first 6 values and the number omitted.
Positions start at 0. Sort by sequence, length, occurrence count or first position.

## ❓ Why Find Repeated Sequences

In polyalphabetic ciphers, especially Vigenere, the same plaintext segment can produce the same ciphertext when it aligns with the same repeating key.
This creates repeated sequences in the ciphertext.

Analyzing the gaps and their common divisors helps narrow down candidate key lengths.
This approach is called the Kasiski examination.

### Example

Suppose two copies of the same sequence are 30 characters apart.
The divisors of 30—1, 2, 3, 5, 6, 10, 15 and 30—are possible key lengths.

Column IC handles length 1 as a possible monoalphabetic case. The Kasiski table considers factors from 2 to the selected limit.

Another repeated sequence may narrow the candidates further.
Numbers dividing both gaps are common divisors and provide additional evidence.

## 🔬 Methods and Known Answers

### Maximal repeats and chance expectations

A maximal repeat is a sequence of at least 3 characters with an occurrence pair that cannot extend left or right.
Every occurrence, including overlaps, is listed in ascending order, and gaps are differences between adjacent positions.
A substring of a long repeat becomes a separate row only when it has another context.
The default order is descending length, then ascending first position.

The chance expectation is `C(n−L+1, 2) × κ^L`, where n is the analyzed text length, L the match length and κ the text's IC.
It estimates how many matching position pairs of that length could arise by chance. Values at least 1 are rounded to integers; smaller values use two decimals, so 0.00 pairs does not necessarily mean zero probability.

### Key length estimation

The Kasiski ratio is `gaps divisible by k / (all gaps / k)`.
Every even gap is divisible by 2, so raw counts favor smaller numbers. The ratio compares a count with chance.
Among divisors of the highest-ratio k, including k itself, the estimate is the smallest one whose ratio is at least 0.8 times the maximum.
A maximum ratio below 2.5 indicates no clear bias (null).

Column IC averages the IC values of columns for each candidate key length.
It searches from 1 to the selected limit and chooses the first length reaching 0.060.
A result of 1 may indicate monoalphabetic substitution. Agreement between both methods is strong evidence, not a guarantee.

The rough Friedman estimate is `(κp−κr)n / ((κp−I)+n(I−κr))`.
It uses English κp=0.065 and uniform κr=1/26. Fewer than two letters or a nonpositive denominator produces null; estimates below 1 become 1.
The interface shows one decimal place; the table below uses two. Interpret short texts and non-English statistics carefully.

Classification returns insufficient data below 100 letters, monoalphabetic for IC>0.060, polyalphabetic for IC<0.045 and uncertain in between.
Degenerate inputs, such as a long run of one letter, are truncated at a total of 2,000,000 candidate characters or 200,000 positions, with a warning.

### Changes from the previous version

Maximal repeats replace counting every window of length 3–25.
Key estimates use ratios and column IC instead of raw divisor counts, and an unsupported percentage score has been replaced by expected pairs by chance.

### Bundled known-answer samples

| Sample | File | Type | Key | Characters | Repeats | Kasiski | Column IC | Friedman |
|---|---|---|---|---|---|---|---|---|
| caesar | `samples/caesar/ciphertext.txt` | Caesar | 3 | 614 | 83 | null | 1 | 1.00 |
| shift | `samples/shift/ciphertext.txt` | Shift | 16 | 614 | 83 | null | 1 | 1.00 |
| vigenere1 | `samples/vigenere1/ciphertext.txt` | Vigenere | LEMON | 614 | 39 | 5 | 5 | 8.13 |
| vigenere2 | `samples/vigenere2/ciphertext.txt` | Vigenere | KNOWLEDGEISKEY | 4937 | 288 | 14 | 14 | 11.87 |
| random | `samples/random/random.txt` | Random | — | 2000 | 116 | null | null | null |

Null means no estimate meets the method's rule. Random is a comparison fixture, not a cipher.
To inspect a sample in the interface, paste its contents or select the corresponding file.

## 🔒 Security

Analysis is entirely client-side, and the application makes no external requests.
Input is rendered through textContent and DOM APIs, never interpreted as HTML.
The meta CSP restricts script-src and style-src to 'self'; there are no inline scripts, inline styles or external CDNs.
The referrer policy is no-referrer. Links opening a new tab use noopener noreferrer.

Only language (repeatseq-language) and theme (theme) are saved in localStorage in the same browser.
If storage is blocked, the current page remains functional. Input and analysis results are not saved.
GitHub Pages does not support arbitrary response headers, so protection against framing is not guaranteed.

## 🔗 Related Tools

- [Caesar Cipher Wheel Tool](https://github.com/ipusiron/caesar-cipher-wheel): Caesar cipher visualization
- [Caesar Cipher Breaker](https://github.com/ipusiron/caesar-cipher-breaker): brute-force Caesar deciphering
- [Frequency Analyzer](https://github.com/ipusiron/frequency-analyzer): frequency analysis for monoalphabetic substitution
- [Vigenere Cipher Tool](https://github.com/ipusiron/vigenere-cipher-tool): Vigenere encryption and decryption

## 📚 References

- [All About Cryptography (Japanese)](https://akademeia.info/?page_id=157), pp. 75–80
- [Practical Guide to Cryptanalysis (Japanese)](https://akademeia.info/?page_id=39995), pp. 168–171

## 🧪 Tests

Run `npm test` with Node 22 or later. No dependencies are needed.
GitHub Actions runs the same command on Node 22 for every push and pull_request.
The README known-answer table is also checked by recalculating values from the samples with RepeatSeqCore.

| File | Coverage |
|---|---|
| test/core.test.js | Five samples, small examples, normalization, 500 brute-force comparisons and degenerate inputs |
| test/samples.test.js | Embedded sample bytes match the fixtures and contain no answer keys |
| test/i18n.test.js | Matching language keys, used keys, empty values and Japanese literals in application code |
| test/html.test.js | CSP, referrer, links, ARIA and safe DOM rendering |
| test/contrast.test.js | Fourteen text color pairs and focus outlines in both themes |
| test/format.test.js | Maximum line lengths and minimum file lengths |
| test/readme.test.js | Known answers, YAML, complete file tree, headings and images |

## 📁 Directory Structure

```text
repeatseq-analyzer/                # Project root
├── .github/                       # GitHub configuration
│   └── workflows/                 # GitHub Actions workflows
│       └── test.yml               # Run npm test on Node 22 for push and pull_request
├── .gitignore                     # Ignored local files and dependencies
├── .nojekyll                      # Disable Jekyll processing on GitHub Pages
├── CLAUDE.md                      # Development guide: architecture, rules and tests
├── LICENSE                        # MIT license
├── README.md                      # Japanese usage, methods, known answers and structure
├── README.en.md                   # English README with matching sections
├── package.json                   # Dependency-free node --test command
├── index.html                     # Input, results, estimates, help and security metadata
├── style.css                      # Theme variables, light/dark colors and responsive layout
├── assets/                        # README screenshots
│   ├── screenshot.png             # Vigenere2: both key estimates are 14
│   ├── screenshot2.png            # Vigenere1 highlights and repeated sequence table
│   └── screenshot3.png            # Vigenere1: dark English page header and classification
├── js/                            # Classic scripts compatible with file URLs
│   ├── repeatseq-core.js          # DOM-independent maximal repeats, ratios, IC and Friedman
│   ├── samples.js                 # Embedded ciphertexts for loading under file://
│   ├── app.js                     # Input, safe DOM rendering and interface controls
│   ├── i18n.js                    # Japanese and English dictionaries, structured help and switching
│   └── theme-init.js              # Saved theme applied before first paint
├── samples/                       # Unmodified test fixtures
│   ├── caesar/                    # Caesar cipher with shift 3
│   │   ├── ciphertext.txt         # Ciphertext
│   │   ├── plaintext.txt          # Plaintext
│   │   └── shift.txt              # Shift amount
│   ├── random/                    # Random text comparison fixture
│   │   └── random.txt             # 2000 random letters
│   ├── shift/                     # Shift cipher with shift 16
│   │   ├── ciphertext.txt         # Ciphertext
│   │   ├── plaintext.txt          # Plaintext
│   │   └── shift.txt              # Shift amount
│   ├── vigenere1/                 # Vigenere cipher with key LEMON
│   │   ├── ciphertext.txt         # Ciphertext
│   │   ├── key.txt                # Cipher key
│   │   └── plaintext.txt          # Plaintext
│   └── vigenere2/                 # Long Vigenere ciphertext with key KNOWLEDGEISKEY
│       ├── ciphertext.txt         # Ciphertext
│       ├── key.txt                # Cipher key
│       └── plaintext.txt          # Plaintext
└── test/                          # Dependency-free node:test suite
    ├── core.test.js               # Five known answers, examples and seeded brute-force comparison
    ├── samples.test.js            # Embedded samples match their source files
    ├── i18n.test.js               # Dictionary consistency and no Japanese literals in application code
    ├── html.test.js               # CSP, metadata, ARIA and safe DOM constraints
    ├── contrast.test.js           # WCAG contrast of at least 4.5 in both themes
    ├── format.test.js             # Line lengths and minimum file lengths against minification
    └── readme.test.js             # Known answers, metadata, full file tree, headings and images
```

## 💻 Requirements

A modern browser is required. There is no build step; scripts remain classic scripts.
This change was tested in Chromium using both file:// by opening `index.html` directly and local HTTP.

For HTTP, run `python -m http.server 8000` in the repository root and open `http://localhost:8000/`.
Widths 1280, 768, 390 and 320 pixels were checked in both languages and themes. Only table containers scroll horizontally.

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

## 🛠️ About This Tool

This tool is part of the “100 Security Tools Built with Generative AI” project.
With AI assistance, the project creates and publishes security-related tools over 100 days.

For project details and other tools, see the following page.

[100 Security Tools Built with Generative AI](https://akademeia.info/?page_id=42163)
