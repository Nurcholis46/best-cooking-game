// Sizzle & Serve: deterministic staged scenes for the screenshots (?shot=...).
// Each scene sets the world to an exact state and the game draws one frame,
// so every screenshot is a real render of the game's own code — never edited.
import { RECIPES, STATIONS } from './config.js';

function setOrder(world, recipe, patienceFrac) {
  const max = recipe.patience;
  world.orders.push({
    id: world.orders.length + 1,
    recipe,
    patience: max * patienceFrac,
    maxPatience: max,
    born: 0,
    instant: false,
  });
}

/** Stage the named scene on a fresh playing world. Returns the screen to show. */
export function stageShot(name, world) {
  world.screen = 'play';
  world.elapsed = 0;
  world.orders = [];
  world.floats = [];
  world.toasts = [];
  world.shake = 0;

  if (name === 'rush') {
    // Rush hour: four tickets, one nearly lost, both grill slots busy,
    // broth ready in the pot, chef sprinting to the grill.
    world.elapsed = 128;
    world.timeLeft = 52;
    world.coins = 214;
    world.served = 11;
    world.missed = 1;
    world.combo = 3;
    world.comboTimer = 8;
    world.rush = true;
    world.rushAnnounced = true;
    setOrder(world, RECIPES.burger, 0.18);
    setOrder(world, RECIPES.pasta, 0.42);
    setOrder(world, RECIPES.soup, 0.65);
    setOrder(world, RECIPES.salad, 0.8);
    world.grill[0] = { item: { id: 'patty', prep: 'raw' }, t: 5.2 };
    world.grill[1] = { item: { id: 'patty', prep: 'raw' }, t: 9.4 };
    world.pot[0] = { item: { id: 'broth', prep: 'raw' }, t: 6.0 };
    world.pot[1] = { item: { id: 'pasta', prep: 'raw' }, t: 3.1 };
    world.board.item = { id: 'carrot', prep: 'raw' };
    world.board.progress = 0.55;
    world.plates[0].items = [{ id: 'bun', prep: 'raw' }, { id: 'lettuce', prep: 'chopped' }];
    world.plates[1].items = [{ id: 'lettuce', prep: 'chopped' }, { id: 'tomato', prep: 'chopped' }, { id: 'cheese', prep: 'raw' }];
    world.plates[1].dish = RECIPES.salad;
    world.chef.x = 420;
    world.chef.y = 470;
    world.chef.face = 1;
    world.chef.carrying = { id: 'tomato', prep: 'chopped' };
    world.floats.push({ x: 1140, y: 280, text: '+$24', color: '#ffd94d', life: 1.2 });
    return 'play';
  }

  if (name === 'results') {
    // End of a good day: results panel over the kitchen.
    world.elapsed = 180;
    world.timeLeft = 0;
    world.coins = 312;
    world.served = 14;
    world.missed = 2;
    world.bestCombo = 3;
    world.best = 312;
    world.screen = 'over';
    world.overStats = { coins: 312, served: 14, missed: 2, bestCombo: 3, stars: 3 };
    world.chef.x = 640;
    world.chef.y = 520;
    return 'over';
  }

  if (name === 'title') {
    world.screen = 'title';
    world.elapsed = 1.2;
    world.timeLeft = 180;
    world.coins = 0;
    world.best = 148;
    setOrder(world, RECIPES.burger, 0.9);
    setOrder(world, RECIPES.salad, 0.75);
    world.chef.x = 640;
    world.chef.y = 520;
    return 'title';
  }

  // 'cover' (default): the full game at its best — kitchen, order board,
  // ingredients on the counter, a burger mid-assembly, a timer, and a
  // salad plate ready to serve.
  world.elapsed = 41;
  world.timeLeft = 139;
  world.coins = 86;
  world.served = 4;
  world.missed = 0;
  world.combo = 2;
  world.comboTimer = 6;
  setOrder(world, RECIPES.burger, 0.62);
  setOrder(world, RECIPES.salad, 0.8);
  setOrder(world, RECIPES.pasta, 0.45);
  world.board.item = { id: 'tomato', prep: 'raw' };
  world.board.progress = 0.6;
  world.grill[0] = { item: { id: 'patty', prep: 'raw' }, t: 4.4 };
  world.pot[0] = { item: { id: 'pasta', prep: 'raw' }, t: 3.6 };
  // Burger mid-assembly: bun + patty, still needs lettuce + cheese.
  world.plates[0].items = [{ id: 'bun', prep: 'raw' }, { id: 'patty', prep: 'cooked' }];
  // Salad complete and ready to serve.
  world.plates[1].items = [{ id: 'lettuce', prep: 'chopped' }, { id: 'tomato', prep: 'chopped' }, { id: 'cheese', prep: 'raw' }];
  world.plates[1].dish = RECIPES.salad;
  world.chef.x = 900;
  world.chef.y = 470;
  world.chef.face = -1;
  world.chef.carrying = { id: 'cheese', prep: 'raw' };
  world.floats.push({ x: 1140, y: 280, text: '+$18', color: '#ffd94d', life: 1.2 });
  return 'play';
}
