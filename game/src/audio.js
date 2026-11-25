// Sizzle & Serve: all sound is synthesised with WebAudio — no audio files.
// A tiny chiptune loop (bass + pluck melody) plus kitchen sound effects.
let ctx = null;
let master = null;
let musicTimer = null;
let sizzleNode = null;
let sizzleGain = null;
let step = 0;

const MELODY = [523, 659, 784, 659, 587, 698, 880, 784, 659, 587, 523, 0, 587, 659, 0, 0];
const BASS = [131, 131, 175, 196, 131, 131, 175, 220, 165, 165, 196, 220, 196, 175, 131, 0];

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.2, when = 0) {
  if (!ensureCtx()) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol = 0.2, filterFreq = 1200) {
  if (!ensureCtx()) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start();
}

/** Play one named effect. Safe to call before any user gesture (no-ops). */
export function playSound(name) {
  if (!ctx || ctx.state !== 'running') return;
  switch (name) {
    case 'pickup': tone(520, 0.09, 'triangle', 0.22); break;
    case 'place': tone(330, 0.1, 'triangle', 0.22); tone(495, 0.08, 'triangle', 0.15, 0.05); break;
    case 'chop': noiseBurst(0.06, 0.3, 900); break;
    case 'serve': tone(880, 0.12, 'sine', 0.25); tone(1318, 0.2, 'sine', 0.22, 0.09); break;
    case 'coin': tone(988, 0.08, 'square', 0.1); tone(1319, 0.16, 'square', 0.1, 0.07); break;
    case 'error': tone(160, 0.18, 'sawtooth', 0.16); break;
    case 'trash': noiseBurst(0.14, 0.22, 500); break;
    case 'ding': tone(1046, 0.3, 'sine', 0.22); break;
    case 'miss': tone(220, 0.3, 'sawtooth', 0.14); tone(147, 0.4, 'sawtooth', 0.14, 0.15); break;
    default: break;
  }
}

/** Start the music loop and unlock audio (call from a user gesture). */
export function startAudio() {
  if (!ensureCtx()) return;
  if (ctx.state === 'suspended') ctx.resume();
  if (musicTimer) return;
  musicTimer = setInterval(() => {
    if (!ctx || ctx.state !== 'running') return;
    const m = MELODY[step % MELODY.length];
    const b = BASS[step % BASS.length];
    if (m) tone(m, 0.22, 'triangle', 0.1);
    if (b) tone(b, 0.3, 'sine', 0.14);
    step += 1;
  }, 240);
}

/** Sizzle loop while something cooks; call every frame with the world flag. */
export function setSizzle(on) {
  if (!ensureCtx() || ctx.state !== 'running') return;
  if (on && !sizzleNode) {
    const len = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    sizzleGain = ctx.createGain();
    sizzleGain.gain.value = 0.0;
    src.connect(filter);
    filter.connect(sizzleGain);
    sizzleGain.connect(master);
    src.start();
    sizzleNode = src;
  }
  if (sizzleGain) {
    sizzleGain.gain.linearRampToValueAtTime(on ? 0.05 : 0.0, ctx.currentTime + 0.2);
  }
}

export function setMuted(muted) {
  if (master) master.gain.value = muted ? 0 : 0.35;
}
