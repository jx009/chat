import { Controller, Get } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { AdminService } from "./admin.service";

@Roles("admin")
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("meta")
  getMeta(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.getMeta(user);
  }

  @Get("summary")
  getSummary() {
    return this.adminService.getSummary();
  }
}

