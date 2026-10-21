const romInput = document.getElementById('rom-file');
const saveInput = document.getElementById('save-file');
const topCanvas = document.getElementById('top-screen');
const bottomCanvas = document.createElement('canvas');
bottomCanvas.width = 400;
bottomCanvas.height = 300;
const statusText = document.getElementById('status');
const statusDot = document.getElementById('status-dot');
const progressPanel = document.getElementById('load-progress');
const progressBar = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label');
const progressValue = document.getElementById('progress-value');
const fullscreenButton = document.getElementById('fullscreen');

// Place the compiled Emscripten glue at ./core/citra.js and its WASM at ./core/citra.wasm.
// The glue (or a small project adapter alongside it) must expose window.CitraEmulator.create.
const CORE_SCRIPT_URL = './core/citra.js';
const CORE_WASM_URL = './core/citra.wasm';

const keyMap = new Map([
  ['KeyW', ['circle-up']], ['KeyA', ['circle-left']], ['KeyS', ['circle-down']], ['KeyD', ['circle-right']],
  ['ArrowUp', ['dpad-up']], ['ArrowLeft', ['dpad-left']], ['ArrowDown', ['dpad-down']], ['ArrowRight', ['dpad-right']],
  ['KeyJ', ['a']], ['KeyK', ['b']], ['KeyI', ['x']], ['KeyU', ['y']],
  ['KeyQ', ['l']], ['KeyE', ['r']], ['Enter', ['start']], ['Backspace', ['select']],
]);

let emulator = null;
let coreScriptPromise = null;
let audioContext = null;
let activeKeys = new Set();

function setStatus(message, ready = false) {
  statusText.textContent = message;
  statusDot.classList.toggle('ready', ready);
}

function updateProgress(label, loaded, total) {
  const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
  progressLabel.textContent = label;
  progressValue.textContent = `${percent}%`;
  progressBar.value = percent;
}

function loadCoreScript() {
  if (window.CitraEmulator) return Promise.resolve(window.CitraEmulator);
  if (coreScriptPromise) return coreScriptPromise;

  coreScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CORE_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.CitraEmulator) resolve(window.CitraEmulator);
      else reject(new Error('Core glue loaded but window.CitraEmulator was not provided. Add the required adapter.'));
    };
    script.onerror = () => reject(new Error(`Could not load ${CORE_SCRIPT_URL}. Install the emulator core and adapter first.`));
    document.head.append(script);
  });
  return coreScriptPromise;
}

function createAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error('Web Audio API is unavailable in this browser.');
  if (!audioContext) audioContext = new AudioContextClass();
  return audioContext.resume().then(() => audioContext);
}

async function readFileAsBytes(file) {
  if (!file.stream) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    updateProgress('Reading file', file.size, file.size);
    return bytes;
  }

  const reader = file.stream().getReader();
  const chunks = [];
  let loaded = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.byteLength;
      updateProgress('Reading file', loaded, file.size);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function prepareEmulator() {
  const [core, context] = await Promise.all([loadCoreScript(), createAudioContext()]);
  if (typeof core.create !== 'function') {
    throw new Error('The emulator adapter must implement CitraEmulator.create(options).');
  }

  if (!emulator) {
    emulator = await core.create({
      topCanvas,
      bottomCanvas,
      wasmUrl: CORE_WASM_URL,
      audioContext: context,
      onStatus: (message) => setStatus(message, true),
    });
    if (typeof emulator.loadRomStream !== 'function' && typeof emulator.loadRom !== 'function') {
      throw new Error('The adapter must implement loadRomStream(stream, metadata) or loadRom(bytes, metadata).');
    }
    if (typeof emulator.setButton !== 'function') {
      throw new Error('The adapter must implement setButton(button, pressed).');
    }
  }
  return emulator;
}

async function loadRom(file) {
  if (!file) return;
  if (!/\.(3ds|cci)$/i.test(file.name)) {
    setStatus('Choose a .3ds or .cci file.');
    romInput.value = '';
    return;
  }

  romInput.disabled = true;
  progressPanel.hidden = false;
  updateProgress('Preparing emulator', 0, 1);
  setStatus('Loading emulator core...');

  try {
    const coreInstance = await prepareEmulator();
    if (typeof coreInstance.loadRomStream === 'function' && file.stream) {
      const stream = file.stream();
      await coreInstance.loadRomStream(stream, { name: file.name, size: file.size });
      updateProgress('Loading game', file.size, file.size);
    } else {
      const bytes = await readFileAsBytes(file);
      await coreInstance.loadRom(bytes, { name: file.name, size: file.size });
    }

    if (typeof coreInstance.start === 'function') await coreInstance.start();
    document.querySelector('.top-frame').classList.add('is-running');
    setStatus(`Ready: ${file.name}`, true);
  } catch (error) {
    setStatus(error.message || 'Unable to start the emulator.');
    console.error(error);
  } finally {
    romInput.disabled = false;
    progressPanel.hidden = true;
    romInput.value = '';
  }
}

async function loadSave(file) {
  if (!file) return;
  if (!/\.srm$/i.test(file.name)) {
    setStatus('Choose an .srm save file.');
    saveInput.value = '';
    return;
  }
  if (!emulator) {
    setStatus('Load a game before importing its save.');
    saveInput.value = '';
    return;
  }
  if (typeof emulator.loadSave !== 'function') {
    setStatus('This emulator core does not support importing .srm saves.');
    saveInput.value = '';
    return;
  }

  saveInput.disabled = true;
  progressPanel.hidden = false;
  updateProgress('Reading save', 0, file.size);
  try {
    const bytes = await readFileAsBytes(file);
    await emulator.loadSave(bytes, { name: file.name, size: file.size });
    setStatus(`Save imported: ${file.name}`, true);
  } catch (error) {
    setStatus(error.message || 'Unable to import the save file.');
    console.error(error);
  } finally {
    saveInput.disabled = false;
    progressPanel.hidden = true;
    saveInput.value = '';
  }
}

function setButtonState(code, pressed) {
  const buttons = keyMap.get(code);
  if (!buttons || !emulator) return;
  for (const button of buttons) emulator.setButton(button, pressed);
}

document.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLElement && event.target.matches('input, textarea, select, [contenteditable="true"]')) return;
  if (!keyMap.has(event.code)) return;
  event.preventDefault();
  if (activeKeys.has(event.code)) return;
  activeKeys.add(event.code);
  setButtonState(event.code, true);
});

document.addEventListener('keyup', (event) => {
  if (!activeKeys.delete(event.code)) return;
  setButtonState(event.code, false);
});

window.addEventListener('blur', () => {
  for (const code of activeKeys) setButtonState(code, false);
  activeKeys.clear();
});

romInput.addEventListener('change', () => loadRom(romInput.files?.[0]));
saveInput.addEventListener('change', () => loadSave(saveInput.files?.[0]));
fullscreenButton.addEventListener('click', async () => {
  const target = document.querySelector('.console');
  try {
    if (!document.fullscreenElement) await target.requestFullscreen();
    else await document.exitFullscreen();
  } catch (error) {
    setStatus(`Fullscreen unavailable: ${error.message}`);
  }
});
document.addEventListener('fullscreenchange', () => {
  const isFullscreen = document.fullscreenElement === document.querySelector('.console');
  fullscreenButton.title = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
  fullscreenButton.setAttribute('aria-label', fullscreenButton.title);
});

if (!crossOriginIsolated) {
  setStatus('Hosting headers required for SharedArrayBuffer (COOP + COEP).');
} else {
  setStatus('Core not installed. Add the compiled engine to emulator/core/.');
}