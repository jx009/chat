"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ApiError } from "@/services/api-client";
import {
  createModel,
  getAdminModels,
  updateModel,
} from "@/services/model-service";
import { useAuthStore } from "@/stores/auth-store";
import { AdminModel } from "@/types/model";

const modelSchema = z.object({
  name: z.string().min(1, "请输入模型名称").max(100),
  code: z
    .string()
    .min(1, "请输入模型编码")
    .max(100)
    .regex(
      /^[A-Za-z0-9_.-]+$/,
      "模型编码只能包含字母、数字、小数点、下划线和中划线",
    ),
  apiUrl: z.string().min(1, "请输入模型 URL").max(255),
  apiKey: z.string().max(255).optional(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number(),
  remark: z.string().optional(),
});

type ModelFormValues = z.infer<typeof modelSchema>;

const defaultValues: ModelFormValues = {
  name: "",
  code: "",
  apiUrl: "",
  apiKey: "",
  isActive: true,
  sortOrder: 1,
  remark: "",
};

export default function AdminModelsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [editingModel, setEditingModel] = useState<AdminModel | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema),
    defaultValues,
  });

  const modelsQuery = useQuery({
    queryKey: ["admin-models", accessToken],
    queryFn: () => getAdminModels(accessToken!),
    enabled: !!accessToken,
  });

  const createMutation = useMutation({
    mutationFn: (input: ModelFormValues) => createModel(accessToken!, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-models"] });
      reset(defaultValues);
      setSubmitError(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: ModelFormValues) =>
      updateModel(accessToken!, editingModel!.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-models"] });
      reset(defaultValues);
      setEditingModel(null);
      setSubmitError(null);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      if (editingModel) {
        await updateMutation.mutateAsync(values);
        return;
      }

      await createMutation.mutateAsync(values);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "保存模型失败，请稍后重试",
      );
    }
  });

  return (
    <AdminPageShell
      eyebrow="Models"
      title="模型管理"
      description="本页已经接入模型管理接口。管理员可以维护模型显示名、编码、URL、Key、启用状态和排序。"
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">模型列表</h2>
            <span className="text-sm text-[var(--muted)]">
              {modelsQuery.data?.length ?? 0} 个模型
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {modelsQuery.isLoading ? (
              <div className="rounded-2xl bg-[#faf7f2] px-4 py-4 text-sm text-[var(--muted)]">
                正在加载模型列表...
              </div>
            ) : null}

            {modelsQuery.error ? (
              <div className="rounded-2xl border border-[#f0c2bb] bg-[#fff4f1] px-4 py-4 text-sm text-[#bf3b2c]">
                {modelsQuery.error instanceof ApiError
                  ? modelsQuery.error.message
                  : "模型列表加载失败"}
              </div>
            ) : null}

            {modelsQuery.data?.map((item) => (
              <div
                key={item.id}
                className="rounded-[22px] border border-[var(--border)] bg-[#faf7f2] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium">{item.name}</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--muted)]">
                        {item.code}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--muted)]">
                        {item.isActive ? "启用中" : "已停用"}
                      </span>
                    </div>
                    <p className="mt-2 break-all text-sm leading-6 text-[var(--muted)]">
                      {item.apiUrl}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {item.remark || "暂无备注"}
                    </p>
                  </div>
                  <button
                    className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm"
                    onClick={() => {
                      setEditingModel(item);
                      setValue("name", item.name);
                      setValue("code", item.code);
                      setValue("apiUrl", item.apiUrl);
                      setValue("apiKey", item.apiKey ?? "");
                      setValue("isActive", item.isActive);
                      setValue("sortOrder", item.sortOrder);
                      setValue("remark", item.remark ?? "");
                    }}
                    type="button"
                  >
                    编辑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              {editingModel ? "编辑模型" : "新增模型"}
            </h2>
            {editingModel ? (
              <button
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                onClick={() => {
                  setEditingModel(null);
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
              <label className="mb-2 block text-sm text-[var(--muted)]">模型名称</label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                {...register("name")}
              />
              {errors.name ? (
                <p className="mt-2 text-sm text-[#bf3b2c]">{errors.name.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">模型编码</label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                {...register("code")}
              />
              {errors.code ? (
                <p className="mt-2 text-sm text-[#bf3b2c]">{errors.code.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">模型 URL</label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                {...register("apiUrl")}
              />
              {errors.apiUrl ? (
                <p className="mt-2 text-sm text-[#bf3b2c]">{errors.apiUrl.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">API Key</label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                {...register("apiKey")}
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

            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">备注</label>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none"
                {...register("remark")}
              />
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
                : editingModel
                  ? "保存修改"
                  : "新增模型"}
            </button>
          </form>
        </section>
      </div>
    </AdminPageShell>
  );
}
