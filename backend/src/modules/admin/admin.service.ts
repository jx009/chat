import { Injectable } from "@nestjs/common";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";

@Injectable()
export class AdminService {
  getMeta(user: AuthenticatedUser) {
    return {
      currentUser: {
        username: user.username,
        role: user.role,
      },
      modules: [
        {
          key: "users",
          title: "用户管理",
          path: "/admin/users",
          status: "skeleton",
        },
        {
          key: "packages",
          title: "套餐管理",
          path: "/admin/packages",
          status: "ready",
        },
        {
          key: "models",
          title: "模型管理",
          path: "/admin/models",
          status: "ready",
        },
        {
          key: "payments",
          title: "支付配置",
          path: "/admin/payments",
          status: "ready",
        },
        {
          key: "orders",
          title: "订单管理",
          path: "/admin/orders",
          status: "skeleton",
        },
      ],
    };
  }

  getSummary() {
    return {
      title: "管理后台基础框架",
      description: "当前已接入套餐管理、支付配置和模型管理，用户与订单模块仍处于骨架阶段。",
      version: "step-8",
    };
  }
}
