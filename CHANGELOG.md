# Changelog

All notable changes to **VisLab** are documented here.  
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- **Raw/Debug view toggle** — new **⟨/⟩ Raw** button in the preview toolbar switches between the live rendered canvas and a scrollable `<pre>` block showing the full injected HTML/JS source. Useful for copying and inspecting why a sketch is not behaving as expected without opening DevTools.
- `preamble.js` — engine classes (NodeSystem, StepManager, HintSystem, ZoneHighlight, ProbePoint, formulaBox, ColorRamp, subPanel, spanAnnotation, layout constants, Tweakpane helpers) extracted into a standalone static asset.
- `sketch.js` — default Wave Interference example sketch extracted as a standalone file, fetched at startup.
- `ui.js` — editor, runtime, and toolbar logic extracted into a standalone static asset; preamble is now fetched via `fetch('preamble.js')` at page load.
- Updated **prompt template** with the following AI-rule improvements:
  - `createCanvas({{WIDTH}}, {{HEIGHT}})` is now **required** inside `setup()`.
  - Full-canvas actor positioning rule: actors must use full canvas coordinates, not LAYOUT.VIZ-relative coordinates.
  - Backtick template literal ban: `` `value = ${x}` `` is forbidden in sketch code; use `'value = ' + x` instead.
  - ColorRamp self-declare warning: `RAMP_HEAT` / `RAMP_PRESSURE` are not globals — always declare them explicitly.
  - `safeGlow` radius cap: never exceed 40 px.
  - StepManager strict draw order: `drawTitleBar` → `drawPanel` → `drawNavButtons`.
  - `subPanel` placement rule: panels must be outside the diagram actor zone.
  - New anti-pattern: `text('line1\nline2', x, y)` — q5.js ignores `\n`, use separate `text()` calls.
  - NodeSystem template updated to include `createCanvas()` and a non-backtick `probe.register` comment.
  - Pre-flight checklist extended with `createCanvas`, ColorRamp explicit declaration, `safeGlow` radius, and backtick ban items.

### Changed
- `index.html` refactored into a lean HTML shell (CSS + prompt template only); engine and UI logic now live in separate files (`preamble.js`, `sketch.js`, `ui.js`).
- Preamble bumped to **v2.0**.
- Example sketch updated: `drawGlow()` replaced with `safeGlow()` (consistent with anti-pattern rules); backtick comment updated to use string concatenation.
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
