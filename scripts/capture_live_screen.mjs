#!/usr/bin/env node
/**
 * Automated Playwright Live Screen Capture Utility
 * Captures pixel-perfect, high-DPI screenshots from live web applications for 3D staging.
 *
 * Usage:
 *   node scripts/capture_live_screen.mjs <url> <output_path> [options]
 *
 * Options:
 *   --mobile          Emulate mobile device viewport (iPhone 16 Pro 393x852 @3x, touch)
 *   --width <n>       Custom viewport width (default: 1920 desktop, 393 mobile)
 *   --height <n>      Custom viewport height (default: 1080 desktop, 852 mobile)
 *   --delay <ms>      Additional wait time in ms after load (default: 1000)
 *   --scale <n>       Device scale factor (default: 2 for desktop, 3 for mobile)
 *   --full-page       Capture full scrollable page instead of viewport
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resilient playwright-core loader
let playwrightCore;
try {
  playwrightCore = await import('playwright-core');
} catch (e1) {
  try {
    const localScriptsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'node_modules/playwright-core/index.mjs');
    playwrightCore = await import(localScriptsPath);
  } catch (e2) {
    const globalPath = 'C:/Users/enjoy/.gemini/config/skills/codebase-motion-graphics/scripts/node_modules/playwright-core/index.mjs';
    playwrightCore = await import(globalPath);
  }
}

const { chromium } = playwrightCore;

// Browser launcher with channel fallback
async function launchBrowser() {
  const launchOptions = {
    headless: true,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--allow-running-insecure-content',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling'
    ]
  };

  // Try direct launch first
  try {
    return await chromium.launch(launchOptions);
  } catch (e) {
    // Fallback to installed system channels (Chrome / Edge)
    for (const channel of ['chrome', 'msedge']) {
      try {
        return await chromium.launch({ ...launchOptions, channel });
      } catch {
        // Continue trying
      }
    }
    throw new Error(`Failed to launch browser: ${e.message}`);
  }
}

function parseArgs(args) {
  const flags = {
    url: null,
    outputPath: null,
    mobile: false,
    width: null,
    height: null,
    delay: 1000,
    scale: null,
    fullPage: false
  };

  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--mobile') {
      flags.mobile = true;
    } else if (arg === '--full-page' || arg === '--fullpage') {
      flags.fullPage = true;
    } else if (arg === '--width' && i + 1 < args.length) {
      flags.width = parseInt(args[++i], 10);
    } else if (arg === '--height' && i + 1 < args.length) {
      flags.height = parseInt(args[++i], 10);
    } else if (arg === '--delay' && i + 1 < args.length) {
      flags.delay = parseInt(args[++i], 10);
    } else if (arg === '--scale' && i + 1 < args.length) {
      flags.scale = parseFloat(args[++i]);
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }

  flags.url = positional[0] || null;
  flags.outputPath = positional[1] || null;

  return flags;
}

async function captureScreen() {
  const rawArgs = process.argv.slice(2);
  const options = parseArgs(rawArgs);

  if (!options.url || !options.outputPath) {
    console.error('Usage: node scripts/capture_live_screen.mjs <url> <output_path> [--mobile] [--width 1920] [--height 1080] [--delay 1000] [--full-page]');
    process.exit(1);
  }

  let targetUrl = options.url;
  if (!/^https?:\/\//i.test(targetUrl) && !/^file:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  const resolvedOutput = path.resolve(process.cwd(), options.outputPath);
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });

  const isMobile = options.mobile;
  const width = options.width || (isMobile ? 393 : 1920);
  const height = options.height || (isMobile ? 852 : 1080);
  const deviceScaleFactor = options.scale || (isMobile ? 3 : 2);

  console.log(`[Playwright Capture] Target: ${targetUrl}`);
  console.log(`[Playwright Capture] Mode: ${isMobile ? 'Mobile (iPhone 16 Pro)' : 'Desktop'}`);
  console.log(`[Playwright Capture] Viewport: ${width}x${height} @${deviceScaleFactor}x`);
  console.log(`[Playwright Capture] Output: ${resolvedOutput}`);

  let browser;
  try {
    browser = await launchBrowser();

    const contextOptions = {
      viewport: { width, height },
      deviceScaleFactor,
      isMobile,
      hasTouch: isMobile,
      userAgent: isMobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    };

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    // Navigate with networkidle fallback
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 25000 });
    } catch (navErr) {
      console.warn(`[Playwright Capture] networkidle wait timed out, falling back to domcontentloaded: ${navErr.message}`);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    }

    // Wait for web fonts to finish loading
    await page.evaluate(() => document.fonts ? document.fonts.ready : Promise.resolve());

    // Inject CSS to clean up UI: hide scrollbars, cookie banners, consent overlays
    await page.addStyleTag({
      content: `
        /* Hide scrollbars */
        ::-webkit-scrollbar { display: none !important; }
        * { scrollbar-width: none !important; }

        /* Hide common cookie consent popups and intrusive banners */
        #onetrust-consent-sdk,
        .cc-banner,
        .cookie-notice,
        .CookieConsent,
        [id*="cookie" i],
        [class*="cookie" i],
        [id*="consent" i],
        [class*="consent" i],
        [aria-label*="cookie" i],
        [aria-label*="consent" i],
        div[class*="cookie-banner" i],
        div[class*="consent-banner" i] {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `
    });

    // Optional delay for layout transitions, WebGL shaders, or client rehydration
    if (options.delay > 0) {
      await page.waitForTimeout(options.delay);
    }

    // Take screenshot
    await page.screenshot({
      path: resolvedOutput,
      fullPage: options.fullPage,
      type: 'png'
    });

    const stats = fs.statSync(resolvedOutput);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`[Playwright Capture] SUCCESS: Saved ${sizeKB} KB to ${resolvedOutput}`);

    await context.close();
  } catch (err) {
    console.error(`[Playwright Capture] FAILED: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

captureScreen();
