import { Monster } from '../Monster';
import { Player } from '../Player';
import { checkCircleCollision } from '../../engine/physics';
import type { IProjectile } from './IProjectile';

export class HtmlSkill implements IProjectile {
  angle: number;
  orbitRadius: number = 50; // Very close to player
  speed: number = 5; // Fast rotation
  color: string = '#e34c26'; // HTML orange
  damage: number = 5; // Low damage but high tick rate
  isDead: boolean = false;
  hitCooldowns: Map<Monster, number> = new Map();

  x: number = 0;
  y: number = 0;

  constructor(angleOffset: number, level: number) {
    this.angle = angleOffset;
    this.setLevel(level);
  }

  setLevel(level: number) {
    this.orbitRadius = 50 + level * 5;
    this.damage = 5 + level * 2;
  }

  update(dt: number, monsters: Monster[], player: Player) {
    this.angle += this.speed * dt;
    this.x = player.x + Math.cos(this.angle) * this.orbitRadius;
    this.y = player.y + Math.sin(this.angle) * this.orbitRadius;

    // Shield also acts as a physical barrier for visual effect
    const shieldCollider = { x: this.x, y: this.y, radius: 20 };

    for (const [m, cd] of this.hitCooldowns.entries()) {
      if (cd - dt <= 0) {
        this.hitCooldowns.delete(m);
      } else {
        this.hitCooldowns.set(m, cd - dt);
      }
    }

    for (const m of monsters) {
      if (!m.isDead && !this.hitCooldowns.has(m)) {
        const distToPlayer = Math.hypot(m.x - player.x, m.y - player.y);
        const isInsideCircle = distToPlayer < this.orbitRadius;
        const hitByShield = checkCircleCollision(shieldCollider, m);

        if (isInsideCircle || hitByShield) {
          m.takeDamage(this.damage);
          this.hitCooldowns.set(m, 0.1); // Extremely fast hit rate
          
          // Pushback effect
          const dx = m.x - player.x;
          const dy = m.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0) {
            // Push away strongly
            m.x += (dx / dist) * 40;
            m.y += (dy / dist) * 40;
          }
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = `bold 16px sans-serif`;
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    // Point text tangentially
    ctx.rotate(this.angle + Math.PI / 2);
    ctx.fillText('<HTML/>', 0, 0);
    ctx.restore();
    
    ctx.shadowBlur = 0;
  }
}
