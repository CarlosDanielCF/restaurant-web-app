const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox']
  });
  try {
    const page = await browser.newPage();
    const modules = new Set();
    page.on('request', (r) => {
      if (r.url().includes('/src/')) modules.add(r.url());
    });
    await page.goto('http://127.0.0.1:3030/auth/login');
    await page.locator('input[name=username]').waitFor();
    assert.ok(
      modules.size < 150,
      `Login loaded ${modules.size} source modules`
    );
    assert.equal(
      [...modules].some((u) => u.includes('/Private/router/')),
      false
    );
    const delayed = await browser.newPage();
    await delayed.clock.install();
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await delayed.route('**/src/main.tsx', async (route) => {
      await gate;
      await route.continue();
    });
    await delayed.goto('http://127.0.0.1:3030/auth/login', {
      waitUntil: 'commit'
    });
    await delayed.locator('#startup-status').waitFor();
    await delayed.clock.fastForward(21000);
    assert.match(
      await delayed.locator('#startup-message').innerText(),
      /terminal de Vite/
    );
    release();
    await delayed.locator('input[name=username]').waitFor();
    assert.equal(await delayed.locator('#startup-status').count(), 0);
    const occupied = spawnSync(
      process.execPath,
      ['node_modules/vite/bin/vite.js', '--host'],
      {
        cwd: require('node:path').resolve(__dirname, '..'),
        encoding: 'utf8',
        timeout: 10000
      }
    );
    assert.equal(occupied.status, 1);
    assert.match(
      occupied.stdout + occupied.stderr,
      /Port 3030 is already in use/
    );
    console.log(
      `Startup passed: ${modules.size} source modules, no private router at login; delayed bootstrap visible and recovers; occupied 3030 fails without drifting to 3031.`
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
