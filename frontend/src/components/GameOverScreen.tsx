import React from 'react';
import { useGameStore } from '../store/gameStore';

export const GameOverScreen: React.FC = () => {
  const { restartGame, survivalTime, level, activeSkills } = useGameStore();

  return (
    <div style={{
      width: '100%', height: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      color: 'white', fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '64px', marginBottom: '20px', color: '#ef4444' }}>
        GAME OVER
      </h1>
      
      <div style={{
        backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px',
        textAlign: 'center', marginBottom: '40px', border: '1px solid #334155'
      }}>
        <h2 style={{ color: '#cbd5e1', marginBottom: '10px' }}>Final Stats</h2>
        <p style={{ fontSize: '20px', margin: '5px 0' }}>Level: <span style={{ color: '#60a5fa' }}>{level}</span></p>
        <p style={{ fontSize: '20px', margin: '5px 0' }}>Survival Time: <span style={{ color: '#fcd34d' }}>{Math.floor(survivalTime)}s</span></p>
        
        <h3 style={{ marginTop: '20px', color: '#cbd5e1' }}>Tech Stack:</h3>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
          {activeSkills.map(skill => (
            <span key={skill.name} style={{
              backgroundColor: '#334155', padding: '5px 10px', borderRadius: '4px',
              fontSize: '14px'
            }}>
              {skill.name} Lv.{skill.level}
            </span>
          ))}
        </div>
      </div>
      
      <button 
        onClick={restartGame}
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
        Return to Lobby
      </button>
    </div>
  );
};
