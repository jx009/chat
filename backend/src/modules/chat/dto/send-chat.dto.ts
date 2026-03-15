import { Type } from "class-transformer";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class SendChatDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  conversationId!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  modelId!: number;

  @IsString()
  @MaxLength(4000)
  content!: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  stream?: boolean;
}
