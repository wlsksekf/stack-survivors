import { Player } from './Player';
import { DamageText } from './DamageText';

interface MonsterScaling {
  healthMultiplier: number;
  speedMultiplier: number;
}

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
  expYield: number = 2;
  damageTexts: DamageText[] = [];

  constructor(
    x: number,
    y: number,
    type: 'ladybug' | 'caterpillar' | 'bee' | 'spider' = 'ladybug',
    scaling: MonsterScaling = { healthMultiplier: 1, speedMultiplier: 1 }
  ) {
    this.x = x;
    this.y = y;

    switch (type) {
      case 'ladybug':
        this.emoji = '🐞';
        this.speed = 110;
        this.health = 35;
        this.maxHealth = 35;
        this.radius = 12;
        this.damage = 12;
        this.expYield = 2;
        break;
      case 'caterpillar':
        this.emoji = '🐛';
        this.speed = 45;
        this.health = 170;
        this.maxHealth = 170;
        this.radius = 18;
        this.damage = 28;
        this.expYield = 10;
        break;
      case 'bee':
        this.emoji = '🐝';
        this.speed = 195;
        this.health = 20;
        this.maxHealth = 20;
        this.radius = 8;
        this.damage = 7;
        this.expYield = 5;
        break;
      case 'spider':
        this.emoji = '🕷️';
        this.speed = 90;
        this.health = 350;
        this.maxHealth = 350;
        this.radius = 22;
        this.damage = 45;
        this.expYield = 20;
        break;
    }

    this.speed *= scaling.speedMultiplier;
    this.health = Math.ceil(this.health * scaling.healthMultiplier);
    this.maxHealth = Math.ceil(this.maxHealth * scaling.healthMultiplier);
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
    
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      this.damageTexts[i].update(dt);
      if (this.damageTexts[i].lifetime <= 0) {
        this.damageTexts.splice(i, 1);
      }
    }
  }

  takeDamage(amount: number) {
    this.health -= amount;
    this.damageTexts.push(new DamageText(this.x, this.y, amount, false));
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

    this.damageTexts.forEach(dt => dt.draw(ctx));
  }
}
