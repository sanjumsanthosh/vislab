// ═══════════════════════════════════════════════════════
//  VISLAB PREAMBLE v2.0  —  preamble.js
//  Provides: StepManager, NodeSystem, HintSystem,
//            ZoneHighlight, ProbePoint, formulaBox,
//            ColorRamp, subPanel, spanAnnotation,
//            layout zones, Tweakpane helpers
//  Libraries available: q5.js (p5-compatible), Tweakpane
// ═══════════════════════════════════════════════════════

// ── LAYOUT CONSTANTS (responsive to canvas size) ─────────
let LAYOUT = {
  TITLE:    { x: 0,   y: 0,   w: 1280, h: 60  },
  RAIL:     { x: 0,   y: 60,  w: 1280, h: 80  },
  VIZ:      { x: 0,   y: 140, w: 768,  h: 520 },
  PANEL:    { x: 768, y: 140, w: 512,  h: 520 },
  CONTROLS: { x: 0,   y: 660, w: 1280, h: 140 }
};

function updateLAYOUT() {
  LAYOUT = {
    TITLE:    { x: 0,            y: 0,             w: width,         h: 60 },
    RAIL:     { x: 0,            y: 60,            w: width,         h: 80  },
    VIZ:      { x: 0,            y: 140,           w: width * 0.6,   h: height - 280 },
    PANEL:    { x: width * 0.6,  y: 140,           w: width * 0.4,   h: height - 280 },
    CONTROLS: { x: 0,            y: height - 140,  w: width,         h: 140 }
  };
}

// ── STEP ACCENT COLORS ────────────────────────────────────
const STEP_COLORS = ['#38bdf8','#4ade80','#f59e0b','#f472b6','#a78bfa'];

// ── STEP MANAGER ─────────────────────────────────────────
class StepManager {
  constructor(steps) {
    this.steps = steps;        // array of { title, body[], formula, hint }
    this.current = 0;
    this.targetAlpha = 255;
    this.alpha = 0;
  }
  get step()  { return this.steps[this.current]; }
  get color() { return STEP_COLORS[this.current % STEP_COLORS.length]; }
  get count() { return this.steps.length; }

  next() { if (this.current < this.steps.length-1) { this.current++; this.alpha = 0; } }
  prev() { if (this.current > 0) { this.current--; this.alpha = 0; } }

  // Call inside draw() — handles fade-in animation
  update() { this.alpha = lerp(this.alpha, 255, 0.08); }

  // Draw title bar + step dots
  drawTitleBar(p) {
    p.fill('#111827'); p.noStroke();
    p.rect(0, 0, 1024, 60);
    p.fill(this.color); p.noStroke();
    p.textSize(20); p.textAlign(p.LEFT, p.CENTER); p.textStyle(p.BOLD);
    p.text(this.step.title, 20, 30);
    // Step dots
    let dotX = 1024 - 30 - (this.count * 18);
    for (let i = 0; i < this.count; i++) {
      p.fill(i === this.current ? this.color : '#334155');
      p.circle(dotX + i*18, 30, i === this.current ? 10 : 7);
    }
  }

  // Draw explanation panel (right side)
  drawPanel(p, extraLines) {
    const c = LAYOUT.PANEL;
    p.fill('#0d1117'); p.noStroke();
    p.rect(c.x, c.y, c.w, c.h);
    // Accent border
    p.stroke(this.color); p.strokeWeight(3); p.noFill();
    p.line(c.x+1, c.y, c.x+1, c.y+c.h);
    p.noStroke();

    // Step title (pseudo-bold)
    p.fill(this.color);
    p.textSize(17); p.textAlign(p.LEFT, p.TOP); p.textStyle(p.BOLD);
    p.text(this.step.title, c.x+18, c.y+16);

    // Body text with fade
    p.fill(220, 220, 220, this.alpha);
    p.textSize(13); p.textStyle(p.NORMAL);
    let ty = c.y + 52;
    const lines = [...(this.step.body || []), ...(extraLines || [])];
    for (let line of lines) {
      if (line.startsWith('!!')) {
        p.fill(this.color);
        p.text(line.slice(2), c.x+18, ty);
        p.fill(220, 220, 220, this.alpha);
      } else {
        p.text(line, c.x+18, ty);
      }
      ty += 22;
    }

    // Formula box at bottom
    if (this.step.formula) {
      p.fill('#1e293b'); p.noStroke();
      p.rect(c.x+14, c.y+c.h-70, c.w-28, 56, 8);
      p.fill(this.color);
      p.textSize(18); p.textAlign(p.CENTER, p.CENTER); p.textStyle(p.BOLD);
      p.text(this.step.formula, c.x + c.w/2, c.y+c.h-42);
    }
  }

