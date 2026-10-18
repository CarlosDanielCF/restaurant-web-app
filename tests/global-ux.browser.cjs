/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires, no-inner-declarations */
// Real HTTP/browser review. NO migration or seed invocation. Requires existing owner credentials.
const path = require('node:path'),
  fs = require('node:fs'),
  assert = require('node:assert/strict');
const backend = path.resolve(__dirname, '../../restaurant-backend');
process.chdir(backend);
require(path.join(backend, 'node_modules/dotenv')).config({ quiet: true });
require(path.join(backend, 'node_modules/ts-node')).register({
  project: path.join(backend, 'tsconfig.json')
});
const source = require(path.join(backend, 'src/database/data-source')).default;
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = 'http://127.0.0.1:5000/api',
  front = 'http://127.0.0.1:3030';
const output = process.env.VISUAL_OUTPUT || '/tmp/point-global-ux';
fs.mkdirSync(output, { recursive: true });
(async () => {
  let browser, tenant, db;
  const users = [],
    errors = [],
    checks = [],
    navigations = new Map();
  const suffix = crypto.randomUUID().replaceAll('-', '');
  async function api(auth, url, method = 'GET', body, expected) {
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
    const text = await r.text();
    const d = text ? JSON.parse(text) : null;
    if (expected) assert.equal(r.status, expected, `${method} ${url}`);
    else assert.ok(r.ok, `${method} ${url}: ${r.status} ${text}`);
    return d;
  }
  try {
    assert.equal(
      process.env.NODE_ENV,
      'development',
      'Run only against an existing development environment'
    );
    assert.equal(source.options.database, 'restaurante_app');
    db = await source.initialize();
    const before = await db.query('SELECT name FROM migrations ORDER BY id');
    assert.ok(
      before.some((r) => r.name === 'PendingCancellation1760358900000'),
      'Required schema missing: do not run migrations automatically'
    );
    const initial = await api(null, '/auth/login', 'POST', {
      username: process.env.DEV_USER_USERNAME,
      password: process.env.DEV_USER_PASSWORD
    });
    assert.equal(initial.user.role.name, 'DUENO');
    const owner = await api(initial, '/restaurant', 'POST', {
      name: 'Revisión UX ' + suffix.slice(0, 6),
      identification: 'UX-' + suffix,
      address: 'Local de prueba',
      phone: '999999999',
      email: suffix + '@example.test',
      capacity: 40,
      timeZone: 'America/Lima'
    });
    tenant = owner.currentRestaurant.id;
    async function worker(role) {
      const username = 'ux_' + crypto.randomUUID().replaceAll('-', '');
      const u = await api(owner, '/users', 'POST', {
        username,
        firstName: role === 'MOZO' ? 'Ana' : 'Revisión',
        lastName: role,
        email: username + '@example.test',
        typeIdentification: 'CEDULA',
        numberIdentification: username.slice(-10),
        rol: role
      });
      users.push(u.id);
      const recovery = await api(owner, '/auth/reset-password-user', 'PATCH', {
        userId: u.id
      });
      const password = crypto.randomUUID() + 'Aa1!';
      await api(null, '/auth/reset-password', 'PATCH', {
        resetPasswordToken: recovery.recoveryUrl.split('/').pop(),
        password
      });
      const auth = await api(null, '/auth/login', 'POST', {
        username,
        password
      });
      return { ...auth, username, password };
    }
    const admin = await worker('ADMINISTRADOR'),
      waiter = await worker('MOZO'),
      cook = await worker('COCINERO');
    const section = await api(owner, '/sections', 'POST', {
      name: 'Carta de prueba'
    });
    const category = await api(owner, '/categories', 'POST', {
      name: 'Preparados',
      sectionId: section.id
    });
    await api(owner, '/products', 'POST', {
      name: 'Plato revisión',
      categoryId: category.id,
      price: 29,
      kind: 'FOOD',
      productionRouting: 'PRODUCTION'
    });
    const product = (await api(owner, '/products')).find(
      (p) => p.name === 'Plato revisión'
    );
    const table = await api(owner, '/tables', 'POST', {
      name: 'Mesa revisión',
      chairs: 4
    });
    browser = await chromium.launch({
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox']
    });
    async function device(
      auth,
      route = '/attention',
      width = 1440,
      height = 900
    ) {
      const context = await browser.newContext({ viewport: { width, height } });
      const p = await context.newPage();
      p.setDefaultTimeout(18000);
      p.on('pageerror', (e) => errors.push(e.message));
      if (auth.username) {
        await p.goto(front + '/auth/login');
        await p.locator('input[name=username]').fill(auth.username);
        await p.locator('input[name=password]').fill(auth.password);
        await p.locator('button[type=submit]').click();
        await p.waitForURL('**/attention');
      } else {
        await context.addInitScript(
          (token) => localStorage.setItem('token', token),
          auth.token
        );
      }
      await p.goto(front + route);
      await p.getByTestId('app-content').waitFor();
      navigations.set(p, 0);
      p.on('request', (r) => {
        if (r.isNavigationRequest() && r.frame() === p.mainFrame())
          navigations.set(p, navigations.get(p) + 1);
      });
      return p;
    }
    async function route(p, url) {
      assert.equal(
        navigations.get(p) || 0,
        0,
        'unexpected reload before route ' + url
      );
      await p.goto(front + url);
      await p.getByTestId('app-content').waitFor();
      navigations.set(p, 0);
    }
    async function shot(p, name, width, height) {
      await p.setViewportSize({ width, height });
      await p.waitForTimeout(250);
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        ),
        name + ' overflow'
      );
      assert.ok(
        await p
          .getByTestId('app-content')
          .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
        name + ' content overflow'
      );
      await p.screenshot({ path: path.join(output, name + '.png') });
    }
    const w = await device(waiter, '/attention?tab=reservations');
    const c = await device(cook, '/attention?tab=catalog');
    const a = await device(admin, '/users');
    const o = await device(owner, '/operational-overview');
    checks.push(
      'four real roles authenticated, owner via existing scoped server session'
    );
    assert.equal(
      await o
        .getByRole('link', { name: 'Menú y disponibilidad', exact: true })
        .count(),
      0
    );
    assert.equal(
      await o
        .getByRole('link', { name: 'Tiempos de cocina', exact: true })
        .count(),
      0
    );
    // Role-scoped restrictions, without displaying grants from other base roles.
    const cookRow = a.getByRole('row').filter({ hasText: cook.username });
    await cookRow
      .getByRole('button', { name: 'Permisos', exact: true })
      .click();
    await a.getByRole('dialog').getByLabel('Editar menú compuesto').waitFor();
    assert.equal(
      await a
        .getByRole('dialog')
        .getByLabel('Cobros, fiados y rendiciones')
        .count(),
      0
    );
    assert.equal(
      await a
        .getByRole('dialog')
        .getByLabel('Administrar trabajadores')
        .count(),
      0
    );
    await a
      .getByRole('dialog')
      .getByRole('button', { name: 'Cancelar', exact: true })
      .click();
    await a.getByRole('dialog').waitFor({ state: 'hidden' });
    await a
      .getByRole('row')
      .filter({ hasText: waiter.username })
      .getByRole('link', { name: 'Editar', exact: true })
      .waitFor();
    // Safe one-action availability; query refresh does not erase search/context.
    const pc = c
      .locator('.service-product')
      .filter({ hasText: 'Plato revisión' });
    await pc
      .getByRole('button', { name: 'Marcar agotado', exact: true })
      .click();
    await pc
      .getByRole('button', { name: 'Marcar disponible', exact: true })
      .waitFor();
    assert.equal(
      (await api(owner, '/products')).find((p) => p.id === product.id).status,
      'OUT_OF_STOCK'
    );
    await pc
      .getByRole('button', { name: 'Marcar disponible', exact: true })
      .click();
    await pc
      .getByRole('button', { name: 'Marcar agotado', exact: true })
      .waitFor();
    checks.push('availability direct action, persisted and live');
    // Reservation details preserve typed values; waiter context survives arrival.
    await w.getByLabel('Nombre de la reserva').fill('Visita revisión');
    await w.getByLabel('Teléfono de la reserva').fill('999888777');
    await w.getByLabel('Fecha y hora local').fill('2030-10-18T19:30');
    await w
      .locator('summary')
      .filter({ hasText: 'Observaciones de reserva (opcional)' })
      .click();
    await w
      .getByLabel('Observaciones de reserva', { exact: true })
      .fill('Ventana');
    await w
      .locator('summary')
      .filter({ hasText: 'Observaciones de reserva (opcional)' })
      .click();
    await w
      .getByRole('button', { name: 'Guardar reserva', exact: true })
      .click();
    await w
      .getByRole('button', {
        name: 'Registrar llegada y elegir mesa',
        exact: true
      })
      .click();
    const arrival = w.getByRole('dialog');
    await arrival.getByText('Responsable: Ana MOZO').waitFor();
    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ])
      await shot(w, 'arrival-' + width, width, height);
    await arrival.getByLabel(/Mesa revisión.*Libre/).check();
    await arrival
      .getByRole('button', {
        name: 'Confirmar llegada e iniciar cuenta',
        exact: true
      })
      .click();
    await w.getByText('Tomar pedido', { exact: true }).waitFor();
    let account = (await api(waiter, '/attention-accounts')).find((x) =>
      x.tables.some((t) => t.id === table.id)
    );
    assert.ok(account);
    assert.equal(
      (await api(waiter, '/reservations')).find(
        (r) => r.name === 'Visita revisión'
      ).notes,
      'Ventana'
    );
    checks.push(
      'reservation created, optional notes retained, waiter arrival opens known account'
    );
    // Same capabilities: qty two, packing partial, production, contextual cash.
    await w
      .getByRole('button', { name: 'Aumentar cantidad de Plato revisión' })
      .click();
    await w
      .getByRole('button', { name: 'Agregar Plato revisión', exact: true })
      .click();
    await w
      .getByRole('button', { name: 'Seleccionar para llevar', exact: true })
      .click();
    await w.getByLabel('Plato revisión · para llevar (de 2)').fill('1');
    await w
      .getByRole('button', { name: 'Aplicar selección', exact: true })
      .click();
    await route(c, '/kitchen');
    await w
      .getByRole('button', {
        name: 'Confirmar consumos y enviar a producción',
        exact: true
      })
      .click();
    await c.getByText('2 × Plato revisión', { exact: true }).waitFor();
    await c.getByText('Para llevar: 1', { exact: true }).waitFor();
    await w.getByLabel('Unidades de Plato revisión').fill('1');
    await w.getByRole('button', { name: '✓ Entregar', exact: true }).click();
    await c.getByText('1 × Plato revisión', { exact: true }).waitFor();
    await w.getByRole('button', { name: '✓ Entregar', exact: true }).click();
    await c
      .getByText('0 pendientes · 0 visibles · 0 adicionales', { exact: true })
      .waitFor();
    await w.getByRole('link', { name: 'Cobrar S/ 58.00', exact: true }).click();
    await w
      .getByRole('button', { name: 'Abrir turno y continuar', exact: true })
      .click();
    await w
      .getByRole('button', { name: 'Abrir turno y continuar', exact: true })
      .waitFor({ state: 'hidden' });
    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ])
      await shot(w, 'cash-' + width, width, height);
    await w.getByLabel('Importe recibido S/').fill('60');
    await w.getByText('Vuelto estimado: S/ 2.00', { exact: true }).waitFor();
    await w
      .getByRole('button', { name: 'Confirmar cobro manual', exact: true })
      .click();
    await w.getByRole('dialog').waitFor({ state: 'hidden' });
    const paid = await api(waiter, `/finance/accounts/${account.id}`);
    assert.equal(paid.account.balance, '0.00');
    assert.equal(paid.account.attentionStatus, 'OPEN');
    checks.push(
      'qty2, takeaway partial, live kitchen, partial/total exits, cash58/60/2 without freeing table'
    );
    await w
      .locator('summary')
      .filter({ hasText: 'Descuentos, propinas, fiado y devoluciones' })
      .click();
    await w
      .getByRole('button', { name: 'Dividir saldo', exact: true })
      .waitFor();
    checks.push('advanced financial operations retained and discoverable');
    await w.getByRole('link', { name: 'Ver cuenta', exact: true }).click();
    await w
      .getByRole('button', { name: 'Emitir cuenta previa', exact: true })
      .click();
    await w
      .getByRole('button', { name: 'Imprimir documento interno', exact: true })
      .waitFor();
    await w.getByRole('button', { name: 'Ticket 80 mm', exact: true }).click();
    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ])
      await shot(w, 'document-' + width, width, height);
    checks.push(
      'contextual document emission, historical preview and print format'
    );
    // Manager current-account shortcut avoids selecting the account again.
    await o
      .getByRole('button', { name: 'Actualizar resumen', exact: true })
      .click();
    await o
      .getByRole('link', { name: 'Atender cuenta', exact: true })
      .first()
      .click();
    await o.getByText('Tomar pedido', { exact: true }).waitFor();
    // Offsite editing preserves context, reason and independent financial state.
    const delivery = await api(waiter, '/attention-accounts', 'POST', {
      modality: 'OWN_DELIVERY',
      responsibleUserId: waiter.user.id,
      tableIds: [],
      offsite: {
        customerName: 'Visita delivery',
        phone: '999888777',
        address: 'Dirección de prueba',
        reference: 'Puerta lateral'
      }
    });
    await route(w, '/attention?accountId=' + delivery.id);
    const offsite = w.locator('.offsite-operation');
    await offsite
      .locator('summary')
      .filter({ hasText: 'Editar contacto, dirección o repartidor' })
      .click();
    await offsite.getByLabel('Referencia de entrega').fill('Puerta principal');
    await offsite
      .getByLabel('Motivo de operación de entrega')
      .fill('Corregir referencia indicada');
    await offsite
      .getByRole('button', { name: 'Guardar datos de entrega', exact: true })
      .click();
    await offsite
      .locator('.offsite-contact')
      .getByText('Puerta principal', { exact: true })
      .waitFor();
    await offsite
      .locator('summary')
      .filter({ hasText: 'Editar contacto, dirección o repartidor' })
      .click();
    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ])
      await shot(w, 'delivery-' + width, width, height);
    await offsite
      .getByRole('link', { name: 'Ver cobros de esta atención', exact: true })
      .click();
    await w.getByLabel('Cuenta de atención', { exact: true }).waitFor();
    assert.ok(w.url().includes('accountId=' + delivery.id));
    assert.equal(await w.getByRole('dialog').count(), 0);
    checks.push(
      'delivery contextual edit audited, responsive and direct known-account payment'
    );
    // All accessible module routes and responsive views with real server responses.
    for (const [name, url] of [
      ['overview', '/operational-overview'],
      ['reports', '/operational-reports'],
      ['settings', '/restaurant'],
      ['users', '/users'],
      ['clients', '/clients'],
      ['tables', '/tables'],
      ['catalog', '/menu/products'],
      ['daily-menu', '/attention?tab=menu'],
      ['availability', '/attention?tab=catalog'],
      ['reservations', '/attention?tab=reservations'],
      ['settlements', '/finance?view=shifts'],
      ['history', '/orders/list']
    ]) {
      await route(o, url);
      await o.waitForTimeout(500);
      for (const [width, height] of [
        [390, 844],
        [900, 1100],
        [1440, 900]
      ])
        await shot(o, name + '-' + width, width, height);
    }
    await route(o, '/operational-reports');
    await o.getByRole('button', { name: 'Hoy', exact: true }).click();
    await o.getByText(/resultados · consulta/).waitFor();
    await shot(o, 'report-results-mobile', 390, 844);
    await o.locator('.report-mobile-card').first().waitFor();
    checks.push('reports today preset and mobile detail cards');
    await shot(c, 'kitchen-TV', 1920, 1080);
    await shot(c, 'kitchen-mobile', 390, 844);
    // Server still imposes base roles and tenant scope.
    await api(cook, '/finance/shifts', 'GET', null, 403);
    await api(cook, '/attention-accounts', 'GET', null, 403);
    await api(
      { ...waiter, currentRestaurant: initial.currentRestaurant },
      '/attention-accounts',
      'GET',
      null,
      403
    );
    checks.push('cook finance/attention denied; cross-restaurant denied');
    assert.deepEqual(errors, []);
    assert.equal(
      [...navigations.values()].reduce((sum, n) => sum + n, 0),
      0
    );
    const after = await db.query('SELECT name FROM migrations ORDER BY id');
    assert.deepEqual(after, before);
    console.log(
      JSON.stringify(
        {
          result: 'PASS',
          checks,
          pageErrors: errors,
          fullReloads: 0,
          migrationsUnchanged: before.length,
          seedsExecuted: 0,
          roles: 4
        },
        null,
        2
      )
    );
  } catch (e) {
    if (browser)
      for (const [index, context] of browser.contexts().entries()) {
        const p = context.pages()[0];
        if (p)
          await p
            .screenshot({ path: path.join(output, `failure-${index}.png`) })
            .catch(() => {});
      }
    throw e;
  } finally {
    if (browser) await browser.close();
    if (db?.isInitialized) {
      if (tenant) {
        const [r] = await db.query(
          'SELECT identification FROM restaurants WHERE id=?',
          [tenant]
        );
        assert.equal(r.identification, 'UX-' + suffix);
        await db.query(
          'UPDATE attention_accounts SET mergedIntoId=NULL WHERE restaurantId=?',
          [tenant]
        );
        await db.query(
          'DELETE FROM delivery_events WHERE restaurantId=? AND correctsEventId IS NOT NULL',
          [tenant]
        );
        await db.query(
          'UPDATE consumption_lines SET parentLineId=NULL WHERE restaurantId=?',
          [tenant]
        );
        await db.query(
          'DELETE FROM gratuity_movements WHERE restaurantId=? AND sourceGratuityId IS NOT NULL',
          [tenant]
        );
        for (const table of [
          'internal_documents',
          'courier_cash_receipts',
          'courier_cash_custody',
          'offsite_fulfillments',
          'delivery_couriers',
          'payment_allocations',
          'consumption_discounts',
          'kitchen_notices',
          'reservations',
          'debt_installments',
          'refund_movements',
          'gratuity_movements',
          'shift_cash_movements',
          'shift_settlements',
          'account_debts',
          'payment_movements',
          'delivery_events',
          'kitchen_dispatch_items',
          'kitchen_dispatches',
          'consumption_lines',
          'account_responsibility_events',
          'account_table_assignments',
          'attention_accounts',
          'work_shifts',
          'portion_policies',
          'audit_events'
        ])
          await db.query(`DELETE FROM ${table} WHERE restaurantId=?`, [tenant]);
        await db.query('DELETE FROM restaurants WHERE id=?', [tenant]);
      }
      for (const id of users) {
        const [u] = await db.query('SELECT personId FROM users WHERE id=?', [
          id
        ]);
        await db.query(
          'DELETE FROM audit_events WHERE actorId=? OR resourceId=?',
          [id, id]
        );
        await db.query('DELETE FROM users WHERE id=?', [id]);
        if (u) await db.query('DELETE FROM people WHERE id=?', [u.personId]);
      }
      await db.destroy();
    }
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
