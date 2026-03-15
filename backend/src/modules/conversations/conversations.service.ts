import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { ListConversationsDto } from "./dto/list-conversations.dto";

@Injectable()
export class ConversationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getConversations(
    user: AuthenticatedUser,
    query: ListConversationsDto,
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = {
      userId: BigInt(user.userId),
    };

    const [list, total] = await this.prismaService.$transaction([
      this.prismaService.conversation.findMany({
        where,
        orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.conversation.count({ where }),
    ]);

    return {
      list: list.map((item: any) => ({
        id: Number(item.id),
        title: item.title ?? "新会话",
        modelId: Number(item.modelId),
        lastMessageAt: item.lastMessageAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
    };
  }

  async createConversation(
    user: AuthenticatedUser,
    input: CreateConversationDto,
  ) {
    const model = await this.prismaService.modelConfig.findFirst({
      where: {
        id: BigInt(input.modelId),
        isActive: true,
      },
    });

    if (!model) {
      throw new NotFoundException("model not found or inactive");
    }

    const conversation = await this.prismaService.conversation.create({
      data: {
        userId: BigInt(user.userId),
        modelId: model.id,
        title: input.title?.trim() || "新会话",
      },
    });

    return {
      id: Number(conversation.id),
      title: conversation.title ?? "新会话",
      modelId: Number(conversation.modelId),
      lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
      createdAt: conversation.createdAt.toISOString(),
    };
  }

  async getConversationMessages(user: AuthenticatedUser, conversationId: bigint) {
    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        id: conversationId,
        userId: BigInt(user.userId),
      },
    });

    if (!conversation) {
      throw new NotFoundException("conversation not found");
    }

    const messages = await this.prismaService.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        sequence: "asc",
      },
    });

    return messages.map((item: any) => ({
      id: Number(item.id),
      role: item.role,
      content: item.content,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    }));
  }
}
