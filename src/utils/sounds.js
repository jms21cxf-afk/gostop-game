let ctx = null;
let muted = false;

const MUTE_KEY = 'gostop-muted';

try {
  muted = localStorage.getItem(MUTE_KEY) === 'true';
} catch {
  muted = false;
}

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, String(value));
  } catch {
    /* ignore */
  }
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

function tone(freq, duration, type = 'sine', volume = 0.15, decay = 0.08) {
  if (muted) return;
  try {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration + decay);
  } catch {
    /* ignore audio errors */
  }
}

function noise(duration, volume = 0.08) {
  if (muted) return;
  try {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const bufferSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
  } catch {
    /* ignore */
  }
}

export const sounds = {
  playCard() {
    noise(0.06, 0.12);
    tone(180, 0.05, 'triangle', 0.1);
  },
  flipCard() {
    tone(320, 0.06, 'square', 0.08);
    tone(480, 0.04, 'sine', 0.06);
  },
  match() {
    tone(523, 0.1, 'sine', 0.14);
    tone(659, 0.12, 'sine', 0.12);
  },
  ppung() {
    tone(440, 0.08, 'square', 0.15);
    tone(554, 0.08, 'square', 0.13);
    tone(659, 0.15, 'square', 0.12);
    noise(0.1, 0.1);
  },
  place() {
    tone(220, 0.07, 'triangle', 0.1);
  },
  go() {
    tone(440, 0.1, 'square', 0.18);
    tone(554, 0.12, 'square', 0.16);
    tone(659, 0.14, 'square', 0.14);
    tone(880, 0.2, 'square', 0.12);
  },
  stop() {
    tone(659, 0.14, 'sine', 0.16);
    tone(523, 0.16, 'sine', 0.14);
    tone(392, 0.22, 'sine', 0.12);
  },
  turn() {
    tone(330, 0.05, 'sine', 0.06);
  },
  win() {
    tone(523, 0.12, 'square', 0.16);
    tone(659, 0.12, 'square', 0.14);
    tone(784, 0.14, 'square', 0.12);
    tone(1047, 0.22, 'square', 0.1);
  },
};

export function playSound(type) {
  if (muted) return;
  const fn = sounds[type];
  if (fn) fn();
}

export function unlockAudio() {
  if (muted) return;
  try {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
  } catch {
    /* ignore */
  }
}
