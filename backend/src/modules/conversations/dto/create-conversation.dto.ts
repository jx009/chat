import { Type } from "class-transformer";
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateConversationDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  modelId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}

