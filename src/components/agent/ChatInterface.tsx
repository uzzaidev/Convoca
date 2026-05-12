"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "./ChatMessage";
import { ToolCallCard } from "./ToolCallCard";
import { ConfirmationCard } from "./ConfirmationCard";
import { QuotaBadge } from "./QuotaBadge";

export type MessageRole = "user" | "assistant";

export type SseEventType =
  | "thinking"
  | "token"
  | "tool_call"
  | "tool_result"
  | "confirmation_required"
  | "conversation_created"
  | "usage"
  | "done"
  | "error";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: { tool: string; result?: unknown }[];
  pending?: boolean;
}

export interface ConfirmationPayload {
  tool: string;
  arguments: unknown;
  responseId: string;
}

interface Props {
  groupId: string;
  role: "admin" | "member";
  initialConversationId?: string;
}

export function ChatInterface({ groupId, role, initialConversationId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [previousResponseId, setPreviousResponseId] = useState<
    string | undefined
  >();
  const [confirmation, setConfirmation] = useState<ConfirmationPayload | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (messageText: string, confirmed?: boolean) => {
      if (!messageText.trim() || loading) return;

      setError(null);
      setLoading(true);
      setConfirmation(null);

      const userMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: messageText },
      ]);

      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", pending: true },
      ]);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId,
            message: messageText,
            conversationId,
            previousResponseId,
            confirmed,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.body) throw new Error("Resposta sem corpo");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantText = "";
        const toolCalls: { tool: string; result?: unknown }[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            if (!part.trim()) continue;

            const lines = part.split("\n");
            let evType = "";
            let evData = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) evType = line.slice(7);
              if (line.startsWith("data: ")) evData = line.slice(6);
            }

            if (!evType || !evData) continue;

            let data: Record<string, unknown>;
            try {
              data = JSON.parse(evData);
            } catch {
              continue;
            }

            switch (evType as SseEventType) {
              case "conversation_created":
                setConversationId(data.conversationId as string);
                break;

              case "token":
                assistantText += data.delta as string;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: assistantText }
                      : m
                  )
                );
                break;

              case "tool_call":
                toolCalls.push({ tool: data.tool as string });
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, toolCalls: [...toolCalls] }
                      : m
                  )
                );
                break;

              case "tool_result": {
                const idx = toolCalls.findIndex((t) => t.tool === data.tool);
                if (idx >= 0) {
                  toolCalls[idx] = { ...toolCalls[idx], result: data.result };
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, toolCalls: [...toolCalls] }
                        : m
                    )
                  );
                }
                break;
              }

              case "confirmation_required":
                setConfirmation({
                  tool: data.tool as string,
                  arguments: data.arguments,
                  responseId: data.responseId as string,
                });
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, pending: false, toolCalls: [...toolCalls] }
                      : m
                  )
                );
                break;

              case "done":
                setPreviousResponseId(data.responseId as string | undefined);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, pending: false }
                      : m
                  )
                );
                break;

              case "error":
                setError(data.message as string);
                setMessages((prev) =>
                  prev.filter((m) => m.id !== assistantMsgId)
                );
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Falha ao conectar ao agente. Tente novamente.");
          setMessages((prev) =>
            prev.filter((m) => m.id !== assistantMsgId)
          );
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [loading, groupId, conversationId, previousResponseId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    void sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = input.trim();
      if (!text) return;
      setInput("");
      void sendMessage(text);
    }
  };

  const handleConfirm = () => {
    if (!confirmation) return;
    const lastUserMsg = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    setPreviousResponseId(confirmation.responseId);
    setConfirmation(null);
    void sendMessage(lastUserMsg?.content ?? "confirmar", true);
  };

  const handleCancel = () => {
    setConfirmation(null);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Ação cancelada pelo usuário.",
      },
    ]);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h2 className="font-semibold text-sm">Assistente do Grupo</h2>
        <QuotaBadge />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">
            Olá! Sou o assistente do Convoca. Como posso te ajudar hoje?
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatMessage message={msg} />
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div className="mt-2 space-y-1 pl-2">
                {msg.toolCalls.map((tc, i) => (
                  <ToolCallCard key={i} tool={tc.tool} result={tc.result} />
                ))}
              </div>
            )}
          </div>
        ))}

        {confirmation && (
          <ConfirmationCard
            tool={confirmation.tool}
            arguments={confirmation.arguments}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 p-4 border-t"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem... (Enter para enviar)"
          className="resize-none min-h-[44px] max-h-32"
          rows={1}
          disabled={loading || !!confirmation}
        />
        {loading ? (
          <Button type="button" variant="outline" onClick={handleStop}>
            Parar
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!input.trim() || !!confirmation}
          >
            Enviar
          </Button>
        )}
      </form>
    </div>
  );
}
