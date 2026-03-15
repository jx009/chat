import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { CreateModelDto } from "./dto/create-model.dto";
import { UpdateModelDto } from "./dto/update-model.dto";

type ModelConfigRecord = {
  id: bigint;
  name: string;
  code: string;
  apiUrl: string;
  apiKey?: string | null;
  isActive: boolean;
  sortOrder: number;
  remark?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ModelsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAvailableModels() {
    const models = await this.prismaService.modelConfig.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return models.map((item: any) => ({
      id: Number(item.id),
      name: item.name,
      code: item.code,
    }));
  }

  async getAdminModels() {
    const models = await this.prismaService.modelConfig.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return models.map((item: any) => this.serializeModel(item));
  }

  async createModel(input: CreateModelDto) {
    try {
      const created = await this.prismaService.modelConfig.create({
        data: {
          name: input.name,
          code: input.code,
          apiUrl: input.apiUrl,
          apiKey: input.apiKey,
          isActive: input.isActive,
          sortOrder: input.sortOrder,
          remark: input.remark,
        },
      });

      return this.serializeModel(created);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException("model code already exists");
      }

      throw error;
    }
  }

  async updateModel(id: bigint, input: UpdateModelDto) {
    const existing = await this.prismaService.modelConfig.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException("model not found");
    }

    try {
      const updated = await this.prismaService.modelConfig.update({
        where: {
          id,
        },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.code !== undefined ? { code: input.code } : {}),
          ...(input.apiUrl !== undefined ? { apiUrl: input.apiUrl } : {}),
          ...(input.apiKey !== undefined ? { apiKey: input.apiKey } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          ...(input.remark !== undefined ? { remark: input.remark } : {}),
        },
      });

      return this.serializeModel(updated);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException("model code already exists");
      }

      throw error;
    }
  }

  private serializeModel(item: ModelConfigRecord) {
    return {
      id: Number(item.id),
      name: item.name,
      code: item.code,
      apiUrl: item.apiUrl,
      apiKey: item.apiKey ?? "",
      isActive: item.isActive,
      sortOrder: item.sortOrder,
      remark: item.remark ?? "",
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
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
