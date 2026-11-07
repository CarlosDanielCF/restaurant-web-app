/* eslint-env node */
const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  ts = require('typescript'),
  vm = require('node:vm');
const scope = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync('src/pages/Private/Insights/commandReport.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText,
  scope
);
const { commandStatus, commandTotals, commandType, paymentStatus } =
  scope.exports;

test('command totals add each account once and preserve partial balances', () => {
  const totals = commandTotals([
    { total: '120.50', paid: '70.50', balance: '50.00' },
    { total: '80.00', paid: '80.00', balance: '0.00' }
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(totals)), {
    total: 200.5,
    paid: 150.5,
    balance: 50
  });
});

test('command and payment states are presented in Spanish', () => {
  assert.equal(commandStatus('OPEN'), 'Abierta');
  assert.equal(commandStatus('CLOSED'), 'Cerrada');
  assert.equal(paymentStatus('SETTLED'), 'Pagado');
  assert.equal(paymentStatus('PARTIAL'), 'Parcial');
  assert.equal(paymentStatus('UNPAID'), 'Pendiente');
});

test('table, takeaway and delivery modalities use report labels', () => {
  assert.equal(commandType('TABLE'), 'Mesa');
  assert.equal(commandType('TAKE_AWAY'), 'Para llevar');
  assert.equal(commandType('OWN_DELIVERY'), 'Delivery');
  assert.equal(commandType('EXTERNAL_COURIER'), 'Delivery');
});
