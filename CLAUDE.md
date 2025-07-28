# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RepeatSeq Analyzer is a web-based cryptanalysis tool that detects repeated character sequences in cipher text to estimate key lengths using the Kasiski examination method. It's a standalone, client-side application with no build dependencies.

## Commands

### Running and Testing
```bash
# Run locally - simply open in browser
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows

# No build, lint, or test commands - this is a static site
# Testing is done manually using the sample cipher texts in the samples/ directory
```

### Deployment
```bash
# Deploy to GitHub Pages (assuming gh-pages branch exists)
git checkout gh-pages
git merge main
git push origin gh-pages
```

## Architecture

### Core Components

1. **Pattern Detection Engine** (`script.js`):
   - `analyzeText()`: Main analysis function that coordinates the detection process
   - `detectRepeats()`: Implements sliding window algorithm to find repeated sequences (3-10 chars)
   - `calculateDivisors()`: Computes common factors of intervals to suggest key lengths
   - Uses hash maps for O(n²) performance with efficient lookups

2. **Visual Feedback System**:
   - DOM manipulation to highlight detected patterns
   - Color coding: red for 5+ character sequences, yellow for 3-4 characters
   - Real-time highlighting in the cipher text display

3. **Results Processing**:
   - Tabular display of sequences with positions, intervals, and divisors
   - Key length frequency analysis based on common divisors
   - Sorted by interval length for easier analysis

### Key Algorithms

The Kasiski method implementation:
1. Find all repeated sequences of length 3-10
2. Calculate intervals between occurrences
3. Find divisors of these intervals
4. Most frequent divisors suggest probable key lengths

### Testing Approach

Use the provided sample cipher texts in `samples/`:
- `caesar/`: Simple substitution cipher examples
- `vigenere1/`, `vigenere2/`: Polyalphabetic cipher examples with known keys

Each sample directory contains:
- `ciphertext.txt`: The encrypted text
- `plaintext.txt`: The original message
- `key.txt` or `shift.txt`: The encryption key

## Important Considerations

1. **No Build Process**: This is a static site - avoid adding package.json or build tools unless explicitly requested
2. **Educational Focus**: Code clarity is prioritized over performance optimization
3. **Japanese Documentation**: README and UI are in Japanese - maintain consistency
4. **Browser Compatibility**: Uses modern JavaScript features (ES6+) - no IE support needed
5. **Future Enhancements**: Code comments mention planned features (multiple occurrence detection, automatic coloring) - consider these when adding new functionality

## Related Tools

This tool is part of a cryptanalysis workflow:
- Companion tool: Vigenère Cipher Tool (https://ipusiron.github.io/vigenere-cipher-tool/)
- Full project series: "100 Security Tools with Generative AI"