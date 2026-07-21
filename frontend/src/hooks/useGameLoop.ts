import { useEffect, useRef, useState } from 'react';
import { Player } from '../game/entities/Player';
import { Monster } from '../game/entities/Monster';
import { Item } from '../game/entities/Item';
import type { ItemType } from '../game/entities/Item';
import type { IProjectile } from '../game/entities/skills/IProjectile';
import { PythonSkill } from '../game/entities/skills/PythonSkill';
import { JavaScriptSkill } from '../game/entities/skills/JavaScriptSkill';
import { JavaSkill } from '../game/entities/skills/JavaSkill';
import { CSkill } from '../game/entities/skills/CSkill';
import { CppSkill } from '../game/entities/skills/CppSkill';
import { ReactSkill } from '../game/entities/skills/ReactSkill';
import { HtmlSkill } from '../game/entities/skills/HtmlSkill';
import { Projectile } from '../game/entities/Projectile'; // Keep for Basic attack
import { Experience } from '../game/entities/Experience';
import { checkCircleCollision } from '../game/engine/physics';
import { initInput } from '../game/engine/input';
import { useGameStore } from '../store/gameStore';

const getMonsterScaling = (survivalTime: number) => {
  const elapsedMinutes = survivalTime / 60;

  return {
    healthMultiplier: Math.min(1 + elapsedMinutes * 0.18, 4),
    speedMultiplier: Math.min(1 + elapsedMinutes * 0.07, 2)
  };
};

const getSpawnInterval = (survivalTime: number) => {
  return Math.max(0.5, 1.2 - (survivalTime / 60) * 0.07);
};

const getSpawnCount = (survivalTime: number) => {
  // Start with 1, and add 1 more every 45 seconds, up to a maximum of 12.
  return Math.min(12, 1 + Math.floor(survivalTime / 45));
};

const getMonsterType = (survivalTime: number): 'ladybug' | 'caterpillar' | 'bee' | 'spider' | 'boss' => {
  const r = Math.random();

  // Boss spawn condition: after 120 seconds, there is a small chance to spawn a boss
  if (survivalTime > 120 && r < 0.03) {
    return 'boss';
  }

  if (survivalTime > 180) {
    if (r < 0.16) return 'spider';
    if (r < 0.40) return 'caterpillar';
    if (r < 0.64) return 'bee';
  } else if (survivalTime > 60) {
    if (r < 0.16) return 'caterpillar';
    if (r < 0.36) return 'bee';
  }

  return 'ladybug';
};

type ItemEffect = {
  type: ItemType;
  x: number;
  y: number;
  age: number;
  duration: number;
};

