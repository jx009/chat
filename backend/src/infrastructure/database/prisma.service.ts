import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly databaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>("database.url", "");

    super(
      databaseUrl
        ? {
            datasources: {
              db: {
                url: databaseUrl,
              },
            },
          }
        : undefined,
    );

    this.databaseUrl = databaseUrl;
  }

  async onModuleInit() {
    if (!this.databaseUrl) {
      return;
    }

    try {
      await this.$connect();
    } catch {
      return;
    }
  }

  async onModuleDestroy() {
    if (!this.databaseUrl) {
      return;
    }

    try {
      await this.$disconnect();
    } catch {
      return;
    }
  }

  async checkConnection() {
    if (!this.databaseUrl) {
      return "not_configured";
    }

    try {
      await this.$queryRaw`SELECT 1`;
      return "up";
    } catch {
      return "down";
    }
  }
}
