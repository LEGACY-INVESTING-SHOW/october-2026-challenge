const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
test('immutable font URLs change when font bytes change', () => {
  for (const name of fs.readdirSync(path.join(root, 'assets/fonts'))) {
    if (!name.endsWith('.woff2')) continue;
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'assets/fonts', name))).digest('hex').slice(0, 12);
    assert.ok(name.endsWith(`.${hash}.woff2`), `${name}: rename and update references after changing font bytes`);
  }
});
test('local font and stylesheet references resolve on every funnel page', () => {
  const files = fs.readdirSync(root).filter(name => name.endsWith('.html')).map(name => path.join(root, name));
  files.push(...fs.readdirSync(path.join(root, 'assets/css')).map(name => path.join(root, 'assets/css', name)));
  for (const file of files) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/\/assets\/(?:fonts|css)\/[^'"\s)<>]+/g)) {
      assert.ok(fs.existsSync(path.join(root, match[0])), `${file}: missing ${match[0]}`);
    }
  }
});
