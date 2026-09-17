import Phaser from 'phaser';

// Loads real sprite assets and defines animations.
// Hero: Spelunker (Spelunky Classic). Monsters/tiles: MapleStory.
// Vine: Super Mario RPG beanstalk.

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    // Hero (20x24 cells, attack uses 32x24 cells)
    this.load.spritesheet('hero_idle', 'sprites/hero_idle.png', { frameWidth: 20, frameHeight: 24 });
    this.load.spritesheet('hero_walk', 'sprites/hero_walk.png', { frameWidth: 20, frameHeight: 24 });
    this.load.spritesheet('hero_jump', 'sprites/hero_jump.png', { frameWidth: 20, frameHeight: 24 });
    this.load.spritesheet('hero_climb', 'sprites/hero_climb.png', { frameWidth: 20, frameHeight: 24 });
    this.load.spritesheet('hero_attack', 'sprites/hero_attack.png', { frameWidth: 32, frameHeight: 24 });
    // Monsters
    this.load.spritesheet('slime', 'sprites/slime.png', { frameWidth: 56, frameHeight: 56 });
    this.load.spritesheet('mushroom', 'sprites/mushroom.png', { frameWidth: 81, frameHeight: 70 });
    this.load.spritesheet('pig', 'sprites/pig.png', { frameWidth: 109, frameHeight: 63 });
    // Tiles / props
    this.load.image('tile_grass', 'sprites/tile_grass.png');
    this.load.image('vine', 'sprites/vine.png');
  }

  create(): void {
    // Crisp pixels for the pixel-art hero.
    for (const key of ['hero_idle', 'hero_walk', 'hero_jump', 'hero_climb', 'hero_attack']) {
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    this.anims.create({ key: 'hero_walk', frames: this.anims.generateFrameNumbers('hero_walk', { start: 0, end: 4 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'hero_jump', frames: this.anims.generateFrameNumbers('hero_jump', { start: 0, end: 2 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'hero_climb', frames: this.anims.generateFrameNumbers('hero_climb', { start: 0, end: 6 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'hero_attack', frames: this.anims.generateFrameNumbers('hero_attack', { start: 0, end: 3 }), frameRate: 14, repeat: 0 });

    this.anims.create({ key: 'slime', frames: this.anims.generateFrameNumbers('slime', { start: 0, end: 2 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'mushroom', frames: this.anims.generateFrameNumbers('mushroom', { start: 0, end: 2 }), frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'pig', frames: this.anims.generateFrameNumbers('pig', { start: 0, end: 2 }), frameRate: 6, repeat: -1 });

    // Small helpers still procedural.
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
}
