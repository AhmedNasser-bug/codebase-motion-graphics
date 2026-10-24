#!/usr/bin/env node
/**
 * GPU-Accelerated Parallel Frame-Exact Renderer (NVIDIA NVENC / Intel QSV / AMD AMF + Chromium D3D11 GPU Canvas)
 * Usage: node render_parallel.mjs <storyboard.html> <out.mp4> [duration=20] [fps=30] [w=1920] [h=1080] [workers=3]
 * Every single frame is rendered via window.seekTo(tSeconds). Zero static holds.
 */
import { chromium } from "playwright-core";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn, spawnSync, execFileSync } from "child_process";
import { pathToFileURL } from "url";

const GPU_ARGS = [
  "--force_high_performance_gpu",
  "--enable-gpu",
  "--enable-gpu-rasterization",
  "--enable-oop-rasterization",
  "--enable-accelerated-2d-canvas",
  "--enable-zero-copy",
  "--ignore-gpu-blocklist",
  "--use-gl=angle",
  "--use-angle=d3d11",
  "--disable-renderer-backgrounding",
  "--disable-background-timer-throttling",
  "--allow-file-access-from-files",
  "--disable-web-security",
];

function detectHwEncoder() {
  for (const enc of ["h264_nvenc", "h264_qsv", "h264_amf"]) {
    const r = spawnSync("ffmpeg", [
      "-v", "error", "-f", "lavfi", "-i", "color=c=black:s=256x256:d=0.1:r=30",
      "-c:v", enc, "-pix_fmt", "yuv420p", "-f", "null", "-"
    ]);
    if (r.status === 0) return enc;
  }
  return "libx264";
}

function encoderFlags(enc) {
  if (enc === "h264_nvenc") return ["-c:v", "h264_nvenc", "-preset", "p4", "-cq", "19", "-pix_fmt", "yuv420p"];
  if (enc === "h264_qsv") return ["-c:v", "h264_qsv", "-global_quality", "19", "-pix_fmt", "yuv420p"];
  if (enc === "h264_amf") return ["-c:v", "h264_amf", "-quality", "balanced", "-pix_fmt", "yuv420p"];
  return ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p"];
}

async function launchBrowser() {
  for (const channel of ["chrome", "msedge"]) {
    try {
      return await chromium.launch({ channel, headless: true, args: GPU_ARGS });
    } catch { /* try next */ }
  }
  throw new Error("Neither Chrome nor Edge found.");
}

async function renderSegment({ browser, url, from, to, fps, w, h, enc, outFile }) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts && document.fonts.ready);

  const ff = spawn("ffmpeg", [
    "-y", "-f", "image2pipe", "-vcodec", "mjpeg", "-r", String(fps), "-i", "-",
    ...encoderFlags(enc), outFile
  ], { stdio: ["pipe", "ignore", "ignore"] });
  const done = new Promise((res, rej) => ff.on("close", c => c === 0 ? res() : rej(new Error("ffmpeg exit " + c))));

  // Fast path: if storyboard has a single full-screen <canvas id="c">, encode JPEG on GPU canvas inside page
  const hasCanvas = await page.evaluate(() => {
    const el = document.getElementById("c");
    return !!(el && el.tagName === "CANVAS");
  });

  if (hasCanvas) {
    await page.exposeFunction("__writeFrame", async (b64) => {
      const buf = Buffer.from(b64, "base64");
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    });
    await page.evaluate(async ({ from, to, fps }) => {
      const cv = document.getElementById("c");
      for (let f = from; f < to; f++) {
        window.seekTo(f / fps);
        const dataUrl = cv.toDataURL("image/jpeg", 0.92);
        await window.__writeFrame(dataUrl.slice(23));
      }
    }, { from, to, fps });
  } else {
    for (let f = from; f < to; f++) {
      await page.evaluate(t => window.seekTo(t), f / fps);
      const buf = await page.screenshot({ type: "jpeg", quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    }
  }

  ff.stdin.end();
  await done;
  await context.close();
}

export async function render({ html, out, duration = 20, fps = 30, w = 1920, h = 1080, workers = 3 }) {
  const t0 = Date.now();
  const enc = detectHwEncoder();
  const total = Math.round(duration * fps);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cmg-"));
  const url = pathToFileURL(path.resolve(html)).href;
  const per = Math.ceil(total / workers);

  // Share ONE GPU-enabled browser across parallel worker contexts
  const browser = await launchBrowser();
  const gpuInfo = await (async () => {
    const p = await browser.newPage();
    const gl = await p.evaluate(() => {
      const c = document.createElement("canvas").getContext("webgl");
      const ext = c && c.getExtension("WEBGL_debug_renderer_info");
      return ext ? c.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "default";
    });
    await p.close();
    return gl;
  })();

  const jobs = [];
  for (let i = 0; i < workers; i++) {
    const from = i * per, to = Math.min(total, from + per);
    if (from >= to) continue;
    jobs.push(renderSegment({ browser, url, from, to, fps, w, h, enc, outFile: path.join(tmp, `seg${i}.mp4`) }));
  }
  await Promise.all(jobs);
  await browser.close();

  const list = fs.readdirSync(tmp).filter(f => f.startsWith("seg")).sort()
    .map(f => `file '${path.join(tmp, f).replace(/\\/g, "/")}'`).join("\n");
  fs.writeFileSync(path.join(tmp, "list.txt"), list);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", path.join(tmp, "list.txt"), "-c", "copy", path.resolve(out)], { stdio: "ignore" });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`rendered ${total} frames (${duration}s @ ${fps}fps) [GPU: ${gpuInfo} | Encoder: ${enc}] -> ${out} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

if (process.argv[1] && process.argv[1].endsWith("render_parallel.mjs")) {
  const [html, out, d, f, w, h, n] = process.argv.slice(2);
  if (!html || !out) { console.log("usage: render_parallel.mjs <html> <out.mp4> [duration] [fps] [w] [h] [workers]"); process.exit(1); }
  render({ html, out, duration: +d || 20, fps: +f || 30, w: +w || 1920, h: +h || 1080, workers: +n || 3 })
    .catch(e => { console.error(e); process.exit(1); });
}
