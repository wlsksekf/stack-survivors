import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';

export async function submitCurrentScore() {
  const { user, profile } = useAuthStore.getState();
  const { survivalTime, level, correctAnswers } = useGameStore.getState();

  if (survivalTime <= 0) {
    return null;
  }

  const guestName = localStorage.getItem('username') || `Guest${Math.floor(Math.random() * 10000)}`;
  localStorage.setItem('username', guestName);

  const username = profile?.nickname || user?.email || guestName;

  const response = await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: user?.id ?? null,
      username,
      survival_time: survivalTime,
      level,
      correct_answers: correctAnswers
    })
  });

  if (!response.ok) {
    throw new Error('Failed to submit score');
  }

  return response.json();
}
