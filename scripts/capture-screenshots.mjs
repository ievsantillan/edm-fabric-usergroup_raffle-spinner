// One-off Playwright script to capture README screenshots at mobile width.
//
// Prerequisites (these are not in package.json on purpose — this script is
// run rarely, e.g. when the UI changes or the test dataset is refreshed):
//   npm install --no-save playwright
//   npx playwright install chromium
//
// Then, in a separate terminal start the dev server (`npm run dev`) and run:
//   node scripts/capture-screenshots.mjs
//
// Output: overwrites the three PNGs under public/ that the README references.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const CSV_PATH = path.join(PUBLIC_DIR, 'test-participants.csv');
const APP_URL = 'http://localhost:5173/';

const VIEWPORT = { width: 390, height: 844 }; // iPhone 14 portrait

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2, // crisper PNGs
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  // Suppress confirm() so handleStartFresh-style prompts don't block us.
  page.on('dialog', (d) => d.accept());

  console.log('-> navigating');
  await page.goto(APP_URL, { waitUntil: 'networkidle' });

  // 1) MAIN: upload step — landing screen with file dropzone.
  await page.waitForSelector('.drop-text');
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(PUBLIC_DIR, 'edm-fabric-usergroup-raffle-spinner_main.png'),
  });
  console.log('-> captured main');

  // 2) Upload CSV via the hidden file input.
  const fileInput = page.locator('input[type=file]');
  await fileInput.setInputFiles(CSV_PATH);

  // Wait for column selector to render, then pick "Name".
  await page.waitForSelector('#col-select');
  await page.selectOption('#col-select', 'Name');

  // Wait for the slot machine SPIN button to be ready.
  await page.waitForSelector('.spin-button:not([disabled])');
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(PUBLIC_DIR, 'edm-fabric-usergroup-raffle-spinner_spinner.png'),
  });
  console.log('-> captured spinner');

  // 3) Spin and capture the winner overlay.
  await page.click('.spin-button');
  // SlotMachine spin duration is 4000ms; winner overlay shows after.
  await page.waitForSelector('.winner-overlay', { timeout: 10_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(PUBLIC_DIR, 'edm-fabric-usergroup-raffle-spinner_winner.png'),
  });
  console.log('-> captured winner');

  await browser.close();
  console.log('done');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
