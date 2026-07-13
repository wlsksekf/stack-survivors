import { create } from 'zustand';

export type GameStateEnum = 'lobby' | 'playing' | 'gameover';

export interface ActiveSkill {
  name: string;
  level: number;
}

interface GameState {
  gameState: GameStateEnum;
  level: number;
  exp: number;
  expToNextLevel: number;
  isPaused: boolean;
  isLevelUpModalOpen: boolean;
  activeSkills: ActiveSkill[];
  survivalTime: number; // in seconds
  
  startGame: () => void;
  setGameOver: (time: number) => void;
  restartGame: () => void;
  
  addExp: (amount: number) => void;
  levelUp: () => void;
  togglePause: () => void;
  resumeGame: () => void;
  selectSkill: (skill: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameState: 'lobby',
  level: 1,
  exp: 0,
  expToNextLevel: 10,
  isPaused: false,
  isLevelUpModalOpen: false,
  activeSkills: [],
  survivalTime: 0,

  startGame: () => set({ 
    gameState: 'playing', 
    level: 1, 
    exp: 0, 
    expToNextLevel: 10, 
    isPaused: false,
    isLevelUpModalOpen: false,
    activeSkills: [{ name: 'Basic', level: 1 }], // Give a basic attack
    survivalTime: 0
  }),
  
  setGameOver: (time: number) => set({ 
    gameState: 'gameover', 
    survivalTime: time,
    isPaused: true 
  }),
  
  restartGame: () => set({ gameState: 'lobby' }),
  
  addExp: (amount) => set((state) => {
    let newExp = state.exp + amount;
    if (newExp >= state.expToNextLevel) {
      return { exp: newExp, isPaused: true, isLevelUpModalOpen: true }; 
    }
    return { exp: newExp };
  }),
  
  levelUp: () => set((state) => ({
    level: state.level + 1,
    exp: state.exp - state.expToNextLevel,
    expToNextLevel: Math.floor(state.expToNextLevel * 1.5),
    isPaused: false,
    isLevelUpModalOpen: false
  })),
  
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  resumeGame: () => set({ isPaused: false }),
  
  selectSkill: (skillName) => set((state) => {
    const existing = state.activeSkills.find(s => s.name === skillName);
    if (existing) {
      return {
        activeSkills: state.activeSkills.map(s => 
          s.name === skillName ? { ...s, level: s.level + 1 } : s
        )
      };
    } else {
      return {
        activeSkills: [...state.activeSkills, { name: skillName, level: 1 }]
      };
    }
  })
}));
