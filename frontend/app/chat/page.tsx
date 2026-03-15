"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProtectedGuard } from "@/components/auth/page-guards";
import { ApiError } from "@/services/api-client";
import { sendChatMessage, streamChatMessage } from "@/services/chat-service";
import {
  createConversation,
  getConversationMessages,
  getConversations,
} from "@/services/conversation-service";
import { getAvailableModels } from "@/services/model-service";
import { useAuthStore } from "@/stores/auth-store";

function formatTime(value: string | null) {
  if (!value) {
    return "刚刚创建";
  }

  return new Date(value).toLocaleString("zh-CN");
}

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const streamAbortRef = useRef<AbortController | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [sidebarModelId, setSidebarModelId] = useState<number | null>(null);
  const [chatModelId, setChatModelId] = useState<number | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const isChatAllowed =
    user?.role === "admin" || user?.membershipStatus === "active";

  const modelsQuery = useQuery({
    queryKey: ["available-models", accessToken],
    queryFn: () => getAvailableModels(accessToken!),
    enabled: !!accessToken,
  });

  const conversationsQuery = useQuery({
    queryKey: ["conversations", accessToken],
    queryFn: () => getConversations(accessToken!, { page: 1, pageSize: 30 }),
    enabled: !!accessToken,
  });

  const selectedConversation = useMemo(
    () =>
      conversationsQuery.data?.list.find((item) => item.id === selectedConversationId) ??
      null,
    [conversationsQuery.data?.list, selectedConversationId],
  );

  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", selectedConversationId, accessToken],
    queryFn: () => getConversationMessages(accessToken!, selectedConversationId!),
    enabled: !!accessToken && !!selectedConversationId,
  });

  useEffect(() => {
    if (!modelsQuery.data?.length) {
      return;
    }

    if (!sidebarModelId) {
      setSidebarModelId(modelsQuery.data[0].id);
    }

    if (!chatModelId) {
      setChatModelId(modelsQuery.data[0].id);
    }
  }, [chatModelId, modelsQuery.data, sidebarModelId]);

  useEffect(() => {
    if (!selectedConversationId && conversationsQuery.data?.list.length) {
      setSelectedConversationId(conversationsQuery.data.list[0].id);
    }
  }, [conversationsQuery.data?.list, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    setChatModelId(selectedConversation.modelId);
  }, [selectedConversation]);

  useEffect(() => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setStreamingMessageId(null);
    setStreamingContent("");
    setIsStreaming(false);
    setSendError(null);
  }, [selectedConversationId]);

  useEffect(
    () => () => {
      streamAbortRef.current?.abort();
    },
    [],
  );

  const createConversationMutation = useMutation({
    mutationFn: () =>
      createConversation(accessToken!, {
        modelId: sidebarModelId!,
        title: "新会话",
      }),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSelectedConversationId(conversation.id);
      setChatModelId(conversation.modelId);
      setCreateError(null);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      sendChatMessage(accessToken!, {
        conversationId: selectedConversationId!,
        modelId: chatModelId!,
        content,
        stream: true,
      }),
  });

  const handleCreateConversation = async () => {
    if (!sidebarModelId) {
      setCreateError("当前没有可用模型，请先在后台启用模型");
      return;
    }

    setCreateError(null);

    try {
      await createConversationMutation.mutateAsync();
    } catch (error) {
      setCreateError(
        error instanceof ApiError ? error.message : "创建会话失败，请稍后重试",
      );
    }
  };

  const handleSendMessage = async () => {
    const content = inputValue.trim();

    if (!selectedConversationId) {
      setSendError("请先创建或选择一个会话");
      return;
    }

    if (!chatModelId) {
      setSendError("当前没有可用模型，请先在后台启用模型");
      return;
    }

    if (!content) {
      setSendError("请输入消息内容");
      return;
    }

    if (!isChatAllowed) {
      setSendError("当前账号不是有效会员，开通会员后才能发送消息");
      return;
    }

    streamAbortRef.current?.abort();
    setSendError(null);

    try {
      const result = await sendMessageMutation.mutateAsync(content);
      const controller = new AbortController();

      streamAbortRef.current = controller;
      setInputValue("");
      setStreamingMessageId(result.messageId);
      setStreamingContent("");
      setIsStreaming(true);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["conversations"] }),
        queryClient.invalidateQueries({
          queryKey: ["conversation-messages", selectedConversationId, accessToken],
        }),
      ]);

      await streamChatMessage(accessToken!, result.messageId, {
        signal: controller.signal,
        onChunk: (chunk) => {
          setStreamingContent((current) => current + chunk);
        },
        onError: (message) => {
          setSendError(message);
          setIsStreaming(false);
          setStreamingMessageId(null);
          setStreamingContent("");
          streamAbortRef.current = null;
          void queryClient.invalidateQueries({
            queryKey: ["conversation-messages", selectedConversationId, accessToken],
          });
        },
        onDone: async () => {
          setIsStreaming(false);
          setStreamingMessageId(null);
          setStreamingContent("");
          streamAbortRef.current = null;
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["conversations"] }),
            queryClient.invalidateQueries({
              queryKey: ["conversation-messages", selectedConversationId, accessToken],
            }),
          ]);
        },
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setIsStreaming(false);
      setStreamingMessageId(null);
      setStreamingContent("");
      setSendError(
        error instanceof ApiError ? error.message : "发送消息失败，请稍后重试",
      );
      await queryClient.invalidateQueries({
        queryKey: ["conversation-messages", selectedConversationId, accessToken],
      });
    }
  };

  const displayedMessages = useMemo(() => {
    const messages = messagesQuery.data ?? [];

    return messages.map((message) => {
      if (message.id !== streamingMessageId) {
        return message;
      }

      return {
        ...message,
        content: streamingContent || message.content,
        status: isStreaming ? "streaming" : message.status,
      };
    });
  }, [isStreaming, messagesQuery.data, streamingContent, streamingMessageId]);

  return (
    <ProtectedGuard>
      <main className="grid h-screen grid-cols-1 overflow-hidden md:grid-cols-[320px_1fr]">
        <aside className="flex h-full min-h-0 flex-col overflow-hidden border-b border-[var(--border)] bg-white/70 p-6 md:border-b-0 md:border-r">
          <div className="shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">历史会话</h1>
              <button
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                onClick={() => {
                  void handleCreateConversation();
                }}
                type="button"
              >
                新建
              </button>
            </div>
            <div className="mt-3 rounded-2xl bg-[#f5eee6] px-4 py-3 text-sm text-[var(--muted)]">
              当前登录：{user?.username}
            </div>
            <div className="mt-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
              <p className="text-xs text-[var(--muted)]">左侧新建会话模型</p>
              <select
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                disabled={!modelsQuery.data?.length}
                onChange={(event) => setSidebarModelId(Number(event.target.value))}
                value={sidebarModelId ?? ""}
              >
                {modelsQuery.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <Link
              className="mt-3 block w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-center text-sm"
              href="/membership"
            >
              进入会员中心
            </Link>
            <button
              className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              onClick={() => {
                clear();
                router.replace("/login");
              }}
              type="button"
            >
              退出登录
            </button>

            {createError ? (
              <div className="mt-4 rounded-2xl border border-[#f0c2bb] bg-[#fff4f1] px-4 py-3 text-sm text-[#bf3b2c]">
                {createError}
              </div>
            ) : null}
          </div>

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
            {conversationsQuery.isLoading ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                正在加载会话列表...
              </div>
            ) : null}

            {conversationsQuery.error ? (
              <div className="rounded-2xl border border-[#f0c2bb] bg-[#fff4f1] px-4 py-4 text-sm text-[#bf3b2c]">
                {conversationsQuery.error instanceof ApiError
                  ? conversationsQuery.error.message
                  : "会话列表加载失败"}
              </div>
            ) : null}

            {conversationsQuery.data?.list.length ? (
              conversationsQuery.data.list.map((item) => (
                <button
                  key={item.id}
                  className={`w-full rounded-2xl border px-4 py-4 text-left text-sm transition ${
                    item.id === selectedConversationId
                      ? "border-[var(--accent)] bg-[#fff5ef]"
                      : "border-[var(--border)] bg-white"
                  }`}
                  onClick={() => setSelectedConversationId(item.id)}
                  type="button"
                >
                  <div className="font-medium">{item.title}</div>
                  <div className="mt-2 text-xs text-[var(--muted)]">
                    {formatTime(item.lastMessageAt ?? item.createdAt)}
                  </div>
                </button>
              ))
            ) : !conversationsQuery.isLoading ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                还没有历史会话，点击“新建”创建第一条会话。
              </div>
            ) : null}
            </div>
          </div>
        </aside>

        <section className="flex h-full min-h-0 flex-col overflow-hidden">
          <header className="shrink-0 border-b border-[var(--border)] bg-white/60 px-6 py-4 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--muted)]">当前会话模型</p>
                <h2 className="text-lg font-medium">
                  {selectedConversation?.title ?? "会话与消息系统"}
                </h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                <select
                  className="rounded-full border border-[var(--border)] bg-white px-4 py-2"
                  disabled={!modelsQuery.data?.length}
                  onChange={(event) => setChatModelId(Number(event.target.value))}
                  value={chatModelId ?? ""}
                >
                  {modelsQuery.data?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {modelsQuery.isLoading ? (
                  <p className="text-xs text-[var(--muted)]">正在加载模型...</p>
                ) : null}
                {modelsQuery.error ? (
                  <p className="text-xs text-[#bf3b2c]">
                    {modelsQuery.error instanceof ApiError
                      ? modelsQuery.error.message
                      : "模型列表加载失败"}
                  </p>
                ) : null}
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
            <div className="space-y-6">
              {!isChatAllowed ? (
                <div className="max-w-2xl rounded-[24px] border border-[#f0d8b5] bg-[#fffaf2] p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-[#9c5b10]">会员引导</div>
                      <div className="mt-2 text-sm leading-7 text-[#8a6734]">
                        普通非会员可以浏览聊天页，但发送消息前需要先开通会员。管理员不受此限制。
                      </div>
                    </div>
                    <Link
                      className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white"
                      href="/membership"
                    >
                      去开通会员
                    </Link>
                  </div>
                </div>
              ) : null}

              {!selectedConversationId ? (
                <div className="mx-auto max-w-2xl rounded-[24px] border border-[var(--border)] bg-white p-6 text-center text-sm leading-7 text-[var(--muted)] shadow-sm">
                  先在左侧选择模型并创建会话，然后在右侧独立切换当前聊天模型。
                </div>
              ) : null}

              {selectedConversationId && messagesQuery.isLoading ? (
                <div className="max-w-2xl rounded-[24px] bg-white p-5 shadow-sm">
                  正在加载消息历史...
                </div>
              ) : null}

              {selectedConversationId && messagesQuery.error ? (
                <div className="max-w-2xl rounded-[24px] border border-[#f0c2bb] bg-[#fff4f1] p-5 text-sm text-[#bf3b2c] shadow-sm">
                  {messagesQuery.error instanceof ApiError
                    ? messagesQuery.error.message
                    : "消息历史加载失败"}
                </div>
              ) : null}

              {selectedConversationId && displayedMessages.length
                ? displayedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-2xl rounded-[24px] p-5 shadow-sm ${
                        message.role === "user"
                          ? "ml-auto bg-[var(--accent)] text-white"
                          : "bg-white"
                      }`}
                    >
                      <div className="text-xs opacity-70">
                        {message.role} · {formatTime(message.createdAt)}
                        {message.status === "streaming" ? " · 生成中" : ""}
                        {message.status === "failed" ? " · 生成失败" : ""}
                      </div>
                      <div className="mt-3 whitespace-pre-wrap text-sm leading-7">
                        {message.content}
                      </div>
                    </div>
                  ))
                : selectedConversationId &&
                  displayedMessages &&
                  !displayedMessages.length && (
                    <div className="mx-auto max-w-2xl rounded-[24px] border border-[var(--border)] bg-white p-6 text-center text-sm leading-7 text-[var(--muted)] shadow-sm">
                      当前会话还没有消息，输入第一条消息后会立刻进入流式回复。
                    </div>
                  )}
            </div>
          </div>

          <footer className="shrink-0 border-t border-[var(--border)] bg-white/90 px-6 py-4 backdrop-blur">
            {sendError ? (
              <div className="mb-3 rounded-2xl border border-[#f0c2bb] bg-[#fff4f1] px-4 py-3 text-sm text-[#bf3b2c]">
                {sendError}
              </div>
            ) : null}
            <div className="flex items-end gap-3">
              <textarea
                className="min-h-24 flex-1 rounded-[24px] border border-[var(--border)] bg-white px-4 py-3 outline-none"
                disabled={!selectedConversationId || sendMessageMutation.isPending || isStreaming}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={
                  selectedConversationId
                    ? isChatAllowed
                      ? "输入消息，系统会按 SSE 流式返回内容"
                      : "当前账号需要开通会员后才能发送消息"
                    : "请先创建会话"
                }
                value={inputValue}
              />
              <button
                className="rounded-[20px] bg-[var(--accent)] px-6 py-3 font-medium text-white disabled:opacity-60"
                disabled={
                  !selectedConversationId ||
                  sendMessageMutation.isPending ||
                  isStreaming
                }
                onClick={() => {
                  void handleSendMessage();
                }}
                type="button"
              >
                {sendMessageMutation.isPending || isStreaming ? "发送中..." : "发送"}
              </button>
            </div>
          </footer>
        </section>
      </main>
    </ProtectedGuard>
  );
}
