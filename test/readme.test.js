const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const core = require('../js/repeatseq-core.js');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const docs = { ja: read('README.md'), en: read('README.en.md') };
const headings = {
  ja: ['🌐 デモページ', '📸 スクリーンショット', '✨ 機能', '📖 使い方', '❓ なぜ反復文字列を特定するのか',
    '🔬 解析の方法と既知解答', '🔒 セキュリティ', '🔗 関連ツール', '📚 参考', '🧪 テスト', '📁 ディレクトリー構造',
    '💻 動作環境', '📄 ライセンス', '🛠️ このツールについて'],
  en: ['🌐 Demo', '📸 Screenshots', '✨ Features', '📖 Usage', '❓ Why Find Repeated Sequences',
    '🔬 Methods and Known Answers', '🔒 Security', '🔗 Related Tools', '📚 References', '🧪 Tests',
    '📁 Directory Structure', '💻 Requirements', '📄 License', '🛠️ About This Tool']
};
const names = ['caesar', 'shift', 'vigenere1', 'vigenere2', 'random'];
const kinds = { ja: ['シーザー', 'シフト', 'ヴィジュネル', 'ヴィジュネル', 'ランダム'],
  en: ['Caesar', 'Shift', 'Vigenere', 'Vigenere', 'Random'] };

for (const lang of ['ja', 'en']) {
  test(`${lang}: five complete known-answer rows recalculated from fixtures`, () => {
    const lines = docs[lang].split('\n').filter(line => /^\| (caesar|shift|vigenere1|vigenere2|random) \|/.test(line));
    assert.equal(lines.length, 5);
    lines.forEach((line, i) => {
      const name = names[i];
      const file = `samples/${name}/${name === 'random' ? 'random.txt' : 'ciphertext.txt'}`;
      const result = core.analyze(read(file));
      let key = '—';
      if (name !== 'random') {
        key = read(`samples/${name}/${name.startsWith('vigenere') ? 'key.txt' : 'shift.txt'}`).trim();
      }
      const actual = line.split('|').slice(1, -1).map(value => value.trim().replaceAll('`', ''));
      const expected = [name, file, kinds[lang][i], key, result.text.length, result.rows.length,
        result.kasiski.best, result.columnIC.best, result.friedman === null ? null : result.friedman.toFixed(2)];
      assert.deepEqual(actual, expected.map(String));
    });
  });

  test(`${lang}: matching ordered sections and cross-language link`, () => {
    assert.deepEqual([...docs[lang].matchAll(/^## (.+)$/gm)].map(m => m[1]), headings[lang]);
    assert.match(docs[lang], lang === 'ja' ? /English: \[README.en.md\]\(README.en.md\)/ : /日本語: \[README.md\]\(README.md\)/);
  });

  test(`${lang}: complete tracked/planned file tree with descriptions on every line`, () => {
    const tree = docs[lang].match(/```text\n(repeatseq-analyzer\/[\s\S]*?)\n```/)[1].split('\n');
    const files = [];
    const stack = [];
    const columns = [];
    tree.forEach((line, i) => {
      assert.match(line, / # \S/);
      columns.push(line.indexOf('#'));
      if (i === 0) return;
      const entry = line.split(' # ')[0].trimEnd();
      const match = entry.match(/^((?:│   |    )*)(?:├── |└── )(.+)$/);
      assert.ok(match, line);
      const depth = match[1].length / 4;
      const name = match[2];
      stack.length = depth;
      if (name.endsWith('/')) stack.push(name.slice(0, -1));
      else files.push([...stack, name].join('/'));
    });
    assert.equal(new Set(columns).size, 1);
    const gitFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'],
      { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/).filter(file => !file.startsWith('.claude/'));
    assert.deepEqual(files.sort(), [...new Set(gitFiles)].sort());
  });

  test(`${lang}: exactly three existing PNG images and captions with exact sizes`, () => {
    const images = [...docs[lang].matchAll(/!\[[^\]]*\]\((assets\/[^)]+\.png)\)/g)].map(m => m[1]);
    assert.deepEqual(images, ['assets/screenshot.png', 'assets/screenshot2.png', 'assets/screenshot3.png']);
    const captions = docs[lang].split('\n').filter(line => /^> \*.+\*$/.test(line));
    assert.equal(captions.length, 3);
    images.forEach((file, i) => {
      const bytes = fs.readFileSync(path.join(root, file));
      const dimensions = `${bytes.readUInt32BE(16)}×${bytes.readUInt32BE(20)}`;
      assert.ok(captions[i].includes(dimensions));
      assert.ok(captions[i].includes(bytes.length.toLocaleString('en-US')));
      assert.ok(bytes.length <= 300 * 1024);
    });
    assert.deepEqual(fs.readdirSync(path.join(root, 'assets')).filter(f => f.endsWith('.png')).sort(),
      images.map(file => path.basename(file)).sort());
    assert.doesNotMatch(docs[lang], /信頼度|公約数（1除外）|gh-pages|npx playwright/);
  });
}

test('preserve commented YAML structure and immutable metadata against HEAD', () => {
  const head = execFileSync('git', ['show', 'HEAD:README.md'], { cwd: root, encoding: 'utf8' });
  const extract = text => text.match(/^<!--[\s\S]*?-->/)[0];
  const actual = extract(docs.ja);
  const previous = extract(head);
  const keys = text => [...text.matchAll(/^(\w+):/gm)].map(m => m[1]);
  assert.deepEqual(keys(actual), keys(previous));
  for (const key of ['id', 'slug', 'repo_url', 'demo_url', 'hub']) {
    const pattern = new RegExp('^' + key + ':.*$', 'm');
    assert.equal(actual.match(pattern)[0], previous.match(pattern)[0]);
  }
  assert.match(actual, /^id: day028$/m);
  assert.match(actual, /^slug: repeatseq-analyzer$/m);
  assert.match(actual, /^hub: true$/m);
  for (const key of ['category_ja', 'category_en', 'tags']) {
    assert.match(actual, new RegExp('^' + key + ':\\n  - ', 'm'));
  }
  assert.ok(actual.startsWith('<!--\n---\n'));
  assert.ok(actual.endsWith('\n---\n-->'));
  assert.ok(!docs.en.includes('id: day028'));
});

test('no runtime dependencies or old tracked scaffolding', () => {
  assert.deepEqual(JSON.parse(read('package.json')), {
    name: 'repeatseq-analyzer', private: true, scripts: { test: 'node --test' }
  });
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
  assert.doesNotMatch(tracked, /^(?:\.claude\/|tests\/|playwright.config.js|package-lock.json|script.js)/m);
  const workflow = read('.github/workflows/test.yml');
  assert.match(workflow, /on: \[push, pull_request\]/);
  assert.match(workflow, /actions\/checkout@v4/);
  assert.match(workflow, /actions\/setup-node@v4/);
  assert.match(workflow, /node-version: 22/);
  assert.match(workflow, /run: npm test/);
});
