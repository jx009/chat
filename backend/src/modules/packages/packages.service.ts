import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { CreatePackageDto } from "./dto/create-package.dto";
import { UpdatePackageDto } from "./dto/update-package.dto";

type MembershipPackageRecord = {
  id: bigint;
  name: string;
  price: number | string | { toString(): string };
  durationType: "one_month" | "three_month";
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PackagesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getActivePackages() {
    const packages = await this.prismaService.membershipPackage.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return packages.map((item: any) => this.serializePackage(item));
  }

  async getAdminPackages() {
    const packages = await this.prismaService.membershipPackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return packages.map((item: any) => this.serializePackage(item));
  }

  async createPackage(input: CreatePackageDto) {
    const created = await this.prismaService.membershipPackage.create({
      data: {
        name: input.name,
        price: input.price,
        durationType: this.parseDurationType(input.durationType),
        description: input.description,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
      },
    });

    return this.serializePackage(created);
  }

  async updatePackage(id: bigint, input: UpdatePackageDto) {
    const existing = await this.prismaService.membershipPackage.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException("package not found");
    }

    const updated = await this.prismaService.membershipPackage.update({
      where: {
        id,
      },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.durationType !== undefined
          ? { durationType: this.parseDurationType(input.durationType) }
          : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });

    return this.serializePackage(updated);
  }

  private serializePackage(item: MembershipPackageRecord) {
    return {
      id: Number(item.id),
      name: item.name,
      price: Number(item.price),
      durationType: this.serializeDurationType(item.durationType),
      description: item.description,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private serializeDurationType(value: "one_month" | "three_month") {
    return value === "one_month" ? "1_month" : "3_month";
  }

  private parseDurationType(value: "1_month" | "3_month") {
    return value === "1_month" ? "one_month" : "three_month";
  }
}
