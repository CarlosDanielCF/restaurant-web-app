const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript'),
  fs = require('node:fs'),
  vm = require('node:vm');
const storage = new Map();
const sessionStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, v),
  removeItem: (k) => storage.delete(k)
};
const moduleScope = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('src/api/pendingOperation.ts', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText,
  {
    exports: moduleScope.exports,
    crypto: globalThis.crypto,
    sessionStorage,
    localStorage: { getItem: () => '' },
    Blob,
    FormData,
    TextEncoder,
    Uint8Array,
    atob
  }
);
const { pendingOperation, confirmOperation } = moduleScope.exports;
beforeEach(() => storage.clear());
test('A and retry A share key; B and confirmed next A get new keys', async () => {
  const a = await pendingOperation('r:u', 'pay', { amount: 10 });
  assert.equal(
    (await pendingOperation('r:u', 'pay', { amount: 10 })).key,
    a.key
  );
  assert.notEqual(
    (await pendingOperation('r:u', 'pay', { amount: 11 })).key,
    a.key
  );
  confirmOperation(a);
  assert.notEqual(
    (await pendingOperation('r:u', 'pay', { amount: 10 })).key,
    a.key
  );
});
test('concurrent double click shares key', async () => {
  const [a, b] = await Promise.all([
    pendingOperation('r:u', 'create', { x: 1 }),
    pendingOperation('r:u', 'create', { x: 1 })
  ]);
  assert.equal(a.key, b.key);
});
test('timeout/reconnect retains pending intent including changed expectedVersion', async () => {
  const a = await pendingOperation('r:u', 'add-order-detail', {
    x: 1,
    expectedVersion: 1
  });
  assert.equal(
    (
      await pendingOperation('r:u', 'add-order-detail', {
        expectedVersion: 2,
        x: 1
      })
    ).key,
    a.key
  );
});
test('tenant, user and operation isolated', async () => {
  const a = await pendingOperation('r:u', 'create-order', {});
  for (const [scope, op] of [
    ['other:u', 'create-order'],
    ['r:other', 'create-order'],
    ['r:u', 'add-order-detail']
  ])
    assert.notEqual((await pendingOperation(scope, op, {})).key, a.key);
});
test('multipart identity uses bytes, same metadata does not conflate images', async () => {
  const make = (v) => {
    const f = new FormData();
    f.append('file', new Blob([v], { type: 'image/png' }), 'logo.png');
    return f;
  };
  const a = await pendingOperation('r:u', 'logo', make('A'));
  assert.equal((await pendingOperation('r:u', 'logo', make('A'))).key, a.key);
  assert.notEqual(
    (await pendingOperation('r:u', 'logo', make('B'))).key,
    a.key
  );
});
test('late confirmation does not clear a newer operation', async () => {
  const a = await pendingOperation('r:u', 'create', {});
  confirmOperation(a);
  const b = await pendingOperation('r:u', 'create', {});
  confirmOperation(a);
  assert.equal((await pendingOperation('r:u', 'create', {})).key, b.key);
});
