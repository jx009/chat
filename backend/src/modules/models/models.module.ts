import { Module } from "@nestjs/common";
import { ModelsAdminController } from "./models.admin.controller";
import { ModelsController } from "./models.controller";
import { ModelsService } from "./models.service";

@Module({
  controllers: [ModelsController, ModelsAdminController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}

