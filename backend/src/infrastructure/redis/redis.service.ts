import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private readonly redisUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.redisUrl = configService.get<string>("redis.url", "");
  }

  async onModuleInit() {
    if (!this.redisUrl) {
      return;
    }

    this.client = new Redis(this.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    try {
      await this.client.connect();
    } catch {
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
    } finally {
      this.client = null;
    }
  }

  getClient() {
    return this.client;
  }

  isAvailable() {
    return !!this.client;
  }

  async get(key: string) {
    if (!this.client) {
      return null;
    }

    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (!this.client) {
      return null;
    }

    if (ttlSeconds) {
      return this.client.set(key, value, "EX", ttlSeconds);
    }

    return this.client.set(key, value);
  }

  async del(key: string) {
    if (!this.client) {
      return 0;
    }

    return this.client.del(key);
  }

  async checkConnection() {
    if (!this.redisUrl) {
      return "not_configured";
    }

    try {
      if (!this.client) {
        return "down";
      }

      await this.client.ping();
      return "up";
    } catch {
      return "down";
    }
  }
}
