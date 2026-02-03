/**
 * Maakt een screenshot van de PWA op http://localhost:3000
 * Start eerst de app met "Start parking app.bat" of: npx serve public
 */
const { chromium } = require('playwright');
const path = require('path');

const URL = process.env.SCREENSHOT_URL || 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'screenshot.png');

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: OUT, fullPage: false });
    console.log('Screenshot opgeslagen:', OUT);
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error('Screenshot mislukt. Draait de app op', URL, '?');
  console.error(err.message);
  process.exit(1);
});
