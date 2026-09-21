import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { CHARACTERS, CharacterData } from '../data/characters';
import { STAGES, StageData } from '../data/stages';

type GameState = 'COUNTDOWN' | 'PLAYING' | 'GAMEOVER';

export class MainScene extends Phaser.Scene {
  private p1CharData: CharacterData = CHARACTERS[0];
  private cpuCharData: CharacterData = CHARACTERS[1];
  private stageData: StageData = STAGES[0];

  private gameState: GameState = 'COUNTDOWN';

  private player!: Player;
  private cpu!: Player;

  private mainStage!: Phaser.GameObjects.Rectangle;
  private softPlatformObjects: Phaser.GameObjects.Rectangle[] = [];
  private softPlatformDataList: any[] = [];

  // Parallax Background elements
  private bgStarsGroup!: Phaser.GameObjects.Group;
  private parallaxFarGrid!: Phaser.GameObjects.Grid;

  // Keyboard keys
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyZ!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key;
  private keyK!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // HUD Elements
  private hudContainer!: Phaser.GameObjects.Container;
  private playerDamageText!: Phaser.GameObjects.Text;
  private cpuDamageText!: Phaser.GameObjects.Text;
  private playerStockText!: Phaser.GameObjects.Text;
  private cpuStockText!: Phaser.GameObjects.Text;

  // Overlay Containers
  private countdownText!: Phaser.GameObjects.Text;
  private gameOverContainer!: Phaser.GameObjects.Container;

