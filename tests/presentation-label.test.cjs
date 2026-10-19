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
      'src/pages/Private/Operations/presentationLabel.ts',
      'utf8'
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText,
  scope
);
test('pending variants have neutral labels without invented size; configured names unchanged', () => {
  const label = scope.exports.presentationLabel;
  assert.equal(label('Presentación A · nombre pendiente'), 'Opción 1');
  assert.equal(label('Presentación B · nombre pendiente'), 'Opción 2');
  assert.equal(label('Jarra de 1 litro'), 'Jarra de 1 litro');
  assert.equal(label('Nombre pendiente', 2), 'Opción 3');
});
