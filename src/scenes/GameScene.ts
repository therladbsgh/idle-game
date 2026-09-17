import Phaser from 'phaser';
import { BALANCE, HILLS, MONSTER_TYPES, PHYSICS, PLATFORMS, VINES, WORLD } from '../game/config';
import { Player } from '../game/Player';
import { Monster } from '../game/Monster';
import { snapToSlope } from '../game/slopes';
import { Hud } from '../ui/Hud';
import { Fx } from '../game/fx';

// The combat loop on a scrolling platformer level: spawns monsters,
// drives the hero's autonomous platforming AI, resolves attacks,
// handles kills/level-ups/death. Entity state lives in Player/Monster,
// visuals in Hud/Fx.

interface VineDef {
  x: number;
  yTop: number;
  yBottom: number;
  from: number;
  to: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private monsters: Monster[] = [];
  private hud!: Hud;
  private fx!: Fx;
  private speedMul = 1;
  private spawnT = 0;
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup;
  private skyGfx!: Phaser.GameObjects.Graphics;
  private clouds: Array<{ gfx: Phaser.GameObjects.Graphics; v: number }> = [];

  constructor() {
    super('game');
  }

  create(): void {
    this.drawSky();
    this.createPlatforms();
    this.createHills();
    this.createVines();
    this.createClouds();

    this.fx = new Fx(this);
    this.player = new Player(this, WORLD.w / 2, WORLD.groundY - 80);

    // Player collides with platforms, except while climbing a vine.
    this.physics.add.collider(
      this.player.sprite,
      this.platformGroup,
      undefined,
      () => !this.player.climbing,
      this,
    );

    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD.w, WORLD.h);
    cam.startFollow(this.player.sprite, true, 0.1, 0.1);

    this.hud = new Hud(this);
    this.hud.onSpeedChange = () => {
      this.speedMul = this.speedMul === 1 ? 2 : this.speedMul === 2 ? 4 : 1;
      this.hud.setSpeedLabel(`${this.speedMul}x`);
    };

    for (let i = 0; i < BALANCE.maxMonsters; i++) this.spawnMonster();
    this.hud.feed('Welcome to Idle Adventure. Slay away.');

