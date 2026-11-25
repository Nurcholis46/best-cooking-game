// Sizzle & Serve — Dapur Kilat: boot, game loop, screens, sound wiring.
// ?shot=cover|rush|results|title renders one staged frame for screenshots.
import { CANVAS_H, CANVAS_W } from './config.js';
import { createWorld, startDay, update } from './world.js';
import { render } from './render.js';
import { bindInput, createInput } from './input.js';
import { playSound, setMuted, setSizzle, startAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const world = createWorld();
try {
  world.best = Number(localStorage.getItem('sizzle-serve-best') || 0);
} catch { /* private mode: no best score */ }
const input = createInput();
input.onSound = (name) => { if (name) playSound(name); };

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot, world);
  render(ctx, world);
} else {
  let last = performance.now();
  bindInput(canvas, world, input, {
    onTrash: () => {
      if (world.screen === 'play' && world.chef.carrying) {
        world.chef.carrying = null;
        playSound('trash');
      }
    },
    onPause: () => {
      if (world.screen === 'play') world.screen = 'pause';
      else if (world.screen === 'pause') world.screen = 'play';
    },
    onMute: () => {
      world.muted = !world.muted;
      setMuted(world.muted);
    },
    onConfirm: () => {
      startAudio();
      if (world.screen === 'title' || world.screen === 'over') {
        startDay(world);
        playSound('ding');
      }
    },
  });
  // Keep the title screen alive (clock for blinking hints).
  setInterval(() => { if (world.screen === 'title') world.elapsed += 0.5; }, 500);

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (world.screen === 'play') {
      update(world, dt, input);
      setSizzle(world.sizzle && !world.muted);
      if (world.screen === 'over') playSound('ding');
    }
    render(ctx, world);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
