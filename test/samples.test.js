const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const samples = require('../js/samples.js');

test('five embedded samples have the specified order, fields and exact UTF-8 bytes', () => {
  assert.deepEqual(samples.map(s => s.id), ['caesar', 'shift', 'vigenere1', 'vigenere2', 'random']);
  for (const sample of samples) {
    assert.deepEqual(Object.keys(sample), ['id', 'file', 'text']);
    assert.equal(sample.file, `samples/${sample.id}/${sample.id === 'random' ? 'random' : 'ciphertext'}.txt`);
    const bytes = fs.readFileSync(path.join(__dirname, '..', sample.file));
    assert.equal(sample.text, bytes.toString('utf8'));
    assert.deepEqual(Buffer.from(sample.text, 'utf8'), bytes);
  }
});

test('embedded source contains no keys or plaintext answers', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'js/samples.js'), 'utf8');
  for (const secret of ['LEMON', 'KNOWLEDGEISKEY', 'WHENINAPRIL', 'CRYPTOGRAPHY']) {
    assert.equal(source.includes(secret), false);
  }
});
