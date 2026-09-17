import Phaser from 'phaser';

// Generates every texture procedurally at boot: hero, sword, monsters,
// trees, clouds, sky, shadow, particle dot. No external art assets.

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    this.makeSky();
    this.makeHero();
    this.makeSword();
    this.makeSlime('slime', 0x66bb6a, 0x43a047, 56, 52);
    this.makeSlime('dslime', 0xab47bc, 0x8e24aa, 64, 60);
    this.makeMushroom('mush', 0xfb8c00);
    this.makeMushroom('fmush', 0xe53935);
    this.makePig();
    this.makeTree();
    this.makeCloud();
    this.tex('shadow', 56, 14, (g) => {
      g.fillStyle(0x000000, 0.22);
      g.fillEllipse(28, 7, 52, 12);
    });
    this.tex('dot', 8, 8, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
    });
    this.scene.start('game');
  }

  private tex(
    key: string,
    w: number,
    h: number,
    draw: (g: Phaser.GameObjects.Graphics) => void,
  ): void {
    const g = new Phaser.GameObjects.Graphics(this);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeSky(): void {
    const tex = this.textures.createCanvas('sky', 960, 540);
    if (!tex) return;
    const c = tex.getContext();
    const grad = c.createLinearGradient(0, 0, 0, 540);
    grad.addColorStop(0, '#5aa9e6');
    grad.addColorStop(0.7, '#bfe3ff');
    grad.addColorStop(1, '#e8f7ff');
    c.fillStyle = grad;
    c.fillRect(0, 0, 960, 540);
    c.fillStyle = '#fff8d6';
    c.beginPath();
    c.arc(830, 90, 42, 0, Math.PI * 2);
    c.fill();
    tex.refresh();
  }

  private makeHero(): void {
    this.tex('hero', 56, 100, (g) => {
      // Legs
      g.fillStyle(0x2c3e50, 1);
      g.fillRect(17, 72, 10, 28);
      g.fillRect(29, 72, 10, 28);
      // Armor
      g.fillStyle(0x3a7bd5, 1);
      g.fillRoundedRect(11, 36, 34, 40, 9);
      g.fillStyle(0x2c5fa8, 1);
      g.fillRect(11, 60, 34, 8);
      g.fillStyle(0xffd76a, 1);
      g.fillRect(24, 60, 8, 8);
      // Arm
      g.fillStyle(0x3a7bd5, 1);
      g.fillRoundedRect(40, 42, 10, 24, 5);
      // Head
      g.fillStyle(0xffcf9e, 1);
      g.fillCircle(28, 21, 15);
      // Helmet + plume
      g.fillStyle(0x546e7a, 1);
      g.slice(28, 20, 16, Math.PI, Math.PI * 2, false);
      g.fillRect(11, 17, 34, 5);
      g.fillStyle(0xff5252, 1);
      g.fillRect(25, 0, 6, 10);
      // Eye
      g.fillStyle(0x222222, 1);
      g.fillCircle(35, 21, 2.5);
    });
  }

  private makeSword(): void {
    this.tex('sword', 16, 64, (g) => {
      g.fillStyle(0x8a6d3b, 1);
      g.fillRect(5, 50, 6, 14);
      g.fillStyle(0x5d4a26, 1);
      g.fillRect(1, 46, 14, 6);
      g.fillStyle(0xdfe6ee, 1);
      g.fillRect(4, 6, 8, 40);
      g.fillStyle(0xffffff, 1);
      g.fillRect(4, 6, 3, 40);
      g.fillTriangle(4, 6, 12, 6, 8, 0);
    });
  }

  private makeSlime(key: string, body: number, shade: number, w: number, h: number): void {
    this.tex(key, w, h, (g) => {
      g.fillStyle(body, 1);
      g.fillEllipse(w / 2, h - 20, w - 4, h - 14);
      g.fillStyle(shade, 1);
      g.fillEllipse(w / 2 - 14, h - 28, 14, 16);
      // Eyes
      g.fillStyle(0x222222, 1);
      g.fillCircle(w / 2 - 7, h - 32, 4);
      g.fillCircle(w / 2 + 7, h - 32, 4);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(w / 2 - 5.5, h - 33.5, 1.5);
      g.fillCircle(w / 2 + 8.5, h - 33.5, 1.5);
    });
  }

  private makeMushroom(key: string, cap: number): void {
    this.tex(key, 60, 68, (g) => {
      // Stem
      g.fillStyle(0xfff3e0, 1);
      g.fillRoundedRect(20, 34, 20, 32, 8);
      // Cap
      g.fillStyle(cap, 1);
      g.slice(30, 36, 28, Math.PI, Math.PI * 2, false);
      // Spots
      g.fillStyle(0xffffff, 1);
      g.fillCircle(18, 22, 5);
      g.fillCircle(34, 13, 6);
      g.fillCircle(45, 26, 4);
      // Face
      g.fillStyle(0x222222, 1);
      g.fillCircle(24, 48, 3);
      g.fillCircle(37, 48, 3);
      g.lineStyle(2, 0x222222, 1);
      g.beginPath();
      g.arc(30, 52, 6, 0.4, Math.PI - 0.4);
      g.strokePath();
    });
  }

  private makePig(): void {
    this.tex('pig', 72, 60, (g) => {
      // Legs
      g.fillStyle(0xf48fb1, 1);
      g.fillRect(16, 48, 8, 12);
      g.fillRect(48, 48, 8, 12);
      // Body
      g.fillStyle(0xf8bbd0, 1);
      g.fillEllipse(36, 34, 64, 42);
      // Ears
      g.fillStyle(0xf48fb1, 1);
      g.fillTriangle(14, 14, 8, 0, 24, 8);
      g.fillTriangle(32, 10, 34, 0, 42, 12);
      // Snout
      g.fillEllipse(52, 34, 22, 16);
      g.fillStyle(0xc2185b, 1);
      g.fillCircle(48, 34, 2.5);
      g.fillCircle(56, 34, 2.5);
      // Eye
      g.fillStyle(0x222222, 1);
      g.fillCircle(28, 26, 3.5);
    });
  }

  private makeTree(): void {
    this.tex('tree', 90, 130, (g) => {
      g.fillStyle(0x7a5230, 1);
      g.fillRect(40, 70, 10, 60);
      g.fillStyle(0x3e9e4f, 1);
      g.fillCircle(45, 48, 38);
      g.fillStyle(0x4fb862, 1);
      g.fillCircle(32, 36, 20);
    });
  }

  private makeCloud(): void {
    this.tex('cloud', 140, 70, (g) => {
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(40, 46, 24);
      g.fillCircle(72, 36, 30);
      g.fillCircle(106, 46, 24);
    });
  }
}
