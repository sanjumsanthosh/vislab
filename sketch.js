// ════════════════════════════════════════════
//  WAVE INTERFERENCE — Example Sketch
//  Uses VisLab preamble: StepManager, LAYOUT,
//  Tweakpane helpers, drawCrosshair, safeGlow
// ════════════════════════════════════════════

// 1. Define steps — just content, no UI code needed
const steps = new StepManager([
  {
    title: 'Step 1 — Single Wave',
    body: [
      'A wave is a repeating oscillation.',
      'Drag the mouse over the viz to probe',
      'the wave amplitude at any point.',
      '!!Key idea: frequency controls cycles/sec.',
      'Try the frequency slider below!'
    ],
    formula: 'y = A · sin(2π·f·x - t)'
  },
  {
    title: 'Step 2 — Two Waves',
    body: [
      'Add a second wave with its own frequency.',
      'When two waves meet, they add together.',
      '!!This is called superposition.',
      'Notice constructive & destructive zones.'
    ],
    formula: 'y = y₁ + y₂'
  },
  {
    title: 'Step 3 — Interference Pattern',
    body: [
      'Move the mouse left/right to change',
      'the phase offset between both waves.',
      '!!Phase difference creates standing waves.',
      'At 180° offset: complete cancellation!',
      'This is how noise-cancelling works.'
    ],
    formula: 'Δφ = mouseX / vizWidth · 2π'
  }
]);

// 2. Tweakpane params — the LLM only writes these
const params = {
  freq1:     2.0,
  freq2:     3.0,
  amplitude: 80
};

let pane, navBtns;

function setup() {
  createCanvas(1024, 1024);
  updateLAYOUT();

  // Tweakpane replaces ALL hand-drawn sliders
  pane = makePane('Wave Controls');
  addSlider(pane, params, 'freq1',     { min:0.5, max:10, step:0.1, label:'Freq 1 (Hz)' });
  addSlider(pane, params, 'freq2',     { min:0.5, max:10, step:0.1, label:'Freq 2 (Hz)' });
  addSlider(pane, params, 'amplitude', { min:10,  max:150, step:1, label:'Amplitude' });
}

function draw() {
  background('#0a0a0f');
  steps.update();

  // ── Draw UI shell from preamble ──
  steps.drawTitleBar(window);
  navBtns = steps.drawNavButtons(window);
  steps.drawPanel(window);

  // ── Viz zone background ──
  const vz = LAYOUT.VIZ;
  fill('#0f0f1a'); noStroke();
  rect(vz.x, vz.y, vz.w, vz.h);

  // ── Mouse-controlled phase ──
  const phase = inZone(mouseX, mouseY, vz)
    ? map(mouseX, vz.x, vz.x+vz.w, 0, TWO_PI)
    : 0;

  const cx = vz.x + vz.w/2;
  const cy = vz.y + vz.h/2;
  const t  = frameCount * 0.03;

  // Draw wave 1
  stroke('#38bdf8'); strokeWeight(2.5); noFill();
  beginShape();
  for (let x = vz.x; x < vz.x + vz.w; x++) {
    const xn = map(x, vz.x, vz.x+vz.w, 0, TWO_PI*params.freq1);
    const y  = cy - params.amplitude * sin(xn - t);
    vertex(x, y);
  }
  endShape();

  if (steps.current >= 1) {
    // Draw wave 2
    stroke('#4ade80'); strokeWeight(2.5); noFill();
    beginShape();
    for (let x = vz.x; x < vz.x + vz.w; x++) {
      const xn = map(x, vz.x, vz.x+vz.w, 0, TWO_PI*params.freq2);
      const y  = cy - params.amplitude * sin(xn - t + phase);
      vertex(x, y);
    }
    endShape();
  }

  if (steps.current >= 2) {
    // Draw superposition
    stroke('#f59e0b'); strokeWeight(3); noFill();
    beginShape();
    for (let x = vz.x; x < vz.x + vz.w; x++) {
      const xn1 = map(x, vz.x, vz.x+vz.w, 0, TWO_PI*params.freq1);
      const xn2 = map(x, vz.x, vz.x+vz.w, 0, TWO_PI*params.freq2);
      const y1  = params.amplitude * sin(xn1 - t);
      const y2  = params.amplitude * sin(xn2 - t + phase);
      vertex(x, cy - (y1+y2)/2);
    }
    endShape();
    // Labels
    noStroke(); fill('#38bdf8'); textSize(12); textAlign(LEFT);
    text('Wave 1', vz.x+8, vz.y+20);
    fill('#4ade80'); text('Wave 2', vz.x+8, vz.y+36);
    fill('#f59e0b'); text('Sum',    vz.x+8, vz.y+52);
  }

  // Crosshair from preamble
  drawCrosshair(window, mouseX, mouseY);

  // Glow on mouse in viz
  if (inZone(mouseX, mouseY, vz)) {
    safeGlow(mouseX, mouseY, 20, hexRGB(steps.color), 40);
  }
}

function mousePressed() {
  if (navBtns) {
    const {prev, next} = navBtns;
    if (mouseX > prev.x && mouseX < prev.x+prev.w &&
        mouseY > prev.y && mouseY < prev.y+prev.h) steps.prev();
    if (mouseX > next.x && mouseX < next.x+next.w &&
        mouseY > next.y && mouseY < next.y+next.h) steps.next();
  }
}
