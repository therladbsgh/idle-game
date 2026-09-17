# Idle Adventure

An idle RPG built with **Phaser 3**, **TypeScript**, and **Vite**. A chibi knight auto-battles
slimes, mushrooms, and pigs, gains EXP and gold, levels up, and unlocks new monster types and zones.
Zero art assets: every sprite is drawn procedurally at boot in `src/scenes/BootScene.ts`.

## Develop

```bash
npm install
npm run dev      # starts Vite dev server with hot reload
```

## Build

```bash
npm run build    # typechecks (tsc) then bundles into dist/
```

`dist/` is a static site. Deploy it anywhere: GitHub Pages, Netlify, itch.io, etc.
`vite.config.ts` uses relative asset paths so the build works from any subpath.

## Project layout

| Path | What it does |
|---|---|
| `src/main.ts` | Phaser game bootstrap and scale config |
| `src/scenes/BootScene.ts` | Procedural texture generation (hero, sword, monsters, scenery) |
| `src/scenes/GameScene.ts` | World setup, monster spawner, and the combat loop |
| `src/game/Player.ts` | Hero stats, XP/level-ups, and view |
| `src/game/Monster.ts` | Monster stats (scaled at spawn) and view |
| `src/game/config.ts` | **All balance numbers: tune the game here** |
| `src/game/fx.ts` | Damage numbers, particles, screen shake |
| `src/ui/Hud.ts` | HP/MP/EXP bars, stats panel, kill feed, banners, speed toggle |

## How to tweak

- Monster stats, unlock levels, zones, and combat pacing: `src/game/config.ts`
- New monster art: add a `make*` method in `BootScene.ts` and a row in `MONSTER_TYPES`
- Combat behavior: `GameScene.updatePlayer` / `updateMonsters`
