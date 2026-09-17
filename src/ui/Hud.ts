import Phaser from 'phaser';
import { WORLD, ZONES, expForLevel } from '../game/config';
import type { Player } from '../game/Player';

// HUD: player plate (level badge, HP/MP/EXP bars), stats panel, zone label,
// kill feed, level-up banner, speed toggle. Redrawn every frame via Graphics.

const FONT = '"Trebuchet MS", Verdana, sans-serif';

export class Hud {
  onSpeedChange: (() => void) | null = null;

  private gfx: Phaser.GameObjects.Graphics;
  private lvText: Phaser.GameObjects.Text;
  private hpText: Phaser.GameObjects.Text;
  private mpText: Phaser.GameObjects.Text;
  private xpText: Phaser.GameObjects.Text;
  private zoneText: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;
  private killsText: Phaser.GameObjects.Text;
  private atkText: Phaser.GameObjects.Text;
  private speedText: Phaser.GameObjects.Text;
  private bannerText: Phaser.GameObjects.Text;
  private feedTexts: Phaser.GameObjects.Text[] = [];

  constructor(private scene: Phaser.Scene) {
    this.gfx = scene.add.graphics().setDepth(100);

    const label = (x: number, y: number, size: string, color: string) =>
      scene.add
        .text(x, y, '', { fontFamily: FONT, fontSize: size, color, fontStyle: 'bold' })
        .setDepth(101);

    this.lvText = label(72, 72, '44px', '#3a2500').setOrigin(0.5);
    this.hpText = label(376, 48, '22px', '#ffffff').setOrigin(0.5);
    this.mpText = label(376, 92, '22px', '#ffffff').setOrigin(0.5);
    this.xpText = label(376, 136, '22px', '#ffffff').setOrigin(0.5);
    this.zoneText = label(WORLD.w / 2, 48, '28px', '#eaf4ff').setOrigin(0.5);
    this.goldText = label(WORLD.w - 28, 36, '28px', '#ffd76a').setOrigin(1, 0);
    this.killsText = label(WORLD.w - 28, 80, '28px', '#ffffff').setOrigin(1, 0);
    this.atkText = label(WORLD.w - 28, 124, '28px', '#ffffff').setOrigin(1, 0);

    const bg = scene.add
      .rectangle(WORLD.w - 108, WORLD.h - 64, 152, 80, 0x238636)
      .setDepth(101)
      .setStrokeStyle(4, 0x2ea043)
      .setInteractive({ useHandCursor: true });
    this.speedText = label(WORLD.w - 108, WORLD.h - 64, '32px', '#ffffff').setOrigin(0.5);
    const onTap = () => {
      if (this.onSpeedChange) this.onSpeedChange();
    };
    bg.on('pointerdown', onTap);
    this.speedText.setInteractive({ useHandCursor: true }).on('pointerdown', onTap);

    this.bannerText = scene.add
      .text(WORLD.w / 2, 380, '', {
        fontFamily: FONT,
        fontSize: '128px',
        color: '#ffe066',
        fontStyle: '900',
        stroke: '#7a4d00',
        strokeThickness: 16,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(200);
  }

  private bar(x: number, y: number, w: number, h: number, ratio: number, light: number, dark: number): void {
    const g = this.gfx;
    g.fillStyle(0x1c2128, 1);
    g.fillRoundedRect(x, y, w, h, 14);
    const fw = Math.max(0, Math.min(1, ratio)) * w;
    if (fw > 2) {
      g.fillGradientStyle(light, light, dark, dark, 1);
      g.fillRoundedRect(x, y, fw, h, 14);
    }
    g.lineStyle(2, 0x444c56, 1);
    g.strokeRoundedRect(x, y, w, h, 14);
  }

  update(p: Player): void {
    const g = this.gfx;
    g.clear();

    // Player plate
    g.fillStyle(0x0d1117, 0.78);
    g.fillRoundedRect(20, 20, 600, 184, 20);
    g.lineStyle(4, 0x2d333b, 1);
    g.strokeRoundedRect(20, 20, 600, 184, 20);
    g.fillStyle(0xe8930c, 1);
    g.fillCircle(72, 72, 52);
    g.fillStyle(0xffd76a, 1);
    g.fillCircle(62, 62, 32);
    this.bar(152, 32, 448, 32, p.hp / p.maxHp, 0xff6b6b, 0xd92626);
    this.bar(152, 76, 448, 32, p.mp / p.maxMp, 0x5aa9ff, 0x1f6feb);
    this.bar(152, 120, 448, 32, p.exp / expForLevel(p.level), 0xffe066, 0xf0a500);

    // Stats panel
    g.fillStyle(0x0d1117, 0.78);
    g.fillRoundedRect(WORLD.w - 280, 20, 260, 164, 20);
    g.lineStyle(4, 0x2d333b, 1);
    g.strokeRoundedRect(WORLD.w - 280, 20, 260, 164, 20);

    this.lvText.setText(String(p.level));
    this.hpText.setText(`${Math.ceil(p.hp)} / ${p.maxHp}`);
    this.mpText.setText(`${Math.floor(p.mp)} / ${p.maxMp}`);
    this.xpText.setText(`${p.exp} / ${expForLevel(p.level)}`);

    let zone = ZONES[0][1];
    for (const [lv, name] of ZONES) if (p.level >= lv) zone = name;
    this.zoneText.setText(zone);

    this.goldText.setText(`Gold: ${p.gold}`);
    this.killsText.setText(`Kills: ${p.kills}`);
    this.atkText.setText(`ATK ${p.atk}`);
  }

  feed(msg: string): void {
    for (const f of this.feedTexts) f.y -= 44;
    const t = this.scene.add
      .text(28, WORLD.h - 80, msg, {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#bfe3ff',
        backgroundColor: 'rgba(13,17,23,0.7)',
        padding: { x: 16, y: 6 },
      })
      .setDepth(101);
    this.feedTexts.push(t);
    if (this.feedTexts.length > 6) this.feedTexts.shift()?.destroy();
    this.scene.time.delayedCall(5200, () => {
      if (!t.active) return;
      this.scene.tweens.add({
        targets: t,
        alpha: 0,
        duration: 700,
        onComplete: () => {
          const i = this.feedTexts.indexOf(t);
          if (i >= 0) this.feedTexts.splice(i, 1);
          t.destroy();
        },
      });
    });
  }

  banner(text: string): void {
    const b = this.bannerText;
    this.scene.tweens.killTweensOf(b);
    b.setText(text).setAlpha(1).setScale(0.6).setY(380);
    this.scene.tweens.add({
      targets: b,
      scale: 1.12,
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({ targets: b, scale: 1, y: 348, alpha: 0, duration: 1100, delay: 500 });
      },
    });
  }

  setSpeedLabel(s: string): void {
    this.speedText.setText(s);
  }
}
