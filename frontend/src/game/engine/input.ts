const keys: { [key: string]: boolean } = {};

export function initInput() {
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });
}

export function isKeyPressed(key: string): boolean {
  return !!keys[key.toLowerCase()];
}

export function getMovementVector(): { x: number; y: number } {
  let dx = 0;
  let dy = 0;

  if (isKeyPressed('w') || isKeyPressed('arrowup')) dy -= 1;
  if (isKeyPressed('s') || isKeyPressed('arrowdown')) dy += 1;
  if (isKeyPressed('a') || isKeyPressed('arrowleft')) dx -= 1;
  if (isKeyPressed('d') || isKeyPressed('arrowright')) dx += 1;

  // Normalize the vector
  if (dx !== 0 && dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx /= length;
    dy /= length;
  }

  return { x: dx, y: dy };
}
