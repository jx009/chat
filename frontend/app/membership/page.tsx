"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProtectedGuard } from "@/components/auth/page-guards";
import { ApiError } from "@/services/api-client";
import { getCurrentUser } from "@/services/auth-service";
import { getMembershipInfo } from "@/services/membership-service";
import { createPaymentOrder, getPaymentOrder } from "@/services/order-service";
import { getPackages } from "@/services/package-service";
import { useAuthStore } from "@/stores/auth-store";
import { MembershipPackage } from "@/types/package";

function formatDuration(durationType: "1_month" | "3_month") {
  return durationType === "1_month" ? "1 个月" : "3 个月";
}

export default function MembershipPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [latestOrderId, setLatestOrderId] = useState<number | null>(null);

  const packagesQuery = useQuery({
    queryKey: ["packages", accessToken],
    queryFn: () => getPackages(accessToken!),
    enabled: !!accessToken,
  });

  const membershipQuery = useQuery({
    queryKey: ["membership", accessToken],
    queryFn: () => getMembershipInfo(accessToken!),
    enabled: !!accessToken,
  });

  const orderQuery = useQuery({
    queryKey: ["payment-order", latestOrderId, accessToken],
    queryFn: () => getPaymentOrder(accessToken!, latestOrderId!),
    enabled: !!accessToken && !!latestOrderId,
  });

  const createOrderMutation = useMutation({
    mutationFn: (pkg: MembershipPackage) => createPaymentOrder(accessToken!, pkg.id),
    onSuccess: (order) => {
      setLatestOrderId(order.id);
      setSubmitError(null);
    },
  });

  const refreshOrderMutation = useMutation({
    mutationFn: () => getPaymentOrder(accessToken!, latestOrderId!),
    onSuccess: async (order) => {
      await queryClient.setQueryData(
        ["payment-order", latestOrderId, accessToken],
        order,
      );

      if (order.status === "paid") {
        await queryClient.invalidateQueries({ queryKey: ["membership"] });
        const currentUser = await getCurrentUser(accessToken!);
        setUser(currentUser);
      }
    },
  });

  const handleCreateOrder = async (pkg: MembershipPackage) => {
    setSubmitError(null);

    try {
      await createOrderMutation.mutateAsync(pkg);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "创建订单失败，请稍后重试",
      );
    }
  };

  const handleRefreshOrder = async () => {
    if (!latestOrderId) {
      return;
    }

    setSubmitError(null);

    try {
      await refreshOrderMutation.mutateAsync();
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "刷新订单状态失败，请稍后重试",
      );
    }
  };

  return (
    <ProtectedGuard>
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12">
        <section className="rounded-[32px] border border-[var(--border)] bg-[var(--card)] p-8 shadow-[0_18px_60px_rgba(32,34,37,0.08)] backdrop-blur">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
            Membership
          </p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-semibold">会员中心</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                当前登录用户：{user?.username}。本页已经接入套餐展示、订单创建和订单状态刷新，支付平台回调成功后会员状态会自动生效。
              </p>
            </div>
            <Link
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm"
              href="/chat"
            >
              返回聊天页
            </Link>
          </div>
          <div className="mt-6 rounded-[24px] bg-white/80 px-5 py-4 text-sm text-[var(--muted)]">
            当前会员状态：{membershipQuery.data?.status ?? user?.membershipStatus ?? "none"}
            {membershipQuery.data?.expireAt
              ? `，到期时间：${membershipQuery.data.expireAt}`
              : user?.membershipExpireAt
                ? `，到期时间：${user.membershipExpireAt}`
                : ""}
          </div>
        </section>

        <section className="mt-8">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              {packagesQuery.isLoading ? (
                <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-6 text-sm text-[var(--muted)]">
                  正在加载套餐列表...
                </div>
              ) : null}

              {packagesQuery.error ? (
                <div className="rounded-[24px] border border-[#f0c2bb] bg-[#fff4f1] p-6 text-sm text-[#bf3b2c]">
                  {packagesQuery.error instanceof ApiError
                    ? packagesQuery.error.message
                    : "套餐加载失败，请稍后重试"}
                </div>
              ) : null}

              {packagesQuery.data ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {packagesQuery.data.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[28px] border border-[var(--border)] bg-white/80 p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-semibold">{item.name}</h2>
                          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            {item.description || "暂无套餐说明"}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#f5eee6] px-3 py-1 text-xs font-medium text-[var(--accent)]">
                          {formatDuration(item.durationType)}
                        </span>
                      </div>
                      <div className="mt-6 text-4xl font-semibold">
                        ¥{item.price.toFixed(2)}
                      </div>
                      <button
                        className="mt-6 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-medium text-white disabled:opacity-60"
                        disabled={createOrderMutation.isPending}
                        onClick={() => {
                          void handleCreateOrder(item);
                        }}
                        type="button"
                      >
                        {createOrderMutation.isPending ? "创建订单中..." : "立即充值"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <aside className="space-y-4">
              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-6 shadow-sm">
                <h2 className="text-xl font-semibold">订单状态</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  下单后会在这里显示最近订单状态。支付平台回调成功后，点击刷新状态即可同步会员信息。
                </p>

                {latestOrderId ? (
                  <div className="mt-5 rounded-2xl bg-[#faf7f2] p-4">
                    <p className="text-sm text-[var(--muted)]">
                      本地订单 ID：{latestOrderId}
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      当前状态：{orderQuery.data?.status ?? "pending"}
                    </p>
                    {orderQuery.data?.orderNo ? (
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        订单号：{orderQuery.data.orderNo}
                      </p>
                    ) : null}
                    {orderQuery.data?.paidAt ? (
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        支付时间：{orderQuery.data.paidAt}
                      </p>
                    ) : null}
                    <button
                      className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                      disabled={refreshOrderMutation.isPending}
                      onClick={() => {
                        void handleRefreshOrder();
                      }}
                      type="button"
                    >
                      {refreshOrderMutation.isPending ? "刷新中..." : "刷新订单状态"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-[#faf7f2] p-4 text-sm text-[var(--muted)]">
                    还没有创建订单。
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-6 shadow-sm">
                <h2 className="text-xl font-semibold">支付说明</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  当前阶段已经接入本地订单创建、订单状态查询和会员权益发放逻辑。真实支付网关由支付配置控制，外部回调成功后会员状态会更新。
                </p>
              </div>

              {submitError ? (
                <div className="rounded-[24px] border border-[#f0c2bb] bg-[#fff4f1] p-6 text-sm text-[#bf3b2c]">
                  {submitError}
                </div>
              ) : null}
            </aside>
          </div>
        </section>
      </main>
    </ProtectedGuard>
  );
}
