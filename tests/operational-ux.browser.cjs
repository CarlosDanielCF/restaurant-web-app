/* eslint-disable no-inner-declarations -- Helpers share the isolated test fixture scope. */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('node:path'),
  assert = require('node:assert/strict'),
  fs = require('node:fs');
const backend = path.resolve(__dirname, '../../restaurant-backend');
process.chdir(backend);
require(path.join(backend, 'node_modules/ts-node')).register({
  project: path.join(backend, 'tsconfig.json')
});
const { fixture } = require(path.join(backend, 'test/fixture.ts'));
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  let owned, browser;
  const errors = [],
    output = process.env.VISUAL_OUTPUT || '/tmp/point-operational-ux';
  fs.mkdirSync(output, { recursive: true });
  try {
    owned = await fixture('opux');
    const base = 'http://127.0.0.1:5000/api';
    async function call(auth, url, method = 'GET', body) {
      const r = await fetch(base + url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(auth
            ? {
                Authorization: 'Bearer ' + auth.token,
                'x-restaurant-id': auth.currentRestaurant.id,
                'Idempotency-Key': crypto.randomUUID()
              }
            : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const d = await r.json();
      assert.ok(r.ok, `${method} ${url}: ${r.status} ${JSON.stringify(d)}`);
      return d;
    }
    const login = (username, password) =>
      call(null, '/auth/login', 'POST', { username, password });
    const owner = await login(owned.username, owned.password);
    async function worker(role) {
      const username = 'ux_' + crypto.randomUUID().replaceAll('-', '');
      const u = await call(owner, '/users', 'POST', {
        username,
        firstName: role,
        lastName: 'Prueba',
        email: username + '@example.test',
        rol: role,
        typeIdentification: 'CEDULA',
        numberIdentification: username.slice(-10)
      });
      owned.users.push(u.id);
      const link = await call(owner, '/auth/reset-password-user', 'PATCH', {
        userId: u.id
      });
      const password = 'WorkerPassword123!';
      await call(null, '/auth/reset-password', 'PATCH', {
        resetPasswordToken: link.recoveryUrl.split('/').pop(),
        password
      });
      return { username, password, session: await login(username, password) };
    }
    const waiter = await worker('MOZO'),
      cook = await worker('COCINERO');
    const category = (await call(owner, '/products'))[0].categoryId;
    const coffee = await call(owner, '/products', 'POST', {
      name: 'Café preparado UX',
      categoryId: category,
      kind: 'DRINK',
      productionRouting: 'PRODUCTION',
      price: 8,
      trackStock: true,
      quantity: 20
    });
    await call(owner, '/products', 'POST', {
      name: 'Agua directa UX',
      categoryId: category,
      kind: 'DRINK',
      productionRouting: 'DIRECT',
      price: 3
    });
    const table = await call(owner, '/tables', 'POST', {
      name: 'UX mesa 01',
      chairs: 4
    });
    for (let i = 2; i <= 24; i++)
      await call(owner, '/tables', 'POST', {
        name: `UX mesa ${String(i).padStart(2, '0')}`,
        chairs: 4
      });
    browser = await chromium.launch({
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox']
    });
    async function device(user, viewport, route) {
      const context = await browser.newContext({ viewport });
      const p = await context.newPage();
      p.setDefaultTimeout(15000);
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto('http://127.0.0.1:3030/auth/login');
      await p.locator('input[name=username]').fill(user.username);
      await p.locator('input[name=password]').fill(user.password);
      await p.locator('button[type=submit]').click();
      await p.waitForURL('**/attention');
      if (route) await p.goto('http://127.0.0.1:3030' + route);
      await p.locator('[data-testid=app-content]').waitFor();
      return { p, context };
    }
    const a = await device(waiter, { width: 390, height: 844 }),
      b = await device(waiter, { width: 1440, height: 900 });
    const tv = await device(cook, { width: 1920, height: 1080 }, '/kitchen'),
      mobile = await device(cook, { width: 390, height: 844 }, '/kitchen');
    let reloads = 0;
    for (const d of [a, b, tv, mobile])
      d.p.on('request', (r) => {
        if (r.isNavigationRequest() && r.frame() === d.p.mainFrame()) reloads++;
      });
    async function shot(p, name) {
      await p.waitForTimeout(300);
      const widths = await p.evaluate(() => [
        document.documentElement.scrollWidth,
        innerWidth
      ]);
      assert.ok(widths[0] <= widths[1] + 1, `${name} overflow ${widths}`);
      await p.screenshot({
        path: path.join(output, name + '.png'),
        fullPage: true
      });
    }
    for (const [w, h] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ]) {
      await b.p.setViewportSize({ width: w, height: h });
      await shot(b.p, 'tables-' + w);
    }
    await b.p.setViewportSize({ width: 1440, height: 900 });
    await a.p.getByRole('button', { name: /UX mesa 01 Disponible/ }).click();
    await a.p.getByText('Tomar pedido', { exact: true }).waitFor();
    let accounts = await call(waiter.session, '/attention-accounts');
    let account = accounts.find((x) => x.tables.some((t) => t.id === table.id));
    assert.equal(account.responsibleUserId, waiter.session.user.id);
    await b.p.getByRole('button', { name: /UX mesa 01 Ocupada/ }).waitFor();
    await b.p.getByRole('button', { name: /UX mesa 01 Ocupada/ }).click();
    await a.p
      .getByRole('button', { name: 'Agregar Café preparado UX', exact: true })
      .click();
    await b.p
      .locator('.current-order-card')
      .getByText(/Café preparado UX/).first()
      .waitFor();
    await a.p
      .getByRole('button', { name: 'Agregar Agua directa UX', exact: true })
      .click();
    await a.p.getByRole('button', {name:/^Pedido actual ·/}).click();
    await a.p
      .getByRole('button', {
        name: 'Confirmar consumos y enviar a producción',
        exact: true
      })
      .click();
    await tv.p
      .locator('.kitchen-ticket')
      .getByText(/Café preparado UX/).first()
      .waitFor();
    await mobile.p
      .locator('.kitchen-ticket')
      .getByText(/Café preparado UX/).first()
      .waitFor();
    assert.equal(
      await tv.p
        .locator('.kitchen-ticket')
        .getByText(/Agua directa UX/)
        .count(),
      0
    );
    account = await call(waiter.session, `/attention-accounts/${account.id}`);
    account = await call(
      waiter.session,
      `/attention-accounts/${account.id}/lines`,
      'POST',
      {
        expectedVersion: account.version,
        sourceType: 'PRODUCT',
        sourceId: coffee.id,
        quantity: 2,
        notes: 'Sin azúcar UX'
      }
    );
    await b.p
      .getByRole('button', {
        name: 'Confirmar consumos y enviar a producción',
        exact: true
      })
      .click();
    await tv.p.getByText('Sin azúcar UX', { exact: true }).first().waitFor();
    await mobile.p
      .getByText('Sin azúcar UX', { exact: true })
      .first()
      .waitFor();
    let ds = await call(
      waiter.session,
      `/attention-accounts/${account.id}/dispatches`
    );
    assert.equal(ds.length, 2);
    account = await call(waiter.session, `/attention-accounts/${account.id}`);
    const partial = await call(
      waiter.session,
      `/attention-accounts/${account.id}/dispatch-items/${ds[1].items[0].id}/exits`,
      'POST',
      { expectedVersion: account.version, quantity: 1 }
    );
    await tv.p.waitForFunction(
      () => document.querySelectorAll('.kitchen-ticket').length === 2
    );
    const updated = await call(
      waiter.session,
      `/attention-accounts/${account.id}/dispatches`
    );
    assert.equal(updated[1].items[0].pending, 1);
    await tv.p
      .locator('.kitchen-ticket')
      .filter({ hasText: 'Envío #2' })
      .getByText('1 × Café preparado UX', { exact: true })
      .waitFor();
    await mobile.p
      .locator('.kitchen-ticket')
      .filter({ hasText: 'Envío #2' })
      .getByText('1 × Café preparado UX', { exact: true })
      .waitFor();
    account = partial.account;
    await call(
      waiter.session,
      `/attention-accounts/${account.id}/lines/${account.lines[0].id}/cancel`,
      'POST',
      { expectedVersion: account.version, reason: 'Cancelación UX prueba' }
    );
    await tv.p
      .getByText(/Cancelación UX prueba/)
      .first()
      .waitFor();
    await mobile.p
      .getByText(/Cancelación UX prueba/)
      .first()
      .waitFor();
    account = await call(waiter.session, `/attention-accounts/${account.id}`);
    const noted = account.lines.find((l) => l.notes === 'Sin azúcar UX');
    await call(
      waiter.session,
      `/attention-accounts/${account.id}/lines/${noted.id}/notes`,
      'PATCH',
      {
        expectedVersion: account.version,
        notes: 'Sin azúcar y tibio UX',
        reason: 'Cliente precisa temperatura'
      }
    );
    await tv.p
      .getByText('Sin azúcar y tibio UX', { exact: true })
      .first()
      .waitFor();
    await mobile.p
      .getByText('Sin azúcar y tibio UX', { exact: true })
      .first()
      .waitFor();
    for (let i = 0; i < 3; i++) {
      account = await call(waiter.session, `/attention-accounts/${account.id}`);
      account = await call(
        waiter.session,
        `/attention-accounts/${account.id}/lines`,
        'POST',
        {
          expectedVersion: account.version,
          sourceType: 'PRODUCT',
          sourceId: coffee.id,
          quantity: 1,
          notes: 'Adicional UX ' + i
        }
      );
      await call(
        waiter.session,
        `/attention-accounts/${account.id}/confirm`,
        'POST',
        { expectedVersion: account.version }
      );
    }
    await tv.p.waitForFunction(
      () => document.querySelectorAll('.kitchen-ticket').length === 3
    );
    for (const n of [2, 3, 4])
      await tv.p
        .locator('.kitchen-ticket')
        .getByText('Envío #' + n, { exact: true })
        .waitFor();
    const current = await call(owner, `/products/${coffee.id}`);
    await call(cook.session, `/products/${coffee.id}`, 'PATCH', {
      expectedVersion: current.version,
      status: 'OUT_OF_STOCK'
    });
    await a.p.waitForFunction(() =>
      [...document.querySelectorAll('button')].some(
        (x) =>
          x.getAttribute('aria-label') === 'Agregar Café preparado UX' &&
          x.disabled
      )
    );
    await b.p.waitForFunction(() =>
      [...document.querySelectorAll('button')].some(
        (x) =>
          x.getAttribute('aria-label') === 'Agregar Café preparado UX' &&
          x.disabled
      )
    );
    await mobile.context.setOffline(true);
    await mobile.p.waitForTimeout(1500);
    await mobile.context.setOffline(false);
    await mobile.p
      .locator('.MuiChip-label')
      .filter({ hasText: /^Conectado$/ })
      .first()
      .waitFor();
    await shot(a.p, 'waiter-order-390');
    await shot(tv.p, 'kitchen-1920');
    await shot(mobile.p, 'kitchen-390');
    assert.ok((await tv.p.locator('.kitchen-ticket').count()) <= 3);
    const workerData = await call(owner, `/users/${waiter.session.user.id}`);
    await call(owner, `/users/${waiter.session.user.id}/permissions`, 'PATCH', {
      expectedVersion: workerData.version,
      deniedPermissions: ['history']
    });
    await b.p
      .getByRole('link', { name: 'Pedidos históricos', exact: true })
      .waitFor({ state: 'hidden' });
    assert.equal(reloads, 0, 'No full document reload while operating');
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify(
        {
          result: 'PASS',
          devices: 4,
          reloads,
          pageErrors: errors,
          checks: [
            'automatic responsible',
            'occupied account recovered',
            'quick add',
            'prepared drink only',
            'addition without refresh',
            'cancellation both screens',
            'partial exit persisted',
            'availability both waiters',
            'reconnection',
            'responsive 390/900/1440/1920'
          ]
        },
        null,
        2
      )
    );
  } finally {
    if (browser) await browser.close();
    if (owned) await owned.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
