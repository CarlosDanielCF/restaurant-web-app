/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  ts = require('typescript'),
  vm = require('node:vm');
const scope = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(
      'src/pages/Private/Operations/serviceCatalogPrice.ts',
      'utf8'
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText,
  scope
);

test('uses the lowest valid active option instead of a zero base price', () => {
  const options = [
    { price: 0, isActive: true },
    { price: 35, isActive: true },
    { price: 60, isActive: true }
  ];
  assert.equal(scope.exports.serviceCatalogPrice(0, options), 'Desde S/ 35');
  assert.deepEqual(options.map((option) => option.price), [0, 35, 60]);
});

test('shows the exact price for a single active option and the base without options', () => {
  assert.equal(
    scope.exports.serviceCatalogPrice(0, [
      { price: 35, isActive: true },
      { price: 10, isActive: false }
    ]),
    'S/ 35'
  );
  assert.equal(scope.exports.serviceCatalogPrice(28, []), 'S/ 28');
});
