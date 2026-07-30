import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public damagePercent: number = 0;
  public weight: number = 100;

  private isMovingLeft: boolean = false;
  private isMovingRight: boolean = false;
  private moveSpeed: number = 220;
  private jumpPower: number = 420;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string | Phaser.Textures.Texture = 'player') {
    super(scene, x, y, texture);

    // Add this sprite to the scene and physics world
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Physics body configuration
    this.setCollideWorldBounds(true);
    this.setBounce(0.1);
    this.setDragX(600); // Friction when not actively moving
  }

  /**
   * Applies damage and calculates knockback velocity proportional to current damage percent.
   */
  public takeDamageAndKnockback(damage: number, vectorX: number, vectorY: number): void {
    // 1. Add damage
    this.damagePercent += damage;

    // 2. Calculate knockback velocity based on updated damagePercent and weight
    // Base multiplier scaling with damage percentage (e.g. at 0% -> x1.0, at 100% -> x2.8, at 200% -> x4.6)
    const damageMultiplier = 1 + (this.damagePercent / 100) * 1.8;
    const weightFactor = 100 / Math.max(1, this.weight);

    const calculatedX = vectorX * damageMultiplier * weightFactor;
    const calculatedY = vectorY * damageMultiplier * weightFactor;

    // 3. Apply knockback velocity physically
    this.setVelocity(calculatedX, calculatedY);
  }

  public setMoveLeft(active: boolean): void {
    this.isMovingLeft = active;
  }

  public setMoveRight(active: boolean): void {
    this.isMovingRight = active;
  }

  public jump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Only jump if touching ground or standing on a static body
    if (body && (body.blocked.down || body.touching.down)) {
      this.setVelocityY(-this.jumpPower);
    }
  }

  public update(): void {
    // Handle horizontal movement from input state
    if (this.isMovingLeft && !this.isMovingRight) {
      this.setVelocityX(-this.moveSpeed);
      this.setFlipX(true);
    } else if (this.isMovingRight && !this.isMovingLeft) {
      this.setVelocityX(this.moveSpeed);
      this.setFlipX(false);
    }
  }

  public resetDamage(): void {
    this.damagePercent = 0;
  }
}
