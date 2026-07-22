import { getMovementVector } from '../engine/input';
import { DamageText } from './DamageText';

export class Player {
  x: number;
  y: number;
  radius: number = 11;
  speed: number = 200; // pixels per second
  color: string = '#3b82f6'; // Blue
  health: number = 100;
  maxHealth: number = 100;
  damageTexts: DamageText[] = [];
  damageCooldown: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, _canvasWidth: number, _canvasHeight: number) {
    if (this.damageCooldown > 0) {
      this.damageCooldown -= dt;
    }

    const { x: dx, y: dy } = getMovementVector();
    
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
    if (amount <= 0 || this.damageCooldown > 0) return;
    this.health -= amount;
    this.damageTexts.push(new DamageText(this.x, this.y, amount, true));
    this.damageCooldown = 0.2; // 0.2 seconds of i-frames
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
    
    this.damageTexts.forEach(dt => dt.draw(ctx));
  }
}
