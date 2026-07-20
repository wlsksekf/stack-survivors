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
  emoji: string = '🐞'; // Default emoji

  constructor(x: number, y: number, type: 'ladybug' | 'caterpillar' | 'bee' | 'spider' = 'ladybug') {
    this.x = x;
    this.y = y;

    switch (type) {
      case 'ladybug':
        this.emoji = '🐞';
        this.speed = 100;
        this.health = 30;
        this.maxHealth = 30;
        this.radius = 12;
        this.damage = 10;
        break;
      case 'caterpillar':
        this.emoji = '🐛';
        this.speed = 40;
        this.health = 150;
        this.maxHealth = 150;
        this.radius = 18;
        this.damage = 25;
        break;
      case 'bee':
        this.emoji = '🐝';
        this.speed = 180;
        this.health = 15;
        this.maxHealth = 15;
        this.radius = 8;
        this.damage = 5;
        break;
      case 'spider':
        this.emoji = '🕷️';
        this.speed = 80;
        this.health = 300;
        this.maxHealth = 300;
        this.radius = 22;
        this.damage = 40;
        break;
    }
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
    // Draw Emoji instead of circle
    ctx.font = `${this.radius * 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, this.x, this.y);

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
