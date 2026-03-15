"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { GuestGuard } from "@/components/auth/page-guards";
import { ApiError } from "@/services/api-client";
import { login } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";

const loginSchema = z.object({
  username: z
    .string()
    .min(4, "用户名长度不能少于 4 位")
    .max(20, "用户名长度不能超过 20 位")
    .regex(/^[A-Za-z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
  password: z.string().min(8, "密码长度不能少于 8 位"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const usernameFromQuery = searchParams.get("username") ?? "";
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: usernameFromQuery,
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const result = await login(values);

      setTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      setUser(result.user);

      if (redirect) {
        router.replace(redirect);
        return;
      }

      router.replace(result.user.role === "admin" ? "/admin" : "/chat");
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "登录失败，请稍后重试",
      );
    }
  });

  return (
    <GuestGuard>
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
        <section className="w-full rounded-[28px] border border-[var(--border)] bg-white/80 p-8 shadow-[0_18px_60px_rgba(32,34,37,0.08)]">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
            Login
          </p>
          <h1 className="mt-4 text-3xl font-semibold">用户登录</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            使用用户名和密码登录。管理员登录后会自动跳转到后台，普通用户跳转到聊天页。
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">用户名</label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                placeholder="请输入用户名"
                {...register("username")}
              />
              {errors.username ? (
                <p className="mt-2 text-sm text-[#bf3b2c]">{errors.username.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">密码</label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                placeholder="请输入密码"
                type="password"
                {...register("password")}
              />
              {errors.password ? (
                <p className="mt-2 text-sm text-[#bf3b2c]">{errors.password.message}</p>
              ) : null}
            </div>

            {submitError ? (
              <div className="rounded-2xl border border-[#f0c2bb] bg-[#fff4f1] px-4 py-3 text-sm text-[#bf3b2c]">
                {submitError}
              </div>
            ) : null}

            <button
              className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "登录中..." : "登录"}
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--muted)]">
            还没有账号？{" "}
            <Link className="font-medium text-[var(--accent)]" href="/register">
              去注册
            </Link>
          </p>
        </section>
      </main>
    </GuestGuard>
  );
}
