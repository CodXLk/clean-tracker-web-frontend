// Store ONLY non-sensitive display info — NEVER tokens or passwords
import { create } from "zustand";

type AuthUser = {
  id:   string;
  name: string;
  role: string;
};

type AuthDisplayState = {
  user:     AuthUser | null;
  isAuthed: boolean;
  setUser:  (user: AuthUser | null) => void;
  clear:    () => void;
};

export const useAuthStore = create<AuthDisplayState>((set) => ({
  user:     null,
  isAuthed: false,
  setUser:  (user) => set({ user, isAuthed: !!user }),
  clear:    () => set({ user: null, isAuthed: false }),
}));