  // Draw Prev/Next buttons at bottom (returns button rects for click handling)
  drawNavButtons(p) {
    const by = 920, bw = 130, bh = 44;
    // Prev
    p.fill(this.current>0 ? '#334155' : '#1e293b');
    p.rect(20, by, bw, bh, 8);
    p.fill(this.current>0 ? '#e2e8f0' : '#475569');
    p.textSize(14); p.textAlign(p.CENTER, p.CENTER); p.textStyle(p.NORMAL);
    p.text('← Prev Step', 20+bw/2, by+bh/2);
    // Next
    p.fill(this.current<this.count-1 ? this.color : '#1e293b');
    p.rect(874, by, bw, bh, 8);
    p.fill(this.current<this.count-1 ? '#000' : '#475569');
    p.text('Next Step →', 874+bw/2, by+bh/2);

    return {
      prev: {x:20,     y:by, w:bw, h:bh},
      next: {x:874,    y:by, w:bw, h:bh}
    };
  }
}

// ── TWEAKPANE FACTORY HELPERS ─────────────────────────────
// Call these in setup() — they return reactive param objects

function makePane(title) {
  return new Tweakpane.Pane({ title: title || 'Controls' });
}

function addSlider(pane, params, key, options) {
  // options: { min, max, step, label }
  return pane.addInput(params, key, options);
}

function addButton(pane, label, callback) {
  return pane.addButton({ title: label }).on('click', callback);
}

// ── MOUSE PROBE HELPER ───────────────────────────────────
function inZone(mx, my, zone) {
  return mx > zone.x && mx < zone.x+zone.w &&
         my > zone.y && my < zone.y+zone.h;
}

// ── IN-VIZ CROSSHAIR ────────────────────────────────────
function drawCrosshair(p, mx, my) {
  if (!inZone(mx, my, LAYOUT.VIZ)) return;
  p.stroke(255,255,255,60); p.strokeWeight(1);
  p.line(mx, LAYOUT.VIZ.y, mx, LAYOUT.VIZ.y+LAYOUT.VIZ.h);
  p.line(LAYOUT.VIZ.x, my, LAYOUT.VIZ.x+LAYOUT.VIZ.w, my);
  p.noStroke();
}

// ── GLOW EFFECT (layered low-alpha circles) ───────────────
function drawGlow(p, x, y, r, col, alpha) {
  p.noStroke();
  for (let i = 3; i > 0; i--) {
    p.fill(p.red(col), p.green(col), p.blue(col), alpha/i);
    p.circle(x, y, r*i);
  }
}

// ── HEX → RGB ARRAY ──────────────────────────────────────
// hexRGB('#38bdf8') → [56, 189, 248]
function hexRGB(hex) {
  const h = hex.replace('#','');
  return [
    parseInt(h.slice(0,2),16),
    parseInt(h.slice(2,4),16),
    parseInt(h.slice(4,6),16)
  ];
}

// ── SAFE GLOW (no p5 instance needed, uses RGB array) ─────
// safeGlow(x, y, r, [r,g,b], alpha)
function safeGlow(x, y, r, rgb, alpha) {
  noStroke();
  for (let i = 3; i > 0; i--) {
    fill(rgb[0], rgb[1], rgb[2], alpha/i);
    circle(x, y, r*i);
  }
}

