// Sizzle & Serve — Dapur Kilat: configuration, ingredients, recipes, stations.
// Original game: no borrowed names, art, music or levels.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const DAY_LENGTH = 180; // seconds per day
export const MAX_ORDERS = 4;

// --- Ingredients -------------------------------------------------------------
// prep: the state an item must be in before it can go on a plate.
//   raw     -> as picked from a crate
//   chopped -> after the chopping board
//   cooked  -> after the grill (patty)
//   boiled  -> after the pot (pasta)
//   heated  -> after the pot (broth)
//   burnt   -> overcooked: inedible, belongs in the trash
export const INGREDIENTS = {
  bun: { id: 'bun', name: 'Roti', prep: 'raw', choppable: false, grillable: false, boilable: false, color: '#e8a54b' },
  patty: { id: 'patty', name: 'Patty', prep: 'raw', choppable: false, grillable: true, boilable: false, color: '#8a5a33' },
  lettuce: { id: 'lettuce', name: 'Selada', prep: 'raw', choppable: true, grillable: false, boilable: false, color: '#5da83c' },
  tomato: { id: 'tomato', name: 'Tomat', prep: 'raw', choppable: true, grillable: false, boilable: false, color: '#d9392b' },
  cheese: { id: 'cheese', name: 'Keju', prep: 'raw', choppable: false, grillable: false, boilable: false, color: '#f2c230' },
  carrot: { id: 'carrot', name: 'Wortel', prep: 'raw', choppable: true, grillable: false, boilable: false, color: '#e07b28' },
  pasta: { id: 'pasta', name: 'Pasta', prep: 'raw', choppable: false, grillable: false, boilable: true, color: '#f0d060' },
  broth: { id: 'broth', name: 'Kaldu', prep: 'raw', choppable: false, grillable: false, boilable: true, color: '#c98f4e' },
};

export const CRATE_ORDER = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'carrot', 'pasta', 'broth'];

// --- Recipes -----------------------------------------------------------------
export const RECIPES = {
  burger: {
    id: 'burger', name: 'Burger Kilat', price: 18, patience: 58,
    needs: [
      { id: 'bun', prep: 'raw' },
      { id: 'patty', prep: 'cooked' },
      { id: 'lettuce', prep: 'chopped' },
      { id: 'cheese', prep: 'raw' },
    ],
  },
  salad: {
    id: 'salad', name: 'Salad Segar', price: 12, patience: 46,
    needs: [
      { id: 'lettuce', prep: 'chopped' },
      { id: 'tomato', prep: 'chopped' },
      { id: 'cheese', prep: 'raw' },
    ],
  },
  pasta: {
    id: 'pasta', name: 'Pasta Saus Tomat', price: 16, patience: 52,
    needs: [
      { id: 'pasta', prep: 'boiled' },
      { id: 'tomato', prep: 'chopped' },
    ],
  },
  soup: {
    id: 'soup', name: 'Sup Hangat', price: 14, patience: 48,
    needs: [
      { id: 'broth', prep: 'heated' },
      { id: 'carrot', prep: 'chopped' },
    ],
  },
};

export const RECIPE_LIST = [RECIPES.burger, RECIPES.salad, RECIPES.pasta, RECIPES.soup];

// --- Kitchen layout (canvas pixels) -----------------------------------------
export const TOPBAR_H = 96;
export const FLOOR_TOP = 246;
export const FLOOR_BOTTOM = 648;

// Ingredient crates along the back counter.
export const CRATES = CRATE_ORDER.map((id, i) => ({
  kind: 'crate', ingredient: id, x: 36 + i * 100, y: 150, w: 92, h: 82,
}));

// Work stations on the middle counter row.
export const STATIONS = {
  board: { kind: 'board', x: 40, y: 300, w: 200, h: 104, label: 'Talenan' },
  grill: { kind: 'grill', x: 280, y: 300, w: 220, h: 104, label: 'Panggangan' },
  pot: { kind: 'pot', x: 540, y: 300, w: 220, h: 104, label: 'Kompor' },
  plates: { kind: 'plates', x: 800, y: 300, w: 200, h: 104, label: 'Piring Saji' },
  serve: { kind: 'serve', x: 1040, y: 300, w: 200, h: 104, label: 'Jendela Saji' },
  trash: { kind: 'trash', x: 40, y: 560, w: 92, h: 72, label: 'Sampah' },
};

export const GRILL_SLOTS = 2;
export const POT_SLOTS = 2;
export const PLATE_SLOTS = 2;

// Cooking times (seconds). Cooked food stays good for GOOD_WINDOW, then burns.
export const COOK_TIMES = {
  patty: { done: 6, goodUntil: 10 },
  pasta: { done: 7, goodUntil: 12 },
  broth: { done: 5, goodUntil: 10 },
};
export const CHOP_TIME = 1.4;

// Chef
export const CHEF_SPEED = 280;
export const CHEF_R = 26;

/** A fresh item object for an ingredient id. */
export function makeItem(id) {
  return { id, prep: 'raw' };
}

/** Human label for a prep state. */
export function prepLabel(prep) {
  return { raw: 'mentah', chopped: 'dicincang', cooked: 'matang', boiled: 'rebus', heated: 'hangat', burnt: 'gosong' }[prep] ?? prep;
}
