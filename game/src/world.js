// Sizzle & Serve: the game world — state, orders, cooking, serving, scoring.
// Pure logic: no DOM, no canvas here, so the rules can be tested on their own.
import {
  CANVAS_W, CHEF_R, CHEF_SPEED, CHOP_TIME, COOK_TIMES, DAY_LENGTH,
  FLOOR_BOTTOM, FLOOR_TOP, GRILL_SLOTS, INGREDIENTS, MAX_ORDERS, PLATE_SLOTS,
  POT_SLOTS, RECIPES, RECIPE_LIST, STATIONS, makeItem,
} from './config.js';

let orderSeq = 1;

/** A fresh, empty world (title screen). */
export function createWorld() {
  return {
    screen: 'title', // title | play | pause | over
    timeLeft: DAY_LENGTH,
    elapsed: 0,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    lastServeAt: -999,
    best: 0,
    chef: { x: 640, y: 520, tx: 640, ty: 520, moving: false, face: 1, walk: 0, carrying: null },
    orders: [],
    spawnTimer: 4,
    board: { item: null, progress: 0 },
    grill: Array.from({ length: GRILL_SLOTS }, () => ({ item: null, t: 0 })),
    pot: Array.from({ length: POT_SLOTS }, () => ({ item: null, t: 0 })),
    plates: Array.from({ length: PLATE_SLOTS }, () => ({ items: [], dish: null })),
    floats: [], // {x,y,text,color,life}
    toasts: [], // {text,life}
    shake: 0,
    rush: false,
    rushAnnounced: false,
    muted: false,
    sizzle: false, // any grill/pot slot busy (audio cue)
    overStats: null,
  };
}

/** Start a fresh day. */
export function startDay(world) {
  const fresh = createWorld();
  fresh.screen = 'play';
  fresh.best = world.best;
  fresh.muted = world.muted;
  Object.assign(world, fresh);
  spawnOrder(world, true);
  spawnOrder(world, true);
}

/** Pick a recipe, weighted so early orders are the easy ones. */
function pickRecipe(world) {
  const t = world.elapsed / DAY_LENGTH;
  const pool = t < 0.25
    ? [RECIPES.salad, RECIPES.salad, RECIPES.burger, RECIPES.pasta]
    : t < 0.6
      ? [RECIPES.burger, RECIPES.salad, RECIPES.pasta, RECIPES.soup]
      : [RECIPES.burger, RECIPES.pasta, RECIPES.soup, RECIPES.salad, RECIPES.burger];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function spawnOrder(world, instant = false) {
  if (world.orders.length >= MAX_ORDERS) return null;
  const recipe = pickRecipe(world);
  const difficulty = 1 - (world.elapsed / DAY_LENGTH) * 0.25;
  const order = {
    id: orderSeq++,
    recipe,
    patience: recipe.patience * difficulty,
    maxPatience: recipe.patience * difficulty,
    born: world.elapsed,
    instant,
  };
  world.orders.push(order);
  return order;
}

/** Seconds between order spawns; shrinks through the day, faster in the rush. */
export function spawnInterval(world) {
  const t = world.elapsed / DAY_LENGTH;
  let interval = 16 - 7 * t;
  if (world.rush) interval = Math.min(interval, 8);
  return interval;
}

// --- Plates ------------------------------------------------------------------

/** Does a plate's items exactly match a recipe? Returns the recipe or null. */
export function matchRecipe(items) {
  for (const recipe of RECIPE_LIST) {
    if (items.length !== recipe.needs.length) continue;
    const remaining = recipe.needs.map((n) => `${n.id}:${n.prep}`);
    let ok = true;
    for (const item of items) {
      const key = `${item.id}:${item.prep}`;
      const i = remaining.indexOf(key);
      if (i === -1) { ok = false; break; }
      remaining.splice(i, 1);
    }
    if (ok && remaining.length === 0) return recipe;
  }
  return null;
}

export function refreshPlate(plate) {
  plate.dish = matchRecipe(plate.items);
}

// --- Cooking state -----------------------------------------------------------

/** Prep state of a grill/pot item from its cooking time. */
export function cookedPrep(kind, id, t) {
  const times = COOK_TIMES[id];
  if (!times) return 'raw';
  if (t < times.done) return 'raw';
  if (t <= times.goodUntil) return kind === 'grill' ? 'cooked' : (id === 'pasta' ? 'boiled' : 'heated');
  return 'burnt';
}

// --- Interaction -------------------------------------------------------------

/** Centre point a chef walks to when using a station. */
export function stationPoint(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h + 44 };
}

