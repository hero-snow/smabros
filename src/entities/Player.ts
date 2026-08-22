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
  public isFrozen: boolean = false; // Frozen during countdown
  private hitstunTimer: number = 0;

  // Movement Physics parameters (Smash Bros snappy velocity parameters)
  private runSpeed: number = 320;
  private airSpeed: number = 270;
  private jumpPower: number = 520;

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
    body.setBounce(0);
    body.setMaxVelocity(1200, 1400); // Allow intense smash knockback
    body.setDragX(0); // Directly controlled by snappy velocity logic
  }

  public updatePlayer(delta: number, playerTarget?: Player): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    if (this.isFrozen) {
      body.setVelocity(0, 0);
      body.setAcceleration(0, 0);
      return;
    }

    // Handle Invincibility flash
    if (this.isInvincible) {
      this.invincibleTimer -= delta;
      this.setAlpha(Math.floor(Date.now() / 100) % 2 === 0 ? 0.3 : 0.85);
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.setAlpha(1.0);
      }
    }

    // Handle Hitstun status (cannot move or attack while hitstunned)
    if (this.isHitstunned) {
      this.hitstunTimer -= delta;
      this.setTint(0xff3333);
      if (this.hitstunTimer <= 0) {
        this.isHitstunned = false;
        this.clearTint();
      }
      return;
    }

    const isGrounded = body.blocked.down || body.touching.down;

    if (isGrounded) {
      this.canDoubleJump = true;
    }

    // Execute CPU AI Logic if CPU
    if (this.isCPU && playerTarget) {
      this.updateCPUAI(delta, playerTarget, isGrounded);
    }

    // Snappy Horizontal Movement: Direct Velocity Control
    if (this.moveLeftInput && !this.moveRightInput) {
      const speed = isGrounded ? this.runSpeed : this.airSpeed;
      body.setVelocityX(-speed);
      this.setFlipX(true);
    } else if (this.moveRightInput && !this.moveLeftInput) {
      const speed = isGrounded ? this.runSpeed : this.airSpeed;
      body.setVelocityX(speed);
      this.setFlipX(false);
    } else {
      // Immediate responsive stop on ground, smooth inertia decay in air
      if (isGrounded) {
        body.setVelocityX(0);
      } else {
        body.setVelocityX(body.velocity.x * 0.94);
      }
    }
  }

  public jump(): boolean {
    if (this.isHitstunned || this.isFrozen) return false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return false;

    const isGrounded = body.blocked.down || body.touching.down;

    if (isGrounded) {
      body.setVelocityY(-this.jumpPower);
      return true;
    } else if (this.canDoubleJump) {
      this.canDoubleJump = false;
      body.setVelocityY(-this.jumpPower * 0.92);
      return true;
    }
    return false;
  }

  public takeKnockback(damage: number, vectorX: number, vectorY: number): void {
    if (this.isInvincible || this.isFrozen) return;

    this.damagePercent += damage;

    // Smash Bros style knockback formula: scaling exponent with damage percent
    const scaling = 1 + Math.pow(this.damagePercent / 55, 1.3);
    const weightRatio = 100 / Math.max(10, this.weight);

    const finalVx = vectorX * scaling * weightRatio;
    const finalVy = vectorY * scaling * weightRatio;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(finalVx, finalVy);

    // Apply hitstun proportional to damage/knockback magnitude
    const speed = Math.sqrt(finalVx * finalVx + finalVy * finalVy);
    this.isHitstunned = true;
    this.hitstunTimer = Math.min(850, 140 + speed * 0.45);
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
   * CPU AI logic for 960px wide Battlefield stage.
   * Main Stage is centered at X=480, Width=580 (Left edge=190, Right edge=770, Y=450).
   */
  private updateCPUAI(delta: number, target: Player, isGrounded: boolean): void {
    this.aiActionTimer -= delta;
    this.cpuWantsAttack = false;

    const distX = target.x - this.x;
    const distY = target.y - this.y;
    const absDistX = Math.abs(distX);
    const absDistY = Math.abs(distY);

    // 1. Off-stage Recovery Priority (Main stage is X=190..770, Y=450)
    if (this.x < 190 || this.x > 770 || this.y > 480) {
      if (this.x < 480) {
        this.moveLeftInput = false;
        this.moveRightInput = true;
      } else {
        this.moveLeftInput = true;
        this.moveRightInput = false;
      }

      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body.velocity.y > 10 || this.y > 470) {
        this.jump();
      }
      return;
    }

    // 2. Combat Tactics & Attack Trigger
    if (this.aiActionTimer <= 0) {
      this.aiActionTimer = Phaser.Math.Between(100, 240); // Fast reaction speed

      // Move towards player
      if (absDistX > 55) {
        this.moveLeftInput = distX < 0;
        this.moveRightInput = distX > 0;
      } else {
        this.moveLeftInput = false;
        this.moveRightInput = false;
      }

      // Attack if in melee range
      if (absDistX < 70 && absDistY < 65) {
        this.cpuWantsAttack = true;
      }

      // Jump if target is on higher platforms
      if (distY < -80 && isGrounded && Phaser.Math.Between(0, 100) < 65) {
        this.jump();
      }
    }
  }
}
