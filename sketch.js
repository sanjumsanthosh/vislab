// ════════════════════════════════════════════
//  TLS HANDSHAKE VISUALIZATION
//  Interactive diagram of certificate validation,
//  key exchange, and session key derivation
// ════════════════════════════════════════════

// Define the main narrative steps
const NODES = [
  {
    label: '1. Hello & Capabilities',
    color: '#38bdf8',
    accent: '!!Client and server first agree on protocol and ciphers.',
    caption: [
      'ClientHello: version, cipher suites, random C.',
      'ServerHello: chosen cipher, random S, certificate.'
    ]
  },
  {
    label: '2. Prove Identity',
    color: '#4ade80',
    accent: '!!The certificate binds the server public key to its name.',
    caption: [
      'Browser checks the certificate chain and hostname.',
      'If trust fails, the handshake cannot continue securely.'
    ]
  },
  {
    label: '3. Key Exchange',
    color: '#f59e0b',
    accent: '!!Diffie–Hellman builds a shared secret over a public network.',
    caption: [
      'Client and server exchange ECDHE public keys.',
      'Both derive the same pre-master secret using their private keys.'
    ]
  },
  {
    label: '4. Session Keys',
    color: '#f472b6',
    accent: '!!A KDF stretches the secret into symmetric keys and IVs.',
    caption: [
      'Use a PRF or HKDF on secret plus randoms C and S.',
      'Result: symmetric encryption and MAC keys for this session.'
    ]
  },
  {
    label: '5. Finished & Secure Data',
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
  createCanvas(1910, 903);
  updateLAYOUT();

  hints.register([
    'Follow the rail from ClientHello to encrypted data.',
    'Move Use ECDHE to switch between RSA style and ECDHE style handshakes.',
    'Change random entropy and see how it affects key strength glows.',
    'Toggle Show Math to reveal the key derivation equations.'
  ]);

  pane = makePane('TLS Handshake Visual');

  addSlider(pane, params, 'tlsVersion', {
    min: 1.0, max: 1.3, step: 0.1, label: 'TLS version (1.0–1.3)'
  });
  addSlider(pane, params, 'useECDHE', {
    min: 0, max: 1, step: 1, label: 'Key exchange: 0 = RSA, 1 = ECDHE'
  });
  addSlider(pane, params, 'certTrust', {
    min: 0, max: 1, step: 0.01, label: 'Certificate trust (0–1)'
  });
  addSlider(pane, params, 'randomness', {
    min: 0.2, max: 1.0, step: 0.01, label: 'Random entropy of keys'
  });
  addSlider(pane, params, 'showMath', {
    min: 0, max: 1, step: 1, label: 'Show equations'
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
  hints.draw(ns.acRGB);

  fill(15, 15, 26);
  noStroke();
  rect(LAYOUT.VIZ.x, LAYOUT.VIZ.y, LAYOUT.VIZ.w, LAYOUT.VIZ.h);

  const acRGB = ns.acRGB;

  drawActors(acRGB);
  drawHandshakeFlow(acRGB);
  drawPanels(acRGB);

  ns.drawCaption();
}

function drawActors(acRGB) {
  const spacing = width / 6;

  const clientX = spacing * 1;
  const serverX = spacing * 5;
  const nodeY = 260;
  const keyRingY = 360;

  stroke(51, 65, 85);
  strokeWeight(2);
  line(clientX, 140, clientX, height - 260);
  line(serverX, 140, serverX, height - 260);

  noStroke();
  fill(148, 163, 184);
  textAlign(CENTER, CENTER);
  textSize(16);
  text('Client (browser)', clientX, 120);
  text('Server (website)', serverX, 120);

  fill(31, 41, 55);
  stroke(55, 65, 81);
  rectMode(CENTER);
  rect(clientX, nodeY, 140, 60, 10);
  rect(serverX, nodeY, 140, 60, 10);

  noStroke();
  fill(226, 232, 240);
  textSize(14);
  text('Sends ClientHello', clientX, nodeY);
  text('Sends ServerHello', serverX, nodeY);

  const trustT = constrain(params.certTrust, 0, 1);
  const trustCol = RAMP_PRESSURE.at(trustT);

  rectMode(CENTER);
  stroke(55, 65, 81);
  strokeWeight(2);
  fill(15, 23, 42);
  rect(serverX, keyRingY, 160, 70, 10);

  const lockY = keyRingY - 10;
  noStroke();
  fill(trustCol, trustCol, trustCol);

  rect(serverX, lockY, 30, 24, 6);
  rect(serverX, lockY - 16, 20, 14, 12);

  fill(148, 163, 184);
  textSize(12);
  text('Server certificate', serverX, keyRingY + 10);
  text('and public key', serverX, keyRingY + 24);

  safeGlow(serverX, keyRingY, 20, trustCol, 80);

  const entropyT = constrain(params.randomness, 0.2, 1.0);
  const heatCol = RAMP_HEAT.at(map(entropyT, 0.2, 1.0, 0, 1));

  const keyBaseY = keyRingY + 80;
  noStroke();
  fill(15, 23, 42);
  rect(clientX, keyBaseY, 150, 50, 10);
  rect(serverX, keyBaseY, 150, 50, 10);

  drawKeyIcon(clientX - 25, keyBaseY, heatCol);
  drawKeyIcon(serverX + 25, keyBaseY, heatCol);

  fill(148, 163, 184);
  textSize(12);
  text('Client key material', clientX, keyBaseY + 20);
  text('Server key material', serverX, keyBaseY + 20);

  safeGlow(clientX - 25, keyBaseY, 18, heatCol, 70);
  safeGlow(serverX + 25, keyBaseY, 18, heatCol, 70);
}

function drawKeyIcon(x, y, rgb) {
  stroke(rgb, rgb, rgb);
  strokeWeight(2);
  noFill();
  circle(x, y - 8, 16);
  line(x + 8, y - 8, x + 24, y - 8);
  line(x + 16, y - 8, x + 16, y + 10);
  noStroke();
  fill(rgb, rgb, rgb);
  circle(x, y - 8, 4);
}

function drawHandshakeFlow(acRGB) {
  const spacing = width / 6;
  const clientX = spacing * 1;
  const serverX = spacing * 5;

  const baseY = 190;
  const stepGap = 40;

  textAlign(CENTER, CENTER);
  textSize(11);

  const tlsT = map(params.tlsVersion, 1.0, 1.3, 0, 1);
  const vrgb = RAMP_PRESSURE.at(tlsT);

  noStroke();
  fill(148, 163, 184);
  textAlign(LEFT, CENTER);
  textSize(13);
  text('Logical message flow (simplified)', clientX, baseY - 32);

  drawArrow(clientX, baseY, serverX, baseY, 120, 120, 220);
  fill(226, 232, 240);
  textAlign(CENTER, CENTER);
  text('ClientHello', (clientX + serverX) / 2, baseY - 14);
  text('version, ciphers, random C', (clientX + serverX) / 2, baseY + 2);

  drawArrow(serverX, baseY + stepGap, clientX, baseY + stepGap, 120, 220, 120);
  fill(226, 232, 240);
  text('ServerHello', (clientX + serverX) / 2, baseY + stepGap - 14);
  text('random S, chosen cipher, certificate', (clientX + serverX) / 2, baseY + stepGap + 2);

  const midY = baseY + stepGap * 2;
  drawArrow(clientX, midY, serverX, midY, vrgb, vrgb, vrgb);

  fill(226, 232, 240);

  if (params.useECDHE > 0.5) {
    text('KeyShare (ECDHE)', (clientX + serverX) / 2, midY - 14);
    text('client public key', (clientX + serverX) / 2, midY + 2);
  } else {
    text('ClientKeyExchange', (clientX + serverX) / 2, midY - 14);
    text('pre-master secret encrypted with RSA', (clientX + serverX) / 2, midY + 2);
  }

  const changeY = baseY + stepGap * 3;
  drawArrow(clientX, changeY, serverX, changeY, 94, 234, 212);
  drawArrow(serverX, changeY + stepGap, clientX, changeY + stepGap, 94, 234, 212);

  fill(226, 232, 240);
  text('ChangeCipherSpec and Finished', (clientX + serverX) / 2, changeY - 14);
  text('encrypted MAC over transcript', (clientX + serverX) / 2, changeY + 2);
  text('Server ChangeCipherSpec and Finished', (clientX + serverX) / 2, changeY + stepGap - 14);

  const dataY = baseY + stepGap * 5;
  const entropyT = constrain(params.randomness, 0.2, 1.0);
  const heatCol = RAMP_HEAT.at(map(entropyT, 0.2, 1.0, 0, 1));
  drawArrow(clientX, dataY, serverX, dataY, heatCol, heatCol, heatCol);

  drawArrow(serverX, dataY + 26, clientX, dataY + 26, heatCol, heatCol, heatCol);

  fill(226, 232, 240);
  text('Application data', (clientX + serverX) / 2, dataY - 14);
  text('encrypted with session keys', (clientX + serverX) / 2, dataY + 2);
  text('Application data encrypted', (clientX + serverX) / 2, dataY + 22);

  if (ns.active >= 3 && params.showMath > 0.5) {
    drawKeyMathFixed(acRGB, clientX, serverX);
  }
}

function drawArrow(x1, y1, x2, y2, r, g, b) {
  stroke(r, g, b);
  strokeWeight(2);
  line(x1, y1, x2, y2);

  const ang = atan2(y2 - y1, x2 - x1);
  const head = 6;
  const hx = x2 - cos(ang) * 2;
  const hy = y2 - sin(ang) * 2;

  line(hx, hy, hx - head * cos(ang - PI / 6), hy - head * sin(ang - PI / 6));
  line(hx, hy, hx - head * cos(ang + PI / 6), hy - head * sin(ang + PI / 6));
}

function drawKeyMathFixed(acRGB, clientX, serverX) {
  const tlsT = map(params.tlsVersion, 1.0, 1.3, 0, 1);
  const entropyT = constrain(params.randomness, 0.2, 1.0);
  const mathX = width / 2;
  const mathY = 520;

  if (params.useECDHE > 0.5) {
    formulaBox(mathX - 220, mathY, 'shared_secret = g^ab mod p', acRGB,
      { w: 260, h: 32, size: 13, sub: 'Diffie-Hellman builds shared secret.' }
    );
  } else {
    formulaBox(mathX - 220, mathY, 'pre_master = RSA_decrypt(ct)', acRGB,
      { w: 280, h: 32, size: 13, sub: 'RSA encrypts pre-master secret.' }
    );
  }

  const heatCol = RAMP_HEAT.at(map(entropyT, 0.2, 1.0, 0, 1));
  formulaBox(mathX + 220, mathY, 'master = PRF(secret, randoms)', heatCol,
    { w: 320, h: 32, size: 12, sub: 'KDF stretches secret into master.' }
  );

  formulaBox(mathX, mathY + 70, 'keys = KDF(master, expansion)', heatCol,
    { w: 320, h: 32, size: 12, sub: 'Yields symmetric write keys and IVs.' }
  );

  const spanY = mathY + 120;
  spanAnnotation(clientX, serverX, spanY, 'Both sides share symmetric keys', acRGB,
    { offset: 0, alpha: 180, weight: 1.5, size: 11 }
  );
}

function drawPanels(acRGB) {
  const panelX = 1260;
  const panelY = 80;
  const panelW = 610;
  const panelH = 310;

  subPanel(panelX, panelY, panelW, panelH, 'What is this diagram showing?', acRGB, {
    size: 13
  });

  let tx = panelX + 16;
  let ty = panelY + 34;
  const lh = 18;

  noStroke();
  fill(226, 232, 240);
  textAlign(LEFT, TOP);
  textSize(12);
  text('- TLS handshake: authenticates server and agrees encryption', tx, ty);
  ty += lh;
  text('- ClientHello and ServerHello negotiate version and cipher suites', tx, ty);
  ty += lh;
  text('- Server presents a certificate that binds its identity to a public key', tx, ty);
  ty += lh;
  text('- Key exchange (ECDHE in modern TLS) builds a shared secret', tx, ty);
  ty += lh;
  text('- KDF turns the secret plus randoms into symmetric session keys', tx, ty);
  ty += lh;
  text('- Finished messages prove both sides derived the same keys', tx, ty);

  ty += lh * 2;
  fill(148, 163, 184);
  textSize(11);
  const mode = params.useECDHE > 0.5 ? 'ECDHE (forward secure)' : 'RSA (legacy)';
  text('Key exchange mode: ' + mode, tx, ty);
  ty += lh;
  text('TLS version slider: higher roughly means newer protocol features', tx, ty);
  ty += lh;
  text('Random entropy slider: higher means stronger, less predictable secrets', tx, ty);

  const secPanelY = panelY + panelH + 20;
  const secPanelH = 210;

  subPanel(panelX, secPanelY, panelW, secPanelH, 'Security intuition', acRGB, {
    size: 13
  });

  tx = panelX + 16;
  ty = secPanelY + 34;

  const trustT = constrain(params.certTrust, 0, 1);
  const trustCol = RAMP_PRESSURE.at(trustT);
  const entropyT = constrain(params.randomness, 0.2, 1.0);
  const heatCol = RAMP_HEAT.at(map(entropyT, 0.2, 1.0, 0, 1));

  fill(226, 232, 240);
  textSize(12);
  text('- Certificate trust (server lock glow) asks: do I believe this server identity', tx, ty);
  ty += lh;
  text('- Key entropy (key glows) asks: how hard is it to brute force the session keys', tx, ty);
  ty += lh;
  text('- Even strong keys cannot save you from a forged or untrusted certificate', tx, ty);
  ty += lh;
  text('- Forward secrecy (ECDHE) protects past traffic if the server key is later stolen', tx, ty);

  ty += lh * 2;
  fill(148, 163, 184);
  textSize(11);
  text('Certificate trust level: ' + nf(trustT, 1, 2), tx, ty);
  ty += lh;
  text('Key entropy level: ' + nf(entropyT, 1, 2), tx, ty);
}

function mousePressed() {
  if (hints.hit(mouseX, mouseY)) return;
  ns.hit(mouseX, mouseY);
}
