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

The **VisLab Preamble v1.0** is auto-injected before every sketch. It provides:

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
| `drawGlow` | `(p, x, y, r, col, alpha)` | Layered low-alpha circles for glow effect |

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
