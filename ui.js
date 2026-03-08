// ── Initialize CodeMirror ──────────────────────────────
const cm = CodeMirror.fromTextArea(document.getElementById('code-input'), {
  mode: 'javascript',
  theme: 'dracula',
  lineNumbers: true,
  matchBrackets: true,
  autoCloseBrackets: true,
  indentUnit: 2,
  tabSize: 2,
  lineWrapping: false,
  extraKeys: {
    'Ctrl-Enter': runSketch,
    'Cmd-Enter':  runSketch
  }
});

// Make editor fill its container
setTimeout(() => {
  const wrap = document.getElementById('editor-wrap');
  cm.setSize('100%', wrap.offsetHeight + 'px');
}, 50);
window.addEventListener('resize', () => {
  const wrap = document.getElementById('editor-wrap');
  cm.setSize('100%', wrap.offsetHeight + 'px');
});

// ── Console capture ────────────────────────────────────
const consoleEl = document.getElementById('console-panel');
function logToConsole(msg, type='log') {
  const div = document.createElement('div');
  div.className = type;
  div.textContent = '> ' + msg;
  consoleEl.appendChild(div);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

// ── Preamble — fetched once at startup ────────────────
let _preambleSrc = '';
const _preambleReady = fetch('preamble.js')
  .then(r => r.text())
  .then(src => { _preambleSrc = src; })
  .catch(err => logToConsole('Warning: could not load preamble.js — ' + err, 'warn'));

// ── Sketch runtime state ───────────────────────────────
let currentSketchEl = null;
let tweakpaneInstance = null;
let fpsInterval = null;

// ── Raw/Debug view state ───────────────────────────────
let _lastRawHtml = '';
let _rawViewActive = false;

// ── Scale preview iframe to fill the canvas container ──
const DESIGN_W = 1280;
const DESIGN_H = 800;

function scalePreview() {
  const container = document.getElementById('canvas-container');
  const mount     = document.getElementById('sketch-mount');
  const iframe    = mount.querySelector('iframe');
  if (!iframe) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  const scale = Math.min(w / DESIGN_W, h / DESIGN_H);
  iframe.style.transform = 'scale(' + scale + ')';
  iframe.style.transformOrigin = 'top left';
  mount.style.width  = Math.round(DESIGN_W * scale) + 'px';
  mount.style.height = Math.round(DESIGN_H * scale) + 'px';
}

window.addEventListener('resize', scalePreview);

function stopSketch() {
  if (tweakpaneInstance) {
    try { tweakpaneInstance.dispose(); } catch(e) {}
    tweakpaneInstance = null;
  }
  const mount = document.getElementById('sketch-mount');
  mount.innerHTML = '';
  currentSketchEl = null;
  clearInterval(fpsInterval);
  document.getElementById('fps-display').textContent = 'fps: —';
  document.getElementById('status-msg').textContent = 'Sketch stopped.';
  document.getElementById('status-msg').className = '';
  logToConsole('Sketch stopped.', 'warn');
}

// ── Raw/Debug view toggle ──────────────────────────────
function setRawView(active) {
  _rawViewActive = active;
  document.getElementById('canvas-container').style.display = active ? 'none' : '';
  const rawView = document.getElementById('raw-view');
  rawView.style.display = active ? 'flex' : 'none';
  const btn = document.getElementById('raw-toggle-btn');
  btn.textContent = active ? '🎨 Render' : '⟨/⟩ Raw';
  btn.title = active ? 'Switch to rendered canvas' : 'View raw injected HTML/JS source';
  if (active) {
    document.getElementById('raw-source').textContent =
      _lastRawHtml || '(No sketch has been run yet — press Run first.)';
  }
}

function toggleRawView() {
  setRawView(!_rawViewActive);
}

async function runSketch() {
  stopSketch();
  clearConsole();

  // Ensure preamble is loaded
  if (!_preambleSrc) {
    try { await _preambleReady; } catch(e) {
      logToConsole('Failed to load preamble.js: ' + e, 'error');
      return;
    }
  }

  // Switch back to render mode when running
  if (_rawViewActive) setRawView(false);

  const preamble = _preambleSrc;
  const userCode = cm.getValue();

  // Count lines
  const totalLines = userCode.split('\n').length;
  document.getElementById('status-size').textContent = totalLines + ' lines';

  const mount = document.getElementById('sketch-mount');

  // Inject into iframe for isolation
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'border:none; display:block; transform-origin:top left;';
  iframe.width  = DESIGN_W;
  iframe.height = DESIGN_H;
  mount.appendChild(iframe);
  currentSketchEl = iframe;
  scalePreview();

  // Build the full HTML document to inject
  const preambleLines = preamble.split('\n').length;
  const rawHtml =
    '<!DOCTYPE html><html><head>\n' +
    '  <script src="https://q5js.org/q5.js"><' + '/script>\n' +
    '  <script src="https://cdn.jsdelivr.net/npm/tweakpane@3/dist/tweakpane.js"><' + '/script>\n' +
    '  <style>\n' +
    '    body { margin:0; background:#0a0a0f; overflow:hidden; }\n' +
    '    canvas { display:block; }\n' +
    '    .tp-dfwv { position:fixed !important; bottom:16px !important; right:16px !important; top:auto !important; z-index:999; }\n' +
    '  </style>\n' +
    '</head><body>\n' +
    '  <script>\n' +
    '    // Proxy console to parent\n' +
    '    const _log = console.log.bind(console);\n' +
    "    console.log   = (...a) => { window.parent.logToConsole(a.join(' '), 'log');   _log(...a); };\n" +
    "    console.error = (...a) => { window.parent.logToConsole(a.join(' '), 'error'); };\n" +
    "    console.warn  = (...a) => { window.parent.logToConsole(a.join(' '), 'warn');  };\n" +
    '    window.onerror = (msg, src, line) => {\n' +
    "      window.parent.logToConsole('Line ' + (line - PREAMBLE_LINES) + ': ' + msg, 'error');\n" +
    "      window.parent.setStatus('Error on line ' + (line - PREAMBLE_LINES), true);\n" +
    '      return true;\n' +
    '    };\n' +
    '    const PREAMBLE_LINES = ' + preambleLines + ';\n' +
    '  <' + '/script>\n' +
    '  <script>' + preamble + '<' + '/script>\n' +
    '  <script>\n' +
    '    try {\n' +
    '      ' + userCode + '\n' +
    '    } catch(e) {\n' +
    '      console.error(e.message);\n' +
    '    }\n' +
    '  <' + '/script>\n' +
    '</body></html>';

  // Save for Raw view
  _lastRawHtml = rawHtml;

  const doc = iframe.contentDocument;
  doc.open();
  doc.write(rawHtml);
  doc.close();

  document.getElementById('status-msg').textContent = '✓ Running';
  document.getElementById('status-msg').className = 'status-ok';
  logToConsole('Sketch started — ' + totalLines + ' lines', 'log');

  // FPS from iframe
  fpsInterval = setInterval(() => {
    try {
      const fr = iframe.contentWindow && iframe.contentWindow._q5_frameRate;
      if (fr) document.getElementById('fps-display').textContent = 'fps: ' + Math.round(fr);
    } catch(e) {}
  }, 500);
}

function setStatus(msg, isError) {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.className = isError ? 'status-err' : 'status-ok';
}
window.logToConsole = logToConsole;
window.setStatus = setStatus;

function clearConsole() {
  document.getElementById('console-panel').innerHTML = '';
}

function copyCode() {
  navigator.clipboard.writeText(cm.getValue());
  logToConsole('Code copied to clipboard.', 'log');
}

// ── Prompt Generator ───────────────────────────────────
function togglePromptPanel() {
  const modal = document.getElementById('prompt-modal');
  const isOpen = modal.classList.toggle('open');
  if (isOpen) document.getElementById('prompt-idea').focus();
}

function closePromptPanel() {
  document.getElementById('prompt-modal').classList.remove('open');
}

function togglePromptPreview() {
  const wrap = document.getElementById('prompt-preview-wrap');
  const outEl = document.getElementById('prompt-output');
  const labelEl = document.getElementById('prompt-output-label');
  const btn = document.getElementById('prompt-expand-btn');
  const open = wrap.classList.toggle('open');
  if (open) {
    outEl.style.display = 'block';
    labelEl.style.display = 'block';
  } else {
    outEl.style.display = 'none';
    labelEl.style.display = 'none';
  }
  btn.textContent = open ? 'Collapse' : 'Expand';
}

function generatePrompt() {
  const idea = document.getElementById('prompt-idea').value.trim();
  if (!idea) {
    document.getElementById('prompt-idea').focus();
    return;
  }
  const width = DESIGN_W;
  const height = DESIGN_H;
  const promptTemplate = document.getElementById('prompt-template').textContent.trim();
  const prompt = promptTemplate
    .replaceAll('{{WIDTH}}', String(width))
    .replaceAll('{{HEIGHT}}', String(height))
    .replaceAll('{{IDEA}}', idea);
  // Use textContent for code block to avoid injection issues
  document.getElementById('prompt-output').textContent = prompt;
  document.getElementById('prompt-meta').textContent = 'Generated (' + width + ' x ' + height + ')';
  logToConsole('Prompt generated.', 'log');
  return prompt;
}

function copyPrompt() {
  const out = document.getElementById('prompt-output');
  if (!out.textContent) {
    const generated = generatePrompt();
    if (!generated) return;
  }
  navigator.clipboard.writeText(out.textContent);
  logToConsole('Prompt copied to clipboard.', 'log');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePromptPanel();
});

