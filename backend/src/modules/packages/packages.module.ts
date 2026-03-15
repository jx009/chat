import { Module } from "@nestjs/common";
import { PackagesAdminController } from "./packages.admin.controller";
import { PackagesController } from "./packages.controller";
import { PackagesService } from "./packages.service";

@Module({
  controllers: [PackagesController, PackagesAdminController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}

