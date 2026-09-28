"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Home,
  Trophy,
  DollarSign,
  Bot,
  MoreHorizontal,
  Plus,
  Users,
  UserCircle,
} from "lucide-react";
import { AppSidebar, type SidebarUser, type SidebarGroup } from "./AppSidebar";

interface MobileBottomNavProps {
  user: SidebarUser;
  groups: SidebarGroup[];
}

type Tab = { href: string; label: string; icon: React.ReactNode; exact?: boolean };

const tabClass =
  "flex flex-1 flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-medium transition-colors";

export function MobileBottomNav({ user, groups }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Fecha o "Mais" ao mudar de rota
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  const groupId = pathname.match(/^\/groups\/([^/]+)/)?.[1];
  const isGroupContext = !!groupId && groups.some((g) => g.id === groupId);

  const tabs: Tab[] = isGroupContext
    ? [
        { href: `/groups/${groupId}`, label: "Início", icon: <Home className="h-6 w-6" />, exact: true },
        { href: `/groups/${groupId}/championships`, label: "Campeonatos", icon: <Trophy className="h-6 w-6" /> },
        { href: `/groups/${groupId}/payments`, label: "Pagamentos", icon: <DollarSign className="h-6 w-6" /> },
        { href: `/groups/${groupId}/chat`, label: "IA", icon: <Bot className="h-6 w-6" /> },
      ]
    : [
        { href: "/dashboard", label: "Início", icon: <Home className="h-6 w-6" />, exact: true },
        { href: "/groups/new", label: "Novo grupo", icon: <Plus className="h-6 w-6" />, exact: true },
        { href: "/groups/join", label: "Entrar", icon: <Users className="h-6 w-6" />, exact: true },
        { href: "/profile", label: "Perfil", icon: <UserCircle className="h-6 w-6" />, exact: true },
      ];

  return (
    <nav
      data-bottom-nav
      aria-label="Navegação principal"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-navy"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(tabClass, "min-w-0", isActive ? "text-green-400" : "text-white/60")}
          >
            <span
              className={cn(
                "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                isActive && "bg-green-400/15",
              )}
            >
              {tab.icon}
            </span>
            <span className="max-w-full truncate tracking-tight">{tab.label}</span>
          </Link>
        );
      })}

      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className={cn(tabClass, isMoreOpen ? "text-green-400" : "text-white/60")}
        >
          <span
            className={cn(
              "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
              isMoreOpen && "bg-green-400/15",
            )}
          >
            <MoreHorizontal className="h-6 w-6" />
          </span>
          <span>Mais</span>
        </button>
        <SheetContent
          side="bottom"
          className="h-[85dvh] p-0 bg-navy border-t border-white/10 rounded-t-2xl overflow-hidden"
        >
          <SheetTitle className="sr-only">Mais opções</SheetTitle>
          <AppSidebar
            user={user}
            groups={groups}
            isCollapsed={false}
            onToggleCollapse={() => setIsMoreOpen(false)}
            onLinkClick={() => setIsMoreOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </nav>
  );
}
