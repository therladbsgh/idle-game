import Phaser from 'phaser';
import { MonsterType, WORLD } from './config';

// A monster. Stats scale with the player's level at spawn time.
// Owns its view (container, sprite, floating HP bar); behavior lives in GameScene.

export class Monster {
  hp: number;
  maxHp: number;
  atk: number;
  exp: number;
  gold: number;

  dir: 1 | -1 = 1;
  wanderT = 2;
  hopPhase = Math.random() * 6;
  attackT = 1;
  flashT = 0;
  dead = false;
  deadT = 0;

  container: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Sprite;
  private hpBg: Phaser.GameObjects.Rectangle;
  private hpFill: Phaser.GameObjects.Rectangle;

  constructor(
    private scene: Phaser.Scene,
    public def: MonsterType,
    x: number,
    playerLevel: number,
  ) {
    const s = 1 + 0.22 * (playerLevel - 1);
    this.maxHp = this.hp = Math.round(def.hp * s);
    this.atk = Math.round(def.atk * (1 + 0.12 * (playerLevel - 1)));
    this.exp = Math.round(def.exp * (1 + 0.25 * (playerLevel - 1)));
    this.gold = Math.round(def.gold * (1 + 0.2 * (playerLevel - 1)));

    this.container = scene.add.container(x, WORLD.groundY).setDepth(5);
    const shadow = scene.add.image(0, 3, 'shadow').setDisplaySize(48, 12);
    this.body = scene.add.sprite(0, -30, def.texture);
    this.hpBg = scene.add.rectangle(0, -72, 54, 8, 0x000000, 0.55).setVisible(false);
    this.hpFill = scene.add
      .rectangle(-26, -72, 52, 6, 0xff5252)
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.container.add([shadow, this.body, this.hpBg, this.hpFill]);
  }

  get x(): number {
    return this.container.x;
  }
  set x(v: number) {
    this.container.x = v;
  }

  takeDamage(dmg: number): boolean {
    this.hp -= dmg;
    this.flashT = 0.12;
    this.body.setTintFill(0xffffff);
    return this.hp <= 0;
  }

  die(): void {
    this.dead = true;
    this.deadT = 0.45;
    this.hpBg.setVisible(false);
    this.hpFill.setVisible(false);
  }

  destroy(): void {
    this.container.destroy(true);
  }

  updateVisual(dt: number): void {
    this.flashT -= dt;
    if (this.flashT <= 0) this.body.clearTint();
    this.body.scaleX = this.dir;
    if (this.dead) {
      this.container.alpha = Math.max(0, this.deadT / 0.45);
      this.container.y = WORLD.groundY - (0.45 - this.deadT) * 120;
    } else {
      this.hopPhase += dt * 6;
      this.body.y = -30 - Math.abs(Math.sin(this.hopPhase)) * 6;
      const hurt = this.hp < this.maxHp;
      this.hpBg.setVisible(hurt);
      this.hpFill.setVisible(hurt);
      if (hurt) this.hpFill.displayWidth = 52 * Math.max(0, this.hp / this.maxHp);
    }
  }
}
