"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppSidebar, type SidebarUser, type SidebarGroup } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useResizableSidebar } from "@/hooks/useResizableSidebar";
import { FloatingAgentBubble } from "@/components/agent/FloatingAgentBubble";

interface AppLayoutProps {
  user: SidebarUser;
  groups: SidebarGroup[];
  children: React.ReactNode;
}

export function AppLayout({ user, groups, children }: AppLayoutProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  const [isDesktop, setIsDesktop] = useState(false);

  const { width: sidebarWidth, handleMouseDown: handleSidebarResize } =
    useResizableSidebar({
      storageKey: "convoca_sidebar_width",
      defaultWidth: 220,
      minWidth: 180,
      maxWidth: 340,
    });

  const currentGroupId = pathname.match(/^\/groups\/([^/]+)/)?.[1];
  const currentGroup = groups.find((g) => g.id === currentGroupId);

  // Detecta desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function toggleCollapse() {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  }

  const collapsedWidth = 64;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar (fixed) */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40 overflow-hidden"
        style={{ width: isCollapsed ? collapsedWidth : sidebarWidth }}
      >
        <AppSidebar
          user={user}
          groups={groups}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        {/* Drag handle */}
        {!isCollapsed && (
          <div
            onMouseDown={handleSidebarResize}
            className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-green-600/40 transition-colors z-10"
            title="Arrastar para redimensionar"
          />
        )}
      </aside>

      {/* Main content */}
      <main
        className={cn("flex-1 flex flex-col min-w-0 min-h-screen")}
        style={{
          marginLeft: isDesktop ? (isCollapsed ? collapsedWidth : sidebarWidth) : 0,
        }}
      >
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex h-14 items-center border-b bg-navy px-4">
          <span className="text-lg font-bold text-white truncate">
            {currentGroup?.name ?? "Convoca"}
          </span>
        </div>

        {/* Page content */}
        <div className="flex-1 bg-gray-50 overflow-auto pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {children}
        </div>
      </main>

      <MobileBottomNav user={user} groups={groups} />
      <FloatingAgentBubble groups={groups} />
    </div>
  );
}
