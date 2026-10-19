/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load(file, dependencies = {}) {
  const result = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(__dirname, file), 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020
      }
    }).outputText,
    {
      exports: result,
      BigInt,
      require: (name) => {
        if (!(name in dependencies))
          throw new Error(`Unexpected dependency ${name}`);
        return dependencies[name];
      }
    }
  );
  return result;
}
const money = load('../src/pages/Private/Finance/displayMoney.ts');
const { purchasePreview, wholeUnits } = load(
  '../src/pages/Private/Supplies/previews.ts',
  { '../Finance/displayMoney': money }
);
test('purchase preview uses exact cents and commercial units', () => {
  assert.equal(purchasePreview('24', '2.50'), '60.00');
  assert.equal(purchasePreview('3', '0.10'), '0.30');
  assert.equal(
    purchasePreview('999999999', '9999999999.99'),
    '9999999989990000000.01'
  );
});
test('invalid fractional quantities and cost formats never become a valid preview', () => {
  for (const quantity of ['', '0', '-1', '1.5', '1e2', '1000000000'])
    assert.equal(purchasePreview(quantity, '1'), null);
  for (const cost of ['', '-1', 'NaN', '1e3', '1.001', '0,10'])
    assert.equal(purchasePreview('2', cost), null);
});
test('zero count is valid only in physical count/opening, never a purchase', () => {
  assert.equal(wholeUnits('0'), false);
  assert.equal(wholeUnits('0', true), true);
  assert.equal(wholeUnits('2'), true);
  assert.equal(wholeUnits('2.5', true), false);
});
