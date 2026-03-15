import { Body, Controller, Get, Put } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { PaymentsService } from "./payments.service";
import { UpdatePaymentConfigDto } from "./dto/update-payment-config.dto";

@Roles("admin")
@Controller("admin/payment-config")
export class PaymentsAdminController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  getPaymentConfig() {
    return this.paymentsService.getPaymentConfig();
  }

  @Put()
  updatePaymentConfig(@Body() body: UpdatePaymentConfigDto) {
    return this.paymentsService.updatePaymentConfig(body);
  }
}

