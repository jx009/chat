import { Type } from "class-transformer";
import { IsNumber, Min } from "class-validator";

export class CreatePaymentOrderDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  packageId!: number;
}
