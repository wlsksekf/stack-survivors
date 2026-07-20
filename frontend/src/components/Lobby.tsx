import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  id: string;
  username: string;
  survival_time: number;
  level: number;
  correct_answers: number;
}

export const Lobby: React.FC = () => {
  const { startGame } = useGameStore();
  const { user, profile } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLB, setLoadingLB] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoadingLB(false);
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{
      width: '100%', height: '100vh',
      backgroundColor: '#0a0a0a',
      backgroundImage: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%)',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      color: 'white', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background Grid Effect */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '30px 30px', zIndex: 0, pointerEvents: 'none'
      }}></div>

      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="title-font" style={{ 
          fontSize: '72px', marginBottom: '10px', 
          color: '#fff', textShadow: '0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #0ff',
          letterSpacing: '4px', textAlign: 'center'
        }}>
          STACK SURVIVORS
        </h1>
        <p style={{ fontSize: '20px', color: '#a5b4fc', marginBottom: '50px', letterSpacing: '2px', textShadow: '0 0 5px #a5b4fc' }}>
          버그 몬스터를 물리치고 최고의 개발자가 되어보세요!
        </p>

        <div style={{ display: 'flex', gap: '60px', alignItems: 'flex-start' }}>
          
          {/* Action Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {user ? (
              <div style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', 
                marginBottom: '40px', padding: '20px', borderRadius: '16px',
                background: 'rgba(30, 41, 59, 0.7)', border: '1px solid #38bdf8',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {profile?.avatar_url && (
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile" 
                      style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #0ea5e9' }}
                    />
                  )}
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#e0f2fe' }}>
                    환영합니다, <span style={{ color: '#38bdf8' }}>{profile?.nickname || user.email}</span>님!
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  style={{
                    padding: '8px 20px', fontSize: '14px', fontWeight: 'bold',
                    backgroundColor: 'transparent', color: '#f87171',
                    border: '1px solid #f87171', borderRadius: '8px', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                style={{
                  padding: '15px 30px', fontSize: '18px', fontWeight: 'bold',
                  backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', cursor: 'pointer',
                  marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px',
                  backdropFilter: 'blur(5px)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '24px' }} />
                구글로 로그인하고 랭킹 등록하기
              </button>
            )}
            
            <button 
              onClick={startGame}
              className="title-font"
              style={{
                padding: '20px 60px', fontSize: '32px', fontWeight: '900',
                backgroundColor: '#dc2626', color: 'white',
                border: '2px solid #f87171', borderRadius: '12px', cursor: 'pointer',
                boxShadow: '0 0 20px rgba(220, 38, 38, 0.6), inset 0 0 10px rgba(255,255,255,0.5)',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                transition: 'all 0.1s',
                letterSpacing: '2px'
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(220, 38, 38, 0.8), inset 0 0 10px rgba(255,255,255,0.5)';
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(220, 38, 38, 0.6), inset 0 0 10px rgba(255,255,255,0.5)';
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1.05)'}
            >
              GAME START
            </button>
          </div>

          {/* Leaderboard Section */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.9) 100%)', 
            padding: '25px', borderRadius: '16px',
            border: '1px solid #334155', minWidth: '400px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}>
            <h2 className="title-font" style={{ color: '#fbbf24', marginBottom: '20px', textAlign: 'center', fontSize: '24px', letterSpacing: '2px' }}>
              GLOBAL RANKING
            </h2>
            {loadingLB ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>데이터 동기화 중...</div>
            ) : leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>아직 등록된 랭커가 없습니다.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                <thead>
                  <tr style={{ color: '#38bdf8', borderBottom: '2px solid #334155', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px' }}>순위</th>
                    <th style={{ padding: '10px 8px' }}>유저명</th>
                    <th style={{ padding: '10px 8px' }}>생존 시간</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Lv</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Q's</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr key={entry.id} style={{ 
                      borderBottom: '1px solid #1e293b',
                      backgroundColor: idx === 0 ? 'rgba(251, 191, 36, 0.1)' : 'transparent'
                    }}>
                      <td className="title-font" style={{ padding: '12px 8px', fontWeight: 'bold', color: idx === 0 ? '#fcd34d' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#b45309' : '#64748b' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: idx === 0 ? 'bold' : 'normal', color: idx === 0 ? '#fff' : '#cbd5e1' }}>
                        {entry.username.substring(0, 10)}
                      </td>
                      <td className="title-font" style={{ padding: '12px 8px', color: '#fcd34d' }}>{Math.floor(entry.survival_time)}s</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: '#60a5fa' }}>{entry.level}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: '#10b981' }}>{entry.correct_answers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
