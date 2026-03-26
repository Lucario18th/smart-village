const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'assets', 'screenshots');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    args: ['--ignore-certificate-errors', '--no-sandbox']
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 1. Admin-Login und Dashboard
  await page.goto('https://localhost/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'login.png'), fullPage: false });

  // Login durchführen (Seed-Credentials)
  try {
    await page.fill('input[type="email"]', 'admin@smartvillage.de');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 });
  } catch(e) {
    console.log('Login failed or already logged in:', e.message);
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-dashboard.png'), fullPage: false });
  console.log('✓ admin-dashboard.png');

  // 2. Geräte / Sensor-Übersicht
  try {
    await page.goto('https://localhost/admin/devices', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-devices.png'), fullPage: false });
    console.log('✓ admin-devices.png');
  } catch(e) { console.log('devices page skipped:', e.message); }

  // 3. Sensor-Übersicht
  try {
    await page.goto('https://localhost/admin/sensors', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-sensors.png'), fullPage: false });
    console.log('✓ admin-sensors.png');
  } catch(e) { console.log('sensors page skipped:', e.message); }

  // 4. Öffentliche Kartenansicht
  await page.goto('https://localhost', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000); // Karte braucht Zeit zum Laden
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'map-view.png'), fullPage: false });
  console.log('✓ map-view.png');

  // 5. Öffentliche Village-Übersicht / Startseite
  try {
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'public-overview.png'), fullPage: true });
    console.log('✓ public-overview.png');
  } catch(e) { console.log('public overview skipped:', e.message); }

  await browser.close();
  console.log('\n✓ All screenshots saved to docs/assets/screenshots/');
})();
