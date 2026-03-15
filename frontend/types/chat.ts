export type SendChatInput = {
  conversationId: number;
  modelId: number;
  content: string;
  stream?: boolean;
};

export type SendChatResult = {
  messageId: number;
  conversationId: number;
  reply: string | null;
};
