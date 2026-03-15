import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { CreatePaymentOrderDto } from "./dto/create-payment-order.dto";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("orders")
  createPaymentOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreatePaymentOrderDto,
  ) {
    return this.paymentsService.createPaymentOrder(user, body.packageId);
  }

  @Get("orders/:id")
  getPaymentOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.paymentsService.getPaymentOrder(BigInt(id), user);
  }

  @Public()
  @Post("callback")
  handlePaymentCallback(@Body() body: Record<string, unknown>) {
    return this.paymentsService.handlePaymentCallback(body);
  }
}
