export type ConversationItem = {
  id: number;
  title: string;
  modelId: number;
  lastMessageAt: string | null;
  createdAt: string;
};

export type ConversationsResponse = {
  list: ConversationItem[];
  total: number;
};

export type ConversationMessage = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  status: "streaming" | "success" | "failed";
  createdAt: string;
};

export type CreateConversationInput = {
  modelId: number;
  title?: string;
};

