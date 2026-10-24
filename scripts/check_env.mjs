import { execSync } from 'child_process';
import fs from 'fs';

console.log('--- Codebase Motion Graphics: Environment Health Check ---');
console.log(`Node.js: ${process.version} (${process.platform} ${process.arch})`);

// 1. Check Playwright Core
try {
  let pw;
  try {
    pw = await import('playwright-core');
  } catch {
    // Check fallback locations
    const globalPath = 'C:/Users/enjoy/.gemini/config/skills/codebase-motion-graphics/scripts/node_modules/playwright-core/index.mjs';
    pw = await import(globalPath);
  }
  console.log('[OK] playwright-core is installed and loadable.');
} catch (e) {
  console.log('[INFO] playwright-core not yet found locally. Run `npm install` to install dependencies.');
}

// 2. Check FFmpeg
try {
  const ffmpegOut = execSync('ffmpeg -version', { encoding: 'utf8' }).split('\n')[0];
  console.log(`[OK] FFmpeg found: ${ffmpegOut}`);
  
  // Check NVENC
  const encoders = execSync('ffmpeg -encoders', { encoding: 'utf8' });
  if (encoders.includes('h264_nvenc')) {
    console.log(`[OK] Hardware Acceleration: NVIDIA NVENC (h264_nvenc) AVAILABLE`);
  } else if (encoders.includes('h264_qsv')) {
    console.log(`[OK] Hardware Acceleration: Intel QuickSync (h264_qsv) AVAILABLE`);
  } else {
    console.log(`[WARN] Hardware Acceleration: None detected, will fallback to libx264`);
  }
} catch (e) {
  console.error(`[FAIL] FFmpeg not found in PATH: ${e.message}`);
}

console.log('--- Environment Check Completed ---');
