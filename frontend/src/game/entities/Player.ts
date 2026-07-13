import { getMovementVector } from '../engine/input';

export class Player {
  x: number;
  y: number;
  radius: number = 15;
  speed: number = 200; // pixels per second
  color: string = '#3b82f6'; // Blue
  health: number = 100;
  maxHealth: number = 100;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, canvasWidth: number, canvasHeight: number) {
    const { x: dx, y: dy } = getMovementVector();
    
    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;

    // Constrain to canvas
    this.x = Math.max(this.radius, Math.min(this.x, canvasWidth - this.radius));
    this.y = Math.max(this.radius, Math.min(this.y, canvasHeight - this.radius));
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();

    // Draw health bar
    const barWidth = 40;
    const barHeight = 5;
    const healthPercent = this.health / this.maxHealth;
    
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 15, barWidth, barHeight);
    
    ctx.fillStyle = 'green';
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 15, barWidth * healthPercent, barHeight);
  }
}
