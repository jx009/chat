import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateModelDto } from "./dto/create-model.dto";
import { UpdateModelDto } from "./dto/update-model.dto";
import { ModelsService } from "./models.service";

@Roles("admin")
@Controller("admin/models")
export class ModelsAdminController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  getAdminModels() {
    return this.modelsService.getAdminModels();
  }

  @Post()
  createModel(@Body() body: CreateModelDto) {
    return this.modelsService.createModel(body);
  }

  @Patch(":id")
  updateModel(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateModelDto,
  ) {
    return this.modelsService.updateModel(BigInt(id), body);
  }
}

