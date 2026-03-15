import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ModuleCard } from "@/components/admin/module-card";

export default function AdminOrdersPage() {
  return (
    <AdminPageShell
      eyebrow="Orders"
      title="订单管理"
      description="这一页后续用于查看支付订单、本地订单号、金额、状态和支付时间。当前先保留标准管理页结构。"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <ModuleCard
          title="订单表格"
          description="后续接入订单号、用户、套餐、金额、状态和支付时间字段。"
          statusLabel="待接入"
        />
        <ModuleCard
          title="筛选面板"
          description="后续接入按订单号、用户名和状态筛选。"
          statusLabel="待接入"
        />
      </div>
    </AdminPageShell>
  );
}
