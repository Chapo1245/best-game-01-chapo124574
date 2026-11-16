# EMBERDECK

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Chapo1245/best-game-01-chapo124574/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Chapo1245/best-game-01-chapo124574/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Your deck is your town's wall. A deck-builder defense for make.fun's best-game-01: play cards to raise towers, walls and braziers on three lanes, hold the Heartflame through ten nights of the Gloom, and draft one new card after every night — then thin the deck by removing a card you no longer want.

## How it plays

- **Plan phase:** a hand of five cards. Click a card, then a lane cell to place it. Towers shoot on their own; walls block the lane; braziers light the dark (foes inside are slowed and take +25% damage). Spells — Ember Burst, Deep Freeze, Mend the Flame, Gold Rush, Overcharge, Reinforce — resolve at once, and work during the night too.
- **Night phase:** the Gloom walks the lanes from the left. Foes that reach the Heartflame gate bite it. Survive the wave to reach the draft.
- **Draft phase:** pick 1 of 3 new cards for your deck, then optionally remove one copy of a card to keep the deck lean. A lean deck draws the cards you want.
- **Win / lose:** survive night 10 — the Hollow King walks lane 1 with an escort — and the dawn breaks with stars for the Heartflame's remaining health. Lose the flame and the light goes out.

Controls: mouse to play cards, keys 1-5 to pick a hand card, B to begin the night, Space to pause. Sound is a tiny WebAudio synth; M (♪ button) mutes.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The game is plain static files under `game/` — no build step, no network request. Screenshots in `screenshots/` are real renders of the game's own code (`?shot=play|title|boss|victory&seed=20261116`), taken in headless Chromium; the first by name is the cover.

---

<sub>Entered on [make.fun](https://make.fun/?ref=wtacm6ft&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
