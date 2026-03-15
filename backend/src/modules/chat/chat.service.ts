import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { BusinessException } from "../../common/exceptions/business.exception";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { ERROR_CODES } from "../../common/constants/error-codes";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { MembershipsService } from "../memberships/memberships.service";
import { SendChatDto } from "./dto/send-chat.dto";
import { OpenAICompatibleProvider } from "./providers/openai-compatible.provider";
import { ChatContextMessage } from "./providers/model-provider.interface";

type SendChatResult = {
  messageId: number;
  conversationId: number;
  reply: string | null;
};

type MessageRoleValue = "user" | "assistant" | "system";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly membershipsService: MembershipsService,
    private readonly modelProvider: OpenAICompatibleProvider,
  ) {}

  async sendMessage(
    user: AuthenticatedUser,
    input: SendChatDto,
  ): Promise<SendChatResult> {
    const normalizedContent = input.content.trim();

    if (!normalizedContent) {
      throw new BusinessException(
        ERROR_CODES.badRequest,
        "content cannot be empty",
      );
    }

    const membership = await this.membershipsService.getCurrentMembership(user);

    if (!membership.isChatAllowed && user.role !== "admin") {
      throw new BusinessException(
        ERROR_CODES.membershipRequired,
        "非会员不可聊天",
        HttpStatus.FORBIDDEN,
      );
    }

    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        id: BigInt(input.conversationId),
        userId: BigInt(user.userId),
      },
    });

    if (!conversation) {
      throw new BusinessException(
        ERROR_CODES.conversationNotFound,
        "会话不存在",
        HttpStatus.NOT_FOUND,
      );
    }

    const model = await this.prismaService.modelConfig.findFirst({
      where: {
        id: BigInt(input.modelId),
        isActive: true,
      },
    });

    if (!model) {
      throw new BusinessException(
        ERROR_CODES.modelUnavailable,
        "模型不存在或不可用",
        HttpStatus.NOT_FOUND,
      );
    }

    const historyMessages = await this.prismaService.message.findMany({
      where: {
        conversationId: conversation.id,
        status: "success",
      },
      orderBy: {
        sequence: "desc",
      },
      take: 10,
    });

    const orderedHistory = [...historyMessages].reverse();
    const context = this.buildContext(orderedHistory, normalizedContent);
    const sequenceBase =
      (await this.prismaService.message.findFirst({
        where: {
          conversationId: conversation.id,
        },
        orderBy: {
          sequence: "desc",
        },
      }))?.sequence ?? 0;

    const created = await this.prismaService.$transaction(async (tx: any) => {
      await tx.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          modelId: model.id,
          lastMessageAt: new Date(),
        },
      });

      await tx.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: normalizedContent,
          sequence: sequenceBase + 1,
          status: "success",
        },
      });

      return tx.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: "",
          sequence: sequenceBase + 2,
          status: "streaming",
        },
      });
    });

    if (input.stream) {
      void this.completeAssistantMessage(
        created.id,
        conversation.id,
        model.name,
        model.code,
        model.apiUrl,
        model.apiKey ?? "",
        normalizedContent,
        context,
        true,
      );

      return {
        messageId: Number(created.id),
        conversationId: Number(conversation.id),
        reply: null,
      };
    }

    const completion = await this.completeAssistantMessage(
      created.id,
      conversation.id,
      model.name,
      model.code,
      model.apiUrl,
      model.apiKey ?? "",
      normalizedContent,
      context,
      false,
    );

    return {
      messageId: Number(created.id),
      conversationId: Number(conversation.id),
      reply: completion,
    };
  }

  async getStreamSnapshot(user: AuthenticatedUser, messageId: bigint) {
    const message = await this.prismaService.message.findFirst({
      where: {
        id: messageId,
        conversation: {
          userId: BigInt(user.userId),
        },
      },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      throw new BusinessException(
        ERROR_CODES.conversationNotFound,
        "会话不存在",
        HttpStatus.NOT_FOUND,
      );
    }

    if (message.role !== "assistant") {
      throw new BusinessException(
        ERROR_CODES.badRequest,
        "仅支持拉取 assistant 消息流",
      );
    }

    return {
      id: Number(message.id),
      content: message.content,
      status: message.status,
      conversationId: Number(message.conversationId),
    };
  }

  private buildContext(
    history: Array<{ role: MessageRoleValue; content: string }>,
    currentContent: string,
  ): ChatContextMessage[] {
    return history
      .slice(-10)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }))
      .concat({
        role: "user",
        content: currentContent,
      });
  }

  private async completeAssistantMessage(
    assistantMessageId: bigint,
    conversationId: bigint,
    modelName: string,
    modelCode: string,
    apiUrl: string,
    apiKey: string,
    prompt: string,
    context: ChatContextMessage[],
    stream: boolean,
  ) {
    const startedAt = Date.now();

    try {
      this.logger.log(
        `start model completion conversationId=${conversationId.toString()} assistantMessageId=${assistantMessageId.toString()} model=${modelCode}`,
      );

      const result = await this.modelProvider.complete({
        modelName,
        modelCode,
        apiUrl,
        apiKey,
        prompt,
        context,
      });

      if (stream) {
        let currentContent = "";

        for (const chunk of result.chunks) {
          currentContent += chunk.content;

          await this.prismaService.message.update({
            where: {
              id: assistantMessageId,
            },
            data: {
              content: currentContent,
              status: "streaming",
            },
          });

          await this.sleep(120);
        }
      }

      await this.prismaService.$transaction([
        this.prismaService.message.update({
          where: {
            id: assistantMessageId,
          },
          data: {
            content: result.content,
            tokenUsage: result.tokenUsage,
            latencyMs: Date.now() - startedAt,
            status: "success",
          },
        }),
        this.prismaService.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            lastMessageAt: new Date(),
          },
        }),
      ]);

      this.logger.log(
        `model completion success conversationId=${conversationId.toString()} assistantMessageId=${assistantMessageId.toString()} model=${modelCode} latencyMs=${Date.now() - startedAt} tokenUsage=${result.tokenUsage}`,
      );

      return result.content;
    } catch (error) {
      const failureMessage = "模型调用失败，请稍后重试";

      this.logger.error(
        `model completion failed conversationId=${conversationId.toString()} assistantMessageId=${assistantMessageId.toString()} model=${modelCode} message=${error instanceof Error ? error.message : "unknown error"}`,
        error instanceof Error ? error.stack : undefined,
      );

      await this.prismaService.message.update({
        where: {
          id: assistantMessageId,
        },
        data: {
          content: failureMessage,
          latencyMs: Date.now() - startedAt,
          status: "failed",
        },
      });

      if (stream) {
        return failureMessage;
      }

      throw new BusinessException(
        ERROR_CODES.serverError,
        error instanceof Error ? failureMessage : failureMessage,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private sleep(durationMs: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, durationMs);
    });
  }
}
