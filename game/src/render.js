// Sizzle & Serve: everything the player sees, drawn on one canvas.
// No images, no fonts from the network: shapes and system fonts only.
import {
  CANVAS_H, CANVAS_W, COOK_TIMES, CRATES, DAY_LENGTH, FLOOR_BOTTOM,
  FLOOR_TOP, GRILL_SLOTS, INGREDIENTS, PLATE_SLOTS, POT_SLOTS,
  RECIPE_LIST, STATIONS, TOPBAR_H, prepLabel,
} from './config.js';
import { cookedPrep as grillPrep } from './world.js';

const FONT = "'Trebuchet MS', Verdana, sans-serif";

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, frac, good, warn, bad) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const color = frac > 0.5 ? good : frac > 0.25 ? warn : bad;
  ctx.fillStyle = color;
  if (frac > 0) {
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }
}

// --- Food icons (all drawn, all original) ------------------------------------

export function drawItem(ctx, item, cx, cy, s) {
  const id = item.id;
  const prep = item.prep;
  ctx.save();
  ctx.translate(cx, cy);
  const u = s / 2; // unit
  if (id === 'bun') {
    ctx.fillStyle = '#c98a2e';
    rr(ctx, -u, -u * 0.25, 2 * u, u * 0.9, u * 0.4); ctx.fill();
    ctx.fillStyle = '#f0b45c';
    ctx.beginPath(); ctx.ellipse(0, -u * 0.25, u, u * 0.62, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-0.45, -0.55], [0, -0.75], [0.45, -0.55], [-0.2, -0.35], [0.25, -0.35]]) {
      ctx.beginPath(); ctx.ellipse(dx * u, dy * u, u * 0.12, u * 0.07, 0.4, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = prep === 'cooked' ? '#6b3f1d' : '#8a5a33';
    ctx.beginPath(); ctx.ellipse(0, 0, u, u * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, u * 0.8, u * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
    if (prep === 'cooked') {
      ctx.strokeStyle = '#3d220e';
      ctx.lineWidth = 3;
      for (const dx of [-0.45, 0, 0.45]) {
        ctx.beginPath(); ctx.moveTo(dx * u, -u * 0.4); ctx.lineTo(dx * u, u * 0.4); ctx.stroke();
      }
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#4c9432';
    for (const [dx, dy, r] of [[-0.5, 0.1, 0.55], [0.5, 0.1, 0.55], [0, -0.35, 0.6], [0, 0.3, 0.55]]) {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, r * u, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#7cc45a';
    ctx.beginPath(); ctx.arc(-0.15 * u, -0.1 * u, u * 0.45, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#d9392b';
    ctx.beginPath(); ctx.arc(0, u * 0.1, u * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2604f';
    ctx.beginPath(); ctx.arc(-u * 0.3, -u * 0.2, u * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f7d2c';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      ctx.lineTo(Math.cos(a) * u * 0.5, -u * 0.55 + Math.sin(a) * u * 0.3);
      const a2 = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a2) * u * 0.18, -u * 0.55 + Math.sin(a2) * u * 0.12);
    }
    ctx.closePath(); ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f2c230';
    ctx.beginPath(); ctx.moveTo(-u, u * 0.6); ctx.lineTo(u, u * 0.6); ctx.lineTo(u, -u * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9a41a';
    for (const [dx, dy] of [[0.2, 0.25], [0.55, -0.1], [-0.35, 0.3]]) {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, u * 0.14, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'carrot') {
    ctx.fillStyle = '#e07b28';
    ctx.beginPath(); ctx.moveTo(-u * 0.7, -u * 0.5); ctx.lineTo(u * 0.7, -u * 0.5); ctx.lineTo(0, u * 0.95); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#b85c14';
    ctx.lineWidth = 2;
    for (const dy of [-0.2, 0.15, 0.5]) {
      ctx.beginPath(); ctx.moveTo(-u * 0.45, dy * u); ctx.lineTo(u * 0.45, dy * u); ctx.stroke();
    }
    ctx.strokeStyle = '#4c9432';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -u * 0.5); ctx.lineTo(-u * 0.35, -u); ctx.moveTo(0, -u * 0.5); ctx.lineTo(0, -u * 1.05); ctx.moveTo(0, -u * 0.5); ctx.lineTo(u * 0.35, -u); ctx.stroke();
  } else if (id === 'pasta') {
    ctx.strokeStyle = '#f0d060';
    ctx.lineWidth = u * 0.22;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const y = (-0.5 + i * 0.5) * u;
      ctx.beginPath();
      ctx.moveTo(-u * 0.8, y);
      ctx.bezierCurveTo(-u * 0.4, y - u * 0.35, u * 0.4, y + u * 0.35, u * 0.8, y);
      ctx.stroke();
    }
  } else if (id === 'broth') {
    ctx.fillStyle = '#7a4a22';
    ctx.beginPath(); ctx.ellipse(0, u * 0.25, u, u * 0.6, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#e8a54b';
    ctx.beginPath(); ctx.ellipse(0, u * 0.25, u * 0.85, u * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-u * 0.3, -u * 0.2); ctx.quadraticCurveTo(-u * 0.1, -u * 0.6, -u * 0.3, -u * 0.9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(u * 0.3, -u * 0.2); ctx.quadraticCurveTo(u * 0.5, -u * 0.6, u * 0.3, -u * 0.9); ctx.stroke();
  }
  // Chopped: diced cubes beside the icon. Burnt: dark overlay + smoke.
  if (prep === 'chopped') {
    ctx.fillStyle = INGREDIENTS[id].color;
    for (const [dx, dy] of [[0.75, 0.55], [0.95, 0.3], [0.6, 0.8]]) {
      ctx.fillRect(dx * u, dy * u, u * 0.28, u * 0.28);
    }
  }
  if (prep === 'burnt') {
    ctx.fillStyle = 'rgba(30,20,10,0.75)';
    ctx.beginPath(); ctx.arc(0, 0, u * 0.95, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-u * 0.4, -u * 0.7); ctx.quadraticCurveTo(-u * 0.2, -u * 1.1, -u * 0.45, -u * 1.35); ctx.stroke();
  }
  ctx.restore();
}

// --- Kitchen -----------------------------------------------------------------

function drawFloor(ctx) {
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#e8d3ac' : '#dcc194';
      ctx.fillRect(x * 80, FLOOR_TOP + y * 67, 80, 67);
    }
  }
  ctx.fillStyle = '#b98d54';
  ctx.fillRect(0, FLOOR_TOP, CANVAS_W, 6);
}

function drawWall(ctx) {
  ctx.fillStyle = '#f3e6c8';
  ctx.fillRect(0, TOPBAR_H, CANVAS_W, 54);
  ctx.fillStyle = '#e0cda4';
  for (let x = 0; x < CANVAS_W; x += 64) ctx.fillRect(x, TOPBAR_H, 2, 54);
  // Menu poster (right of the crates).
  ctx.fillStyle = '#fff8e6';
  rr(ctx, 872, 104, 372, 128, 10); ctx.fill();
  ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, 'MENU HARI INI', 1058, 122, 15, '#8a5a33', 'center');
  RECIPE_LIST.forEach((r, i) => {
    const y = 144 + i * 20;
    text(ctx, r.name, 888, y, 13, '#5a3a1a');
    text(ctx, `$${r.price}`, 1228, y, 13, '#8a5a33', 'right');
  });
}

function drawCrates(ctx) {
  // Back counter.
  ctx.fillStyle = '#a9743f';
  rr(ctx, 24, 232, 1224, 14, 6); ctx.fill();
  for (const crate of CRATES) {
    const ing = INGREDIENTS[crate.ingredient];
    ctx.fillStyle = '#c98f4e';
    rr(ctx, crate.x, crate.y, crate.w, crate.h, 8); ctx.fill();
    ctx.fillStyle = '#a9743f';
    ctx.fillRect(crate.x, crate.y, crate.w, 10);
    drawItem(ctx, { id: crate.ingredient, prep: 'raw' }, crate.x + crate.w / 2, crate.y + 36, 44);
    text(ctx, ing.name, crate.x + crate.w / 2, crate.y + 68, 12, '#fff', 'center');
  }
}

function drawCounter(ctx, s, topColor) {
  ctx.fillStyle = '#8a5a33';
  rr(ctx, s.x - 4, s.y - 4, s.w + 8, s.h + 8, 10); ctx.fill();
  ctx.fillStyle = topColor;
  rr(ctx, s.x, s.y, s.w, s.h, 8); ctx.fill();
  text(ctx, s.label, s.x + s.w / 2, s.y + s.h - 12, 12, 'rgba(255,255,255,0.85)', 'center');
}

function slotState(kind, item, t) {
  if (!item) return null;
  const times = COOK_TIMES[item.id];
  if (!times) return { frac: 0, color: '#888', label: '' };
  if (t < times.done) return { frac: t / times.done, color: '#e07b28', label: 'memasak…' };
  if (t <= times.goodUntil) return { frac: 1, color: '#5da83c', label: 'SIAP!' };
  return { frac: 1, color: '#d9392b', label: 'GOSONG!' };
}

function drawStations(ctx, world) {
  // Chopping board.
  drawCounter(ctx, STATIONS.board, '#e8c98f');
  ctx.fillStyle = '#fff8e6';
  rr(ctx, STATIONS.board.x + 30, STATIONS.board.y + 14, 140, 56, 8); ctx.fill();
  if (world.board.item) {
    drawItem(ctx, world.board.item, STATIONS.board.x + 100, STATIONS.board.y + 42, 40);
    if (world.board.progress < 1) {
      bar(ctx, STATIONS.board.x + 45, STATIONS.board.y + 74, 110, 8, world.board.progress, '#5da83c', '#e8a54b', '#d9392b');
    } else {
      text(ctx, 'DICINCANG ✓', STATIONS.board.x + 100, STATIONS.board.y + 78, 11, '#4c9432', 'center');
    }
  } else {
    text(ctx, 'taruh sayur di sini', STATIONS.board.x + 100, STATIONS.board.y + 42, 12, '#8a6a3f', 'center');
  }

  // Grill (two slots).
  drawCounter(ctx, STATIONS.grill, '#5a5a60');
  for (let i = 0; i < GRILL_SLOTS; i++) {
    const slot = world.grill[i];
    const cx = STATIONS.grill.x + 55 + i * 110;
    const cy = STATIONS.grill.y + 38;
    ctx.fillStyle = '#333338';
    rr(ctx, cx - 46, cy - 26, 92, 52, 8); ctx.fill();
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 2;
    for (let g = -1; g <= 1; g++) {
      ctx.beginPath(); ctx.moveTo(cx - 40, cy + g * 14); ctx.lineTo(cx + 40, cy + g * 14); ctx.stroke();
    }
    if (slot.item) {
      const st = slotState('grill', slot.item, slot.t);
      const prep = grillPrep('grill', slot.item.id, slot.t);
      drawItem(ctx, { id: slot.item.id, prep }, cx, cy, 40);
      bar(ctx, cx - 40, cy + 32, 80, 7, st.frac, st.color, st.color, st.color);
      text(ctx, st.label, cx, cy - 30, 10, st.color, 'center');
      if (slot.t < COOK_TIMES[slot.item.id].done) {
        ctx.fillStyle = 'rgba(255,120,30,0.85)';
        ctx.beginPath(); ctx.moveTo(cx - 8, cy + 26); ctx.lineTo(cx, cy + 12); ctx.lineTo(cx + 8, cy + 26); ctx.closePath(); ctx.fill();
      }
    }
  }

  // Pot / stove (two slots).
  drawCounter(ctx, STATIONS.pot, '#5a5a60');
  for (let i = 0; i < POT_SLOTS; i++) {
    const slot = world.pot[i];
    const cx = STATIONS.pot.x + 55 + i * 110;
    const cy = STATIONS.pot.y + 38;
    ctx.fillStyle = '#2c2c30';
    ctx.beginPath(); ctx.ellipse(cx, cy + 8, 46, 14, 0, 0, Math.PI * 2); ctx.fill();
    if (slot.item) {
      const st = slotState('pot', slot.item, slot.t);
      const prep = grillPrep('pot', slot.item.id, slot.t);
      drawItem(ctx, { id: slot.item.id, prep }, cx, cy - 6, 40);
      bar(ctx, cx - 40, cy + 32, 80, 7, st.frac, st.color, st.color, st.color);
      text(ctx, st.label, cx, cy - 30, 10, st.color, 'center');
      if (slot.t < COOK_TIMES[slot.item.id].done) {
        ctx.strokeStyle = 'rgba(120,200,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx - 12, cy - 18, 5, Math.PI, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + 12, cy - 20, 5, Math.PI, 0); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = '#888';
      ctx.beginPath(); ctx.ellipse(cx, cy, 34, 10, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // Assembly plates.
  drawCounter(ctx, STATIONS.plates, '#dfe6ea');
  for (let i = 0; i < PLATE_SLOTS; i++) {
    const plate = world.plates[i];
    const cx = STATIONS.plates.x + 50 + i * 100;
    const cy = STATIONS.plates.y + 42;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(cx, cy, 44, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b9c4ca'; ctx.lineWidth = 2; ctx.stroke();
    plate.items.forEach((item, j) => {
      drawItem(ctx, item, cx + (j % 2 === 0 ? -14 : 14), cy - 8 + Math.floor(j / 2) * 16, 26);
    });
    if (plate.dish) {
      text(ctx, '✓ ' + plate.dish.name, cx, cy - 34, 10, '#2e7d32', 'center');
    } else if (plate.items.length > 0) {
      text(ctx, `${plate.items.length} bahan`, cx, cy - 34, 10, '#5a6a72', 'center');
    }
  }

  // Serve window.
  drawCounter(ctx, STATIONS.serve, '#c0392b');
  ctx.fillStyle = '#fff8e6';
  rr(ctx, STATIONS.serve.x + 16, STATIONS.serve.y + 12, 168, 52, 8); ctx.fill();
  text(ctx, 'ANTAR DI SINI', STATIONS.serve.x + 100, STATIONS.serve.y + 30, 14, '#c0392b', 'center');
  text(ctx, 'bawa piring lengkap', STATIONS.serve.x + 100, STATIONS.serve.y + 50, 11, '#8a5a33', 'center');
  // Bell.
  ctx.fillStyle = '#f2c230';
  ctx.beginPath(); ctx.arc(STATIONS.serve.x + 100, STATIONS.serve.y + 78, 10, Math.PI, 0); ctx.fill();
  ctx.fillRect(STATIONS.serve.x + 94, STATIONS.serve.y + 78, 12, 4);

  // Trash.
  const tr = STATIONS.trash;
  ctx.fillStyle = '#6a6a70';
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 8); ctx.fill();
  ctx.fillStyle = '#4a4a50';
  rr(ctx, tr.x + 6, tr.y + 6, tr.w - 12, 12, 4); ctx.fill();
  text(ctx, '🗑', tr.x + tr.w / 2, tr.y + 38, 22, '#fff', 'center');
  text(ctx, tr.label, tr.x + tr.w / 2, tr.y + tr.h - 8, 11, '#fff', 'center');
}

// --- Chef --------------------------------------------------------------------

function drawChef(ctx, world) {
  const c = world.chef;
  const bob = c.moving ? Math.sin(c.walk) * 3 : Math.sin(world.elapsed * 2) * 1.5;
  const x = c.x;
  const y = c.y + bob * 0.3;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, c.y + 26, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body: red apron.
  ctx.fillStyle = '#c0392b';
  rr(ctx, x - 18, y - 8, 36, 34, 12); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 18, y - 8, 36, 8);
  // Arms.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath(); ctx.arc(x - 20, y + 8, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 20, y + 8, 7, 0, Math.PI * 2); ctx.fill();
  // Head.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath(); ctx.arc(x, y - 22, 17, 0, Math.PI * 2); ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  rr(ctx, x - 15, y - 48, 30, 14, 6); ctx.fill();
  ctx.beginPath(); ctx.arc(x - 9, y - 48, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 9, y - 48, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 52, 10, 0, Math.PI * 2); ctx.fill();
  // Face.
  ctx.fillStyle = '#222';
  const look = c.face * 2;
  ctx.beginPath(); ctx.arc(x - 6 + look, y - 24, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 6 + look, y - 24, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a4a2a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x + look, y - 16, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Held item above the head, with a dark pill behind its label so it
  // stays readable over counters and stations.
  if (c.carrying) {
    const hy = y - 66 + Math.sin(world.elapsed * 3) * 2;
    const pill = (str, px, py, color) => {
      ctx.font = `bold 11px ${FONT}`;
      const w = ctx.measureText(str).width + 16;
      ctx.fillStyle = 'rgba(40,25,10,0.88)';
      rr(ctx, px - w / 2, py - 10, w, 20, 10); ctx.fill();
      text(ctx, str, px, py + 1, 11, color, 'center');
    };
    if (c.carrying.plate) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(x, hy + 6, 34, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b9c4ca'; ctx.stroke();
      c.carrying.items.forEach((item, j) => {
        drawItem(ctx, item, x + (j % 2 === 0 ? -12 : 12), hy - 2 + Math.floor(j / 2) * 12, 22);
      });
      if (c.carrying.dish) pill('✓ ' + c.carrying.dish.name, x, hy + 32, '#b8e6a0');
    } else {
      drawItem(ctx, c.carrying, x, hy, 36);
      pill(`${INGREDIENTS[c.carrying.id].name} (${prepLabel(c.carrying.prep)})`, x, hy + 28, '#ffffff');
    }
  }
}

// --- Top bar: order board, coins, timer --------------------------------------

function drawTopBar(ctx, world) {
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, 0, CANVAS_W, TOPBAR_H);
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(0, TOPBAR_H - 6, CANVAS_W, 6);
  text(ctx, 'PESANAN', 16, 16, 13, '#ffd94d');
  world.orders.forEach((order, i) => {
    const x = 16 + i * 208;
    const y = 26;
    const w = 198;
    const h = 62;
    const frac = Math.max(0, order.patience / order.maxPatience);
    const urgent = order.patience < 10;
    ctx.fillStyle = urgent && Math.floor(world.elapsed * 4) % 2 === 0 ? '#ffe1de' : '#fff8e6';
    rr(ctx, x, y, w, h, 8); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#5da83c' : frac > 0.25 ? '#e8a54b' : '#d9392b';
    rr(ctx, x, y, 6, h, 4); ctx.fill();
    text(ctx, order.recipe.name, x + 14, y + 14, 14, '#5a3a1a');
    text(ctx, `$${order.recipe.price}`, x + w - 10, y + 14, 14, '#8a5a33', 'right');
    order.recipe.needs.forEach((need, j) => {
      drawItem(ctx, { id: need.id, prep: need.prep }, x + 26 + j * 34, y + 36, 26);
    });
    bar(ctx, x + 12, y + h - 10, w - 24, 6, frac, '#5da83c', '#e8a54b', '#d9392b');
  });
  if (world.orders.length === 0) {
    text(ctx, 'Belum ada pesanan…', 120, 58, 14, '#cbb98f');
  }
  // Coins / served.
  const rx = 872;
  text(ctx, '💰', rx, 30, 22, '#ffd94d', 'left');
  text(ctx, `$${world.coins}`, rx + 30, 30, 26, '#ffd94d');
  text(ctx, `disajikan ${world.served}  •  hangus ${world.missed}`, rx + 30, 58, 13, '#e8d3ac');
  if (world.combo > 1) {
    text(ctx, `COMBO x${world.combo}!`, rx + 30, 80, 15, '#ff9d4d');
  }
  // Day timer.
  const mm = String(Math.floor(world.timeLeft / 60)).padStart(2, '0');
  const ss = String(Math.floor(world.timeLeft % 60)).padStart(2, '0');
  text(ctx, `${mm}:${ss}`, 1230, 30, 30, world.timeLeft < 30 ? '#ff6b5e' : '#ffffff', 'right');
  text(ctx, world.rush ? '⚡ RUSH HOUR' : 'SISA WAKTU', 1230, 58, 12, world.rush ? '#ff9d4d' : '#cbb98f', 'right');
  bar(ctx, 1090, 74, 154, 8, world.timeLeft / DAY_LENGTH, '#5da83c', '#e8a54b', '#d9392b');
}

// --- Bottom HUD ---------------------------------------------------------------

function drawHud(ctx, world) {
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, CANVAS_H - 72, CANVAS_W, 72);
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(0, CANVAS_H - 72, CANVAS_W, 4);
  // Held item slot.
  ctx.fillStyle = '#fff8e6';
  rr(ctx, 16, CANVAS_H - 60, 52, 52, 8); ctx.fill();
  const c = world.chef.carrying;
  if (c) {
    if (c.plate) text(ctx, '🍽', 42, CANVAS_H - 34, 24, '#333', 'center');
    else drawItem(ctx, c, 42, CANVAS_H - 34, 34);
  } else {
    text(ctx, '—', 42, CANVAS_H - 34, 20, '#999', 'center');
  }
  const heldLabel = !c ? 'Tangan kosong' : c.plate
    ? (c.dish ? `Piring: ${c.dish.name} ✓` : `Piring: ${c.items.length} bahan`)
    : `${INGREDIENTS[c.id].name} (${prepLabel(c.prep)})`;
  text(ctx, heldLabel, 80, CANVAS_H - 34, 14, '#fff');
  text(ctx, 'WASD / klik: jalan   •   E / klik stasiun: pakai   •   Q: buang   •   P: jeda   •   M: suara', 640, CANVAS_H - 34, 13, '#cbb98f', 'center');
  text(ctx, `Rekor: $${world.best}`, 1240, CANVAS_H - 34, 13, '#ffd94d', 'right');
}

// --- Floats, toasts, banners ---------------------------------------------------

function drawFloats(ctx, world) {
  for (const f of world.floats) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    text(ctx, f.text, f.x, f.y, 24, f.color, 'center');
    ctx.globalAlpha = 1;
  }
}

function drawToasts(ctx, world) {
  world.toasts.forEach((t, i) => {
    const y = CANVAS_H - 108 - i * 30;
    ctx.globalAlpha = Math.max(0, Math.min(1, t.life));
    const w = ctx.measureText(t.text).width + 28;
    ctx.fillStyle = 'rgba(40,25,10,0.9)';
    rr(ctx, 640 - (ctx.measureText(t.text).width + 28) / 2, y - 13, ctx.measureText(t.text).width + 28, 26, 13); ctx.fill();
    text(ctx, t.text, 640, y, 14, '#ffe9b0', 'center');
    ctx.globalAlpha = 1;
  });
}

function drawRushBanner(ctx, world) {
  if (!world.rush || world.screen !== 'play') return;
  const pulse = 0.65 + 0.35 * Math.sin(world.elapsed * 6);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#d9392b';
  rr(ctx, 490, 104, 300, 34, 17); ctx.fill();
  text(ctx, '⚡ RUSH HOUR! ⚡', 640, 122, 18, '#ffffff', 'center');
  ctx.globalAlpha = 1;
}

// --- Overlays -------------------------------------------------------------------

function dim(ctx) {
  ctx.fillStyle = 'rgba(20,12,4,0.62)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawTitle(ctx, world) {
  dim(ctx);
  ctx.fillStyle = '#fff8e6';
  rr(ctx, 290, 110, 700, 470, 20); ctx.fill();
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 5; ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', 640, 168, 52, '#c0392b', 'center');
  text(ctx, '— DAPUR KILAT —', 640, 208, 20, '#8a5a33', 'center');
  text(ctx, 'Masak cepat, sajikan tepat waktu!', 640, 244, 17, '#5a3a1a', 'center');
  const lines = [
    '1. Ambil bahan dari peti di konter belakang.',
    '2. Cincang sayur di talenan, panggang patty, rebus pasta & kaldu.',
    '3. Susun hidangan di piring, antar ke Jendela Saji sebelum pesanan hangus.',
    '4. Sajikan beruntun untuk COMBO — hati-hati, makanan bisa gosong!',
  ];
  lines.forEach((l, i) => text(ctx, l, 640, 288 + i * 30, 15, '#5a3a1a', 'center'));
  const blink = Math.floor(world.elapsed * 2) % 2 === 0;
  if (blink) text(ctx, '▶  Tekan ENTER atau KLIK untuk mulai  ◀', 640, 452, 19, '#c0392b', 'center');
  text(ctx, 'WASD / klik untuk jalan  •  E untuk memakai stasiun  •  P jeda  •  M suara', 640, 500, 13, '#8a6a3f', 'center');
  if (world.best > 0) text(ctx, `Rekor: $${world.best}`, 640, 534, 15, '#8a5a33', 'center');
}

function drawPause(ctx) {
  dim(ctx);
  text(ctx, 'JEDA', 640, 330, 48, '#ffffff', 'center');
  text(ctx, 'Tekan P untuk lanjut', 640, 380, 18, '#ffe9b0', 'center');
}

function drawOver(ctx, world) {
  dim(ctx);
  const s = world.overStats || { coins: 0, served: 0, missed: 0, bestCombo: 0, stars: 0 };
  ctx.fillStyle = '#fff8e6';
  rr(ctx, 340, 130, 600, 440, 20); ctx.fill();
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 5; ctx.stroke();
  text(ctx, 'HARI SELESAI!', 640, 182, 40, '#c0392b', 'center');
  const stars = '★★★'.slice(0, s.stars) + '☆☆☆'.slice(0, 3 - s.stars);
  text(ctx, stars, 640, 232, 40, '#f2c230', 'center');
  text(ctx, `Koin: $${s.coins}`, 640, 296, 26, '#5a3a1a', 'center');
  text(ctx, `Hidangan disajikan: ${s.served}`, 640, 336, 17, '#5a3a1a', 'center');
  text(ctx, `Pesanan hangus: ${s.missed}   •   Combo terbaik: x${s.bestCombo}`, 640, 368, 17, '#5a3a1a', 'center');
  text(ctx, `Rekor: $${world.best}`, 640, 400, 17, '#8a5a33', 'center');
  const blink = Math.floor(world.elapsed * 2) % 2 === 0;
  if (blink) text(ctx, '▶  Tekan ENTER untuk main lagi  ◀', 640, 470, 19, '#c0392b', 'center');
  text(ctx, 'Terima kasih sudah memasak di Dapur Kilat!', 640, 516, 14, '#8a6a3f', 'center');
}

// --- Main render ---------------------------------------------------------------

export function render(ctx, world) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawFloor(ctx);
  drawWall(ctx);
  drawCrates(ctx);
  drawStations(ctx, world);
  drawChef(ctx, world);
  drawTopBar(ctx, world);
  drawHud(ctx, world);
  drawFloats(ctx, world);
  drawToasts(ctx, world);
  drawRushBanner(ctx, world);
  if (world.screen === 'title') drawTitle(ctx, world);
  if (world.screen === 'pause') drawPause(ctx);
  if (world.screen === 'over') drawOver(ctx, world);
  ctx.restore();
}
