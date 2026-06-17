/**
 * Zustand store for authentication state.
 * NOTE: Intentionally NOT persisted to localStorage so each refresh/new tab starts a new login session.
 */
import { create } from "zustand";
import type { AuthState, User } from "@/types";

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user: User, token: string) =>
    set({ user, token, isAuthenticated: true }),

  logout: () =>
    set({ user: null, token: null, isAuthenticated: false }),
}));

