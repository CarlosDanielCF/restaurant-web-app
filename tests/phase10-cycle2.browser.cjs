const path = require('node:path'),
  assert = require('node:assert/strict');
const backend = path.resolve(__dirname, '../../restaurant-backend');
process.chdir(backend);
require(path.join(backend, 'node_modules/ts-node')).register({
  project: path.join(backend, 'tsconfig.json')
});
const { fixture } = require(path.join(backend, 'test/fixture.ts'));
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  let owned, browser;
  try {
    owned = await fixture('phase10_cycle2');
    const base = 'http://127.0.0.1:5000/api';
    let auth;
    const req = async (url, method = 'GET', body) => {
      const r = await fetch(base + url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(auth
            ? {
                Authorization: `Bearer ${auth.token}`,
                'x-restaurant-id': auth.currentRestaurant.id,
                'Idempotency-Key': crypto.randomUUID()
              }
            : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const data = await r.json();
      assert.ok(r.ok, `${url}: ${JSON.stringify(data)}`);
      return data;
    };
    auth = await req('/auth/login', 'POST', {
      username: owned.username,
      password: owned.password
    });
    const section = await req('/sections', 'POST', { name: 'F10 carta' });
    const category = await req('/categories', 'POST', {
      name: 'Platos F10',
      sectionId: section.id
    });
    await req('/products', 'POST', {
      name: 'Arroz F10',
      categoryId: category.id,
      price: 20,
      kind: 'FOOD'
    });
    // Fixture owner is not a waiter. Create a worker using the existing F1 contract.
    const worker = await req('/users', 'POST', {
      firstName: 'Mozo',
      lastName: 'F10',
      username: 'p10_' + Date.now(),
      email: `p10_${Date.now()}@example.test`,
      rol: 'MOZO',
      typeIdentification: 'CEDULA',
      numberIdentification: crypto.randomUUID().slice(0, 10)
    });
    owned.users.push(worker.id);
    const table = await req('/tables', 'POST', { name: 'F10 01', chairs: 4 });
    let account = await req('/attention-accounts', 'POST', {
      modality: 'TABLE',
      tableIds: [table.id],
      responsibleUserId: worker.id
    });
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 }
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:3030/auth/login');
    await page.getByLabel('Nombre de usuario').fill(owned.username);
    await page.locator('input[name=password]').fill(owned.password);
    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();
    await page.waitForURL('**/attention');
    await req('/tables', 'POST', { name: 'F10 libre', chairs: 4 });
    for (let number = 3; number <= 18; number++) {
      await req('/tables', 'POST', { name: `Mesa ${number}`, chairs: 4 });
    }
    await page
      .getByRole('button', { name: 'Actualizar datos', exact: true })
      .click();
    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ]) {
      await page.setViewportSize({ width, height });
      const available = page.getByLabel('F10 libre · Libre', { exact: true });
      await available.check();
      assert.equal(
        await page.getByLabel('F10 01 · Ocupada', { exact: true }).isDisabled(),
        true
      );
      await page
        .getByText('Disponible · Seleccionada', { exact: true })
        .waitFor();
      assert.equal(
        await page.evaluate(() => {
          const main = document.querySelector('[data-testid=app-content]');
          return (
            main.scrollWidth > main.clientWidth + 2 ||
            document.documentElement.scrollWidth > innerWidth + 2
          );
        }),
        false
      );
      await page
        .locator('[data-testid=app-content]')
        .evaluate((el) => el.scrollTo(0, 0));
      await page.screenshot({
        path: `/workspace/cloud-setup/f10-cycle1-open-${width}.png`
      });
      await available.uncheck();
    }

    await page
      .getByRole('button', { name: 'Ver cuenta F10 01', exact: true })
      .click();
    const mutation = async (suffix, action) => {
      const response = page.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().endsWith(suffix)
      );
      await action();
      const r = await response;
      assert.ok(r.ok(), await r.text());
      await page
        .getByRole('button', { name: 'Actualizar datos', exact: true })
        .waitFor();
    };
    for (const [index, note] of ['Sin cebolla', 'Con cebolla'].entries()) {
      await page.getByLabel('Buscar producto', { exact: true }).fill('Arroz');
      await page
        .getByRole('button', { name: 'Agregar Arroz F10', exact: true })
        .click();
      await page.getByLabel('Observaciones por plato').fill(note);
      await mutation(`/attention-accounts/${account.id}/lines`, () =>
        page
          .getByRole('button', { name: 'Agregar consumo', exact: true })
          .click()
      );
      // Wait for the authoritative refresh before confirming.
      await page.getByText(note, { exact: true }).first().waitFor();
      await mutation(`/attention-accounts/${account.id}/confirm`, () =>
        page
          .getByRole('button', {
            name: 'Confirmar consumos nuevos y enviar comida'
          })
          .click()
      );
      account = (await req('/attention-accounts')).find(
        (a) => a.id === account.id
      );
      assert.equal(account.lines.length, index + 1);
      assert.equal(account.attentionStatus, 'OPEN');
      assert.equal(account.tables[0].id, table.id);
      assert.equal(Number(account.total), 20 * (index + 1));
    }
    assert.deepEqual(account.lines.map((l) => l.notes).sort(), [
      'Con cebolla',
      'Sin cebolla'
    ]);
    const dispatches = await req(
      `/attention-accounts/${account.id}/dispatches`
    );
    assert.equal(dispatches.length, 2);
    assert.ok(dispatches.every((d) => d.items.length === 1));
    for (let i = 0; i < 2; i++) {
      let extra = await req('/attention-accounts', 'POST', {
        modality: 'TAKE_AWAY',
        tableIds: [],
        responsibleUserId: worker.id
      });
      extra = await req(`/attention-accounts/${extra.id}/lines`, 'POST', {
        expectedVersion: extra.version,
        sourceType: 'PRODUCT',
        sourceId: account.lines[0].sourceId,
        quantity: 1
      });
      await req(`/attention-accounts/${extra.id}/confirm`, 'POST', {
        expectedVersion: extra.version
      });
    }
    const kitchenContext = await browser.newContext({
      storageState: await page.context().storageState()
    });
    const kitchen = await kitchenContext.newPage();
    kitchen.on('pageerror', (e) => errors.push(e.message));
    await kitchen.setViewportSize({ width: 1920, height: 1080 });
    await kitchen.goto('http://127.0.0.1:3030/kitchen');
    await kitchen.locator('.kitchen-ticket').first().waitFor();
    assert.equal(await kitchen.locator('.kitchen-ticket').count(), 3);
    await kitchen
      .getByRole('button', { name: 'Siguientes →', exact: true })
      .click();
    assert.equal(await kitchen.locator('.kitchen-ticket').count(), 1);
    await kitchen
      .getByRole('button', { name: 'Volver a las más antiguas', exact: true })
      .click();
    assert.equal(await kitchen.locator('.kitchen-ticket').count(), 3);
    assert.equal(
      await kitchen
        .getByRole('button', { name: /^(Iniciar|Preparar|Listo|Entregar)$/ })
        .count(),
      0
    );
    await kitchen.screenshot({
      path: '/workspace/cloud-setup/cycle2-kitchen-1920.png'
    });
    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ]) {
      await kitchen.setViewportSize({ width, height });
      assert.equal(
        await kitchen.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 2
        ),
        false
      );
    }
    await page
      .locator('summary')
      .filter({ hasText: 'Salidas, cambios y correcciones' })
      .click();
    await page.getByLabel('Plato de la comanda', { exact: true }).click();
    await page.getByRole('option').filter({ hasText: '#1 Arroz F10' }).click();
    await page.getByLabel('Unidades de salida o corrección').fill('0.5');
    await mutation(
      `/attention-accounts/${account.id}/dispatch-items/${dispatches[0].items[0].id}/exits`,
      () =>
        page
          .getByRole('button', {
            name: 'Registrar salida de platos',
            exact: true
          })
          .click()
    );
    let live = await req(`/attention-accounts/${account.id}/dispatches`);
    assert.equal(Number(live[0].items[0].delivered), 0.5);
    assert.equal(live[0].pending, true);
    await page.getByLabel('Salida a corregir', { exact: true }).click();
    await page
      .getByRole('option')
      .filter({ hasText: '0.500 unidades' })
      .click();
    await page.getByLabel('Unidades de salida o corrección').fill('0.25');
    assert.equal(
      await page
        .getByRole('button', {
          name: 'Corregir salida con motivo',
          exact: true
        })
        .isDisabled(),
      true
    );
    await page
      .getByLabel('Motivo de corrección o recuperación')
      .fill('Salida marcada por error');
    await mutation(
      `/attention-accounts/${account.id}/dispatch-items/${dispatches[0].items[0].id}/corrections`,
      () =>
        page
          .getByRole('button', {
            name: 'Corregir salida con motivo',
            exact: true
          })
          .click()
    );
    live = await req(`/attention-accounts/${account.id}/dispatches`);
    assert.equal(Number(live[0].items[0].delivered), 0.25);
    assert.equal(live[0].confirmedAt, dispatches[0].confirmedAt);
    await page.getByLabel('Unidades de salida o corrección').fill('0.75');
    await mutation(
      `/attention-accounts/${account.id}/dispatch-items/${dispatches[0].items[0].id}/exits`,
      () =>
        page
          .getByRole('button', {
            name: 'Registrar salida de platos',
            exact: true
          })
          .click()
    );
    live = await req(`/attention-accounts/${account.id}/dispatches`);
    assert.equal(live[0].pending, false);
    await kitchen
      .getByRole('button', { name: 'Actualizar', exact: true })
      .click();
    await kitchen.waitForFunction(
      (id) =>
        !Array.from(document.querySelectorAll('.kitchen-ticket')).some((el) =>
          el.textContent.includes(id)
        ),
      dispatches[0].id.slice(0, 8)
    );
    await kitchen.close();

    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ]) {
      await page.setViewportSize({ width, height });
      assert.equal(
        await page.evaluate(() => {
          const main = document.querySelector('[data-testid=app-content]');
          return (
            main.scrollWidth > main.clientWidth + 2 ||
            document.documentElement.scrollWidth > innerWidth + 2
          );
        }),
        false
      );
      await page.screenshot({
        path: `/workspace/cloud-setup/phase10-account-${width}.png`,
        fullPage: true
      });
    }
    await page
      .getByRole('button', { name: 'Cancelar', exact: true })
      .first()
      .click();
    const cancel = page.getByRole('button', {
      name: 'Confirmar cancelación',
      exact: true
    });
    assert.equal(await cancel.isDisabled(), true);
    await page
      .getByLabel('Motivo de cancelación', { exact: true })
      .fill('Cliente solicita cancelar');
    const cancelled = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().endsWith('/cancel')
    );
    await cancel.click();
    assert.ok((await cancelled).ok());
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const after = (await req('/attention-accounts')).find(
      (a) => a.id === account.id
    );
    assert.equal(
      after.lines.length,
      2,
      'Cancellation preserves historical lines'
    );
    assert.equal(after.attentionStatus, 'OPEN');
    assert.equal(Number(after.total), 20);
    assert.deepEqual(errors, []);
    console.log(
      'F10 Cycle2 kitchen/partial exits/correction/completion passed: real table account, product search, independent notes, first dispatch and additional dispatch without duplicates, totals/states intact, responsive 390/900/1440.'
    );
  } finally {
    await browser?.close();
    await owned?.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
