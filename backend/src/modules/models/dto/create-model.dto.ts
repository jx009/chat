import { Type } from "class-transformer";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export class CreateModelDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9_.-]+$/)
  code!: string;

  @IsString()
  @MaxLength(255)
  apiUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  apiKey?: string;

  @Type(() => Boolean)
  @IsBoolean()
  isActive!: boolean;

  @Type(() => Number)
  @IsNumber()
  sortOrder!: number;

  @IsOptional()
  @IsString()
  remark?: string;
}
