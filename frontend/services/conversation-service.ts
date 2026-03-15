import { apiRequest } from "./api-client";
import {
  ConversationItem,
  ConversationMessage,
  ConversationsResponse,
  CreateConversationInput,
} from "@/types/conversation";

export function getConversations(
  accessToken: string,
  params: { page?: number; pageSize?: number } = {},
) {
  return apiRequest<ConversationsResponse>("/conversations", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    query: params,
  });
}

export function createConversation(
  accessToken: string,
  input: CreateConversationInput,
) {
  return apiRequest<ConversationItem>("/conversations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export function getConversationMessages(
  accessToken: string,
  conversationId: number,
) {
  return apiRequest<ConversationMessage[]>(`/conversations/${conversationId}/messages`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

