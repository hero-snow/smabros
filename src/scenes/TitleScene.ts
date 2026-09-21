import Phaser from 'phaser';
import { CHARACTERS } from '../data/characters';

export class TitleScene extends Phaser.Scene {
  private startBtn!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private isStarting = false;

  constructor() {
    super({ key: 'TitleScene' });
  }

  preload(): void {
    // Load all character textures and portraits for display
    CHARACTERS.forEach(char => {
      if (!this.textures.exists(char.texture)) {
        this.load.image(char.texture, `assets/${char.id}.png`);
      }
      if (!this.textures.exists(char.portrait)) {
        this.load.image(char.portrait, `assets/${char.id}_portrait.png`);
      }
    });
  }

  create(): void {
    this.isStarting = false;
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor('#070b14');

    // Cyber grid effect
    this.add.grid(width / 2, height / 2, width, height, 40, 40, 0x1e1b4b, 0.25, 0x312e81, 0.4);

    // Glowing background circles
    this.add.circle(width * 0.2, height * 0.35, 220, 0x38bdf8, 0.08);
    this.add.circle(width * 0.8, height * 0.35, 220, 0xf43f5e, 0.08);
    this.add.circle(width * 0.5, height * 0.2, 180, 0xfacc15, 0.06);

    // Floating background particles
    for (let i = 0; i < 30; i++) {
      const px = Phaser.Math.Between(20, width - 20);
      const py = Phaser.Math.Between(20, height - 20);
      const pRadius = Phaser.Math.FloatBetween(1.5, 3.5);
      const pColor = Phaser.Math.RND.pick([0x38bdf8, 0xf43f5e, 0xfacc15, 0xa855f7, 0x10b981]);
      const pAlpha = Phaser.Math.FloatBetween(0.2, 0.6);

      const circle = this.add.circle(px, py, pRadius, pColor, pAlpha);
      this.tweens.add({
        targets: circle,
        y: py - Phaser.Math.Between(20, 50),
        alpha: { from: pAlpha, to: 0.1 },
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    // Title Logo Area
    const logoContainer = this.add.container(width / 2, 115);

    // Main title: CRAZY CRASH
    const titleMain = this.add.text(0, -32, 'CRAZY CRASH', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '62px',
      color: '#ffffff',
      stroke: '#0f172a',
      strokeThickness: 10,
      letterSpacing: 4
    }).setOrigin(0.5);

    // Gradient fill simulation for CRAZY CRASH
    const gradient = titleMain.context.createLinearGradient(0, 0, 0, titleMain.height);
    gradient.addColorStop(0, '#38bdf8');
    gradient.addColorStop(0.5, '#e0e7ff');
    gradient.addColorStop(1, '#f43f5e');
    titleMain.setFill(gradient);

    // Sub title: ARENA
    const titleSub = this.add.text(0, 32, '⚡ ARENA ⚡', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '44px',
      color: '#facc15',
      stroke: '#78350f',
      strokeThickness: 8,
      letterSpacing: 8
    }).setOrigin(0.5);

    // Japanese Catchphrase
    const tagLine = this.add.text(0, 75, '〜 はちゃめちゃ大乱闘バトル！ 〜', {
      fontSize: '17px',
      color: '#cbd5e1',
      fontStyle: 'bold',
      stroke: '#090d16',
      strokeThickness: 4
    }).setOrigin(0.5);

    logoContainer.add([titleMain, titleSub, tagLine]);

    // Title subtle pulse animation
    this.tweens.add({
      targets: logoContainer,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Character Showcase in Center (Floating character lineup)
    this.createCharacterShowcase(width / 2, 280);

    // Start Button
    this.createStartButton(width / 2, 450);

    // Press Key prompt text
    this.promptText = this.add.text(width / 2, 508, 'PRESS SPACE / ENTER OR CLICK TO START', {
      fontSize: '14px',
      color: '#94a3b8',
      fontStyle: 'bold',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.promptText,
      alpha: 0.25,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Controls Mini Banner at Bottom
    this.createControlsBanner(width / 2, 565);

    // Keyboard Input Listeners
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.startGame());
      this.input.keyboard.on('keydown-ENTER', () => this.startGame());
    }
  }

  private createCharacterShowcase(centerX: number, centerY: number): void {
    // Showcase top 6 fighters: エビフライドラゴン, クロームベア, ハンバーガーマン, ペガサス, アヒルマン, スシドラゴン
    const showcaseChars = CHARACTERS.slice(0, 6);
    const spacing = 125;
    const startX = centerX - ((showcaseChars.length - 1) * spacing) / 2;

    showcaseChars.forEach((char, index) => {
      const posX = startX + index * spacing;
      const posY = centerY + (index % 2 === 0 ? -10 : 10);

      const charBox = this.add.container(posX, posY);

      // Glow backing
      const glow = this.add.circle(0, 0, 42, char.themeColor, 0.18);

      // Sprite image
      const sprite = this.add.image(0, -6, char.texture).setDisplaySize(80, 80);

      // Character name badge
      const badgeBg = this.add.rectangle(0, 42, 100, 20, 0x0f172a, 0.85).setStrokeStyle(1.5, char.themeColor);
      const name = this.add.text(0, 42, char.name, {
        fontSize: '10px',
        color: '#f8fafc',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      charBox.add([glow, sprite, badgeBg, name]);

      // Floating bobbing animation
      this.tweens.add({
        targets: charBox,
        y: posY + (index % 2 === 0 ? 14 : -14),
        duration: 1400 + index * 180,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  private createStartButton(x: number, y: number): void {
    this.startBtn = this.add.container(x, y);

    const btnBg = this.add.rectangle(0, 0, 300, 52, 0x2563eb, 1);
    btnBg.setStrokeStyle(3, 0x60a5fa);

    // Button glow
    const btnGlow = this.add.rectangle(0, 0, 306, 58, 0x3b82f6, 0.35);

    const btnText = this.add.text(0, 0, '▶ GAME START', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      letterSpacing: 3
    }).setOrigin(0.5);

    this.startBtn.add([btnGlow, btnBg, btnText]);

    btnBg.setInteractive({ useHandCursor: true });

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x1d4ed8);
      this.startBtn.setScale(1.08);
      btnGlow.setAlpha(0.6);
    });

    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x2563eb);
      this.startBtn.setScale(1.0);
      btnGlow.setAlpha(0.35);
    });

    btnBg.on('pointerdown', () => this.startGame());

    // Gentle pulse
    this.tweens.add({
      targets: btnGlow,
      scaleX: 1.04,
      scaleY: 1.08,
      alpha: { from: 0.25, to: 0.55 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createControlsBanner(x: number, y: number): void {
    const banner = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 880, 32, 0x0f172a, 0.8).setStrokeStyle(1, 0x334155);

    const text = this.add.text(0, 0, '🎮 CONTROLS:  [A][D] 移動  |  [W] ジャンプ  |  [J] 通常攻撃  |  [K] スマッシュ攻撃  |  [L] ガード', {
      fontSize: '12px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    banner.add([bg, text]);
  }

  private startGame(): void {
    if (this.isStarting) return;
    this.isStarting = true;

    // Flash effect and fade out to Character Select
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('CharSelectScene');
    });
  }
}
