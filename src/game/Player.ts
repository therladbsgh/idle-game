import Phaser from 'phaser';
import { BALANCE, WORLD, expForLevel } from './config';

// The hero. Owns stats and its view (container + sprites).
// Decision-making (targeting, movement, attacking) lives in GameScene.

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
  walkPhase = 0;
  moving = false;
  attackT = 0;
  skillT = 0;
  deadT = 0;
  idleT = 2;
  idleDir: 1 | -1 = 1;

  container: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Sprite;
  private sword: Phaser.GameObjects.Sprite;
  private swingT = 0;

  constructor(private scene: Phaser.Scene, x: number) {
    this.container = scene.add.container(x, WORLD.groundY).setDepth(10);
    const shadow = scene.add.image(0, 6, 'shadow');
    this.body = scene.add.sprite(0, -100, 'hero');
    this.sword = scene.add.sprite(44, -112, 'sword').setOrigin(0.5, 0.85).setAngle(-40);
    this.container.add([shadow, this.body, this.sword]);
  }

  get x(): number {
    return this.container.x;
  }
  set x(v: number) {
    this.container.x = v;
  }

  playSwing(skill: boolean): void {
    this.swingT = 0.28;
    this.scene.tweens.killTweensOf(this.sword);
    this.sword.setAngle(-40);
    this.scene.tweens.add({
      targets: this.sword,
      angle: skill ? 150 : 105,
      duration: 200,
      ease: 'Cubic.easeOut',
    });
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

  respawn(x: number): void {
    this.x = x;
    this.fullHeal();
    this.deadT = 0;
    this.container.setVisible(true).setAlpha(1);
  }

  updateVisual(dt: number, t: number): void {
    this.container.scaleX = this.dir;
    if (this.deadT > 0) {
      // Respawn blink.
      this.container.setVisible(Math.floor(t * 6) % 2 === 0);
      return;
    }
    this.container.setVisible(true);
    this.container.y =
      WORLD.groundY + (this.moving ? Math.sin(this.walkPhase) * 6 : Math.sin(t * 2) * 3);
    this.swingT = Math.max(0, this.swingT - dt);
    if (this.swingT <= 0) this.sword.setAngle(-40);
    // Gold sword glow when Power Strike is ready.
    const ready = this.skillT <= 0 && this.mp >= BALANCE.skillMpCost;
    this.sword.setTint(ready ? 0xffe066 : 0xffffff);
  }
}
