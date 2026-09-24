# CLAUDE.md

This file provides guidance to Claude Code and other coding agents working in this repository.

## Project Overview

RepeatSeq Analyzer is a client-side cryptanalysis tool for maximal repeats and key length estimation.
It uses static HTML, CSS and vanilla JavaScript. Keep classic scripts: ES modules would break direct file:// use.
No build step, runtime network requests, external fonts or npm dependencies are needed.

## Commands

- Open index.html directly, or run `python -m http.server 8000` and open http://localhost:8000/.
- Run `npm test` with Node 22 or later. It invokes the built-in `node --test` runner.
- Run `git diff --check` before committing. CI runs the same tests on push and pull_request.

## Architecture

- `index.html`: input, classification, highlights, results table, statistics, estimates and native help dialog.
- `style.css`: theme variables, contrast, table scrolling, mobile layout and focus indicators.
- `js/repeatseq-core.js`: pure RepeatSeqCore object, also exported for CommonJS tests.
- `js/app.js`: input handling and DOM rendering from one stored analysis result.
- `js/i18n.js`: Japanese/English dictionaries, structured help and language selection.
- `js/theme-init.js`: synchronous theme initialization in head before the stylesheet.
- `samples/`: immutable known-answer fixtures.
- `assets/`: three README screenshots.
- `README.md` and `README.en.md`: matching sections, known answers and complete file trees.
- `.github/workflows/test.yml`: dependency-free Node 22 tests.

## Analysis Rules

1. Preserve the supplied core implementation, constants, return shapes and tie-breaking rules.
2. Normalize with NFKD, remove combining marks, then uppercase; optionally remove everything except A-Z.
3. A maximal repeat has length at least 3 and an occurrence pair that cannot extend left or right.
   Record every position, including overlaps, and adjacent gaps. Sort by descending length then first position.
4. Stop at 2,000,000 candidate characters or 200,000 total occurrence positions and report truncation.
5. Expected pairs by chance are `C(n-L+1, 2) * kappa^L`, using the analyzed text's IC.
6. Kasiski ratio is divisible gaps / (all gaps / k). If the maximum ratio is below 2.5, best is null.
   Otherwise choose the smallest divisor of the highest-ratio k with at least 0.8 times its ratio.
7. Column IC uses A-Z only and selects the first length whose average column IC reaches 0.060.
8. Friedman uses English 0.065 and uniform 1/26; return null for insufficient data or a nonpositive denominator.
   Clamp estimates below 1 to 1. Display it as a rough guide, not a guarantee.
9. Classification uses A-Z only: below 100 letters is insufficient, above 0.060 mono, below 0.045 poly, else uncertain.
10. Derive README table values and every expected result from RepeatSeqCore and the unchanged fixtures.
    Do not edit expectations to hide implementation failures.

## Interface and Security Rules

- Analyze at most 10,000 normalized characters; files must be .txt or text/* and no larger than 1 MB.
- Store one analysis result. Highlights must always use its text, never reread and renormalize the input.
- Track enabled sequences by seq in a Set, never by sorted or filtered row index.
- Input, symbol setting or key length limit changes hide stale results. Language changes reuse the analysis.
- Keep the maximum key length choices 20, 30 and 40, default 20; use 20 rows per results page.
- Use textContent and DOM APIs for all user input and help content. Never use innerHTML.
- Keep meta CSP script-src and style-src restricted to 'self', with no unsafe-inline or meta frame-ancestors.
- No style attributes, element.style assignments, inline handlers, eval or external runtime dependencies.
- Use hidden and classes for visibility, native meter elements for bars, and a dialog for help.
- Keep no-referrer, bilingual noscript guidance and noopener noreferrer for all new-tab links.
- Keep every control at least 44px, tables inside keyboard-focusable scrolling regions and reduced-motion support.
- Center the header with the three-column grid at 769px and wider; stack controls below it at smaller widths.
- Text contrast must remain at least 4.5:1 and focus outlines at least 3:1 in both themes.

## Language and Storage

All interface strings, errors, labels and help paragraphs belong in the matching ja/en dictionaries.
No Japanese literals outside comments in app.js, repeatseq-core.js or theme-init.js.
Translate hidden content and title, placeholder and aria-label attributes as well as visible text.
Keep the fixed bilingual noscript fallback. Switch the html lang and document title with the language.
Language precedence: valid ?lang=ja|en, then saved repeatseq-language, then navigator.language.
Only repeatseq-language and theme are stored locally. Validate values and catch all storage errors.
Never persist ciphertext or results. Apply the saved theme to the root before the first paint.

## Tests

| File | Purpose |
|---|---|
| test/core.test.js | Five known answers, examples, normalization, 500 seeded brute-force cases, limits and Kasiski rules |
| test/i18n.test.js | Matching keys, used keys, nonempty values and no Japanese literals in application code |
| test/html.test.js | CSP, referrer, accessible elements, links, early theme and safe DOM |
| test/contrast.test.js | Fourteen text/background pairs and focus outlines for both themes |
| test/format.test.js | Line length limits and minimum file lengths against minification |
| test/readme.test.js | Both known-answer tables, metadata, complete file trees, sections and image references |

## Known Answers

| Sample | Characters | Repeats | Kasiski | Column IC | Friedman |
|---|---|---|---|---|---|
| caesar | 614 | 83 | null | 1 | 1.00 |
| shift | 614 | 83 | null | 1 | 1.00 |
| vigenere1 | 614 | 39 | 5 | 5 | 8.13 |
| vigenere2 | 4937 | 288 | 14 | 14 | 11.87 |
| random | 2000 | 116 | null | null | null |

The tool estimates key lengths; it does not recover keys or plaintext.
On-screen sample loading, a step-by-step guide and transfers to other tools are intentionally deferred.
