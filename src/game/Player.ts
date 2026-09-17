import Phaser from 'phaser';
import { BALANCE, PHYSICS, expForLevel } from './config';

// The hero: an Arcade Physics sprite with stats.
// Decision-making (targeting, navigation, attacking) lives in GameScene.

export class Player {
  level = 1;
  exp = 0;
  maxHp = BALANCE.baseMaxHp;
  hp = BALANCE.baseMaxHp;
  maxMp = BALANCE.baseMaxMp;
  mp = BALANCE.baseMaxMp;
  atk = BALANCE.baseAtk;
  gold = 0;
  kills = 0;

  dir: 1 | -1 = 1;
  attackT = 0;
  skillT = 0;
  deadT = 0;
  idleT = 2;
  idleDir: 1 | -1 = 1;

  // Platforming state (driven by GameScene).
  sprite: Phaser.Physics.Arcade.Sprite;
  platform = -1; // -1 = ground, else index into PLATFORMS
  climbing = false;
  climbVine: { x: number; yTop: number; yBottom: number; from: number; to: number } | null = null;
  climbDir: 'up' | 'down' = 'up';
  moving = false;
  airborne = false;
  private attackAnimT = 0;
  private curAnim = '';

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    this.sprite = scene.physics.add.sprite(x, y, 'hero_walk');
    this.sprite.setScale(PHYSICS.heroScale).setDepth(10);
    this.sprite.setCollideWorldBounds(false);
    this.fixBody('hero_walk');
    this.sprite.play('hero_walk');
    this.curAnim = 'hero_walk';
  }

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }

  /** Keep the physics body aligned when the cell size changes (attack uses wider cells). */
  private fixBody(tex: string): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const cellW = tex === 'hero_attack' ? 32 : 20;
    body.setSize(12, 18);
    // Body bottom sits at source row 20, where the visible feet end
    // (rows 20-23 of the 24px cell are transparent padding).
    body.setOffset((cellW - 12) / 2, 2);
  }

  /** World-space distance from the sprite center to the body's bottom (the feet). */
  get feetOffset(): number {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    return body.bottom - this.sprite.y;
  }

  private playAnim(key: string): void {
    if (this.curAnim === key) return;
    this.curAnim = key;
    this.fixBody(key);
    this.sprite.anims.resume();
    this.sprite.play(key, true);
  }

  startAttackAnim(skill: boolean): void {
    this.attackAnimT = skill ? 0.34 : 0.28;
    this.playAnim('hero_attack');
  }

  takeDamage(dmg: number): boolean {
    this.hp -= dmg;
    return this.hp <= 0;
  }

  /** Adds EXP. Returns the number of level-ups earned. */
  gainExp(n: number): number {
    this.exp += n;
    let ups = 0;
    while (this.exp >= expForLevel(this.level)) {
      this.exp -= expForLevel(this.level);
      this.level++;
      ups++;
      this.maxHp += BALANCE.hpPerLevel;
      this.maxMp += BALANCE.mpPerLevel;
      this.atk += BALANCE.atkPerLevel;
    }
    return ups;
  }

  fullHeal(): void {
    this.hp = this.maxHp;
    this.mp = this.maxMp;
  }

  respawn(x: number, y: number): void {
    this.sprite.setPosition(x, y).setVelocity(0, 0);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
    this.climbing = false;
    this.platform = -1;
    this.fullHeal();
    this.deadT = 0;
    this.sprite.setVisible(true).setAlpha(1);
  }

  updateVisual(dt: number, t: number): void {
    const s = this.sprite;
    s.setFlipX(this.dir < 0);
    if (this.deadT > 0) {
      s.setVisible(Math.floor(t * 6) % 2 === 0);
      return;
    }
    s.setVisible(true);

    this.attackAnimT = Math.max(0, this.attackAnimT - dt);
    if (this.attackAnimT > 0) {
      this.playAnim('hero_attack');
    } else if (this.climbing) {
      this.playAnim('hero_climb');
      // Pause the climb anim when hanging still.
      const body = s.body as Phaser.Physics.Arcade.Body;
      if (Math.abs(body.velocity.y) < 1) s.anims.pause();
      else s.anims.resume();
    } else if (this.airborne) {
      this.playAnim('hero_jump');
    } else if (this.moving) {
      this.playAnim('hero_walk');
    } else {
      // Idle: single frame.
      if (this.curAnim !== 'hero_idle') {
        this.curAnim = 'hero_idle';
        this.fixBody('hero_idle');
        s.setTexture('hero_idle', 0);
      }
    }
  }
}
