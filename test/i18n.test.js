const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { messages, helpSections } = require('../js/i18n.js');
const root = path.resolve(__dirname, '..');
const ranges = [[0x3040, 0x30ff], [0x4e00, 0x9fff], [0xff01, 0xff60]];
const japanese = new RegExp('[' + ranges.map(([a, b]) =>
  String.fromCodePoint(a) + '-' + String.fromCodePoint(b)).join('') + ']');

test('matching dictionaries, nonempty values and structured help', () => {
  assert.deepEqual(Object.keys(messages.ja).sort(), Object.keys(messages.en).sort());
  for (const lang of ['ja', 'en']) {
    for (const value of Object.values(messages[lang])) assert.ok(value.trim());
    assert.ok(helpSections[lang].length > 0);
    for (const section of helpSections[lang]) {
      assert.ok(section.heading.trim());
      assert.ok(section.paragraphs.length);
      section.paragraphs.forEach(value => assert.ok(value.trim()));
    }
    const removedTerm = String.fromCodePoint(0x4fe1, 0x983c, 0x5ea6);
    assert.ok(!JSON.stringify(helpSections[lang]).includes(removedTerm));
    assert.doesNotMatch(JSON.stringify(helpSections[lang]), /confidence/i);
  }
});

test('all literal translation and HTML attribute keys exist', () => {
  for (const file of ['js/app.js', 'js/i18n.js', 'index.html']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const patterns = [/i18n\.t\('([^']+)'/g, /data-i18n(?:-[\w-]+)?="([^"]+)"/g];
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) assert.ok(match[1] in messages.ja, `${file}: ${match[1]}`);
    }
  }
});

test('application, core and theme contain no Japanese outside comments', () => {
  for (const file of ['js/app.js', 'js/repeatseq-core.js', 'js/theme-init.js']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    // Keep quoted URLs intact while removing actual comments.
    const tokens = source.match(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\*[\s\S]*?\*\/|\/\/[^\n]*|[^/"'`]+|\//g);
    const code = tokens.filter(token => !token.startsWith('//') && !token.startsWith('/*')).join('');
    assert.ok(!japanese.test(code), file);
  }
});
