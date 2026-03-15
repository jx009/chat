import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreatePackageDto } from "./dto/create-package.dto";
import { UpdatePackageDto } from "./dto/update-package.dto";
import { PackagesService } from "./packages.service";

@Roles("admin")
@Controller("admin/packages")
export class PackagesAdminController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  getAdminPackages() {
    return this.packagesService.getAdminPackages();
  }

  @Post()
  createPackage(@Body() body: CreatePackageDto) {
    return this.packagesService.createPackage(body);
  }

  @Patch(":id")
  updatePackage(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdatePackageDto,
  ) {
    return this.packagesService.updatePackage(BigInt(id), body);
  }
}

