import { useEffect } from 'react'
import { GameCanvas } from './components/GameCanvas'
import { Lobby } from './components/Lobby'
import { GameOverScreen } from './components/GameOverScreen'
import { useGameStore } from './store/gameStore'
import { useAuthStore } from './store/authStore'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import './App.css'

function App() {
  const gameState = useGameStore(state => state.gameState);
  const { setUser, setProfile } = useAuthStore();

  useEffect(() => {
    const syncUser = async (user: User | null) => {
      setUser(user ?? null);

      if (!user) {
        setProfile(null, null);
        return;
      }

      const fallbackName =
        user.user_metadata.nickname ||
        user.user_metadata.full_name ||
        user.user_metadata.name ||
        user.email ||
        null;
      const fallbackAvatar = user.user_metadata.avatar_url || null;

      const { data } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(data?.nickname || fallbackName, data?.avatar_url || fallbackAvatar);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null);
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
