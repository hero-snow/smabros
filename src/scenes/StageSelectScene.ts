import Phaser from 'phaser';
import { STAGES, StageData } from '../data/stages';
import { CharacterData } from '../data/characters';

export class StageSelectScene extends Phaser.Scene {
  private p1Char!: CharacterData;
  private cpuChar!: CharacterData;

  private selectedStage: StageData = STAGES[0];

  private stageCards: Phaser.GameObjects.Container[] = [];
  private previewTitle!: Phaser.GameObjects.Text;
  private previewDesc!: Phaser.GameObjects.Text;
  private previewBgBox!: Phaser.GameObjects.Rectangle;
  private previewMainStage!: Phaser.GameObjects.Rectangle;
  private previewSoftPlatforms: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super({ key: 'StageSelectScene' });
  }

  init(data?: { p1Char?: CharacterData; cpuChar?: CharacterData }): void {
    if (data?.p1Char) {
      this.p1Char = data.p1Char;
    }
    if (data?.cpuChar) {
      this.cpuChar = data.cpuChar;
    }
    this.stageCards = [];
    this.previewSoftPlatforms = [];
  }

  create(): void {
    const { width, height } = this.scale;

    this.stageCards = [];
    this.previewSoftPlatforms = [];

    this.cameras.main.setBackgroundColor('#060812');
    this.add.grid(width / 2, height / 2, width, height, 40, 40, 0x1e293b, 0.25, 0x334155, 0.45);

    // Title
    this.add.text(width / 2, 35, '🗺️ STAGE SELECT 🗺️', {
      fontSize: '32px',
      color: '#f8fafc',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(width / 2, 72, '対戦ステージを選択してください', {
      fontSize: '15px',
      color: '#38bdf8'
    }).setOrigin(0.5);

    // Left Half: Stage Cards (2x2)
    this.createStageGrid(220, 310);

    // Right Half: Big Stage Preview Screen
    this.createStagePreview(680, 310);

    // Bottom Action Buttons (Back / Battle Start)
    this.createNavigationButtons(width / 2, 545);

    this.updatePreviewUI();
  }

  private createStageGrid(centerX: number, centerY: number): void {
    const itemW = 180;
    const itemH = 110;
    const gapX = 20;
    const gapY = 20;

    STAGES.forEach((stage, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);

      const x = centerX - (itemW + gapX) / 2 + col * (itemW + gapX);
      const y = centerY - (itemH + gapY) / 2 + row * (itemH + gapY);

      const container = this.add.container(x, y);

      const cardBg = this.add.rectangle(0, 0, itemW, itemH, 0x0f172a, 0.92);
      cardBg.setStrokeStyle(2, stage.themeColor);

      // Stage Icon / Mini graphic
      const iconCircle = this.add.circle(0, -20, 24, stage.themeColor, 0.8);
      iconCircle.setStrokeStyle(2, 0xffffff);

      const title = this.add.text(0, 18, stage.name, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const subTitle = this.add.text(0, 36, stage.title, {
        fontSize: '10px',
        color: '#94a3b8'
      }).setOrigin(0.5);

      container.add([cardBg, iconCircle, title, subTitle]);

      cardBg.setInteractive({ useHandCursor: true });

      cardBg.on('pointerdown', () => {
        this.selectedStage = stage;
        this.updatePreviewUI();
      });

      cardBg.on('pointerover', () => container.setScale(1.05));
      cardBg.on('pointerout', () => container.setScale(1.0));

      this.stageCards.push(container);
    });
  }

  private createStagePreview(x: number, y: number): void {
    const container = this.add.container(x, y);

    // Frame
    const frameBg = this.add.rectangle(0, 0, 420, 280, 0x0f172a, 0.95);
    frameBg.setStrokeStyle(3, 0x38bdf8);

    // Screen Box
    this.previewBgBox = this.add.rectangle(0, -25, 380, 180, 0x020617);
    this.previewBgBox.setStrokeStyle(1, 0x334155);

    // Platform Mockups inside preview
    this.previewMainStage = this.add.rectangle(0, 35, 220, 12, 0x2563eb);
    this.previewMainStage.setStrokeStyle(2, 0x60a5fa);

    for (let i = 0; i < 3; i++) {
      const plat = this.add.rectangle(0, 0, 50, 6, 0x38bdf8);
      this.previewSoftPlatforms.push(plat);
    }

    // Title & Description below preview box
    this.previewTitle = this.add.text(0, 80, '', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.previewDesc = this.add.text(0, 108, '', {
      fontSize: '12px',
      color: '#94a3b8',
      align: 'center'
    }).setOrigin(0.5);

    container.add([frameBg, this.previewBgBox, this.previewMainStage, ...this.previewSoftPlatforms, this.previewTitle, this.previewDesc]);
  }

  private updatePreviewUI(): void {
    const stage = this.selectedStage;

    this.previewTitle.setText(`${stage.name} - ${stage.title}`);
    this.previewTitle.setColor(stage.themeColor === 0xef4444 ? '#f87171' : '#38bdf8');
    this.previewDesc.setText(stage.description);

    this.previewBgBox.setFillStyle(stage.themeColor, 0.15);

    // Main platform
    this.previewMainStage.setFillStyle(stage.mainPlatform.color);
    this.previewMainStage.setStrokeStyle(2, stage.mainPlatform.strokeColor);

    // Soft platforms
    const posOffsets = [
      { x: -65, y: -10 },
      { x: 65, y: -10 },
      { x: 0, y: -50 }
    ];

    stage.softPlatforms.forEach((sp, idx) => {
      if (idx < this.previewSoftPlatforms.length) {
        const plat = this.previewSoftPlatforms[idx];
        plat.setPosition(posOffsets[idx].x, posOffsets[idx].y);
        plat.setFillStyle(sp.color);
        plat.setStrokeStyle(1, sp.strokeColor);
      }
    });

    // Update border highlights on left grid cards
    STAGES.forEach((s, idx) => {
      const card = this.stageCards[idx];
      if (card) {
        const bg = card.list[0] as Phaser.GameObjects.Rectangle;
        if (s.id === stage.id) {
          bg.setStrokeStyle(4, 0xfacc15);
          card.setScale(1.03);
        } else {
          bg.setStrokeStyle(2, s.themeColor);
          card.setScale(1.0);
        }
      }
    });
  }

  private createNavigationButtons(centerX: number, y: number): void {
    // Back Button
    const backBtn = this.add.container(centerX - 160, y);
    const backBg = this.add.rectangle(0, 0, 180, 48, 0x334155, 1).setStrokeStyle(2, 0x64748b);
    const backTxt = this.add.text(0, 0, '◀ キャラ選択へ', { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    backBtn.add([backBg, backTxt]);
    backBg.setInteractive({ useHandCursor: true });
    backBg.on('pointerdown', () => {
      this.scene.start('CharSelectScene', {
        p1Char: this.p1Char,
        cpuChar: this.cpuChar
      });
    });

    // Start Battle Button
    const startBtn = this.add.container(centerX + 120, y);
    const startBg = this.add.rectangle(0, 0, 260, 48, 0x16a34a, 1).setStrokeStyle(3, 0x4ade80);
    const startTxt = this.add.text(0, 0, '⚔️ 対戦開始！ (BATTLE)', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    startBtn.add([startBg, startTxt]);
    startBg.setInteractive({ useHandCursor: true });
    startBg.on('pointerdown', () => {
      this.scene.start('MainScene', {
        p1Char: this.p1Char,
        cpuChar: this.cpuChar,
        stage: this.selectedStage
      });
    });

    startBg.on('pointerover', () => startBtn.setScale(1.05));
    startBg.on('pointerout', () => startBtn.setScale(1.0));
  }
}
