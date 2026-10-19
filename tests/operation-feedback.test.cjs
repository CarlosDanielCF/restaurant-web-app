/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  ts = require('typescript'),
  vm = require('node:vm');
const scope = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(
      'src/pages/Private/Operations/operationFeedback.ts',
      'utf8'
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText,
  { exports: scope, Map }
);

test('a late refresh cannot resurrect drafts after a confirmed server version', () => {
  const confirmed = { id: 'a', version: 4, lines: [{ confirmedQuantity: 3 }] };
  const stale = { id: 'a', version: 3, lines: [{ confirmedQuantity: 0 }] };
  assert.equal(scope.reconcileAccounts([confirmed], [stale])[0], confirmed);
  const changed = { id: 'a', version: 5, lines: [] };
  assert.equal(scope.reconcileAccounts([confirmed], [changed])[0], changed);
});

test('only active unconfirmed server-routed PRODUCTION lines need the kitchen', () => {
  const direct = {
    status: 'ACTIVE',
    confirmedQuantity: '0.000',
    requiresKitchen: false,
    productSnapshot: { name: 'Bebida' }
  };
  assert.equal(scope.requiresProduction([direct]), false);
  const preparedDrink = { ...direct, requiresKitchen: 1 };
  assert.equal(scope.requiresProduction([direct, preparedDrink]), true);
  assert.equal(
    scope.requiresProduction([
      { ...preparedDrink, confirmedQuantity: '3.000' }
    ]),
    false
  );
  assert.equal(
    scope.requiresProduction([{ ...preparedDrink, status: 'CANCELLED' }]),
    false
  );
});

test('daily command number wins over account sequence; legacy records remain identified', () => {
  assert.equal(
    scope.commandLabel({ commandNumber: 27, sequenceNumber: 2 }),
    'Comanda 27'
  );
  assert.equal(
    scope.commandLabel({ commandNumber: null, sequenceNumber: 2 }),
    'Comanda 2 · histórico'
  );
});
