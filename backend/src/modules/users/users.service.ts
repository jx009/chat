import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";

type CreateUserInput = {
  username: string;
  passwordHash: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async isUsernameAvailable(username: string) {
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        username,
      },
      select: {
        id: true,
      },
    });

    return !existingUser;
  }

  async createUser(input: CreateUserInput) {
    try {
      const createdUser = await this.prismaService.$transaction(async (tx: any) => {
        const user = await tx.user.create({
          data: {
            username: input.username,
            role: "user",
            status: "active",
          },
        });

        await tx.userAuth.create({
          data: {
            userId: user.id,
            passwordHash: input.passwordHash,
          },
        });

        return user;
      });

      return {
        id: Number(createdUser.id),
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException("username already exists");
      }

      throw error;
    }
  }

  findAuthUserByUsername(username: string) {
    return this.prismaService.user.findUnique({
      where: {
        username,
      },
      include: {
        auth: true,
      },
    });
  }

  findAuthUserById(userId: bigint) {
    return this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        auth: true,
      },
    });
  }

  async updateLoginMeta(userId: bigint, ipAddress: string) {
    await this.prismaService.userAuth.update({
      where: {
        userId,
      },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress || "unknown",
      },
    });
  }

  async getCurrentUserProfile(userId: bigint) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        memberships: {
          orderBy: {
            expireAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException("user not found");
    }

    const membership = user.memberships[0];
    const membershipState = this.resolveMembership(user.role, membership);

    return {
      id: Number(user.id),
      username: user.username,
      role: user.role,
      membershipStatus: membershipState.status,
      membershipExpireAt: membershipState.expireAt,
    };
  }

  private resolveMembership(
    role: "user" | "admin",
    membership:
      | {
          status: "active" | "expired";
          expireAt: Date;
        }
      | undefined,
  ) {
    if (role === "admin") {
      return {
        status: "active" as const,
        expireAt: membership?.expireAt.toISOString() ?? null,
      };
    }

    if (!membership) {
      return {
        status: "none" as const,
        expireAt: null,
      };
    }

    const isActive =
      membership.status === "active" &&
      membership.expireAt.getTime() > Date.now();

    return {
      status: (isActive ? "active" : "expired") as "active" | "expired",
      expireAt: membership.expireAt.toISOString(),
    };
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    );
  }
}
