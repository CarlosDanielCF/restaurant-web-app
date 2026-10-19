/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
// Browser reads and login/session recovery against the disposable HTTP fixture. No DB/seed runner.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fixture = JSON.parse(
  fs.readFileSync(
    process.env.SUPPLIES_FIXTURE || '/tmp/point-supplies-fixture.json',
    'utf8'
  )
);
assert.equal(new URL(fixture.base || 'http://127.0.0.1:5019/api').port, '5019');
const front = process.env.PERFORMANCE_FRONTEND || 'http://127.0.0.1:3043';
assert.ok(['3039', '3042', '3043'].includes(new URL(front).port));
const baseline = process.env.PERFORMANCE_BASELINE === '1';
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox']
  });
  const errors = [],
    failures = [];
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    await context.addInitScript(
      (token) => localStorage.setItem('token', token),
      fixture.owner.token
    );
    const page = await context.newPage();
    const requests = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => requests.push(r.url()));
    page.on('response', (r) => {
      if (new URL(r.url()).pathname.startsWith('/api/') && r.status() >= 400)
        failures.push([r.status(), r.url()]);
    });
    let release;
    const slowRead = new Promise((resolve) => {
      release = resolve;
    });
    await page.route('**/api/orders/actives*', async (route) => {
      await slowRead;
      await route.continue();
    });
    const start = Date.now();
    await page.goto(front + '/supplies');
    if (baseline) {
      await page
        .waitForRequest('**/api/orders/actives*', { timeout: 20000 })
        .catch(() => {
          assert.ok(
            requests.some((url) => url.includes('/api/orders/actives'))
          );
        });
      await page.waitForTimeout(1500);
      assert.equal(
        await page.locator('[data-testid="app-content"]').count(),
        0
      );
      assert.equal(
        await page
          .getByRole('heading', { name: 'Compras y bebidas', exact: true })
          .count(),
        0
      );
      release();
      await page
        .getByRole('heading', { name: 'Compras y bebidas', exact: true })
        .waitFor();
      console.log(
        JSON.stringify({
          baseline: true,
          heldLegacyReadBlocksWholeApp: true,
          readyMs: Date.now() - start
        })
      );
    } else {
      await page
        .getByRole('heading', { name: 'Compras y bebidas', exact: true })
        .waitFor();
      assert.equal(
        requests.some((url) =>
          /\/api\/(menu\/|production-areas|orders\/actives|tables(?:\?|$))/.test(
            url
          )
        ),
        false
      );
      assert.equal(
        requests.some((url) => url.includes('bell-ding.wav')),
        false
      );
      console.log(
        JSON.stringify({
          baseline: false,
          heldLegacyReadBlocksWholeApp: false,
          readyMs: Date.now() - start
        })
      );
      release();
      await page.goto(front + '/kitchen');
      await page.getByText('Cocina · comandas', { exact: true }).waitFor();
      assert.equal(
        requests.some((url) =>
          /\/api\/(menu\/|production-areas|orders\/actives|tables(?:\?|$))/.test(
            url
          )
        ),
        false
      );
      await page.goto(front + '/menu/products');
      await page
        .waitForResponse((response) =>
          new URL(response.url()).pathname.startsWith('/api/menu/')
        )
        .catch(() => {
          assert.ok(
            requests.some((url) =>
              new URL(url).pathname.startsWith('/api/menu/')
            )
          );
        });
      assert.ok(requests.some((url) => url.includes('/api/production-areas')));
      // A stalled route chunk must leave navigation available, not replace the whole app.
      const slowContext = await browser.newContext();
      await slowContext.addInitScript(
        (token) => localStorage.setItem('token', token),
        fixture.owner.token
      );
      const delayed = await slowContext.newPage();
      let releaseChunk;
      const chunk = new Promise((resolve) => {
        releaseChunk = resolve;
      });
      await delayed.route(
        '**/src/pages/Private/Supplies/SuppliesPage.tsx*',
        async (route) => {
          await chunk;
          await route.continue();
        }
      );
      try {
        await delayed.goto(front + '/supplies', {
          waitUntil: 'domcontentloaded'
        });
        await delayed.locator('[data-testid="app-content"]').waitFor();
        await delayed.getByText('Cargando sección…', { exact: true }).waitFor();
        assert.ok(await delayed.locator('.pos-header').isVisible());
      } finally {
        releaseChunk();
      }
      await delayed
        .getByRole('heading', { name: 'Compras y bebidas', exact: true })
        .waitFor();
      await slowContext.close();
      const authContext = await browser.newContext();
      await authContext.addInitScript(
        (token) => localStorage.setItem('token', token),
        fixture.owner.token
      );
      const recovery = await authContext.newPage();
      const authErrors = [];
      recovery.on('pageerror', (error) => authErrors.push(error.message));
      let unavailable = true,
        navigations = 0;
      recovery.on('framenavigated', (frame) => {
        if (frame === recovery.mainFrame()) navigations++;
      });
      await recovery.route('**/api/auth/auth-renew', (route) =>
        unavailable ? route.abort('connectionfailed') : route.continue()
      );
      await recovery.goto(front + '/supplies');
      await recovery
        .getByRole('button', { name: 'Reintentar verificación' })
        .waitFor();
      assert.equal(
        await recovery.evaluate(() => localStorage.getItem('token')),
        fixture.owner.token
      );
      const initialNavigations = navigations;
      unavailable = false;
      await recovery
        .getByRole('button', { name: 'Reintentar verificación' })
        .click();
      await recovery
        .getByRole('heading', { name: 'Compras y bebidas', exact: true })
        .waitFor();
      assert.equal(
        navigations,
        initialNavigations,
        'session retry must not reload the page'
      );
      assert.deepEqual(authErrors, []);
      await authContext.close();
      const loginContext = await browser.newContext();
      const loginPage = await loginContext.newPage();
      const loginErrors = [];
      loginPage.on('pageerror', (error) => loginErrors.push(error.message));
      await loginPage.goto(front + '/auth/login');
      await loginPage
        .locator('input[name=username]')
        .fill(fixture.owner.username);
      await loginPage.locator('input[name=password]').fill(fixture.password);
      await loginPage
        .getByRole('button', { name: 'Iniciar sesión', exact: true })
        .click();
      await loginPage
        .getByRole('heading', { name: 'Atención del restaurante', exact: true })
        .waitFor();
      assert.ok(await loginPage.evaluate(() => localStorage.getItem('token')));
      assert.deepEqual(loginErrors, []);
      await loginContext.close();
      console.log(
        '6 route-loading groups passed: independent operational reads, historical stores preserved, no legacy WAV request, visible navigation during lazy loading, real server session recovery after simulated network failure without logout/reload, credential login through the real form/API.'
      );
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, []);
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