// ── NODE SYSTEM ───────────────────────────────────────────
// Replaces per-sketch: activeNode, fadeAlpha, nodeRects, drawTimeline(),
// caption strip, and the mousePressed hit-test loop.
//
// Usage:
//   const ns = new NodeSystem(NODES);
//   function draw()         { ns.update(); ns.drawRail(); /* viz */ ns.drawCaption(); }
//   function mousePressed() { ns.hit(mouseX, mouseY); }
//
// NODES format:
//   { label, color, accent, caption[], children?[] }
//   children share the same shape (label, color, accent, caption[])
class NodeSystem {
  constructor(nodes, opts = {}) {
    this.nodes   = nodes;
    this.active  = 0;
    this.fade    = 0;
    this._rects  = [];
    this._cRects = [];   // child node hit rects
    this.child   = -1;   // active child index (-1 = none)
    this.opts    = {
      railY:     opts.railY     ?? 95,
      margin:    opts.margin    ?? 80,
      captionY:  opts.captionY  ?? 600,
      captionH:  opts.captionH  ?? 100,
      fadeSpeed: opts.fadeSpeed ?? 7,
    };
  }

  // Current node: active child when one is selected, otherwise parent node
  get node() {
    const n = this.nodes[this.active];
    if (this.child >= 0 && n.children && this.child < n.children.length)
      return n.children[this.child];
    return n;
  }
  // Accent RGB of the current node
  get acRGB() { return hexRGB(this.node.color); }
  // Always returns the top-level (parent) node
  get parentNode() { return this.nodes[this.active]; }

  // Call every draw() frame — advances the caption fade-in
  update() { this.fade = min(255, this.fade + this.opts.fadeSpeed); }

  // Draw the main timeline rail + node dots (and child rail if applicable)
  drawRail() {
    const { railY, margin } = this.opts;
    const railW = width - margin * 2;
    const step  = this.nodes.length > 1 ? railW / (this.nodes.length - 1) : 0;
    this._rects = [];
    const acRGB = hexRGB(this.nodes[this.active].color);

    stroke(40,44,60); strokeWeight(2); noFill();
    line(margin, railY, margin + railW, railY);
    stroke(acRGB[0],acRGB[1],acRGB[2],140); strokeWeight(2);
    line(margin, railY, margin + this.active * step, railY);

    for (let i = 0; i < this.nodes.length; i++) {
      const nx   = margin + i * step;
      const nRGB = hexRGB(this.nodes[i].color);
      const isAct = i === this.active;
      const r    = isAct ? 14 : 10;
      this._rects.push({ x:nx-22, y:railY-22, w:44, h:44, idx:i });
      if (isAct) safeGlow(nx, railY, r*3, nRGB, 60);
      fill(i <= this.active ? nRGB[0] : 30,
           i <= this.active ? nRGB[1] : 34,
           i <= this.active ? nRGB[2] : 50);
      stroke(nRGB[0],nRGB[1],nRGB[2], isAct ? 255 : 100);
      strokeWeight(isAct ? 2 : 1);
      circle(nx, railY, r*2);
      fill(isAct ? 10 : 180, isAct ? 10 : 190, isAct ? 10 : 215);
      noStroke(); textSize(isAct ? 11 : 9); textAlign(CENTER,CENTER);
      text(i+1, nx, railY);
      fill(isAct ? nRGB[0] : 148, isAct ? nRGB[1] : 163, isAct ? nRGB[2] : 184);
      textSize(11); textAlign(CENTER,TOP);
      text(this.nodes[i].label, nx, railY + 18);
      // Branch indicator ▼ when node has children
      if (this.nodes[i].children && isAct) {
        fill(nRGB[0],nRGB[1],nRGB[2],160); noStroke();
        textSize(9); textAlign(CENTER,TOP);
        text('▼', nx, railY + 31);
      }
    }
    // Draw child rail when active node has children
    if (this.nodes[this.active].children) this._drawChildRail();
  }

