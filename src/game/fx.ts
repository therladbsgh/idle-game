import Phaser from 'phaser';

// Floating damage numbers, particles, screen shake.
// All transient FX route through here so the scenes stay readable.

interface Particle {
  img: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

export class Fx {
  private particles: Particle[] = [];

  constructor(private scene: Phaser.Scene) {}

  damageNumber(
    x: number,
    y: number,
    text: string | number,
    opts: { crit?: boolean; hurt?: boolean } = {},
  ): void {
    const t = this.scene.add
      .text(x + Phaser.Math.Between(-16, 16), y, String(text), {
        fontFamily: '"Trebuchet MS", Verdana, sans-serif',
        fontSize: opts.crit ? '60px' : '44px',
        color: opts.hurt ? '#ff5252' : opts.crit ? '#ffd600' : '#ffffff',
        fontStyle: opts.crit ? '900' : 'bold',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.scene.tweens.add({
      targets: t,
      y: y - 120,
      alpha: 0,
      duration: 850,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  burst(x: number, y: number, count: number, colors: number[], speed: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      const img = this.scene.add
        .image(x, y, 'dot')
        .setTint(colors[(Math.random() * colors.length) | 0])
        .setDisplaySize(6 + Math.random() * 8, 6 + Math.random() * 8)
        .setDepth(40);
      this.particles.push({
        img,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 120,
        life: 0.4 + Math.random() * 0.5,
        max: 0.9,
      });
    }
  }

  shake(duration = 150, intensity = 0.005): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  update(dt: number): void {
    for (const p of this.particles) {
      p.life -= dt;
      p.img.x += p.vx * dt;
      p.img.y += p.vy * dt;
      p.vy += 840 * dt;
      p.img.setAlpha(Math.max(0, p.life / p.max));
    }
    for (const p of this.particles.filter((p) => p.life <= 0)) p.img.destroy();
    this.particles = this.particles.filter((p) => p.life > 0);
  }
}
