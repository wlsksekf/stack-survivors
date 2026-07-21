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

  constructor(x: number, y: number, amount: number = 2) {
    this.x = x;
    this.y = y;
    this.amount = amount;
    
    if (this.amount >= 20) {
      this.color = '#ef4444'; // Red
      this.radius = 8;
    } else if (this.amount >= 10) {
      this.color = '#f59e0b'; // Orange
      this.radius = 6;
    } else if (this.amount >= 5) {
      this.color = '#3b82f6'; // Blue
      this.radius = 5;
    } else {
      this.color = '#10b981'; // Green
      this.radius = 4;
    }
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
