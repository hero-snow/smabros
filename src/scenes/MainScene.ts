import Phaser from 'phaser';
import { Player } from '../entities/Player';

type GameState = 'TITLE' | 'COUNTDOWN' | 'PLAYING' | 'GAMEOVER';

export class MainScene extends Phaser.Scene {
  private gameState: GameState = 'TITLE';

  private player!: Player;
  private cpu!: Player;
  private mainStage!: Phaser.GameObjects.Rectangle;
  private leftPlatform!: Phaser.GameObjects.Rectangle;
  private rightPlatform!: Phaser.GameObjects.Rectangle;
  private topPlatform!: Phaser.GameObjects.Rectangle;

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

  // Title & Overlay Containers
  private titleContainer!: Phaser.GameObjects.Container;
  private countdownText!: Phaser.GameObjects.Text;
  private gameOverContainer!: Phaser.GameObjects.Container;

  // Attack cooldown flags
  private playerAttacking: boolean = false;
  private cpuAttacking: boolean = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    this.createProceduralTextures();
  }

  create(): void {
    this.gameState = 'TITLE';
    this.playerAttacking = false;
    this.cpuAttacking = false;

    // Enable multi-touch for mobile
    this.input.addPointer(3);

    // 1. Wide Battlefield Background (960x600)
    this.cameras.main.setBackgroundColor('#090d16');
    this.add.grid(480, 300, 960, 600, 48, 48, 0x1e293b, 0.25, 0x334155, 0.45);

    // Atmospheric nebulae/circles
    this.add.circle(480, 270, 260, 0x38bdf8, 0.04);
    this.add.circle(480, 270, 160, 0x818cf8, 0.07);

    // 2. Wide Main Floating Stage (Width: 580px, Center: 480, Height: 28px)
    const stageX = 480;
    const stageY = 460;
    const stageW = 580;
    const stageH = 28;

    this.mainStage = this.add.rectangle(stageX, stageY, stageW, stageH, 0x2563eb);
    this.mainStage.setStrokeStyle(3, 0x60a5fa);
    this.physics.add.existing(this.mainStage, true);
    (this.mainStage.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    // Stage decorative high-tech underside
    this.add.polygon(stageX, stageY + 28, [
      -stageW / 2 + 30, 0,
      stageW / 2 - 30, 0,
      stageW / 2 - 120, 65,
      -stageW / 2 + 120, 65
    ], 0x1e3a8a, 0.95);

    // 3. Three Battlefield Soft Platforms (Left, Right, Top)
    // Left platform
    this.leftPlatform = this.add.rectangle(310, 340, 150, 12, 0x38bdf8, 0.9);
    this.leftPlatform.setStrokeStyle(2, 0x7dd3fc);
    this.physics.add.existing(this.leftPlatform, true);
    (this.leftPlatform.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    // Right platform
    this.rightPlatform = this.add.rectangle(650, 340, 150, 12, 0x38bdf8, 0.9);
    this.rightPlatform.setStrokeStyle(2, 0x7dd3fc);
    this.physics.add.existing(this.rightPlatform, true);
    (this.rightPlatform.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    // Top Center platform
    this.topPlatform = this.add.rectangle(480, 220, 150, 12, 0x38bdf8, 0.9);
    this.topPlatform.setStrokeStyle(2, 0x7dd3fc);
    this.physics.add.existing(this.topPlatform, true);
    (this.topPlatform.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    // 4. Create Player & CPU Fighters
    this.player = new Player(this, 350, 380, 'player_tex', 'player');
    this.cpu = new Player(this, 610, 380, 'dummy_tex', 'cpu');

    // Physics Collisions with Platforms
    const platforms = [this.mainStage, this.leftPlatform, this.rightPlatform, this.topPlatform];
    this.physics.add.collider(this.player, platforms);
    this.physics.add.collider(this.cpu, platforms);
    this.physics.add.collider(this.player, this.cpu);

    // Freeze both fighters initially
    this.player.isFrozen = true;
    this.cpu.isFrozen = true;

    // 5. Setup UI & Controls
    this.createHUD();
    this.createVirtualControls();
    this.setupKeyboardInput();

    // 6. Countdown Display Object (Hidden at start)
    this.countdownText = this.add.text(480, 280, '', {
      fontSize: '72px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0);

    // 7. Show Title Screen
    this.createTitleScreen();
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

  update(_time: number, delta: number): void {
    if (this.gameState === 'TITLE') {
      // Allow starting via Space on title screen
      if (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace)) {
        this.startCountdown();
      }
      return;
    }

    if (this.gameState === 'GAMEOVER') return;

    // Update Player & CPU
    this.player.updatePlayer(delta, this.cpu);
    this.cpu.updatePlayer(delta, this.player);

    if (this.gameState === 'PLAYING') {
      // Keyboard input handling (Arrow keys + WASD)
      this.handlePlayerControls();

      // CPU AI Attack handling
      if (this.cpu.cpuWantsAttack && !this.cpuAttacking) {
        const isSmash = Phaser.Math.Between(0, 100) < 35;
        this.executeAttack(this.cpu, this.player, isSmash);
      }

      // Check Out-of-bounds Knockout (Blast Zone)
      this.checkBlastZone(this.player, 350, 200);
      this.checkBlastZone(this.cpu, 610, 200);

      // Update HUD
      this.updateHUD();
    }
  }

  private handlePlayerControls(): void {
    const isLeft = (this.cursors && this.cursors.left.isDown) || (this.keyA && this.keyA.isDown);
    const isRight = (this.cursors && this.cursors.right.isDown) || (this.keyD && this.keyD.isDown);

    this.player.moveLeftInput = isLeft;
    this.player.moveRightInput = isRight;

    // Jump (Up / Space / W)
    const jumpPressed = (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.up)) ||
                        (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace)) ||
                        (this.keyW && Phaser.Input.Keyboard.JustDown(this.keyW));

    if (jumpPressed) {
      this.player.jump();
    }

    // Normal Attack (Z / J)
    const attackPressed = (this.keyZ && Phaser.Input.Keyboard.JustDown(this.keyZ)) ||
                          (this.keyJ && Phaser.Input.Keyboard.JustDown(this.keyJ));

    if (attackPressed) {
      this.executeAttack(this.player, this.cpu, false);
    }

    // Smash Attack (X / K)
    const smashPressed = (this.keyX && Phaser.Input.Keyboard.JustDown(this.keyX)) ||
                         (this.keyK && Phaser.Input.Keyboard.JustDown(this.keyK));

    if (smashPressed) {
      this.executeAttack(this.player, this.cpu, true);
    }
  }

  /**
   * Title Screen Overlay
   */
  private createTitleScreen(): void {
    this.titleContainer = this.add.container(480, 290);

    const backdrop = this.add.rectangle(0, 0, 560, 360, 0x0a0f1d, 0.94);
    backdrop.setStrokeStyle(3, 0x38bdf8);

    const title = this.add.text(0, -110, '⚔️ スマブラ Web ⚔️', {
      fontSize: '34px',
      color: '#38bdf8',
      fontStyle: 'bold',
      stroke: '#0369a1',
      strokeThickness: 4
    }).setOrigin(0.5);

    const desc = this.add.text(0, -55, '相手にダメージを与えて画面外へスマッシュ！\n3ストック先取で勝利！', {
      fontSize: '15px',
      color: '#cbd5e1',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    const guide = this.add.text(0, 15, '🎮 操作方法\n移動: [←/→] または [A/D]\nジャンプ: [Space/↑/W] (2段ジャンプ可)\n攻撃: [Z/J]  |  スマッシュ: [X/K]', {
      fontSize: '14px',
      color: '#94a3b8',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);

    const startBtn = this.add.text(0, 110, '⚔️ 対戦スタート (SPACE / タップ)', {
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#2563eb',
      padding: { x: 26, y: 12 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerdown', () => {
      this.startCountdown();
    });

    this.titleContainer.add([backdrop, title, desc, guide, startBtn]);
  }

  /**
   * Starts the "3, 2, 1, GO!" Countdown Sequence
   */
  private startCountdown(): void {
    if (this.gameState !== 'TITLE') return;
    this.gameState = 'COUNTDOWN';

    // Hide title
    this.tweens.add({
      targets: this.titleContainer,
      alpha: 0,
      scaleX: 0.85,
      scaleY: 0.85,
      duration: 250,
      onComplete: () => {
        this.titleContainer.destroy();
      }
    });

    // Reset fighters
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
        // Countdown finished, begin battle!
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

  /**
   * Executes an attack action.
   */
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

    // Visual slash arc
    const color = isSmash ? 0xef4444 : (isPlayer ? 0x38bdf8 : 0xf59e0b);
    const slashSize = isSmash ? 42 : 28;
    const slash = this.add.circle(attackX, attackY, slashSize, color, 0.85);

    this.tweens.add({
      targets: slash,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: isSmash ? 200 : 130,
      onComplete: () => slash.destroy()
    });

    // Check hit overlap
    const dist = Phaser.Math.Distance.Between(attackX, attackY, defender.x, defender.y);
    if (dist < (isSmash ? 65 : 52)) {
      const dirX = facingRight ? 1 : -1;
      const dirY = isSmash ? -0.85 : -0.45;

      const baseDamage = isSmash ? 16 : 8;
      const baseKnockbackX = dirX * (isSmash ? 340 : 210);
      const baseKnockbackY = dirY * (isSmash ? 360 : 230);

      defender.takeKnockback(baseDamage, baseKnockbackX, baseKnockbackY);

      // Hitstop & Camera Shake
      this.cameras.main.shake(isSmash ? 140 : 60, isSmash ? 0.012 : 0.005);

      // Hit sparks particle effect
      this.createHitSparks(attackX, attackY, isSmash);
    }

    const cooldown = isSmash ? 300 : 160;
    this.time.delayedCall(cooldown, () => {
      if (isPlayer) this.playerAttacking = false;
      else this.cpuAttacking = false;
    });
  }

  private createHitSparks(x: number, y: number, isSmash: boolean): void {
    const count = isSmash ? 12 : 6;
    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(80, isSmash ? 280 : 160);
      const spark = this.add.circle(x, y, Phaser.Math.Between(3, 6), isSmash ? 0xfacc15 : 0xffffff, 1);

      const rad = Phaser.Math.DegToRad(angle);
      const targetX = x + Math.cos(rad) * speed * 0.2;
      const targetY = y + Math.sin(rad) * speed * 0.2;

      this.tweens.add({
        targets: spark,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        duration: 200,
        onComplete: () => spark.destroy()
      });
    }
  }

  /**
   * Checks if fighter has fallen or been launched into the Blast Zone (KO).
   */
  private checkBlastZone(fighter: Player, respawnX: number, respawnY: number): void {
    // 960x600 screen bounds with generous blast zones
    if (fighter.x < -100 || fighter.x > 1060 || fighter.y < -140 || fighter.y > 720) {
      this.triggerBlastEffects(fighter.x, fighter.y);

      fighter.stocks -= 1;

      if (fighter.stocks <= 0) {
        this.handleGameOver(fighter === this.cpu ? 'PLAYER 1 VICTORY! 🎉' : 'GAME OVER 💀');
      } else {
        fighter.setPosition(-300, -300); // Temporarily hide
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
      radius: 140,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy()
    });

    this.cameras.main.shake(260, 0.025);
    this.cameras.main.flash(200, 255, 255, 255, true);
  }

  private handleGameOver(winnerText: string): void {
    this.gameState = 'GAMEOVER';

    this.gameOverContainer = this.add.container(480, 300);

    const bg = this.add.rectangle(0, 0, 480, 240, 0x0a0f1d, 0.96);
    bg.setStrokeStyle(3, 0x38bdf8);

    const title = this.add.text(0, -55, winnerText, {
      fontSize: '34px',
      color: winnerText.includes('VICTORY') ? '#4ade80' : '#f87171',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sub = this.add.text(0, 0, '対戦終了！ もう一度プレイしますか？', {
      fontSize: '16px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    const retryBtn = this.add.text(0, 60, '🔄 もう一度対戦する', {
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#2563eb',
      padding: { x: 24, y: 12 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerdown', () => {
      this.scene.restart();
    });

    this.gameOverContainer.add([bg, title, sub, retryBtn]);
  }

  private createVirtualControls(): void {
    // 1. Left Movement (◀)
    this.createButton(90, 520, 72, '◀', '#38bdf8', {
      onDown: () => { if (this.gameState === 'PLAYING') this.player.moveLeftInput = true; },
      onUp: () => { this.player.moveLeftInput = false; }
    });

    // 2. Right Movement (▶)
    this.createButton(185, 520, 72, '▶', '#38bdf8', {
      onDown: () => { if (this.gameState === 'PLAYING') this.player.moveRightInput = true; },
      onUp: () => { this.player.moveRightInput = false; }
    });

    // 3. Attack (⚔️)
    this.createButton(680, 520, 66, '⚔️', '#3b82f6', {
      onDown: () => { if (this.gameState === 'PLAYING') this.executeAttack(this.player, this.cpu, false); }
    });

    // 4. Smash Attack (💥)
    this.createButton(770, 520, 66, '💥', '#ef4444', {
      onDown: () => { if (this.gameState === 'PLAYING') this.executeAttack(this.player, this.cpu, true); }
    });

    // 5. Jump (⬆️)
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

    // Stage Header
    const title = this.add.text(480, 20, '⚔️ スマブラ Web - BATTLEFIELD ⚔️', {
      fontSize: '18px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Player 1 HUD Box (Left)
    const p1Box = this.add.rectangle(170, 85, 230, 60, 0x0f172a, 0.88).setStrokeStyle(2, 0x38bdf8);
    const p1Label = this.add.text(90, 68, 'P1 HERO', { fontSize: '13px', color: '#38bdf8', fontStyle: 'bold' });
    this.playerStockText = this.add.text(90, 88, '● ● ●', { fontSize: '15px', color: '#facc15' });
    this.playerDamageText = this.add.text(245, 85, '0%', { fontSize: '30px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(1, 0.5);

    // CPU Opponent HUD Box (Right)
    const cpuBox = this.add.rectangle(790, 85, 230, 60, 0x0f172a, 0.88).setStrokeStyle(2, 0xf43f5e);
    const cpuLabel = this.add.text(710, 68, 'CPU FIGHTER', { fontSize: '13px', color: '#f43f5e', fontStyle: 'bold' });
    this.cpuStockText = this.add.text(710, 88, '● ● ●', { fontSize: '15px', color: '#facc15' });
    this.cpuDamageText = this.add.text(865, 85, '0%', { fontSize: '30px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(1, 0.5);

    this.hudContainer.add([title, p1Box, p1Label, this.playerStockText, this.playerDamageText, cpuBox, cpuLabel, this.cpuStockText, this.cpuDamageText]);
  }

  private updateHUD(): void {
    // Update Damage %
    this.playerDamageText.setText(`${Math.floor(this.player.damagePercent)}%`);
    this.playerDamageText.setColor(this.getDamageColor(this.player.damagePercent));

    this.cpuDamageText.setText(`${Math.floor(this.cpu.damagePercent)}%`);
    this.cpuDamageText.setColor(this.getDamageColor(this.cpu.damagePercent));

    // Update Stock dots
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

  private createProceduralTextures(): void {
    // 1. Player texture (Blue Hero Body: 32x48)
    if (!this.textures.exists('player_tex')) {
      const gPlayer = this.make.graphics({ x: 0, y: 0 });
      gPlayer.fillStyle(0x38bdf8);
      gPlayer.fillRoundedRect(0, 0, 32, 48, 8);
      gPlayer.fillStyle(0xffffff);
      gPlayer.fillCircle(10, 14, 4);
      gPlayer.fillCircle(22, 14, 4);
      gPlayer.fillStyle(0x0f172a);
      gPlayer.fillCircle(11, 14, 2);
      gPlayer.fillCircle(23, 14, 2);
      gPlayer.fillStyle(0xef4444);
      gPlayer.fillRect(4, 24, 24, 6);
      gPlayer.generateTexture('player_tex', 32, 48);
      gPlayer.destroy();
    }

    // 2. CPU texture (Red Fighter Body: 32x48)
    if (!this.textures.exists('dummy_tex')) {
      const gDummy = this.make.graphics({ x: 0, y: 0 });
      gDummy.fillStyle(0xf43f5e);
      gDummy.fillRoundedRect(0, 0, 32, 48, 8);
      gDummy.fillStyle(0xffffff);
      gDummy.fillCircle(16, 16, 10);
      gDummy.fillStyle(0xf43f5e);
      gDummy.fillCircle(16, 16, 6);
      gDummy.fillStyle(0xffffff);
      gDummy.fillCircle(16, 16, 2);
      gDummy.generateTexture('dummy_tex', 32, 48);
      gDummy.destroy();
    }
  }
}
