"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedGuard } from "@/components/auth/page-guards";
import { adminNavItems } from "@/components/admin/admin-config";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);

  return (
    <ProtectedGuard allowedRoles={["admin"]}>
      <div className="grid min-h-screen grid-cols-1 bg-[#ede7dc] md:grid-cols-[280px_1fr]">
        <aside className="border-b border-black/5 bg-[#182027] px-6 py-6 text-white md:border-b-0 md:border-r md:border-r-white/10">
          <div className="rounded-[28px] bg-white/6 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">
              Admin Console
            </p>
            <h1 className="mt-3 text-2xl font-semibold">管理后台</h1>
            <p className="mt-3 text-sm leading-6 text-white/70">
              当前管理员：{user?.username}
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            {adminNavItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-[22px] px-4 py-4 transition ${
                    isActive
                      ? "bg-white text-[#182027]"
                      : "text-white/78 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                        isActive
                          ? "bg-[#f1e0d0] text-[var(--accent)]"
                          : "bg-white/10 text-white/55"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p
                    className={`mt-2 text-xs leading-5 ${
                      isActive ? "text-[#51606d]" : "text-white/55"
                    }`}
                  >
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 grid gap-3">
            <button
              className="rounded-2xl border border-white/16 px-4 py-3 text-sm text-white/82 transition hover:bg-white/10 hover:text-white"
              onClick={() => router.push("/chat")}
              type="button"
            >
              返回聊天页
            </button>
            <button
              className="rounded-2xl border border-white/16 px-4 py-3 text-sm text-white/82 transition hover:bg-white/10 hover:text-white"
              onClick={() => {
                clear();
                router.replace("/login");
              }}
              type="button"
            >
              退出登录
            </button>
          </div>
        </aside>

        <main className="min-h-screen">
          <header className="border-b border-black/5 bg-white/55 px-6 py-5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                  Step 5
                </p>
                <h2 className="mt-2 text-xl font-semibold">后台基础框架</h2>
              </div>
              <div className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--muted)]">
                当前路由：{pathname}
              </div>
            </div>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </ProtectedGuard>
  );
}
