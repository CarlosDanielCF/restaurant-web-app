/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- CommonJS executable, consistent with existing browser tests. */
// Read-only visual smoke against EXISTING demo data. No seeds or business writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  assert.ok(
    process.env.DEMO_PASSWORD,
    'Set DEMO_PASSWORD for an existing demo user'
  );
  const output = process.env.VISUAL_OUTPUT || '/tmp/restaurant-cycle3';
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox']
  });
  const errors = [],
    blocked = [],
    httpErrors = [],
    consoleErrors = [];
  let checks = 0;
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('response', (r) => {
      if (r.status() >= 400 && r.url().includes('/api/'))
        httpErrors.push(`${r.status()} ${new URL(r.url()).pathname}`);
    });
    await page.route('**/api/**', async (route) => {
      const r = route.request();
      if (
        !['GET', 'HEAD', 'OPTIONS'].includes(r.method()) &&
        !new URL(r.url()).pathname.startsWith('/api/auth/')
      ) {
        blocked.push(`${r.method()} ${new URL(r.url()).pathname}`);
        return route.abort();
      }
      return route.continue();
    });
    const shot = async (name) => {
      await page.waitForTimeout(700);
      const overflow = await page.evaluate(() => ({
        viewport: innerWidth,
        body: document.documentElement.scrollWidth,
        content: document.querySelector('[data-testid="app-content"]')
          ? {
              width: document.querySelector('[data-testid="app-content"]')
                .clientWidth,
              scroll: document.querySelector('[data-testid="app-content"]')
                .scrollWidth
            }
          : null
      }));
      assert.ok(
        overflow.body <= overflow.viewport + 1,
        `${name} body overflow: ${JSON.stringify(overflow)}`
      );
      assert.ok(
        !overflow.content ||
          overflow.content.scroll <= overflow.content.width + 1,
        `${name} content overflow: ${JSON.stringify(overflow)}`
      );
      assert.ok(
        (await page.locator('body').innerText()).trim().length > 30,
        `${name} blank`
      );
      await page.screenshot({
        path: path.join(output, name + '.png'),
        fullPage: true
      });
      const surface = await page.locator('[data-testid="app-content"]').count();
      if (surface) {
        assert.equal(
          await page
            .locator('[data-testid="app-content"]')
            .evaluate((e) => getComputedStyle(e).backgroundColor),
          'rgb(242, 246, 248)'
        );
        assert.equal(
          await page
            .locator('.pos-header')
            .evaluate((e) => Math.round(e.getBoundingClientRect().height)),
          56
        );
      }
      checks++;
    };
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:3030/auth/login');
    await page.locator('input[name=username]').waitFor();
    await shot('login-mobile');
    await page.setViewportSize({ width: 1440, height: 900 });
    await shot('login-desktop');
    await page
      .locator('input[name=username]')
      .fill(process.env.DEMO_USERNAME || 'demo_f10_owner');
    await page.locator('input[name=password]').fill(process.env.DEMO_PASSWORD);
    await page.locator('button[type=submit]').click();
    await page.waitForURL((u) => !u.pathname.includes('/auth'));
    const routes = [
      '/attention',
      '/kitchen',
      '/finance',
      '/operational-overview',
      '/operational-reports',
      '/internal-documents',
      '/restaurant',
      '/users',
      '/clients',
      '/tables',
      '/menu/sections',
      '/orders/list'
    ];
    for (const [width, height] of [
      [390, 844],
      [900, 1100],
      [1440, 900]
    ]) {
      await page.setViewportSize({ width, height });
      for (const route of routes) {
        await page.goto('http://127.0.0.1:3030' + route);
        await page.locator('[data-testid="app-content"]').waitFor();
        await shot(`${width}-${route.replaceAll('/', '-')}`);
        if (route === '/attention') {
          for (const tab of [
            'Reservas',
            'Menú Compuesto',
            'Carta y Disponibilidad'
          ]) {
            await page
              .getByRole('tab', { name: new RegExp('^' + tab + '$', 'i') })
              .click();
            await shot(`${width}-${tab.replaceAll(' ', '-')}`);
          }
        }
      }
    }
    // Exercise local selection/search with existing demo data, without opening accounts.
    await page.goto('http://127.0.0.1:3030/attention');
    const tables = page.locator(
      '.table-choice-grid input[type="checkbox"]:enabled'
    );
    await tables.first().waitFor();
    assert.ok((await tables.count()) >= 2, 'Demo needs two available tables');
    await tables.nth(0).check();
    await tables.nth(1).check();
    assert.equal(
      await page.locator('.point-table-tile[data-state="selected"]').count(),
      2
    );
    await tables.nth(0).uncheck();
    await tables.nth(1).uncheck();
    await page.getByRole('tab', { name: /Carta y disponibilidad/i }).click();
    const search = page.getByLabel('Buscar producto');
    await search.fill('__no_matching_product__');
    assert.equal(await page.locator('.service-product').count(), 0);
    await page
      .getByText('Sin productos en esta selección', { exact: true })
      .waitFor();
    await search.fill('');
    assert.ok((await page.locator('.service-product').count()) > 0);
    checks += 3;
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://127.0.0.1:3030/kitchen');
    await page.getByText('Cocina · comandas', { exact: true }).waitFor();
    await shot('1920-kitchen');
    assert.ok((await page.locator('.kitchen-ticket').count()) <= 3);
    if (!(await page.locator('.kitchen-ticket').count()))
      assert.equal(await page.getByText(/Página 1/).count(), 0);
    assert.deepEqual(errors, [], 'Uncaught JS errors');
    assert.deepEqual(blocked, [], 'Unexpected business mutation attempted');
    const report = {
      checks,
      uncaughtErrors: errors,
      blockedMutations: blocked,
      httpErrors: [...new Set(httpErrors)],
      consoleErrors: [...new Set(consoleErrors)]
    };
    fs.writeFileSync(
      path.join(output, 'results.json'),
      JSON.stringify(report, null, 2)
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
