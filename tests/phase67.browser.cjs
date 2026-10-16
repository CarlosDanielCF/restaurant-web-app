const path = require('path');
const backend =
  process.env.RESTAURANT_BACKEND_PATH ||
  path.resolve(__dirname, '../../restaurant-backend');
process.chdir(backend);
require(path.join(backend, 'node_modules/ts-node')).register({
  project: path.join(backend, 'tsconfig.json')
});
const { fixture } = require(path.join(backend, 'test/fixture.ts'));
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  let owned, b;
  try {
    owned = await fixture('phase67_browser');
    const base = process.env.BACKEND_URL || 'http://127.0.0.1:5000/api';
    const frontend = process.env.FRONTEND_URL || 'http://127.0.0.1:3030';
    const call = async (path, method = 'GET', body, token, tenant) => {
      const r = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token
            ? {
                Authorization: 'Bearer ' + token,
                'x-restaurant-id': tenant,
                'Idempotency-Key': crypto.randomUUID()
              }
            : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const data = await r.json();
      if (!r.ok)
        throw Error(
          method + ' ' + path + ' ' + r.status + ' ' + JSON.stringify(data)
        );
      return data;
    };
    const owner = await call('/auth/login', 'POST', {
        username: owned.username,
        password: owned.password
      }),
      tenant = owner.currentRestaurant.id;
    const req = (path, method = 'GET', body) =>
      call(path, method, body, owner.token, tenant);
    const username = 'ui67_' + Date.now();
    const waiter = await req('/users', 'POST', {
      username,
      firstName: 'Mozo',
      lastName: 'Finanzas',
      email: username + '@example.test',
      typeIdentification: 'CEDULA',
      numberIdentification: crypto.randomUUID().slice(0, 10),
      rol: 'MOZO'
    });
    owned.users.push(waiter.id);
    const activation = await req('/auth/reset-password-user', 'PATCH', {
      userId: waiter.id
    });
    const password = 'BrowserWorker123!';
    await call('/auth/reset-password', 'PATCH', {
      resetPasswordToken: activation.recoveryUrl.split('/').pop(),
      password
    });
    const catalog = await req('/products');
    const product = await req('/products', 'POST', {
      name: 'Plato UI finanzas',
      categoryId: catalog[0].categoryId,
      price: 20,
      kind: 'FOOD',
      trackStock: false
    });
    const table = await req('/tables', 'POST', {
      name: 'Mesa finanzas',
      chairs: 4
    });
    let account = await req('/attention-accounts', 'POST', {
      responsibleUserId: waiter.id,
      tableIds: [table.id]
    });
    account = await req(`/attention-accounts/${account.id}/lines`, 'POST', {
      expectedVersion: account.version,
      sourceType: 'PRODUCT',
      sourceId: product.id,
      quantity: 1
    });
    b = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await b.newPage({ viewport: { width: 1280, height: 960 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(frontend + '/auth/login');
    await page.getByLabel('Nombre de usuario').fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.waitForTimeout(1500);
    await page.goto(frontend + '/finance');
    await page
      .locator('[data-testid=app-content]')
      .getByText('Cobros y rendición', { exact: true })
      .waitFor()
      .catch(async (e) => {
        console.log(
          'DEBUG',
          page.url(),
          errors,
          (await page.locator('body').innerText()).slice(-2500)
        );
        throw e;
      });
    let response = page.waitForResponse(
      (r) =>
        r.url().endsWith('/finance/shifts') && r.request().method() === 'POST'
    );
    await page
      .getByRole('button', { name: 'Abrir mi turno', exact: true })
      .click();
    if ((await response).status() !== 201) throw Error('Open shift failed');
    await page.getByLabel('Cuenta de atención').click();
    await page.getByRole('option', { name: /Mesa finanzas/ }).click();
    await page
      .getByRole('button', { name: 'Registrar pago', exact: true })
      .click();
    await page.getByLabel('Importe aplicado S/').fill('10.00');
    await page.getByLabel('Importe recibido S/').fill('20.00');
    const paymentKeys = [];
    let dropResponse = true;
    await page.route('**/finance/accounts/*/payments', async (route) => {
      paymentKeys.push(route.request().headers()['idempotency-key']);
      if (dropResponse) {
        dropResponse = false;
        const serverResponse = await route.fetch();
        if (serverResponse.status() !== 201)
          throw Error('First payment did not commit');
        await route.abort('failed'); // Money persisted, response lost in transit.
      } else await route.continue();
    });
    await page.getByRole('button', { name: 'Confirmar cobro manual' }).click();
    await page.getByText(/Sin confirmación. Consulte el estado/).first().waitFor();
    // Version guard blocks stale dialogs: reconstruct the same intent after refreshing.
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    await page
      .getByRole('button', { name: 'Registrar pago', exact: true })
      .click();
    await page.getByLabel('Importe aplicado S/').fill('10.00');
    await page.getByLabel('Importe recibido S/').fill('20.00');
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('button')).some(
        (b) => b.textContent === 'Confirmar cobro manual' && !b.disabled
      )
    );
    response = page.waitForResponse(
      (r) => r.url().endsWith('/payments') && r.request().method() === 'POST'
    );
    await page
      .getByRole('button', { name: 'Confirmar cobro manual' })
      .evaluate((button) => {
        button.click();
        button.click();
      });
    if ((await response).status() !== 201) throw Error('Payment retry failed');
    if (paymentKeys.length !== 2 || paymentKeys[0] !== paymentKeys[1])
      throw Error('Retry/double click changed logical payment identity');
    await page.locator('.balance dd').filter({ hasText: 'S/ 10.00' }).waitFor();
    console.log('Browser cash partial payment/change and shift passed');
    await page
      .getByRole('button', { name: 'Registrar pago', exact: true })
      .click();
    await page.getByLabel('Método', { exact: true }).click();
    await page.getByRole('option', { name: 'Yape manual' }).click();
    await page.getByLabel('Importe aplicado S/').fill('10.00');
    await page.getByLabel('Importe recibido S/').fill('10.00');
    await page.getByText(/Sin QR disponible/).waitFor();
    if (
      await page
        .getByRole('button', { name: 'Confirmar cobro manual' })
        .isEnabled()
    )
      throw Error('Yape accepted without confirmation');
    await page
      .getByRole('checkbox', {
        name: 'Verifiqué visualmente la recepción del dinero'
      })
      .check();
    response = page.waitForResponse(
      (r) => r.url().endsWith('/payments') && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Confirmar cobro manual' }).click();
    if ((await response).status() !== 201) throw Error('Yape payment failed');
    if (paymentKeys[2] === paymentKeys[0])
      throw Error('New payment reused old key');
    await page.locator('.balance dd').filter({ hasText: 'S/ 0.00' }).waitFor();
    console.log(
      'Browser manual Yape, missing QR warning and full settlement passed'
    );
    const state = await req(`/finance/accounts/${account.id}`);
    if (
      state.account.attentionStatus !== 'OPEN' ||
      state.account.tables.length !== 1 ||
      state.payments.length !== 2
    )
      throw Error('Payment changed attention or duplicated');
    await page
      .getByRole('button', { name: 'Rendir turno', exact: true })
      .click();
    await page.getByLabel('Efectivo entregado S/').fill('10.00');
    response = page.waitForResponse(
      (r) => r.url().endsWith('/submit') && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Confirmar registro' }).click();
    if ((await response).status() !== 201)
      throw Error('Submit settlement failed');
    await page.getByText(/Rendición SUBMITTED/).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    if (
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1
      )
    )
      throw Error('Mobile horizontal overflow');
    if (process.env.SMOKE_SCREENSHOT)
      await page.screenshot({
        path: process.env.SMOKE_SCREENSHOT,
        fullPage: true
      });
    await page.reload();
    await page.getByText(/Rendición SUBMITTED/).waitFor();
    console.log(
      'Browser settlement, mobile rendering and reload persistence passed'
    );
    console.log('Page errors:', errors);
    if (errors.length) throw Error('Browser errors');
  } finally {
    if (b) await b.close();
    if (owned) await owned.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
