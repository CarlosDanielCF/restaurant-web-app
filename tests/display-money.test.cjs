const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(
      require('node:path').join(
        __dirname,
        '../src/pages/Private/Finance/displayMoney.ts'
      ),
      'utf8'
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020
      }
    }
  ).outputText,
  { exports: exportsObject, BigInt }
);
const { difference, sumMoney, cents } = exportsObject;
test('exact cent previews for cash change and partial mixed payments', () => {
  assert.equal(difference('50.00', '42.00'), '8.00');
  assert.equal(sumMoney(['0.10', '0.20']), '0.30');
  assert.equal(
    difference('65.00', sumMoney(['30.00', '20.00', '15.00'])),
    '0.00'
  );
});
test('invalid entries are not represented as authoritative change', () => {
  for (const v of ['', 'NaN', '1.001', '1e3', '9,00'])
    assert.equal(cents(v), null);
  assert.equal(difference('', '20.00'), '—');
  assert.equal(difference('10.00', '20.00'), '-10.00');
});
test('large amounts and credit balances retain exact cents', () => {
  assert.equal(difference('99999999999999.99', '0.01'), '99999999999999.98');
  assert.equal(difference('-10.00', '0.01'), '-10.01');
});
