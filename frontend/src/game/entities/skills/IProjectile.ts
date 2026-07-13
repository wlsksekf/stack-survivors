import { Monster } from '../Monster';
import { Player } from '../Player';

export interface IProjectile {
  isDead: boolean;
  update: (dt: number, monsters: Monster[], player: Player) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}
