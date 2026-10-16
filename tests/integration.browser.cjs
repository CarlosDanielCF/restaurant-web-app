const path = require('path'),
  assert = require('node:assert/strict');
const backend = path.resolve(__dirname, '../../restaurant-backend');
process.chdir(backend);
require(path.join(backend, 'node_modules/ts-node')).register({
  project: path.join(backend, 'tsconfig.json')
});
const { fixture } = require(path.join(backend, 'test/fixture.ts'));
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  let owned, b;
  try {
    owned = await fixture('barrier_ui');
    const base = 'http://127.0.0.1:5000/api',
      front = 'http://127.0.0.1:3030';
    const call = async (url, method = 'GET', body, auth) => {
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
      const data = await r.json();
      if (!r.ok) throw Error(url + ' ' + r.status + ' ' + JSON.stringify(data));
      return data;
    };
    const session = await call('/auth/login', 'POST', {
      username: owned.username,
      password: owned.password
    });
    const req = (u, m, b) => call(u, m, b, session);
    b = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(15000);
    const errors = [],
      responses = [],
      warnings = [];
    page.on('pageerror', (e) => errors.push(e.stack || e.message));
    page.on('console', (m) => {
      if (
        m.type() === 'error' &&
        !m.text().startsWith('Failed to load resource:')
      )
        errors.push(m.text());
      if (m.type() === 'warning') warnings.push(m.text());
    });
    page.on('response', (r) => {
      if (
        r.url().startsWith(base) &&
        r.status() >= 400 &&
        !r.url().includes('/auth/auth-renew') &&
        !r.url().includes('/cash-register/actives') &&
        !(
          r.status() === 503 && r.url().endsWith('/auth/request-reset-password')
        )
      )
        responses.push(r.url() + ' ' + r.status());
    });
    await page.goto(front + '/auth/forgot-password');
    await page
      .locator('input[name="email"]')
      .fill('absent-' + Date.now() + '@example.test');
    const recovery = page.waitForResponse((r) =>
      r.url().endsWith('/auth/request-reset-password')
    );
    await page.getByRole('button', { name: 'Enviar instrucciones' }).click();
    const recoveryResponse = await recovery;
    if (recoveryResponse.status() === 503) {
      assert.match((await recoveryResponse.json()).message, /no configurada/);
      await page.getByText(/Recuperación por correo no configurada/).waitFor();
      console.log(
        'Recovery: SMTP unavailable, truthful UI message; admin token activation covered by F1 regression'
      );
    } else assert.ok(recoveryResponse.ok());
    await page.goto(front + '/auth/login');
    await page.getByLabel('Nombre de usuario').fill(owned.username);
    await page.locator('input[name="password"]').fill(owned.password);
    await page
      .getByRole('button', { name: 'Ver contraseña', exact: true })
      .click();
    assert.equal(await page.locator('#password').getAttribute('type'), 'text');
    await page.getByRole('button', { name: 'Ocultar contraseña' }).click();
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.getByText('Atención del restaurante', { exact: true }).waitFor();
    await page
      .getByRole('button', { name: 'Minimizar menú', exact: true })
      .click();
    await page.reload();
    await page
      .getByRole('button', { name: 'Expandir menú lateral', exact: true })
      .waitFor();
    await page
      .getByRole('button', { name: 'Expandir menú lateral', exact: true })
      .click();
    const response = async (url, method, action) => {
      const p = page.waitForResponse(
        (r) =>
          r.url().split('?')[0].replace(/\/$/, '') === base + url &&
          r.request().method() === method
      );
      await action();
      const r = await p;
      const data = await r.json();
      assert.ok(r.ok(), JSON.stringify(data));
      return data;
    };
    console.log('Login/sidebar passed');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(front + '/kitchen');
    await page.getByText('Cocina al día', { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole('button', { name: 'Siguientes →', exact: true })
        .count(),
      0
    );
    await page.screenshot({
      path: '/workspace/cloud-setup/final-kitchen-empty.png'
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    // Client form and search against MySQL.
    await page.goto(front + '/clients/add');
    await page.locator('input[name="firstName"]').fill('Cliente');
    await page.locator('input[name="lastName"]').fill('Integración');
    await page.getByLabel('Número de teléfono').fill('999123456');
    const client = await response('/clients', 'POST', () =>
      page.getByRole('button', { name: 'Guardar cliente' }).click()
    );
    await page
      .getByLabel('Buscar cliente', { exact: true })
      .fill('Integración');
    await page
      .getByText('Integración Cliente', { exact: true })
      .first()
      .waitFor();
    await page
      .getByRole('button', { name: 'Editar cliente', exact: true })
      .filter({ visible: true })
      .first()
      .click();
    await page
      .getByLabel('Dirección de entrega / domicilio')
      .fill('Calle Integración 123');
    await response('/clients/' + client.id, 'PATCH', () =>
      page
        .getByRole('button', { name: /Actualizar|Guardar|Editar/ })
        .last()
        .click()
    );
    console.log('Clients passed');
    // Create table and product with current DTOs.
    await page.goto(front + '/tables');
    await page
      .getByRole('button', { name: /Añadir/ })
      .first()
      .click();
    await page.getByLabel('Nombre o número de la mesa').fill('UI 42');
    const table = await response('/tables', 'POST', () =>
      page.getByRole('button', { name: 'Crear mesa', exact: true }).click()
    );
    await page.goto(front + '/menu/sections');
    await page
      .getByRole('button', { name: /Añadir/ })
      .first()
      .click();
    await page
      .getByRole('dialog')
      .locator('input[name="name"]')
      .fill('Sección UI');
    await response('/sections', 'POST', () =>
      page
        .getByRole('dialog')
        .getByRole('button', { name: 'Crear', exact: true })
        .click()
    );
    await page.goto(front + '/menu/categories');
    await page
      .getByRole('button', { name: /Añadir/ })
      .first()
      .click();
    await page
      .getByRole('dialog')
      .locator('input[name="name"]')
      .fill('Categoría UI');
    // Select the section in the modal.
    await page
      .getByRole('dialog')
      .getByLabel(/Secci[oó]n/)
      .click();
    await page.getByRole('option', { name: 'Sección UI', exact: true }).click();
    await response('/categories', 'POST', () =>
      page
        .getByRole('dialog')
        .getByRole('button', { name: 'Guardar', exact: true })
        .click()
    );
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.goto(front + '/menu/products/create');
    await page.locator('input[name="name"]').fill('Producto UI');
    await page.getByLabel('Categoría', { exact: true }).click();
    await page
      .getByRole('option', { name: 'Categoría UI', exact: true })
      .click();
    await page.locator('input[name="price"]').fill('23.50');
    const product = await response('/products', 'POST', () =>
      page.getByRole('button', { name: 'Crear producto', exact: true }).click()
    );
    assert.equal(Number(product.price), 23.5);
    await page.waitForURL('**/edit');
    await page.getByRole('button', { name: 'Añadir', exact: true }).click();
    await page
      .getByRole('dialog')
      .locator('input[name="name"]')
      .fill('Presentación UI');
    await page.getByRole('dialog').locator('input[name="price"]').fill('28');
    await response('/product-options', 'POST', () =>
      page
        .getByRole('dialog')
        .getByRole('button', { name: 'Añadir opción', exact: true })
        .click()
    );

    console.log('Catalog passed');
    // Worker creation, role dialog, protected owner, token-based activation remains backend-owned.
    await page.goto(front + '/users/add');
    await page.locator('input[name="firstName"]').fill('Trabajador');
    await page.locator('input[name="lastName"]').fill('Integración');
    const username = 'barrier_' + Date.now();
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="email"]').fill(username + '@example.test');
    await page.locator('input[name="identification.num"]').fill('0912345678');
    await page.getByLabel('Rol', { exact: true }).click();
    await page.getByRole('option', { name: /Mozo/i }).click();
    const worker = await response('/users', 'POST', () =>
      page.getByRole('button', { name: 'Crear', exact: true }).click()
    );
    owned.users.push(worker.id);
    await page.goto(front + '/users');
    await page
      .getByRole('button', { name: 'Editar rol de usuario' })
      .filter({ visible: true })
      .first()
      .click();
    await page
      .getByRole('dialog')
      .getByLabel('Nuevo rol en el restaurante', { exact: true })
      .click();
    assert.equal(await page.getByRole('option', { name: /dueño/i }).count(), 0);
    await page.keyboard.press('Escape');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Cancelar', exact: true })
      .click();
    console.log('Workers passed');
    // Restaurant identity, authenticated persistent logo and timezone.
    await page.goto(front + '/restaurant');
    await page
      .getByLabel('Nombre del restaurante')
      .fill('Restaurante Integración');
    await page.getByLabel('Teléfono de contacto').fill('999123456');
    await page.getByLabel('Correo electrónico').fill('restaurant@example.test');
    await page.getByLabel('Dirección fiscal y/o sucursal').fill('Calle UI 123');
    await page.getByLabel('Capacidad máxima (aforo)').fill('40');
    await response('/restaurant/' + session.currentRestaurant.id, 'PATCH', () =>
      page.getByRole('button', { name: 'Guardar información' }).click()
    );
    const png = await require(path.join(backend, 'node_modules/sharp'))({
      create: { width: 16, height: 16, channels: 3, background: '#0f766e' }
    })
      .png()
      .toBuffer();
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png });
    await response(
      '/restaurant/logo/' + session.currentRestaurant.id,
      'PATCH',
      () => page.getByRole('button', { name: 'Actualizar logo' }).click()
    );
    await page.getByLabel('Zona horaria IANA').fill('America/Lima');
    await page.getByRole('button', { name: 'Guardar zona horaria' }).click();
    await page.getByText('Zona horaria guardada', { exact: true }).waitFor();
    console.log('Restaurant passed');
    await page.goto(front + '/attention');
    await page
      .getByRole('tab', { name: 'Menú compuesto', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Nuevo menú compuesto', exact: true })
      .click();
    await page.getByLabel('Nombre del menú').fill('Menú integración');
    await page.getByLabel('Precio conjunto (S/)').fill('25');
    await page
      .getByRole('button', { name: 'Agregar componente', exact: true })
      .click();
    await page
      .getByLabel('Componente (entrada, segundo, bebida...)')
      .fill('Segundo');
    await page.getByRole('button', { name: 'Agregar opción incluida' }).click();
    await page.getByLabel('Opción incluida', { exact: true }).click();
    await page
      .getByRole('option', { name: 'Producto UI', exact: true })
      .click();
    await response('/daily-menus', 'POST', () =>
      page.getByRole('button', { name: 'Guardar menú compuesto' }).click()
    );
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page
      .getByRole('tab', { name: 'Carta y disponibilidad', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Gestionar Producto UI', exact: true })
      .click();
    await page.getByLabel('Controlar cantidad de porciones').check();
    await page.getByLabel('Porciones disponibles', { exact: true }).fill('12');
    await page
      .getByRole('button', { name: 'Agregar acompañamiento o extra' })
      .click();
    await page.getByLabel('Nombre del acompañamiento o extra').fill('Extra UI');
    await page.getByLabel('Precio adicional').fill('2');
    await response('/products/' + product.id, 'PATCH', () =>
      page.getByRole('button', { name: 'Guardar carta/disponibilidad' }).click()
    );
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('tab', { name: 'Reservas', exact: true }).click();
    await page.getByLabel('Nombre de la reserva').fill('Reserva UI');
    await page.getByLabel('Teléfono de la reserva').fill('999123456');
    await page.getByLabel('Fecha y hora local').fill('2026-11-20T13:00');
    const reservation = await response('/reservations', 'POST', () =>
      page.getByRole('button', { name: 'Guardar reserva' }).click()
    );
    await page
      .getByRole('button', { name: 'Registrar llegada y elegir mesa' })
      .click();
    await page.getByLabel('Mozo responsable', { exact: true }).click();
    await page
      .getByRole('option', { name: 'Trabajador Integración', exact: true })
      .click();
    await page.getByLabel('UI 42 · Libre', { exact: true }).check();
    await response('/reservations/' + reservation.id + '/arrival', 'POST', () =>
      page
        .getByRole('button', { name: 'Confirmar llegada e iniciar cuenta' })
        .click()
    );
    const liveAccounts = await req('/attention-accounts');
    assert.ok(
      liveAccounts.some((a) => a.tables.some((t) => t.id === table.id))
    );
    console.log(
      'Compound menu, extras, availability, reservation and arrival/account passed'
    );

    // Canonical reservations/menus/catalog read through actual APIs; API domain suite covers mutations.
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 900, height: 1100 },
      { width: 1440, height: 900 }
    ]) {
      await page.setViewportSize(viewport);
      for (const route of [
        '/attention',
        '/users',
        '/clients',
        '/menu/sections',
        '/menu/categories',
        '/menu/products',
        '/tables',
        '/restaurant',
        '/finance',
        '/internal-documents',
        '/operational-reports',
        '/operational-overview'
      ]) {
        await page.goto(front + route);
        await page.waitForLoadState('networkidle');
        if (route === '/operational-overview') {
          await page
            .getByText('Ventas confirmadas hoy', { exact: true })
            .waitFor();
          assert.equal(
            await page.getByText(/No se pudo actualizar el resumen/).count(),
            0
          );
          await page.screenshot({
            path:
              '/workspace/cloud-setup/final-overview-' + viewport.width + '.png'
          });
        }
        await page
          .locator('[data-testid=app-content]')
          .waitFor({ state: 'visible' });
        assert.ok(
          await page.locator('body').innerText(),
          route + ' ' + JSON.stringify(errors)
        );
        const overflow = await page.evaluate(() => {
          const main = document.querySelector('[data-testid=app-content]');
          return (
            document.documentElement.scrollWidth > innerWidth + 2 ||
            (main && main.scrollWidth > main.clientWidth + 2)
          );
        });
        assert.equal(
          overflow,
          false,
          route + ' page overflow ' + viewport.width
        );
      }
      await page.goto(front + '/attention');
      for (const tab of [
        'Reservas',
        'Menú compuesto',
        'Carta y disponibilidad'
      ]) {
        await page.getByRole('tab', { name: tab, exact: true }).click();
        await page.waitForTimeout(150);
      }
      if (viewport.width < 1200) {
        await page
          .getByRole('button', { name: 'Abrir menú de navegación' })
          .click();
        for (const title of [
          'Cocina',
          'Cobros y rendición',
          'Documentos internos',
          'Reportes operativos',
          'Clientes'
        ])
          await page
            .getByRole('button', { name: title, exact: true })
            .filter({ visible: true })
            .first()
            .waitFor();
        await page
          .getByRole('button', { name: 'Cerrar menú', exact: true })
          .click();
      }
      await page.waitForTimeout(350); // Let the drawer exit animation finish.
      console.log('Responsive passed:', viewport.width);
      await page.screenshot({
        path: '/workspace/cloud-setup/integration-' + viewport.width + '.png'
      });
    }
    for (let i = 0; i < 4; i++) {
      let a = await req('/attention-accounts', 'POST', {
        modality: 'TAKE_AWAY',
        tableIds: [],
        responsibleUserId: worker.id
      });
      a = await req('/attention-accounts/' + a.id + '/lines', 'POST', {
        expectedVersion: a.version,
        sourceType: 'PRODUCT',
        sourceId: product.id,
        quantity: 1
      });
      await req('/attention-accounts/' + a.id + '/confirm', 'POST', {
        expectedVersion: a.version
      });
    }
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(front + '/kitchen');
    await page.waitForLoadState('networkidle');
    assert.equal(
      await page
        .getByRole('button', { name: /^(Iniciar|Listo|Entregar)$/ })
        .count(),
      0
    );
    await page
      .getByText('4 pendientes · 3 visibles · 1 adicionales', { exact: true })
      .waitFor();
    await page
      .getByRole('button', { name: 'Siguientes →', exact: true })
      .click();
    await page.getByText('Página 2 / 2', { exact: true }).waitFor();
    await page
      .getByRole('button', { name: 'Volver a las más antiguas' })
      .click();
    await page.getByText('Página 1 / 2', { exact: true }).waitFor();
    await page.screenshot({
      path: '/workspace/cloud-setup/integration-kitchen-tv.png'
    });
    assert.deepEqual(responses, []);
    assert.deepEqual(errors, []);
    console.log(
      'Integration F0–F3: real login, password toggle, sidebar persistence, client/table/section/category/product/worker/restaurant creation or update, role protection, logo, timezone; all F9 routes and operation tabs in 390/900/1440 and kitchen TV 1920.'
    );
    console.log('Warnings:', JSON.stringify([...new Set(warnings)]));
  } finally {
    await b?.close();
    await owned?.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
