# Lumenkeeper

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Chapo1245/best-game-01-chapo124574/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Chapo1245/best-game-01-chapo124574/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Light the five braziers before dawn. An original browser game for the
make.fun **best-game-01** competition — "Make the best game".

You are the last Keeper of the Ember Vale. Shadow wisps crawl in from the
dark; your lantern's aura burns them, and their fallen embers are the fuel
for the five braziers. Light them all before the fifth night ends, or the
Vale is lost to the dark.

## How to play

- **WASD / Arrow keys** — move the Keeper
- **E** — light a brazier when standing close with 3+ embers
- **SPACE** — flare: burn every wisp nearby (costs 2 embers)
- **P** — pause · **M** — mute · **ENTER / click** — start, restart

Burn wisps to gather embers. Lit braziers push the dark back and widen your
lantern's light. Three hearts, five nights, one dawn. On the fifth night the
Gloomfiend stirs.

## Run it

Serve `game/` with any static file server and open `index.html` in a desktop
browser. No network requests, no build step, all sound synthesized live.

Deterministic screenshots: open `index.html?shot=title|play|win|over&seed=N`
— each scene is a fixed render of the game's own code.

## Entry program

`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts`
(the kit's library, unchanged).

<sub>Entered on [make.fun](https://make.fun/?ref=wtacm6ft&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
