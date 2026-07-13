import { Monster } from '../Monster';
import { Player } from '../Player';
import { checkCircleCollision } from '../../engine/physics';
import type { IProjectile } from './IProjectile';

export class PythonSkill implements IProjectile {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number = 8;
  speed: number = 300; 
  color: string = '#3b82f6'; // Blue snake
  damage: number = 20;
  isDead: boolean = false;
  lifespan: number = 2; // 2 seconds
  hitMonsters: Set<Monster> = new Set();

  constructor(x: number, y: number, targetX: number, targetY: number, level: number) {
    this.x = x;
    this.y = y;
    this.damage += level * 5; // scales with level
    this.radius += level * 2;
    
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

    // Piercing logic: hits multiple monsters, but only once per monster
    for (const m of monsters) {
      if (!m.isDead && !this.hitMonsters.has(m) && checkCircleCollision(this, m)) {
        m.takeDamage(this.damage);
        this.hitMonsters.add(m);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = `bold ${this.radius * 2}px sans-serif`;
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add a slight glow/shadow for visibility
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    
    // Rotate text based on direction
    const angle = Math.atan2(this.dy, this.dx);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.fillText('Python', 0, 0);
    ctx.restore();
    
    ctx.shadowBlur = 0; // reset
  }
}
