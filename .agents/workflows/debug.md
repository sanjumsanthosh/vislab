---
description: How to debug and test VisLab sketches
---

# Debugging VisLab

## Quick Start
// turbo-all

1. Start a local server (required — `file://` blocks `fetch()` for `preamble.js`):
```bash
npx -y serve -l 3456 .
```

2. Open `http://localhost:3456` in browser.

## Common Issues & How to Fix

### 1. "X is not defined" (NodeSystem, HintSystem, ColorRamp, etc.)
**Cause**: `preamble.js` failed to load — usually because you opened via `file://` instead of a server.  
**Fix**: Always use a local HTTP server (`npx serve`, `python -m http.server`, etc.).

### 2. Timeline nodes hidden / VIZ rect covers the rail
**Cause**: User code draws `rect(LAYOUT.VIZ.x, LAYOUT.VIZ.y, ...)` AFTER `ns.drawRail()`, painting over it.  
**Fix**: `LAYOUT.VIZ` starts at y=140, below the rail zone (y=60-140). If nodes are still hidden, check:
- Is `LAYOUT.VIZ.y` correct in `preamble.js`? Should be 140.
- Is user code hardcoding `rect(0, 60, ...)` instead of using `LAYOUT.VIZ`?

### 3. Copy Prompt gives "undefined"
**Cause**: `prompt-output` is a `<pre>` element → use `.textContent`, NOT `.value`.  
**Fix**: In `ui.js`, `copyPrompt()` must use `out.textContent`.

### 4. Sketch renders but looks wrong (overlapping elements)
**Debug steps**:
1. Open browser DevTools → Console tab for JS errors
2. Check draw order: background rect → actors → formula boxes → captions
3. Verify y-coordinates don't place elements in the RAIL zone (y=60-140)
4. Check `LAYOUT` zones match between `preamble.js` and `index.html` prompt template

### 5. Tweakpane errors / sliders don't appear
**Cause**: Tweakpane v3 uses `pane.addInput()`. If using v4, method is `pane.addBinding()`.  
**Fix**: Check CDN version loaded in `index.html`. Current: Tweakpane v3.

## Architecture Quick Reference

| File | Purpose |
|------|---------|
| `index.html` | UI shell, CodeMirror editor, prompt template, CSS |
| `ui.js` | Editor logic, run/stop, raw view, prompt generator |
| `preamble.js` | Injected into iframe — provides NodeSystem, HintSystem, LAYOUT, helpers |
| `sketch.js` | Default example sketch loaded on startup |

## LAYOUT Zones (1280×800 canvas)

```
y=0   ┌──────────────── TITLE (h:60) ──────────────────┐
y=60  ├──────────────── RAIL  (h:80) ──────────────────┤  ← NodeSystem rail lives here
y=140 ├────── VIZ (w:768) ──┬──── PANEL (w:512) ───────┤  ← Safe to draw background rects
y=660 ├──────────────── CONTROLS (h:140) ──────────────┤
y=800 └────────────────────────────────────────────────┘
```

## How the Iframe Injection Works
1. `ui.js` fetches `preamble.js` source at startup
2. On Run: builds an HTML document = `<script>preamble</script>` + `<script>userCode</script>`
3. Injects via `iframe.contentDocument.write(rawHtml)`
4. Console is proxied from iframe → parent via `window.parent.logToConsole()`
5. Errors show adjusted line numbers (subtracting preamble line count)

## Debugging Checklist
- [ ] Running via HTTP server, not `file://`?
- [ ] Console shows "Sketch started" with no errors?
- [ ] `preamble.js` LAYOUT zones match `index.html` prompt template?
- [ ] DOM element type matches property used (`.value` for inputs, `.textContent` for divs/pre)?
- [ ] User code draw order: rail → VIZ background → actors → captions?
