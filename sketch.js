// ════════════════════════════════════════════
//  TLS HANDSHAKE VISUALIZATION
//  Interactive diagram of certificate validation,
//  key exchange, and session key derivation
// ════════════════════════════════════════════

// Define the main narrative steps
const NODES = [
  {
    label: '1. Hello',
    color: '#38bdf8',
    accent: '!!Client and server first agree on protocol and ciphers.',
    caption: [
      'ClientHello: version, cipher suites, random C.',
      'ServerHello: chosen cipher, random S, certificate.'
    ]
  },
  {
    label: '2. Identity',
    color: '#4ade80',
    accent: '!!The certificate binds the server public key to its name.',
    caption: [
      'Browser checks the certificate chain and hostname.',
      'If trust fails, the handshake cannot continue securely.'
    ]
  },
  {
    label: '3. Key Exch.',
    color: '#f59e0b',
    accent: '!!Diffie-Hellman builds a shared secret over a public network.',
    caption: [
      'Client and server exchange ECDHE public keys.',
      'Both derive the same pre-master secret using their private keys.'
    ]
  },
  {
    label: '4. Sess. Keys',
    color: '#f472b6',
    accent: '!!A KDF stretches the secret into symmetric keys and IVs.',
    caption: [
      'Use a PRF or HKDF on secret plus randoms C and S.',
      'Result: symmetric encryption and MAC keys for this session.'
    ]
  },
  {
    label: '5. Finished',
    color: '#a78bfa',
    accent: '!!Finished messages prove both sides derived the same keys.',
    caption: [
      'Each side sends an encrypted Finished MAC over the transcript.',
      'If verification passes, application data flows securely.'
    ]
  }
];

const ns = new NodeSystem(NODES);
const hints = new HintSystem();

const RAMP_PRESSURE = new ColorRamp([
  { t: 0, r: 56, g: 189, b: 248 },
  { t: 0.5, r: 74, g: 222, b: 128 },
  { t: 1, r: 248, g: 113, b: 113 }
]);

const RAMP_HEAT = new ColorRamp([
  { t: 0, r: 80, g: 140, b: 255 },
  { t: 0.5, r: 255, g: 140, b: 20 },
  { t: 1, r: 255, g: 40, b: 20 }
]);

const params = {
  tlsVersion: 1.2,
  useECDHE: 1,
  certTrust: 1,
  randomness: 0.8,
  showMath: 1
};

let pane;

function setup() {
  createCanvas(1280, 800);
  updateLAYOUT();

  hints.register([
    'Follow the rail from ClientHello to encrypted data.',
    'Toggle ECDHE to compare RSA vs ECDHE handshake.',
    'Change random entropy to see key strength glows.',
    'Toggle Show Math to reveal key derivation equations.'
  ]);

  pane = makePane('TLS Controls');

  addSlider(pane, params, 'tlsVersion', {
    min: 1.0, max: 1.3, step: 0.1, label: 'TLS version'
  });
  addSlider(pane, params, 'useECDHE', {
    min: 0, max: 1, step: 1, label: 'ECDHE (1) / RSA (0)'
  });
  addSlider(pane, params, 'certTrust', {
    min: 0, max: 1, step: 0.01, label: 'Cert trust'
  });
  addSlider(pane, params, 'randomness', {
    min: 0.2, max: 1.0, step: 0.01, label: 'Key entropy'
  });
  addSlider(pane, params, 'showMath', {
    min: 0, max: 1, step: 1, label: 'Show math'
  });

  addButton(pane, 'Reset', function() {
    params.tlsVersion = 1.2;
    params.useECDHE = 1;
    params.certTrust = 1;
    params.randomness = 0.8;
    params.showMath = 1;
  });
}

function draw() {
  background('#0a0a0f');
  ns.update();
  ns.drawRail();

  // VIZ background
  fill(15, 15, 26);
  noStroke();
  rect(LAYOUT.VIZ.x, LAYOUT.VIZ.y, LAYOUT.VIZ.w, LAYOUT.VIZ.h);

  // PANEL background
  fill(12, 14, 24);
  noStroke();
  rect(LAYOUT.PANEL.x, LAYOUT.PANEL.y, LAYOUT.PANEL.w, LAYOUT.PANEL.h);

  var acRGB = ns.acRGB;

  drawHandshakeFlow(acRGB);
  drawPanels(acRGB);

  ns.drawCaption();

  // Draw hints last so the popup is always on top
  hints.draw(ns.acRGB);
}

