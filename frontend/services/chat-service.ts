import { ApiError, apiRequest } from "./api-client";
import { SendChatInput, SendChatResult } from "@/types/chat";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

export function sendChatMessage(accessToken: string, input: SendChatInput) {
  return apiRequest<SendChatResult>("/chat/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export async function streamChatMessage(
  accessToken: string,
  messageId: number,
  handlers: {
    signal?: AbortSignal;
    onChunk: (content: string) => void;
    onDone?: (payload: { messageId: number; conversationId: number }) => void;
    onError?: (message: string) => void;
  },
) {
  const response = await fetch(`${API_BASE_URL}/chat/stream/${messageId}`, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${accessToken}`,
    },
    signal: handlers.signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      payload?.message ?? `Request failed: ${response.status}`,
      payload?.code ?? response.status,
    );
  }

  if (!response.body) {
    throw new ApiError("stream response body is empty");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const emitEvent = (block: string) => {
    const eventMatch = block.match(/^event:\s*(.+)$/m);
    const dataMatch = block.match(/^data:\s*(.+)$/m);

    if (!eventMatch || !dataMatch) {
      return;
    }

    const event = eventMatch[1]?.trim();
    const payload = JSON.parse(dataMatch[1] ?? "{}") as Record<string, unknown>;

    if (event === "chunk") {
      handlers.onChunk(String(payload.content ?? ""));
      return;
    }

    if (event === "done") {
      handlers.onDone?.({
        messageId: Number(payload.messageId ?? messageId),
        conversationId: Number(payload.conversationId ?? 0),
      });
      return;
    }

    if (event === "error") {
      handlers.onError?.(String(payload.message ?? "消息流中断"));
    }
  };

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    blocks.forEach((block) => {
      if (block.trim()) {
        emitEvent(block);
      }
    });
  }

  if (buffer.trim()) {
    emitEvent(buffer);
  }
}
