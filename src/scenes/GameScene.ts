import Phaser from 'phaser';
import { BALANCE, MONSTER_TYPES, WORLD } from '../game/config';
import { Player } from '../game/Player';
import { Monster } from '../game/Monster';
import { Hud } from '../ui/Hud';
import { Fx } from '../game/fx';

// The combat loop: spawns monsters, moves the hero, resolves attacks,
// handles kills/level-ups/death. Entity state lives in Player/Monster,
// visuals in Hud/Fx.

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private monsters: Monster[] = [];
  private hud!: Hud;
  private fx!: Fx;
  private speedMul = 1;
  private spawnT = 0;
  private clouds: Array<{ img: Phaser.GameObjects.Image; v: number }> = [];

  constructor() {
    super('game');
  }

  create(): void {
    this.add.image(WORLD.w / 2, WORLD.h / 2, 'sky');
    this.drawDecor();
    for (let i = 0; i < 5; i++) {
      const img = this.add
        .image(Phaser.Math.Between(0, WORLD.w), Phaser.Math.Between(80, 300), 'cloud')
        .setAlpha(0.9)
        .setDepth(1);
      this.clouds.push({ img, v: Phaser.Math.Between(12, 32) });
    }

    this.fx = new Fx(this);
    this.player = new Player(this, WORLD.w / 2);
    this.hud = new Hud(this);
    this.hud.onSpeedChange = () => {
      this.speedMul = this.speedMul === 1 ? 2 : this.speedMul === 2 ? 4 : 1;
      this.hud.setSpeedLabel(`${this.speedMul}x`);
    };

    for (let i = 0; i < BALANCE.maxMonsters; i++) this.spawnMonster();
    this.hud.feed('Welcome to Idle Adventure. Slay away.');
  }

  private drawDecor(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x9ed69a, 1);
    g.fillEllipse(400, WORLD.groundY + 60, 1680, 480);
    g.fillStyle(0x8acb88, 1);
    g.fillEllipse(1520, WORLD.groundY + 80, 1840, 520);
    g.fillStyle(0x7ec850, 1);
    g.fillRect(0, WORLD.groundY, WORLD.w, WORLD.h - WORLD.groundY);
    g.fillStyle(0x6ab04c, 1);
    g.fillRect(0, WORLD.groundY, WORLD.w, 20);
    for (const tx of [240, 840, 1400, 1780]) {
      this.add.image(tx, WORLD.groundY + 8, 'tree').setOrigin(0.5, 1).setDepth(1);
    }
  }

  private spawnMonster(): void {
    const pool = MONSTER_TYPES.filter((t) => t.minLevel <= this.player.level);
    const def = pool[(Math.random() * pool.length) | 0];
    let x = 100 + Math.random() * (WORLD.w - 200);
    if (Math.abs(x - this.player.x) < 480) x = WORLD.w - x;
    this.monsters.push(
      new Monster(this, def, Phaser.Math.Clamp(x, 80, WORLD.w - 80), this.player.level),
    );
  }

  private nearestMonster(): Monster | null {
    let best: Monster | null = null;
    let bd = Infinity;
    for (const m of this.monsters) {
      if (m.dead) continue;
      const d = Math.abs(m.x - this.player.x);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    return best;
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05) * this.speedMul;
    const p = this.player;

    for (const c of this.clouds) {
      c.img.x += c.v * dt;
      if (c.img.x > WORLD.w + 240) c.img.x = -240;
    }

    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.monsters.filter((m) => !m.dead).length < BALANCE.maxMonsters) {
      this.spawnMonster();
      this.spawnT = BALANCE.spawnInterval;
    }

    if (p.deadT > 0) {
      p.deadT -= dt;
      if (p.deadT <= 0) {
        p.respawn(WORLD.w / 2);
        this.hud.feed('Back on your feet.');
      }
    } else {
      this.updatePlayer(dt);
    }
    this.updateMonsters(dt);

    for (const m of this.monsters.filter((m) => m.dead && m.deadT <= 0)) m.destroy();
    this.monsters = this.monsters.filter((m) => !(m.dead && m.deadT <= 0));

    p.updateVisual(dt, _time / 1000);
    this.fx.update(dt);
    this.hud.update(p);
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    p.attackT -= dt;
    p.skillT -= dt;
    p.mp = Math.min(p.maxMp, p.mp + BALANCE.mpRegen * dt);

    const target = this.nearestMonster();
    p.moving = false;
    if (target) {
      const dx = target.x - p.x;
      p.dir = dx >= 0 ? 1 : -1;
      if (Math.abs(dx) > BALANCE.attackRange) {
        p.x += p.dir * BALANCE.moveSpeed * dt;
        p.moving = true;
      } else if (p.attackT <= 0) {
        p.attackT = BALANCE.attackCooldown;
        const useSkill = p.skillT <= 0 && p.mp >= BALANCE.skillMpCost;
        if (useSkill) {
          p.skillT = BALANCE.skillCooldown;
          p.mp -= BALANCE.skillMpCost;
        }
        p.playSwing(useSkill);
        this.strikeMonster(target, useSkill);
      }
    } else {
      // No targets: idle wander.
      p.idleT -= dt;
      if (p.idleT <= 0) {
        p.idleT = 1.5 + Math.random() * 2.5;
        p.idleDir = Math.random() < 0.5 ? -1 : 1;
      }
      p.x = Phaser.Math.Clamp(p.x + p.idleDir * BALANCE.moveSpeed * 0.35 * dt, 80, WORLD.w - 80);
      p.dir = p.idleDir;
      p.moving = true;
    }
    if (p.moving) p.walkPhase += dt * 11;

    const inCombat = this.monsters.some((m) => !m.dead && Math.abs(m.x - p.x) < 460);
    if (!inCombat) p.hp = Math.min(p.maxHp, p.hp + BALANCE.hpRegenOutOfCombat * dt);
  }

  private strikeMonster(m: Monster, skill: boolean): void {
    const p = this.player;
    const crit = Math.random() < BALANCE.critChance;
    const dmg = Math.max(
      1,
      Math.round(
        p.atk *
          (skill ? BALANCE.skillMult : 1) *
          (0.9 + Math.random() * 0.22) *
          (crit ? BALANCE.critMult : 1),
      ),
    );
    const died = m.takeDamage(dmg);
    this.fx.damageNumber(m.x, WORLD.groundY - 180, (skill ? 'POW ' : '') + dmg, { crit });
    this.fx.burst(
      m.x,
      WORLD.groundY - 110,
      skill ? 16 : 7,
      skill ? [0xffb347, 0xff6b35, 0xffffff] : [0xffffff, 0xffe066],
      skill ? 440 : 280,
    );
    if (skill) this.fx.shake(150, 0.006);
    if (died) this.killMonster(m);
  }

  private killMonster(m: Monster): void {
    const p = this.player;
    m.die();
    p.kills++;
    p.gold += m.gold;
    this.fx.burst(m.x, WORLD.groundY - 110, 18, [0xcfd8dc, 0x90a4ae, 0xffffff], 340);
    this.fx.damageNumber(m.x, WORLD.groundY - 240, `+${m.gold}g`, {});
    this.hud.feed(`${m.def.name} slain  +${m.exp} EXP`);
    if (p.gainExp(m.exp) > 0) {
      p.fullHeal();
      this.hud.banner('LEVEL UP!');
      this.fx.burst(p.x, WORLD.groundY - 140, 40, [0xffe066, 0xfff3b0, 0xf0a500], 520);
      this.hud.feed(`Level ${p.level} reached! Stats up, fully healed.`);
    }
  }

  private updateMonsters(dt: number): void {
    const p = this.player;
    for (const m of this.monsters) {
      if (m.dead) {
        m.deadT -= dt;
        continue;
      }
      const dx = p.x - m.x;
      const adx = Math.abs(dx);
      if (p.deadT <= 0 && adx < 300) {
        m.dir = dx >= 0 ? 1 : -1;
        if (adx > 104) {
          m.x += m.dir * 84 * dt;
        } else {
          m.attackT -= dt;
          if (m.attackT <= 0) {
            m.attackT = 1.35;
            this.monsterStrike(m);
          }
        }
      } else {
        m.wanderT -= dt;
        if (m.wanderT <= 0) {
          m.wanderT = 1 + Math.random() * 2;
          m.dir = Math.random() < 0.5 ? -1 : 1;
        }
        m.x = Phaser.Math.Clamp(m.x + m.dir * 52 * dt, 80, WORLD.w - 80);
      }
      m.updateVisual(dt);
    }
  }

  private monsterStrike(m: Monster): void {
    const p = this.player;
    const dmg = Math.max(1, m.atk - Math.floor(p.level / 2));
    const died = p.takeDamage(dmg);
    this.fx.damageNumber(p.x, WORLD.groundY - 260, `-${dmg}`, { hurt: true });
    this.fx.burst(p.x, WORLD.groundY - 140, 6, [0xff6b6b, 0xffffff], 240);
    this.fx.shake(120, 0.004);
    if (died) {
      p.deadT = BALANCE.respawnDelay;
      this.fx.burst(p.x, WORLD.groundY - 120, 30, [0x90a4ae, 0x546e7a], 400);
      this.hud.feed('You died! Respawning...');
    }
  }
}
