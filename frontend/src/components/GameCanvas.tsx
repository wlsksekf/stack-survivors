import React, { useRef, useEffect, useState } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameStore } from '../store/gameStore';
import { SkillSelectionModal } from './SkillSelectionModal';
import { QuizModal } from './QuizModal';
import { submitCurrentScore } from '../lib/score';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isQuitting, setIsQuitting] = useState(false);
  const { gameOver } = useGameLoop(canvasRef);
  const {
    level,
    exp,
    expToNextLevel,
    isPaused,
    togglePause,
    isLevelUpModalOpen,
    isQuizModalOpen,
    survivalTime,
    activeSkills
  } = useGameStore();

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

  const handleQuit = async () => {
    if (isQuitting) return;
    setIsQuitting(true);

    try {
      await submitCurrentScore();
    } catch (err) {
      console.error('Failed to submit abandoned run:', err);
    } finally {
      useGameStore.getState().setGameState('lobby');
    }
  };

  return (
    <div className="screen" style={{ height: '100vh' }}>
      <div className="game-hud">
        <div className="exp-track">
          <div className="exp-fill" style={{ width: `${expPercent}%` }} />
        </div>

        <div className="hud-row">
          <div className="hud-actions">
            <button className="hud-button" onClick={togglePause}>
              {isPaused && !isLevelUpModalOpen && !isQuizModalOpen ? '재개' : '일시정지'}
            </button>
            <button className="hud-button danger" onClick={handleQuit} disabled={isQuitting}>
              {isQuitting ? '저장 중' : '나가기'}
            </button>
          </div>

          <div className="hud-meter">
            <div className="title-font hud-level">LV {level}</div>
            <div className="title-font hud-time">
              {Math.floor(survivalTime / 60).toString().padStart(2, '0')}:{(Math.floor(survivalTime) % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="skill-strip">
            {activeSkills.map((skill) => (
              <div className="skill-chip" key={skill.name}>
                <span>{skill.name.substring(0, 3).toUpperCase()}</span>
                <strong>{skill.level}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block' }}
      />

      {gameOver && (
        <div className="overlay" style={{ zIndex: 50 }}>
          <button className="auth-button" onClick={() => window.location.reload()}>Restart Game</button>
        </div>
      )}

      {isPaused && !isLevelUpModalOpen && !isQuizModalOpen && !gameOver && (
        <div className="pause-overlay">
          <h1 className="title-font pause-label">PAUSED</h1>
        </div>
      )}

      <SkillSelectionModal />
      <QuizModal />
    </div>
  );
};
