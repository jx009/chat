import { Injectable } from "@nestjs/common";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { PrismaService } from "../../infrastructure/database/prisma.service";

@Injectable()
export class MembershipsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getCurrentMembership(user: AuthenticatedUser) {
    const latestMembership = await this.prismaService.membership.findFirst({
      where: {
        userId: BigInt(user.userId),
      },
      orderBy: {
        expireAt: "desc",
      },
    });

    if (user.role === "admin") {
      return {
        status: "active",
        startAt: latestMembership?.startAt.toISOString() ?? null,
        expireAt: latestMembership?.expireAt.toISOString() ?? null,
        isChatAllowed: true,
      };
    }

    if (!latestMembership) {
      return {
        status: "none",
        startAt: null,
        expireAt: null,
        isChatAllowed: false,
      };
    }

    const isActive =
      latestMembership.status === "active" &&
      latestMembership.expireAt.getTime() > Date.now();

    return {
      status: isActive ? "active" : "expired",
      startAt: latestMembership.startAt.toISOString(),
      expireAt: latestMembership.expireAt.toISOString(),
      isChatAllowed: isActive,
    };
  }
}
