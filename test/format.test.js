const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

const checkedFiles = [
  ...fs.readdirSync(path.join(root, 'js')).map(name => 'js/' + name),
  ...fs.readdirSync(path.join(root, 'test')).map(name => 'test/' + name),
  'style.css', 'index.html'
];
for (const file of checkedFiles) {
  test(`line length: ${file}`, () => {
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => assert.ok([...line].length <= (file === 'index.html' ? 250 : 160), `${file}:${i + 1}`));
  });
}

const minimums = [['style.css', 700], ['index.html', 150], ['js/repeatseq-core.js', 100], ['js/app.js', 400], ['js/i18n.js', 200]];
for (const [file, min] of minimums) {
  test(`readable structure: ${file}`, () => {
    assert.ok(fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).length >= min);
  });
}
