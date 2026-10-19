/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
// Uses ONLY the disposable API fixture created by backend test/supplies-regression.ts.
// Never imports a DB, seed or migration runner; refuses the regular application port.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fixture = JSON.parse(
  fs.readFileSync(
    process.env.SUPPLIES_FIXTURE || '/tmp/point-supplies-fixture.json',
    'utf8'
  )
);
const base = fixture.base || 'http://127.0.0.1:5019/api';
const front = process.env.SUPPLIES_FRONTEND || 'http://127.0.0.1:3039';
assert.equal(new URL(base).port, '5019', 'Only the disposable API is allowed');
assert.equal(new URL(front).port, '3039', 'Use the isolated frontend instance');
const output = process.env.VISUAL_OUTPUT || '/tmp/point-supplies-browser';
fs.mkdirSync(output, { recursive: true });
(async () => {
  let browser;
  const errors = [],
    missing = [],
    checks = [];
  const tenant = fixture.tenant;
  async function api(url, method = 'GET', body) {
    const r = await fetch(base + url, {
      method,
      headers: {
        Authorization: 'Bearer ' + fixture.owner.token,
        'x-restaurant-id': tenant,
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID()
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const text = await r.text();
    assert.ok(r.ok, `${method} ${url}: ${r.status} ${text}`);
    return text ? JSON.parse(text) : undefined;
  }
  try {
    const suffix = crypto.randomUUID().slice(0, 8);
    const section = await api('/sections', 'POST', {
      name: 'Browser bebidas ' + suffix
    });
    const category = await api('/categories', 'POST', {
      name: 'Envasadas ' + suffix,
      sectionId: section.id
    });
    const name = 'Bebida browser ' + suffix;
    await api('/products', 'POST', {
      name,
      categoryId: category.id,
      price: 5,
      kind: 'DRINK',
      productionRouting: 'DIRECT'
    });
    browser = await chromium.launch({
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox']
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    await context.addInitScript(
      (token) => localStorage.setItem('token', token),
      fixture.owner.token
    );
    const page = await context.newPage();
    const marketPosts = [];
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/supplies/expenses'
      )
        marketPosts.push(request.postDataJSON());
    });
    page.setDefaultTimeout(25000);
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.url().includes('/api/') && r.status() === 404)
        missing.push(r.url());
    });
    await page.goto(front + '/supplies');
    await page
      .getByRole('heading', { name: 'Compras y bebidas', exact: true })
      .waitFor();
    await page
      .getByRole('button', { name: 'Configurar bebida', exact: true })
      .click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel('Buscar producto de la carta').fill(name);
    await dialog.getByRole('button', { name, exact: true }).click();
    await dialog.getByRole('checkbox').check();
    await dialog
      .getByRole('button', { name: 'Confirmar', exact: true })
      .click();
    await dialog.waitFor({ state: 'hidden' });
    await page.getByLabel('Buscar bebida', { exact: true }).fill(name);
    const card = page.locator('.supplies-stock').filter({ hasText: name });
    await card.waitFor();
    assert.match(await card.innerText(), /0.*unidades esperadas/s);
    await card.locator('summary').click();
    await card
      .getByRole('button', {
        name: 'Stock inicial (sin movimientos previos)',
        exact: true
      })
      .click();
    dialog = page.getByRole('dialog');
    await dialog.getByLabel('Cantidad de unidades').fill('10');
    await dialog
      .getByLabel('Motivo obligatorio')
      .fill('Conteo físico de prueba aislada');
    await dialog
      .getByRole('button', { name: 'Confirmar', exact: true })
      .click();
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(
      () =>
        document.querySelector('.supplies-stock-count')?.textContent === '10'
    );
    checks.push(
      'explicit configuration and audited opening; no fabricated units'
    );
    const keys = [];
    let loseResponse = true;
    await page.route('**/api/supplies/purchases', async (route) => {
      keys.push(route.request().headers()['idempotency-key']);
      if (loseResponse) {
        loseResponse = false;
        const response = await route.fetch();
        assert.ok(
          response.ok(),
          'purchase committed before simulated response loss'
        );
        await route.abort('connectionreset');
      } else await route.continue();
    });
    await card
      .getByRole('button', { name: 'Ingresar bebidas', exact: true })
      .click();
    dialog = page.getByRole('dialog');
    await dialog.getByLabel('Cantidad de unidades').fill('24');
    await dialog.getByLabel('Costo unitario', { exact: true }).fill('2.50');
    await dialog.getByText('S/ 60.00', { exact: true }).waitFor();
    await dialog
      .getByRole('button', { name: 'Registrar ingreso', exact: true })
      .click();
    await dialog.getByRole('alert').waitFor();
    await dialog
      .getByRole('button', { name: 'Registrar ingreso', exact: true })
      .click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(keys.length, 2);
    assert.equal(keys[0], keys[1]);
    await page.waitForFunction(
      () =>
        document.querySelector('.supplies-stock-count')?.textContent === '34'
    );
    checks.push(
      '24 x 2.50 = 60; response-loss retry retains key and stock34 not58'
    );
    await card
      .getByRole('button', { name: 'Registrar conteo físico', exact: true })
      .click();
    dialog = page.getByRole('dialog');
    await dialog.getByLabel('Unidades contadas físicamente').fill('32');
    assert.equal(
      await dialog
        .getByRole('button', { name: 'Confirmar', exact: true })
        .isEnabled(),
      false
    );
    await dialog
      .getByLabel('Motivo obligatorio')
      .fill('Diferencia de conteo físico');
    await dialog
      .getByRole('button', { name: 'Confirmar', exact: true })
      .click();
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(
      () =>
        document.querySelector('.supplies-stock-count')?.textContent === '32'
    );
    checks.push('count difference requires reason and preserves movement');
    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        document.querySelector('[data-testid=app-content]')?.scrollTo(0, 0);
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1
        ),
        false
      );
      await page.screenshot({
        path: `${output}/stock-${width}.png`,
        fullPage: true
      });
    }
    await page
      .getByRole('button', { name: 'Compras del día', exact: true })
      .click();
    for (const [amount, concept] of [
      ['500.00', 'Mercado browser ' + suffix],
      ['80.00', 'Adicional browser ' + suffix]
    ]) {
      await page
        .getByRole('button', {
          name: 'Registrar compra de mercado',
          exact: true
        })
        .click();
      dialog = page.getByRole('dialog');
      assert.equal(
        await dialog.getByLabel('Tipo de egreso', { exact: true }).count(),
        0
      );
      assert.equal(
        await dialog
          .getByText('Otro egreso operativo', { exact: true })
          .count(),
        0
      );
      await dialog.getByLabel('Monto', { exact: true }).fill(amount);
      await dialog.getByLabel('Concepto', { exact: true }).fill(concept);
      await dialog
        .getByRole('button', { name: 'Guardar compra', exact: true })
        .click();
      await dialog.waitFor({ state: 'hidden' });
      await page.getByRole('heading', { name: concept, exact: true }).waitFor();
    }
    assert.equal(marketPosts.length, 2);
    assert.ok(marketPosts.every((body) => body.category === 'MARKET'));
    checks.push(
      'multiple same-day MARKET-only entries, beverage expense is automatic only once'
    );
    await page.getByRole('button', { name: 'Kardex', exact: true }).click();
    await page
      .getByText('Anterior → posterior', { exact: true })
      .first()
      .waitFor();
    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        document.querySelector('[data-testid=app-content]')?.scrollTo(0, 0);
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1
        ),
        false
      );
      await page.screenshot({
        path: `${output}/kardex-${width}.png`,
        fullPage: true
      });
    }
    for (const [route, heading] of [
      ['/operational-overview', 'Resumen operativo'],
      ['/operational-reports', 'Centro de reportes']
    ]) {
      await page.goto(front + route);
      await page.getByRole('heading', { name: heading, exact: true }).waitFor();
      await page.waitForTimeout(600);
      assert.equal(
        await page.getByText('Otros egresos', { exact: true }).count(),
        0
      );
      assert.equal(
        await page
          .getByRole('alert')
          .filter({ hasText: /No se pudo|Error/ })
          .count(),
        0
      );
      for (const [width, height] of [
        [390, 844],
        [900, 1100],
        [1440, 900]
      ]) {
        await page.setViewportSize({ width, height });
        await page.evaluate(() => {
          window.scrollTo(0, 0);
          document.querySelector('[data-testid=app-content]')?.scrollTo(0, 0);
        });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1
          ),
          false
        );
        await page.screenshot({
          path: `${output}/${route.slice(1)}-${width}.png`,
          fullPage: true
        });
      }
    }
    await page.goto(front + '/operational-reports?kind=accounts');
    await page
      .getByRole('button', { name: 'Ver historial', exact: true })
      .first()
      .click();
    await page
      .getByRole('heading', {
        name: 'Historial completo de la cuenta',
        exact: true
      })
      .waitFor();
    await page
      .getByRole('button', { name: 'Cerrar historial', exact: true })
      .click();
    const downloadEvent = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Exportar CSV completo', exact: true })
      .click();
    const download = await downloadEvent;
    await download.saveAs(output + '/accounts.csv');
    assert.ok(fs.statSync(output + '/accounts.csv').size > 20);
    checks.push('account history and full filtered CSV download');
    await page.goto(front + '/operational-reports?kind=expenses');
    const expensesDownloadEvent = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Exportar CSV completo', exact: true })
      .click();
    const expensesDownload = await expensesDownloadEvent;
    await expensesDownload.saveAs(output + '/expenses.csv');
    const expenseCsv = fs.readFileSync(output + '/expenses.csv', 'utf8');
    assert.ok(expenseCsv.includes('MARKET'));
    assert.ok(expenseCsv.includes('BEVERAGE'));
    assert.equal(expenseCsv.includes('OTHER'), false);
    checks.push(
      'expense form, overview and filtered CSV expose only MARKET/BEVERAGE'
    );

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(front + '/kitchen');
    await page
      .locator('.kitchen-operation')
      .getByText('Cocina · comandas', { exact: true })
      .waitFor();
    await page.waitForTimeout(600);
    assert.ok((await page.locator('.kitchen-ticket').count()) <= 3);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1
      ),
      false
    );
    await page.screenshot({
      path: output + '/kitchen-1920.png',
      fullPage: true
    });
    for (const role of ['waiter', 'cook']) {
      const c = await browser.newContext();
      await c.addInitScript(
        (token) => localStorage.setItem('token', token),
        fixture[role].token
      );
      const p = await c.newPage();
      await p.goto(front + '/supplies');
      await p.getByText('Acceso no autorizado', { exact: true }).waitFor();
      await c.close();
    }
    checks.push('OWNER UI allowed, WAITER/COOK direct URLs denied');
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
    console.log(
      JSON.stringify({
        checks,
        responsive: ['390x844', '900x1100', '1440x900', '1920x1080 kitchen'],
        jsErrors: errors.length,
        api404: missing.length,
        screenshots: output
      })
    );
  } finally {
    if (browser) await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
