import { Monster } from './Monster';
import { Player } from './Player';
import { checkCircleCollision } from '../engine/physics';
import type { IProjectile } from './skills/IProjectile';

export class Projectile implements IProjectile {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number = 5;
  speed: number = 400; // fast
  color: string = '#fcd34d'; // Yellow/Gold
  damage: number = 15;
  isDead: boolean = false;
  lifespan: number = 3; // 3 seconds max

  constructor(x: number, y: number, targetX: number, targetY: number) {
    this.x = x;
    this.y = y;
    
    // Calculate direction
    let dirX = targetX - x;
    let dirY = targetY - y;
    const distance = Math.sqrt(dirX * dirX + dirY * dirY);
    
    if (distance > 0) {
      this.dx = dirX / distance;
      this.dy = dirY / distance;
    } else {
      this.dx = 1;
      this.dy = 0;
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

    // Check collisions with monsters
    for (const m of monsters) {
      if (!m.isDead && checkCircleCollision(this, m)) {
        m.takeDamage(this.damage);
        this.isDead = true; // Destroy projectile on hit (single target)
        break;
      }
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
