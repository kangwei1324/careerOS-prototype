"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";

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

/**
 * Hook that returns true once Zustand has finished hydrating from localStorage.
 * Use this to prevent auth guards from redirecting before the persisted state is loaded.
 */
export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist middleware exposes onFinishHydration on the persist API
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // If hydration already happened (e.g., store was already initialised), set immediately
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsub;
  }, []);

  return hydrated;
}
