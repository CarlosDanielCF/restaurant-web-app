/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

function runtime(file, context = {}) {
  let cursor = 0;
  const slots = [],
    cleanup = [];
  const exports = {};
  const react = {
    useContext: () => context.socketContext,
    useRef(value) {
      const i = cursor++;
      slots[i] ??= { current: value };
      return slots[i];
    },
    useState(value) {
      const i = cursor++;
      if (!(i in slots))
        slots[i] = typeof value === 'function' ? value() : value;
      return [
        slots[i],
        (next) => {
          slots[i] = typeof next === 'function' ? next(slots[i]) : next;
        }
      ];
    },
    useCallback: (fn) => fn,
    useEffect(effect, deps) {
      const i = cursor++;
      if (!slots[i] || deps.some((v, n) => slots[i][n] !== v)) {
        cleanup[i]?.();
        slots[i] = deps;
        cleanup[i] = effect();
      }
    }
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS }
    }).outputText,
    { exports, require: (key) => (key === 'react' ? react : {}), ...context }
  );
  return {
    exports,
    render(fn) {
      cursor = 0;
      return fn();
    },
    unmount() {
      cleanup.forEach((fn) => fn?.());
    }
  };
}

test('socket subscription uses latest callback and cleanup preserves other listeners', () => {
  const listeners = new Map();
  const socket = {
    on(event, fn) {
      const set = listeners.get(event) || new Set();
      set.add(fn);
      listeners.set(event, set);
    },
    off(event, fn) {
      assert.equal(typeof fn, 'function', 'must never remove all subscribers');
      listeners.get(event)?.delete(fn);
    }
  };
  let external = 0,
    before = 0,
    latest = 0;
  socket.on('changed', () => external++);
  const rt = runtime('src/hooks/useOnWebSocketsEvent.ts', {
    socketContext: { socket }
  });
  rt.render(() => rt.exports.useOnWebSocketsEvent('changed', () => before++));
  rt.render(() => rt.exports.useOnWebSocketsEvent('changed', () => latest++));
  for (const fn of listeners.get('changed')) fn({});
  assert.equal(before, 0);
  assert.equal(latest, 1);
  assert.equal(external, 1);
  rt.unmount();
  for (const fn of listeners.get('changed')) fn({});
  assert.equal(latest, 1);
  assert.equal(external, 2);
});

test('legacy notification sound has no asset request and synthesizes only after interaction', async () => {
  const preferences = new Map();
  const listeners = new Map();
  let constructors = 0,
    starts = 0,
    closed = 0;
  class AudioContext {
    constructor() {
      constructors++;
      this.state = 'suspended';
      this.currentTime = 0;
    }
    async resume() {
      this.state = 'running';
    }
    async close() {
      closed++;
      this.state = 'closed';
    }
    createOscillator() {
      return {
        frequency: {},
        connect() {},
        disconnect() {},
        start() {
          starts++;
        },
        stop() {}
      };
    }
    createGain() {
      return {
        connect() {},
        disconnect() {},
        gain: {
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {}
        }
      };
    }
  }
  const window = {
    AudioContext,
    addEventListener(name, fn) {
      listeners.set(name, fn);
    },
    removeEventListener(name) {
      listeners.delete(name);
    },
    dispatchEvent(event) {
      listeners.get(event.type)?.();
    }
  };
  const rt = runtime('src/hooks/useNotificationSound.ts', {
    window,
    Audio: class {
      constructor() {
        throw Error('No audio file should be requested');
      }
    },
    Event: class {
      constructor(type) {
        this.type = type;
      }
    },
    localStorage: {
      getItem: (key) => preferences.get(key),
      setItem: (key, value) => preferences.set(key, value)
    }
  });
  const hook = rt.render(() => rt.exports.useNotificationSound());
  assert.equal(constructors, 0);
  await hook.play();
  assert.equal(starts, 0);
  hook.setMute(false);
  await Promise.resolve();
  await hook.play();
  assert.equal(constructors, 1);
  assert.equal(starts, 2);
  hook.setMute(true);
  await hook.play();
  assert.equal(starts, 2);
  rt.unmount();
  assert.equal(closed, 1);
});
