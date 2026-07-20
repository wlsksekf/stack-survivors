import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: {
    nickname: string | null;
    avatar_url: string | null;
  } | null;
  setUser: (user: User | null) => void;
  setProfile: (nickname: string | null, avatar_url: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (nickname, avatar_url) => set({ profile: { nickname, avatar_url } })
}));
