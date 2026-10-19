/* eslint-disable no-inner-declarations -- Helpers use the isolated fixture and browser scope. */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
// Writes test records only through the API fixture of the disposable MySQL container.
// No imports of legacy DB fixtures, migrations or seeds; regular application ports refused.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fixture = JSON.parse(
  fs.readFileSync(
    process.env.SUPPLIES_FIXTURE || '/tmp/point-supplies-fixture.json',
    'utf8'
  )
);
const base = fixture.base;
const front = process.env.SUPPLIES_FRONTEND || 'http://127.0.0.1:3039';
assert.equal(new URL(base).port, '5019');
assert.equal(new URL(front).port, '3039');
const output = process.env.VISUAL_OUTPUT || '/tmp/point-observations-browser';
fs.mkdirSync(output, { recursive: true });
(async () => {
  let browser;
  const checks = [],
    errors = [],
    unexpected = [],
    confirms = [];
  const suffix = crypto.randomUUID().slice(0, 8);
  const owner = fixture.owner,
    waiter = fixture.waiter,
    cook = fixture.cook;
  async function api(
    url,
    method = 'GET',
    body,
    user = owner,
    key = crypto.randomUUID()
  ) {
    const response = await fetch(base + url, {
      method,
      headers: {
        Authorization: 'Bearer ' + user.token,
        'x-restaurant-id': fixture.tenant,
        'Content-Type': 'application/json',
        'Idempotency-Key': key
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const text = await response.text();
    assert.ok(response.ok, `${method} ${url}: ${response.status} ${text}`);
    return text ? JSON.parse(text) : undefined;
  }
  async function eventually(fn, message) {
    let last;
    for (let i = 0; i < 60; i++) {
      try {
        const value = await fn();
        if (value) return value;
      } catch (e) {
        last = e;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw last || new Error(message);
  }
  const accountFor = async (id) =>
    (await api('/attention-accounts')).find((a) =>
      a.tables.some((t) => t.id === id)
    );
  try {
    const section = await api('/sections', 'POST', {
      name: 'Browser observaciones ' + suffix
    });
    const category = await api('/categories', 'POST', {
      name: 'Observaciones ' + suffix,
      sectionId: section.id
    });
    async function product(name, routing, price) {
      await api('/products', 'POST', {
        name: name + ' ' + suffix,
        categoryId: category.id,
        price,
        kind: 'DRINK',
        productionRouting: routing
      });
      return (await api('/products')).find(
        (p) => p.name === name + ' ' + suffix
      );
    }
    const direct = await product('Agua prueba DIRECT', 'DIRECT', 5);
    const production = await product('Preparada prueba', 'PRODUCTION', 29);
    let stock = await api('/supplies/stocks/configure', 'POST', {
      productId: direct.id,
      optionId: 0,
      controlStock: true,
      factoryPackaged: true
    });
    stock = (
      await api(`/supplies/stocks/${stock.id}/opening`, 'POST', {
        quantity: 20,
        expectedVersion: stock.version,
        reason: 'Prueba aislada de navegador'
      })
    ).stock;
    const table = await api('/tables', 'POST', {
      name: 'Obs mesa ' + suffix,
      chairs: 4
    });
    const ownerTable = await api('/tables', 'POST', {
      name: 'Obs dueño ' + suffix,
      chairs: 4
    });
    const paymentTable = await api('/tables', 'POST', {
      name: 'Obs cobro ' + suffix,
      chairs: 4
    });
    browser = await chromium.launch({
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox']
    });
    async function device(user, width, height, route) {
      const context = await browser.newContext({ viewport: { width, height } });
      await context.addInitScript(
        (token) => localStorage.setItem('token', token),
        user.token
      );
      const page = await context.newPage();
      page.setDefaultTimeout(25000);
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('response', (r) => {
        if (r.url().includes('/api/') && [404, 409, 500].includes(r.status()))
          unexpected.push(`${r.status()} ${r.url()}`);
      });
      await page.goto(front + route);
      return { page, context };
    }
    const a = await device(waiter, 1440, 900, '/attention');
    const b = await device(waiter, 390, 844, '/attention');
    await a.page
      .getByRole('button', { name: new RegExp(table.name + ' Disponible') })
      .click();
    await a.page.getByText('Tomar pedido', { exact: true }).waitFor();
    assert.equal(
      await a.page.getByRole('dialog').count(),
      0,
      'waiter opens immediately without a responsible-selection dialog'
    );
    let account = await eventually(
      () => accountFor(table.id),
      'account created'
    );
    assert.equal(account.responsibleUserId, waiter.id);
    await b.page
      .getByRole('button', {
        name: new RegExp(table.name + '.*Atención abierta')
      })
      .waitFor();
    checks.push(
      'waiter opens directly with self as responsible; second context receives open table'
    );

    const card = a.page
      .locator('.service-product')
      .filter({ hasText: direct.name });
    await card
      .getByRole('button', { name: 'Aumentar cantidad de ' + direct.name })
      .click();
    await card
      .getByRole('button', { name: 'Aumentar cantidad de ' + direct.name })
      .click();
    await card
      .getByRole('button', { name: 'Observación', exact: true })
      .click();
    await card.getByLabel('Instrucción para ' + direct.name).fill('Sin hielo');
    await card
      .getByRole('button', { name: 'Agregar ' + direct.name, exact: true })
      .click();
    await a.page
      .locator('.current-order-card')
      .getByText('Sin hielo', { exact: true })
      .waitFor();
    await card.getByText('× 1', { exact: true }).waitFor();
    await card
      .getByRole('button', { name: 'Observación', exact: true })
      .click();
    assert.equal(
      await card.getByLabel('Instrucción para ' + direct.name).inputValue(),
      ''
    );
    account = await accountFor(table.id);
    assert.equal(Number(account.lines[0].quantity), 3);
    assert.equal(account.lines[0].notes, 'Sin hielo');
    checks.push(
      'quantity3 one line; capture resets to1 and blank note while line retains note'
    );

    assert.equal(
      await a.page.getByText(/No hay pantallas de cocina conectadas/).count(),
      0
    );
    await a.page.route(
      `**/api/attention-accounts/${account.id}/confirm`,
      async (route) => {
        confirms.push({
          body: route.request().postDataJSON(),
          key: route.request().headers()['idempotency-key']
        });
        await new Promise((resolve) => setTimeout(resolve, 650));
        await route.continue();
      }
    );
    const confirm = a.page.getByRole('button', {
      name: 'Confirmar pedido',
      exact: true
    });
    await confirm.click();
    await a.page.getByText('Enviando…', { exact: true }).waitFor();
    assert.equal(await confirm.isDisabled(), true);
    await a.page
      .getByRole('status')
      .filter({ hasText: 'Pedido confirmado' })
      .waitFor();
    account = await accountFor(table.id);
    assert.equal(confirms.length, 1);
    await api(
      `/attention-accounts/${account.id}/confirm`,
      'POST',
      confirms[0].body,
      waiter,
      confirms[0].key
    );
    const stockNow = (await api('/supplies/stocks?pageSize=100')).rows.find(
      (s) => s.id === stock.id
    );
    assert.equal(Number(stockNow.quantity), 17);
    assert.equal(
      (await api(`/attention-accounts/${account.id}/dispatches`)).length,
      0
    );
    await b.page
      .getByRole('button', { name: new RegExp(table.name + '.*Ocupada') })
      .waitFor();
    checks.push(
      'DIRECT-only confirms with visible Enviando/success, no kitchen warning/ticket, qty3 stock20→17; same-key replay does not deduct twice'
    );

    // Explicit recoverable network failure: no write reaches the server on first attempt.
    await a.page
      .getByRole('button', { name: 'Agregar ' + production.name, exact: true })
      .click();
    await a.page.unroute(`**/api/attention-accounts/${account.id}/confirm`);
    const retryKeys = [];
    await a.page.route(
      `**/api/attention-accounts/${account.id}/confirm`,
      async (route) => {
        retryKeys.push(route.request().headers()['idempotency-key']);
        if (retryKeys.length === 1) await route.abort('connectionreset');
        else await route.continue();
      }
    );
    const retryConfirm = a.page.getByRole('button', {
      name: 'Confirmar pedido y enviar a producción',
      exact: true
    });
    await retryConfirm.click();
    await a.page
      .getByText('Reintentar confirmación', { exact: true })
      .waitFor();
    await a.page
      .getByRole('status')
      .filter({ hasText: /Sin confirmación del servidor/ })
      .waitFor();
    await retryConfirm.click();
    await a.page
      .getByRole('status')
      .filter({ hasText: /Pedido confirmado|cocina/i })
      .waitFor();
    assert.equal(retryKeys.length, 2);
    assert.equal(retryKeys[0], retryKeys[1]);
    assert.equal(
      (await api(`/attention-accounts/${account.id}/dispatches`)).length,
      1
    );
    checks.push(
      'recoverable confirmation error is visible; explicit retry keeps identical key and creates one command'
    );

    const admin = await device(owner, 1440, 900, '/attention');
    await admin.page
      .getByRole('button', {
        name: new RegExp(ownerTable.name + ' Disponible')
      })
      .click();
    const opening = admin.page.getByRole('dialog');
    await opening.getByLabel('Responsable de atención').waitFor();
    await opening
      .getByRole('button', { name: 'Abrir atención', exact: true })
      .click();
    await opening.waitFor({ state: 'hidden' });
    let owned = await accountFor(ownerTable.id);
    assert.equal(owned.responsibleUserId, owner.id);
    checks.push(
      'owner opens attention directly assigned to self without waiter'
    );

    const ownerDirect = admin.page
      .locator('.service-product')
      .filter({ hasText: direct.name });
    await ownerDirect
      .getByRole('button', { name: 'Aumentar cantidad de ' + direct.name })
      .click();
    await ownerDirect
      .getByRole('button', { name: 'Aumentar cantidad de ' + direct.name })
      .click();
    await ownerDirect
      .getByRole('button', { name: 'Agregar ' + direct.name, exact: true })
      .click();
    await admin.page
      .locator('.current-order-card')
      .getByText(new RegExp(direct.name))
      .first()
      .waitFor();
    await admin.page
      .locator('.current-order-card')
      .getByText('Más opciones del producto', { exact: true })
      .click();
    await admin.page
      .getByRole('button', { name: 'Marcar como cortesía', exact: true })
      .click();
    const courtesy = admin.page.getByRole('dialog');
    await courtesy.getByLabel('Unidades de cortesía').fill('1');
    await courtesy
      .getByLabel('Motivo de cortesía')
      .fill('Atención al cliente en prueba aislada');
    await courtesy
      .getByRole('button', { name: 'Confirmar cortesía', exact: true })
      .click();
    await courtesy.waitFor({ state: 'hidden' });
    owned = await accountFor(ownerTable.id);
    assert.equal(owned.lines.filter((l) => l.kind === 'COURTESY').length, 1);
    assert.equal(
      Number(owned.lines.find((l) => l.kind === 'COURTESY').quantity),
      1
    );
    assert.equal(
      Number(owned.lines.find((l) => l.kind === 'COURTESY').appliedUnitPrice),
      0
    );
    assert.equal(
      Number(owned.lines.find((l) => l.kind === 'SALE').quantity),
      2
    );
    await admin.page
      .getByRole('button', { name: 'Agregar ' + production.name, exact: true })
      .click();
    await admin.page
      .getByRole('button', {
        name: 'Confirmar pedido y enviar a producción',
        exact: true
      })
      .click();
    await admin.page
      .getByRole('status')
      .filter({ hasText: /Pedido confirmado|cocina/i })
      .waitFor();
    owned = await accountFor(ownerTable.id);
    const dispatches = await api(`/attention-accounts/${owned.id}/dispatches`);
    assert.equal(dispatches.length, 1);
    assert.equal(dispatches[0].items.length, 1);
    assert.ok(Number(dispatches[0].commandNumber) > 0);
    assert.equal(
      Number(
        (await api('/supplies/stocks?pageSize=100')).rows.find(
          (s) => s.id === stock.id
        ).quantity
      ),
      14
    );
    const ledger = await api(
      `/supplies/movements?stockId=${stock.id}&pageSize=100`
    );
    assert.equal(
      ledger.rows.reduce((sum, row) => sum + Number(row.quantityDelta), 0),
      14
    );
    assert.equal(
      ledger.rows.filter(
        (row) => row.accountId === account.id && row.type === 'SALE'
      ).length,
      1
    );
    for (const row of ledger.rows)
      assert.equal(
        Number(row.stockBefore) + Number(row.quantityDelta),
        Number(row.stockAfter)
      );
    checks.push(
      'partial courtesy1/3 preserves original price and charges2; mixed DIRECT/PRODUCTION stock17→14 and only production kitchen item'
    );

    const kitchen = await device(cook, 1920, 1080, '/kitchen');
    async function findKitchenCommand() {
      await kitchen.page.locator('.kitchen-ticket').first().waitFor();
      await kitchen.page
        .getByRole('button', { name: 'Volver a las más antiguas' })
        .click();
      for (let n = 0; n < 50; n++) {
        if (
          await kitchen.page
            .locator('.kitchen-ticket')
            .getByText('Comanda ' + dispatches[0].commandNumber, {
              exact: true
            })
            .count()
        )
          return;
        const next = kitchen.page.getByRole('button', {
          name: 'Siguientes →',
          exact: true
        });
        assert.ok(
          await next.isEnabled(),
          'persisted command present in authoritative board'
        );
        await next.click();
      }
      assert.fail('command not reached');
    }
    await findKitchenCommand();
    await kitchen.page
      .locator('.kitchen-ticket')
      .getByText(new RegExp(production.name))
      .first()
      .waitFor();
    assert.equal(
      await kitchen.page
        .locator('.kitchen-ticket')
        .getByText(new RegExp(direct.name))
        .count(),
      0
    );
    assert.ok((await kitchen.page.locator('.kitchen-ticket').count()) <= 3);
    await kitchen.page.reload();
    await findKitchenCommand();
    await kitchen.context.setOffline(true);
    await kitchen.page.waitForTimeout(500);
    await kitchen.context.setOffline(false);
    await kitchen.page
      .locator('.kitchen-operation')
      .getByText('Conectado', { exact: true })
      .waitFor();
    await findKitchenCommand();
    checks.push(
      'production saved without kitchen; cook initial fetch/reload/reconnect recovers command with daily number, excludes DIRECT and max3 tickets'
    );

    // Proportional discount cancellation on a partial courtesy: real UI and new snapshot.
    const discountedProduct = await product(
      'Cortesía con descuento',
      'DIRECT',
      30
    );
    const discountedTable = await api('/tables', 'POST', {
      name: 'Obs descuento ' + suffix,
      chairs: 4
    });
    let discounted = await api('/attention-accounts/enter', 'POST', {
      tableIds: [discountedTable.id]
    });
    discounted = await api(
      `/attention-accounts/${discounted.id}/lines`,
      'POST',
      {
        expectedVersion: discounted.version,
        sourceType: 'PRODUCT',
        sourceId: discountedProduct.id,
        quantity: 2
      }
    );
    await api(`/attention-accounts/${discounted.id}/confirm`, 'POST', {
      expectedVersion: discounted.version
    });
    discounted = await api(`/attention-accounts/${discounted.id}`);
    await api(`/finance/accounts/${discounted.id}/discounts`, 'POST', {
      expectedVersion: discounted.version,
      lineId: discounted.lines[0].id,
      amount: '10.00',
      reason: 'Descuento previo proporcional browser'
    });
    discounted = await api(`/attention-accounts/${discounted.id}`);
    assert.equal(Number(discounted.total), 50);
    const oldDocument = await api(
      `/internal-documents/accounts/${discounted.id}`,
      'POST',
      {
        kind: 'ACCOUNT',
        expectedVersion: discounted.version
      }
    );
    const discountDevice = await device(owner, 1440, 900, '/attention');
    await discountDevice.page
      .getByRole('button', {
        name: new RegExp(discountedTable.name + '.*Ocupada')
      })
      .click();
    await discountDevice.page
      .locator('.current-order-card')
      .getByText('Más opciones del producto', { exact: true })
      .click();
    await discountDevice.page
      .getByRole('button', { name: 'Marcar como cortesía', exact: true })
      .click();
    const discountDialog = discountDevice.page.getByRole('dialog');
    await discountDialog.getByLabel('Unidades de cortesía').fill('1');
    await discountDialog
      .getByLabel('Motivo de cortesía')
      .fill('Cortesía parcial con anulación proporcional del descuento');
    await discountDialog
      .getByRole('button', { name: 'Confirmar cortesía', exact: true })
      .click();
    await discountDialog.waitFor({ state: 'hidden' });
    discounted = await api(`/attention-accounts/${discounted.id}`);
    assert.equal(Number(discounted.total), 25);
    assert.equal(Number(discounted.discountTotal), 5);
    assert.equal(
      Number(discounted.lines.find((line) => line.kind === 'SALE').quantity),
      1
    );
    assert.equal(
      Number(
        discounted.lines.find((line) => line.kind === 'COURTESY').quantity
      ),
      1
    );
    await discountDevice.page.goto(
      front + `/internal-documents?accountId=${discounted.id}`
    );
    await discountDevice.page
      .getByRole('button', { name: 'Emitir cuenta previa', exact: true })
      .click();
    const documentView = discountDevice.page.locator(
      '.pos-documents .internal-document'
    );
    await documentView.getByText(/inactivo; no reduce el total/).waitFor();
    await documentView
      .getByText('Total consumo: 25.00', { exact: true })
      .waitFor();
    await documentView.getByText(/Descuentos activos: 5.00/).waitFor();
    const historicalDocument = await api(
      `/internal-documents/${oldDocument.id}`
    );
    assert.equal(historicalDocument.sha256, oldDocument.sha256);
    assert.deepEqual(historicalDocument.snapshot, oldDocument.snapshot);
    await discountDevice.page.screenshot({
      path: `${output}/courtesy-discount-document.png`,
      fullPage: true
    });
    checks.push(
      'courtesy1/2 after discount60-10→30-5=25; new document labels inactive historical discount; earlier snapshot/hash unchanged'
    );

    // Existing payment flow through a waiter-owned account remains contextual.
    let payAccount = await api(
      '/attention-accounts/enter',
      'POST',
      { tableIds: [paymentTable.id] },
      waiter
    );
    payAccount = await api(
      `/attention-accounts/${payAccount.id}/lines`,
      'POST',
      {
        expectedVersion: payAccount.version,
        sourceType: 'PRODUCT',
        sourceId: production.id,
        quantity: 2
      },
      waiter
    );
    await a.page.goto(front + `/finance?accountId=${payAccount.id}&pay=1`);
    const pay = a.page.getByRole('dialog');
    await pay.waitFor();
    const shift = pay.getByRole('button', {
      name: 'Abrir turno y continuar',
      exact: true
    });
    if (await shift.count()) {
      await shift.click();
      await shift.waitFor({ state: 'hidden' });
    }
    await pay.getByLabel('Importe recibido S/').fill('60');
    await pay.getByText('Vuelto estimado: S/ 2.00', { exact: true }).waitFor();
    await pay
      .getByRole('button', { name: 'Confirmar cobro manual', exact: true })
      .click();
    await pay.waitFor({ state: 'hidden' });
    const finance = await api(
      `/finance/accounts/${payAccount.id}`,
      'GET',
      undefined,
      waiter
    );
    assert.equal(finance.account.balance, '0.00');
    assert.equal(finance.account.attentionStatus, 'OPEN');
    assert.equal(finance.payments[0].changeAmount, '2.00');
    checks.push(
      'contextual cash58 received60 change2; paid attention remains OPEN'
    );

    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ]) {
      await admin.page.setViewportSize({ width, height });
      if (width === 390)
        await admin.page
          .getByRole('button', { name: /^Pedido actual ·/ })
          .click();
      assert.equal(
        await admin.page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1
        ),
        false
      );
      await admin.page.screenshot({
        path: `${output}/order-${width}.png`,
        fullPage: true
      });
      if (width === 390)
        await admin.page
          .getByRole('button', { name: 'Productos', exact: true })
          .click();
    }
    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1920, 1080]
    ]) {
      await kitchen.page.setViewportSize({ width, height });
      assert.equal(
        await kitchen.page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1
        ),
        false
      );
      await kitchen.page.screenshot({
        path: `${output}/kitchen-${width}.png`,
        fullPage: true
      });
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
    console.log(
      JSON.stringify({
        checks,
        passed: checks.length,
        responsive: ['390x844', '900x1100', '1440x900', '1920x1080 kitchen'],
        jsErrors: errors,
        unexpectedHttp404409500: unexpected,
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
