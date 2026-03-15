import { adminNavItems } from "@/components/admin/admin-config";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ModuleCard } from "@/components/admin/module-card";

const stageCards = [
  {
    title: "后台布局与导航",
    description: "统一左侧菜单、顶部信息区和内容容器，后续所有管理页都基于这一壳子扩展。",
    statusLabel: "已完成",
  },
  {
    title: "管理员访问控制",
    description: "前端页面和后端 `/api/admin/*` 接口都已经要求管理员权限。",
    statusLabel: "已完成",
  },
  {
    title: "业务模块预留",
    description: "用户、套餐、模型、支付配置、订单五个模块入口已就位，下一步开始逐个接业务。",
    statusLabel: "待接入",
  },
];

export default function AdminHomePage() {
  return (
    <AdminPageShell
      eyebrow="Overview"
      title="后台总览"
      description="当前阶段完成的是管理后台基础框架，包括统一导航、页面骨架和管理员权限入口。业务数据和配置表单将在后续步骤接入。"
    >
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="grid gap-4">
          {stageCards.map((card) => (
            <ModuleCard
              key={card.title}
              title={card.title}
              description={card.description}
              statusLabel={card.statusLabel}
            />
          ))}
        </div>

        <div className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
            Modules
          </p>
          <div className="mt-5 space-y-3">
            {adminNavItems
              .filter((item) => item.href !== "/admin")
              .map((item) => (
                <div
                  key={item.href}
                  className="rounded-2xl border border-[var(--border)] bg-[#faf7f2] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-[var(--muted)]">{item.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {item.description}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
}
