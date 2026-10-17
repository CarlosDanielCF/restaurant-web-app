/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const catalog = JSON.parse(
  fs.readFileSync(
    path.resolve(
      __dirname,
      '../../restaurant-backend/scripts/punto-mar/catalog.json'
    ),
    'utf8'
  )
);
const password = process.env.PUNTO_MAR_PASSWORD;
if (!password) throw Error('PUNTO_MAR_PASSWORD requerido, nunca registrado');
const base = 'http://127.0.0.1:5000/api';
async function call(session, url, method = 'GET', body) {
  const r = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session
        ? {
            Authorization: 'Bearer ' + session.token,
            'x-restaurant-id': session.currentRestaurant.id,
            'Idempotency-Key': crypto.randomUUID()
          }
        : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const d = await r.json();
  assert.ok(r.ok, `${url}: ${r.status} ${JSON.stringify(d)}`);
  return d;
}
(async () => {
  let browser, accountId, waiter;
  const errors = [];
  try {
    const owner = await call(null, '/auth/login', 'POST', {
      username: 'punto_mar_owner',
      password
    });
    waiter = await call(null, '/auth/login', 'POST', {
      username: 'punto_mar_waiter',
      password
    });
    const restaurant = await call(owner, '/restaurant');
    assert.equal(restaurant.name, 'Punto Mar');
    assert.equal(restaurant.tradeName, 'Punto Mar Restaurante & Cevichería');
    const products = await call(owner, '/products');
    assert.equal(products.length, 62);
    assert.equal(new Set(products.map((p) => p.category.name)).size, 11);
    for (const expected of catalog.products) {
      const p = products.find((p) => p.name === expected.name);
      assert.ok(p, expected.name);
      assert.equal(p.category.name, expected.category);
      assert.equal(Number(p.price), expected.courtesy ? 0 : expected.prices[0]);
      assert.equal(p.productionRouting, expected.routing);
      assert.equal(p.configuration.courtesy, expected.courtesy);
      assert.equal(p.status, 'AVAILABLE');
      if (expected.prices.length === 2) {
        assert.deepEqual(
          p.options.map((o) => Number(o.price)).sort((a, b) => a - b),
          expected.prices
        );
        assert.ok(p.options.every((o) => o.name.includes('nombre pendiente')));
      }
    }
    const logo = await fetch(base + restaurant.logo.replace(/^\/api/, ''), {
      headers: {
        Authorization: 'Bearer ' + owner.token,
        'x-restaurant-id': restaurant.id
      }
    });
    assert.equal(logo.status, 200);
    assert.equal(logo.headers.get('content-type'), 'image/webp');
    const old = await call(null, '/auth/login', 'POST', {
      username: 'demo_f10_owner',
      password
    });
    assert.notEqual(old.currentRestaurant.id, restaurant.id);
    const blocked = await fetch(base + restaurant.logo.replace(/^\/api/, ''), {
      headers: {
        Authorization: 'Bearer ' + old.token,
        'x-restaurant-id': old.currentRestaurant.id
      }
    });
    assert.equal(blocked.status, 404);
    browser = await chromium.launch({
      executablePath: '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 }
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:3030/auth/login');
    await page.locator('input[name=username]').fill('punto_mar_waiter');
    await page.locator('input[name=password]').fill(password);
    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();
    await page.waitForURL('**/attention');
    await page.getByRole('button', { name: /Mesa 24.*Disponible/ }).click();
    await page.getByRole('heading', { name: 'Carta · Punto Mar' }).waitFor();
    let accounts = await call(waiter, '/attention-accounts');
    accountId = accounts.find(
      (a) =>
        a.attentionStatus === 'OPEN' &&
        a.tables.some((t) => t.name === 'Mesa 24')
    ).id;
    await page.getByLabel('Buscar producto', { exact: true }).fill('chau');
    assert.equal(await page.locator('.service-product').count(), 2);
    await page
      .getByLabel('Buscar producto', { exact: true })
      .fill('Ceviche Punto Mar');
    await page
      .getByRole('button', { name: 'Agregar Ceviche Punto Mar', exact: true })
      .click();
    await page
      .getByRole('button', {
        name: 'Presentación B · nombre pendiente · S/ 60',
        exact: true
      })
      .click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    for (const name of [
      'Agua mineral',
      'Maracuyá (1 litro)',
      'Porción de cancha'
    ]) {
      await page.getByLabel('Buscar producto', { exact: true }).fill(name);
      const done = page.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().endsWith('/lines')
      );
      await page
        .getByRole('button', { name: 'Agregar ' + name, exact: true })
        .click();
      assert.ok((await done).ok());
      await page.waitForTimeout(300);
    }
    const before = (await call(waiter, '/attention-accounts')).find(
      (a) => a.id === accountId
    );
    assert.equal(Number(before.total), 77);
    assert.equal(
      before.lines.find((l) => l.productSnapshot.name === 'Porción de cancha')
        .kind,
      'COURTESY'
    );
    const cookPage = await browser.newPage({
      viewport: { width: 1920, height: 1080 }
    });
    cookPage.on('pageerror', (e) => errors.push(e.message));
    await cookPage.goto('http://127.0.0.1:3030/auth/login');
    await cookPage.locator('input[name=username]').fill('punto_mar_cook');
    await cookPage.locator('input[name=password]').fill(password);
    await cookPage
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();
    await cookPage.waitForURL('**/attention');
    await cookPage.goto('http://127.0.0.1:3030/kitchen');
    await page
      .getByRole('button', {
        name: 'Confirmar consumos y enviar a producción',
        exact: true
      })
      .click();
    await cookPage
      .getByText(/Ceviche Punto Mar/)
      .first()
      .waitFor();
    await cookPage
      .getByText(/Maracuyá \(1 litro\)/)
      .first()
      .waitFor();
    assert.equal(await cookPage.getByText(/Agua mineral/).count(), 0);
    fs.mkdirSync('/workspace/cloud-setup/punto-mar', { recursive: true });
    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ]) {
      await page.setViewportSize({ width, height });
      await page.getByLabel('Buscar producto', { exact: true }).fill('');
      await page
        .getByRole('heading', { name: 'Carta · Punto Mar' })
        .scrollIntoViewIfNeeded();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 2
        )
      );
      await page.screenshot({
        path: `/workspace/cloud-setup/punto-mar/catalog-${width}.png`
      });
    }
    await cookPage.screenshot({
      path: '/workspace/cloud-setup/punto-mar/kitchen-1920.png'
    });
    assert.deepEqual(errors, []);
    console.log(
      'PASS: 62 products/prices, 11 categories, 9 presentations, 4 courtesies, logo isolation, Punto Mar independent, search chau, table → catalog, presentation B, direct water, production maracuya, courtesy, total 77, kitchen realtime, responsive 390/900/1440/1920, zero JS exceptions.'
    );
  } finally {
    if (browser) await browser.close();
    if (accountId && waiter) {
      let a = (await call(waiter, '/attention-accounts')).find(
        (a) => a.id === accountId
      );
      for (const line of a.lines.filter((l) => l.status === 'ACTIVE')) {
        await call(
          waiter,
          `/attention-accounts/${accountId}/lines/${line.id}/cancel`,
          'POST',
          {
            expectedVersion: a.version,
            reason:
              'Fin de prueba de presentación Punto Mar; no se preparó consumo real'
          }
        );
        a = (await call(waiter, '/attention-accounts')).find(
          (a) => a.id === accountId
        );
      }
      await call(waiter, `/attention-accounts/${accountId}/close`, 'POST', {
        expectedVersion: a.version,
        mode: 'END_ATTENTION',
        reason: 'Prueba Punto Mar terminada, consumos cancelados'
      });
    }
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
