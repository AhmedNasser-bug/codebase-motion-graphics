#!/usr/bin/env node
/**
 * Motion Graphics Codebase Video Renderer
 * Renders an animated HTML/CSS/Canvas storyboard frame-by-frame into a 1080p/720p 60fps MP4 video
 * Powered by Headless Chromium (Chrome/Edge) + FFmpeg image2pipe
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

// Discover installed playwright in common paths
function getChromium() {
  const possiblePaths = [
    "@playwright/test",
    "playwright",
    "D:/work/instructing/prblmslving/icpcpua/node_modules/@playwright/test"
  ];
  for (const p of possiblePaths) {
    try {
      const mod = require(p);
      if (mod.chromium) return mod.chromium;
    } catch (_) {}
  }
  throw new Error("Playwright not found in searched paths.");
}

export async function renderVideo({
  htmlPath,
  outputPath,
  durationSec = 20,
  fps = 30,
  width = 1920,
  height = 1080,
  quality = 90,
  onProgress = null,
}) {
  const chromium = getChromium();
  const totalFrames = Math.round(durationSec * fps);
  const outDir = path.dirname(path.resolve(outputPath));
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Attempt Chrome first, fallback to Edge
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    browser = await chromium.launch({ channel: "msedge", headless: true });
  }

  const page = await browser.newPage({ viewport: { width, height } });
  const fileUrl = path.isAbsolute(htmlPath) 
    ? `file:///${htmlPath.replace(/\\/g, "/")}`
    : `file:///${path.resolve(htmlPath).replace(/\\/g, "/")}`;

  await page.goto(fileUrl, { waitUntil: "networkidle" });

  const ffmpeg = spawn("ffmpeg", [
    "-y",
    "-f", "image2pipe",
    "-vcodec", "mjpeg",
    "-r", String(fps),
    "-i", "-",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "faster",
    "-crf", "19",
    outputPath
  ]);

  ffmpeg.stderr.on("data", () => {
    // Suppress verbose ffmpeg output, or log on error
  });

  const renderStart = Date.now();
  console.log(`[render_engine] Rendering ${totalFrames} frames (${durationSec}s @ ${fps}fps, ${width}x${height})...`);

  for (let f = 0; f < totalFrames; f++) {
    const t = f / fps;
    await page.evaluate((time) => {
      if (typeof window.seekTo === "function") {
        window.seekTo(time);
      }
    }, t);

    const frameBuf = await page.screenshot({ type: "jpeg", quality });
    ffmpeg.stdin.write(frameBuf);

    if (f % Math.max(1, Math.round(fps * 2)) === 0) {
      const pct = Math.round((f / totalFrames) * 100);
      const elapsed = ((Date.now() - renderStart) / 1000).toFixed(1);
      console.log(`[render_engine] Progress: ${pct}% (${f}/${totalFrames} frames, ${elapsed}s elapsed)`);
      if (onProgress) onProgress({ frame: f, totalFrames, percent: pct });
    }
  }

  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with error code ${code}`));
    });
  });

  await browser.close();
  const totalElapsed = ((Date.now() - renderStart) / 1000).toFixed(1);
  console.log(`[render_engine] Video successfully rendered to ${outputPath} in ${totalElapsed}s!`);
  return outputPath;
}

// CLI usage support
if (process.argv[1] && process.argv[1].endsWith("render_engine.mjs")) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: node render_engine.mjs <storyboard.html> <output.mp4> [durationSec] [fps] [width] [height]");
    process.exit(1);
  }
  const [htmlPath, outputPath, duration, fps, width, height] = args;
  renderVideo({
    htmlPath,
    outputPath,
    durationSec: duration ? parseFloat(duration) : 15,
    fps: fps ? parseInt(fps, 10) : 30,
    width: width ? parseInt(width, 10) : 1920,
    height: height ? parseInt(height, 10) : 1080
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