export function cratePoint(crate) {
  return { x: crate.x + crate.w / 2, y: crate.y + crate.h + 40 };
}

/** Nearest interactable to a point, within reach. Returns {type, ref, index, x, y}. */
export function nearestInteractable(world, x, y) {
  const reach = 150;
  let best = null;
  let bestD = Infinity;
  const consider = (type, ref, index, px, py) => {
    const d = Math.hypot(x - px, y - py);
    if (d < bestD && d < reach) { bestD = d; best = { type, ref, index, x: px, y: py }; }
  };
  for (const crate of world.crates) consider('crate', crate, -1, cratePoint(crate).x, cratePoint(crate).y);
  consider('board', STATIONS.board, -1, stationPoint(STATIONS.board).x, stationPoint(STATIONS.board).y);
  for (let i = 0; i < GRILL_SLOTS; i++) {
    consider('grill', STATIONS.grill, i, STATIONS.grill.x + 55 + i * 110, stationPoint(STATIONS.grill).y);
  }
  for (let i = 0; i < POT_SLOTS; i++) {
    consider('pot', STATIONS.pot, i, STATIONS.pot.x + 55 + i * 110, stationPoint(STATIONS.pot).y);
  }
  for (let i = 0; i < PLATE_SLOTS; i++) {
    consider('plate', STATIONS.plates, i, STATIONS.plates.x + 50 + i * 100, stationPoint(STATIONS.plates).y);
  }
  consider('serve', STATIONS.serve, -1, stationPoint(STATIONS.serve).x, stationPoint(STATIONS.serve).y);
  consider('trash', STATIONS.trash, -1, STATIONS.trash.x + STATIONS.trash.w / 2, STATIONS.trash.y + STATIONS.trash.h + 30);
  return best;
}

function toast(world, text) {
  world.toasts.push({ text, life: 2.2 });
  if (world.toasts.length > 3) world.toasts.shift();
}

function floatText(world, x, y, text, color) {
  world.floats.push({ x, y, text, color, life: 1.4 });
}

/** What the chef is holding: null, an item, or {plate:true, items, dish}. */
export function heldIsPlate(carrying) {
  return carrying !== null && carrying.plate === true;
}

