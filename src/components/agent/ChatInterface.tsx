"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "./ChatMessage";
import { ToolCallCard } from "./ToolCallCard";
import { ConfirmationCard } from "./ConfirmationCard";
import { QuotaBadge } from "./QuotaBadge";
import {
  useAgentChatStore,
  selectGroupChat,
} from "@/lib/stores/agent-chat-store";

export type { MessageRole, SseEventType, Message, ConfirmationPayload } from "@/lib/stores/agent-chat-store";

interface Props {
  groupId: string;
  role: "admin" | "member";
  // Mantido por compatibilidade; ignorado pois agora a conversa vive no store.
  initialConversationId?: string;
}

export function ChatInterface({ groupId }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, loading, confirmation, error, quotaRefreshKey } =
    useAgentChatStore(selectGroupChat(groupId));
  const sendMessage = useAgentChatStore((s) => s.sendMessage);
  const confirmStore = useAgentChatStore((s) => s.confirm);
  const cancelStore = useAgentChatStore((s) => s.cancel);
  const stopStore = useAgentChatStore((s) => s.stop);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    void sendMessage(groupId, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = input.trim();
      if (!text) return;
      setInput("");
      void sendMessage(groupId, text);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h2 className="font-semibold text-sm">Assistente do Grupo</h2>
        <QuotaBadge refreshKey={quotaRefreshKey} />
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
            onConfirm={() => confirmStore(groupId)}
            onCancel={() => cancelStore(groupId)}
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
          <Button type="button" variant="outline" onClick={() => stopStore(groupId)}>
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
