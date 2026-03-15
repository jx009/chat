export type ChatContextMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatCompletionChunk = {
  content: string;
};

export type ChatCompletionResult = {
  content: string;
  chunks: ChatCompletionChunk[];
  tokenUsage: number;
};

export type ModelProviderInput = {
  modelName: string;
  modelCode: string;
  apiUrl: string;
  apiKey?: string | null;
  prompt: string;
  context: ChatContextMessage[];
};

export interface ModelProvider {
  complete(input: ModelProviderInput): Promise<ChatCompletionResult>;
}