// ── handshake flow diagram (left VIZ zone) ──
function drawHandshakeFlow(acRGB) {
  var vizX = LAYOUT.VIZ.x;
  var vizW = LAYOUT.VIZ.w;
  var clientX = vizX + vizW * 0.18;
  var serverX = vizX + vizW * 0.82;
  var midX = (clientX + serverX) / 2;

  // Actor labels
  noStroke();
  fill(148, 163, 184);
  textAlign(CENTER, CENTER);
  textSize(13);
  text('Client (browser)', clientX, LAYOUT.VIZ.y + 14);
  text('Server (website)', serverX, LAYOUT.VIZ.y + 14);

  // Vertical lifelines
  stroke(51, 65, 85);
  strokeWeight(1);
  line(clientX, LAYOUT.VIZ.y + 28, clientX, LAYOUT.VIZ.y + LAYOUT.VIZ.h - 40);
  line(serverX, LAYOUT.VIZ.y + 28, serverX, LAYOUT.VIZ.y + LAYOUT.VIZ.h - 40);

  // Message flow
  var baseY = LAYOUT.VIZ.y + 50;
  var stepGap = 36;

  textAlign(CENTER, CENTER);
  textSize(10);

  // 1. ClientHello
  drawArrow(clientX, baseY, serverX, baseY, 120, 120, 220);
  fill(226, 232, 240);
  noStroke();
  text('ClientHello: version, ciphers, random C', midX, baseY - 10);

  // 2. ServerHello
  drawArrow(serverX, baseY + stepGap, clientX, baseY + stepGap, 120, 220, 120);
  fill(226, 232, 240);
  noStroke();
  text('ServerHello: cipher, random S, cert', midX, baseY + stepGap - 10);

  // 3. Key Exchange
  var tlsT = map(params.tlsVersion, 1.0, 1.3, 0, 1);
  var vrgb = RAMP_PRESSURE.at(tlsT);
  var midY = baseY + stepGap * 2;
  drawArrow(clientX, midY, serverX, midY, vrgb[0], vrgb[1], vrgb[2]);
  fill(226, 232, 240);
  noStroke();
  if (params.useECDHE > 0.5) {
    text('KeyShare (ECDHE): client public key', midX, midY - 10);
  } else {
    text('ClientKeyExchange: RSA encrypted secret', midX, midY - 10);
  }

  // 4. ChangeCipherSpec + Finished
  var changeY = baseY + stepGap * 3;
  drawArrow(clientX, changeY, serverX, changeY, 94, 234, 212);
  fill(226, 232, 240);
  noStroke();
  text('ChangeCipherSpec + Finished (client)', midX, changeY - 10);

  drawArrow(serverX, changeY + stepGap, clientX, changeY + stepGap, 94, 234, 212);
  fill(226, 232, 240);
  noStroke();
  text('ChangeCipherSpec + Finished (server)', midX, changeY + stepGap - 10);

  // 5. Application Data
  var dataY = baseY + stepGap * 5;
  var entropyT = constrain(params.randomness, 0.2, 1.0);
  var heatCol = RAMP_HEAT.at(map(entropyT, 0.2, 1.0, 0, 1));
  drawArrow(clientX, dataY, serverX, dataY, heatCol[0], heatCol[1], heatCol[2]);
  drawArrow(serverX, dataY + 22, clientX, dataY + 22, heatCol[0], heatCol[1], heatCol[2]);
  fill(226, 232, 240);
  noStroke();
  text('Application data (encrypted)', midX, dataY - 10);

  // Trust indicator - server cert box
  var trustT = constrain(params.certTrust, 0, 1);
  var trustCol = RAMP_PRESSURE.at(trustT);
  var certY = dataY + stepGap + 30;

  // Server cert box
  fill(15, 23, 42);
  stroke(55, 65, 81);
  strokeWeight(1);
  rect(serverX - 60, certY, 120, 40, 6);

  noStroke();
  fill(trustCol[0], trustCol[1], trustCol[2]);
  circle(serverX - 40, certY + 20, 16);
  safeGlow(serverX - 40, certY + 20, 14, trustCol, 70);

  fill(148, 163, 184);
  textSize(9);
  textAlign(LEFT, CENTER);
  text('Server cert', serverX - 26, certY + 14);
  text('trust: ' + nf(trustT, 1, 2), serverX - 26, certY + 28);

  // Client key material
  fill(15, 23, 42);
  stroke(55, 65, 81);
  strokeWeight(1);
  rect(clientX - 60, certY, 120, 40, 6);

  noStroke();
  fill(heatCol[0], heatCol[1], heatCol[2]);
  circle(clientX - 40, certY + 20, 16);
  safeGlow(clientX - 40, certY + 20, 14, heatCol, 70);

  fill(148, 163, 184);
  textSize(9);
  textAlign(LEFT, CENTER);
  text('Key material', clientX - 26, certY + 14);
  text('entropy: ' + nf(entropyT, 1, 2), clientX - 26, certY + 28);

  // Math overlay (when enabled)
  if (ns.active >= 3 && params.showMath > 0.5) {
    drawKeyMathFixed(acRGB, clientX, serverX);
  }
}

