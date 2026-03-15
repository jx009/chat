import { Module } from "@nestjs/common";
import { MembershipsModule } from "../memberships/memberships.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { OpenAICompatibleProvider } from "./providers/openai-compatible.provider";

@Module({
  imports: [MembershipsModule],
  controllers: [ChatController],
  providers: [ChatService, OpenAICompatibleProvider],
  exports: [ChatService],
})
export class ChatModule {}
