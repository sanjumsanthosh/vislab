# Changelog

All notable changes to **VisLab** are documented here.  
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- Collapsible editor panel — click the **◀ / ▶** toggle button in the Sketch Code toolbar to hide the code editor and give the preview canvas full viewport width.
- Comprehensive `README.md` with architecture diagrams, feature overview, keyboard shortcuts, and contribution guide.
- This `CHANGELOG.md`.

---

## [1.0.0] — 2025-01-01

### Added
- Initial release of the VisLab creative-coding playground.
- Single-file (`index.html`) application — no build step required.
- **q5.js** runtime for p5-compatible creative-coding sketches.
- **CodeMirror 5** in-browser editor with Dracula theme, line numbers, bracket matching, and auto-close.
- **Tweakpane v3** integration for interactive sliders, buttons, and colour pickers.
- Sketch isolation via sandboxed `<iframe>` — each run gets a fresh environment.
- Console proxy — `console.log / warn / error` from the sketch are forwarded to the built-in console pane.
- Error overlay with line-number mapping (accounts for preamble offset).
- FPS display polled from the iframe's q5.js frame rate.
- Responsive canvas scaling — the 1 024 × 1 024 sketch always fills the available preview area.
- **Preamble framework** (`VISLAB PREAMBLE v1.0`) auto-injected into every sketch:
  - `LAYOUT` constants (`TITLE`, `VIZ`, `PANEL`, `CONTROLS` zones).
  - `STEP_COLORS` accent palette.
  - `StepManager` class for multi-step tutorial sketches.
  - Tweakpane factory helpers: `makePane()`, `addSlider()`, `addButton()`.
  - Utility functions: `inZone()`, `drawCrosshair()`, `drawGlow()`.
- Built-in **Wave Interference** example sketch demonstrating all preamble features.
- Header action buttons: **Load Example**, **Copy Code**, **Clear Console**, **■ Stop**, **▶ Run**.
- Keyboard shortcut: `Ctrl + Enter` / `Cmd + Enter` to run the sketch.
- GitHub Pages deployment at <https://sanjumsanthosh.github.io/vislab/>.

[Unreleased]: https://github.com/sanjumsanthosh/vislab/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/sanjumsanthosh/vislab/releases/tag/v1.0.0