const drawItemEffect = (
  ctx: CanvasRenderingContext2D,
  effect: ItemEffect,
  width: number,
  height: number
) => {
  const progress = Math.min(effect.age / effect.duration, 1);
  const alpha = 1 - progress;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 3;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (effect.type === 'bomb') {
    const maxRadius = Math.hypot(width, height);
    const radius = 35 + maxRadius * progress;

    ctx.strokeStyle = '#fb7185';
    ctx.shadowColor = '#fb7185';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `rgba(251, 113, 133, ${0.18 * alpha})`;
    ctx.fillRect(0, 0, width, height);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffe4e6';
    ctx.fillText('SYSTEM WIPE', effect.x, effect.y - 28 * progress);
  }

  if (effect.type === 'magnet') {
    ctx.strokeStyle = '#38d9ff';
    ctx.shadowColor = '#38d9ff';
    ctx.shadowBlur = 18;

    for (let i = 0; i < 3; i++) {
      const radius = 160 - progress * 120 - i * 34;
      if (radius > 12) {
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#dff8ff';
    ctx.fillText('EXP SYNC', effect.x, effect.y - 36);
  }

  if (effect.type === 'coffee') {
    const radius = 28 + progress * 48;

    ctx.strokeStyle = '#34d399';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#bbf7d0';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('+', effect.x, effect.y);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('RECOVER', effect.x, effect.y - 34);
  }

  ctx.restore();
};

export function useGameLoop(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [gameOver, setGameOver] = useState(false);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // Game state
  const playerRef = useRef(new Player(400, 300));
  const monstersRef = useRef<Monster[]>([]);
  const projectilesRef = useRef<IProjectile[]>([]);
  const expsRef = useRef<Experience[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const itemEffectsRef = useRef<ItemEffect[]>([]);
  
  const spawnTimerRef = useRef<number>(0);
  const survivalTimerRef = useRef<number>(0);
  
  // Timers for each skill
  const skillTimersRef = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    initInput();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset game state
    playerRef.current = new Player(canvas.width / 2, canvas.height / 2);
    monstersRef.current = [];
    projectilesRef.current = [];
    expsRef.current = [];
    itemsRef.current = [];
    itemEffectsRef.current = [];
    survivalTimerRef.current = 0;
    skillTimersRef.current = {};

    const loop = (time: number) => {
      const state = useGameStore.getState();
      
      if (lastTimeRef.current !== undefined) {
        const deltaTime = (time - lastTimeRef.current) / 1000; // in seconds
        
        // Only update if not paused and not game over
        if (!state.isPaused && !gameOver) {
          update(deltaTime, canvas.width, canvas.height);
        }
        
        // Always draw (even if paused)
        draw(ctx, canvas.width, canvas.height);
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [canvasRef, gameOver]);

  const update = (dt: number, width: number, height: number) => {
    const state = useGameStore.getState();
    
    if (playerRef.current.health <= 0) {
      if (!gameOver) {
        setGameOver(true);
        state.setGameOver(survivalTimerRef.current);
      }
      return;
    }

    survivalTimerRef.current += dt;
    state.updateSurvivalTime(survivalTimerRef.current);

    const player = playerRef.current;
    player.update(dt, width, height);
    
    // Quiz Timer Logic
    // We want to trigger a quiz every 60 seconds (1 minute)
    // We can track the previous survival time interval
    const previousInterval = Math.floor((survivalTimerRef.current - dt) / 60);
    const currentInterval = Math.floor(survivalTimerRef.current / 60);
    
    // If we crossed a 1-minute boundary (e.g. 60s, 120s, 180s)
    if (currentInterval > previousInterval && currentInterval > 0) {
      state.openQuiz();
    }

    // Spawn monsters
    spawnTimerRef.current += dt;
    if (spawnTimerRef.current > getSpawnInterval(survivalTimerRef.current)) {
      spawnTimerRef.current = 0;

      for (let i = 0; i < getSpawnCount(survivalTimerRef.current); i++) {
        const edge = Math.floor(Math.random() * 4);
        let mx = 0, my = 0;
        const spread = i * 22;
        
        const cameraX = player.x - width / 2;
        const cameraY = player.y - height / 2;

        if (edge === 0) { mx = cameraX + Math.random() * width; my = cameraY - 20 - spread; }
        else if (edge === 1) { mx = cameraX + width + 20 + spread; my = cameraY + Math.random() * height; }
        else if (edge === 2) { mx = cameraX + Math.random() * width; my = cameraY + height + 20 + spread; }
        else { mx = cameraX - 20 - spread; my = cameraY + Math.random() * height; }

        monstersRef.current.push(new Monster(
          mx,
          my,
          getMonsterType(survivalTimerRef.current),
          getMonsterScaling(survivalTimerRef.current)
        ));
      }
    }

    // Auto-attack based on active skills
    for (const skill of state.activeSkills) {
      if (skillTimersRef.current[skill.name] === undefined) {
        skillTimersRef.current[skill.name] = 0;
      }

      if (skill.name === 'JavaScript') {
        let aura = projectilesRef.current.find((p): p is JavaScriptSkill => p instanceof JavaScriptSkill);
        if (!aura) {
          aura = new JavaScriptSkill(0, skill.level);
          projectilesRef.current.push(aura);
        }
        aura.setLevel(skill.level);
      }

      if (skill.name === 'HTML') {
        let shield = projectilesRef.current.find((p): p is HtmlSkill => p instanceof HtmlSkill);
        if (!shield) {
          shield = new HtmlSkill(0, skill.level);
          projectilesRef.current.push(shield);
        }
        shield.setLevel(skill.level);
      }
      
      skillTimersRef.current[skill.name] += dt;
      
      let nearestM: Monster | null = null;
      if (['Basic', 'Python', 'Java', 'C', 'C++', 'React'].includes(skill.name)) {
        let nearestDist = Infinity;
        for (const m of monstersRef.current) {
          const dist = Math.hypot(player.x - m.x, player.y - m.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestM = m;
          }
        }
      }

      if (skill.name === 'Basic' && skillTimersRef.current[skill.name] > 0.8) {
        skillTimersRef.current[skill.name] = 0;
        if (nearestM) projectilesRef.current.push(new Projectile(player.x, player.y, nearestM.x, nearestM.y));
      }
      
      if (skill.name === 'Python' && skillTimersRef.current[skill.name] > 1.2) {
        skillTimersRef.current[skill.name] = 0;
        if (nearestM) projectilesRef.current.push(new PythonSkill(player.x, player.y, nearestM.x, nearestM.y, skill.level));
      }
      
      if (skill.name === 'Java' && skillTimersRef.current[skill.name] > 2.0) {
        skillTimersRef.current[skill.name] = 0;
        if (nearestM) projectilesRef.current.push(new JavaSkill(player.x, player.y, nearestM.x, nearestM.y, skill.level));
      }

      if (skill.name === 'C' && skillTimersRef.current[skill.name] > 0.5) {
        skillTimersRef.current[skill.name] = 0;
        if (nearestM) projectilesRef.current.push(new CSkill(player.x, player.y, nearestM.x, nearestM.y, skill.level));
      }

      if (skill.name === 'C++' && skillTimersRef.current[skill.name] > 3.0) {
        skillTimersRef.current[skill.name] = 0;
        if (nearestM) projectilesRef.current.push(new CppSkill(player.x, player.y, nearestM.x, nearestM.y, skill.level));
      }

      if (skill.name === 'React' && skillTimersRef.current[skill.name] > 1.5) {
        skillTimersRef.current[skill.name] = 0;
        if (nearestM) projectilesRef.current.push(new ReactSkill(player.x, player.y, nearestM.x, nearestM.y, skill.level));
      }
    }

    // Update projectiles
    const projectiles = projectilesRef.current;
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.update(dt, monstersRef.current, player);
      if (p.isDead) projectiles.splice(i, 1);
    }

    // Update monsters
    const monsters = monstersRef.current;
    for (let i = monsters.length - 1; i >= 0; i--) {
      const m = monsters[i];
      m.update(dt, player);

      if (m.isDead) {
        // Drop EXP
        expsRef.current.push(new Experience(m.x, m.y, m.expYield));
        
        // 1% chance to drop an item
        if (Math.random() < 0.01) {
          const items: ItemType[] = ['magnet', 'bomb', 'coffee'];
          const dropType = items[Math.floor(Math.random() * items.length)];
          itemsRef.current.push(new Item(m.x, m.y, dropType));
        }

        monsters.splice(i, 1);
        continue;
      }

      if (checkCircleCollision(player, m)) {
        player.takeDamage(m.damage * dt * 2);
      }
    }

    // Update EXP
    const exps = expsRef.current;
    for (let i = exps.length - 1; i >= 0; i--) {
      const e = exps[i];
      e.update(dt, player);
      
      if (e.isCollected) {
        useGameStore.getState().addExp(e.amount);
        exps.splice(i, 1);
      }
    }

    // Update Items
    const items = itemsRef.current;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.update(dt, player);

      if (item.lifetime <= 0) {
        items.splice(i, 1);
        continue;
      }

      if (item.isCollected) {
        itemEffectsRef.current.push({
          type: item.type,
          x: item.type === 'coffee' ? player.x : item.x,
          y: item.type === 'coffee' ? player.y : item.y,
          age: 0,
          duration: item.type === 'bomb' ? 0.75 : 0.65
        });

        if (item.type === 'coffee') {
          player.health = Math.min(player.health + 50, player.maxHealth);
        } else if (item.type === 'bomb') {
          // Kill all monsters on screen
          monstersRef.current.forEach(m => {
            expsRef.current.push(new Experience(m.x, m.y, m.expYield));
          });
          monstersRef.current = [];
        } else if (item.type === 'magnet') {
          // Collect all EXP
          expsRef.current.forEach(e => {
            useGameStore.getState().addExp(e.amount);
          });
          expsRef.current = [];
        }
        items.splice(i, 1);
      }
    }

    for (let i = itemEffectsRef.current.length - 1; i >= 0; i--) {
      const effect = itemEffectsRef.current[i];
      effect.age += dt;

      if (effect.age >= effect.duration) {
        itemEffectsRef.current.splice(i, 1);
      }
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const player = playerRef.current;
    const cameraX = player.x - width / 2;
    const cameraY = player.y - height / 2;

    // Cyberspace / Dark Neon Background
    ctx.fillStyle = '#050510'; 
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // Draw Cyberpunk Grid
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.15)'; // Neon blue grid
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    
    const startX = Math.floor(cameraX / gridSize) * gridSize;
    const startY = Math.floor(cameraY / gridSize) * gridSize;

    ctx.beginPath();
    for (let x = startX; x < cameraX + width; x += gridSize) {
      ctx.moveTo(x, cameraY);
      ctx.lineTo(x, cameraY + height);
    }
    for (let y = startY; y < cameraY + height; y += gridSize) {
      ctx.moveTo(cameraX, y);
      ctx.lineTo(cameraX + width, y);
    }
    ctx.stroke();

    // Add some random floating digital particles or "binary" rain effect faintly
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#0ea5e9';
    ctx.font = '10px "Orbitron", monospace';
    for (let i = 0; i < 20; i++) {
      const px = startX + ((i * 137 + survivalTimerRef.current * 5) % width);
      const py = startY + ((i * 349 + survivalTimerRef.current * 15) % height);
      ctx.fillText(Math.random() > 0.5 ? '1' : '0', px, py);
    }
    ctx.globalAlpha = 1.0;

    // Game Entities
    expsRef.current.forEach(e => e.draw(ctx));
    itemsRef.current.forEach(item => item.draw(ctx));
    itemEffectsRef.current.forEach(effect => drawItemEffect(ctx, effect, width, height));
    projectilesRef.current.forEach(p => p.draw(ctx));
    monstersRef.current.forEach(m => m.draw(ctx));
    player.draw(ctx);
    
    ctx.restore();

    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, width, height);
      // Let React handle the Game Over screen now
    }
  };

  return { gameOver };
}
