export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export function checkCircleCollision(c1: Circle, c2: Circle): boolean {
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < c1.radius + c2.radius;
}
