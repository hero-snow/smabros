import Phaser from 'phaser';
import { CHARACTERS, CharacterData } from '../data/characters';

export class CharSelectScene extends Phaser.Scene {
  private p1SelectedChar: CharacterData = CHARACTERS[0];
  private cpuSelectedChar: CharacterData = CHARACTERS[1];
  private selectingFor: 'P1' | 'CPU' = 'P1';

  // UI elements
  private p1NameText!: Phaser.GameObjects.Text;
  private cpuNameText!: Phaser.GameObjects.Text;
  private p1DescText!: Phaser.GameObjects.Text;
  private cpuDescText!: Phaser.GameObjects.Text;
  private p1SpriteImage!: Phaser.GameObjects.Image;
  private cpuSpriteImage!: Phaser.GameObjects.Image;

  private p1StatBars: { [key: string]: Phaser.GameObjects.Rectangle } = {};
  private cpuStatBars: { [key: string]: Phaser.GameObjects.Rectangle } = {};

  private gridContainers: Phaser.GameObjects.Container[] = [];
  private p1Badge!: Phaser.GameObjects.Container;
  private cpuBadge!: Phaser.GameObjects.Container;

  private confirmBtn!: Phaser.GameObjects.Container;
  private turnText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'CharSelectScene' });
  }

  init(data?: { p1Char?: CharacterData; cpuChar?: CharacterData }): void {
    if (data?.p1Char) {
      this.p1SelectedChar = data.p1Char;
    }
    if (data?.cpuChar) {
      this.cpuSelectedChar = data.cpuChar;
    }
    this.selectingFor = 'P1';
    this.gridContainers = [];
    this.p1StatBars = {};
    this.cpuStatBars = {};
  }

  preload(): void {
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
    const { width, height } = this.scale;

    this.gridContainers = [];
    this.p1StatBars = {};
    this.cpuStatBars = {};

    this.cameras.main.setBackgroundColor('#060812');
    this.add.grid(width / 2, height / 2, width, height, 40, 40, 0x1e293b, 0.2, 0x334155, 0.4);

    this.add.circle(180, 300, 200, 0x38bdf8, 0.05);
    this.add.circle(780, 300, 200, 0xf43f5e, 0.05);

    // Back to Title Button (Top-left)
    const backBtn = this.add.container(75, 35);
    const backBg = this.add.rectangle(0, 0, 100, 34, 0x1e293b, 0.9).setStrokeStyle(1.5, 0x475569);
    const backTxt = this.add.text(0, 0, '◀ タイトル', {
      fontSize: '13px',
      color: '#cbd5e1',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    backBtn.add([backBg, backTxt]);
    backBg.setInteractive({ useHandCursor: true });
    backBg.on('pointerover', () => {
      backBg.setFillStyle(0x334155);
      backBtn.setScale(1.05);
    });
    backBg.on('pointerout', () => {
      backBg.setFillStyle(0x1e293b);
      backBtn.setScale(1.0);
    });
    backBg.on('pointerdown', () => {
      this.scene.start('TitleScene');
    });

    this.add.text(width / 2, 35, '⚔️ CHARACTER SELECT ⚔️', {
      fontSize: '30px',
      color: '#f8fafc',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.turnText = this.add.text(width / 2, 75, 'PLAYER 1 のキャラクターを選択してください', {
      fontSize: '16px',
      color: '#38bdf8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Left: 1P Preview Box
    this.createPreviewCard(140, 340, 'P1 HERO', 0x38bdf8, true);
    // Right: CPU Preview Box
    this.createPreviewCard(820, 340, 'CPU ENEMY', 0xf43f5e, false);

    // Center: Character Selection Grid (4x2)
    this.createCharacterGrid(width / 2, 310);

    // Bottom Action Button
    this.createConfirmButton(width / 2, 545);

    this.updateSelectionUI();
  }

  private createCharacterGrid(centerX: number, centerY: number): void {
    const cols = 4;
    const itemW = 90;
    const itemH = 110;
    const gapX = 16;
    const gapY = 16;

    const startX = centerX - ((cols * itemW + (cols - 1) * gapX) / 2) + itemW / 2;
    const startY = centerY - (itemH + gapY) / 2 + itemH / 2;

    CHARACTERS.forEach((char, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const x = startX + col * (itemW + gapX);
      const y = startY + row * (itemH + gapY);

      const container = this.add.container(x, y);

      const bg = this.add.rectangle(0, 0, itemW, itemH, 0x0f172a, 0.9);
      bg.setStrokeStyle(2, 0x334155);

      const portrait = this.add.image(0, -12, char.portrait).setDisplaySize(68, 68);

      const nameText = this.add.text(0, 36, char.name, {
        fontSize: '11px',
        color: '#f8fafc',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      container.add([bg, portrait, nameText]);

      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        bg.setStrokeStyle(3, char.themeColor);
        container.setScale(1.05);
      });

      bg.on('pointerout', () => {
        container.setScale(1.0);
        this.updateCardStrokes();
      });

      bg.on('pointerdown', () => {
        if (this.selectingFor === 'P1') {
          this.p1SelectedChar = char;
          this.selectingFor = 'CPU';
        } else {
          this.cpuSelectedChar = char;
        }
        this.updateSelectionUI();
      });

      this.gridContainers.push(container);
    });

    this.p1Badge = this.add.container(0, 0);
    const p1Tag = this.add.rectangle(0, 0, 32, 20, 0x0284c7).setStrokeStyle(2, 0xffffff);
    const p1Txt = this.add.text(0, 0, '1P', { fontSize: '11px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.p1Badge.add([p1Tag, p1Txt]);

    this.cpuBadge = this.add.container(0, 0);
    const cpuTag = this.add.rectangle(0, 0, 32, 20, 0xe11d48).setStrokeStyle(2, 0xffffff);
    const cpuTxt = this.add.text(0, 0, 'CPU', { fontSize: '11px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.cpuBadge.add([cpuTag, cpuTxt]);
  }

  private createPreviewCard(x: number, y: number, label: string, themeColor: number, isP1: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const cardBg = this.add.rectangle(0, 0, 220, 380, 0x0f172a, 0.92);
    cardBg.setStrokeStyle(3, themeColor);

    const header = this.add.text(0, -165, label, {
      fontSize: '16px',
      color: isP1 ? '#38bdf8' : '#f43f5e',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const spriteBox = this.add.rectangle(0, -80, 140, 120, 0x1e293b, 0.8).setStrokeStyle(1, themeColor);
    const spriteImg = this.add.image(0, -80, 'char1').setDisplaySize(110, 110);

    if (isP1) this.p1SpriteImage = spriteImg;
    else this.cpuSpriteImage = spriteImg;

    const nameText = this.add.text(0, 0, '', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const descText = this.add.text(0, 28, '', {
      fontSize: '11px',
      color: '#94a3b8',
      align: 'center',
      wordWrap: { width: 200 }
    }).setOrigin(0.5);

    if (isP1) {
      this.p1NameText = nameText;
      this.p1DescText = descText;
    } else {
      this.cpuNameText = nameText;
      this.cpuDescText = descText;
    }

    const statsY = 65;
    const statLabels = ['スピード', 'ジャンプ', 'パワー', 'おもさ'];
    const statKeys = ['speed', 'jumpPower', 'attackPower', 'weight'];
    const targetMap = isP1 ? this.p1StatBars : this.cpuStatBars;

    statLabels.forEach((sLabel, idx) => {
      const lineY = statsY + idx * 26;
      const lbl = this.add.text(-90, lineY, sLabel, { fontSize: '11px', color: '#cbd5e1' }).setOrigin(0, 0.5);

      const barBg = this.add.rectangle(15, lineY, 110, 10, 0x334155).setOrigin(0, 0.5);
      const barFill = this.add.rectangle(15, lineY, 0, 10, themeColor).setOrigin(0, 0.5);

      container.add([lbl, barBg, barFill]);
      targetMap[statKeys[idx]] = barFill;
    });

    const switchBtn = this.add.text(0, 168, isP1 ? '🔄 P1選択中 (クリックで変更)' : '🔄 CPU選択中 (クリックで変更)', {
      fontSize: '11px',
      color: isP1 ? '#38bdf8' : '#f43f5e',
      backgroundColor: '#1e293b',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    switchBtn.on('pointerdown', () => {
      this.selectingFor = isP1 ? 'P1' : 'CPU';
      this.updateSelectionUI();
    });

    container.add([cardBg, header, spriteBox, spriteImg, nameText, descText, switchBtn]);
    return container;
  }

  private createConfirmButton(x: number, y: number): void {
    this.confirmBtn = this.add.container(x, y);

    const btnBg = this.add.rectangle(0, 0, 280, 48, 0x2563eb, 1);
    btnBg.setStrokeStyle(3, 0x60a5fa);

    const btnText = this.add.text(0, 0, 'ステージ選択へ進む ➔', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.confirmBtn.add([btnBg, btnText]);
    btnBg.setInteractive({ useHandCursor: true });

    btnBg.on('pointerdown', () => {
      this.scene.start('StageSelectScene', {
        p1Char: this.p1SelectedChar,
        cpuChar: this.cpuSelectedChar
      });
    });

    btnBg.on('pointerover', () => this.confirmBtn.setScale(1.05));
    btnBg.on('pointerout', () => this.confirmBtn.setScale(1.0));
  }

  private updateSelectionUI(): void {
    this.turnText.setText(
      this.selectingFor === 'P1'
        ? '▶ PLAYER 1 のキャラクターを選んでください'
        : '▶ CPU (対戦相手) のキャラクターを選んでください'
    );
    this.turnText.setColor(this.selectingFor === 'P1' ? '#38bdf8' : '#f43f5e');

    this.p1SpriteImage.setTexture(this.p1SelectedChar.texture);
    this.p1NameText.setText(this.p1SelectedChar.name);
    this.p1DescText.setText(this.p1SelectedChar.description);
    this.updateStatBars(this.p1StatBars, this.p1SelectedChar);

    this.cpuSpriteImage.setTexture(this.cpuSelectedChar.texture);
    this.cpuNameText.setText(this.cpuSelectedChar.name);
    this.cpuDescText.setText(this.cpuSelectedChar.description);
    this.updateStatBars(this.cpuStatBars, this.cpuSelectedChar);

    this.updateCardStrokes();
  }

  private updateCardStrokes(): void {
    const p1Idx = CHARACTERS.findIndex(c => c.id === this.p1SelectedChar.id);
    const cpuIdx = CHARACTERS.findIndex(c => c.id === this.cpuSelectedChar.id);

    const cols = 4;
    const itemW = 90;
    const itemH = 110;
    const gapX = 16;
    const gapY = 16;
    const centerX = this.scale.width / 2;
    const centerY = 310;
    const startX = centerX - ((cols * itemW + (cols - 1) * gapX) / 2) + itemW / 2;
    const startY = centerY - (itemH + gapY) / 2 + itemH / 2;

    CHARACTERS.forEach((char, idx) => {
      if (idx < this.gridContainers.length) {
        const container = this.gridContainers[idx];
        const bg = container.list[0] as Phaser.GameObjects.Rectangle;
        const isP1 = char.id === this.p1SelectedChar.id;
        const isCpu = char.id === this.cpuSelectedChar.id;

        if (isP1 && isCpu) {
          bg.setStrokeStyle(3, 0xa855f7);
        } else if (isP1) {
          bg.setStrokeStyle(3, 0x38bdf8);
        } else if (isCpu) {
          bg.setStrokeStyle(3, 0xf43f5e);
        } else {
          bg.setStrokeStyle(2, 0x334155);
        }
      }
    });

    if (p1Idx >= 0 && this.p1Badge) {
      const p1X = startX + (p1Idx % cols) * (itemW + gapX);
      const p1Y = startY + Math.floor(p1Idx / cols) * (itemH + gapY) - 48;
      this.p1Badge.setPosition(p1X, p1Y);
    }

    if (cpuIdx >= 0 && this.cpuBadge) {
      const cpuX = startX + (cpuIdx % cols) * (itemW + gapX);
      const cpuY = startY + Math.floor(cpuIdx / cols) * (itemH + gapY) - 48;
      this.cpuBadge.setPosition(cpuX + 28, cpuY);
    }
  }

  private updateStatBars(bars: { [key: string]: Phaser.GameObjects.Rectangle }, char: CharacterData): void {
    if (!bars['speed'] || !bars['jumpPower'] || !bars['attackPower'] || !bars['weight']) return;
    bars['speed'].width = Phaser.Math.Clamp((char.stats.speed - 220) / 200 * 105, 15, 105);
    bars['jumpPower'].width = Phaser.Math.Clamp((char.stats.jumpPower - 440) / 180 * 105, 15, 105);
    bars['attackPower'].width = Phaser.Math.Clamp((char.stats.attackPower - 0.8) / 0.6 * 105, 15, 105);
    bars['weight'].width = Phaser.Math.Clamp((char.stats.weight - 65) / 100 * 105, 15, 105);
  }
}
