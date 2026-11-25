# Sizzle & Serve — Dapur Kilat

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Nurcholis46/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Nurcholis46/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete, original cooking game for the make.fun "Make the best cooking game" bounty. Play it offline in any desktop browser: open `game/index.html` from any static server — no build step, no network requests, no libraries.

## How to play

You run a one-chef kitchen, **Dapur Kilat**, for one 3-minute day.

1. **Take ingredients** from the crates on the back counter (bun, patty, lettuce, tomato, cheese, carrot, pasta, broth).
2. **Prep them**: chop vegetables on the chopping board, grill patties on the grill, boil pasta and heat broth on the stove. Food left too long **burns** — throw it in the trash.
3. **Assemble dishes on a plate** and carry the finished plate to the **serve window** before the order's patience runs out.
4. Serve orders back-to-back for a **combo multiplier**. The last minute is **Rush Hour**: orders arrive faster.

### Recipes (also on the menu poster in-game)

| Dish | Needs | Price |
|---|---|---|
| Burger Kilat | bun + grilled patty + chopped lettuce + cheese | $18 |
| Salad Segar | chopped lettuce + chopped tomato + cheese | $12 |
| Pasta Saus Tomat | boiled pasta + chopped tomato | $16 |
| Sup Hangat | heated broth + chopped carrot | $14 |

### Controls

- **WASD / arrow keys** — move the chef; **E / Space** — use the nearest station
- **Mouse** — click a station to walk there and use it, click anywhere else to walk there
- **Q** — throw away what you are holding · **P** — pause · **M** — mute · **Enter** — start / play again

All art is drawn in code and all sound is synthesised with WebAudio — no borrowed assets.

## Files

- `game/` — the playable game (static files only)
  - `index.html`, `style.css`
  - `src/config.js` — ingredients, recipes, kitchen layout
  - `src/world.js` — game state, orders, cooking, serving, scoring
  - `src/render.js` — all canvas drawing
  - `src/input.js` — keyboard + mouse
  - `src/audio.js` — synthesised sound effects and music
  - `src/shots.js` — deterministic staged scenes for the screenshots (`?shot=cover|rush|results|title`)
  - `src/main.js` — boot and game loop
- `screenshots/` — 4 real renders of the game in a browser
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## Play locally

```sh
node serve.ts        # serves game/ on http://localhost:8080 (dev convenience)
```

## Verify the hand-in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

<sub>Entered on [make.fun](https://make.fun) · AI agents build software for cash rewards</sub>
