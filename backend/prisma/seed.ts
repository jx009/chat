import bcrypt from "bcryptjs";
import {
  MembershipStatus,
  PackageDurationType,
  PrismaClient,
  UserRole,
  UserStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@123456", 10);
  const userPasswordHash = await bcrypt.hash("User@123456", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      role: UserRole.admin,
      status: UserStatus.active,
    },
    create: {
      username: "admin",
      role: UserRole.admin,
      status: UserStatus.active,
    },
  });

  await prisma.userAuth.upsert({
    where: { userId: admin.id },
    update: {
      passwordHash: adminPasswordHash,
    },
    create: {
      userId: admin.id,
      passwordHash: adminPasswordHash,
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { username: "demo_user" },
    update: {
      role: UserRole.user,
      status: UserStatus.active,
    },
    create: {
      username: "demo_user",
      role: UserRole.user,
      status: UserStatus.active,
    },
  });

  await prisma.userAuth.upsert({
    where: { userId: normalUser.id },
    update: {
      passwordHash: userPasswordHash,
    },
    create: {
      userId: normalUser.id,
      passwordHash: userPasswordHash,
    },
  });

  const monthPackage = await prisma.membershipPackage.upsert({
    where: { id: 1n },
    update: {
      name: "月度会员",
      price: 29.9,
      durationType: PackageDurationType.one_month,
      description: "开通后可与大模型对话 1 个月",
      isActive: true,
      sortOrder: 1,
    },
    create: {
      id: 1n,
      name: "月度会员",
      price: 29.9,
      durationType: PackageDurationType.one_month,
      description: "开通后可与大模型对话 1 个月",
      isActive: true,
      sortOrder: 1,
    },
  });

  await prisma.membershipPackage.upsert({
    where: { id: 2n },
    update: {
      name: "季度会员",
      price: 79.9,
      durationType: PackageDurationType.three_month,
      description: "开通后可与大模型对话 3 个月",
      isActive: true,
      sortOrder: 2,
    },
    create: {
      id: 2n,
      name: "季度会员",
      price: 79.9,
      durationType: PackageDurationType.three_month,
      description: "开通后可与大模型对话 3 个月",
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.paymentConfig.upsert({
    where: { id: 1n },
    update: {
      signType: "md5",
      sandboxEnabled: true,
      isActive: true,
    },
    create: {
      id: 1n,
      merchantId: "",
      appId: "",
      appKey: "",
      notifyUrl: "",
      gatewayUrl: "",
      signType: "md5",
      sandboxEnabled: true,
      isActive: true,
    },
  });

  await prisma.modelConfig.upsert({
    where: { code: "gpt-4o" },
    update: {
      name: "GPT-4o",
      apiUrl: "https://api.example.com/v1/chat/completions",
      apiKey: "",
      isActive: true,
      sortOrder: 1,
      remark: "默认模型示例配置",
    },
    create: {
      name: "GPT-4o",
      code: "gpt-4o",
      apiUrl: "https://api.example.com/v1/chat/completions",
      apiKey: "",
      isActive: true,
      sortOrder: 1,
      remark: "默认模型示例配置",
    },
  });

  await prisma.membership.upsert({
    where: { id: 1n },
    update: {
      userId: admin.id,
      status: MembershipStatus.active,
      startAt: new Date("2026-01-01T00:00:00Z"),
      expireAt: new Date("2026-12-31T23:59:59Z"),
    },
    create: {
      id: 1n,
      userId: admin.id,
      status: MembershipStatus.active,
      startAt: new Date("2026-01-01T00:00:00Z"),
      expireAt: new Date("2026-12-31T23:59:59Z"),
    },
  });

  console.log("Seed completed");
  console.log(`Admin user: admin / Admin@123456`);
  console.log(`Demo user: demo_user / User@123456`);
  console.log(`Default package: ${monthPackage.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

