import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "candidate" | "employer";

export interface AuthUser {
  userId: number;
  role: UserRole;
  username: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null });
        // Also clear the server-side cookie
        fetch("/api/auth/signout", { method: "POST" });
      },
    }),
    {
      name: "careeros-auth",
    }
  )
);
