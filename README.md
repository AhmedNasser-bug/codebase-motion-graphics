# Codebase Motion Graphics (`codebase-motion-graphics`)

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GPU Accelerated](https://img.shields.io/badge/GPU-NVENC%20%2F%20Direct3D11-brightgreen.svg)]()
[![Deterministic Render](https://img.shields.io/badge/Render-600%20frames%20%40%2025fps-orange.svg)]()
[![Motion Gate](https://img.shields.io/badge/Motion%20Gate-Verified-success.svg)]()
[![p5.js + Three.js](https://img.shields.io/badge/3D%20%26%20Generative-p5.js%20%2B%20Three.js-purple.svg)]()

Turn any codebase into a **real motion graphic**: components move, service meshes rotate in 3D, generative noise fields react, and architectures explain themselves every second of the video, rendered in a bespoke visual language derived directly from the project's identity.

> **Zero static slideshow holds.** No frame duplication tricks (`-loop 1`, `ffconcat duration`). Every single frame is rendered with parallel GPU workers and verified by an automated luma-delta motion gate.

---

## Motion Graphics Libraries & Specialized Skill Orchestration

The skill natively integrates industry-standard motion graphics engines with specialized agent skills:

### 1. Generative Backgrounds & Particle Physics: `p5.js` + `/algorithmic-art`
* **Skill Integration:** Calls `/algorithmic-art` to establish an algorithmic philosophy (e.g. *Quantum Harmonics*, *Organic Turbulence*, *Emergent Stillness*) before sketching.
* **p5.js Pipeline:** Runs in instance mode (`new p5(sketch)`) with `p.noLoop()` and a deterministic `p.drawFrameAt(t)`.
* **Visual Output:** Seeded vector flow fields (`p.noise()`), particle swarm simulations, organic density wavemaps, recursive AST tree growth, and mathematical manifolds.
* **Template:** `scripts/templates/p5_storyboard_template.html`.

### 2. 3D Spatial Topologies & Service Meshes: `Three.js` + `/canvas-design`
* **Skill Integration:** Employs `/canvas-design` principles for visual balance, focal points, camera projection, and lighting hierarchy.
* **Three.js WebGL Pipeline:** Accelerated directly on discrete hardware via `THREE.WebGLRenderer({ alpha: true, antialias: true })`.
* **Visual Output:** 3D microservice cluster orbits, dynamic mesh lines, volumetric database cylinders, and camera flight paths through architectural layers.
* **Template:** `scripts/templates/threejs_storyboard_template.html`.

### 3. Kinetic Typographic & Card Transitions: `GSAP` + `/frontend-design`
* **Skill Integration:** Involves `/frontend-design` for deliberate, non-templated typography pairings and micro-interactions.
* **GSAP Animation Pipeline:** Employs GSAP `CustomEase` and deterministic timelines (`tl.seek(t)`) or pure math functions in `motion_kit.js`.
* **Visual Output:** Spring overshoots (`E.back`), stagger reveals across file trees, and live metric counters.

### 4. Bespoke UI Mockups & Design Tokens: `StitchMCP`
* **Token Extraction:** Calls `list_projects` / `get_project` to harvest `designTheme` and `designMd` tokens.
* **Screen Generation:** Calls `generate_screen_from_text` to generate high-fidelity UI dashboards for CLI or backend projects, downloading them via `download_file` to composite directly into the WebGL / 2D canvas.

### 5. Layout & Composition Hierarchy: `/poster-design`
* **Skill Integration:** Guides scene titles, hero typography, negative space, and outro card seals for agency-grade visual impact.

---

## Architecture Pipeline

```mermaid
flowchart LR
  A[User Prompt / Codebase] --> B[Phase 1: Recon & RTK Analysis]
  B --> C[Phase 2: Library Selection p5 / Three.js / Canvas]
  C --> D[Phase 3: /algorithmic-art + StitchMCP Tokens]
  D --> E[Phase 4: storyboard.html + seekTo t]
  E --> F[Phase 5: GPU render_parallel.mjs]
  F --> G[Phase 6: motion_gate.mjs QA]
  G -->|Pass| H[Deliver 1080p MP4 + Stills]
  G -->|Fail| E
```

---

## Installation & Setup

### Option A: Install as an Agent Skill
To add this skill to your agent environment:
```bash
# Via skills.sh package manager
npx skills add AhmedNasser-bug/codebase-motion-graphics -g -y

# Or clone directly into your agent skills directory
git clone https://github.com/AhmedNasser-bug/codebase-motion-graphics.git ~/.agents/skills/codebase-motion-graphics
```

### Option B: Standalone CLI Usage
Clone the repository and install dependencies:
```bash
git clone https://github.com/AhmedNasser-bug/codebase-motion-graphics.git
cd codebase-motion-graphics
npm install
npm run check-env
```

---

## Quickstart: Creating a Motion Graphic

### 1. Build your Storyboard
Choose from the built-in starter templates in `scripts/templates/`:
* `storyboard_template.html` (Standard 2D Canvas + `motion_kit.js`)
* `p5_storyboard_template.html` (p5.js Flow Field + HUD)
* `threejs_storyboard_template.html` (Three.js 3D Service Mesh + HUD)

Example using `motion_kit.js`:
```html
<canvas id="c" width="1920" height="1080"></canvas>
<script src="motion_kit.js"></script>
<script>
  const c = document.getElementById('c').getContext('2d');
  const vis = (t, a, b, f = 0.35) => seg(t, a, a + f) * (1 - seg(t, b - f, b));

  window.seekTo = function(t) {
    // 1. Draw always-on background motion (p5, Three.js, or Canvas)
    // 2. Draw scene elements using vis(t, start, end)
  };

  window.seekTo(0);
</script>
```

### 2. Render with Discrete GPU Acceleration
```bash
node scripts/render_parallel.mjs storyboard.html output.mp4 20 30 1920 1080 3
```

### 3. Verify with the Motion Gate
```bash
npm run gate output.mp4
```
Guarantees zero static holds:
```json
{
  "file": "output.mp4",
  "samples": 80,
  "avgDiff": 7.53,
  "frozenPct": 0.0,
  "longestStaticSec": 0.0
}
MOTION GATE PASSED
```

---

## Benchmarked Projects

This engine has been battle-tested across 6 diverse production codebases:

| Project | Domain & Archetype | Render Time (NVENC) | Motion Gate |
|---|---|---|---|
| **Code Analysis** | Cybernetic Asymptotic Compiler (Obsidian & Cyan) | **25.5s** | **PASSED** (0.50s max static) |
| **livestar-portfolio** | The Living Newspaper Broadsheet (Astro v5 & GSAP) | **25.0s** | **PASSED** (0.00s max static) |
| **AIProject Part 2** | Tactical Heuristic Radar & 8-Queens / Sudoku CSP | **24.3s** | **PASSED** (0.25s max static) |
| **Algorithm-Analysis**| Algorithmic Neobrutalism (C# & Charting) | **28.2s** | **PASSED** (0.25s max static) |
| **DVLD System** | Bureaucratic Sovereign Slate (3-Tier Architecture) | **30.7s** | **PASSED** (0.25s max static) |
| **finals-qb** | Arcade Matrix Mastery (Next.js Exam Platform) | **27.5s** | **PASSED** (0.25s max static) |

---

## License

MIT License. Designed and maintained by Ahmed Nasser.
