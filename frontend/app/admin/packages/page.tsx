"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ApiError } from "@/services/api-client";
import {
  createPackage,
  getAdminPackages,
  updatePackage,
} from "@/services/package-service";
import { useAuthStore } from "@/stores/auth-store";
import { MembershipPackage } from "@/types/package";

const packageSchema = z.object({
  name: z.string().min(1, "请输入套餐名称").max(100),
  price: z.coerce.number().min(0.01, "价格必须大于 0"),
  durationType: z.enum(["1_month", "3_month"]),
  description: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number(),
});

type PackageFormValues = z.infer<typeof packageSchema>;

const defaultValues: PackageFormValues = {
  name: "",
  price: 29.9,
  durationType: "1_month",
  description: "",
  isActive: true,
  sortOrder: 1,
};

function durationLabel(value: "1_month" | "3_month") {
  return value === "1_month" ? "1 个月" : "3 个月";
}

export default function AdminPackagesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [editingPackage, setEditingPackage] = useState<MembershipPackage | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues,
  });

  const packagesQuery = useQuery({
    queryKey: ["admin-packages", accessToken],
    queryFn: () => getAdminPackages(accessToken!),
    enabled: !!accessToken,
  });

  const createMutation = useMutation({
    mutationFn: (input: PackageFormValues) => createPackage(accessToken!, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      reset(defaultValues);
      setSubmitError(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: PackageFormValues) =>
      updatePackage(accessToken!, editingPackage!.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      reset(defaultValues);
      setEditingPackage(null);
      setSubmitError(null);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      if (editingPackage) {
        await updateMutation.mutateAsync(values);
        return;
      }

      await createMutation.mutateAsync(values);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "保存套餐失败，请稍后重试",
      );
    }
  });

  return (
    <AdminPageShell
      eyebrow="Packages"
      title="套餐管理"
      description="本页已经接入后台套餐管理接口。管理员可以新增套餐、编辑套餐，并实时看到当前启用状态。"
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">套餐列表</h2>
            <span className="text-sm text-[var(--muted)]">
              {packagesQuery.data?.length ?? 0} 个套餐
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {packagesQuery.isLoading ? (
              <div className="rounded-2xl bg-[#faf7f2] px-4 py-4 text-sm text-[var(--muted)]">
                正在加载套餐列表...
              </div>
            ) : null}

            {packagesQuery.error ? (
              <div className="rounded-2xl border border-[#f0c2bb] bg-[#fff4f1] px-4 py-4 text-sm text-[#bf3b2c]">
                {packagesQuery.error instanceof ApiError
                  ? packagesQuery.error.message
                  : "套餐列表加载失败"}
              </div>
            ) : null}

            {packagesQuery.data?.map((item) => (
              <div
                key={item.id}
                className="rounded-[22px] border border-[var(--border)] bg-[#faf7f2] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium">{item.name}</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--muted)]">
                        {durationLabel(item.durationType)}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--muted)]">
                        {item.isActive ? "启用中" : "已停用"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {item.description || "暂无说明"}
                    </p>
                    <p className="mt-4 text-2xl font-semibold">
                      ¥{item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm"
                      onClick={() => {
                        setEditingPackage(item);
                        setValue("name", item.name);
                        setValue("price", item.price);
                        setValue("durationType", item.durationType);
                        setValue("description", item.description ?? "");
                        setValue("isActive", item.isActive);
                        setValue("sortOrder", item.sortOrder);
                      }}
                      type="button"
                    >
                      编辑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              {editingPackage ? "编辑套餐" : "新增套餐"}
            </h2>
            {editingPackage ? (
              <button
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                onClick={() => {
                  setEditingPackage(null);
                  reset(defaultValues);
                }}
                type="button"
              >
                取消编辑
              </button>
            ) : null}
          </div>

          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">套餐名称</label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                {...register("name")}
              />
              {errors.name ? (
                <p className="mt-2 text-sm text-[#bf3b2c]">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-[var(--muted)]">金额</label>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                  step="0.01"
                  type="number"
                  {...register("price")}
                />
                {errors.price ? (
                  <p className="mt-2 text-sm text-[#bf3b2c]">{errors.price.message}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--muted)]">有效期</label>
                <select
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                  {...register("durationType")}
                >
                  <option value="1_month">1 个月</option>
                  <option value="3_month">3 个月</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">说明文字</label>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                {...register("description")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-[var(--muted)]">排序值</label>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                  type="number"
                  {...register("sortOrder")}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--muted)]">状态</label>
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
              {isSubmitting
                ? "保存中..."
                : editingPackage
                  ? "保存修改"
                  : "新增套餐"}
            </button>
          </form>
        </section>
      </div>
    </AdminPageShell>
  );
}