  // Attack cooldown flags
  private playerAttacking: boolean = false;
  private cpuAttacking: boolean = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: { p1Char?: CharacterData; cpuChar?: CharacterData; stage?: StageData }): void {
    if (data.p1Char) this.p1CharData = data.p1Char;
    if (data.cpuChar) this.cpuCharData = data.cpuChar;
    if (data.stage) this.stageData = data.stage;
  }

  preload(): void {
    this.load.image(this.p1CharData.texture, `assets/${this.p1CharData.id}.png`);
    this.load.image(this.cpuCharData.texture, `assets/${this.cpuCharData.id}.png`);
    this.load.image(this.p1CharData.portrait, `assets/${this.p1CharData.id}_portrait.png`);
    this.load.image(this.cpuCharData.portrait, `assets/${this.cpuCharData.id}_portrait.png`);
  }

  create(): void {
    this.gameState = 'COUNTDOWN';
    this.playerAttacking = false;
    this.cpuAttacking = false;

    this.input.addPointer(3);

    this.createStageBackground();
    this.createStagePlatforms();

    this.player = new Player(this, 350, 380, this.p1CharData, 'player');
    this.cpu = new Player(this, 610, 380, this.cpuCharData, 'cpu');

    const allPlatforms = [this.mainStage, ...this.softPlatformObjects];
    this.physics.add.collider(this.player, allPlatforms);
    this.physics.add.collider(this.cpu, allPlatforms);
    this.physics.add.collider(this.player, this.cpu);

    this.player.isFrozen = true;
    this.cpu.isFrozen = true;

    this.createHUD();
    this.createVirtualControls();
    this.setupKeyboardInput();

    this.countdownText = this.add.text(480, 260, '', {
      fontSize: '80px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0);

    this.startCountdown();
  }

  private createStageBackground(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(this.stageData.bgGradTop);

    this.parallaxFarGrid = this.add.grid(
      width / 2, height / 2,
      width + 200, height + 200,
      48, 48,
      0x000000, 0,
      this.stageData.gridColor, 0.25
    );

    this.bgStarsGroup = this.add.group();
    const particleCount = 35;

    for (let i = 0; i < particleCount; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(2, 6);
      const color = this.stageData.themeColor;

      const p = this.add.circle(x, y, size, color, Phaser.Math.FloatBetween(0.3, 0.8));
      this.bgStarsGroup.add(p);
    }
  }

  private createStagePlatforms(): void {
    const ms = this.stageData.mainPlatform;

    this.mainStage = this.add.rectangle(ms.x, ms.y, ms.width, ms.height, ms.color);
    this.mainStage.setStrokeStyle(3, ms.strokeColor);
    this.physics.add.existing(this.mainStage, true);

    this.add.polygon(ms.x, ms.y + ms.height, [
      -ms.width / 2 + 30, 0,
      ms.width / 2 - 30, 0,
      ms.width / 2 - 120, 60,
      -ms.width / 2 + 120, 60
    ], ms.color, 0.7);

    this.softPlatformObjects = [];
    this.softPlatformDataList = [];

    this.stageData.softPlatforms.forEach((sp) => {
      const plat = this.add.rectangle(sp.x, sp.y, sp.width, sp.height, sp.color, 0.9);
      plat.setStrokeStyle(2, sp.strokeColor);
      this.physics.add.existing(plat, true);

      this.softPlatformObjects.push(plat);
      this.softPlatformDataList.push({
        rect: plat,
        baseX: sp.x,
        baseY: sp.y,
        isMoving: sp.isMoving || false,
        moveRangeX: sp.moveRangeX || 0,
        moveRangeY: sp.moveRangeY || 0,
        moveSpeed: sp.moveSpeed || 0.002
      });
    });
  }

  private setupKeyboardInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
      this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
      this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
  }

  update(time: number, delta: number): void {
    if (this.gameState === 'GAMEOVER') return;

    this.updateParallaxBackground();
    this.updateMovingPlatforms(time);

    this.player.updatePlayer(delta, this.cpu);
    this.cpu.updatePlayer(delta, this.player);

    if (this.gameState === 'PLAYING') {
      this.handlePlayerControls();

      if (this.cpu.cpuWantsAttack && !this.cpuAttacking) {
        const isSmash = Phaser.Math.Between(0, 100) < 35;
        this.executeAttack(this.cpu, this.player, isSmash);
      }

      this.checkBlastZone(this.player, 350, 200);
      this.checkBlastZone(this.cpu, 610, 200);

      this.updateHUD();
    }
  }

  private updateParallaxBackground(): void {
    const focusX = (this.player.x + this.cpu.x) / 2;
    const focusY = (this.player.y + this.cpu.y) / 2;

    this.parallaxFarGrid.x = 480 - (focusX - 480) * 0.05;
    this.parallaxFarGrid.y = 300 - (focusY - 300) * 0.05;

    const particles = this.bgStarsGroup.getChildren();
    particles.forEach((p, idx) => {
      const circle = p as Phaser.GameObjects.Arc;
      circle.y -= 0.3 + (idx % 3) * 0.2;
      if (circle.y < -10) {
        circle.y = 610;
        circle.x = Phaser.Math.Between(0, 960);
      }
    });
  }

  private updateMovingPlatforms(time: number): void {
    this.softPlatformDataList.forEach(sp => {
      if (sp.isMoving) {
        const newX = sp.baseX + Math.sin(time * sp.moveSpeed) * sp.moveRangeX;
        const newY = sp.baseY + Math.sin(time * sp.moveSpeed) * sp.moveRangeY;

        sp.rect.setPosition(newX, newY);
        (sp.rect.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      }
    });
  }

  private handlePlayerControls(): void {
    const isLeft = (this.cursors && this.cursors.left.isDown) || (this.keyA && this.keyA.isDown);
    const isRight = (this.cursors && this.cursors.right.isDown) || (this.keyD && this.keyD.isDown);

    this.player.moveLeftInput = isLeft;
    this.player.moveRightInput = isRight;

    const jumpPressed = (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.up)) ||
                        (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace)) ||
                        (this.keyW && Phaser.Input.Keyboard.JustDown(this.keyW));

    if (jumpPressed) {
      this.player.jump();
    }

    const attackPressed = (this.keyZ && Phaser.Input.Keyboard.JustDown(this.keyZ)) ||
                          (this.keyJ && Phaser.Input.Keyboard.JustDown(this.keyJ));

    if (attackPressed) {
      this.executeAttack(this.player, this.cpu, false);
    }

    const smashPressed = (this.keyX && Phaser.Input.Keyboard.JustDown(this.keyX)) ||
                         (this.keyK && Phaser.Input.Keyboard.JustDown(this.keyK));

    if (smashPressed) {
      this.executeAttack(this.player, this.cpu, true);
    }
  }

  private startCountdown(): void {
    this.player.setPosition(350, 380);
    this.player.isFrozen = true;
    this.cpu.setPosition(610, 380);
    this.cpu.isFrozen = true;

    const sequence = [
      { text: '3', color: '#38bdf8', scale: 1.6 },
      { text: '2', color: '#facc15', scale: 1.6 },
      { text: '1', color: '#fb923c', scale: 1.6 },
      { text: 'GO!!', color: '#22c55e', scale: 2.2 }
    ];

    let stepIndex = 0;

    const playNextStep = () => {
      if (stepIndex >= sequence.length) {
        this.gameState = 'PLAYING';
        this.player.isFrozen = false;
        this.cpu.isFrozen = false;
        this.countdownText.setAlpha(0);
        return;
      }

      const item = sequence[stepIndex];
      this.countdownText.setText(item.text);
      this.countdownText.setColor(item.color);
      this.countdownText.setScale(0.4);
      this.countdownText.setAlpha(0);

      this.tweens.add({
        targets: this.countdownText,
        scaleX: item.scale,
        scaleY: item.scale,
        alpha: 1,
        duration: 350,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.time.delayedCall(250, () => {
            this.tweens.add({
              targets: this.countdownText,
              alpha: 0,
              duration: 150,
              onComplete: () => {
                stepIndex++;
                playNextStep();
              }
            });
          });
        }
      });
    };

    this.time.delayedCall(300, () => {
      playNextStep();
    });
  }

  private executeAttack(attacker: Player, defender: Player, isSmash: boolean): void {
    const isPlayer = attacker === this.player;
    if (isPlayer && this.playerAttacking) return;
    if (!isPlayer && this.cpuAttacking) return;

    if (isPlayer) this.playerAttacking = true;
    else this.cpuAttacking = true;

    const facingRight = !attacker.flipX;
    const attackRange = isSmash ? 60 : 45;
    const attackX = attacker.x + (facingRight ? attackRange : -attackRange);
    const attackY = attacker.y;

    const color = isSmash ? 0xef4444 : attacker.charData.themeColor;
    const slashSize = isSmash ? 45 : 30;
    const slash = this.add.circle(attackX, attackY, slashSize, color, 0.85);

    this.tweens.add({
      targets: slash,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: isSmash ? 200 : 130,
      onComplete: () => slash.destroy()
    });

    const dist = Phaser.Math.Distance.Between(attackX, attackY, defender.x, defender.y);
    if (dist < (isSmash ? 68 : 55)) {
      const dirX = facingRight ? 1 : -1;
      const dirY = isSmash ? -0.85 : -0.45;

      const baseDamage = (isSmash ? 16 : 8) * attacker.charData.stats.attackPower;
      const baseKnockbackX = dirX * (isSmash ? 360 : 220);
      const baseKnockbackY = dirY * (isSmash ? 380 : 240);

      defender.takeKnockback(baseDamage, baseKnockbackX, baseKnockbackY);

      this.cameras.main.shake(isSmash ? 160 : 70, isSmash ? 0.015 : 0.006);
      this.createHitSparks(attackX, attackY, isSmash);
    }

    const cooldown = isSmash ? 300 : 160;
    this.time.delayedCall(cooldown, () => {
      if (isPlayer) this.playerAttacking = false;
      else this.cpuAttacking = false;
    });
  }

  private createHitSparks(x: number, y: number, isSmash: boolean): void {
    const count = isSmash ? 14 : 7;
    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(80, isSmash ? 300 : 170);
      const spark = this.add.circle(x, y, Phaser.Math.Between(3, 7), isSmash ? 0xfacc15 : 0xffffff, 1);

      const rad = Phaser.Math.DegToRad(angle);
      const targetX = x + Math.cos(rad) * speed * 0.22;
      const targetY = y + Math.sin(rad) * speed * 0.22;

      this.tweens.add({
        targets: spark,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        duration: 220,
        onComplete: () => spark.destroy()
      });
    }
  }

  private checkBlastZone(fighter: Player, respawnX: number, respawnY: number): void {
    if (fighter.x < -100 || fighter.x > 1060 || fighter.y < -140 || fighter.y > 720) {
      this.triggerBlastEffects(fighter.x, fighter.y);

      fighter.stocks -= 1;

      if (fighter.stocks <= 0) {
        const isPlayerWin = fighter === this.cpu;
        this.handleGameOver(isPlayerWin ? `${this.p1CharData.name} VICTORY! 🎉` : 'GAME OVER 💀');
      } else {
        fighter.setPosition(-300, -300);
        this.time.delayedCall(1000, () => {
          if (this.gameState === 'PLAYING') {
            fighter.respawn(respawnX, respawnY);
          }
        });
      }
    }
  }

  private triggerBlastEffects(x: number, y: number): void {
    const clampX = Phaser.Math.Clamp(x, 30, 930);
    const clampY = Phaser.Math.Clamp(y, 30, 570);

    const ring = this.add.circle(clampX, clampY, 20, 0xef4444, 0.9);
    ring.setStrokeStyle(6, 0xfacc15);

    this.tweens.add({
      targets: ring,
      radius: 150,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy()
    });

    this.cameras.main.shake(280, 0.028);
    this.cameras.main.flash(200, 255, 255, 255, true);
  }

  private handleGameOver(winnerText: string): void {
    this.gameState = 'GAMEOVER';

    this.gameOverContainer = this.add.container(480, 300);

    const bg = this.add.rectangle(0, 0, 560, 260, 0x0a0f1d, 0.96);
    bg.setStrokeStyle(3, 0x38bdf8);

    const title = this.add.text(0, -60, winnerText, {
      fontSize: '32px',
      color: winnerText.includes('VICTORY') ? '#4ade80' : '#f87171',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sub = this.add.text(0, -5, '対戦終了！ 次の戦いへ進みますか？', {
      fontSize: '16px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    const retryBtn = this.add.text(-170, 65, '⚔️ 再戦する', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#2563eb',
      padding: { x: 16, y: 10 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerdown', () => {
      this.scene.restart();
    });

    const charBtn = this.add.text(0, 65, '🔄 キャラ変更', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#334155',
      padding: { x: 16, y: 10 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    charBtn.on('pointerdown', () => {
      this.scene.start('CharSelectScene');
    });

    const titleBtn = this.add.text(170, 65, '🏠 タイトルへ', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#475569',
      padding: { x: 16, y: 10 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    titleBtn.on('pointerdown', () => {
      this.scene.start('TitleScene');
    });

    this.gameOverContainer.add([bg, title, sub, retryBtn, charBtn, titleBtn]);
  }

  private createVirtualControls(): void {
    this.createButton(90, 520, 72, '◀', '#38bdf8', {
      onDown: () => { if (this.gameState === 'PLAYING') this.player.moveLeftInput = true; },
      onUp: () => { this.player.moveLeftInput = false; }
    });

    this.createButton(185, 520, 72, '▶', '#38bdf8', {
      onDown: () => { if (this.gameState === 'PLAYING') this.player.moveRightInput = true; },
      onUp: () => { this.player.moveRightInput = false; }
    });

    this.createButton(680, 520, 66, '⚔️', '#3b82f6', {
      onDown: () => { if (this.gameState === 'PLAYING') this.executeAttack(this.player, this.cpu, false); }
    });

    this.createButton(770, 520, 66, '💥', '#ef4444', {
      onDown: () => { if (this.gameState === 'PLAYING') this.executeAttack(this.player, this.cpu, true); }
    });

    this.createButton(865, 520, 72, '⬆️', '#10b981', {
      onDown: () => { if (this.gameState === 'PLAYING') this.player.jump(); }
    });
  }

  private createButton(
    x: number,
    y: number,
    size: number,
    label: string,
    colorHex: string,
    callbacks: { onDown?: () => void; onUp?: () => void }
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const colorNum = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const bg = this.add.circle(0, 0, size / 2, colorNum, 0.75);
    bg.setStrokeStyle(3, 0xffffff, 0.85);

    const text = this.add.text(0, 0, label, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, text]);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerdown', () => {
      container.setScale(0.92);
      bg.setAlpha(0.95);
      callbacks.onDown?.();
    });

    const handleRelease = () => {
      container.setScale(1.0);
      bg.setAlpha(0.75);
      callbacks.onUp?.();
    };

    bg.on('pointerup', handleRelease);
    bg.on('pointerout', handleRelease);

    return container;
  }

  private createHUD(): void {
    this.hudContainer = this.add.container(0, 0);

    const title = this.add.text(480, 20, `⚔️ ${this.stageData.name.toUpperCase()} ⚔️`, {
      fontSize: '18px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const p1Box = this.add.rectangle(170, 85, 230, 60, 0x0f172a, 0.88).setStrokeStyle(2, 0x38bdf8);
    const p1Portrait = this.add.image(75, 85, this.p1CharData.portrait).setDisplaySize(44, 44);
    const p1Label = this.add.text(108, 66, `1P: ${this.p1CharData.name}`, { fontSize: '13px', color: '#38bdf8', fontStyle: 'bold' });
    this.playerStockText = this.add.text(108, 88, '● ● ●', { fontSize: '15px', color: '#facc15' });
    this.playerDamageText = this.add.text(270, 85, '0%', { fontSize: '28px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(1, 0.5);

    const cpuBox = this.add.rectangle(790, 85, 230, 60, 0x0f172a, 0.88).setStrokeStyle(2, 0xf43f5e);
    const cpuPortrait = this.add.image(695, 85, this.cpuCharData.portrait).setDisplaySize(44, 44);
    const cpuLabel = this.add.text(728, 66, `CPU: ${this.cpuCharData.name}`, { fontSize: '13px', color: '#f43f5e', fontStyle: 'bold' });
    this.cpuStockText = this.add.text(728, 88, '● ● ●', { fontSize: '15px', color: '#facc15' });
    this.cpuDamageText = this.add.text(890, 85, '0%', { fontSize: '28px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(1, 0.5);

    this.hudContainer.add([title, p1Box, p1Portrait, p1Label, this.playerStockText, this.playerDamageText, cpuBox, cpuPortrait, cpuLabel, this.cpuStockText, this.cpuDamageText]);
  }

  private updateHUD(): void {
    this.playerDamageText.setText(`${Math.floor(this.player.damagePercent)}%`);
    this.playerDamageText.setColor(this.getDamageColor(this.player.damagePercent));

    this.cpuDamageText.setText(`${Math.floor(this.cpu.damagePercent)}%`);
    this.cpuDamageText.setColor(this.getDamageColor(this.cpu.damagePercent));

    this.playerStockText.setText('● '.repeat(Math.max(0, this.player.stocks)).trim());
    this.cpuStockText.setText('● '.repeat(Math.max(0, this.cpu.stocks)).trim());
  }

  private getDamageColor(pct: number): string {
    if (pct < 35) return '#2ecc71';
    if (pct < 75) return '#f1c40f';
    if (pct < 120) return '#e67e22';
    if (pct < 160) return '#e74c3c';
    return '#a855f7';
  }
}