/** Run one interaction at a station. Returns a sound key for audio.js. */
export function interact(world, target) {
  const chef = world.chef;
  if (!target) return null;
  const carrying = chef.carrying;

  if (target.type === 'crate') {
    if (carrying) { toast(world, 'Tangan penuh!'); return 'error'; }
    chef.carrying = makeItem(target.ref.ingredient);
    return 'pickup';
  }

  if (target.type === 'board') {
    const board = world.board;
    if (!board.item && carrying && !heldIsPlate(carrying) && INGREDIENTS[carrying.id].choppable && carrying.prep === 'raw') {
      board.item = carrying;
      board.progress = 0;
      chef.carrying = null;
      return 'place';
    }
    if (board.item && !carrying) {
      chef.carrying = board.item;
      board.item = null;
      board.progress = 0;
      return 'pickup';
    }
    if (board.item && carrying) { toast(world, 'Talenan sedang dipakai'); return 'error'; }
    toast(world, 'Bahan ini tidak perlu dicincang');
    return 'error';
  }

  if (target.type === 'grill') {
    const slot = world.grill[target.index];
    if (!slot.item && carrying && !heldIsPlate(carrying) && carrying.id === 'patty' && carrying.prep === 'raw') {
      slot.item = carrying;
      slot.t = 0;
      chef.carrying = null;
      return 'place';
    }
    if (slot.item && !carrying) {
      slot.item.prep = cookedPrep('grill', slot.item.id, slot.t);
      chef.carrying = slot.item;
      slot.item = null;
      slot.t = 0;
      return 'pickup';
    }
    toast(world, 'Panggangan hanya untuk patty mentah');
    return 'error';
  }

  if (target.type === 'pot') {
    const slot = world.pot[target.index];
    if (!slot.item && carrying && !heldIsPlate(carrying) && INGREDIENTS[carrying.id].boilable && carrying.prep === 'raw') {
      slot.item = carrying;
      slot.t = 0;
      chef.carrying = null;
      return 'place';
    }
    if (slot.item && !carrying) {
      slot.item.prep = cookedPrep('pot', slot.item.id, slot.t);
      chef.carrying = slot.item;
      slot.item = null;
      slot.t = 0;
      return 'pickup';
    }
    toast(world, 'Kompor hanya untuk pasta & kaldu');
    return 'error';
  }

  if (target.type === 'plate') {
    const plate = world.plates[target.index];
    if (heldIsPlate(carrying)) {
      if (plate.items.length === 0) {
        plate.items = carrying.items;
        refreshPlate(plate);
        chef.carrying = null;
        return 'place';
      }
      toast(world, 'Piring ini sudah terisi');
      return 'error';
    }
    if (carrying && !heldIsPlate(carrying)) {
      if (plate.items.length >= 4) { toast(world, 'Piring penuh'); return 'error'; }
      if (carrying.prep === 'burnt') { toast(world, 'Gosong! Buang ke sampah'); return 'error'; }
      plate.items.push(carrying);
      refreshPlate(plate);
      chef.carrying = null;
      return 'place';
    }
    if (!carrying && plate.items.length > 0) {
      chef.carrying = { plate: true, items: plate.items, dish: plate.dish };
      plate.items = [];
      plate.dish = null;
      return 'pickup';
    }
    toast(world, 'Piring kosong');
    return 'error';
  }

  if (target.type === 'serve') {
    if (!heldIsPlate(carrying)) { toast(world, 'Bawa piring hidangan ke sini'); return 'error'; }
    if (!carrying.dish) { toast(world, 'Hidangan belum lengkap'); return 'error'; }
    const orderIndex = world.orders.findIndex((o) => o.recipe.id === carrying.dish.id);
    if (orderIndex === -1) { toast(world, `Tidak ada pesanan ${carrying.dish.name}`); return 'error'; }
    const order = world.orders[orderIndex];
    world.orders.splice(orderIndex, 1);
    const patienceFrac = Math.max(0, order.patience / order.maxPatience);
    const tip = Math.round(order.recipe.price * 0.5 * patienceFrac);
    if (world.elapsed - world.lastServeAt < 12) world.combo += 1; else world.combo = 1;
    world.lastServeAt = world.elapsed;
    world.comboTimer = 12;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    const mult = Math.min(2, 1 + 0.25 * (world.combo - 1));
    const earned = Math.round((order.recipe.price + tip) * mult);
    world.coins += earned;
    world.served += 1;
    chef.carrying = null;
    floatText(world, STATIONS.serve.x + STATIONS.serve.w / 2, STATIONS.serve.y - 14,
      `+$${earned}${world.combo > 1 ? `  COMBO x${mult.toFixed(2).replace(/\.?0+$/, '')}` : ''}`, '#ffd94d');
    return 'serve';
  }

  if (target.type === 'trash') {
    if (!carrying) { toast(world, 'Tidak ada yang dibuang'); return 'error'; }
    chef.carrying = null;
    return 'trash';
  }
  return null;
}

// --- Update ------------------------------------------------------------------

function nearStation(world, station, pad = 130) {
  const p = stationPoint(station);
  return Math.hypot(world.chef.x - p.x, world.chef.y - p.y) < pad;
}

