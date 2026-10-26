import { chromium } from 'playwright-core';
import path from 'path';
import { pathToFileURL } from 'url';

async function testTemplate(templateRelPath) {
  console.log(`\n=== Testing ${templateRelPath} ===`);
  const fullPath = path.resolve(templateRelPath);
  const fileUrl = pathToFileURL(fullPath).href;

  let browser;
  for (const channel of ['chrome', 'msedge']) {
    try {
      browser = await chromium.launch({
        channel,
        headless: true,
        args: [
          '--allow-file-access-from-files',
          '--disable-web-security',
          '--enable-gpu',
          '--use-gl=angle',
          '--use-angle=d3d11'
        ]
      });
      break;
    } catch {}
  }

  if (!browser) {
    throw new Error('Could not launch Chrome or Edge');
  }

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const logs = [];
  const errors = [];

  page.on('console', msg => logs.push(msg.text()));
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  const testTimes = [0, 1.0, 3.5, 7.5, 12.0];
  const results = [];

  for (const t of testTimes) {
    const res = await page.evaluate(time => {
      if (typeof window.seekTo !== 'function') {
        return { error: 'window.seekTo is not a function' };
      }
      window.seekTo(time);
      const cv = document.getElementById('c');
      if (!cv) return { error: 'Canvas #c not found' };
      const data = cv.toDataURL('image/jpeg', 0.85);
      return { t: time, length: data.length, startsWith: data.slice(0, 30) };
    }, t);
    results.push(res);
  }

  await browser.close();

  console.log('Errors:', errors.length ? errors : 'None');
  console.log('Results:', results);
  const passed = errors.length === 0 && results.every(r => r.length > 5000);
  console.log(`Status for ${templateRelPath}:`, passed ? 'PASS' : 'FAIL');
  return passed;
}

const t1 = await testTemplate('scripts/templates/macbook_3d_template.html');
const t2 = await testTemplate('scripts/templates/mobile_device_template.html');

const allOk = t1 && t2;
console.log('\n=======================================');
console.log('OVERALL TEMPLATE TEST STATUS:', allOk ? 'ALL PASSED' : 'SOME FAILED');
console.log('=======================================');
process.exit(allOk ? 0 : 1);
