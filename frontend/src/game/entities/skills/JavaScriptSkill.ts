import { Monster } from '../Monster';
import { Player } from '../Player';
import type { IProjectile } from './IProjectile';

export class JavaScriptSkill implements IProjectile {
  orbitRadius: number = 100;
  color: string = '#f7df1e'; // Yellow JS logo
  damage: number = 10;
  isDead: boolean = false;
  hitCooldowns: Map<Monster, number> = new Map();
  
  texts: { angle: number, speed: number, radiusOffset: number }[] = [];

  // Used for collision calculation
  x: number = 0;
  y: number = 0;

  constructor(_angleOffset: number, level: number) {
    this.setLevel(level);
    
    // Create 3 floating texts initially
    for(let i=0; i<3; i++) {
      this.texts.push({
        angle: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 2, // rads per sec
        radiusOffset: Math.random() * 20 - 10
      });
    }
  }

  setLevel(level: number) {
    this.orbitRadius = 100 + level * 15;
    this.damage = 10 + level * 3;
  }

  update(dt: number, monsters: Monster[], player: Player) {
    this.x = player.x;
    this.y = player.y;

    // Update floating texts
    for (const t of this.texts) {
      t.angle += t.speed * dt;
    }

    // Update cooldowns
    for (const [m, cd] of this.hitCooldowns.entries()) {
      if (cd - dt <= 0) {
        this.hitCooldowns.delete(m);
      } else {
        this.hitCooldowns.set(m, cd - dt);
      }
    }

    // Aura Hit enemies
    for (const m of monsters) {
      if (!m.isDead && !this.hitCooldowns.has(m)) {
        const dist = Math.hypot(m.x - this.x, m.y - this.y);
        if (dist <= this.orbitRadius) {
          m.takeDamage(this.damage);
          this.hitCooldowns.set(m, 0.5); // Can hit same monster every 0.5s
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw the aura circle lightly
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.orbitRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(247, 223, 30, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(247, 223, 30, 0.3)';
    ctx.stroke();
    ctx.closePath();

    // Draw floating texts
    ctx.font = `bold 16px sans-serif`;
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;

    for (const t of this.texts) {
      const tx = this.x + Math.cos(t.angle) * (this.orbitRadius + t.radiusOffset);
      const ty = this.y + Math.sin(t.angle) * (this.orbitRadius + t.radiusOffset);
      ctx.fillText('JavaScript', tx, ty);
    }
    
    ctx.shadowBlur = 0;
  }
}
