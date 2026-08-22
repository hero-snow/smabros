import Phaser from 'phaser';

export type FighterType = 'player' | 'cpu';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public fighterType: FighterType;
  public damagePercent: number = 0;
  public weight: number = 100;
  public stocks: number = 3;
  public isInvincible: boolean = false;
  public invincibleTimer: number = 0;

  // Jump capabilities
  public canDoubleJump: boolean = true;

  // State flags
  public isCPU: boolean = false;
  public isHitstunned: boolean = false;
  private hitstunTimer: number = 0;

  // Movement Physics parameters (Smash style responsive physics)
  private accelGrounded: number = 2400;
  private accelAir: number = 1200;
  private maxSpeedX: number = 290;
  private dragGrounded: number = 2800; // Fast sharp brake when key released
  private dragAir: number = 400;
  private jumpPower: number = 490;

  // Input states driven by controls or AI
  public moveLeftInput: boolean = false;
  public moveRightInput: boolean = false;

  // CPU AI timers
  private aiActionTimer: number = 0;
  public cpuWantsAttack: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, fighterType: FighterType = 'player') {
    super(scene, x, y, texture);
    this.fighterType = fighterType;
    this.isCPU = fighterType === 'cpu';

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Dynamic body setup
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(false); // Off-stage blast zones handle KO
    body.setBounce(0.05);
    body.setMaxVelocity(900, 1100); // Allow high knockback speeds
    body.setDragX(this.dragGrounded);
  }

  public updatePlayer(delta: number, playerTarget?: Player): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // Handle Invincibility flash
    if (this.isInvincible) {
      this.invincibleTimer -= delta;
      this.setAlpha(Math.floor(Date.now() / 100) % 2 === 0 ? 0.3 : 0.85);
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.setAlpha(1.0);
      }
    }

    // Handle Hitstun status
    if (this.isHitstunned) {
      this.hitstunTimer -= delta;
      this.setTint(0xff4444);
      if (this.hitstunTimer <= 0) {
        this.isHitstunned = false;
        this.clearTint();
      }
      return; // Cannot move while in hitstun
    }

    const isGrounded = body.blocked.down || body.touching.down;

    if (isGrounded) {
      this.canDoubleJump = true;
      body.setDragX(this.dragGrounded);
    } else {
      body.setDragX(this.dragAir);
    }

    // Execute CPU AI Logic if CPU
    if (this.isCPU && playerTarget) {
      this.updateCPUAI(delta, playerTarget, isGrounded);
    }

    // Horizontal Movement Logic with sharp accel/decel
    if (this.moveLeftInput && !this.moveRightInput) {
      const accel = isGrounded ? this.accelGrounded : this.accelAir;
      body.setAccelerationX(-accel);
      this.setFlipX(true);
    } else if (this.moveRightInput && !this.moveLeftInput) {
      const accel = isGrounded ? this.accelGrounded : this.accelAir;
      body.setAccelerationX(accel);
      this.setFlipX(false);
    } else {
      body.setAccelerationX(0);
      // Sharp instant stop on ground if no direction input
      if (isGrounded && Math.abs(body.velocity.x) < 80) {
        body.setVelocityX(0);
      }
    }

    // Cap normal walking/running speed (without capping hitstun knockback)
    if (Math.abs(body.velocity.x) > this.maxSpeedX && !this.isHitstunned) {
      if ((this.moveLeftInput && body.velocity.x < -this.maxSpeedX) ||
          (this.moveRightInput && body.velocity.x > this.maxSpeedX)) {
        body.setVelocityX(Math.sign(body.velocity.x) * this.maxSpeedX);
      }
    }
  }

  public jump(): boolean {
    if (this.isHitstunned) return false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return false;

    const isGrounded = body.blocked.down || body.touching.down;

    if (isGrounded) {
      body.setVelocityY(-this.jumpPower);
      return true;
    } else if (this.canDoubleJump) {
      this.canDoubleJump = false;
      body.setVelocityY(-this.jumpPower * 0.95);
      return true;
    }
    return false;
  }

  public takeKnockback(damage: number, vectorX: number, vectorY: number): void {
    if (this.isInvincible) return;

    this.damagePercent += damage;

    // Smash Bros style knockback formula: scaling exponent with damage percent
    const scaling = 1 + Math.pow(this.damagePercent / 60, 1.25);
    const weightRatio = 100 / Math.max(10, this.weight);

    const finalVx = vectorX * scaling * weightRatio;
    const finalVy = vectorY * scaling * weightRatio;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(finalVx, finalVy);

    // Apply hitstun proportional to damage/knockback magnitude
    const speed = Math.sqrt(finalVx * finalVx + finalVy * finalVy);
    this.isHitstunned = true;
    this.hitstunTimer = Math.min(800, 120 + speed * 0.45);
  }

  public respawn(x: number, y: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setPosition(x, y);
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
    this.damagePercent = 0;
    this.isHitstunned = false;
    this.moveLeftInput = false;
    this.moveRightInput = false;

    // Grant 2.5 seconds invincibility
    this.isInvincible = true;
    this.invincibleTimer = 2500;
  }

  /**
   * CPU AI logic: Pursues target, attacks when close, recovers to stage when off-stage.
   */
  private updateCPUAI(delta: number, target: Player, isGrounded: boolean): void {
    this.aiActionTimer -= delta;
    this.cpuWantsAttack = false;

    const distX = target.x - this.x;
    const distY = target.y - this.y;
    const absDistX = Math.abs(distX);
    const absDistY = Math.abs(distY);

    // 1. Off-stage Recovery Priority (Main stage platform is x=220..580, y=440)
    if (this.x < 200 || this.x > 600 || this.y > 470) {
      if (this.x < 400) {
        this.moveLeftInput = false;
        this.moveRightInput = true;
      } else {
        this.moveLeftInput = true;
        this.moveRightInput = false;
      }

      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body.velocity.y > 20 || this.y > 460) {
        this.jump();
      }
      return;
    }

    // 2. Combat Tactics & Attack Trigger
    if (this.aiActionTimer <= 0) {
      this.aiActionTimer = Phaser.Math.Between(120, 280); // AI reaction speed

      // Move towards player
      if (absDistX > 50) {
        this.moveLeftInput = distX < 0;
        this.moveRightInput = distX > 0;
      } else {
        this.moveLeftInput = false;
        this.moveRightInput = false;
      }

      // Attack if close enough
      if (absDistX < 65 && absDistY < 60) {
        this.cpuWantsAttack = true;
      }

      // Jump if target is above
      if (distY < -70 && isGrounded && Phaser.Math.Between(0, 100) < 70) {
        this.jump();
      }
    }
  }
}
