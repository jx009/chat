"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { GuestGuard } from "@/components/auth/page-guards";
import { ApiError } from "@/services/api-client";
import { checkUsername, register, suggestUsername } from "@/services/auth-service";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(4, "用户名长度不能少于 4 位")
      .max(20, "用户名长度不能超过 20 位")
      .regex(/^[A-Za-z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
    password: z.string().min(8, "密码长度不能少于 8 位"),
    confirmPassword: z.string().min(8, "确认密码长度不能少于 8 位"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "两次输入的密码不一致",
  });

type RegisterFormValues = z.infer<typeof registerSchema>;
type UsernameStatus = "idle" | "checking" | "available" | "taken";

export default function RegisterPage() {
  const router = useRouter();
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  const {
    register: formRegister,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const username = watch("username");

  useEffect(() => {
    const trimmed = username.trim();
    let isActive = true;

    if (trimmed.length < 4 || !/^[A-Za-z0-9_]+$/.test(trimmed)) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");

    const timer = window.setTimeout(async () => {
      try {
        const result = await checkUsername(trimmed);

        if (!isActive) {
          return;
        }

        setUsernameStatus(result.available ? "available" : "taken");

        if (result.available) {
          clearErrors("username");
        }
      } catch {
        if (isActive) {
          setUsernameStatus("idle");
        }
      }
    }, 400);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [clearErrors, username]);

  const handleSuggest = async () => {
    if (!username.trim()) {
      return;
    }

    setSuggesting(true);

    try {
      const result = await suggestUsername(username);
      setValue("username", result.username, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      clearErrors("username");
      setUsernameStatus("available");
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "用户名推荐失败，请稍后重试",
      );
    } finally {
      setSuggesting(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    if (usernameStatus === "taken") {
      setError("username", {
        type: "manual",
        message: "用户名已存在，请更换或点击骰子推荐",
      });
      return;
    }

    try {
      await register(values);
      router.replace(`/login?username=${encodeURIComponent(values.username)}`);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "注册失败，请稍后重试";

      if (message.includes("username")) {
        setError("username", {
          type: "manual",
          message: "用户名已存在，请更换或点击骰子推荐",
        });
        setUsernameStatus("taken");
        return;
      }

      setSubmitError(message);
    }
  });

  return (
    <GuestGuard>
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
        <section className="w-full rounded-[28px] border border-[var(--border)] bg-white/80 p-8 shadow-[0_18px_60px_rgba(32,34,37,0.08)]">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
            Register
          </p>
          <h1 className="mt-4 text-3xl font-semibold">用户注册</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            注册时会实时检测用户名是否重复。若用户名已存在，可以点击右侧骰子按钮生成可用用户名。
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">用户名</label>
              <div className="flex gap-3">
                <input
                  className="flex-1 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                  placeholder="请输入用户名"
                  {...formRegister("username")}
                />
                {usernameStatus === "taken" ? (
                  <button
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-lg"
                    disabled={suggesting}
                    onClick={handleSuggest}
                    type="button"
                  >
                    {suggesting ? "..." : "随机"}
                  </button>
                ) : null}
              </div>
              {errors.username ? (
                <p className="mt-2 text-sm text-[#bf3b2c]">{errors.username.message}</p>
              ) : null}
              {!errors.username && usernameStatus === "checking" ? (
                <p className="mt-2 text-sm text-[var(--muted)]">正在检查用户名...</p>
              ) : null}
              {!errors.username && usernameStatus === "available" ? (
                <p className="mt-2 text-sm text-[#2a7d4f]">用户名可用</p>
              ) : null}
              {!errors.username && usernameStatus === "taken" ? (
                <p className="mt-2 text-sm text-[#bf3b2c]">
                  用户名已存在，可以点击骰子推荐
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">密码</label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                type="password"
                {...formRegister("password")}
              />
              {errors.password ? (
                <p className="mt-2 text-sm text-[#bf3b2c]">{errors.password.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">
                确认密码
              </label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                type="password"
                {...formRegister("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="mt-2 text-sm text-[#bf3b2c]">
                  {errors.confirmPassword.message}
                </p>
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
              {isSubmitting ? "注册中..." : "注册"}
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--muted)]">
            已有账号？{" "}
            <Link className="font-medium text-[var(--accent)]" href="/login">
              去登录
            </Link>
          </p>
        </section>
      </main>
    </GuestGuard>
  );
}
