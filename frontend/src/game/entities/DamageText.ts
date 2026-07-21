export class DamageText {
  x: number;
  y: number;
  text: string;
  color: string;
  lifetime: number = 0.8;
  maxLifetime: number = 0.8;
  speedY: number = -30;
  speedX: number = (Math.random() - 0.5) * 20;

  constructor(x: number, y: number, amount: number, isPlayer: boolean = false) {
    this.x = x + (Math.random() - 0.5) * 10;
    this.y = y + (Math.random() - 0.5) * 10 - 10;
    this.text = Math.floor(amount).toString();
    
    if (isPlayer) {
      this.color = '#ef4444'; // Red for player damage
      this.text = '-' + this.text;
    } else {
      this.color = '#facc15'; // Yellow for monster damage
    }
  }

  update(dt: number) {
    this.x += this.speedX * dt;
    this.y += this.speedY * dt;
    this.lifetime -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = Math.max(0, this.lifetime / this.maxLifetime);
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
