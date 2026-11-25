// Sizzle & Serve: keyboard + mouse input, translated into game actions.
import { CRATES, STATIONS } from './config.js';
import { attachCrates, cratePoint, nearestInteractable, stationPoint } from './world.js';

export function createInput() {
  return {
    left: false, right: false, up: false, down: false,
    interactPressed: false,
    onSound: null,
  };
}

const KEYMAP = {
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
};

/** Wire keyboard + mouse on the canvas. `hooks` supplies game callbacks. */
export function bindInput(canvas, world, input, hooks) {
  attachCrates(world, CRATES);

  window.addEventListener('keydown', (e) => {
    if (KEYMAP[e.code] !== undefined) {
      input[KEYMAP[e.code]] = true;
      e.preventDefault();
    }
    if (e.code === 'KeyE' || e.code === 'Space') {
      input.interactPressed = true;
      e.preventDefault();
    }
    if (e.code === 'KeyQ') hooks.onTrash();
    if (e.code === 'KeyP' || e.code === 'Escape') hooks.onPause();
    if (e.code === 'KeyM') hooks.onMute();
    if (e.code === 'Enter') hooks.onConfirm();
  });
  window.addEventListener('keyup', (e) => {
    if (KEYMAP[e.code] !== undefined) input[KEYMAP[e.code]] = false;
  });

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    hooks.onConfirm(); // a click starts the game from title / restarts after a day
    if (world.screen !== 'play') return;
    const target = nearestInteractable(world, x, y);
    if (target) {
      world.chef.tx = target.x;
      world.chef.ty = target.y;
      world.chef.moving = true;
      world.chef.onArrive = target;
    } else {
      world.chef.tx = Math.max(24, Math.min(canvas.width - 24, x));
      world.chef.ty = Math.max(256, Math.min(648, y));
      world.chef.moving = true;
      world.chef.onArrive = null;
    }
  });
}

/** Re-exported so main.js can point the chef at a station without a click. */
export { cratePoint, stationPoint, STATIONS };
