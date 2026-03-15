import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdatePaymentConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  merchantId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  appId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  appKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notifyUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  gatewayUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  signType?: string;

  @Type(() => Boolean)
  @IsBoolean()
  sandboxEnabled!: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  isActive!: boolean;
}
