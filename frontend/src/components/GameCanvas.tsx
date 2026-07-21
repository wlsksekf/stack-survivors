import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import { useGameLoop } from '../hooks/useGameLoop';
import { useGameStore } from '../store/gameStore';
import { SkillSelectionModal } from './SkillSelectionModal';
import { QuizModal } from './QuizModal';
import { submitCurrentScore } from '../lib/score';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scoreSubmittedRef = useRef(false);

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const [isQuitting, setIsQuitting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

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

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );
    };
  }, []);

  const saveScoreOnce = useCallback(async () => {
    if (scoreSubmittedRef.current) {
      return;
    }

    scoreSubmittedRef.current = true;

    try {
      await submitCurrentScore();
    } catch (error) {
      // 저장 실패 시 다시 시도할 수 있도록 잠금을 해제
      scoreSubmittedRef.current = false;
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!gameOver) {
      return;
    }

    saveScoreOnce().catch((error) => {
      console.error(
        'Failed to submit game-over score:',
        error
      );
    });
  }, [gameOver, saveScoreOnce]);

  const safeExpToNextLevel = Math.max(
    1,
    expToNextLevel
  );

  const rawExpPercent =
    (exp / safeExpToNextLevel) * 100;

  const expPercent = Math.min(
    100,
    Math.max(0, rawExpPercent)
  );

  const formattedMinutes = Math.floor(
    survivalTime / 60
  )
    .toString()
    .padStart(2, '0');

  const formattedSeconds = (
    Math.floor(survivalTime) % 60
  )
    .toString()
    .padStart(2, '0');

  const handleQuit = async () => {
    if (isQuitting || isRestarting) {
      return;
    }

    setIsQuitting(true);

    try {
      await saveScoreOnce();
    } catch (error) {
      console.error(
        'Failed to submit abandoned run:',
        error
      );
    } finally {
      useGameStore
        .getState()
        .setGameState('lobby');
    }
  };

  const handleRestart = async () => {
    if (isRestarting || isQuitting) {
      return;
    }

    setIsRestarting(true);

    try {
      await saveScoreOnce();
    } catch (error) {
      console.error(
        'Failed to submit score before restart:',
        error
      );
    } finally {
      window.location.reload();
    }
  };

  const showPauseOverlay =
    isPaused
    && !isLevelUpModalOpen
    && !isQuizModalOpen
    && !gameOver;

  return (
    <div
      className="screen"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      <div className="game-hud">
        <div className="exp-track">
          <div
            className="exp-fill"
            style={{
              width: `${expPercent}%`
            }}
          />
        </div>

        <div className="hud-row">
          <div className="hud-actions">
            <button
              type="button"
              className="hud-button"
              onClick={togglePause}
              disabled={
                gameOver
                || isLevelUpModalOpen
                || isQuizModalOpen
              }
            >
              {isPaused
              && !isLevelUpModalOpen
              && !isQuizModalOpen
                ? '재개'
                : '일시정지'}
            </button>

            <button
              type="button"
              className="hud-button danger"
              onClick={handleQuit}
              disabled={
                isQuitting
                || isRestarting
                || gameOver
              }
            >
              {isQuitting
                ? '저장 중'
                : '나가기'}
            </button>
          </div>

          <div className="hud-meter">
            <div className="title-font hud-level">
              LV {level}
            </div>

            <div className="title-font hud-time">
              {formattedMinutes}:{formattedSeconds}
            </div>
          </div>

          <div className="skill-strip">
            {activeSkills.map((skill) => (
              <div
                className="skill-chip"
                key={skill.name}
              >
                <span>
                  {skill.name
                    .substring(0, 3)
                    .toUpperCase()}
                </span>

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
        style={{
          display: 'block',
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`
        }}
      />

      {gameOver && (
        <div
          className="overlay"
          style={{ zIndex: 50 }}
        >
          <button
            type="button"
            className="auth-button"
            onClick={handleRestart}
            disabled={isRestarting}
          >
            {isRestarting
              ? '저장 중...'
              : 'Restart Game'}
          </button>
        </div>
      )}

      {showPauseOverlay && (
        <div className="pause-overlay">
          <h1 className="title-font pause-label">
            PAUSED
          </h1>
        </div>
      )}

      <SkillSelectionModal />
      <QuizModal />
    </div>
  );
};