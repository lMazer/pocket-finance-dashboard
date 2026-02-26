import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:34200';
const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('docs/prints');

const pages = [
  { path: '/dashboard', file: 'dashboard.png', waitFor: 'h2, .hero' },
  { path: '/transactions', file: 'transactions.png', waitFor: 'h2, .transactions-panel' },
  { path: '/categories', file: 'categories.png', waitFor: 'h2, .categories' },
  { path: '/budgets', file: 'budgets.png', waitFor: 'h2, .budgets' },
  { path: '/reports', file: 'reports.png', waitFor: 'h2, .reports' }
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function screenshot(page, route, filename, waitForSelector) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 15000 });
  }
  await page.screenshot({ path: path.join(outDir, filename), fullPage: true });
}

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[type=\"email\"], input[formcontrolname=\"email\"]', { timeout: 15000 });
  await page.fill('input[formcontrolname=\"email\"]', 'demo@pocket.local');
  await page.fill('input[formcontrolname=\"password\"]', 'demo123');
  await page.click('button[type=\"submit\"]');
  await page.waitForURL(/\/dashboard$/, { timeout: 15000 });
}

async function main() {
  await ensureDir(outDir);
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outDir, 'login.png'), fullPage: true });

  await login(page);
  for (const item of pages) {
    await screenshot(page, item.path, item.file, item.waitFor);
  }

  await browser.close();
  console.log(`Capturas salvas em ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
