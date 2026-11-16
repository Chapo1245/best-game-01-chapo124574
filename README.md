# EMBERWARD — Keep the Last Light Burning

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Chapo1245/best-game-01-chapo124574/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Chapo1245/best-game-01-chapo124574/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An entry for [best-game-01 on make.fun](https://make.fun/bounty/best-game-01): a complete, original tower-defense game that plays offline in a desktop browser from static files. No network requests, no build step.

## The game

You are the last Keeper of the Ember Vale. Night falls; shadow wisps crawl in from the dark and march on the Vale gate. Build lantern-towers on the stone pads and hold the line through **40 waves** — then dawn breaks and you win. Lose all 20 hearts and the dark takes the Vale.

- **Light is the weapon.** Towers burn brighter in the light: enemies standing in a tower's glow take +25% damage, while armored shades shrug off blows in the dark. Braziers are pure light — place them where the dark is thickest.
- **7 tower kinds** — Ember Spitter, Frost Lantern, Sun Cannon, Gale Fan, Prism Lance, Warden Totem, Brazier — each with **3 upgrade tiers**.
- **6 enemy kinds and 4 bosses** (Gloomfiend, Dreadwisp, Night Herald, The Gloom King). Every 5th wave is a **night wave**: faster, tougher, richer.
- **A real economy:** gold for every kill, interest on banked gold between waves, wave-clear bonuses, selling at 70%. Two abilities — **Meteor** and **Frost Nova** — bought with gold mid-wave.
- **Complete loop:** title screen, build phase, 40 waves, pause, victory screen with stars, defeat screen, restart, best score saved locally.
- **Feel:** WebAudio synth sound effects and a music loop, particles, screen shake, floating combat text, wave banners, 2× speed.

## Controls

| Input | Action |
|---|---|
| Mouse | Select pads and towers, click shop cards |
| `1`–`7` | Choose a tower to build |
| `U` / `X` | Upgrade / sell the selected tower |
| `Q` / `E` | Meteor / Frost Nova |
| `Space` | Start the next wave (or toggle 2× speed mid-wave) |
| `P` | Pause · `M` | Mute |

## Play it

Serve `game/` with any static file server and open `game/index.html`, or:

```sh
node --run serve  # if a serve script is present; otherwise:
python3 -m http.server --directory game 8123
# open http://localhost:8123/
```

Deterministic screenshots: open `game/index.html?shot=title|play|boss|win&seed=20261116` — each scene renders a fixed board from a seeded generator.

## Structure

- `game/index.html` — the page; `game/src/main.js` — entry point
- `game/src/config.js` — tuning, tower/enemy definitions, wave table
- `game/src/map.js` — path, build pads, light map
- `game/src/towers.js` — placement, targeting, upgrades
- `game/src/enemies.js` — wisps, brutes, bosses
- `game/src/waves.js` — spawn director, boss schedule, economy
- `game/src/render.js` — all drawing: world, HUD, shop, screens
- `game/src/input.js` — mouse + keyboard
- `game/src/audio.js` — WebAudio synth SFX + music
- `game/src/particles.js` — embers, bursts, floating text
- `game/src/game.js` — state machine, main loop, abilities, shot scenes
- `main.ts` — the entry program: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see [LICENSE](LICENSE).

<sub>Entered on [make.fun](https://make.fun/?ref=wtacm6ft&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
