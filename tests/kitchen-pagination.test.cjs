/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const { test } = require('node:test');
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  ts = require('typescript'),
  vm = require('node:vm');
const exportsScope = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(
      'src/pages/Private/Operations/kitchenPagination.ts',
      'utf8'
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText,
  { exports: exportsScope }
);

const { buildKitchenCards, kitchenCardPage } = exportsScope;

test('renders commands with 1, 3 and 10 dishes as exactly one card each', () => {
  const dispatches = [1, 3, 10].map((quantity) => ({
    id: `dispatch-${quantity}`,
    confirmedAt: `2026-01-01T00:0${quantity === 10 ? 9 : quantity}:00.000Z`,
    items: Array.from({ length: quantity }, (_, index) => ({
      id: `item-${quantity}-${index + 1}`,
      status: 'ACTIVE',
      pending: 1
    }))
  }));
  const cards = buildKitchenCards(dispatches);

  assert.equal(cards.length, 3);
  assert.deepEqual(Array.from(cards, (card) => card.items.length), [1, 3, 10]);
  assert.deepEqual(Array.from(cards, (card) => card.density), [
    'normal',
    'normal',
    'ultra-dense'
  ]);
  assert.ok(cards.every((card, index) => card.dispatch === dispatches[index]));
});

test('removes completed lines and the command when no pending dishes remain', () => {
  const dispatch = {
    id: 'dispatch-8',
    items: [
      { id: 'cancelled', status: 'CANCELLED', pending: 1 },
      { id: 'completed', status: 'ACTIVE', pending: 0 }
    ]
  };
  assert.equal(buildKitchenCards([dispatch]).length, 0);
});

test('keeps FIFO order and paginates only complete command cards', () => {
  const dispatches = ['new', 'old', 'middle'].map((id, index) => ({
    id,
    confirmedAt: [3, 1, 2][index],
    items: [{ id: `item-${id}`, status: 'ACTIVE', pending: 1 }]
  }));
  const cards = buildKitchenCards(dispatches);

  assert.deepEqual(Array.from(cards, (card) => card.dispatch.id), [
    'old',
    'middle',
    'new'
  ]);
  assert.deepEqual(
    Array.from(kitchenCardPage(cards, 1, 2), (card) => card.dispatch.id),
    ['new']
  );
});

test('partial output keeps one line until pending reaches zero', () => {
  const dispatch = {
    id: 'dispatch-partial',
    confirmedAt: '2026-01-01T00:00:00.000Z',
    items: [{ id: 'item', status: 'ACTIVE', pending: 2 }]
  };
  assert.equal(buildKitchenCards([dispatch])[0].items.length, 1);
  dispatch.items[0].pending = 0;
  assert.equal(buildKitchenCards([dispatch]).length, 0);
});

test('kitchen viewport and ticket grid explicitly prevent vertical scroll', () => {
  const css = fs.readFileSync(
    'src/pages/Private/Operations/cycle2.css',
    'utf8'
  );
  assert.match(css, /\.kitchen-operation\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.kitchen-operation \.pos-kds-tickets\s*\{[^}]*overflow:\s*hidden/s);
});

test('kitchen source keeps fullscreen and the compact output control visible', () => {
  const source = fs.readFileSync(
    'src/pages/Private/Operations/KitchenPage.tsx',
    'utf8'
  );
  assert.match(source, /⛶ FULLSCREEN/);
  assert.match(source, /title='Marcar salida'/);
  assert.match(source, /className='kitchen-exit-button'/);
  assert.match(source, /Salieron \{Number\(i\.kitchenExited\)\}/);
});
