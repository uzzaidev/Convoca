"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Bot, X } from "lucide-react";
import { ChatInterface } from "./ChatInterface";
import type { SidebarGroup } from "@/components/layout/AppSidebar";
import { trackAgentEntrypointViewed, trackAgentOpened } from "@/lib/mobile/analytics";

interface Props {
  groups: SidebarGroup[];
}

const GROUP_PATH_RE = /^\/groups\/([^/]+)/;

export function FloatingAgentBubble({ groups }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groupId = useMemo(() => {
    if (!pathname) return null;
    const m = pathname.match(GROUP_PATH_RE);
    return m?.[1] ?? null;
  }, [pathname]);

  const isChatPage = pathname?.endsWith("/chat") ?? false;

  const group = useMemo(
    () => (groupId ? groups.find((g) => g.id === groupId) ?? null : null),
    [groupId, groups]
  );

  const role: "admin" | "member" = group?.role === "admin" ? "admin" : "member";

  const trackedRef = useRef(false);
  useEffect(() => {
    if (!groupId || !group || isChatPage) return;
    if (trackedRef.current) return;
    trackedRef.current = true;
    void trackAgentEntrypointViewed({ groupRole: role });
  }, [groupId, group, isChatPage, role]);

  if (!groupId || !group || isChatPage) return null;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) void trackAgentOpened({ groupRole: role });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Abrir assistente IA"
          className="hidden md:flex fixed bottom-6 right-6 z-40 h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
        >
          <Bot className="h-6 w-6" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed z-50 bg-background shadow-2xl border rounded-lg overflow-hidden flex flex-col bottom-6 right-6 w-[420px] h-[640px] max-h-[calc(100vh-3rem)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">
            Assistente IA do grupo {group.name}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Converse com o assistente IA do grupo {group.name}.
          </DialogPrimitive.Description>
          <DialogPrimitive.Close
            className="absolute right-2 top-2 z-10 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring p-1"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
          <div className="flex-1 min-h-0">
            <ChatInterface groupId={groupId} role={role} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