  // Internal — draws the secondary (child) rail below the main rail
  _drawChildRail() {
    const children = this.nodes[this.active].children;
    const railY2   = this.opts.railY + 55;
    const margin2  = 160;
    const railW2   = width - margin2 * 2;
    const step     = children.length > 1 ? railW2 / (children.length - 1) : 0;
    this._cRects   = [];
    stroke(30,36,50); strokeWeight(1); noFill();
    line(margin2, railY2, margin2 + railW2, railY2);
    for (let i = 0; i < children.length; i++) {
      const nx    = margin2 + i * step;
      const cRGB  = hexRGB(children[i].color);
      const isAct = i === this.child;
      const r     = isAct ? 11 : 8;
      this._cRects.push({ x:nx-18, y:railY2-18, w:36, h:36, idx:i });
      if (isAct) safeGlow(nx, railY2, r*2.5, cRGB, 50);
      fill(isAct ? cRGB[0]:30, isAct ? cRGB[1]:34, isAct ? cRGB[2]:50);
      stroke(cRGB[0],cRGB[1],cRGB[2], isAct ? 220 : 100);
      strokeWeight(1); circle(nx, railY2, r*2);
      fill(isAct ? 10:180, isAct ? 10:190, isAct ? 10:215);
      noStroke(); textSize(9); textAlign(CENTER,CENTER);
      text(String.fromCharCode(97 + (i % 26)), nx, railY2);
      fill(isAct ? cRGB[0]:148, isAct ? cRGB[1]:163, isAct ? cRGB[2]:184);
      textSize(10); textAlign(CENTER,TOP);
      text(children[i].label, nx, railY2+13);
    }
  }

  // Draw the bottom caption strip with accent text + body lines
  drawCaption() {
    const { captionY, captionH } = this.opts;
    const acRGB = this.acRGB;
    fill(12,14,26,230); noStroke(); rect(0, captionY, width, captionH);
    fill(acRGB[0],acRGB[1],acRGB[2], this.fade);
    noStroke(); textSize(13); textAlign(LEFT,TOP);
    text(this.node.accent.replace('!!',''), 28, captionY + 12);
    fill(180,192,215, this.fade);
    for (let i = 0; i < this.node.caption.length; i++)
      text(this.node.caption[i], 28, captionY + 36 + i * 22);
  }

  // Call in mousePressed() — handles both parent and child rail clicks
  hit(mx, my) {
    // Child rects checked first (higher priority)
    for (const r of this._cRects) {
      if (mx>r.x && mx<r.x+r.w && my>r.y && my<r.y+r.h) {
        this.child = (this.child === r.idx) ? -1 : r.idx;
        this.fade  = 0;
        return;
      }
    }
    // Parent rail
    for (const r of this._rects) {
      if (mx>r.x && mx<r.x+r.w && my>r.y && my<r.y+r.h) {
        this.active = r.idx;
        this.child  = -1;
        this.fade   = 0;
        return;
      }
    }
  }
}

// ── HINT SYSTEM ───────────────────────────────────────
// ⓘ icon in title bar top-right; click → overlay with hint list.
//
// Usage:
//   const hints = new HintSystem();
//   // In setup(): hints.register([...]);
//   // In draw(), after ns.drawRail(): hints.draw(ns.acRGB);
//   // In mousePressed(), before ns.hit(): hints.hit(mouseX, mouseY);
class HintSystem {
  constructor(opts = {}) {
    this._hints = [];
    this._open  = false;
    this._anim  = 0;        // 0=closed, 255=open, animates between
    this._ix    = opts.ix ?? 995;
    this._iy    = opts.iy ?? 30;
    this._ir    = opts.ir ?? 14;  // icon circle radius
  }

  register(hints) { this._hints = hints; }

  // Call in draw() — draws icon always, overlay when open
  draw(acRGB) {
    // Animate overlay alpha
    this._anim = this._open
      ? min(255, this._anim + 18)
      : max(0,   this._anim - 18);

    // ── ⓘ icon ────────────────────────────────────────
    const hovered = dist(mouseX, mouseY, this._ix, this._iy) < this._ir;
    fill(this._open || hovered ? acRGB[0] : 40,
         this._open || hovered ? acRGB[1] : 46,
         this._open || hovered ? acRGB[2] : 62);
    stroke(acRGB[0], acRGB[1], acRGB[2],
           this._open ? 255 : hovered ? 200 : 120);
    strokeWeight(1.5);
    circle(this._ix, this._iy, this._ir * 2);
    fill(this._open || hovered ? 10  : 200,
         this._open || hovered ? 10  : 210,
         this._open || hovered ? 10  : 225);
    noStroke(); textSize(13); textAlign(CENTER, CENTER);
    text('i', this._ix, this._iy);

    // ── Overlay panel ──────────────────────────────────
    if (this._anim <= 0) return;
    const ow = 420, oh = 36 + this._hints.length * 28 + 16;
    const ox = 12, oy = 64;
    fill(14, 16, 28, this._anim * 0.95);
    stroke(acRGB[0], acRGB[1], acRGB[2], this._anim * 0.4);
    strokeWeight(1);
    rect(ox, oy, ow, oh, 8);

    // Title row
    fill(acRGB[0], acRGB[1], acRGB[2], this._anim);
    noStroke(); textSize(12); textAlign(LEFT, TOP);
    text('How to use this sketch', ox + 16, oy + 12);

    // Hint rows
    fill(200, 210, 225, this._anim);
    for (let i = 0; i < this._hints.length; i++) {
      textSize(11); textAlign(LEFT, TOP);
      text('●  ' + this._hints[i], ox + 16, oy + 36 + i * 28);
    }
  }

