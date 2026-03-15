"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/types/auth";

function GuardShell({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-white/80 p-8 text-center shadow-[0_18px_60px_rgba(32,34,37,0.08)]">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
    </div>
  );
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const authReady = useAuthStore((state) => state.authReady);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!hydrated || !authReady || !user) {
      return;
    }

    router.replace(user.role === "admin" ? "/admin" : "/chat");
  }, [authReady, hydrated, router, user]);

  if (!hydrated || !authReady) {
    return (
      <GuardShell title="正在恢复登录状态" description="请稍等，正在同步本地认证信息。" />
    );
  }

  if (user) {
    return (
      <GuardShell title="正在跳转" description="你已经登录，系统正在跳转到对应页面。" />
    );
  }

  return <>{children}</>;
}

export function ProtectedGuard({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: UserRole[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((state) => state.hydrated);
  const authReady = useAuthStore((state) => state.authReady);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!hydrated || !authReady) {
      return;
    }

    if (!accessToken || !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(user.role === "admin" ? "/admin" : "/chat");
    }
  }, [accessToken, allowedRoles, authReady, hydrated, pathname, router, user]);

  if (!hydrated || !authReady) {
    return (
      <GuardShell title="正在恢复登录状态" description="请稍等，正在同步本地认证信息。" />
    );
  }

  if (!accessToken || !user) {
    return (
      <GuardShell title="需要登录" description="系统正在跳转到登录页。" />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <GuardShell title="没有访问权限" description="系统正在跳转到你可访问的页面。" />
    );
  }

  return <>{children}</>;
}
