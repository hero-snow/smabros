import Phaser from 'phaser';
import { CharacterData } from '../data/characters';

export type FighterType = 'player' | 'cpu';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public fighterType: FighterType;
  public charData: CharacterData;

  public damagePercent: number = 0;
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

  // Input states driven by controls or AI
  public moveLeftInput: boolean = false;
  public moveRightInput: boolean = false;

  // CPU AI timers
  private aiActionTimer: number = 0;
  public cpuWantsAttack: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, charData: CharacterData, fighterType: FighterType = 'player') {
    super(scene, x, y, charData.texture);
    this.fighterType = fighterType;
    this.charData = charData;
    this.isCPU = fighterType === 'cpu';

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set sprite dimensions & physics body size
    this.setDisplaySize(64, 64);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(48, 60);
    body.setOffset(8, 4);
    body.setCollideWorldBounds(false); // Blast zones handle KO
    body.setBounce(0);
    body.setMaxVelocity(1400, 1600); // Allow high smash knockback
    body.setDragX(0);
  }

  public updatePlayer(delta: number, playerTarget?: Player): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    if (this.isFrozen) {
      body.setVelocity(0, 0);
      body.setAcceleration(0, 0);
      return;
    }

    // Invincibility flashing
    if (this.isInvincible) {
      this.invincibleTimer -= delta;
      this.setAlpha(Math.floor(Date.now() / 90) % 2 === 0 ? 0.35 : 0.9);
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.setAlpha(1.0);
      }
    }

    // Hitstun status
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

    // CPU AI
    if (this.isCPU && playerTarget) {
      this.updateCPUAI(delta, playerTarget, isGrounded);
    }

    // Character-specific speeds
    const runSpeed = this.charData.stats.speed;
    const airSpeed = this.charData.stats.airSpeed;

    if (this.moveLeftInput && !this.moveRightInput) {
      const speed = isGrounded ? runSpeed : airSpeed;
      body.setVelocityX(-speed);
      this.setFlipX(true);
    } else if (this.moveRightInput && !this.moveLeftInput) {
      const speed = isGrounded ? runSpeed : airSpeed;
      body.setVelocityX(speed);
      this.setFlipX(false);
    } else {
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
    const jumpPower = this.charData.stats.jumpPower;

    if (isGrounded) {
      body.setVelocityY(-jumpPower);
      return true;
    } else if (this.canDoubleJump) {
      this.canDoubleJump = false;
      body.setVelocityY(-jumpPower * 0.92);
      return true;
    }
    return false;
  }

  public takeKnockback(damage: number, vectorX: number, vectorY: number): void {
    if (this.isInvincible || this.isFrozen) return;

    this.damagePercent += damage;

    const scaling = 1 + Math.pow(this.damagePercent / 55, 1.3);
    const weightRatio = 100 / Math.max(10, this.charData.stats.weight);

    const finalVx = vectorX * scaling * weightRatio;
    const finalVy = vectorY * scaling * weightRatio;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(finalVx, finalVy);

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

    this.isInvincible = true;
    this.invincibleTimer = 2500;
  }

  private updateCPUAI(delta: number, target: Player, isGrounded: boolean): void {
    this.aiActionTimer -= delta;
    this.cpuWantsAttack = false;

    const distX = target.x - this.x;
    const distY = target.y - this.y;
    const absDistX = Math.abs(distX);
    const absDistY = Math.abs(distY);

    // Off-stage Recovery
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

    if (this.aiActionTimer <= 0) {
      this.aiActionTimer = Phaser.Math.Between(100, 240);

      if (absDistX > 55) {
        this.moveLeftInput = distX < 0;
        this.moveRightInput = distX > 0;
      } else {
        this.moveLeftInput = false;
        this.moveRightInput = false;
      }

      if (absDistX < 70 && absDistY < 65) {
        this.cpuWantsAttack = true;
      }

      if (distY < -80 && isGrounded && Phaser.Math.Between(0, 100) < 65) {
        this.jump();
      }
    }
  }
}