  // Call in mousePressed()
  hit(mx, my) {
    if (dist(mx, my, this._ix, this._iy) < this._ir) {
      this._open = !this._open;
      return true;
    }
    // Click outside overlay closes it
    if (this._open) { this._open = false; return true; }
    return false;
  }
}

// ── ZONE HIGHLIGHT ────────────────────────────────────
// Clickable diagram regions with hover tooltips and active-zone glows.
// Zones are registered once in setup(), then driven by update() in draw()
// and hit() in mousePressed().
//
// Usage:
//   const zones = new ZoneHighlight();
//   // In setup():
//   zones.add('intake_valve', CX-CYL_W/2-32, CYL_TOP, 32, 28, 0, 'Intake Valve → Intake');
//   // In draw() (last, after all viz code):
//   zones.update(mouseX, mouseY, ns.acRGB, ns.active);
//   // In mousePressed():
//   if (zones.hit(mouseX, mouseY, ns)) return;
class ZoneHighlight {
  constructor() {
    this._zones = [];
  }

  // Register a named hit region.
  // id = debug name, nodeIdx = ns.active index to jump to on click,
  // label = tooltip text shown on hover
  add(id, x, y, w, h, nodeIdx, label) {
    this._zones.push({ id, x, y, w, h, nodeIdx, label });
  }

  // Remove all registered zones
  clear() { this._zones = []; }

  // Update a zone's target node at runtime
  setNode(id, nodeIdx) {
    const z = this._zones.find(z => z.id === id);
    if (z) z.nodeIdx = nodeIdx;
  }

  // Internal — returns true when (mx, my) is inside zone z
  _inZone(mx, my, z) {
    return mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h;
  }

  // Call last in draw() — overlays highlights and tooltips.
  // Pass ns.active as the 4th argument to show a persistent glow on the
  // zone whose nodeIdx matches the currently active node.
  update(mx, my, acRGB, nsActive = -1) {
    for (const z of this._zones) {
      const hovered  = this._inZone(mx, my, z);
      const isActive = nsActive >= 0 && z.nodeIdx === nsActive;

      // Active zone: subtle persistent glow even without hover
      if (isActive && !hovered) {
        fill(acRGB[0], acRGB[1], acRGB[2], 22);
        noStroke();
        rect(z.x, z.y, z.w, z.h, 3);
      }

      // Hover: semi-transparent accent overlay + 1px border + tooltip
      if (hovered) {
        fill(acRGB[0], acRGB[1], acRGB[2], 55);
        stroke(acRGB[0], acRGB[1], acRGB[2], 200);
        strokeWeight(1);
        rect(z.x, z.y, z.w, z.h, 3);
        this._drawTooltip(mx, my, z.label, acRGB);
      }
    }
  }

  // Internal — draws a tooltip bubble above the cursor
  _drawTooltip(mx, my, label, acRGB) {
    const pad = 8, th = 26;
    const tw  = max(textWidth(label) + pad * 2, 160);
    // Auto-flip: keep tooltip inside canvas horizontally
    let tx = mx - tw / 2;
    if (tx + tw > width  - 10) tx = width  - tw - 10;
    if (tx        < 10)        tx = 10;
    const ty = my - th - 12;
    fill(14, 16, 28, 230);
    stroke(acRGB[0], acRGB[1], acRGB[2], 160);
    strokeWeight(1);
    rect(tx, ty, tw, th, 4);
    fill(220, 228, 245);
    noStroke(); textSize(11); textAlign(LEFT, CENTER);
    text(label, tx + pad, ty + th / 2);
  }

