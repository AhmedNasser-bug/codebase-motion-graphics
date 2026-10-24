#!/usr/bin/env node
/**
 * Motion verification gate. Fails (exit 2) if the video contains static stretches.
 * Usage: node motion_gate.mjs <video.mp4> [maxStaticSeconds=1.5] [sampleFps=4]
 * Samples frames, measures mean abs luma diff between consecutive samples,
 * and reports the longest run of "frozen" samples.
 */
import { spawnSync } from "child_process";

const [file, maxStatic = "1.5", sfps = "4"] = process.argv.slice(2);
if (!file) { console.log("usage: motion_gate.mjs <video> [maxStaticSeconds] [sampleFps]"); process.exit(1); }
const W = 96, H = 54, fps = +sfps;
const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-vf", `fps=${fps},scale=${W}:${H},format=gray`, "-f", "rawvideo", "-"],
  { maxBuffer: 1 << 29 });
const buf = r.stdout, n = Math.floor(buf.length / (W * H));
const FROZEN = 0.35; // mean luma diff (0-255) below which two samples count as identical
let run = 0, longest = 0, diffs = [];
for (let i = 1; i < n; i++) {
  let s = 0;
  for (let p = 0; p < W * H; p++) s += Math.abs(buf[i * W * H + p] - buf[(i - 1) * W * H + p]);
  const d = s / (W * H);
  diffs.push(d);
  if (d < FROZEN) { run++; longest = Math.max(longest, run); } else run = 0;
}
const longestSec = longest / fps;
const avg = diffs.reduce((a, b) => a + b, 0) / Math.max(1, diffs.length);
const frozenPct = (diffs.filter(d => d < FROZEN).length / Math.max(1, diffs.length)) * 100;
console.log(JSON.stringify({ file, samples: n, avgDiff: +avg.toFixed(2), frozenPct: +frozenPct.toFixed(1), longestStaticSec: longestSec }));
if (longestSec > +maxStatic || frozenPct > 10) { console.error("MOTION GATE FAILED"); process.exit(2); }
console.log("MOTION GATE PASSED");
