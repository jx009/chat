import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { UpdatePaymentConfigDto } from "./dto/update-payment-config.dto";

type PaymentConfigRecord = {
  id: bigint;
  merchantId?: string | null;
  appId?: string | null;
  appKey?: string | null;
  notifyUrl?: string | null;
  gatewayUrl?: string | null;
  signType?: string | null;
  sandboxEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentOrderRecord = {
  id: bigint;
  orderNo: string;
  amount: number | string | { toString(): string };
  status: "pending" | "paid" | "failed" | "closed";
  thirdPartyOrderNo?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prismaService: PrismaService,
  ) {}

  async getPaymentConfig() {
    const config = await this.prismaService.paymentConfig.findFirst({
      orderBy: {
        id: "asc",
      },
    });

    if (!config) {
      const created = await this.prismaService.paymentConfig.create({
        data: {
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

      return this.serializePaymentConfig(created);
    }

    return this.serializePaymentConfig(config);
  }

  async updatePaymentConfig(input: UpdatePaymentConfigDto) {
    const existing = await this.prismaService.paymentConfig.findFirst({
      orderBy: {
        id: "asc",
      },
    });

    const saved = existing
      ? await this.prismaService.paymentConfig.update({
          where: { id: existing.id },
          data: {
            merchantId: input.merchantId,
            appId: input.appId,
            appKey: input.appKey,
            notifyUrl: input.notifyUrl,
            gatewayUrl: input.gatewayUrl,
            signType: input.signType,
            sandboxEnabled: input.sandboxEnabled,
            isActive: input.isActive,
          },
        })
      : await this.prismaService.paymentConfig.create({
          data: {
            merchantId: input.merchantId,
            appId: input.appId,
            appKey: input.appKey,
            notifyUrl: input.notifyUrl,
            gatewayUrl: input.gatewayUrl,
            signType: input.signType,
            sandboxEnabled: input.sandboxEnabled,
            isActive: input.isActive,
          },
        });

    return this.serializePaymentConfig(saved);
  }

  async createPaymentOrder(user: AuthenticatedUser, packageId: number) {
    const membershipPackage = await this.prismaService.membershipPackage.findFirst({
      where: {
        id: BigInt(packageId),
        isActive: true,
      },
    });

    if (!membershipPackage) {
      throw new NotFoundException("package not found or inactive");
    }

    const paymentConfig = await this.ensurePaymentConfig();
    const order = await this.prismaService.paymentOrder.create({
      data: {
        orderNo: this.generateOrderNo(),
        userId: BigInt(user.userId),
        packageId: membershipPackage.id,
        amount: membershipPackage.price,
        status: "pending",
      },
    });

    return {
      ...this.serializePaymentOrder(order),
      payParams: {
        payUrl: paymentConfig.gatewayUrl
          ? `${paymentConfig.gatewayUrl}?orderNo=${order.orderNo}`
          : "",
        formHtml: "",
      },
    };
  }

  async getPaymentOrder(orderId: bigint, user: AuthenticatedUser) {
    const order = await this.prismaService.paymentOrder.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new NotFoundException("order not found");
    }

    if (user.role !== "admin" && order.userId.toString() !== user.userId) {
      throw new NotFoundException("order not found");
    }

    return this.serializePaymentOrder(order);
  }

  async handlePaymentCallback(payload: Record<string, unknown>) {
    const input = this.normalizeCallbackPayload(payload);
    const normalizedStatus = this.normalizeCallbackStatus(input.status);
    const rawCallback = JSON.stringify(payload);

    const handled = await this.prismaService.$transaction(async (tx: any) => {
      const order = await tx.paymentOrder.findUnique({
        where: {
          orderNo: input.orderNo,
        },
        include: {
          package: true,
        },
      });

      if (!order) {
        throw new NotFoundException("order not found");
      }

      if (normalizedStatus === "paid") {
        if (order.status === "paid") {
          return order;
        }

        const paidAt = new Date();
        const updatedOrder = await tx.paymentOrder.update({
          where: {
            id: order.id,
          },
          data: {
            status: "paid",
            thirdPartyOrderNo: input.thirdPartyOrderNo,
            paidAt,
            rawCallback,
          },
        });

        const existingMembership = await tx.membership.findFirst({
          where: {
            sourceOrderId: order.id,
          },
        });

        if (!existingMembership) {
          const latestMembership = await tx.membership.findFirst({
            where: {
              userId: order.userId,
            },
            orderBy: {
              expireAt: "desc",
            },
          });

          const now = new Date();
          const baseDate =
            latestMembership &&
            latestMembership.status === "active" &&
            latestMembership.expireAt.getTime() > now.getTime()
              ? latestMembership.expireAt
              : now;

          await tx.membership.create({
            data: {
              userId: order.userId,
              status: "active",
              startAt: baseDate,
              expireAt: this.calculateExpireAt(baseDate, order.package.durationType),
              sourceOrderId: order.id,
            },
          });
        }

        return updatedOrder;
      }

      return tx.paymentOrder.update({
        where: {
          id: order.id,
        },
        data: {
          status: normalizedStatus,
          thirdPartyOrderNo: input.thirdPartyOrderNo,
          rawCallback,
        },
      });
    });

    return {
      success: true,
      order: this.serializePaymentOrder(handled),
    };
  }

  private serializePaymentConfig(config: PaymentConfigRecord) {
    return {
      id: Number(config.id),
      merchantId: config.merchantId ?? "",
      appId: config.appId ?? "",
      appKey: config.appKey ?? "",
      notifyUrl: config.notifyUrl ?? "",
      gatewayUrl: config.gatewayUrl ?? "",
      signType: config.signType ?? "",
      sandboxEnabled: config.sandboxEnabled,
      isActive: config.isActive,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  private serializePaymentOrder(order: PaymentOrderRecord) {
    return {
      id: Number(order.id),
      orderNo: order.orderNo,
      amount: Number(order.amount),
      status: order.status,
      thirdPartyOrderNo: order.thirdPartyOrderNo,
      paidAt: order.paidAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private async ensurePaymentConfig() {
    const config = await this.prismaService.paymentConfig.findFirst({
      orderBy: {
        id: "asc",
      },
    });

    if (config) {
      return config;
    }

    return this.prismaService.paymentConfig.create({
      data: {
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
  }

  private normalizeCallbackStatus(status: "paid" | "success" | "failed" | "closed") {
    if (status === "paid" || status === "success") {
      return "paid" as const;
    }

    if (status === "failed") {
      return "failed" as const;
    }

    return "closed" as const;
  }

  private calculateExpireAt(baseDate: Date, durationType: "one_month" | "three_month") {
    const expireAt = new Date(baseDate);

    if (durationType === "one_month") {
      expireAt.setMonth(expireAt.getMonth() + 1);
      return expireAt;
    }

    expireAt.setMonth(expireAt.getMonth() + 3);
    return expireAt;
  }

  private generateOrderNo() {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");

    return `P${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(
      now.getHours(),
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}${random}`;
  }

  private normalizeCallbackPayload(payload: Record<string, unknown>) {
    const orderNo = String(payload.orderNo ?? payload.order_no ?? "").trim();
    const rawStatus = String(
      payload.status ?? payload.trade_status ?? payload.payment_status ?? "",
    ).trim();
    const thirdPartyOrderNo = String(
      payload.thirdPartyOrderNo ?? payload.third_party_order_no ?? payload.transaction_id ?? "",
    ).trim();

    if (!orderNo) {
      throw new BadRequestException("orderNo is required");
    }

    if (!["paid", "success", "failed", "closed"].includes(rawStatus)) {
      throw new BadRequestException("invalid callback status");
    }

    return {
      orderNo,
      thirdPartyOrderNo: thirdPartyOrderNo || undefined,
      status: rawStatus as "paid" | "success" | "failed" | "closed",
    };
  }
}
