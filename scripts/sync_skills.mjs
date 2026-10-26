import fs from 'fs';
import path from 'path';

const srcBase = 'C:/Users/enjoy/Documents/antigravity/calm-carson/codebase-motion-graphics';
const targetBases = [
  'C:/Users/enjoy/.gemini/config/skills/codebase-motion-graphics',
  'C:/Users/enjoy/.agents/skills/codebase-motion-graphics'
];

const filesToSync = [
  '.gitignore',
  'SKILL.md',
  'scripts/capture_live_screen.mjs',
  'scripts/test_templates.mjs',
  'scripts/templates/macbook_3d_template.html',
  'scripts/templates/mobile_device_template.html',
  'scripts/templates/assets/finals_qb_desktop.png',
  'scripts/templates/assets/finals_qb_mobile.png',
  'scripts/templates/vendor/three.min.js'
];

console.log('--- Starting Tri-Directory Skill Synchronization ---');

for (const targetBase of targetBases) {
  console.log(`\nTarget: ${targetBase}`);
  for (const relPath of filesToSync) {
    const srcFile = path.join(srcBase, relPath);
    const dstFile = path.join(targetBase, relPath);
    const dstDir = path.dirname(dstFile);

    if (!fs.existsSync(srcFile)) {
      console.error(`[ERROR] Source file missing: ${srcFile}`);
      continue;
    }

    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true });
    }

    fs.copyFileSync(srcFile, dstFile);
    const stats = fs.statSync(dstFile);
    console.log(`  [OK] ${relPath} (${stats.size} bytes)`);
  }
}

console.log('\n--- Synchronization Completed Successfully ---');
