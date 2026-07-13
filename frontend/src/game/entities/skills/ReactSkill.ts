import { Monster } from '../Monster';
import { Player } from '../Player';
import { checkCircleCollision } from '../../engine/physics';
import type { IProjectile } from './IProjectile';

export class ReactSkill implements IProjectile {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number = 10;
  speed: number = 600; // Fast initial
  color: string = '#61dafb'; // React cyan
  damage: number = 20;
  isDead: boolean = false;
  lifespan: number = 3;
  hitMonsters: Map<Monster, number> = new Map();

  constructor(x: number, y: number, targetX: number, targetY: number, level: number) {
    this.x = x;
    this.y = y;
    this.damage += level * 5;
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

  update(dt: number, monsters: Monster[], player: Player) {
    // Accelerate back towards player (Boomerang effect)
    const toPlayerX = player.x - this.x;
    const toPlayerY = player.y - this.y;
    const distToPlayer = Math.hypot(toPlayerX, toPlayerY);
    
    if (distToPlayer > 0) {
      // Gradually change dx/dy to point back to player
      this.dx += (toPlayerX / distToPlayer) * dt * 3;
      this.dy += (toPlayerY / distToPlayer) * dt * 3;
    }
    
    // Normalize velocity so it doesn't just infinitely accelerate
    const currentSpeed = Math.hypot(this.dx, this.dy);
    if (currentSpeed > 0) {
      this.dx = (this.dx / currentSpeed);
      this.dy = (this.dy / currentSpeed);
    }

    this.x += this.dx * this.speed * dt;
    this.y += this.dy * this.speed * dt;
    
    this.lifespan -= dt;
    if (this.lifespan <= 0 || (this.lifespan < 2 && distToPlayer < 30)) {
      this.isDead = true;
      return;
    }

    // Cooldown management
    for (const [m, cd] of this.hitMonsters.entries()) {
      if (cd - dt <= 0) {
        this.hitMonsters.delete(m);
      } else {
        this.hitMonsters.set(m, cd - dt);
      }
    }

    // Piercing logic
    for (const m of monsters) {
      if (!m.isDead && !this.hitMonsters.has(m) && checkCircleCollision(this, m)) {
        m.takeDamage(this.damage);
        this.hitMonsters.set(m, 0.5); // Hit again if it loops back
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = `bold ${this.radius * 2}px sans-serif`;
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    
    // Rotate constantly for boomerang effect
    const timeAngle = Date.now() / 100;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(timeAngle);
    ctx.fillText('React', 0, 0);
    ctx.restore();
    
    ctx.shadowBlur = 0;
  }
}
