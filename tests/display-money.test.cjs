/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
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

test('mixed 30 card plus 28 cash on 58 keeps exact remaining and 2 change', () => {
  const parts = [
    { method: 'CARD', amount: '30.00', receivedAmount: '30.00' },
    { method: 'CASH', amount: '28.00', receivedAmount: '30.00' }
  ];
  const d = exportsObject.paymentDistribution('58.00', parts);
  assert.equal(d.valid, true);
  assert.equal(d.distributed, '58.00');
  assert.equal(d.remaining, '0.00');
  assert.equal(difference('30.00', '28.00'), '2.00');
  parts[1].amount = '58.00';
  const invalid = exportsObject.paymentDistribution('58.00', parts);
  assert.equal(invalid.valid, false);
  assert.equal(invalid.exceeds, true);
  assert.equal(invalid.remaining, '0.00');
});
test('partial allowed; invalid, zero, negative, cash short and noncash change rejected', () => {
  const make = (amount, receivedAmount = amount, method = 'CASH') => [
    { method, amount, receivedAmount }
  ];
  assert.equal(
    exportsObject.paymentDistribution('58.00', make('20.00')).valid,
    true
  );
  for (const p of [
    make('0'),
    make('-1'),
    make('NaN'),
    make('5', '4'),
    make('5', '6', 'CARD'),
    make('1.001')
  ])
    assert.equal(exportsObject.paymentDistribution('58.00', p).valid, false);
  assert.equal(difference('60.00', '58.00'), '2.00');
});
