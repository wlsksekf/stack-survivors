import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const GameOverScreen: React.FC = () => {
  const { restartGame, survivalTime, level, activeSkills, correctAnswers } = useGameStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Only submit once
    if (submitted || submitting) return;
    
    const submitScore = async () => {
      setSubmitting(true);
      try {
        // In a real game, you would have a login system to get the username.
        // We'll just generate a random guest name or prompt them.
        const username = localStorage.getItem('username') || `Guest${Math.floor(Math.random() * 10000)}`;
        localStorage.setItem('username', username);

        await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            survival_time: survivalTime,
            level,
            correct_answers: correctAnswers
          })
        });
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
    <div style={{
      width: '100%', height: '100vh',
      backgroundColor: '#050505',
      backgroundImage: 'radial-gradient(circle at center, #2a0808 0%, #050505 100%)',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      color: 'white', position: 'relative', overflow: 'hidden'
    }}>
      {/* Glitch/Scanline effect background */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 0, 0, 0.05) 2px, rgba(255, 0, 0, 0.05) 4px)',
        zIndex: 0, pointerEvents: 'none'
      }}></div>

      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="title-font" style={{ 
          fontSize: '80px', marginBottom: '40px', color: '#ef4444', 
          textShadow: '0 0 10px #dc2626, 0 0 20px #b91c1c, 0 0 40px #991b1b',
          letterSpacing: '10px'
        }}>
          GAME OVER
        </h1>
        
        <div style={{
          background: 'rgba(20, 5, 5, 0.8)', padding: '40px', borderRadius: '16px',
          textAlign: 'center', marginBottom: '50px', 
          border: '2px solid #991b1b', boxShadow: '0 0 30px rgba(153, 27, 27, 0.5)',
          minWidth: '400px'
        }}>
          {submitting && <div className="title-font" style={{ color: '#fcd34d', marginBottom: '20px' }}>점수 등록 중...</div>}
          {submitted && <div className="title-font" style={{ color: '#10b981', marginBottom: '20px' }}>점수 저장 완료!</div>}
          
          <h2 className="title-font" style={{ color: '#f87171', marginBottom: '30px', fontSize: '28px', borderBottom: '1px solid #7f1d1d', paddingBottom: '10px' }}>
            STATISTICS
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left', fontSize: '22px' }}>
            <span style={{ color: '#94a3b8' }}>달성 레벨</span>
            <span className="title-font" style={{ color: '#60a5fa', textAlign: 'right' }}>{level}</span>
            
            <span style={{ color: '#94a3b8' }}>생존 시간</span>
            <span className="title-font" style={{ color: '#fcd34d', textAlign: 'right' }}>{Math.floor(survivalTime)}s</span>
            
            <span style={{ color: '#94a3b8' }}>맞힌 퀴즈</span>
            <span className="title-font" style={{ color: '#10b981', textAlign: 'right' }}>{correctAnswers}</span>
          </div>
          
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ color: '#94a3b8', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
              획득 스킬
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {activeSkills.map(s => (
                <div key={s.name} style={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '8px 12px', borderRadius: '6px',
                  border: '1px solid #38bdf8', display: 'flex', gap: '8px', alignItems: 'baseline'
                }}>
                  <span style={{ fontSize: '16px', color: '#e0f2fe' }}>{s.name}</span>
                  <span className="title-font" style={{ fontSize: '14px', color: '#38bdf8' }}>Lv.{s.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <button 
          onClick={restartGame}
          className="title-font"
          style={{
            padding: '20px 50px', fontSize: '24px', fontWeight: 'bold',
            backgroundColor: 'transparent', color: '#f87171',
            border: '2px solid #f87171', borderRadius: '12px', cursor: 'pointer',
            boxShadow: '0 0 15px rgba(248, 113, 113, 0.4), inset 0 0 10px rgba(248, 113, 113, 0.2)',
            transition: 'all 0.2s', letterSpacing: '2px'
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(248, 113, 113, 0.6), inset 0 0 15px rgba(248, 113, 113, 0.4)';
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(248, 113, 113, 0.4), inset 0 0 10px rgba(248, 113, 113, 0.2)';
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          RETURN TO LOBBY
        </button>
      </div>
    </div>
  );
};
