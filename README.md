# ⚡ VisLab — Creative Coding Playground

A **single-file**, browser-based creative-coding environment built on top of [q5.js](https://q5js.org/) and [Tweakpane](https://tweakpane.github.io/docs/).  
No build step. No install. Open `index.html` and start coding.

🚀 **Live demo:** <https://sanjumsanthosh.github.io/vislab/>

---

## Table of Contents

- [What is VisLab?](#what-is-vislab)
- [Architecture Overview](#architecture-overview)
- [UI Layout](#ui-layout)
- [How It Works](#how-it-works)
- [Preamble Framework](#preamble-framework)
  - [Layout constants](#layout-constants)
  - [StepManager](#stepmanager)
  - [NodeSystem](#nodesystem)
  - [Sketch Patterns](#sketch-patterns)
  - [Tweakpane helpers](#tweakpane-helpers)
  - [Utility functions](#utility-functions)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Example Sketch](#example-sketch)
- [Running Locally](#running-locally)
- [Changelog](#changelog)
- [Contributing](#contributing)

---

## What is VisLab?

VisLab is a **self-contained creative-coding playground** for building interactive data-visualisation sketches.  
Everything — the editor, the canvas runtime, the control panel framework — lives in a single `index.html` file.

Key features:

| Feature | Detail |
|---------|--------|
| 🖊 **In-browser editor** | CodeMirror 5, Dracula theme, JS syntax highlight |
| 🎨 **Live canvas preview** | q5.js (p5-compatible, 8× lighter) |
| 🎛 **Interactive controls** | Tweakpane sliders, buttons, colour pickers |
| 📦 **Sandboxed execution** | Each run launches a fresh `<iframe>` |
| 📋 **Console capture** | `console.log/warn/error` forwarded to built-in pane |
| 📐 **Tutorial framework** | `StepManager`, layout zones, nav buttons |
| 🔒 **Zero dependencies** | All libraries loaded from CDN, no npm/build |
| ◀ **Collapsible editor** | Collapse the code panel for a full-width canvas view |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  <head>  CDN Imports                                 │  │
│  │    • q5.js         (creative-coding runtime)         │  │
│  │    • Tweakpane 3   (UI controls)                     │  │
│  │    • CodeMirror 5  (code editor)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  <body> — 3-zone UI layout                           │  │
│  │                                                      │  │
│  │  ┌─────────────┐   ┌──────────────────────────────┐  │  │
│  │  │ Editor Panel│   │     Preview Panel            │  │  │
│  │  │  (42 % wide)│   │      (flex: 1)               │  │  │
│  │  │             │   │                              │  │  │
│  │  │ CodeMirror  │   │  ┌────────────────────────┐  │  │  │
│  │  │  editor     │   │  │    <iframe> sandbox    │  │  │  │
│  │  │             │   │  │                        │  │  │  │
│  │  │ ─────────── │   │  │  q5.js sketch runs     │  │  │  │
│  │  │  Console    │   │  │  inside here           │  │  │  │
│  │  │  pane       │   │  │                        │  │  │  │
│  │  └─────────────┘   │  └────────────────────────┘  │  │  │
│  │                    │  fps display / status bar     │  │  │
│  │                    └──────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  <script id="preamble-src">  (auto-injected, hidden) │  │
│  │    LAYOUT constants, StepManager, Tweakpane helpers  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Execution pipeline

```
User types code
      │
      ▼
 ┌──────────────┐
 │  CodeMirror  │  ◄──  Ctrl+Enter / ▶ Run button
 │   editor     │
 └──────┬───────┘
        │  cm.getValue()
        ▼
 ┌──────────────────────────────────────┐
 │   Preamble (preamble-src script tag) │
 │   +  User code                       │
 └──────────────┬───────────────────────┘
                │  injected via doc.write()
                ▼
 ┌──────────────────────────┐
 │   <iframe> sandbox       │
 │                          │
 │  ┌──────────────────┐    │
 │  │  q5.js sketch    │    │
 │  │  setup() / draw()│    │
 │  └──────────────────┘    │
 │  ┌──────────────────┐    │
 │  │  Tweakpane pane  │    │
 │  └──────────────────┘    │
 │                          │
 │  console.log  ─────────────────► Console pane (main window)
 │  window.onerror ───────────────► Error display + line mapping
 │  _q5_frameRate ────────────────► FPS display (polled 2×/s)
 └──────────────────────────┘
```

---

## UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│ ⚡ VisLab   Creative Coding Playground · q5.js + Tweakpane   │
│                    [Load Example] [Copy] [Clear] [■Stop] [▶Run]│
├─────────────────────────┬────────────────────────────────────┤
│ 📝 Sketch Code  Ctrl+↵ ◀│ 🎨 Preview            fps: 60      │
│─────────────────────────│                                    │
│                         │   ┌──────────────────────────┐    │
│  // your sketch here    │   │                          │    │
│  function setup() { }   │   │   1024 × 1024 canvas     │    │
│  function draw()  { }   │   │   (scaled to fit)        │    │
│                         │   │                          │    │
│  ...                    │   └──────────────────────────┘    │
│─────────────────────────│                                    │
│ 🖥 Console               │ ✓ Running            120 lines    │
│ > Sketch started        │                                    │
│ > log output here       │                                    │
└─────────────────────────┴────────────────────────────────────┘
```

> **Tip:** Click the **◀** button in the Sketch Code toolbar to collapse the editor panel and give your canvas the full viewport width. Click **▶** to expand it again.

### Canvas zones (1024 × 1024)

The preamble defines four named regions for consistent sketch layouts:

```
┌──────────────────────────────────────────────────────┐ y=0
│                  TITLE  (1024 × 60)                  │
├──────────────────────────────┬───────────────────────┤ y=60
│                              │                       │
│   VIZ  (620 × 690)           │  PANEL  (394 × 690)   │
│   Visualisation area         │  Text / formula panel │
│                              │                       │
├──────────────────────────────┴───────────────────────┤ y=750
│              CONTROLS  (1024 × 274)                   │
│              Tweakpane sliders live here              │
└──────────────────────────────────────────────────────┘ y=1024
```

---

## How It Works

### 1. Editor

[CodeMirror 5](https://codemirror.net/5/) provides syntax highlighting, bracket matching, and auto-close.  
The editor fills the left panel and resizes automatically when the window or panel size changes.

### 2. Run

Pressing **▶ Run** (or `Ctrl+Enter`) triggers the following steps:

1. The existing sketch `<iframe>` is destroyed (`stopSketch()`).
2. The **preamble** (framework helpers) is retrieved from the hidden `<script id="preamble-src">` tag.
3. A new `<iframe>` is created and sized to 1024 × 1024.
4. The concatenated `preamble + userCode` is written into the iframe via `document.write()`.
5. Inside the iframe, `console.log/warn/error` and `window.onerror` are proxied back to the parent window so messages appear in the built-in console pane.
6. `scalePreview()` scales the iframe with CSS `transform: scale()` to fill the preview area.
7. An interval polls `iframe.contentWindow._q5_frameRate` every 500 ms for the FPS display.

### 3. Isolation

Each run is fully isolated inside a sandboxed `<iframe>`. This means:

- Global variables from previous runs don't leak.
- Tweakpane panes are cleanly disposed on stop.
- Errors don't crash the host page.

---

## Preamble Framework

Think of the preamble as the **standard library** of VisLab. Every tool below is injected once before your sketch code and is available for free in every run.  
**Goal:** a new sketch should only contain the `NODES` array (or `steps` array), the physics/drawing code, and nothing else.

### Layout constants

```js
const LAYOUT = {
  TITLE:    { x: 0,   y: 0,   w: 1024, h: 60  },
  VIZ:      { x: 0,   y: 60,  w: 620,  h: 690 },
  PANEL:    { x: 630, y: 60,  w: 394,  h: 690 },
  CONTROLS: { x: 0,   y: 750, w: 1024, h: 274 },
};
```

### StepManager

Create multi-step tutorial sketches with automatic fade-in animations and navigation buttons:

```js
const sm = new StepManager([
  {
    title:   'Step 1 — Introduction',
    body:    ['Explain what the sketch does.', '!!Highlighted line in accent colour.'],
    formula: 'y = A · sin(ωt)',
  },
  { title: 'Step 2 — ...', body: [...] },
]);

function setup() { createCanvas(1024, 1024); }

function draw() {
  sm.update();               // fade-in animation
  sm.drawTitleBar(this);     // title + step dots
  sm.drawPanel(this);        // explanation panel (right side)
  const btns = sm.drawNavButtons(this);  // Prev / Next buttons

  // Handle clicks
  if (mouseIsPressed) {
    if (inZone(mouseX, mouseY, btns.next)) sm.next();
    if (inZone(mouseX, mouseY, btns.prev)) sm.prev();
  }
}
```

### NodeSystem

`NodeSystem` is a **drop-in timeline + caption engine** for node-based sketches. It eliminates roughly 90–110 lines of boilerplate per sketch:

| Eliminated | Replacement |
|------------|-------------|
| `let activeNode, fadeAlpha, nodeRects` state vars | `new NodeSystem(NODES)` |
| `drawTimeline()` (~40 lines) | `ns.drawRail()` |
| Caption strip block (~12 lines) | `ns.drawCaption()` |
| `mousePressed` hit-test loop | `ns.hit(mouseX, mouseY)` |

#### NODES array format

```js
const NODES = [
  {
    label:   'Intro',           // short label shown below the dot
    color:   '#38bdf8',         // hex accent colour
    accent:  '!!Key insight',   // caption heading (!! = accent coloured)
    caption: ['Line one.', 'Line two.'],  // body lines in caption strip
    // optional: children for a branching child rail
    children: [
      { label: 'Path A', color: '#4ade80', accent: 'Branch A', caption: ['...'] },
      { label: 'Path B', color: '#f59e0b', accent: 'Branch B', caption: ['...'] },
    ],
  },
  // more nodes…
];
```

#### Constructor

```js
const ns = new NodeSystem(NODES, opts);
```

| Option | Default | Description |
|--------|---------|-------------|
| `opts.railY` | `95` | Y position of the main timeline rail |
| `opts.margin` | `80` | Left/right margin for the rail |
| `opts.captionY` | `600` | Y position of the caption strip |
| `opts.captionH` | `100` | Height of the caption strip |
| `opts.fadeSpeed` | `7` | Alpha increment per frame (caption fade-in speed) |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `ns.active` | `number` | Index of the currently active parent node |
| `ns.child` | `number` | Index of the active child node (`-1` = none) |
| `ns.fade` | `number` | Current caption opacity (0–255) |
| `ns.node` | `object` | The currently displayed node (child if selected, else parent) |
| `ns.acRGB` | `[r,g,b]` | RGB array of `ns.node.color` |
| `ns.parentNode` | `object` | Always the top-level active parent node |

#### Methods

| Method | Description |
|--------|-------------|
| `ns.update()` | Advances `ns.fade` each frame. Call at the **top** of `draw()`. |
| `ns.drawRail()` | Draws the main timeline rail, dots, labels, and child rail (if applicable). |
| `ns.drawCaption()` | Draws the bottom caption strip with accent heading and body text. |
| `ns.hit(mx, my)` | Hit-tests mouse position against rail dots; updates `active`/`child` and resets `fade`. Call in `mousePressed()`. |

#### Minimal sketch template

```js
const NODES = [ /* … */ ];
const ns = new NodeSystem(NODES);  // optional: new NodeSystem(NODES, { railY: 80 })

function setup() { createCanvas(1024, 1024); }

function draw() {
  background(8, 10, 20);

  ns.update();       // advance fade
  ns.drawRail();     // timeline bar

  // ── your visualisation code here ──
  // use ns.node, ns.acRGB, ns.fade, ns.parentNode

  ns.drawCaption();  // bottom caption strip
}

function mousePressed() { ns.hit(mouseX, mouseY); }
```

---

### Sketch Patterns

These three patterns are confirmed keepers — add them to any sketch that fits the description.

#### 1. Branching Timeline

> **Use when:** a concept has a parallel or forking sub-process (DNA replication, electrical circuits, immune response).

Add a `children` array to one or more nodes. `NodeSystem` automatically renders the secondary child rail and a `▼` indicator on the parent dot.

```js
const NODES = [
  { label: 'DNA', color: '#4ade80', accent: '!!Replication', caption: ['...'],
    children: [
      { label: 'Leading', color: '#38bdf8', accent: 'Continuous', caption: ['...'] },
      { label: 'Lagging', color: '#f59e0b', accent: 'Fragments',  caption: ['...'] },
    ]
  },
  // …
];
```

#### 2. Comparison Pin

> **Use when:** two implementations of the same idea need side-by-side physics (disc vs drum brake, AC vs DC motor, etc.).

Use two sibling nodes with the same index slot in NODES — one "A" variant and one "B" variant. Both share the canvas simultaneously; use `ns.active` to toggle between highlight states.

```js
const NODES = [
  { label: 'Disc',  color: '#38bdf8', accent: '!!Disc Brake',  caption: ['...'] },
  { label: 'Drum',  color: '#f472b6', accent: '!!Drum Brake',  caption: ['...'] },
];

function draw() {
  ns.update(); ns.drawRail();
  drawBrakeA(ns.active === 0);   // highlight when active
  drawBrakeB(ns.active === 1);
  ns.drawCaption();
}
```

#### 3. Annotation Anchors

> **Use when:** labels belong directly on the diagram — always on, no click needed (nozzle cross-section, heart anatomy, bridge structure, etc.).

Declare anchor points alongside the physics coordinates and call `drawAnnotation()` after each physics pass.

```js
const ANNOTATIONS = [
  { label: 'Combustion Chamber', x: 300, y: 200 },
  { label: 'Throat',             x: 512, y: 350 },
  { label: 'Nozzle Exit',        x: 720, y: 200 },
];

function draw() {
  ns.update(); ns.drawRail();
  drawNozzle();
  for (const a of ANNOTATIONS) drawAnnotation(a.x, a.y, a.label, ns.acRGB);
  ns.drawCaption();
}
```

---

### Tweakpane helpers

```js
function setup() {
  const pane   = makePane('Controls');
  const params = { freq: 1.0, amp: 100 };

  addSlider(pane, params, 'freq', { min: 0.1, max: 5, step: 0.1, label: 'Frequency' });
  addSlider(pane, params, 'amp',  { min: 10,  max: 300, label: 'Amplitude' });
  addButton(pane, 'Reset', () => { params.freq = 1; params.amp = 100; });
}
```

### Utility functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `inZone` | `(mx, my, zone) → bool` | Returns `true` if point is inside a layout zone |
| `drawCrosshair` | `(p, mx, my)` | Draws crosshair lines inside `LAYOUT.VIZ` |
| `drawGlow` | `(p, x, y, r, col, alpha)` | Layered glow effect using a p5 colour value |
| `hexRGB` | `(hex) → [r,g,b]` | Converts a hex colour string to an RGB array |
| `safeGlow` | `(x, y, r, [r,g,b], alpha)` | Glow effect using an RGB array (no `p` instance needed) |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` / `Cmd + Enter` | Run sketch |

---

## Example Sketch

Click **Load Example** in the header to load the built-in **Wave Interference** demo.  
It demonstrates:

- `StepManager` with 3 steps and formula boxes
- `drawCrosshair` mouse probe
- `drawGlow` glow effect
- Tweakpane sliders for frequency and amplitude

---

## Running Locally

```bash
# Option 1 — open directly
open index.html

# Option 2 — simple HTTP server (avoids any browser file:// restrictions)
python3 -m http.server 8000
# Then visit http://localhost:8000
```

No build step, no `npm install`, no dependencies to download.  
All libraries are loaded from CDN at runtime.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full version history.

---

## Contributing

1. Fork the repository.
2. Edit `index.html` directly — it is the entire application.
3. Test your changes by opening `index.html` in a browser.
4. Submit a pull request with a clear description of what you changed and why.

> Keep the single-file philosophy: all code, styles, and scripts should remain inside `index.html`.
