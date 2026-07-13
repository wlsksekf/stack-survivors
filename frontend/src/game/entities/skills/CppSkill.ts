import { Monster } from '../Monster';
import { Player } from '../Player';
import type { IProjectile } from './IProjectile';

export class CppSkill implements IProjectile {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string = '#22d3ee'; // Cyan
  damage: number = 30;
  isDead: boolean = false;
  lifespan: number = 0.3; // Beam stays briefly
  width: number = 20;

  constructor(x: number, y: number, targetX: number, targetY: number, level: number) {
    this.startX = x;
    this.startY = y;
    this.damage += level * 10;
    this.width += level * 5;
    
    let dirX = targetX - x;
    let dirY = targetY - y;
    const distance = Math.hypot(dirX, dirY);
    
    // Extend the beam far beyond the target
    if (distance > 0) {
      this.endX = x + (dirX / distance) * 2000;
      this.endY = y + (dirY / distance) * 2000;
    } else {
      this.endX = x + 2000;
      this.endY = y;
    }
  }

  update(dt: number, monsters: Monster[], _player: Player) {
    this.lifespan -= dt;
    if (this.lifespan <= 0) {
      this.isDead = true;
      return;
    }

    // Only hit on the very first frame to avoid multi-hitting every tiny delta dt
    if (this.lifespan > 0.25) { // Assuming lifespan starts at 0.3
      for (const m of monsters) {
        if (!m.isDead) {
          // Point to line segment distance
          const l2 = Math.pow(this.startX - this.endX, 2) + Math.pow(this.startY - this.endY, 2);
          let t = ((m.x - this.startX) * (this.endX - this.startX) + (m.y - this.startY) * (this.endY - this.startY)) / l2;
          t = Math.max(0, Math.min(1, t));
          const projX = this.startX + t * (this.endX - this.startX);
          const projY = this.startY + t * (this.endY - this.startY);
          
          const dist = Math.hypot(m.x - projX, m.y - projY);
          if (dist <= m.radius + this.width / 2) {
            m.takeDamage(this.damage);
          }
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw the beam line
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.endX, this.endY);
    ctx.strokeStyle = `rgba(34, 211, 238, ${this.lifespan / 0.3})`;
    ctx.lineWidth = this.width;
    ctx.stroke();
    ctx.closePath();

    // Draw C++ text along the beam
    const angle = Math.atan2(this.endY - this.startY, this.endX - this.startX);
    ctx.save();
    ctx.translate(this.startX, this.startY);
    ctx.rotate(angle);
    ctx.font = `bold ${this.width + 10}px sans-serif`;
    ctx.fillStyle = `rgba(255, 255, 255, ${this.lifespan / 0.3})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw multiple C++ words along the line
    for (let i = 100; i < 2000; i += 200) {
      ctx.fillText('C++', i, 0);
    }
    ctx.restore();
  }
}
