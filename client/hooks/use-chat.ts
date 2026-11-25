"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  api,
  type ChatMessage,
  type ChatSession,
  type Citation,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { streamChat } from "@/lib/stream-chat";

export function useChatSessions(repositoryId: string | undefined) {
  return useQuery<ChatSession[]>({
    queryKey: queryKeys.chat.sessions,
    queryFn: () => api.listSessions(repositoryId!),
    enabled: Boolean(repositoryId),
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      repositoryId,
      title,
    }: {
      repositoryId: string;
      title?: string;
    }) => api.createSession(repositoryId, title),
    onSuccess: (createdSession) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.sessions,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create chat session");
    },
  });
}

export function useChatMessages(sessionId: string | undefined) {
  return useQuery<ChatMessage[]>({
    queryKey: queryKeys.chat.messages(sessionId ?? ""),
    queryFn: () => api.getMessages(sessionId!),
    enabled: Boolean(sessionId),
  });
}

export function useChatStream(sessionId: string | undefined) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId || !content.trim() || isStreaming) {
        return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsStreaming(true);
      setStreamingContent("");
      setStreamingCitations([]);

      try {
        await streamChat({
          sessionId,
          content: content.trim(),
          signal: controller.signal,
          onUserMessage: (userMsg) => {
            queryClient.setQueryData<ChatMessage[]>(
              queryKeys.chat.messages(sessionId),
              (prev = []) => [...prev, userMsg]
            );
          },
          onToken: (token) => {
            setStreamingContent((prev) => prev + token);
          },
          onAssistantMessage: (assistantMsg) => {
            if (assistantMsg.citations?.length) {
              setStreamingCitations(assistantMsg.citations);
            }
            queryClient.setQueryData<ChatMessage[]>(
              queryKeys.chat.messages(sessionId),
              (prev = []) => [...prev, assistantMsg]
            );
          },
          onDone: () => {
            setIsStreaming(false);
            setStreamingContent("");
            setStreamingCitations([]);
            queryClient.invalidateQueries({
              queryKey: queryKeys.chat.messages(sessionId),
            });
          },
          onError: (errorMessage) => {
            setIsStreaming(false);
            setStreamingContent("");
            toast.error(errorMessage || "Failed to stream chat response");
          },
        });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setIsStreaming(false);
          setStreamingContent("");
          toast.error((err as Error)?.message || "Stream interrupted");
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [sessionId, isStreaming, queryClient]
  );

  return {
    sendMessage,
    stopStream,
    isStreaming,
    streamingContent,
    streamingCitations,
  };
}