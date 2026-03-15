import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreatePackageDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price!: number;

  @IsIn(["1_month", "3_month"])
  durationType!: "1_month" | "3_month";

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Boolean)
  @IsBoolean()
  isActive!: boolean;

  @Type(() => Number)
  @IsNumber()
  sortOrder!: number;
}
