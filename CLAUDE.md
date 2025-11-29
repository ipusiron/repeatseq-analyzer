# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RepeatSeq Analyzer is a web-based cryptanalysis tool that detects repeated character sequences in cipher text to estimate key lengths using the Kasiski examination method. It's a client-side application with no build dependencies (static HTML/CSS/JS).

## Commands

### Running Locally
```bash
# Open in browser
start index.html  # Windows
open index.html   # macOS
xdg-open index.html  # Linux
```

### Testing with Playwright
```bash
# Install dependencies (first time only)
npm install

# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/repeatseq.spec.ts

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run tests for specific browser
npx playwright test --project=chromium
```

### Deployment
```bash
git checkout gh-pages && git merge main && git push origin gh-pages
```

## Architecture

### Core Components (`script.js`)

1. **Cipher Type Detection**: `detectCipherType()` uses Index of Coincidence (IC) to classify monoalphabetic vs polyalphabetic ciphers before analysis

2. **Pattern Detection**: Sliding window algorithm finds repeated sequences (3-25 chars), stores positions in hash map for O(n²) lookup

3. **Confidence Scoring**: `calculateConfidenceScores()` evaluates patterns based on:
   - Sequence length (longer = more reliable)
   - Occurrence frequency
   - Gap validity (10-100 is optimal)
   - Divisor usefulness (3-20 range)

4. **Highlight System**: Priority-based coloring (red: 8+ chars, green: 5-7, yellow: 3-4) with per-pattern toggle control

5. **Results Display**: Paginated table (20/page), sortable columns, length-based filtering

### Key Functions
- `calculateIC()`: Index of Coincidence for cipher classification
- `getDivisors()`: Common divisors for key length estimation
- `renderHighlights()`: DOM-based pattern visualization
- `renderKeylengthHints()`: Frequency-ranked key length candidates

## Testing

### Sample Files (`samples/`)
| Directory | Type | Key | Purpose |
|-----------|------|-----|---------|
| `caesar/` | Caesar cipher | shift=3 | Monoalphabetic test (high IC) |
| `vigenere1/` | Vigenère | LEMON | Short key, clear patterns |
| `vigenere2/` | Vigenère | KNOWLEDGEISKEY | Long key, long text |
| `random/` | Random | - | False positive testing |

### Playwright Tests (`tests/`)
- `repeatseq.spec.ts`: Main functionality tests
- `short-text.spec.ts`: Edge case for short input

## Important Considerations

1. **Static Site**: No build process - avoid adding build tools unless requested
2. **Japanese UI**: README and interface are in Japanese - maintain consistency
3. **Educational Focus**: Code clarity over performance
4. **Browser Compatibility**: ES6+ features, no IE support
5. **LocalStorage**: Dark mode preference persists via `theme` key