import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getHealth() {
    const [database, redis] = await Promise.all([
      this.prismaService.checkConnection(),
      this.redisService.checkConnection(),
    ]);

    return {
      status: "ok",
      service: "backend",
      dependencies: {
        database,
        redis,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
