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
    owned = await fixture('phase8_browser');
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
    await req('/products', 'POST', {
      name: 'Plato F8 browser',
      categoryId: catalog[0].categoryId,
      price: 20,
      kind: 'FOOD',
      trackStock: false
    });
    b = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await b.newPage({ viewport: { width: 1280, height: 960 } });
    const errors = [];
    const resources = [];
    page.on('response', (r) => {
      if (r.status() >= 400)
        resources.push({ status: r.status(), url: r.url() });
    });
    page.on('requestfailed', (r) =>
      resources.push({ failure: r.failure()?.errorText, url: r.url() })
    );
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') console.log('CONSOLE', m.text());
    });
    await page.goto(frontend + '/auth/login');
    await page.getByLabel('Nombre de usuario').fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.waitForURL((u) => !u.pathname.includes('/auth/'));
    await page.goto(frontend + '/attention');
    await page.getByLabel('Modalidad', { exact: true }).click();
    await page
      .getByRole('option', { name: 'Delivery propio', exact: true })
      .click();
    await page.getByLabel('Mozo responsable', { exact: true }).click();
    await page
      .getByRole('option', { name: 'Mozo Finanzas', exact: true })
      .click();
    await page.getByLabel('Nombre de quien recibe').fill('Cliente navegador');
    await page.getByLabel('Teléfono de contacto').fill('999999999');
    await page.getByLabel('Dirección de entrega').fill('Calle prueba 123');
    await page.getByLabel('Referencia de entrega').fill('Puerta verde');
    const created = page.waitForResponse(
      (r) =>
        r.url().endsWith('/attention-accounts') &&
        r.request().method() === 'POST'
    );
    await page
      .getByRole('button', { name: 'Abrir cuenta', exact: true })
      .click();
    const result = await created;
    if (result.status() !== 201) throw Error(await result.text());
    const account = await result.json();
    await page.getByLabel('Cuenta de atención', { exact: true }).click();
    await page
      .getByRole('option', { name: new RegExp(account.id.slice(0, 8)) })
      .click();
    await page.getByText('DELIVERY PROPIO · envío gratuito').waitFor();
    await page.getByLabel('Tipo de consumo', { exact: true }).click();
    await page.getByRole('option', { name: /personal/i }).click();
    await page.getByLabel('Trabajador beneficiario').click();
    await page
      .getByRole('option', { name: 'Mozo Finanzas', exact: true })
      .click();
    await page.getByLabel('Producto o menú', { exact: true }).click();
    await page.getByRole('option', { name: /Plato F8 browser/ }).click();
    const line = page.waitForResponse(
      (r) => r.url().endsWith('/lines') && r.request().method() === 'POST'
    );
    await page
      .getByRole('button', { name: 'Agregar consumo', exact: true })
      .click();
    const added = await line;
    if (added.status() !== 201) throw Error(await added.text());
    const detail = await added.json();
    if (detail.total !== '0.00' || detail.lines[0].kind !== 'STAFF')
      throw Error('Staff snapshot incorrect');
    await page
      .getByLabel('Nuevo repartidor: nombre')
      .fill('Repartidor browser');
    await page.getByLabel('Nuevo repartidor: teléfono').fill('999999999');
    const courier = page.waitForResponse(
      (r) =>
        r.url().endsWith('/offsite/couriers') && r.request().method() === 'POST'
    );
    await page
      .getByRole('button', { name: 'Registrar repartidor/courier' })
      .click();
    if ((await courier).status() !== 201) throw Error('Courier failed');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('Repartidor / courier').click();
    await page.getByRole('option', { name: 'Repartidor browser' }).click();
    await page
      .getByLabel('Motivo de operación de entrega')
      .fill('Asignación de viaje');
    const details = page.waitForResponse(
      (r) => r.url().endsWith('/details') && r.request().method() === 'POST'
    );
    await page
      .getByRole('button', { name: 'Guardar datos de entrega' })
      .click();
    if ((await details).status() !== 201) throw Error('Details failed');
    await page
      .getByText('Efectivo en poder del courier', { exact: true })
      .waitFor();
    console.log('RESOURCE_DIAGNOSTICS', JSON.stringify(resources));
    const unexpected = resources.filter(
      (r) =>
        !(
          r.failure === 'net::ERR_ABORTED' &&
          r.url.endsWith('/static/sounds/bell-ding.wav')
        ) &&
        !r.url.startsWith('https://fonts.googleapis.com/') &&
        !r.url.startsWith('https://images.unsplash.com/') &&
        !(r.status === 401 && r.url.endsWith('/auth/auth-renew')) &&
        !(r.status === 404 && r.url.endsWith('/cash-register/actives'))
    );
    if (unexpected.length) throw Error(JSON.stringify(unexpected));
    if (errors.length) throw Error(JSON.stringify(errors));
    console.log(
      'F8 desktop/mobile: login, delivery creation, staff free consumption, courier registration/assignment; no JavaScript exceptions; resource diagnostics listed'
    );
  } finally {
    if (b) await b.close();
    if (owned) await owned.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
