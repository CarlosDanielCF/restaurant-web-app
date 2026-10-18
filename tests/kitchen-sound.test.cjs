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
    fs.readFileSync('src/pages/Private/Operations/kitchenSound.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText,
  { exports: exportsScope, Set }
);
const { KitchenSoundTracker, playKitchenTone } = exportsScope;
test('initial and reconnect snapshots are silent; dispatches and notices alert once', () => {
  const t = new KitchenSoundTracker();
  assert.equal(t.observe(['old'], ['old-notice']), false);
  assert.equal(t.observe(['old', 'new'], ['old-notice']), true);
  assert.equal(t.observe(['old', 'new'], ['old-notice']), false);
  assert.equal(t.observe(['old', 'new'], ['old-notice', 'change']), true);
  assert.equal(t.observe(['old', 'new'], ['old-notice', 'change']), false);
  t.reset();
  assert.equal(t.observe(['old', 'new', 'missed'], ['change']), false);
  assert.equal(t.observe(['new', 'missed', 'next'], ['change']), true);
});
test('tone invokes audio once only when running and disconnects nodes after ending', () => {
  let starts = 0,
    stops = 0,
    disconnects = 0;
  const oscillator = {
    frequency: { value: 0 },
    connect() {},
    disconnect() {
      disconnects++;
    },
    start() {
      starts++;
    },
    stop() {
      stops++;
    }
  };
  const gain = {
    gain: {
      setValueAtTime() {},
      linearRampToValueAtTime() {},
      exponentialRampToValueAtTime() {}
    },
    connect() {},
    disconnect() {
      disconnects++;
    }
  };
  const context = {
    state: 'suspended',
    currentTime: 0,
    createOscillator: () => oscillator,
    createGain: () => gain
  };
  assert.equal(playKitchenTone(context), false);
  assert.equal(starts, 0);
  context.state = 'running';
  assert.equal(playKitchenTone(context), true);
  assert.equal(starts, 1);
  assert.equal(stops, 1);
  oscillator.onended();
  assert.equal(disconnects, 2);
});

test('audio device failure does not interrupt kitchen data refresh', () => {
  assert.equal(
    playKitchenTone({
      state: 'running',
      createOscillator() {
        throw Error('audio unavailable');
      }
    }),
    false
  );
});