export function update(world, dt, input) {
  if (world.screen !== 'play') return;

  world.elapsed += dt;
  world.timeLeft = Math.max(0, DAY_LENGTH - world.elapsed);
  if (world.timeLeft <= 0) {
    endDay(world);
    return;
  }
  if (!world.rush && world.timeLeft <= 60) {
    world.rush = true;
    if (!world.rushAnnounced) {
      world.rushAnnounced = true;
      toast(world, 'RUSH HOUR! Pesanan makin cepat!');
    }
  }

  // Orders: spawn and age.
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    spawnOrder(world);
    world.spawnTimer = spawnInterval(world);
  }
  for (let i = world.orders.length - 1; i >= 0; i--) {
    const order = world.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders.splice(i, 1);
      world.missed += 1;
      world.combo = 0;
      world.shake = 10;
      toast(world, `Pesanan ${order.recipe.name} hangus!`);
      floatText(world, 640, 130, 'PESANAN HANGUS', '#ff5a4d');
    }
  }

  // Chopping: automatic while the chef stands at the board.
  if (world.board.item && world.board.progress < 1 && nearStation(world, STATIONS.board)) {
    world.board.progress += dt / CHOP_TIME;
    if (world.board.progress >= 1) {
      world.board.progress = 1;
      world.board.item.prep = 'chopped';
    }
  }

  // Cooking timers.
  world.sizzle = false;
  for (const slot of world.grill) {
    if (slot.item) { slot.t += dt; world.sizzle = true; }
  }
  for (const slot of world.pot) {
    if (slot.item) { slot.t += dt; world.sizzle = true; }
  }

  // Combo timer.
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }

  // Chef movement: keyboard, or click-to-move target.
  const chef = world.chef;
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx !== 0 || my !== 0) {
    chef.moving = false; // keyboard overrides the click target
    const len = Math.hypot(mx, my);
    chef.x += (mx / len) * CHEF_SPEED * dt;
    chef.y += (my / len) * CHEF_SPEED * dt;
    chef.face = mx !== 0 ? Math.sign(mx) : chef.face;
    chef.walk += dt * 10;
  } else if (chef.moving) {
    const dx = chef.tx - chef.x;
    const dy = chef.ty - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      chef.moving = false;
      if (chef.onArrive) {
        const target = chef.onArrive;
        chef.onArrive = null;
        const sound = interact(world, target);
        if (input.onSound) input.onSound(sound);
      }
    } else {
      chef.x += (dx / dist) * CHEF_SPEED * dt;
      chef.y += (dy / dist) * CHEF_SPEED * dt;
      chef.face = dx !== 0 ? Math.sign(dx) : chef.face;
      chef.walk += dt * 10;
    }
  }
  chef.x = Math.max(24, Math.min(CANVAS_W - 24, chef.x));
  chef.y = Math.max(FLOOR_TOP + 10, Math.min(FLOOR_BOTTOM, chef.y));

  // Keyboard interact (E / Space).
  if (input.interactPressed) {
    input.interactPressed = false;
    const target = nearestInteractable(world, chef.x, chef.y - 20);
    if (target) {
      const sound = interact(world, target);
      if (input.onSound) input.onSound(sound);
    }
  }

  // Floats, toasts, shake decay.
  for (const f of world.floats) { f.y -= 34 * dt; f.life -= dt; }
  world.floats = world.floats.filter((f) => f.life > 0);
  for (const t of world.toasts) t.life -= dt;
  world.toasts = world.toasts.filter((t) => t.life > 0);
  if (world.shake > 0) world.shake = Math.max(0, world.shake - 30 * dt);
}

function endDay(world) {
  world.screen = 'over';
  const stars = world.served >= 14 ? 3 : world.served >= 9 ? 2 : world.served >= 5 ? 1 : 0;
  world.overStats = {
    coins: world.coins,
    served: world.served,
    missed: world.missed,
    bestCombo: world.bestCombo,
    stars,
  };
  try {
    const prev = Number(localStorage.getItem('sizzle-serve-best') || 0);
    world.best = Math.max(prev, world.coins);
    localStorage.setItem('sizzle-serve-best', String(world.best));
  } catch {
    world.best = Math.max(world.best, world.coins);
  }
}

// Crates live on the world for the interactable lookup (set at boot).
export function attachCrates(world, crates) {
  world.crates = crates;
}
