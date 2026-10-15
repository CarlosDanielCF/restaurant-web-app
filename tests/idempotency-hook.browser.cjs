const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const b = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox']
  });
  try {
    const page = await b.newPage();
    await page.goto('http://127.0.0.1:3030/auth/login');
    const result = await page.evaluate(async () => {
      const { default: React } = await import(
        '/node_modules/.vite/deps/react.js'
      );
      const { default: ReactDOM } = await import(
        '/node_modules/.vite/deps/react-dom_client.js'
      );
      const { createRoot } = ReactDOM;
      const hookSource = await fetch(
        '/src/hooks/useEmitWebSocketsEvent.ts'
      ).then((r) => r.text());
      const contextPath = hookSource.match(
        /from "([^"]*context\/index.ts[^"]*)"/
      )[1];
      const { SocketContext } = await import(contextPath);
      const { useEmitWebSocketsEvent } = await import(
        '/src/hooks/useEmitWebSocketsEvent.ts'
      );
      const realTimeout = window.setTimeout;
      window.setTimeout = (fn, ms, ...args) =>
        realTimeout(fn, ms === 15000 ? 50 : ms, ...args);
      const pause = (ms) => new Promise((r) => realTimeout(r, ms));
      const out = [];
      let hook,
        online = true,
        event = 'create-order';
      const socket = {
        emit: (event, payload, ack) => out.push({ event, payload, ack })
      };
      const host = document.createElement('div');
      document.body.append(host);
      let root = createRoot(host);
      function Harness() {
        hook = useEmitWebSocketsEvent(event);
        return null;
      }
      const render = () =>
        root.render(
          React.createElement(
            SocketContext.Provider,
            { value: { socket, online } },
            React.createElement(Harness)
          )
        );
      render();
      await pause(30);
      await Promise.all([
        hook.mutate({ name: 'A' }),
        hook.mutate({ name: 'A' })
      ]);
      if (out.length !== 1)
        throw Error(
          'Double click emits=' + out.length + ' online=' + hook.isOnline
        );
      const keyA = out[0].payload.idempotencyKey;
      await pause(70);
      root.unmount();
      root = createRoot(host);
      render();
      await pause(30);
      await hook.mutate({ name: 'A' });
      if (out[1].payload.idempotencyKey !== keyA)
        throw Error('Remount retry identity');
      out[1].ack({ ok: true, data: {} });
      await hook.mutate({ name: 'B' });
      const keyB = out[2].payload.idempotencyKey;
      if (keyA === keyB) throw Error('New operation');
      await pause(70);
      online = false;
      render();
      await pause(20);
      await hook.mutate({ name: 'B' });
      if (out.length !== 3) throw Error('Offline emit');
      online = true;
      render();
      await pause(20);
      await hook.mutate({ name: 'B' });
      if (out[3].payload.idempotencyKey !== keyB)
        throw Error('Reconnect identity');
      out[3].ack({ ok: true, data: {} });
      event = 'add-order-detail';
      render();
      await pause(20);
      await hook.mutate({ orderId: 'one', quantity: 1 });
      const keyDetail = out[4].payload.idempotencyKey;
      await pause(70);
      await hook.mutate({ orderId: 'one', quantity: 1 });
      if (out[5].payload.idempotencyKey !== keyDetail)
        throw Error('Detail retry');
      out[5].ack({ ok: true, data: {} });
      root.unmount();
      host.remove();
      window.setTimeout = realTimeout;
      return out.length;
    });
    assert.equal(result, 6);
    console.log(
      'React hook: double click, timeout, remount, reconnect, A/retry A/B and add-order-detail keys passed.'
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
