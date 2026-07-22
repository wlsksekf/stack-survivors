import { Monster } from '../Monster';
import { Player } from '../Player';
import { checkCircleCollision } from '../../engine/physics';
import type { IProjectile } from './IProjectile';

export class JavaSkill implements IProjectile {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number = 10;
  speed: number = 150; // Slow
  color: string = '#ea580c'; // Orange coffee
  damage: number = 60;
  isDead: boolean = false;
  lifespan: number = 4;
  aoeRadius: number = 60;
  isExploding: boolean = false;
  explosionTimer: number = 0.5; // Explosion effect duration

  constructor(x: number, y: number, targetX: number, targetY: number, level: number) {
    this.x = x;
    this.y = y;
    this.damage += level * 20;
    this.aoeRadius += level * 15;
    
    let dirX = targetX - x;
    let dirY = targetY - y;
    const distance = Math.hypot(dirX, dirY);
    
    if (distance > 0) {
      this.dx = dirX / distance;
      this.dy = dirY / distance;
    } else {
      this.dx = 1; this.dy = 0;
    }
  }

  update(dt: number, monsters: Monster[], _player: Player) {
    if (this.isExploding) {
      this.explosionTimer -= dt;
      if (this.explosionTimer <= 0) {
        this.isDead = true;
      }
      return;
    }

    this.x += this.dx * this.speed * dt;
    this.y += this.dy * this.speed * dt;
    
    this.lifespan -= dt;
    if (this.lifespan <= 0) {
      this.isDead = true;
      return;
    }

    // Check hit
    for (const m of monsters) {
      if (!m.isDead && checkCircleCollision(this, m)) {
        this.explode(monsters);
        break;
      }
    }
  }

  explode(monsters: Monster[]) {
    this.isExploding = true;
    
    // AoE damage
    for (const m of monsters) {
      if (!m.isDead) {
        const dist = Math.hypot(m.x - this.x, m.y - this.y);
        if (dist <= this.aoeRadius) {
          m.takeDamage(this.damage);
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (this.isExploding) {
      // Draw AoE blast as huge faded text or just a huge text effect
      ctx.font = `bold ${this.aoeRadius}px sans-serif`;
      ctx.fillStyle = `rgba(234, 88, 12, ${this.explosionTimer * 2})`;
      ctx.fillText('Java', this.x, this.y);
    } else {
      ctx.font = `bold ${this.radius * 2.5}px sans-serif`;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 15;
      
      const angle = Math.atan2(this.dy, this.dx);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      ctx.fillText('Java', 0, 0);
      ctx.restore();
      
      ctx.shadowBlur = 0;
    }
  }
}
