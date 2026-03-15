import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CurrentUser } from "@/types/auth";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: CurrentUser | null;
  hydrated: boolean;
  authReady: boolean;
  setTokens: (payload: {
    accessToken: string | null;
    refreshToken: string | null;
  }) => void;
  setUser: (user: CurrentUser | null) => void;
  setHydrated: (hydrated: boolean) => void;
  setAuthReady: (authReady: boolean) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,
      authReady: false,
      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      setHydrated: (hydrated) => set({ hydrated }),
      setAuthReady: (authReady) => set({ authReady }),
      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          authReady: true,
        }),
    }),
    {
      name: "chat-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function selectIsAuthenticated(state: AuthState) {
  return !!state.accessToken && !!state.user;
}
