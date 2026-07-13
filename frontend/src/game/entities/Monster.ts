import { Player } from './Player';

export class Monster {
  x: number;
  y: number;
  radius: number = 10;
  speed: number = 100; // pixels per second
  color: string = '#ef4444'; // Red
  damage: number = 10;
  health: number = 30;
  maxHealth: number = 30;
  isDead: boolean = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, player: Player) {
    // Calculate direction towards player
    let dx = player.x - this.x;
    let dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      dx /= distance;
      dy /= distance;
    }

    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;
  }

  takeDamage(amount: number) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();

    // Draw small health bar for monster
    if (this.health < this.maxHealth) {
      const barWidth = 20;
      const barHeight = 3;
      const hpPercent = this.health / this.maxHealth;
      ctx.fillStyle = 'red';
      ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 8, barWidth, barHeight);
      ctx.fillStyle = 'lightgreen';
      ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 8, barWidth * hpPercent, barHeight);
    }
  }
}
