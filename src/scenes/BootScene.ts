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
    this.makeSlime('slime', 0x66bb6a, 0x43a047, 112, 104);
    this.makeSlime('dslime', 0xab47bc, 0x8e24aa, 128, 120);
    this.makeMushroom('mush', 0xfb8c00);
    this.makeMushroom('fmush', 0xe53935);
    this.makePig();
    this.makeTree();
    this.makeCloud();
    this.tex('shadow', 112, 28, (g) => {
      g.fillStyle(0x000000, 0.22);
      g.fillEllipse(56, 14, 104, 24);
    });
    this.tex('dot', 16, 16, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 8);
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
    const tex = this.textures.createCanvas('sky', 1920, 1080);
    if (!tex) return;
    const c = tex.getContext();
    const grad = c.createLinearGradient(0, 0, 0, 1080);
    grad.addColorStop(0, '#5aa9e6');
    grad.addColorStop(0.7, '#bfe3ff');
    grad.addColorStop(1, '#e8f7ff');
    c.fillStyle = grad;
    c.fillRect(0, 0, 1920, 1080);
    c.fillStyle = '#fff8d6';
    c.beginPath();
    c.arc(1660, 180, 84, 0, Math.PI * 2);
    c.fill();
    tex.refresh();
  }

  private makeHero(): void {
    this.tex('hero', 112, 200, (g) => {
      // Legs
      g.fillStyle(0x2c3e50, 1);
      g.fillRect(34, 144, 20, 56);
      g.fillRect(58, 144, 20, 56);
      // Armor
      g.fillStyle(0x3a7bd5, 1);
      g.fillRoundedRect(22, 72, 68, 80, 18);
      g.fillStyle(0x2c5fa8, 1);
      g.fillRect(22, 120, 68, 16);
      g.fillStyle(0xffd76a, 1);
      g.fillRect(48, 120, 16, 16);
      // Arm
      g.fillStyle(0x3a7bd5, 1);
      g.fillRoundedRect(80, 84, 20, 48, 10);
      // Head
      g.fillStyle(0xffcf9e, 1);
      g.fillCircle(56, 42, 30);
      // Helmet + plume
      g.fillStyle(0x546e7a, 1);
      g.slice(56, 40, 32, Math.PI, Math.PI * 2, false);
      g.fillRect(22, 34, 68, 10);
      g.fillStyle(0xff5252, 1);
      g.fillRect(50, 0, 12, 20);
      // Eye
      g.fillStyle(0x222222, 1);
      g.fillCircle(70, 42, 5);
    });
  }

  private makeSword(): void {
    this.tex('sword', 32, 128, (g) => {
      g.fillStyle(0x8a6d3b, 1);
      g.fillRect(10, 100, 12, 28);
      g.fillStyle(0x5d4a26, 1);
      g.fillRect(2, 92, 28, 12);
      g.fillStyle(0xdfe6ee, 1);
      g.fillRect(8, 12, 16, 80);
      g.fillStyle(0xffffff, 1);
      g.fillRect(8, 12, 6, 80);
      g.fillTriangle(8, 12, 24, 12, 16, 0);
    });
  }

  private makeSlime(key: string, body: number, shade: number, w: number, h: number): void {
    this.tex(key, w, h, (g) => {
      g.fillStyle(body, 1);
      g.fillEllipse(w / 2, h - 40, w - 8, h - 28);
      g.fillStyle(shade, 1);
      g.fillEllipse(w / 2 - 28, h - 56, 28, 32);
      // Eyes
      g.fillStyle(0x222222, 1);
      g.fillCircle(w / 2 - 14, h - 64, 8);
      g.fillCircle(w / 2 + 14, h - 64, 8);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(w / 2 - 11, h - 67, 3);
      g.fillCircle(w / 2 + 17, h - 67, 3);
    });
  }

  private makeMushroom(key: string, cap: number): void {
    this.tex(key, 120, 136, (g) => {
      // Stem
      g.fillStyle(0xfff3e0, 1);
      g.fillRoundedRect(40, 68, 40, 64, 16);
      // Cap
      g.fillStyle(cap, 1);
      g.slice(60, 72, 56, Math.PI, Math.PI * 2, false);
      // Spots
      g.fillStyle(0xffffff, 1);
      g.fillCircle(36, 44, 10);
      g.fillCircle(68, 26, 12);
      g.fillCircle(90, 52, 8);
      // Face
      g.fillStyle(0x222222, 1);
      g.fillCircle(48, 96, 6);
      g.fillCircle(74, 96, 6);
      g.lineStyle(4, 0x222222, 1);
      g.beginPath();
      g.arc(60, 104, 12, 0.4, Math.PI - 0.4);
      g.strokePath();
    });
  }

  private makePig(): void {
    this.tex('pig', 144, 120, (g) => {
      // Legs
      g.fillStyle(0xf48fb1, 1);
      g.fillRect(32, 96, 16, 24);
      g.fillRect(96, 96, 16, 24);
      // Body
      g.fillStyle(0xf8bbd0, 1);
      g.fillEllipse(72, 68, 128, 84);
      // Ears
      g.fillStyle(0xf48fb1, 1);
      g.fillTriangle(28, 28, 16, 0, 48, 16);
      g.fillTriangle(64, 20, 68, 0, 84, 24);
      // Snout
      g.fillEllipse(104, 68, 44, 32);
      g.fillStyle(0xc2185b, 1);
      g.fillCircle(96, 68, 5);
      g.fillCircle(112, 68, 5);
      // Eye
      g.fillStyle(0x222222, 1);
      g.fillCircle(56, 52, 7);
    });
  }

  private makeTree(): void {
    this.tex('tree', 180, 260, (g) => {
      g.fillStyle(0x7a5230, 1);
      g.fillRect(80, 140, 20, 120);
      g.fillStyle(0x3e9e4f, 1);
      g.fillCircle(90, 96, 76);
      g.fillStyle(0x4fb862, 1);
      g.fillCircle(64, 72, 40);
    });
  }

  private makeCloud(): void {
    this.tex('cloud', 280, 140, (g) => {
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(80, 92, 48);
      g.fillCircle(144, 72, 60);
      g.fillCircle(212, 92, 48);
    });
  }
}
