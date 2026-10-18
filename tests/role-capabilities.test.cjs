/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const filename = path.resolve(__dirname, '../src/hooks/roleCapabilities.ts');
const moduleUnderTest = new Module(filename);
moduleUnderTest._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText,
  filename
);
const { permissionsForRole } = moduleUnderTest.exports;
test('worker restrictions display only the base waiter capabilities', () => {
  const keys = permissionsForRole('MOZO');
  assert.ok(keys.includes('finance') && keys.includes('attention'));
  for (const key of [
    'workers',
    'configuration',
    'catalog.manage',
    'kitchen',
    'tables.manage'
  ])
    assert.ok(!keys.includes(key));
});
test('cook sees kitchen/menu/availability/scoped reports, never finance or workers', () => {
  assert.deepEqual(permissionsForRole('COCINERO'), [
    'kitchen',
    'catalog.manage',
    'availability.manage',
    'reports'
  ]);
});
test('owner is not restrictable; unknown role gains nothing; admin has configured base scopes', () => {
  assert.deepEqual(permissionsForRole('DUENO'), []);
  assert.deepEqual(permissionsForRole('CASHIER'), []);
  assert.equal(permissionsForRole('ADMINISTRADOR').length, 14);
  const previous = permissionsForRole('MOZO');
  previous.push('workers');
  assert.ok(!permissionsForRole('MOZO').includes('workers'));
});
