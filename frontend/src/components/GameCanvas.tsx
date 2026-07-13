import React, { useRef, useEffect, useState } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameStore } from '../store/gameStore';
import { SkillSelectionModal } from './SkillSelectionModal';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { gameOver } = useGameLoop(canvasRef);
  const { level, exp, expToNextLevel, isPaused, togglePause, isLevelUpModalOpen } = useGameStore();

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const expPercent = (exp / expToNextLevel) * 100;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      
      {/* HUD: Level & EXP Bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, 
        padding: '10px 20px', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '20px'
      }}>
        <div style={{
          backgroundColor: '#3b82f6', color: 'white', 
          padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold'
        }}>
          Lv {level}
        </div>
        
        <div style={{
          flex: 1, height: '12px', backgroundColor: '#334155', 
          borderRadius: '6px', overflow: 'hidden', border: '1px solid #475569'
        }}>
          <div style={{
            height: '100%', width: `${expPercent}%`, 
            backgroundColor: '#10b981', transition: 'width 0.2s'
          }} />
        </div>

        <button 
          onClick={togglePause}
          style={{
            backgroundColor: '#475569', color: 'white', border: 'none', 
            borderRadius: '8px', padding: '8px 16px', cursor: 'pointer',
            fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {isPaused && !isLevelUpModalOpen ? 'Resume' : 'Pause'}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block' }}
      />
      
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          zIndex: 50
        }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px', fontSize: '18px', cursor: 'pointer',
              backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px'
            }}
          >
            Restart Game
          </button>
        </div>
      )}

      {/* Pause Overlay (Only when manually paused, not level up) */}
      {isPaused && !isLevelUpModalOpen && !gameOver && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 40, pointerEvents: 'none'
        }}>
          <h1 style={{ color: 'white', fontSize: '64px', letterSpacing: '10px' }}>PAUSED</h1>
        </div>
      )}

      {/* Level Up Modal */}
      <SkillSelectionModal />
    </div>
  );
};
