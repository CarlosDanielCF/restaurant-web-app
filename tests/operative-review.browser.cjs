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
    await call(owner, '/products', 'POST', {
      name: 'Café preparado UX',
      categoryId: category,
      kind: 'DRINK',
      productionRouting: 'PRODUCTION',
      price: 29,
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
    await tv.p.evaluate(() => {
      window.__tones = 0;
      const original = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function () {
        window.__tones++;
        return original.call(this);
      };
    });
    await tv.p.getByRole('button', { name: /Sonido desactivado/ }).click();
    await tv.p.getByRole('button', { name: 'Sonido activado' }).waitFor();
    assert.equal(
      await tv.p.evaluate(() => window.__tones),
      1,
      'user gesture plays test tone'
    );
    const free = b.p.getByRole('button', { name: /UX mesa 01 Disponible/ });
    assert.equal(
      await free.evaluate((e) => getComputedStyle(e).color),
      'rgb(22, 101, 52)'
    );
    await free.click();
    await b.p.getByText('Tomar pedido', { exact: true }).waitFor();
    await a.p
      .getByRole('button', { name: /UX mesa 01 Atención abierta/ })
      .waitFor();
    await a.p.waitForFunction(() => {
      const e = [...document.querySelectorAll('.quick-table')].find((e) =>
        e.textContent.includes('UX mesa 01')
      );
      return e && getComputedStyle(e).color === 'rgb(22, 101, 52)';
    });
    await b.p
      .getByRole('button', { name: 'Aumentar cantidad de Café preparado UX' })
      .click();
    const card = b.p
      .locator('.service-product')
      .filter({ hasText: 'Café preparado UX' });
    await card
      .getByRole('button', { name: 'Observación', exact: true })
      .click();
    await card
      .getByLabel('Instrucción para Café preparado UX')
      .fill('Sin ensalada');
    await b.p
      .getByRole('button', { name: 'Agregar Café preparado UX', exact: true })
      .click();
    await b.p
      .locator('.current-order-card')
      .getByText('Sin ensalada', { exact: true })
      .waitFor();
    let account = (await call(waiter.session, '/attention-accounts')).find(
      (x) => x.tables.some((t) => t.id === table.id)
    );
    assert.equal(account.lines.length, 1);
    assert.equal(Number(account.lines[0].quantity), 2);
    for (const [width, height] of [
      [1440, 900],
      [900, 1100],
      [390, 844]
    ]) {
      await b.p.setViewportSize({ width, height });
      if (width < 900)
        await b.p.getByRole('button', { name: /^Pedido actual ·/ }).click();
      await b.p
        .locator('[data-testid=app-content]')
        .evaluate((e) => e.scrollTo(0, 0));
      assert.ok(
        await b.p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      );
      await b.p.screenshot({
        path: path.join(output, `review-order-${width}.png`)
      });
      if (width < 900)
        await b.p
          .getByRole('button', { name: 'Productos', exact: true })
          .click();
    }
    await b.p.setViewportSize({ width: 1440, height: 900 });

    await b.p
      .getByRole('button', { name: 'Quitar una unidad de Café preparado UX' })
      .click();
    await b.p.getByRole('button', { name: 'Eliminar', exact: true }).waitFor();
    await b.p.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await b.p
      .locator('.current-order-card')
      .getByText('Sin ensalada', { exact: true })
      .waitFor({ state: 'hidden' });
    await b.p
      .getByRole('button', { name: 'Agregar Café preparado UX', exact: true })
      .click();
    await b.p
      .locator('.current-order-card')
      .getByText('Sin ensalada', { exact: true })
      .waitFor();
    await b.p
      .getByRole('button', { name: 'Seleccionar para llevar', exact: true })
      .click();
    await b.p.getByLabel('Café preparado UX · para llevar (de 2)').fill('1');
    await b.p
      .getByRole('button', { name: 'Aplicar selección', exact: true })
      .click();
    await b.p
      .getByRole('button', {
        name: 'Confirmar consumos y enviar a producción',
        exact: true
      })
      .click();
    await tv.p
      .locator('.kitchen-ticket')
      .getByText('2 × Café preparado UX', { exact: true })
      .waitFor();
    await mobile.p
      .locator('.kitchen-ticket')
      .getByText('2 × Café preparado UX', { exact: true })
      .waitFor();
    await tv.p.getByText('Para llevar: 1', { exact: true }).waitFor();
    await a.p.getByRole('button', { name: /UX mesa 01 Ocupada/ }).waitFor();
    await a.p.waitForFunction(() => {
      const e = [...document.querySelectorAll('.quick-table')].find((e) =>
        e.textContent.includes('UX mesa 01')
      );
      return e && getComputedStyle(e).color === 'rgb(153, 27, 27)';
    });
    await tv.p.waitForFunction(() => window.__tones === 2);
    await tv.p.evaluate(() => window.dispatchEvent(new Event('focus')));
    await tv.p.waitForTimeout(800);
    assert.equal(
      await tv.p.evaluate(() => window.__tones),
      2,
      'refresh silent'
    );
    await tv.context.setOffline(true);
    await tv.p.waitForTimeout(1200);
    await tv.context.setOffline(false);
    await tv.p
      .locator('.kitchen-operation')
      .getByText('Conectado', { exact: true })
      .waitFor();
    await tv.p.waitForTimeout(1000);
    assert.equal(
      await tv.p.evaluate(() => window.__tones),
      2,
      'reconnect does not replay old sounds'
    );
    await b.p.getByLabel('Unidades de Café preparado UX').fill('1');
    await b.p.getByRole('button', { name: '✓ Entregar', exact: true }).click();
    await tv.p
      .locator('.kitchen-ticket')
      .getByText('1 × Café preparado UX', { exact: true })
      .waitFor();
    await b.p.getByRole('button', { name: '✓ Entregar', exact: true }).click();
    await tv.p
      .getByText('0 pendientes · 0 visibles · 0 adicionales', { exact: true })
      .waitFor();
    await b.p.getByRole('link', { name: 'Cobrar S/ 58.00' }).click();
    await b.p
      .getByRole('dialog')
      .getByText('S/ 58.00', { exact: true })
      .waitFor();
    await b.p.getByRole('button', { name: 'Abrir turno y continuar' }).click();
    await b.p
      .getByRole('button', { name: 'Abrir turno y continuar' })
      .waitFor({ state: 'hidden' });
    await b.p.getByLabel('Importe recibido S/').fill('60');
    await b.p.getByText('Vuelto estimado: S/ 2.00', { exact: true }).waitFor();
    await b.p.getByRole('button', { name: 'Confirmar cobro manual' }).click();
    await b.p.getByRole('dialog').waitFor({ state: 'hidden' });
    account = await call(waiter.session, `/attention-accounts/${account.id}`);
    assert.equal(account.balance, '0.00');
    assert.equal(account.attentionStatus, 'OPEN');
    await a.p.getByRole('button', { name: /UX mesa 01 Ocupada/ }).click();
    await a.p.getByRole('button', { name: /^Pedido actual ·/ }).click();
    await a.p
      .getByRole('button', { name: 'Finalizar atención', exact: true })
      .click();
    await a.p.getByRole('button', { name: /UX mesa 01 Disponible/ }).waitFor();
    for (const [w, h] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ]) {
      await a.p.setViewportSize({ width: w, height: h });
      assert.ok(
        await a.p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      );
      await a.p.screenshot({
        path: path.join(output, `review-tables-${w}.png`)
      });
    }

    // Real mixed payment from contextual account: no negative balance accepted.
    let mixed = await call(
      waiter.session,
      '/attention-accounts/enter',
      'POST',
      { tableIds: [table.id] }
    );
    const prepared = (await call(owner, '/products')).find(
      (p) => p.name === 'Café preparado UX'
    );
    mixed = await call(
      waiter.session,
      `/attention-accounts/${mixed.id}/lines`,
      'POST',
      {
        expectedVersion: mixed.version,
        sourceType: 'PRODUCT',
        sourceId: prepared.id,
        quantity: 2
      }
    );
    await b.p.goto(`http://127.0.0.1:3030/finance?accountId=${mixed.id}&pay=1`);
    const dialog = b.p.getByRole('dialog');
    await dialog.waitFor();
    await dialog.getByText('Yape manual', { exact: true }).click();
    await dialog
      .getByText('Este restaurante aún no tiene QR Yape configurado.', {
        exact: true
      })
      .waitFor();
    assert.equal(await dialog.getByText(/Muestre este QR/).count(), 0);
    await dialog.getByText('Tarjeta / POS manual', { exact: true }).click();
    await dialog
      .getByRole('button', { name: 'Pago parcial o mixto', exact: true })
      .click();
    await dialog.getByLabel('Importe aplicado S/').fill('30.00');
    await dialog
      .getByRole('button', {
        name: 'Agregar método para pago mixto',
        exact: true
      })
      .click();
    const parts = dialog.locator('.payment-part');
    await parts.nth(1).getByLabel('Importe aplicado S/').fill('58.00');
    await parts.nth(1).getByLabel('Importe recibido S/').fill('60.00');
    await dialog.getByText(/Los importes aplicados superan el saldo/).waitFor();
    assert.equal(
      await dialog
        .getByRole('button', { name: 'Confirmar cobro manual', exact: true })
        .isEnabled(),
      false
    );
    await parts.nth(1).getByLabel('Importe aplicado S/').fill('28.00');
    await parts.nth(1).getByLabel('Importe recibido S/').fill('30.00');
    await dialog
      .getByText('Distribuido: S/ 58.00 · Restante: S/ 0.00', { exact: true })
      .waitFor();
    await dialog
      .getByText('Vuelto estimado: S/ 2.00', { exact: true })
      .waitFor();
    await dialog
      .getByRole('button', { name: 'Confirmar cobro manual', exact: true })
      .click();
    await dialog.waitFor({ state: 'hidden' });
    const finance = await call(waiter.session, `/finance/accounts/${mixed.id}`);
    assert.equal(finance.payments.length, 2);
    assert.equal(finance.account.balance, '0.00');
    assert.equal(finance.account.attentionStatus, 'OPEN');
    assert.equal(
      finance.payments.find((p) => p.method === 'CASH').changeAmount,
      '2.00'
    );

    // Administration upload UI and responsive original-image rendering for the waiter.
    const admin = await device(
      { username: owned.username, password: owned.password },
      { width: 1440, height: 900 },
      '/restaurant'
    );
    const sharp = require(path.join(backend, 'node_modules/sharp'));
    const qrFixture = await sharp({
      create: { width: 1000, height: 1000, channels: 3, background: '#123456' }
    })
      .png()
      .toBuffer();
    await admin.p
      .getByLabel('Imagen QR de Yape')
      .setInputFiles({
        name: 'fixture-qr.png',
        mimeType: 'image/png',
        buffer: qrFixture
      });
    await admin.p.getByAltText('Vista previa del nuevo QR').waitFor();
    await admin.p
      .getByRole('button', { name: 'Guardar QR de Yape', exact: true })
      .click();
    await admin.p
      .getByText('QR guardado sin modificar la imagen', { exact: true })
      .waitFor();
    mixed = await call(
      waiter.session,
      `/attention-accounts/${mixed.id}/lines`,
      'POST',
      {
        expectedVersion: finance.account.version,
        sourceType: 'PRODUCT',
        sourceId: prepared.id,
        quantity: 1
      }
    );
    await b.p.goto(`http://127.0.0.1:3030/finance?accountId=${mixed.id}&pay=1`);
    await b.p
      .getByRole('dialog')
      .getByText('Yape manual', { exact: true })
      .click();
    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ]) {
      await b.p.setViewportSize({ width, height });
      const img = b.p.getByAltText('QR original de Yape del restaurante');
      await img.waitFor();
      await b.p.waitForFunction(
        () =>
          document.querySelector(
            'img[alt="QR original de Yape del restaurante"]'
          )?.naturalWidth === 1000
      );
      const bounds = await img.boundingBox();
      assert.ok(bounds.width <= 300 && bounds.height <= 300);
      assert.ok(
        await b.p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      );
      assert.equal(
        await b.p
          .getByRole('button', { name: 'Confirmar cobro manual', exact: true })
          .isEnabled(),
        false
      );
      await b.p.screenshot({
        path: path.join(output, `review-qr-${width}.png`)
      });
    }
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        result: 'PASS',
        checks: [
          'table green/red',
          'quantity2 notes single line',
          'draft reduce/remove',
          'audio unlock/test/new/revalidation/reconnect',
          'partial/full exits',
          'context cash58 received60 change2',
          'shift quick open',
          'payment does not free table',
          'explicit close frees table',
          'responsive',
          'mixed30+28 remaining0 change2',
          'overpayment blocked',
          'no contradictory QR text',
          'admin QR upload preview/persistence',
          'QR responsive300px and manual confirmation'
        ],
        pageErrors: errors
      })
    );
  } finally {
    if (browser) await browser.close();
    if (owned) await owned.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
