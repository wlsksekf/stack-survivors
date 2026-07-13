import { GameCanvas } from './components/GameCanvas'
import { Lobby } from './components/Lobby'
import { GameOverScreen } from './components/GameOverScreen'
import { useGameStore } from './store/gameStore'
import './App.css'

function App() {
  const gameState = useGameStore(state => state.gameState);

  return (
    <>
      {gameState === 'lobby' && <Lobby />}
      {gameState === 'playing' && <GameCanvas />}
      {gameState === 'gameover' && <GameOverScreen />}
    </>
  )
}

export default App
