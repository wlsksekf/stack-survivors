import React, { useRef, useEffect, useState } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameStore } from '../store/gameStore';
import { SkillSelectionModal } from './SkillSelectionModal';
import { QuizModal } from './QuizModal';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { gameOver } = useGameLoop(canvasRef);
  const { level, exp, expToNextLevel, isPaused, togglePause, isLevelUpModalOpen, isQuizModalOpen, survivalTime, activeSkills } = useGameStore();

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
      
      {/* Full Width EXP Bar (Top Edge) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '15px',
        backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 10, borderBottom: '2px solid rgba(0,0,0,0.5)'
      }}>
        <div style={{
          height: '100%', width: `${expPercent}%`, 
          background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)',
          boxShadow: '0 0 10px #06b6d4', transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>

      {/* HUD Info Area */}
      <div style={{
        position: 'absolute', top: '15px', left: 0, right: 0, 
        padding: '10px 20px', zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        pointerEvents: 'none' // Allow clicks to pass through to canvas where there are no buttons
      }}>
        
        {/* Left: Buttons */}
        <div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
          <button 
            onClick={togglePause}
            style={{
              padding: '8px 15px', fontSize: '14px', backgroundColor: 'rgba(30, 41, 59, 0.8)', 
              color: '#38bdf8', border: '1px solid #38bdf8', borderRadius: '4px', cursor: 'pointer',
              fontWeight: 'bold', backdropFilter: 'blur(4px)', transition: 'all 0.2s', textTransform: 'uppercase'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)'; }}
          >
            {isPaused && !isLevelUpModalOpen && !isQuizModalOpen ? '재개' : '일시 정지'}
          </button>
          <button 
            onClick={() => useGameStore.getState().setGameState('lobby')}
            style={{
              padding: '8px 15px', fontSize: '14px', backgroundColor: 'rgba(153, 27, 27, 0.8)', 
              color: '#f87171', border: '1px solid #f87171', borderRadius: '4px', cursor: 'pointer',
              fontWeight: 'bold', backdropFilter: 'blur(4px)', transition: 'all 0.2s', textTransform: 'uppercase'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(153, 27, 27, 0.8)'; }}
          >
            포기
          </button>
        </div>

        {/* Center: Level & Timer */}
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
          background: 'rgba(15, 23, 42, 0.7)', padding: '10px 30px', borderRadius: '0 0 15px 15px',
          border: '1px solid rgba(56, 189, 248, 0.3)', borderTop: 'none',
          boxShadow: '0 5px 15px rgba(0,0,0,0.5)', pointerEvents: 'auto', backdropFilter: 'blur(5px)'
        }}>
          <div className="title-font" style={{ fontSize: '28px', color: '#fff', textShadow: '0 0 5px #38bdf8' }}>
            LV <span style={{ color: '#38bdf8' }}>{level}</span>
          </div>
          <div className="title-font" style={{ fontSize: '20px', color: '#fcd34d', letterSpacing: '2px', textShadow: '0 0 5px #fcd34d' }}>
            {Math.floor(survivalTime / 60).toString().padStart(2, '0')}:{(Math.floor(survivalTime) % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* Right: Active Skills Icons */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', maxWidth: '200px', justifyContent: 'flex-end', pointerEvents: 'auto' }}>
          {activeSkills.map(skill => (
            <div key={skill.name} style={{
              background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #64748b',
              padding: '5px', borderRadius: '4px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', minWidth: '40px', backdropFilter: 'blur(4px)'
            }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>{skill.name.substring(0, 3).toUpperCase()}</span>
              <span className="title-font" style={{ fontSize: '14px', color: '#60a5fa' }}>{skill.level}</span>
            </div>
          ))}
        </div>
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

      {/* Pause Overlay (Only when manually paused, not level up or quiz) */}
      {isPaused && !isLevelUpModalOpen && !isQuizModalOpen && !gameOver && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 40, pointerEvents: 'none'
        }}>
          <h1 style={{ color: 'white', fontSize: '64px', letterSpacing: '10px' }}>일시 정지</h1>
        </div>
      )}

      {/* Level Up Modal */}
      <SkillSelectionModal />

      {/* Quiz Modal */}
      <QuizModal />
    </div>
  );
};
