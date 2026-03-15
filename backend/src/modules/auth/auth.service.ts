import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

type TokenPayload = {
  sub: string;
  username: string;
  role: "user" | "admin";
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async checkUsername(username: string) {
    const available = await this.usersService.isUsernameAvailable(username);

    return {
      available,
    };
  }

  async suggestUsername(username: string) {
    const sanitized = this.sanitizeUsername(username);

    for (let index = 0; index < 10; index += 1) {
      const suffix = String(Math.floor(100 + Math.random() * 9000));
      const candidate = `${sanitized.slice(0, 20 - suffix.length)}${suffix}`;
      const available = await this.usersService.isUsernameAvailable(candidate);

      if (available) {
        return {
          username: candidate,
        };
      }
    }

    return {
      username: `${sanitized.slice(0, 14)}${Date.now().toString().slice(-6)}`,
    };
  }

  async register(body: RegisterDto) {
    this.validatePasswordConfirmation(body);

    const available = await this.usersService.isUsernameAvailable(body.username);

    if (!available) {
      throw new ConflictException("username already exists");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const createdUser = await this.usersService.createUser({
      username: body.username,
      passwordHash,
    });

    return {
      userId: createdUser.id,
    };
  }

  async login(body: LoginDto, ipAddress: string) {
    const userRecord = await this.usersService.findAuthUserByUsername(body.username);

    if (!userRecord?.auth) {
      throw new UnauthorizedException("username or password is incorrect");
    }

    if (userRecord.status === "disabled") {
      throw new UnauthorizedException("user is disabled");
    }

    const passwordMatched = await bcrypt.compare(
      body.password,
      userRecord.auth.passwordHash,
    );

    if (!passwordMatched) {
      throw new UnauthorizedException("username or password is incorrect");
    }

    await this.usersService.updateLoginMeta(userRecord.id, ipAddress);

    const tokens = await this.issueTokens({
      sub: userRecord.id.toString(),
      username: userRecord.username,
      role: userRecord.role,
    });
    const currentUser = await this.usersService.getCurrentUserProfile(userRecord.id);

    return {
      ...tokens,
      user: currentUser,
    };
  }

  async refresh(refreshToken: string) {
    let payload: TokenPayload;

    try {
      payload = jwt.verify(
        refreshToken,
        this.configService.get<string>("auth.jwtRefreshSecret", "dev-refresh-secret"),
      ) as TokenPayload;
    } catch {
      throw new UnauthorizedException("invalid or expired refresh token");
    }

    const refreshKey = this.getRefreshTokenKey(payload.sub);

    if (this.redisService.isAvailable()) {
      const storedToken = await this.redisService.get(refreshKey);

      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException("refresh token is invalid");
      }
    }

    const userRecord = await this.usersService.findAuthUserById(BigInt(payload.sub));

    if (!userRecord || userRecord.status === "disabled") {
      throw new UnauthorizedException("user is unavailable");
    }

    const tokens = await this.issueTokens({
      sub: userRecord.id.toString(),
      username: userRecord.username,
      role: userRecord.role,
    });
    const currentUser = await this.usersService.getCurrentUserProfile(userRecord.id);

    return {
      ...tokens,
      user: currentUser,
    };
  }

  private validatePasswordConfirmation(body: RegisterDto) {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException("password and confirmPassword do not match");
    }
  }

  private sanitizeUsername(username: string) {
    const normalized = username.trim().replace(/\s+/g, "").replace(/[^\w]/g, "");

    if (normalized.length >= 4) {
      return normalized.slice(0, 20);
    }

    return `user${normalized}`.slice(0, 20);
  }

  private async issueTokens(payload: TokenPayload) {
    const accessExpiresIn = this.configService.get<string>("auth.jwtAccessExpiresIn", "15m");
    const refreshExpiresIn = this.configService.get<string>(
      "auth.jwtRefreshExpiresIn",
      "7d",
    );

    const accessToken = jwt.sign(
      payload,
      this.configService.get<string>("auth.jwtAccessSecret", "dev-access-secret"),
      {
        expiresIn: accessExpiresIn as jwt.SignOptions["expiresIn"],
      },
    );
    const refreshToken = jwt.sign(
      payload,
      this.configService.get<string>("auth.jwtRefreshSecret", "dev-refresh-secret"),
      {
        expiresIn: refreshExpiresIn as jwt.SignOptions["expiresIn"],
      },
    );

    if (this.redisService.isAvailable()) {
      const refreshTtlSeconds = this.parseExpiryToSeconds(refreshExpiresIn);

      await this.redisService.set(
        this.getRefreshTokenKey(payload.sub),
        refreshToken,
        refreshTtlSeconds,
      );
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  private getRefreshTokenKey(userId: string) {
    return `auth:refresh:${userId}`;
  }

  private parseExpiryToSeconds(value: string) {
    if (/^\d+$/.test(value)) {
      return Number(value);
    }

    const match = value.match(/^(\d+)([smhd])$/);

    if (!match) {
      return 7 * 24 * 60 * 60;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    if (unit === "s") {
      return amount;
    }

    if (unit === "m") {
      return amount * 60;
    }

    if (unit === "h") {
      return amount * 60 * 60;
    }

    return amount * 24 * 60 * 60;
  }
}
