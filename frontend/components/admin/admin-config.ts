export const adminNavItems = [
  {
    href: "/admin",
    label: "总览",
    description: "后台模块总入口与阶段状态面板",
    status: "ready",
  },
  {
    href: "/admin/users",
    label: "用户管理",
    description: "查看用户、角色与会员状态",
    status: "skeleton",
  },
  {
    href: "/admin/packages",
    label: "套餐管理",
    description: "配置金额、有效期和说明文字",
    status: "ready",
  },
  {
    href: "/admin/models",
    label: "模型管理",
    description: "维护模型名称、URL 和 Key",
    status: "ready",
  },
  {
    href: "/admin/payments",
    label: "支付配置",
    description: "维护支付网关和回调相关配置",
    status: "ready",
  },
  {
    href: "/admin/orders",
    label: "订单管理",
    description: "查看用户订单与支付状态",
    status: "skeleton",
  },
] as const;