function drawArrow(x1, y1, x2, y2, r, g, b) {
  stroke(r, g, b);
  strokeWeight(2);
  line(x1, y1, x2, y2);

  var ang = atan2(y2 - y1, x2 - x1);
  var head = 6;
  var hx = x2 - cos(ang) * 2;
  var hy = y2 - sin(ang) * 2;

  line(hx, hy, hx - head * cos(ang - PI / 6), hy - head * sin(ang - PI / 6));
  line(hx, hy, hx - head * cos(ang + PI / 6), hy - head * sin(ang + PI / 6));
}

function drawKeyMathFixed(acRGB, clientX, serverX) {
  var entropyT = constrain(params.randomness, 0.2, 1.0);
  var mathX = (clientX + serverX) / 2;
  var mathY = LAYOUT.VIZ.y + LAYOUT.VIZ.h - 80;

  if (params.useECDHE > 0.5) {
    formulaBox(mathX, mathY, 'shared_secret = g^ab mod p', acRGB,
      { w: 240, h: 28, size: 11, sub: 'DH shared secret' }
    );
  } else {
    formulaBox(mathX, mathY, 'pre_master = RSA_decrypt(ct)', acRGB,
      { w: 240, h: 28, size: 11, sub: 'RSA pre-master secret' }
    );
  }

  var heatCol = RAMP_HEAT.at(map(entropyT, 0.2, 1.0, 0, 1));
  formulaBox(mathX, mathY + 46, 'keys = KDF(secret, randoms)', heatCol,
    { w: 240, h: 28, size: 11, sub: 'Symmetric write keys + IVs' }
  );
}

// ── info panels (right PANEL zone) ──
function drawPanels(acRGB) {
  var px = LAYOUT.PANEL.x + 8;
  var panelW = LAYOUT.PANEL.w - 16;
  var panelY = LAYOUT.PANEL.y;
  var panelH = Math.floor(LAYOUT.PANEL.h * 0.52);
  var lh = 17;

  subPanel(px, panelY, panelW, panelH, 'What is this diagram showing?', acRGB);

  var tx = px + 14;
  var ty = panelY + 30;

  noStroke();
  fill(226, 232, 240);
  textAlign(LEFT, TOP);
  textSize(11);
  text('TLS handshake: authenticates server,', tx, ty);
  ty += lh;
  text('agrees encryption parameters.', tx, ty);
  ty += lh + 4;
  text('1. ClientHello/ServerHello negotiate', tx, ty);
  ty += lh;
  text('   version and cipher suites.', tx, ty);
  ty += lh;
  text('2. Server presents certificate (identity).', tx, ty);
  ty += lh;
  text('3. Key exchange builds shared secret.', tx, ty);
  ty += lh;
  text('4. KDF derives symmetric session keys.', tx, ty);
  ty += lh;
  text('5. Finished messages verify both sides.', tx, ty);

  ty += lh + 6;
  fill(148, 163, 184);
  textSize(10);
  var mode = params.useECDHE > 0.5 ? 'ECDHE (forward secure)' : 'RSA (legacy)';
  text('Mode: ' + mode, tx, ty);

  // Security panel — positioned above where Tweakpane sits
  var secY = panelY + panelH + 8;
  var secH = Math.floor(LAYOUT.PANEL.h * 0.28);

  subPanel(px, secY, panelW, secH, 'Security intuition', acRGB);

  tx = px + 14;
  ty = secY + 28;

  fill(226, 232, 240);
  textSize(10);
  text('Cert trust: is this server who it claims?', tx, ty);
  ty += lh;
  text('Key entropy: how hard to brute-force?', tx, ty);
  ty += lh;
  text('Forward secrecy (ECDHE): protects past', tx, ty);
  ty += lh;
  text('traffic if server key is later stolen.', tx, ty);
}

function mousePressed() {
  if (hints.hit(mouseX, mouseY)) return;
  ns.hit(mouseX, mouseY);
}
