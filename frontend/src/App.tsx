import { useEffect } from 'react'
import { GameCanvas } from './components/GameCanvas'
import { Lobby } from './components/Lobby'
import { GameOverScreen } from './components/GameOverScreen'
import { useGameStore } from './store/gameStore'
import { useAuthStore } from './store/authStore'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const gameState = useGameStore(state => state.gameState);
  const { setUser, setProfile } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setProfile(
          session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email,
          session.user.user_metadata.avatar_url
        );
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setProfile(
          session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email,
          session.user.user_metadata.avatar_url
        );
      } else {
        setProfile(null, null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile]);

  return (
    <>
      {gameState === 'lobby' && <Lobby />}
      {gameState === 'playing' && <GameCanvas />}
      {gameState === 'gameover' && <GameOverScreen />}
    </>
  )
}

export default App
