import Phaser from 'phaser';
import type { MonsterType } from './config';
import { PHYSICS } from './config';

// A platform-patrolling monster with Arcade Physics.
// Hops around MapleStory-style; stats scale off the player's level.

export class Monster {
  readonly def: MonsterType;
  readonly level: number;
  readonly maxHp: number;
  hp: number;
  readonly atk: number;
  readonly exp: number;
  readonly gold: number;

  dead = false;
  deadT = 0;
  dir: 1 | -1 = 1;
  attackT = 0;
  hopT = Math.random() * 0.8;

  platform: number; // -1 = ground, else index into PLATFORMS
  minX: number;
  maxX: number;

  sprite: Phaser.Physics.Arcade.Sprite;
  private hpBar: Phaser.GameObjects.Graphics;
  private shadow: Phaser.GameObjects.Image;
  private flashT = 0;

  constructor(
    private scene: Phaser.Scene,
    def: MonsterType,
    x: number,
    y: number,
    playerLevel: number,
    platform: number,
    minX: number,
    maxX: number,
  ) {
    this.def = def;
    this.platform = platform;
    this.minX = minX;
    this.maxX = maxX;

    this.level = Math.max(1, playerLevel + Phaser.Math.Between(-1, 1));
    const scale = 1 + (this.level - 1) * 0.12;
    this.maxHp = Math.round(def.hp * scale);
    this.hp = this.maxHp;
    this.atk = Math.round(def.atk * (1 + (this.level - 1) * 0.1));
    this.exp = Math.round(def.exp * scale);
    this.gold = Math.round(def.gold * (1 + (this.level - 1) * 0.15));

    this.sprite = scene.physics.add.sprite(x, y, def.texture);
    this.sprite.setScale(def.scale).setDepth(9).setTint(def.tint);
    this.sprite.play(def.texture);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const [bw, bh] = def.body;
    const fw = this.sprite.width;
    const fh = this.sprite.height;
    body.setSize(bw, bh);
    body.setOffset((fw - bw) / 2, fh - bh);

    this.shadow = scene.add.image(x, y, 'shadow').setDepth(8);
    this.hpBar = scene.add.graphics().setDepth(11);
  }

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }

  takeDamage(dmg: number): boolean {
    if (this.dead) return false;
    this.hp -= dmg;
    this.flashT = 0.09;
    this.sprite.setTintFill(0xffffff);
    return this.hp <= 0;
  }

  die(): void {
    this.dead = true;
    this.deadT = 1.0;
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      y: this.sprite.y - 40,
      duration: 700,
      ease: 'Cubic.easeIn',
    });
    (this.sprite.body as Phaser.Physics.Arcade.Body).setEnable(false);
  }

  destroy(): void {
    this.sprite.destroy();
    this.hpBar.destroy();
    this.shadow.destroy();
  }

  /** Hop toward the player when close, else wander-hop within bounds. */
  updateAI(dt: number, px: number, py: number, playerDead: boolean): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body.touching.down && !body.blocked.down) {
      // Airborne: keep drifting, clamp to patrol bounds.
      this.sprite.x = Phaser.Math.Clamp(this.sprite.x, this.minX, this.maxX);
      return;
    }

    this.hopT -= dt;
    const dx = px - this.sprite.x;
    const adx = Math.abs(dx);
    const sameLevel = Math.abs(py - this.sprite.y) < 90;

    let want = 0;
    if (!playerDead && adx < 320 && sameLevel) {
      this.dir = dx >= 0 ? 1 : -1;
      want = adx > 92 ? this.dir : 0;
    } else {
      // Wander: hop back and forth.
      if (this.sprite.x <= this.minX + 4) this.dir = 1;
      else if (this.sprite.x >= this.maxX - 4) this.dir = -1;
      else if (Math.random() < dt * 0.4) this.dir = Math.random() < 0.5 ? -1 : 1;
      want = this.dir;
    }

    if (want !== 0 && this.hopT <= 0) {
      this.hopT = PHYSICS.monsterHopInterval * (0.8 + Math.random() * 0.5);
      body.setVelocity(want * PHYSICS.monsterMoveSpeed, -PHYSICS.monsterHopVelocity);
      this.dir = want > 0 ? 1 : -1;
    } else if (this.hopT > 0.2) {
      body.setVelocityX(0);
    }
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, this.minX, this.maxX);
  }

  updateVisual(dt: number): void {
    const s = this.sprite;
    s.setFlipX(this.dir < 0);
    if (this.flashT > 0) {
      this.flashT -= dt;
      if (this.flashT <= 0) s.setTint(this.def.tint);
    }
    this.shadow.setPosition(s.x, s.y + (s.displayHeight / 2) * 0.9);

    const g = this.hpBar;
    g.clear();
    if (!this.dead && this.hp < this.maxHp) {
      const w = 84;
      const ratio = Math.max(0, this.hp / this.maxHp);
      const bx = s.x - w / 2;
      const by = s.y - s.displayHeight / 2 - 26;
      g.fillStyle(0x0d1117, 0.8);
      g.fillRect(bx, by, w, 10);
      g.fillStyle(0xd92626, 1);
      g.fillRect(bx + 1, by + 1, (w - 2) * ratio, 8);
    }
  }
}
