import { Player } from './Player';

export type ItemType = 'magnet' | 'bomb' | 'coffee';

export class Item {
  x: number;
  y: number;
  type: ItemType;
  radius: number = 10;
  isCollected: boolean = false;
  emoji: string;
  lifetime: number = 20; // Disappears after 20 seconds

  constructor(x: number, y: number, type: ItemType) {
    this.x = x;
    this.y = y;
    this.type = type;

    switch (this.type) {
      case 'magnet':
        this.emoji = '🧲';
        break;
      case 'bomb':
        this.emoji = '💣';
        break;
      case 'coffee':
        this.emoji = '☕';
        break;
    }
  }

  update(dt: number, player: Player) {
    this.lifetime -= dt;

    // Check collision with player
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.radius + player.radius) {
      this.isCollected = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.lifetime < 3 && Math.floor(this.lifetime * 10) % 2 === 0) {
      return; // Blinking effect before disappearing
    }

    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, this.x, this.y);
  }
}
