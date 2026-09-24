const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
const pairs = [
  ['body', 'text-color', 'bg-color'],
  ['section', 'text-color', 'section-bg'],
  ['header', 'header-text', 'header-bg'],
  ['button', 'button-text', 'button-bg'],
  ['muted', 'muted-text', 'filter-bg'],
  ['table', 'text-color', 'table-header'],
  ['short highlight', 'highlight-text', 'highlight-bg'],
  ['medium highlight', 'highlight-text', 'highlight-medium'],
  ['long highlight', 'highlight-text', 'highlight-important'],
  ['warning', 'warning-text', 'warning-bg'],
  ['error', 'error-text', 'section-bg'],
  ['success', 'success-text', 'success-bg'],
  ['link', 'link-text', 'section-bg'],
  ['footer link', 'link-text', 'bg-color']
];
function luminance(color) {
  if (color === 'white') color = '#ffffff';
  let value = color.slice(1);
  if (value.length === 3) value = [...value].map(v => v + v).join('');
  const parts = value.match(/../g).map(v => parseInt(v, 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return parts[0] * 0.2126 + parts[1] * 0.7152 + parts[2] * 0.0722;
}
for (const selector of [':root', '[data-theme="dark"]']) {
  const start = css.indexOf(selector + ' {');
  const block = css.slice(start, css.indexOf('}', start));
  const vars = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2]]));
  for (const [name, fg, bg] of pairs) {
    test(`${selector}: ${name} >= 4.5`, () => {
      const values = [luminance(vars[fg]), luminance(vars[bg])].sort((a, b) => b - a);
      assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5);
    });
  }
  test(`${selector}: focus ring >= 3`, () => {
    for (const bg of ['bg-color', 'section-bg']) {
      const values = [luminance(vars['focus-color']), luminance(vars[bg])].sort((a, b) => b - a);
      assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 3);
    }
  });
}
