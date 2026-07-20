import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export const Lobby: React.FC = () => {
  const { startGame } = useGameStore();
  const { user, profile } = useAuthStore();

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
      backgroundColor: '#0f172a',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      color: 'white', fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '64px', marginBottom: '10px', color: '#60a5fa' }}>
        Stack Survivors
      </h1>
      <p style={{ fontSize: '24px', color: '#94a3b8', marginBottom: '40px' }}>
        Defeat the bug monsters and master your tech stack!
      </p>

      {user ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {profile?.avatar_url && (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #3b82f6' }}
              />
            )}
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
              Welcome, {profile?.nickname || user.email}!
            </span>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 20px', fontSize: '14px',
              backgroundColor: '#ef4444', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <button 
          onClick={handleLogin}
          style={{
            padding: '12px 30px', fontSize: '18px', fontWeight: 'bold',
            backgroundColor: '#ffffff', color: '#333',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px'
          }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px' }} />
          Sign in with Google
        </button>
      )}
      
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
