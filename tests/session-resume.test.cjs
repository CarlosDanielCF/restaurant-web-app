const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('passive resume coalesces but permission changes and failed-check retries remain immediate', async () => {
  const listeners = new Map();
  const storage = new Map([['token', 'initial']]);
  let calls = 0, fail = false, cleanup;
  const events = {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
    dispatchEvent: event => listeners.get(event.type)?.()
  };
  const exports = {};
  const renewToken = async () => {
    calls++;
    if (fail) throw { status: 503 };
    return { token: `token-${calls}`, currentRestaurant: { id: 'r' }, user: { restaurantRoles: [{ restaurant: { id: 'r' }, role: { name: 'MOZO' } }] } };
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/pages/Public/Auth/hooks/useAuth.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText, {
    exports, Date, Event, window: events,
    document: { ...events, visibilityState: 'visible' },
    localStorage: { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) },
    setInterval: () => 1, clearInterval: () => {},
    require: name => {
      if (name === 'react') return { useEffect: effect => { cleanup = effect(); } };
      if (name === 'react-redux') return { useDispatch: () => () => {} };
      if (name.includes('restaurantStore')) return { useRestaurantStore: () => ({ setRestaurant: () => {} }) };
      if (name === '@/redux') return { onLogin: x => x, onLogout: x => x };
      if (name.includes('auth.service')) return { renewToken };
      return {};
    }
  });
  const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
  exports.useRenewToken(); await settle();
  assert.equal(calls, 1);
  listeners.get('focus')(); listeners.get('visibilitychange')(); await settle();
  assert.equal(calls, 1, 'passive duplicate checks are suppressed');
  listeners.get('worker-access-changed')(); await settle();
  assert.equal(calls, 2, 'permission changes bypass passive throttle');
  fail = true;
  listeners.get('session-renew-request')(); await settle();
  assert.equal(calls, 3);
  fail = false;
  listeners.get('session-renew-request')(); await settle();
  assert.equal(calls, 4, 'explicit recovery is not blocked for 30 seconds');
  cleanup();
  assert.equal(listeners.size, 0);
});
