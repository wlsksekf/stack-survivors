import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { submitCurrentScore } from '../lib/score';

export const GameOverScreen: React.FC = () => {
  const { restartGame, survivalTime, level, activeSkills, correctAnswers } = useGameStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted || submitting) return;

    const submitScore = async () => {
      setSubmitting(true);
      try {
        await submitCurrentScore();
        setSubmitted(true);
      } catch (err) {
        console.error('Failed to submit score:', err);
      } finally {
        setSubmitting(false);
      }
    };

    submitScore();
  }, [survivalTime, level, correctAnswers, submitted, submitting]);

  return (
    <main className="screen game-over">
      <section className="game-over-shell">
        <h1 className="title-font game-over-title">GAME OVER</h1>

        <div className="panel stats-panel">
          <div className="status-line title-font">
            {submitting && '기록 저장 중...'}
            {submitted && '랭킹 기록 저장 완료'}
          </div>

          <h2 className="title-font panel-title">RUN STATISTICS</h2>
          <div className="stat-grid">
            <div className="stat-row">
              <span>도달 레벨</span>
              <strong className="title-font">{level}</strong>
            </div>
            <div className="stat-row">
              <span>생존 시간</span>
              <strong className="title-font">{Math.floor(survivalTime)}s</strong>
            </div>
            <div className="stat-row">
              <span>정답 수</span>
              <strong className="title-font">{correctAnswers}</strong>
            </div>
          </div>

          <div className="earned-skills">
            {activeSkills.map((skill) => (
              <span className="skill-chip" key={skill.name}>
                <span>{skill.name.substring(0, 3).toUpperCase()}</span>
                <strong>Lv.{skill.level}</strong>
              </span>
            ))}
          </div>
        </div>

        <button className="title-font return-button" onClick={restartGame}>RETURN TO LOBBY</button>
      </section>
    </main>
  );
};
