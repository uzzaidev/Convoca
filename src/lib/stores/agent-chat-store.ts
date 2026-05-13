import { create } from "zustand";

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

export interface GroupChatState {
  messages: Message[];
  conversationId?: string;
  previousResponseId?: string;
  loading: boolean;
  confirmation: ConfirmationPayload | null;
  error: string | null;
  quotaRefreshKey: number;
}

const emptyGroupState: GroupChatState = {
  messages: [],
  conversationId: undefined,
  previousResponseId: undefined,
  loading: false,
  confirmation: null,
  error: null,
  quotaRefreshKey: 0,
};

interface AgentChatStore {
  byGroup: Record<string, GroupChatState>;
  sendMessage: (groupId: string, text: string, confirmed?: boolean) => Promise<void>;
  confirm: (groupId: string) => void;
  cancel: (groupId: string) => void;
  stop: (groupId: string) => void;
}

const abortControllers = new Map<string, AbortController>();

function ensure(state: Record<string, GroupChatState>, groupId: string): GroupChatState {
  return state[groupId] ?? emptyGroupState;
}

function patch(
  set: (
    fn: (state: { byGroup: Record<string, GroupChatState> }) => Partial<{
      byGroup: Record<string, GroupChatState>;
    }>
  ) => void,
  groupId: string,
  updater: (prev: GroupChatState) => GroupChatState
) {
  set((state) => ({
    byGroup: {
      ...state.byGroup,
      [groupId]: updater(ensure(state.byGroup, groupId)),
    },
  }));
}

export const useAgentChatStore = create<AgentChatStore>((set, get) => ({
  byGroup: {},

  sendMessage: async (groupId, messageText, confirmed) => {
    if (!messageText.trim()) return;
    const current = ensure(get().byGroup, groupId);
    if (current.loading) return;

    patch(set, groupId, (prev) => ({
      ...prev,
      error: null,
      loading: true,
      confirmation: null,
    }));

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    patch(set, groupId, (prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { id: userMsgId, role: "user", content: messageText },
        { id: assistantMsgId, role: "assistant", content: "", pending: true },
      ],
    }));

    const controller = new AbortController();
    abortControllers.set(groupId, controller);

    const snapshot = ensure(get().byGroup, groupId);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          message: messageText,
          conversationId: snapshot.conversationId,
          previousResponseId: snapshot.previousResponseId,
          confirmed,
        }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error("Resposta sem corpo");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      const toolCalls: { tool: string; result?: unknown }[] = [];
      let receivedDone = false;

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
              patch(set, groupId, (prev) => ({
                ...prev,
                conversationId: data.conversationId as string,
              }));
              break;

            case "token":
              assistantText += data.delta as string;
              patch(set, groupId, (prev) => ({
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: assistantText } : m
                ),
              }));
              break;

            case "tool_call":
              toolCalls.push({ tool: data.tool as string });
              patch(set, groupId, (prev) => ({
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, toolCalls: [...toolCalls] } : m
                ),
              }));
              break;

            case "tool_result": {
              const idx = toolCalls.findIndex((t) => t.tool === data.tool);
              if (idx >= 0) {
                toolCalls[idx] = { ...toolCalls[idx], result: data.result };
                patch(set, groupId, (prev) => ({
                  ...prev,
                  messages: prev.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, toolCalls: [...toolCalls] }
                      : m
                  ),
                }));
              }
              break;
            }

            case "confirmation_required":
              patch(set, groupId, (prev) => ({
                ...prev,
                confirmation: {
                  tool: data.tool as string,
                  arguments: data.arguments,
                  responseId: data.responseId as string,
                },
                messages: prev.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, pending: false, toolCalls: [...toolCalls] }
                    : m
                ),
              }));
              break;

            case "done":
              receivedDone = true;
              patch(set, groupId, (prev) => ({
                ...prev,
                previousResponseId: data.responseId as string | undefined,
                quotaRefreshKey: prev.quotaRefreshKey + 1,
                messages: prev.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        pending: false,
                        toolCalls: m.toolCalls?.map((tc) =>
                          tc.result === undefined ? { ...tc, result: null } : tc
                        ),
                      }
                    : m
                ),
              }));
              break;

            case "error":
              patch(set, groupId, (prev) => ({
                ...prev,
                error: data.message as string,
                messages: prev.messages.filter((m) => m.id !== assistantMsgId),
              }));
              break;
          }
        }
      }

      if (!receivedDone) {
        patch(set, groupId, (prev) => ({
          ...prev,
          error: "A resposta foi interrompida inesperadamente. Tente novamente.",
          messages: prev.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, pending: false } : m
          ),
        }));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        patch(set, groupId, (prev) => ({
          ...prev,
          error: "Falha ao conectar ao agente. Tente novamente.",
          messages: prev.messages.filter((m) => m.id !== assistantMsgId),
        }));
      }
    } finally {
      patch(set, groupId, (prev) => ({ ...prev, loading: false }));
      abortControllers.delete(groupId);
    }
  },

  confirm: (groupId) => {
    const state = ensure(get().byGroup, groupId);
    if (!state.confirmation) return;

    const lastUserMsg = [...state.messages].reverse().find((m) => m.role === "user");
    const responseId = state.confirmation.responseId;

    patch(set, groupId, (prev) => ({
      ...prev,
      previousResponseId: responseId,
      confirmation: null,
    }));

    void get().sendMessage(groupId, lastUserMsg?.content ?? "confirmar", true);
  },

  cancel: (groupId) => {
    patch(set, groupId, (prev) => ({
      ...prev,
      confirmation: null,
      messages: [
        ...prev.messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Ação cancelada pelo usuário.",
        },
      ],
    }));
  },

  stop: (groupId) => {
    const controller = abortControllers.get(groupId);
    controller?.abort();
    abortControllers.delete(groupId);
    patch(set, groupId, (prev) => ({ ...prev, loading: false }));
  },
}));

export function selectGroupChat(groupId: string) {
  return (state: AgentChatStore): GroupChatState =>
    state.byGroup[groupId] ?? emptyGroupState;
}