    this.scale.on('resize', this.onResize, this);
  }

  private onResize(): void {
    this.drawSky();
    this.hud.layout();
  }

  private drawSky(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    if (this.skyGfx) this.skyGfx.destroy();
    this.skyGfx = this.add.graphics().setScrollFactor(0).setDepth(-10);
    this.skyGfx.fillGradientStyle(0x4a90d9, 0x4a90d9, 0xcfe8ff, 0xcfe8ff, 1);
    this.skyGfx.fillRect(0, 0, w, h);
    this.skyGfx.fillStyle(0xfff6c9, 1);
    this.skyGfx.fillCircle(w - 150, 130, 54);
    this.skyGfx.fillStyle(0xffffff, 0.5);
    this.skyGfx.fillCircle(w - 150, 130, 70);
  }

  private createClouds(): void {
    for (let i = 0; i < 6; i++) {
      const g = this.add.graphics().setDepth(1);
      const x = Phaser.Math.Between(0, WORLD.w);
      const y = Phaser.Math.Between(90, 320);
      g.fillStyle(0xffffff, 0.85);
      g.fillEllipse(0, 0, 180, 60);
      g.fillEllipse(-60, 10, 100, 44);
      g.fillEllipse(60, 10, 110, 48);
      g.setPosition(x, y);
      this.clouds.push({ gfx: g, v: Phaser.Math.Between(10, 28) });
    }
    // Rolling hills behind the ground.
    const hills = this.add.graphics().setDepth(0);
    hills.fillStyle(0x8fd18a, 1);
    hills.fillEllipse(500, WORLD.groundY + 90, 1400, 420);
    hills.fillStyle(0x7ecb78, 1);
    hills.fillEllipse(2100, WORLD.groundY + 110, 1700, 480);
  }

  private createPlatforms(): void {
    this.platformGroup = this.physics.add.staticGroup();

    // Ground: seamless 90px grass tile strip + dirt behind it (not below;
    // the tile is fully opaque, so the dirt rect starts at groundY).
    const ground = this.add.tileSprite(WORLD.w / 2, WORLD.groundY + 18, WORLD.w, 36, 'tile_grass');
    ground.setDepth(2);
    this.platformGroup.add(ground);
    this.add
      .rectangle(WORLD.w / 2, WORLD.groundY + 70, WORLD.w, 140, 0x8a5a3b)
      .setDepth(1);

    // Floating platforms. Widths are multiples of the 90px tile (see config),
    // so the repeating texture never clips mid-tile.
    PLATFORMS.forEach((p) => {
      const t = this.add.tileSprite(p.x + p.w / 2, p.y + 18, p.w, 36, 'tile_grass');
      t.setDepth(2);
      this.platformGroup.add(t);
      this.add.rectangle(p.x + p.w / 2, p.y + 36 + 18, p.w, 36, 0x8a5a3b).setDepth(1);
    });

    this.platformGroup.refresh();
  }

  private createHills(): void {
    // Slope visuals; physics segments live in config SLOPES and must match.
    // Each hill: up-slope 90x135 at (hx,832), flat top 90x100 at (hx+90,834),
    // down-slope 90x135 at (hx+180,833). Surface: (hx,900)->(hx+89,834)->
    // (hx+180,834)->(hx+269,903).
    for (const hx of HILLS) {
      this.add.image(hx, 832, 'slope_up').setOrigin(0, 0).setDepth(2);
      this.add.image(hx + 90, 834, 'hill_top').setOrigin(0, 0).setDepth(2);
      this.add.image(hx + 180, 833, 'slope_down').setOrigin(0, 0).setDepth(2);
    }
  }

  private createVines(): void {
    for (const v of VINES) {
      const h = v.yBottom - v.yTop;
      this.add.tileSprite(v.x, v.yTop + h / 2, 26, h, 'vine').setDepth(4);
    }
  }

  private spawnMonster(): void {
    const pool = MONSTER_TYPES.filter((t) => t.minLevel <= this.player.level);
    const def = pool[(Math.random() * pool.length) | 0];

    const platIdx = Math.random() < 0.45 ? -1 : (Math.random() * PLATFORMS.length) | 0;
    let minX: number;
    let maxX: number;
    let surfaceY: number;
    if (platIdx === -1) {
      minX = 120;
      maxX = WORLD.w - 120;
      surfaceY = WORLD.groundY;
    } else {
      const pl = PLATFORMS[platIdx];
      minX = pl.x + 50;
      maxX = pl.x + pl.w - 50;
      surfaceY = pl.y;
    }
    let x = minX + Math.random() * (maxX - minX);
    if (platIdx === this.player.platform && Math.abs(x - this.player.x) < 220) {
      x = minX + maxX - x;
    }
    x = Phaser.Math.Clamp(x, minX, maxX);

    const m = new Monster(this, def, x, surfaceY - 70, this.player.level, platIdx, minX, maxX);
    this.monsters.push(m);
    this.physics.add.collider(m.sprite, this.platformGroup);
  }

  private nearestMonster(): Monster | null {
    let best: Monster | null = null;
    let bd = Infinity;
    for (const m of this.monsters) {
      if (m.dead) continue;
      const d = Phaser.Math.Distance.Between(m.x, m.y, this.player.x, this.player.y);
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
      c.gfx.x += c.v * dt;
      if (c.gfx.x > WORLD.w + 200) c.gfx.x = -200;
    }

    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.monsters.filter((m) => !m.dead).length < BALANCE.maxMonsters) {
      this.spawnMonster();
      this.spawnT = BALANCE.spawnInterval;
    }

    if (p.deadT > 0) {
      p.deadT -= dt;
      const body = p.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      if (p.deadT <= 0) {
        p.respawn(WORLD.w / 2, WORLD.groundY - 80);
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

  // ---- Hero AI ----

  private updatePlayer(dt: number): void {
    const p = this.player;
    const body = p.sprite.body as Phaser.Physics.Arcade.Body;
    p.attackT -= dt;
    p.skillT -= dt;
    p.mp = Math.min(p.maxMp, p.mp + BALANCE.mpRegen * dt);

    p.airborne = !(body.touching.down || body.blocked.down) && !p.climbing;
    // Manual slope support: snap feet onto hill surfaces before the grounded
    // checks below (Arcade Physics has no slope collision of its own).
    const onSlope = !p.climbing && p.deadT <= 0 && snapToSlope(p.sprite, p.feetOffset);
    if (onSlope) p.airborne = false;
    if (!p.airborne && !p.climbing) this.updatePlayerPlatform();

    const target = this.nearestMonster();
    p.moving = false;

    if (p.climbing) {
      this.updateClimb();
    } else if (p.airborne) {
      // Mid-air: ride the arc, don't fight physics.
      p.moving = Math.abs(body.velocity.x) > 20;
    } else if (target) {
      this.seekTarget(dt, target);
    } else {
      this.wander(dt);
    }

    p.sprite.x = Phaser.Math.Clamp(p.sprite.x, 30, WORLD.w - 30);

    const inCombat = this.monsters.some(
      (m) => !m.dead && Math.abs(m.x - p.x) < 460 && Math.abs(m.y - p.y) < 220,
    );
    if (!inCombat) p.hp = Math.min(p.maxHp, p.hp + BALANCE.hpRegenOutOfCombat * dt);
  }

  private updatePlayerPlatform(): void {
    const p = this.player;
    const feetY = p.y + p.feetOffset;
    p.platform = -1;
    for (let i = 0; i < PLATFORMS.length; i++) {
      const pl = PLATFORMS[i];
      if (p.x >= pl.x - 10 && p.x <= pl.x + pl.w + 10 && Math.abs(feetY - pl.y) < 26) {
        p.platform = i;
        break;
      }
    }
  }

  private seekTarget(dt: number, target: Monster): void {
    const p = this.player;
    const body = p.sprite.body as Phaser.Physics.Arcade.Body;
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    p.dir = dx >= 0 ? 1 : -1;

    if (Math.abs(dx) <= BALANCE.attackRange && Math.abs(dy) < 100) {
      body.setVelocityX(0);
      if (p.attackT <= 0) {
        p.attackT = BALANCE.attackCooldown;
        const useSkill = p.skillT <= 0 && p.mp >= BALANCE.skillMpCost;
        if (useSkill) {
          p.skillT = BALANCE.skillCooldown;
          p.mp -= BALANCE.skillMpCost;
        }
        p.startAttackAnim(useSkill);
        this.strikeMonster(target, useSkill);
      }
      return;
    }

    if (target.platform !== p.platform) {
      if (target.y < p.y - 60) {
        // Target above: take a vine up. From the ground, pick the vine
        // that actually leads to the target's platform.
        let vine = VINES.find((v) => v.from === p.platform && v.to === target.platform);
        if (!vine && p.platform === -1) {
          vine = VINES.find((v) => v.to === target.platform);
        }
        if (vine) {
          this.goToVine(vine, 'up');
        } else if (p.platform !== -1) {
          this.dropToGround();
        } else {
          this.walkToward(target.x, false);
        }
      } else {
        // Target below: walk toward it and fall/descend.
        this.walkToward(target.x, false);
      }
    } else {
      // Same surface: walk straight at it, staying on the platform.
      this.walkToward(target.x, p.platform !== -1);
    }
  }

  private walkToward(x: number, clampToPlatform: boolean): void {
    const p = this.player;
    const body = p.sprite.body as Phaser.Physics.Arcade.Body;
    const dx = x - p.x;
    if (Math.abs(dx) < 10) {
      body.setVelocityX(0);
      return;
    }
    p.dir = dx >= 0 ? 1 : -1;
    let vx = p.dir * BALANCE.moveSpeed;

    if (clampToPlatform && p.platform >= 0) {
      const pl = PLATFORMS[p.platform];
      const lo = pl.x + 46;
      const hi = pl.x + pl.w - 46;
      const nx = p.x + vx * 0.016;
      if ((nx < lo && p.dir < 0) || (nx > hi && p.dir > 0)) vx = 0;
    }

    // Hop over walls / ledges in the way.
    const blocked =
      body.blocked.left || body.blocked.right || body.touching.left || body.touching.right;
    if (vx !== 0 && blocked && (body.blocked.down || body.touching.down)) {
      body.setVelocityY(-PHYSICS.jumpVelocity);
    }

    body.setVelocityX(vx);
    p.moving = vx !== 0;
  }

  private goToVine(vine: VineDef, dir: 'up' | 'down'): void {
    const p = this.player;
    const body = p.sprite.body as Phaser.Physics.Arcade.Body;
    if (Math.abs(vine.x - p.x) > 26) {
      this.walkToward(vine.x, p.platform !== -1);
      return;
    }
    // Grab the vine.
    p.climbing = true;
    p.climbVine = vine;
    p.climbDir = dir;
    p.sprite.x = vine.x;
    body.setAllowGravity(false);
    body.setVelocity(0, dir === 'up' ? -PHYSICS.climbSpeed : PHYSICS.climbSpeed);
    p.moving = true;
  }

  private updateClimb(): void {
    const p = this.player;
    const body = p.sprite.body as Phaser.Physics.Arcade.Body;
    const vine = p.climbVine;
    if (!vine) {
      p.climbing = false;
      body.setAllowGravity(true);
      return;
    }
    p.sprite.x = vine.x;
    body.setVelocityX(0);
    p.moving = true;

    if (p.climbDir === 'up') {
      body.setVelocityY(-PHYSICS.climbSpeed);
      if (p.y <= vine.yTop + 44) {
        // Step onto the platform.
        p.climbing = false;
        p.climbVine = null;
        body.setAllowGravity(true);
        p.sprite.y = vine.yTop - p.feetOffset;
        body.setVelocity(0, 0);
        p.platform = vine.to;
      }
    } else {
      body.setVelocityY(PHYSICS.climbSpeed);
      if (p.y >= vine.yBottom - 40) {
        p.climbing = false;
        p.climbVine = null;
        body.setAllowGravity(true);
        body.setVelocity(0, 0);
      }
    }
  }

  private dropToGround(): void {
    const p = this.player;
    if (p.platform < 0) return;
    const pl = PLATFORMS[p.platform];
    const targetX = p.x - pl.x < pl.x + pl.w - p.x ? pl.x - 70 : pl.x + pl.w + 70;
    this.walkToward(targetX, false);
  }

  private wander(dt: number): void {
    const p = this.player;
    p.idleT -= dt;
    if (p.idleT <= 0) {
      p.idleT = 1.5 + Math.random() * 2.5;
      p.idleDir = Math.random() < 0.5 ? -1 : 1;
    }
    if (p.platform >= 0) {
      const pl = PLATFORMS[p.platform];
      if (p.x <= pl.x + 60) p.idleDir = 1;
      if (p.x >= pl.x + pl.w - 60) p.idleDir = -1;
      this.walkToward(p.x + p.idleDir * 120, true);
    } else {
      this.walkToward(Phaser.Math.Clamp(p.x + p.idleDir * 120, 80, WORLD.w - 80), false);
    }
  }

  // ---- Combat (values preserved) ----

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
    this.fx.damageNumber(m.x, m.y - 110, (skill ? 'POW ' : '') + dmg, { crit });
    this.fx.burst(
      m.x,
      m.y - 40,
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
    this.fx.burst(m.x, m.y - 40, 18, [0xcfd8dc, 0x90a4ae, 0xffffff], 340);
    this.fx.damageNumber(m.x, m.y - 150, `+${m.gold}g`, {});
    this.hud.feed(`${m.def.name} slain  +${m.exp} EXP`);
    if (p.gainExp(m.exp) > 0) {
      p.fullHeal();
      this.hud.banner('LEVEL UP!');
      this.fx.burst(p.x, p.y - 70, 40, [0xffe066, 0xfff3b0, 0xf0a500], 520);
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
      // Hills have no physics body; snap feet onto slope surfaces instead.
      const mBody = m.sprite.body as Phaser.Physics.Arcade.Body;
      const mOnSlope = snapToSlope(m.sprite, mBody.bottom - m.sprite.y);
      m.updateAI(dt, p.x, p.y, p.deadT > 0, mOnSlope);

      const adx = Math.abs(p.x - m.x);
      const ady = Math.abs(p.y - m.y);
      if (p.deadT <= 0 && adx < 110 && ady < 100) {
        m.attackT -= dt;
        if (m.attackT <= 0) {
          m.attackT = 1.35;
          this.monsterStrike(m);
        }
      }
      m.updateVisual(dt);
    }
  }

  private monsterStrike(m: Monster): void {
    const p = this.player;
    const dmg = Math.max(1, m.atk - Math.floor(p.level / 2));
    const died = p.takeDamage(dmg);
    this.fx.damageNumber(p.x, p.y - 150, `-${dmg}`, { hurt: true });
    this.fx.burst(p.x, p.y - 60, 6, [0xff6b6b, 0xffffff], 240);
    this.fx.shake(120, 0.004);
    if (died) {
      p.deadT = BALANCE.respawnDelay;
      const body = p.sprite.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(true);
      p.climbing = false;
      this.fx.burst(p.x, p.y - 50, 30, [0x90a4ae, 0x546e7a], 400);
      this.hud.feed('You died! Respawning...');
    }
  }
}
