import { Monster } from '../Monster';
import { Player } from '../Player';
import { checkCircleCollision } from '../../engine/physics';
import type { IProjectile } from './IProjectile';

export class CSkill implements IProjectile {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number = 5;
  speed: number = 500; // Very Fast
  color: string = '#cbd5e1'; // Silver/Gray
  damage: number = 15;
  isDead: boolean = false;
  lifespan: number = 2; // 2 seconds

  constructor(x: number, y: number, targetX: number, targetY: number, level: number) {
    this.x = x;
    this.y = y;
    this.damage += level * 10; 
    
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
    this.x += this.dx * this.speed * dt;
    this.y += this.dy * this.speed * dt;
    
    this.lifespan -= dt;
    if (this.lifespan <= 0) {
      this.isDead = true;
      return;
    }

    // Single target bullet
    for (const m of monsters) {
      if (!m.isDead && checkCircleCollision(this, m)) {
        m.takeDamage(this.damage);
        this.isDead = true;
        break;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = `bold 16px sans-serif`;
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;
    
    ctx.fillText('C', this.x, this.y);
    
    ctx.shadowBlur = 0;
  }
}
