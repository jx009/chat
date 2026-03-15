import { Injectable, Logger } from "@nestjs/common";
import {
  ChatCompletionResult,
  ModelProvider,
  ModelProviderInput,
} from "./model-provider.interface";

type OpenAIMessageContent =
  | string
  | Array<{
      type?: string;
      text?: string;
    }>;

type OpenAICompatibleResponse = {
  choices?: Array<{
    message?: {
      content?: OpenAIMessageContent;
    };
    delta?: {
      content?: OpenAIMessageContent;
    };
    text?: string;
  }>;
  usage?: {
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  data?: {
    answer?: string;
    content?: string;
  };
  answer?: string;
  content?: string;
};

@Injectable()
export class OpenAICompatibleProvider implements ModelProvider {
  private readonly logger = new Logger(OpenAICompatibleProvider.name);

  async complete(input: ModelProviderInput): Promise<ChatCompletionResult> {
    const resolvedApiUrl = this.resolveApiUrl(input.apiUrl);

    try {
      this.logger.log(
        `calling model provider model=${input.modelCode} url=${resolvedApiUrl} contextCount=${input.context.length}`,
      );

      const response = await fetch(resolvedApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(input.apiKey
            ? {
                Authorization: `Bearer ${input.apiKey}`,
              }
            : {}),
        },
        body: JSON.stringify({
          model: input.modelCode,
          messages: input.context.map((item) => ({
            role: item.role,
            content: item.content,
          })),
          stream: false,
        }),
      });

      const rawText = await response.text();
      let payload: OpenAICompatibleResponse | null = null;

      try {
        payload = rawText ? (JSON.parse(rawText) as OpenAICompatibleResponse) : null;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message =
          this.extractErrorMessage(payload) ??
          rawText.trim() ??
          `model request failed with status ${response.status}`;

        this.logger.error(
          `model request failed model=${input.modelCode} url=${resolvedApiUrl} status=${response.status} body=${this.truncate(rawText)}`,
        );

        throw new Error(message);
      }

      const content = this.extractContent(payload);
      const contentType = response.headers.get("content-type") ?? "";

      if (!content) {
        if (contentType.includes("text/html") || /<!doctype html>|<html/i.test(rawText)) {
          this.logger.error(
            `model endpoint returned html instead of json model=${input.modelCode} url=${resolvedApiUrl} body=${this.truncate(rawText)}`,
          );
          throw new Error(
            `当前模型接口地址返回的是网页 HTML，不是 API JSON，请检查 apiUrl，当前使用的是 ${resolvedApiUrl}`,
          );
        }

        this.logger.error(
          `model response content empty model=${input.modelCode} url=${resolvedApiUrl} body=${this.truncate(rawText)}`,
        );
        throw new Error("model response content is empty");
      }

      const tokenUsage =
        payload?.usage?.total_tokens ??
        payload?.usage?.completion_tokens ??
        Math.max(1, Math.ceil(content.length / 4));

      this.logger.log(
        `model request success model=${input.modelCode} url=${resolvedApiUrl} outputLength=${content.length} tokenUsage=${tokenUsage}`,
      );

      return {
        content,
        chunks: this.splitIntoChunks(content),
        tokenUsage,
      };
    } catch (error) {
      this.logger.error(
        `model invocation exception model=${input.modelCode} url=${resolvedApiUrl} message=${error instanceof Error ? error.message : "unknown error"}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private extractContent(payload: OpenAICompatibleResponse | null) {
    if (!payload) {
      return "";
    }

    const choice = payload.choices?.[0];
    const content =
      this.normalizeMessageContent(choice?.message?.content) ||
      this.normalizeMessageContent(choice?.delta?.content) ||
      choice?.text ||
      payload.data?.answer ||
      payload.data?.content ||
      payload.answer ||
      payload.content ||
      "";

    return content.trim();
  }

  private normalizeMessageContent(content: OpenAIMessageContent | undefined) {
    if (!content) {
      return "";
    }

    if (typeof content === "string") {
      return content;
    }

    return content
      .map((item) => item.text ?? "")
      .join("")
      .trim();
  }

  private splitIntoChunks(content: string) {
    return content
      .split(/(?<=[。！？\n.!?])/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({ content: item }));
  }

  private extractErrorMessage(payload: OpenAICompatibleResponse | null) {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const candidate = payload as {
      error?: { message?: string };
      message?: string;
      detail?: string;
    };

    return candidate.error?.message ?? candidate.message ?? candidate.detail ?? null;
  }

  private truncate(value: string, maxLength = 1200) {
    const normalized = value.replace(/\s+/g, " ").trim();

    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength)}...`;
  }

  private resolveApiUrl(value: string) {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new Error("apiUrl is empty");
    }

    const url = new URL(trimmed);
    const pathname = url.pathname.replace(/\/+$/, "");

    if (
      pathname.endsWith("/chat/completions") ||
      pathname.endsWith("/responses")
    ) {
      return url.toString();
    }

    if (pathname === "" || pathname === "/") {
      url.pathname = "/v1/chat/completions";
      return url.toString();
    }

    if (pathname.endsWith("/v1")) {
      url.pathname = `${pathname}/chat/completions`;
      return url.toString();
    }

    return url.toString();
  }
}
