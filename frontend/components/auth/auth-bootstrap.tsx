"use client";

import { useEffect, useRef } from "react";
import { getCurrentUser, refreshToken } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";

export function AuthBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshTokenValue = useAuthStore((state) => state.refreshToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const setAuthReady = useAuthStore((state) => state.setAuthReady);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);
  const clear = useAuthStore((state) => state.clear);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const syncUser = async () => {
      if (!accessToken) {
        setAuthReady(true);
        return;
      }

      try {
        const user = await getCurrentUser(accessToken, {
          skipAuthRedirect: true,
        });
        setUser(user);
        setAuthReady(true);
        return;
      } catch {
        if (!refreshTokenValue) {
          clear();
          return;
        }
      }

      try {
        const refreshed = await refreshToken({
          refreshToken: refreshTokenValue!,
        });

        setTokens({
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        });
        setUser(refreshed.user);
        setAuthReady(true);
      } catch {
        clear();
      }
    };

    void syncUser();
  }, [
    accessToken,
    clear,
    hydrated,
    refreshTokenValue,
    setAuthReady,
    setTokens,
    setUser,
  ]);

  return null;
}
