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
    owned = await fixture('phase9_browser');
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
      name: 'Plato documento navegador',
      categoryId: catalog[0].categoryId,
      price: 20,
      kind: 'FOOD',
      trackStock: false
    });
    let account = await req('/attention-accounts', 'POST', {
      modality: 'TAKE_AWAY',
      tableIds: [],
      responsibleUserId: waiter.id
    });
    account = await req(`/attention-accounts/${account.id}/lines`, 'POST', {
      expectedVersion: account.version,
      sourceType: 'PRODUCT',
      sourceId: product.id,
      quantity: 1
    });
    await req(`/attention-accounts/${account.id}/confirm`, 'POST', {
      expectedVersion: account.version
    });
    const workerSession = await call('/auth/login', 'POST', {
      username,
      password
    });
    const wr = (path, method = 'GET', body) =>
      call(path, method, body, workerSession.token, tenant);
    const shift = await wr('/finance/shifts', 'POST', { workerId: waiter.id });
    account = await req(`/attention-accounts/${account.id}`);
    await wr(`/finance/accounts/${account.id}/payments`, 'POST', {
      expectedVersion: account.version,
      shiftId: shift.shift.id,
      payments: [
        { method: 'CASH', amount: '10.00', receivedAmount: '20.00' },
        {
          method: 'CARD',
          amount: '10.00',
          receivedAmount: '10.00',
          manuallyConfirmed: true
        }
      ]
    });
    b = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await b.newPage({ viewport: { width: 1440, height: 900 } }),
      errors = [],
      resources = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (
        m.type() === 'error' &&
        !m.text().startsWith('Failed to load resource:')
      )
        errors.push(m.text());
    });
    page.on('response', (r) => {
      if (r.status() >= 400)
        resources.push({ status: r.status(), url: r.url() });
    });
    await page.goto(frontend + '/auth/login');
    await page.getByLabel('Nombre de usuario').fill(owned.username);
    await page.locator('input[name="password"]').fill(owned.password);
    const loginResponse = page.waitForResponse(
      (r) => r.url().endsWith('/auth/login') && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    const loginResult = await loginResponse;
    if (loginResult.status() !== 200)
      throw Error(
        'Login failed: ' +
          loginResult.status() +
          ' ' +
          (await loginResult.text())
      );
    await page.waitForURL((u) => !u.pathname.includes('/auth/'));
    await page.goto(frontend + '/internal-documents');
    await page.getByLabel('Atención para documento').click();
    await page
      .getByRole('option', { name: new RegExp(account.id.slice(0, 8)) })
      .click();
    let response = page.waitForResponse(
      (r) =>
        r.url().includes('/internal-documents/accounts/') &&
        r.request().method() === 'POST'
    );
    await page
      .getByRole('button', { name: 'Emitir cuenta previa', exact: true })
      .click();
    if ((await response).status() !== 201)
      throw Error('Account document failed');
    await page
      .getByRole('heading', { name: 'DOCUMENTO INTERNO', exact: true })
      .first()
      .waitFor();
    response = page.waitForResponse(
      (r) =>
        r.url().includes('/internal-documents/accounts/') &&
        r.request().method() === 'POST'
    );
    await page
      .getByRole('button', { name: 'Emitir ticket interno', exact: true })
      .click();
    if ((await response).status() !== 201) throw Error('Ticket failed');
    await page
      .getByText(/recibido 20.00.*vuelto 10.00/)
      .first()
      .waitFor();
    await page.evaluate(() => {
      window.print = () => {
        window.__printed = true;
      };
    });
    response = page.waitForResponse(
      (r) => r.url().endsWith('/reprint') && r.request().method() === 'POST'
    );
    await page
      .getByRole('button', { name: 'Imprimir documento interno', exact: true })
      .click();
    if ((await response).status() !== 201) throw Error('Print audit failed');
    await page.waitForFunction(() => window.__printed === true);
    await page.emulateMedia({ media: 'print' });
    const printStyle = await page.evaluate(() => ({
      root: getComputedStyle(document.getElementById('root')).display,
      print: getComputedStyle(
        document.getElementById('print-internal-document')
      ).display
    }));
    if (printStyle.root !== 'none' || printStyle.print !== 'block')
      throw Error(JSON.stringify(printStyle));
    await page.screenshot({
      path: '/workspace/cloud-setup/phase9-print-browser.png'
    });
    await page.pdf({
      path: '/workspace/cloud-setup/phase9-internal-ticket.pdf',
      format: 'A4',
      printBackground: true
    });
    const printedText = require('child_process').execFileSync(
      'pdftotext',
      ['/workspace/cloud-setup/phase9-internal-ticket.pdf', '-'],
      { encoding: 'utf8' }
    );
    if (
      !printedText.includes('DOCUMENTO INTERNO') ||
      !printedText.includes('Plato documento navegador') ||
      printedText.includes('Emitir cuenta previa')
    )
      throw Error(
        'Printable content is missing/clipped or includes navigation'
      );
    await page.emulateMedia({ media: 'screen' });
    for (const viewport of [
      { width: 900, height: 1100 },
      { width: 390, height: 844 }
    ]) {
      await page.setViewportSize(viewport);
      await page
        .getByRole('heading', { name: 'DOCUMENTO INTERNO', exact: true })
        .first()
        .waitFor();
    }
    await page.getByLabel('Formato de impresión').click();
    await page
      .getByRole('option', { name: 'Ticket 80 mm (preparación)' })
      .click();
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: '/workspace/cloud-setup/phase9-thermal-ticket.pdf',
      width: '80mm',
      height: '297mm',
      printBackground: true
    });
    await page.emulateMedia({ media: 'screen' });
    await page.goto(frontend + '/operational-reports');
    await page
      .locator('[data-testid=app-content]')
      .getByText('Reportes operativos', { exact: true })
      .waitFor();
    await page
      .getByText('Plato documento navegador', { exact: true })
      .waitFor();
    await page.getByLabel('Reporte', { exact: true }).click();
    await page
      .getByRole('option', { name: 'Cobros y métodos', exact: true })
      .click();
    await page.getByLabel('Método', { exact: true }).click();
    await page.getByRole('option', { name: 'Efectivo', exact: true }).click();
    response = page.waitForResponse(
      (r) =>
        r.url().includes('/operational-reports/collections?') &&
        r.url().includes('method=CASH')
    );
    await page.getByRole('button', { name: 'Aplicar filtros' }).click();
    if ((await response).status() !== 200) throw Error('Filter failed');
    await page.screenshot({
      path: '/workspace/cloud-setup/phase9-mobile-report.png',
      fullPage: true
    });
    const unexpected = resources.filter(
      (r) =>
        !(r.status === 401 && r.url.endsWith('/auth/auth-renew')) &&
        !(r.status === 404 && r.url.endsWith('/cash-register/actives'))
    );
    if (errors.length || unexpected.length)
      throw Error(JSON.stringify({ errors, unexpected }));
    console.log(
      'F9 browser: documents, ticket, mixed cash/card, change, audited print, A4/80mm PDFs, report filters, desktop 1440x900, tablet 900x1100, mobile 390x844; no new page/API errors'
    );
  } finally {
    if (b) await b.close();
    if (owned) await owned.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
