import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ModuleCard } from "@/components/admin/module-card";

export default function AdminUsersPage() {
  return (
    <AdminPageShell
      eyebrow="Users"
      title="用户管理"
      description="这一页在第六步前仍然是后台骨架页面。当前先确认后台导航、权限守卫和模块分区已经到位。"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <ModuleCard
          title="列表区域"
          description="后续接入管理员用户列表接口，展示用户名、角色、会员状态和到期时间。"
          statusLabel="待接入"
        />
        <ModuleCard
          title="筛选区域"
          description="后续接入关键词搜索、角色筛选和会员状态筛选。"
          statusLabel="待接入"
        />
      </div>
    </AdminPageShell>
  );
}