  // Call in mousePressed() — fires node jump if a zone was hit.
  // Returns true to signal the click was consumed (prevents double-firing).
  hit(mx, my, ns) {
    for (const z of this._zones) {
      if (this._inZone(mx, my, z)) {
        ns.active = z.nodeIdx;
        ns.child  = -1;
        ns.fade   = 0;
        return true;
      }
    }
    return false;
  }
}

// ── PROBE POINT ───────────────────────────────────────
// Click a point on the viz to get a callout showing a computed value.
// A small × button on the callout lets the user dismiss it.
//
// Usage:
//   const probe = new ProbePoint();
//   // probe.register((x, y) => `value = ${compute(x,y)}`);
//   // In draw(): probe.draw(ns.acRGB);
//   // In mousePressed():
//   //   if      (probe.hitClear(mouseX, mouseY)) probe.clear();
//   //   else if (!ns.hit(mouseX, mouseY))        probe.set(mouseX, mouseY);
class ProbePoint {
  constructor() {
    this.x     = null;
    this.y     = null;
    this.label = '';
    this._fn   = null;
  }

  register(fn) { this._fn = fn; }   // fn(x, y) → string label

  set(x, y) {
    this.x     = x;
    this.y     = y;
    this.label = this._fn ? this._fn(x, y) : '';
  }

  clear() { this.x = null; this.y = null; }

  draw(acRGB) {
    if (this.x === null) return;

    // Anchor dot + glow
    safeGlow(this.x, this.y, 14, acRGB, 100);
    fill(acRGB[0], acRGB[1], acRGB[2]); noStroke();
    circle(this.x, this.y, 8);

    // Callout bubble
    const bw   = 200, bh = 26;
    const side = this.x < width / 2 ? 'right' : 'left';
    const bx   = side === 'right' ? this.x + 18 : this.x - bw - 18;
    const by   = this.y - bh / 2;

    stroke(acRGB[0], acRGB[1], acRGB[2], 140); strokeWeight(1);
    line(this.x, this.y, side === 'right' ? bx : bx + bw, this.y);

    fill(12, 14, 24, 220);
    stroke(acRGB[0], acRGB[1], acRGB[2], 100); strokeWeight(1);
    rect(bx, by, bw, bh, 4);

    fill(226, 232, 240); noStroke(); textSize(11);
    textAlign(LEFT, CENTER);
    text(this.label, bx + 8, this.y);

    // × dismiss button
    const cx2 = bx + bw - 14, cy2 = this.y;
    fill(100, 110, 130, 160); noStroke(); circle(cx2, cy2, 14);
    fill(200, 210, 225); textSize(10); textAlign(CENTER, CENTER);
    text('×', cx2, cy2);
  }

  // Returns true if × was clicked (caller should call probe.clear())
  hitClear(mx, my) {
    if (this.x === null) return false;
    const bw  = 200;
    const side = this.x < width / 2 ? 'right' : 'left';
    const bx  = side === 'right' ? this.x + 18 : this.x - bw - 18;
    const cx2 = bx + bw - 14;
    return dist(mx, my, cx2, this.y) < 10;
  }
}

// ── FORMULA BOX ───────────────────────────────────────
// Draws a formula bubble placed directly on the diagram.
// Supports an optional sub-label below the formula text.
//
// Usage:
//   formulaBox(512, 260, 'y = A · sin(ωt + φ)', acRGB);
//   formulaBox(512, 280, `P = ${P.toFixed(1)} bar`, acRGB,
//     { w: 280, sub: 'Pascal\'s Law' });
function formulaBox(x, y, formula, acRGB, opts = {}) {
  const bw = opts.w    ?? 260;
  const bh = opts.sub ? 52 : (opts.h ?? 32);
  const sz = opts.size ?? 13;

  fill(12, 14, 24, 215);
  stroke(acRGB[0], acRGB[1], acRGB[2], 90); strokeWeight(1);
  rect(x - bw / 2, y - bh / 2, bw, bh, 5);

  fill(acRGB[0], acRGB[1], acRGB[2]);
  noStroke(); textSize(sz); textAlign(CENTER, CENTER);
  text(formula, x, opts.sub ? y - 10 : y);

  if (opts.sub) {
    fill(148, 163, 184); textSize(10); textAlign(CENTER, CENTER);
    text(opts.sub, x, y + 12);
  }
}

