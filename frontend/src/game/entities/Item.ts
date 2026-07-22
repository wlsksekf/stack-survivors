import { Player } from './Player';

export type ItemType = 'magnet' | 'bomb' | 'coffee' | 'package';

export class Item {
  x: number;
  y: number;
  type: ItemType;
  radius: number = 10;
  isCollected: boolean = false;
  label: string;
  lifetime: number = 20;

  constructor(x: number, y: number, type: ItemType) {
    this.x = x;
    this.y = y;
    this.type = type;

    const labels: Record<ItemType, string> = {
      magnet: '🧲',
      bomb: '💣',
      coffee: '☕',
      package: '📦'
    };

    this.label = labels[type];
  }

  update(dt: number, player: Player) {
    this.lifetime -= dt;

    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.radius + player.radius) {
      this.isCollected = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.lifetime < 3 && Math.floor(this.lifetime * 10) % 2 === 0) {
      return;
    }

    const colors: Record<ItemType, string> = {
      magnet: '#38d9ff',
      bomb: '#fb7185',
      coffee: '#34d399',
      package: '#facc15'
    };

    const pulse = 1 + Math.sin(this.lifetime * 8) * 0.08;
    const color = colors[this.type];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(9, 14, 25, 0.78)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.font = '16px Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, 0, 1);
    ctx.restore();
  }
}
