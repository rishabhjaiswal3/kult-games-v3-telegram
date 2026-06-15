import { useEffect, useRef, useState } from "react";

import { StorageKeys } from "@/constants/storageKeys";
import { buildCatalogGroundedPrompt } from "@/lib/kultAiGameContext";
import { streamKultAIReply } from "@/lib/kultAiChat";

export interface KultAIMessage {
  id: string;
  role: "user" | "ai";
  text: string;
}

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `kult-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getOrCreateUserId = () => {
  if (typeof window === "undefined") {
    return "kult-browser-user";
  }

  const existing = window.localStorage.getItem(StorageKeys.local.kultAiUserId);
  if (existing) {
    return existing;
  }

  const nextId = createId();
  window.localStorage.setItem(StorageKeys.local.kultAiUserId, nextId);
  return nextId;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "KULT AI is unavailable right now.";
};

export const useKultAIChat = () => {
  const [messages, setMessages] = useState<KultAIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForFirstChunk, setIsWaitingForFirstChunk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userIdRef = useRef(getOrCreateUserId());
  const sessionIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const clearMessages = (resetSession = false) => {
    setMessages([]);
    setError(null);
    setIsWaitingForFirstChunk(false);

    if (resetSession) {
      sessionIdRef.current = null;
    }
  };

  const sendMessage = async (nextText?: string) => {
    const query = (nextText ?? input).trim();
    if (!query || isStreaming) {
      return;
    }

    setError(null);
    setInput("");
    setIsWaitingForFirstChunk(true);

    const userMessageId = createId();
    const assistantMessageId = createId();
    let assistantMessageStarted = false;

    setMessages((current) => [...current, { id: userMessageId, role: "user", text: query }]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsStreaming(true);

    try {
      const agentMessage = await buildCatalogGroundedPrompt(query);
      const result = await streamKultAIReply({
        message: agentMessage,
        userId: userIdRef.current,
        sessionId: sessionIdRef.current,
        signal: abortController.signal,
        onToken: (token) => {
          if (!assistantMessageStarted) {
            assistantMessageStarted = true;
            setIsWaitingForFirstChunk(false);
            setMessages((current) => [...current, { id: assistantMessageId, role: "ai", text: token }]);
            return;
          }

          setIsWaitingForFirstChunk(false);
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessageId ? { ...message, text: `${message.text}${token}` } : message,
            ),
          );
        },
      });

      sessionIdRef.current = result.sessionId;

      if (!result.reply.trim()) {
        setMessages((current) => [
          ...current,
          { id: assistantMessageId, role: "ai", text: "KULT AI returned an empty reply." },
        ]);
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      const message = getErrorMessage(error);
      setError(message);
      setMessages((current) => current.filter((entry) => entry.id !== assistantMessageId));
    } finally {
      abortControllerRef.current = null;
      setIsStreaming(false);
      setIsWaitingForFirstChunk(false);
    }
  };

  return {
    clearMessages,
    error,
    input,
    isStreaming,
    isWaitingForFirstChunk,
    messages,
    sendMessage,
    setInput,
    /** Current 0G Compute session ID — changes each conversation reset */
    computeSessionId: sessionIdRef.current,
  };
};
