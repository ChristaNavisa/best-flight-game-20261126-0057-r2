# ARUNIKA — Island Hop Flight

[![ARUNIKA](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Rank](https://make.fun/badge/best-flight-game-20261126-0057/ChristaNavisa/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Reward](https://make.fun/badge/best-flight-game-20261126-0057/ChristaNavisa/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

A complete arcade flight game: fly a small prop plane across a four-island
chain, thread the glowing rings, watch the fuel gauge, and land it gentle on
the next runway. Three legs — a first hop, a timed mail run, and a storm
landing at dusk — each with its own wind, fuel and sky.

## How to fly

- **Up / Down** — pitch the nose up or down
- **Left / Right** — throttle down or up
- **A / D** — rudder, steer left or right of the course line
- **R** — retry the leg · **P** — pause · **M** — sound on/off

Keep the speed above stall (26 m/s) or the plane sinks. Land on a runway
slower than 52 m/s and gentler than a 4.5 m/s descent, or the landing gear
— and your damage count — will notice. Three crashes and the leg is over.

## The legs

1. **First Hop** — Arunika to Seroja, three rings, a full tank, no wind.
2. **Mail Run** — Seroja to Karang, four rings in 75 seconds, a light tailwind.
3. **Storm Landing** — Karang to Senja, half a tank, an 8 m/s crosswind, dusk.

Rings are worth 100 points, a finished leg 250 plus any time bonus.

## Run it

Open `game/index.html` in a desktop browser — no server, no network, no
build step. The game is plain JavaScript modules with a canvas renderer and
a small WebAudio synth for the engine, wind, chimes and thuds.

## Structure

- `main.ts` — entrypoint: copies `game/` and `screenshots/` to the output
  directory and writes `dossier.json` through the vendored library.
- `game/index.html` + `game/style.css` — the page and its frame.
- `game/src/main.js` — the game loop, input, camera, particles, demo scenes.
- `game/src/terrain.js` — the island chain, sky, sea, runways.
- `game/src/plane.js` — arcade flight physics and the aircraft drawing.
- `game/src/missions.js` — legs, rings, landings, fuel, damage and score.
- `game/src/hud.js` — speed, altitude, compass, horizon, fuel, banners.
- `game/src/audio.js` — the synthesised sound engine.
- `game/src/demo.js` — the four fixed scenes used for the screenshots.
- `vendor/makefun-game.ts` — make.fun's dossier library, byte-identical
  to the competition kit.
