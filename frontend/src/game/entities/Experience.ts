import { Player } from './Player';
import { checkCircleCollision } from '../engine/physics';

export class Experience {
  x: number;
  y: number;
  radius: number = 4;
  color: string = '#10b981'; // Emerald/Green
  amount: number = 2; // EXP amount given
  isCollected: boolean = false;
  magnetRadius: number = 100;
  speed: number = 300;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, player: Player) {
    // Magnet effect
    let dx = player.x - this.x;
    let dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.magnetRadius) {
      if (distance > 0) {
        dx /= distance;
        dy /= distance;
      }
      this.x += dx * this.speed * dt;
      this.y += dy * this.speed * dt;
    }

    // Check actual collection (collision with player)
    if (checkCircleCollision(this, player)) {
      this.isCollected = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}
