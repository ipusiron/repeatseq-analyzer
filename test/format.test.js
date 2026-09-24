const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

for (const file of ['js/repeatseq-core.js', 'test/core.test.js', 'test/format.test.js']) {
  test(`line length: ${file}`, () => {
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => assert.ok([...line].length <= 160, `${file}:${i + 1}`));
  });
}

for (const [file, min] of [['style.css', 700], ['index.html', 150], ['js/repeatseq-core.js', 100]]) {
  test(`readable structure: ${file}`, () => {
    assert.ok(fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).length >= min);
  });
}
