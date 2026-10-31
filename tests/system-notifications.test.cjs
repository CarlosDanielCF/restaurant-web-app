/* eslint-env node */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const listeners = {};
let windows = [];
const shown = [];
const self = {
  location: { origin: 'https://puntomar.online' },
  addEventListener: (name, listener) => {
    listeners[name] = listener;
  },
  skipWaiting: async () => undefined,
  clients: {
    claim: async () => undefined,
    matchAll: async () => windows,
    openWindow: async () => undefined
  },
  registration: {
    showNotification: async (title, options) => shown.push({ title, options })
  }
};
vm.runInNewContext(fs.readFileSync('public/notification-sw.js', 'utf8'), {
  self,
  URL,
  console
});

async function push() {
  let task;
  listeners.push({
    data: {
      json: () => ({
        eventId: 'event-a',
        title: '✓ SALIÓ · Mesa 01',
        body: 'Comanda 123 · 1 × Ceviche',
        tag: 'event-a',
        url: '/attention?accountId=account-a'
      })
    },
    waitUntil: (promise) => {
      task = promise;
    }
  });
  await task;
}

(async () => {
  windows = [{ focused: true, visibilityState: 'visible' }];
  await push();
  assert.equal(shown.length, 0, 'visible app must suppress duplicate system push');

  windows = [];
  await push();
  assert.equal(shown.length, 1, 'closed app must display system push');
  assert.equal(shown[0].options.data.url, '/attention?accountId=account-a');
  console.log('system notification worker tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
