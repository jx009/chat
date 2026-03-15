# Prisma 与基础环境

第二步已补齐以下内容：

- `schema.prisma`
- 初始 migration SQL
- seed 脚本
- `DATABASE_URL` / `REDIS_URL` 配置入口

## 推荐执行顺序

```bash
npm install
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend
npm run db:seed --workspace backend
```

## 默认种子数据

- 管理员账号：`admin / Admin@123456`
- 演示账号：`demo_user / User@123456`
- 套餐：
  - 月度会员
  - 季度会员
- 支付配置：1 条空白默认记录
- 模型配置：`gpt-4o` 示例

