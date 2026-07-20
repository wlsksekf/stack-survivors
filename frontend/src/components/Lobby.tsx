import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  id: string;
  username: string | null;
  survival_time: number;
  level: number;
  correct_answers: number;
  score?: number;
}

type AuthMode = 'login' | 'signup';

export const Lobby: React.FC = () => {
  const { startGame } = useGameStore();
  const { user, profile } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLB, setLoadingLB] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

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

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nickname: nickname.trim() || email.split('@')[0] } }
        });

        if (error) throw error;
        setAuthMessage('가입 완료. 메일 인증 설정이 켜져 있다면 인증 후 로그인됩니다.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setAuthMessage('로그인되었습니다.');
      }
    } catch (err) {
      setAuthMessage(err instanceof Error ? err.message : '인증 처리에 실패했습니다.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const displayName = profile?.nickname || user?.user_metadata?.nickname || user?.email;

  return (
    <main className="screen cyber-bg lobby">
      <div className="lobby-shell">
        <section className="brand-block">
          <h1 className="title-font brand-title">STACK SURVIVORS</h1>
          <p className="brand-subtitle">버그 웨이브를 버티고 기술 스택을 성장시키세요</p>
        </section>

        <section className="lobby-grid">
          <div>
            <div className="panel auth-panel">
              <h2 className="title-font panel-title">ACCESS</h2>
              {user ? (
                <div className="user-card">
                  {profile?.avatar_url && <img className="avatar" src={profile.avatar_url} alt="Profile" />}
                  <strong>{displayName}</strong>
                  <button className="secondary-button" onClick={handleLogout}>로그아웃</button>
                </div>
              ) : (
                <form className="auth-form" onSubmit={handleEmailAuth}>
                  <div className="auth-tabs">
                    <button type="button" className={`tab-button ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>로그인</button>
                    <button type="button" className={`tab-button ${authMode === 'signup' ? 'active' : ''}`} onClick={() => setAuthMode('signup')}>회원가입</button>
                  </div>
                  {authMode === 'signup' && (
                    <input className="cyber-input" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="닉네임" />
                  )}
                  <input className="cyber-input" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="이메일" required />
                  <input className="cyber-input" value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="비밀번호" required minLength={6} />
                  <button className="auth-button" type="submit" disabled={authLoading}>
                    {authLoading ? '처리 중...' : authMode === 'signup' ? '이메일로 가입' : '이메일로 로그인'}
                  </button>
                  <button className="auth-button google-button" type="button" onClick={handleGoogleLogin}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 20 }} />
                    Google로 로그인
                  </button>
                  <div className="auth-message">{authMessage}</div>
                </form>
              )}
            </div>

            <button className="title-font start-button" onClick={startGame}>GAME START</button>
          </div>

          <div className="panel ranking-panel">
            <h2 className="title-font panel-title">GLOBAL RANKING</h2>
            {loadingLB ? (
              <div className="empty-state">랭킹을 불러오는 중...</div>
            ) : leaderboard.length === 0 ? (
              <div className="empty-state">아직 등록된 기록이 없습니다.</div>
            ) : (
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>이름</th>
                    <th>점수</th>
                    <th>생존</th>
                    <th>Lv</th>
                    <th>Q</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr key={entry.id}>
                      <td className="title-font rank-number">#{idx + 1}</td>
                      <td>{(entry.username || 'Unknown').substring(0, 12)}</td>
                      <td className="title-font">{entry.score ?? 0}</td>
                      <td className="title-font">{Math.floor(entry.survival_time)}s</td>
                      <td>{entry.level}</td>
                      <td>{entry.correct_answers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
