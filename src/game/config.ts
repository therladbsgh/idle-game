// World dimensions and all tunable balance numbers live here.
// This is the file to edit when playtesters complain.

export const WORLD: { w: number; h: number; groundY: number } = {
  w: 1920,
  h: 1080,
  groundY: 904,
};

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
  texture: string; // texture key generated in BootScene
}

export const MONSTER_TYPES: MonsterType[] = [
  { name: 'Green Slime', minLevel: 1, hp: 34, atk: 4, exp: 14, gold: 6, texture: 'slime' },
  { name: 'Orange Mushroom', minLevel: 3, hp: 64, atk: 7, exp: 28, gold: 11, texture: 'mush' },
  { name: 'Ribbon Pig', minLevel: 6, hp: 120, atk: 11, exp: 52, gold: 20, texture: 'pig' },
  { name: 'Dark Slime', minLevel: 10, hp: 220, atk: 17, exp: 98, gold: 36, texture: 'dslime' },
  { name: 'Fire Mushroom', minLevel: 15, hp: 380, atk: 26, exp: 175, gold: 60, texture: 'fmush' },
];

export const ZONES: Array<[number, string]> = [
  [1, 'SLIME MEADOW'],
  [6, 'MUSHROOM GROVE'],
  [11, 'DARK HOLLOW'],
  [16, 'EMBER FIELDS'],
];

export const expForLevel = (level: number): number => Math.floor(25 * Math.pow(level, 1.7));
