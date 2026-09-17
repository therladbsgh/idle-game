// World dimensions and all tunable balance numbers live here.
// This is the file to edit when playtesters complain.

export const WORLD: { w: number; h: number; groundY: number } = {
  w: 3000, // level width; camera scrolls horizontally
  h: 1080,
  groundY: 900, // top surface of the ground
};

// Arcade Physics + platforming tunables.
export const PHYSICS: Record<string, number> = {
  gravity: 1400,
  jumpVelocity: 640, // ~146px jump height: v^2 / (2*g)
  moveSpeed: 200, // px/s, matches BALANCE.moveSpeed
  climbSpeed: 170, // px/s on vines
  heroScale: 5, // pixel-art upscale for the Spelunker sprite
  monsterHopVelocity: 300,
  monsterHopInterval: 0.9, // seconds between hops
  monsterMoveSpeed: 84,
};

// Platforms: x (left), y (top surface), w (width). Ground is platform -1.
export const PLATFORMS: Array<{ x: number; y: number; w: number }> = [
  { x: 400, y: 700, w: 400 },
  { x: 1050, y: 540, w: 380 },
  { x: 1650, y: 700, w: 400 },
  { x: 2250, y: 520, w: 380 },
];

// Climbable vines: x, yTop, yBottom, from (platform idx or -1 ground), to (platform idx).
export const VINES: Array<{ x: number; yTop: number; yBottom: number; from: number; to: number }> = [
  { x: 600, yTop: 700, yBottom: 900, from: -1, to: 0 },
  { x: 1240, yTop: 540, yBottom: 900, from: -1, to: 1 },
  { x: 1850, yTop: 700, yBottom: 900, from: -1, to: 2 },
  { x: 2440, yTop: 520, yBottom: 900, from: -1, to: 3 },
];

export const BALANCE: Record<string, number> = {
  baseMaxHp: 60,
  baseMaxMp: 30,
  baseAtk: 9,
  hpPerLevel: 14,
  mpPerLevel: 7,
  atkPerLevel: 3,
  mpRegen: 3.2, // per second
  hpRegenOutOfCombat: 5, // per second
  attackCooldown: 0.72, // seconds between swings
  attackRange: 144, // px
  moveSpeed: 200, // px per second
  skillMpCost: 12,
  skillCooldown: 5,
  skillMult: 2.6,
  critChance: 0.12,
  critMult: 1.8,
  respawnDelay: 2.2,
  maxMonsters: 5,
  spawnInterval: 1.1,
};

export interface MonsterType {
  name: string;
  minLevel: number; // unlocked once the player reaches this level
  hp: number;
  atk: number;
  exp: number;
  gold: number;
  texture: string; // spritesheet key
  tint: number; // applied to sprite (0xffffff = none)
  scale: number; // display scale
  body: [number, number]; // physics body size in texture px
}

export const MONSTER_TYPES: MonsterType[] = [
  { name: 'Green Slime', minLevel: 1, hp: 34, atk: 4, exp: 14, gold: 6, texture: 'slime', tint: 0xffffff, scale: 1.5, body: [40, 36] },
  { name: 'Orange Mushroom', minLevel: 3, hp: 64, atk: 7, exp: 28, gold: 11, texture: 'mushroom', tint: 0xffffff, scale: 1, body: [60, 56] },
  { name: 'Ribbon Pig', minLevel: 6, hp: 120, atk: 11, exp: 52, gold: 20, texture: 'pig', tint: 0xffffff, scale: 1.25, body: [85, 50] },
  { name: 'Dark Slime', minLevel: 10, hp: 220, atk: 17, exp: 98, gold: 36, texture: 'slime', tint: 0x9b30ff, scale: 1.7, body: [40, 36] },
  { name: 'Fire Mushroom', minLevel: 15, hp: 380, atk: 26, exp: 175, gold: 60, texture: 'mushroom', tint: 0xff6a00, scale: 1.15, body: [60, 56] },
];

export const ZONES: Array<[number, string]> = [
  [1, 'SLIME MEADOW'],
  [6, 'MUSHROOM GROVE'],
  [11, 'DARK HOLLOW'],
  [16, 'EMBER FIELDS'],
];

export const expForLevel = (level: number): number => Math.floor(25 * Math.pow(level, 1.7));
