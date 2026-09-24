const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

test('strict CSP, referrer and no-script guidance', () => {
  const meta = html.match(/<meta\s+http-equiv="Content-Security-Policy"[^>]+>/)[0];
  assert.match(meta, /default-src 'self'/);
  assert.match(meta, /script-src 'self'/);
  assert.match(meta, /style-src 'self'/);
  assert.match(meta, /object-src 'none'/);
  assert.match(meta, /base-uri 'none'/);
  assert.match(meta, /form-action 'none'/);
  assert.doesNotMatch(meta, /unsafe-inline|frame-ancestors/);
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.match(html, /<noscript>[\s\S]+?<\/noscript>/);
});

test('no executable input or inline styles', () => {
  assert.doesNotMatch(html, /\sstyle\s*=|\son\w+\s*=/i);
  assert.doesNotMatch(app, /innerHTML|\.style\s*(?:\.|\[)/);
});

test('external links, explicit button types and scroll regions', () => {
  for (const tag of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    assert.match(tag[0], /rel="noopener noreferrer"/);
  }
  for (const tag of html.matchAll(/<button\b[^>]*>/g)) assert.match(tag[0], /type="button"/);
  for (const tag of html.matchAll(/<div\b[^>]*class="table-scroll"[^>]*>/g)) {
    assert.match(tag[0], /role="region"/);
    assert.match(tag[0], /tabindex="0"/);
    assert.match(tag[0], /aria-label="[^"]+"/);
  }
  for (const label of html.matchAll(/<label\b[^>]*for="([^"]+)"/g)) {
    assert.ok(html.includes(`id="${label[1]}"`));
  }
});
