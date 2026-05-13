"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar, type SidebarUser, type SidebarGroup } from "./AppSidebar";
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const { width: sidebarWidth, handleMouseDown: handleSidebarResize } =
    useResizableSidebar({
      storageKey: "convoca_sidebar_width",
      defaultWidth: 220,
      minWidth: 180,
      maxWidth: 340,
    });

  // Fecha mobile drawer ao mudar de rota
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsMobileOpen(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

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
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40 overflow-y-auto"
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
        <div className="md:hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-navy px-4">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[260px] p-0 bg-navy border-r border-white/10"
            >
              <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
              <AppSidebar
                user={user}
                groups={groups}
                isCollapsed={false}
                onToggleCollapse={() => setIsMobileOpen(false)}
                onLinkClick={() => setIsMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <span className="text-lg font-bold text-white">Convoca</span>
        </div>

        {/* Page content */}
        <div className="flex-1 bg-gray-50 overflow-auto">
          {children}
        </div>
      </main>

      <FloatingAgentBubble groups={groups} />
    </div>
  );
}
