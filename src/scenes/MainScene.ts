import Phaser from 'phaser';
import { Player } from '../entities/Player';

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private cpu!: Player;
  private mainStage!: Phaser.GameObjects.Rectangle;
  private leftPlatform!: Phaser.GameObjects.Rectangle;
  private rightPlatform!: Phaser.GameObjects.Rectangle;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private smashKey!: Phaser.Input.Keyboard.Key;

  // HUD Elements
  private playerDamageText!: Phaser.GameObjects.Text;
  private cpuDamageText!: Phaser.GameObjects.Text;
  private playerStockText!: Phaser.GameObjects.Text;
  private cpuStockText!: Phaser.GameObjects.Text;

  private gameOverContainer!: Phaser.GameObjects.Container;
  private isGameOver: boolean = false;

  // Attack cooldowns
  private playerAttacking: boolean = false;
  private cpuAttacking: boolean = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    this.createProceduralTextures();
  }

  create(): void {
    this.isGameOver = false;
    this.playerAttacking = false;
    this.cpuAttacking = false;

    // Enable multi-touch for mobile
    this.input.addPointer(3);

    // Dynamic Space / Stage Background
    this.cameras.main.setBackgroundColor('#0b0f19');
    this.add.grid(400, 300, 800, 600, 40, 40, 0x1e293b, 0.3, 0x334155, 0.5);

    // Decorative background sun/ring
    this.add.circle(400, 260, 200, 0x38bdf8, 0.04);
    this.add.circle(400, 260, 120, 0x818cf8, 0.08);

    // 1. Floating Main Stage Platform (400x24 px at Center)
    const stageX = 400;
    const stageY = 440;
    const stageW = 420;
    const stageH = 24;

    this.mainStage = this.add.rectangle(stageX, stageY, stageW, stageH, 0x3b82f6);
    this.mainStage.setStrokeStyle(3, 0x60a5fa);
    this.physics.add.existing(this.mainStage, true);
    (this.mainStage.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    // Stage decorative bottom detail
    this.add.polygon(stageX, stageY + 25, [
      -stageW / 2 + 20, 0,
      stageW / 2 - 20, 0,
      stageW / 2 - 80, 50,
      -stageW / 2 + 80, 50
    ], 0x1e3a8a, 0.9);

    // 2. Side Passing Platforms (Left & Right)
    this.leftPlatform = this.add.rectangle(240, 330, 130, 10, 0x38bdf8, 0.85);
    this.leftPlatform.setStrokeStyle(2, 0x7dd3fc);
    this.physics.add.existing(this.leftPlatform, true);
    (this.leftPlatform.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    this.rightPlatform = this.add.rectangle(560, 330, 130, 10, 0x38bdf8, 0.85);
    this.rightPlatform.setStrokeStyle(2, 0x7dd3fc);
    this.physics.add.existing(this.rightPlatform, true);
    (this.rightPlatform.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    // Create Player 1 (Blue Hero)
    this.player = new Player(this, 300, 350, 'player_tex', 'player');
    this.physics.add.collider(this.player, this.mainStage);
    this.physics.add.collider(this.player, this.leftPlatform);
    this.physics.add.collider(this.player, this.rightPlatform);

    // Create CPU Opponent (Red/Orange Fighter)
    this.cpu = new Player(this, 500, 350, 'dummy_tex', 'cpu');
    this.physics.add.collider(this.cpu, this.mainStage);
    this.physics.add.collider(this.cpu, this.leftPlatform);
    this.physics.add.collider(this.cpu, this.rightPlatform);

    // Collide player and cpu
    this.physics.add.collider(this.player, this.cpu);

    // Setup HUD UI
    this.createHUD();

    // Virtual Touch Controls (Mobile Friendly)
    this.createVirtualControls();

    // Keyboard controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.smashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    }
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;

    // Update Player & CPU Physics logic
    this.player.updatePlayer(delta, this.cpu);
    this.cpu.updatePlayer(delta, this.player);

    // Handle Player Keyboard Controls
    if (this.cursors) {
      this.player.moveLeftInput = this.cursors.left.isDown;
      this.player.moveRightInput = this.cursors.right.isDown;

      if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        this.player.jump();
      }

      if (this.attackKey && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
        this.executeAttack(this.player, this.cpu, false);
      }

      if (this.smashKey && Phaser.Input.Keyboard.JustDown(this.smashKey)) {
        this.executeAttack(this.player, this.cpu, true);
      }
    }

    // Handle CPU AI Attack Request
    if (this.cpu.cpuWantsAttack && !this.cpuAttacking) {
      const isSmash = Phaser.Math.Between(0, 100) < 35;
      this.executeAttack(this.cpu, this.player, isSmash);
    }

    // Check Blast Zone Knockout (Screen Boundary Out)
    this.checkBlastZone(this.player, 300, 250);
    this.checkBlastZone(this.cpu, 500, 250);

    // Update UI HUD
    this.updateHUD();
  }

  /**
   * Executes an attack (Normal or Smash) from attacker to defender.
   */
  private executeAttack(attacker: Player, defender: Player, isSmash: boolean): void {
    const isPlayer = attacker === this.player;
    if (isPlayer && this.playerAttacking) return;
    if (!isPlayer && this.cpuAttacking) return;

    if (isPlayer) this.playerAttacking = true;
    else this.cpuAttacking = true;

    const facingRight = !attacker.flipX;
    const attackRange = isSmash ? 55 : 42;
    const attackX = attacker.x + (facingRight ? attackRange : -attackRange);
    const attackY = attacker.y;

    // Attack Slash Visual Effect
    const color = isSmash ? 0xef4444 : (isPlayer ? 0x38bdf8 : 0xf59e0b);
    const slashSize = isSmash ? 38 : 26;
    const slash = this.add.circle(attackX, attackY, slashSize, color, 0.85);

    this.tweens.add({
      targets: slash,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: isSmash ? 220 : 140,
      onComplete: () => slash.destroy()
    });

    // Check hit overlap
    const dist = Phaser.Math.Distance.Between(attackX, attackY, defender.x, defender.y);
    if (dist < (isSmash ? 60 : 48)) {
      const dirX = facingRight ? 1 : -1;
      const dirY = isSmash ? -0.85 : -0.5;

      const baseDamage = isSmash ? 16 : 8;
      const baseKnockbackX = dirX * (isSmash ? 320 : 200);
      const baseKnockbackY = dirY * (isSmash ? 340 : 220);

      defender.takeKnockback(baseDamage, baseKnockbackX, baseKnockbackY);

      // Hitstop and Camera Shake
      this.cameras.main.shake(isSmash ? 140 : 60, isSmash ? 0.012 : 0.005);

      // Hit sparks particle effect
      this.createHitSparks(attackX, attackY, isSmash);
    }

    const cooldown = isSmash ? 320 : 180;
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
   * Checks if fighter has been launched outside the Blast Zone (KO).
   */
  private checkBlastZone(fighter: Player, respawnX: number, respawnY: number): void {
    // Blast zone bounds: X < -70 || X > 870 || Y < -110 || Y > 690
    if (fighter.x < -70 || fighter.x > 870 || fighter.y < -110 || fighter.y > 690) {
      // Trigger Blast KO Effects
      this.triggerBlastEffects(fighter.x, fighter.y);

      fighter.stocks -= 1;

      if (fighter.stocks <= 0) {
        this.handleGameOver(fighter === this.cpu ? 'PLAYER 1 VICTORY! 🎉' : 'GAME OVER 💀');
      } else {
        // Respawn after short delay
        fighter.setPosition(-200, -200); // Hide off-screen temporarily
        this.time.delayedCall(1000, () => {
          if (!this.isGameOver) {
            fighter.respawn(respawnX, respawnY);
          }
        });
      }
    }
  }

  private triggerBlastEffects(x: number, y: number): void {
    // Clamp explosion location near screen edge for visibility
    const clampX = Phaser.Math.Clamp(x, 20, 780);
    const clampY = Phaser.Math.Clamp(y, 20, 580);

    // Explosive Flash Ring
    const ring = this.add.circle(clampX, clampY, 20, 0xef4444, 0.9);
    ring.setStrokeStyle(6, 0xfacc15);

    this.tweens.add({
      targets: ring,
      radius: 120,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy()
    });

    this.cameras.main.shake(250, 0.025);
    this.cameras.main.flash(200, 255, 255, 255, true);
  }

  private handleGameOver(winnerText: string): void {
    this.isGameOver = true;

    this.gameOverContainer = this.add.container(400, 300);

    const bg = this.add.rectangle(0, 0, 440, 220, 0x0f172a, 0.95);
    bg.setStrokeStyle(3, 0x38bdf8);

    const title = this.add.text(0, -50, winnerText, {
      fontSize: '32px',
      color: winnerText.includes('VICTORY') ? '#4ade80' : '#f87171',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sub = this.add.text(0, 0, '対戦終了！ もう一度プレイしますか？', {
      fontSize: '16px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    const retryBtn = this.add.text(0, 55, '🔄 もう一度対戦する', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#2563eb',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerdown', () => {
      this.scene.restart();
    });

    this.gameOverContainer.add([bg, title, sub, retryBtn]);
  }

  private createVirtualControls(): void {
    // 1. Left Movement (◀)
    this.createButton(80, 520, 68, '◀', '#38bdf8', {
      onDown: () => { this.player.moveLeftInput = true; },
      onUp: () => { this.player.moveLeftInput = false; }
    });

    // 2. Right Movement (▶)
    this.createButton(165, 520, 68, '▶', '#38bdf8', {
      onDown: () => { this.player.moveRightInput = true; },
      onUp: () => { this.player.moveRightInput = false; }
    });

    // 3. Attack (⚔️)
    this.createButton(560, 520, 64, '⚔️', '#3b82f6', {
      onDown: () => this.executeAttack(this.player, this.cpu, false)
    });

    // 4. Smash Attack (💥)
    this.createButton(640, 520, 64, '💥', '#ef4444', {
      onDown: () => this.executeAttack(this.player, this.cpu, true)
    });

    // 5. Jump (⬆️)
    this.createButton(725, 520, 68, '⬆️', '#10b981', {
      onDown: () => this.player.jump()
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
      fontSize: '20px',
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
    // Stage Title
    this.add.text(400, 20, '⚔️ スマブラ Web - 本格対戦モード ⚔️', {
      fontSize: '18px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Controls tip
    this.add.text(400, 44, '操作: [←/→]移動 [Space/↑]2段ジャンプ [Z]攻撃 [X]スマッシュ攻撃', {
      fontSize: '12px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Player 1 HUD Box
    this.add.rectangle(150, 95, 200, 56, 0x0f172a, 0.85).setStrokeStyle(2, 0x38bdf8);
    this.add.text(80, 80, 'P1 HERO', { fontSize: '12px', color: '#38bdf8', fontStyle: 'bold' });
    this.playerStockText = this.add.text(80, 98, '● ● ●', { fontSize: '14px', color: '#facc15' });
    this.playerDamageText = this.add.text(215, 95, '0%', { fontSize: '28px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(1, 0.5);

    // CPU Opponent HUD Box
    this.add.rectangle(650, 95, 200, 56, 0x0f172a, 0.85).setStrokeStyle(2, 0xf43f5e);
    this.add.text(580, 80, 'CPU FIGHTER', { fontSize: '12px', color: '#f43f5e', fontStyle: 'bold' });
    this.cpuStockText = this.add.text(580, 98, '● ● ●', { fontSize: '14px', color: '#facc15' });
    this.cpuDamageText = this.add.text(715, 95, '0%', { fontSize: '28px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(1, 0.5);
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
