import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  Body,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { SendChatDto } from "./dto/send-chat.dto";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("send")
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SendChatDto,
  ) {
    return this.chatService.sendMessage(user, body);
  }

  @Get("stream/:messageId")
  async streamMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param("messageId", ParseIntPipe) messageId: number,
    @Res() response: {
      setHeader: (name: string, value: string) => void;
      flushHeaders: () => void;
      on: (event: string, listener: () => void) => void;
      write: (chunk: string) => void;
      end: () => void;
    },
  ) {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders();

    let sentLength = 0;
    let closed = false;

    response.on("close", () => {
      closed = true;
    });

    while (!closed) {
      const snapshot = await this.chatService.getStreamSnapshot(user, BigInt(messageId));

      if (snapshot.content.length > sentLength) {
        const nextChunk = snapshot.content.slice(sentLength);
        sentLength = snapshot.content.length;
        response.write(`event: chunk\n`);
        response.write(`data: ${JSON.stringify({ content: nextChunk })}\n\n`);
      }

      if (snapshot.status === "success") {
        response.write(`event: done\n`);
        response.write(
          `data: ${JSON.stringify({ messageId: snapshot.id, conversationId: snapshot.conversationId })}\n\n`,
        );
        response.end();
        return;
      }

      if (snapshot.status === "failed") {
        response.write(`event: error\n`);
        response.write(`data: ${JSON.stringify({ message: snapshot.content })}\n\n`);
        response.end();
        return;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 150);
      });
    }
  }
}
