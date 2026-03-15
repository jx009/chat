"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ModuleCard } from "@/components/admin/module-card";
import { ApiError } from "@/services/api-client";
import { getPaymentConfig, updatePaymentConfig } from "@/services/payment-service";
import { useAuthStore } from "@/stores/auth-store";

const paymentSchema = z.object({
  merchantId: z.string().max(128).optional(),
  appId: z.string().max(128).optional(),
  appKey: z.string().max(255).optional(),
  notifyUrl: z.string().max(255).optional(),
  gatewayUrl: z.string().max(255).optional(),
  signType: z.string().max(32).optional(),
  sandboxEnabled: z.boolean(),
  isActive: z.boolean(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const defaultValues: PaymentFormValues = {
  merchantId: "",
  appId: "",
  appKey: "",
  notifyUrl: "",
  gatewayUrl: "",
  signType: "md5",
  sandboxEnabled: true,
  isActive: true,
};

export default function AdminPaymentsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues,
  });

  const paymentConfigQuery = useQuery({
    queryKey: ["payment-config", accessToken],
    queryFn: () => getPaymentConfig(accessToken!),
    enabled: !!accessToken,
  });

  useEffect(() => {
    if (!paymentConfigQuery.data) {
      return;
    }

    reset({
      merchantId: paymentConfigQuery.data.merchantId,
      appId: paymentConfigQuery.data.appId,
      appKey: paymentConfigQuery.data.appKey,
      notifyUrl: paymentConfigQuery.data.notifyUrl,
      gatewayUrl: paymentConfigQuery.data.gatewayUrl,
      signType: paymentConfigQuery.data.signType || "md5",
      sandboxEnabled: paymentConfigQuery.data.sandboxEnabled,
      isActive: paymentConfigQuery.data.isActive,
    });
  }, [paymentConfigQuery.data, reset]);

  const updateMutation = useMutation({
    mutationFn: (input: PaymentFormValues) => updatePaymentConfig(accessToken!, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payment-config"] });
      setSubmitError(null);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await updateMutation.mutateAsync(values);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "支付配置保存失败，请稍后重试",
      );
    }
  });

  return (
    <AdminPageShell
      eyebrow="Payments"
      title="支付配置"
      description="本页已经接入支付配置读取和更新接口。当前阶段只做配置管理，不做真实支付下单与回调。"
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">配置表单</h2>
          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-[var(--muted)]">商户号</label>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                  {...register("merchantId")}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--muted)]">应用 ID</label>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                  {...register("appId")}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">应用密钥</label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                {...register("appKey")}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">回调地址</label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                {...register("notifyUrl")}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">支付网关地址</label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                {...register("gatewayUrl")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-[var(--muted)]">签名方式</label>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                  {...register("signType")}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--muted)]">沙箱模式</label>
                <select
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                  {...register("sandboxEnabled", {
                    setValueAs: (value) => value === "true",
                  })}
                >
                  <option value="true">开启</option>
                  <option value="false">关闭</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--muted)]">启用状态</label>
                <select
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                  {...register("isActive", {
                    setValueAs: (value) => value === "true",
                  })}
                >
                  <option value="true">启用</option>
                  <option value="false">停用</option>
                </select>
              </div>
            </div>

            {submitError ? (
              <div className="rounded-2xl border border-[#f0c2bb] bg-[#fff4f1] px-4 py-3 text-sm text-[#bf3b2c]">
                {submitError}
              </div>
            ) : null}

            <button
              className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-medium text-white disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "保存中..." : "保存支付配置"}
            </button>
          </form>
        </section>

        <section className="grid gap-4">
          <ModuleCard
            title="当前阶段说明"
            description="这里管理的是支付接入所需的静态配置，下一步才会接支付下单、订单状态和回调逻辑。"
            statusLabel="第六步"
          />
          <ModuleCard
            title="配置状态"
            description={
              paymentConfigQuery.isLoading
                ? "正在读取当前支付配置..."
                : paymentConfigQuery.error
                  ? paymentConfigQuery.error instanceof ApiError
                    ? paymentConfigQuery.error.message
                    : "读取支付配置失败"
                  : `当前签名方式：${paymentConfigQuery.data?.signType || "未配置"}`
            }
            statusLabel={paymentConfigQuery.data?.isActive ? "启用中" : "未启用"}
          />
        </section>
      </div>
    </AdminPageShell>
  );
}