// ── COLOR RAMP ────────────────────────────────────────
// Maps a 0–1 value to an RGB triple via defined colour stops.
//
// Usage:
//   const RAMP_HEAT = new ColorRamp([
//     { t:0.0, r:80,  g:140, b:255 },
//     { t:0.5, r:255, g:140, b:20  },
//     { t:1.0, r:255, g:40,  b:20  },
//   ]);
//   const [r,g,b] = RAMP_HEAT.at(map(temp, 0, 3500, 0, 1));
class ColorRamp {
  constructor(stops) { this.stops = stops; }

  at(t) {
    const s = this.stops;
    const c = constrain(t, 0, 1);
    for (let i = 0; i < s.length - 1; i++) {
      if (c >= s[i].t && c <= s[i + 1].t) {
        const f = (c - s[i].t) / (s[i + 1].t - s[i].t);
        return [
          lerp(s[i].r, s[i + 1].r, f),
          lerp(s[i].g, s[i + 1].g, f),
          lerp(s[i].b, s[i + 1].b, f),
        ];
      }
    }
    return [s[s.length - 1].r, s[s.length - 1].g, s[s.length - 1].b];
  }
}

// ── SUB PANEL ─────────────────────────────────────────
// Draws a framed sub-panel with a mini-title.
// Used in comparison sketches to avoid repeating background+border+title.
//
// Usage:
//   subPanel(20,  170, 490, 400, 'Disc Brake', hexRGB('#38bdf8'));
//   subPanel(514, 170, 490, 400, 'Drum Brake', hexRGB('#f472b6'));
function subPanel(x, y, w, h, title, rgb, opts = {}) {
  // Background
  fill(15, 15, 26); noStroke();
  rect(x, y, w, h, opts.radius ?? 6);
  // Border
  noFill();
  stroke(rgb[0], rgb[1], rgb[2], opts.borderAlpha ?? 55);
  strokeWeight(1);
  rect(x, y, w, h, opts.radius ?? 6);
  // Mini-title
  fill(rgb[0], rgb[1], rgb[2], opts.titleAlpha ?? 170);
  noStroke(); textSize(opts.titleSize ?? 12);
  textAlign(LEFT, TOP);
  text(title, x + 12, y + 10);
}

// ── SPAN ANNOTATION ───────────────────────────────────
// Double-headed arrow between two x-positions with a centred label above.
// Used for wavelength, piston stroke, bond length, turns count, etc.
//
// Usage:
//   spanAnnotation(peak1X, peak2X, cy + A + 40, `λ = ${lam.toFixed(0)}px`, acRGB);
function spanAnnotation(x1, x2, y, label, rgb, opts = {}) {
  const ay = y + (opts.offset ?? 0);
  stroke(rgb[0], rgb[1], rgb[2], opts.alpha ?? 160);
  strokeWeight(opts.weight ?? 1.5); noFill();
  line(x1, ay, x2, ay);
  // Arrowheads
  fill(rgb[0], rgb[1], rgb[2], opts.alpha ?? 160); noStroke();
  triangle(x1 + 8, ay - 4, x1 + 8, ay + 4, x1, ay);
  triangle(x2 - 8, ay - 4, x2 - 8, ay + 4, x2, ay);
  // Vertical tick marks
  stroke(rgb[0], rgb[1], rgb[2], (opts.alpha ?? 160) * 0.5);
  strokeWeight(1);
  line(x1, ay - 6, x1, ay + 6);
  line(x2, ay - 6, x2, ay + 6);
  // Label
  fill(226, 232, 240, opts.alpha ?? 160);
  noStroke(); textSize(opts.size ?? 11);
  textAlign(CENTER, BOTTOM);
  text(label, (x1 + x2) / 2, ay - 6);
}
