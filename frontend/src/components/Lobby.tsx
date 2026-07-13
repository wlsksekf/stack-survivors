import React from 'react';
import { useGameStore } from '../store/gameStore';

export const Lobby: React.FC = () => {
  const { startGame } = useGameStore();

  return (
    <div style={{
      width: '100%', height: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      color: 'white', fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '64px', marginBottom: '10px', color: '#60a5fa' }}>
        Stack Survivors
      </h1>
      <p style={{ fontSize: '24px', color: '#94a3b8', marginBottom: '50px' }}>
        Defeat the bug monsters and master your tech stack!
      </p>
      
      <button 
        onClick={startGame}
        style={{
          padding: '15px 40px', fontSize: '24px', fontWeight: 'bold',
          backgroundColor: '#3b82f6', color: 'white',
          border: 'none', borderRadius: '12px', cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          transition: 'transform 0.1s'
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        Start Game
      </button>
    </div>
  );
};