document.addEventListener('keydown', e => {
  const ideaBox = document.getElementById('prompt-idea');
  if (document.activeElement === ideaBox && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    generatePrompt();
  }
});

// ── Toggle editor panel collapse ──────────────────────
function toggleEditor() {
  const panel = document.getElementById('editor-panel');
  const btn   = document.getElementById('collapse-btn');
  const isCollapsed = panel.classList.toggle('collapsed');
  btn.textContent = isCollapsed ? '▶' : '◀';
  btn.title = isCollapsed ? 'Expand editor' : 'Collapse editor';
  // Re-fit CodeMirror after CSS transition (250ms) completes
  setTimeout(() => {
    const wrap = document.getElementById('editor-wrap');
    if (!isCollapsed) cm.setSize('100%', wrap.offsetHeight + 'px');
    scalePreview();
  }, 260);
}

// ── Keyboard shortcuts ─────────────────────────────────
document.addEventListener('keydown', e => {
  const modalOpen = document.getElementById('prompt-modal') &&
                    document.getElementById('prompt-modal').classList.contains('open');
  if (!e.defaultPrevented && !modalOpen && (e.ctrlKey || e.metaKey) && e.key === 'Enter') runSketch();
});

// ── Load built-in Example ──────────────────────────────
async function loadExample() {
  try {
    const text = await fetch('sketch.js').then(r => r.text());
    cm.setValue(text);
    logToConsole('Example loaded — press Run or Ctrl+Enter', 'log');
  } catch(e) {
    logToConsole('Could not load sketch.js — ' + e, 'warn');
  }
}

// Auto-load example on first visit
loadExample();
