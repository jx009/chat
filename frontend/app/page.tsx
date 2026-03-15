import Link from "next/link";

const entryLinks = [
  {
    href: "/login",
    title: "登录页",
    description: "用户名密码登录入口，第二阶段开始接入真实认证接口。",
  },
  {
    href: "/register",
    title: "注册页",
    description: "包含用户名占位说明，后续接入实时校验与随机用户名推荐。",
  },
  {
    href: "/chat",
    title: "聊天页",
    description: "预留左侧会话区、右侧消息区和底部输入区的页面骨架。",
  },
  {
    href: "/membership",
    title: "会员中心",
    description: "展示后台动态套餐配置，后续在这里接支付下单流程。",
  },
  {
    href: "/admin",
    title: "管理后台",
    description: "预留用户、套餐、模型、支付配置、订单等后台入口。",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--card)] p-8 shadow-[0_18px_60px_rgba(32,34,37,0.08)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
          Step 11
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight">
          聊天发送、权限联动与异常处理已接入
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
          当前阶段已经完成真实聊天发送、SSE 流式渲染、非会员聊天拦截和登录态异常跳转。
          下一阶段将进入测试、部署与上线准备。
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {entryLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[24px] border border-[var(--border)] bg-white/70 p-6 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_10px_30px_rgba(191,91,44,0.12)]"
          >
            <h2 className="text-xl font-medium">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {item.description}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
