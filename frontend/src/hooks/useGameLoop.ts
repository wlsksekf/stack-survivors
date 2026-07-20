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

    const player = playerRef.current;
    player.update(dt, width, height);
    
    // Quiz Timer Logic
    // We want to trigger a quiz every 180 seconds (3 minutes)
    // We can track the previous survival time interval
    const previousInterval = Math.floor((survivalTimerRef.current - dt) / 180);
    const currentInterval = Math.floor(survivalTimerRef.current / 180);
    
    // If we crossed a 3-minute boundary (e.g. 180s, 360s, 540s)
    if (currentInterval > previousInterval && currentInterval > 0) {
      state.openQuiz();
    }

    // Spawn monsters
    spawnTimerRef.current += dt;
    if (spawnTimerRef.current > 1.0) { // Spawn faster
      spawnTimerRef.current = 0;
      const edge = Math.floor(Math.random() * 4);
      let mx = 0, my = 0;
      if (edge === 0) { mx = Math.random() * width; my = -20; }
      else if (edge === 1) { mx = width + 20; my = Math.random() * height; }
      else if (edge === 2) { mx = Math.random() * width; my = height + 20; }
      else { mx = -20; my = Math.random() * height; }
      
      // Determine monster type based on survival time
      let type: 'ladybug' | 'caterpillar' | 'bee' | 'spider' = 'ladybug';
      const r = Math.random();
      
      if (survivalTimerRef.current > 180) { // After 3 minutes
        if (r < 0.1) type = 'spider';
        else if (r < 0.3) type = 'caterpillar';
        else if (r < 0.5) type = 'bee';
      } else if (survivalTimerRef.current > 60) { // After 1 minute
        if (r < 0.1) type = 'caterpillar';
        else if (r < 0.25) type = 'bee';
      }

      monstersRef.current.push(new Monster(mx, my, type));
    }

    // Auto-attack based on active skills
    for (const skill of state.activeSkills) {
      if (skillTimersRef.current[skill.name] === undefined) {
        skillTimersRef.current[skill.name] = 0;
        
        // Spawn orbital/aura skills immediately (only 1 needed per level)
        if (skill.name === 'JavaScript') {
          projectilesRef.current.push(new JavaScriptSkill(0, skill.level));
        }
        if (skill.name === 'HTML') {
          projectilesRef.current.push(new HtmlSkill(0, skill.level));
        }
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
        expsRef.current.push(new Experience(m.x, m.y));
        
        // 5% chance to drop an item
        if (Math.random() < 0.05) {
          const items: ItemType[] = ['magnet', 'bomb', 'coffee'];
          const dropType = items[Math.floor(Math.random() * items.length)];
          itemsRef.current.push(new Item(m.x, m.y, dropType));
        }

        monsters.splice(i, 1);
        continue;
      }

      if (checkCircleCollision(player, m)) {
        player.health -= m.damage * dt * 2;
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
        if (item.type === 'coffee') {
          player.health = Math.min(player.health + 50, player.maxHealth);
        } else if (item.type === 'bomb') {
          // Kill all monsters on screen
          monstersRef.current.forEach(m => {
            expsRef.current.push(new Experience(m.x, m.y));
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
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#1e293b'; 
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#334155'; 
    ctx.lineWidth = 1;
    for(let i = 0; i < width; i += 50) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for(let i = 0; i < height; i += 50) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    expsRef.current.forEach(e => e.draw(ctx));
    itemsRef.current.forEach(item => item.draw(ctx));
    projectilesRef.current.forEach(p => p.draw(ctx));
    monstersRef.current.forEach(m => m.draw(ctx));
    playerRef.current.draw(ctx);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, width, height);
      // Let React handle the Game Over screen now
    }
  };

  return { gameOver };
}
