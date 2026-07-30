import Phaser from 'phaser';
import { Player } from '../entities/Player';

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private dummy!: Player;
  private ground!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private resetKey!: Phaser.Input.Keyboard.Key;

  // HUD Text Elements
  private playerDamageText!: Phaser.GameObjects.Text;
  private dummyDamageText!: Phaser.GameObjects.Text;

  // Attack cooldown flag
  private isAttacking: boolean = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Generate procedural textures so the game runs without external assets
    this.createProceduralTextures();
  }

  create(): void {
    // Enable multi-touch for 3+ simultaneous touch points (add 2 extra pointers)
    this.input.addPointer(2);

    // Background styling
    this.cameras.main.setBackgroundColor('#0f172a');
    this.add.grid(400, 300, 800, 600, 40, 40, 0x1e293b, 0.4, 0x334155, 0.6);

    // Ground Static Body (800x80 px green rectangle)
    const groundX = 400;
    const groundY = 560;
    const groundWidth = 800;
    const groundHeight = 80;

    this.ground = this.add.rectangle(groundX, groundY, groundWidth, groundHeight, 0x2ecc71);
    this.physics.add.existing(this.ground, true);

    // Platform decorative top edge
    this.add.rectangle(groundX, 522, groundWidth, 4, 0x4ade80);

    // Create Main Player (Blue)
    this.player = new Player(this, 250, 450, 'player_tex');
    this.physics.add.collider(this.player, this.ground);

    // Create Opponent Dummy (Red/Orange) to test knockback physics
    this.dummy = new Player(this, 550, 450, 'dummy_tex');
    this.dummy.weight = 90; // Slightly lighter dummy
    this.physics.add.collider(this.dummy, this.ground);

    // Collide player and dummy
    this.physics.add.collider(this.player, this.dummy);

    // Setup HUD UI
    this.createHUD();

    // Create Virtual Touch UI Buttons (Fixed to screen)
    this.createVirtualControls();

    // Setup Keyboard Fallback Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.resetKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    }
  }

  update(): void {
    // Update player internal movement logic
    this.player.update();
    this.dummy.update();

    // Keyboard controls handling
    if (this.cursors) {
      if (this.cursors.left.isDown) {
        this.player.setMoveLeft(true);
      } else if (this.cursors.right.isDown) {
        this.player.setMoveRight(true);
      } else if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
        // Only stop if touch buttons aren't driving it (touch callbacks handle setMoveLeft/Right directly)
      }

      if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        this.player.jump();
      }

      if (this.attackKey && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
        this.executeAttack();
      }

      if (this.resetKey && Phaser.Input.Keyboard.JustDown(this.resetKey)) {
        this.resetPositions();
      }
    }

    // Update HUD texts
    this.updateHUD();
  }

  /**
   * Executes an attack action and applies knockback if overlapping target.
   */
  private executeAttack(): void {
    if (this.isAttacking) return;
    this.isAttacking = true;

    // Determine facing direction (-1 for left, +1 for right)
    const facingRight = !this.player.flipX;
    const attackX = this.player.x + (facingRight ? 40 : -40);
    const attackY = this.player.y;

    // Visual attack effect (slash arc)
    const slash = this.add.circle(attackX, attackY, 30, 0xfacc15, 0.8);
    this.tweens.add({
      targets: slash,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 180,
      onComplete: () => slash.destroy()
    });

    // Check hit overlap with Dummy Target
    const distance = Phaser.Math.Distance.Between(attackX, attackY, this.dummy.x, this.dummy.y);
    if (distance < 50) {
      // Vector calculation: launch dummy away from player
      const dirX = facingRight ? 1 : -1;
      const dirY = -0.7; // Upward angle for Smash launcher trajectory

      const baseKnockbackX = dirX * 220;
      const baseKnockbackY = dirY * 260;
      const baseDamage = 12; // 12% damage per hit

      this.dummy.takeDamageAndKnockback(baseDamage, baseKnockbackX, baseKnockbackY);

      // Hit stop effect
      this.cameras.main.shake(100, 0.005);
    }

    this.time.delayedCall(220, () => {
      this.isAttacking = false;
    });
  }

  /**
   * Creates touch-friendly virtual controls (Left, Right, Jump, Attack).
   */
  private createVirtualControls(): void {
    // 1. Left Movement Button (◀)
    this.createButton(90, 520, 70, '◀', '#38bdf8', {
      onDown: () => this.player.setMoveLeft(true),
      onUp: () => this.player.setMoveLeft(false)
    });

    // 2. Right Movement Button (▶)
    this.createButton(180, 520, 70, '▶', '#38bdf8', {
      onDown: () => this.player.setMoveRight(true),
      onUp: () => this.player.setMoveRight(false)
    });

    // 3. Attack Button (ATTACK)
    this.createButton(620, 520, 70, '⚔️', '#f43f5e', {
      onDown: () => this.executeAttack()
    });

    // 4. Jump Button (JUMP)
    this.createButton(710, 520, 70, '⬆️', '#3b82f6', {
      onDown: () => this.player.jump()
    });
  }

  /**
   * Helper to create interactive UI touch buttons supporting pointerdown, pointerup, pointerout.
   */
  private createButton(
    x: number,
    y: number,
    size: number,
    label: string,
    colorHex: string,
    callbacks: { onDown?: () => void; onUp?: () => void }
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Button Background Circle
    const colorNum = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const bg = this.add.circle(0, 0, size / 2, colorNum, 0.7);
    bg.setStrokeStyle(3, 0xffffff, 0.8);

    // Label
    const text = this.add.text(0, 0, label, {
      fontSize: size > 60 ? '22px' : '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, text]);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });

    // Handle Pointer Down
    bg.on('pointerdown', () => {
      container.setScale(0.9);
      bg.setAlpha(0.95);
      callbacks.onDown?.();
    });

    // Handle Pointer Up & Pointer Out
    const handleRelease = () => {
      container.setScale(1.0);
      bg.setAlpha(0.7);
      callbacks.onUp?.();
    };

    bg.on('pointerup', handleRelease);
    bg.on('pointerout', handleRelease);

    return container;
  }

  /**
   * HUD displaying Damage % for Player and Dummy.
   */
  private createHUD(): void {
    // Title
    this.add.text(400, 25, '⚔️ スマブラ Web - スマホ＆マルチタッチ対応 ⚔️', {
      fontSize: '18px',
      color: '#94a3b8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instructions
    this.add.text(400, 52, 'ボタンまたは キーボード(矢印キー / Z:攻撃 / Space:ジャンプ) で操作できます', {
      fontSize: '13px',
      color: '#64748b'
    }).setOrigin(0.5);

    // Player Damage Meter Box
    this.add.rectangle(140, 100, 180, 50, 0x1e293b, 0.8).setStrokeStyle(2, 0x38bdf8);
    this.add.text(140, 86, 'PLAYER 1', { fontSize: '12px', color: '#38bdf8', fontStyle: 'bold' }).setOrigin(0.5);
    this.playerDamageText = this.add.text(140, 110, '0%', { fontSize: '24px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(0.5);

    // Dummy Damage Meter Box
    this.add.rectangle(660, 100, 180, 50, 0x1e293b, 0.8).setStrokeStyle(2, 0xf43f5e);
    this.add.text(660, 86, 'TARGET DUMMY', { fontSize: '12px', color: '#f43f5e', fontStyle: 'bold' }).setOrigin(0.5);
    this.dummyDamageText = this.add.text(660, 110, '0%', { fontSize: '24px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(0.5);

    // Reset instruction button / text
    const resetText = this.add.text(400, 90, '🔄 位置リセット (R)', {
      fontSize: '13px',
      color: '#facc15',
      backgroundColor: '#1e293b',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resetText.on('pointerdown', () => this.resetPositions());
  }

  private updateHUD(): void {
    // Player damage text update
    this.playerDamageText.setText(`${Math.floor(this.player.damagePercent)}%`);
    this.playerDamageText.setColor(this.getDamageColor(this.player.damagePercent));

    // Dummy damage text update
    this.dummyDamageText.setText(`${Math.floor(this.dummy.damagePercent)}%`);
    this.dummyDamageText.setColor(this.getDamageColor(this.dummy.damagePercent));
  }

  private getDamageColor(damagePercent: number): string {
    if (damagePercent < 40) return '#2ecc71'; // Green
    if (damagePercent < 80) return '#f1c40f'; // Yellow
    if (damagePercent < 130) return '#e67e22'; // Orange
    if (damagePercent < 180) return '#e74c3c'; // Red
    return '#a855f7'; // Purple / High Knockback Danger
  }

  private resetPositions(): void {
    this.player.setPosition(250, 450);
    this.player.setVelocity(0, 0);

    this.dummy.setPosition(550, 450);
    this.dummy.setVelocity(0, 0);
    this.dummy.resetDamage();
  }

  /**
   * Procedurally generates textures for Player and Target Dummy graphics.
   */
  private createProceduralTextures(): void {
    // 1. Player texture (Blue Hero Body: 32x48)
    const gPlayer = this.make.graphics({ x: 0, y: 0 });
    gPlayer.fillStyle(0x38bdf8);
    gPlayer.fillRoundedRect(0, 0, 32, 48, 8);
    gPlayer.fillStyle(0xffffff);
    gPlayer.fillCircle(10, 14, 4); // Eye Left
    gPlayer.fillCircle(22, 14, 4); // Eye Right
    gPlayer.fillStyle(0x0f172a);
    gPlayer.fillCircle(11, 14, 2);
    gPlayer.fillCircle(23, 14, 2);
    gPlayer.fillStyle(0xef4444);
    gPlayer.fillRect(4, 24, 24, 6); // Hero Belt
    gPlayer.generateTexture('player_tex', 32, 48);

    // 2. Dummy texture (Red Target Body: 32x48)
    const gDummy = this.make.graphics({ x: 0, y: 0 });
    gDummy.fillStyle(0xf43f5e);
    gDummy.fillRoundedRect(0, 0, 32, 48, 8);
    gDummy.fillStyle(0xffffff);
    gDummy.fillCircle(16, 16, 10); // Target Eye
    gDummy.fillStyle(0xf43f5e);
    gDummy.fillCircle(16, 16, 6);
    gDummy.fillStyle(0xffffff);
    gDummy.fillCircle(16, 16, 2);
    gDummy.generateTexture('dummy_tex', 32, 48);
  }
}
