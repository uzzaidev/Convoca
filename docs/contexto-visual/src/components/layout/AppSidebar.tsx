"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Settings2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCircle,
  Bot,
  DollarSign,
  Plus,
  BarChart2,
  ToggleLeft,
  ToggleRight,
  Trophy,
  ClipboardList,
  Home,
  HelpCircle,
} from "lucide-react";

export type SidebarGroup = {
  id: string;
  name: string;
  role: "admin" | "member";
  app_mode: "ranking" | "control";
};

export type SidebarUser = {
  id: string;
  name: string;
  email: string;
  systemRole: "user" | "system_admin";
};

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed?: boolean;
  onClick?: () => void;
  exact?: boolean;
}

function NavItem({ href, icon, label, isCollapsed, onClick, exact }: NavItemProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const content = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150",
        isActive
          ? "bg-white/15 text-white border-l-[3px] border-green-400 pl-[9px]"
          : "text-white/60 hover:bg-white/10 hover:text-white",
        isCollapsed && "justify-center px-2",
      )}
    >
      <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{icon}</span>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

function SectionLabel({ label, isCollapsed }: { label: string; isCollapsed?: boolean }) {
  if (isCollapsed) return <div className="my-1 border-t border-white/10" />;
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
      {label}
    </p>
  );
}

interface AppSidebarProps {
  user: SidebarUser;
  groups: SidebarGroup[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLinkClick?: () => void;
}

export function AppSidebar({
  user,
  groups,
  isCollapsed,
  onToggleCollapse,
  onLinkClick,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modeLoading, setModeLoading] = useState(false);

  // Detecta grupo atual pela URL
  const groupMatch = pathname.match(/^\/groups\/([^/]+)/);
  const currentGroupId = groupMatch?.[1] ?? null;
  const currentGroup = groups.find((g) => g.id === currentGroupId) ?? null;
  const isGroupContext = currentGroupId !== null;
  const isAdmin = currentGroup?.role === "admin";

  // Linka para quando troca de grupo
  function handleGroupChange(newGroupId: string) {
    startTransition(() => {
      router.push(`/groups/${newGroupId}`);
    });
    onLinkClick?.();
  }

  // Toggle do modo do grupo
  async function handleModeToggle() {
    if (!currentGroup || !isAdmin) return;
    const nextMode = currentGroup.app_mode === "ranking" ? "control" : "ranking";
    setModeLoading(true);
    try {
      await fetch(`/api/groups/${currentGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appMode: nextMode }),
      });
      router.refresh();
    } finally {
      setModeLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-navy text-white select-none">
      {/* Logo / Header */}
      <div className={cn("flex items-center border-b border-white/10 h-16 px-4", isCollapsed && "justify-center")}>
        {!isCollapsed ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-2 flex-1" onClick={onLinkClick}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600/80">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12C2 12 6 8 12 8C18 8 22 12 22 12" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12C2 12 6 16 12 16C18 16 22 12 22 12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight">Convoca</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Group Picker */}
      {groups.length > 0 && (
        <div className={cn("px-3 py-3 border-b border-white/10", isCollapsed && "px-2")}>
          {!isCollapsed ? (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 px-1 pb-1">
                Grupo atual
              </p>
              <Select
                value={currentGroupId ?? ""}
                onValueChange={handleGroupChange}
                disabled={isPending}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white text-[13px] h-8 hover:bg-white/15 transition-colors">
                  <SelectValue placeholder="Selecionar grupo..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="flex items-center gap-2">
                        <span>{g.name}</span>
                        {g.role === "admin" && (
                          <span className="text-[10px] text-muted-foreground">(admin)</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full h-9 text-white/60 hover:bg-white/10 hover:text-white"
                    onClick={() => currentGroupId && handleGroupChange(currentGroupId)}
                  >
                    <Users className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {currentGroup?.name ?? "Grupos"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {isGroupContext && currentGroup ? (
          <>
            {/* Dentro de um grupo */}
            <NavItem
              href={`/groups/${currentGroupId}`}
              icon={<Home className="h-4 w-4" />}
              label="Visão Geral"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
              exact
            />
            <NavItem
              href={`/groups/${currentGroupId}/events`}
              icon={<Calendar className="h-4 w-4" />}
              label="Eventos"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <NavItem
              href={`/groups/${currentGroupId}/payments`}
              icon={<DollarSign className="h-4 w-4" />}
              label="Pagamentos"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <NavItem
              href={`/groups/${currentGroupId}/chat`}
              icon={<Bot className="h-4 w-4" />}
              label="Assistente IA"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />

            {isAdmin && (
              <>
                <SectionLabel label="Admin" isCollapsed={isCollapsed} />
                <NavItem
                  href={`/groups/${currentGroupId}/settings`}
                  icon={<Settings className="h-4 w-4" />}
                  label="Configurações"
                  isCollapsed={isCollapsed}
                  onClick={onLinkClick}
                />

                {/* App Mode Toggle */}
                {!isCollapsed && (
                  <div className="px-3 py-2 mt-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-2">
                      Modo do grupo
                    </p>
                    <button
                      onClick={handleModeToggle}
                      disabled={modeLoading}
                      className={cn(
                        "flex items-center gap-2 w-full rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all",
                        "bg-white/10 hover:bg-white/15 text-white border border-white/10",
                        modeLoading && "opacity-50 cursor-wait",
                      )}
                    >
                      {currentGroup.app_mode === "ranking" ? (
                        <>
                          <Trophy className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                          <span className="flex-1">Ranking</span>
                          <ToggleRight className="h-4 w-4 text-green-400" />
                        </>
                      ) : (
                        <>
                          <ClipboardList className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <span className="flex-1">Controle</span>
                          <ToggleLeft className="h-4 w-4 text-white/40" />
                        </>
                      )}
                    </button>
                  </div>
                )}
                {isCollapsed && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleModeToggle}
                          disabled={modeLoading}
                          className="flex justify-center items-center w-full rounded-lg px-2 py-2 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                        >
                          {currentGroup.app_mode === "ranking" ? (
                            <Trophy className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <ClipboardList className="h-4 w-4 text-blue-400" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Modo: {currentGroup.app_mode === "ranking" ? "Ranking" : "Controle"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            )}

            <SectionLabel label="Navegação" isCollapsed={isCollapsed} />
            <NavItem
              href="/dashboard"
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Dashboard"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
              exact
            />
            <NavItem
              href="/groups/new"
              icon={<Plus className="h-4 w-4" />}
              label="Novo Grupo"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
              exact
            />
          </>
        ) : (
          <>
            {/* Contexto global/dashboard */}
            <NavItem
              href="/dashboard"
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Dashboard"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
              exact
            />

            {groups.length > 0 && (
              <>
                <SectionLabel label="Meus Grupos" isCollapsed={isCollapsed} />
                {groups.map((g) => (
                  <NavItem
                    key={g.id}
                    href={`/groups/${g.id}`}
                    icon={
                      g.app_mode === "ranking" ? (
                        <Trophy className="h-4 w-4" />
                      ) : (
                        <ClipboardList className="h-4 w-4" />
                      )
                    }
                    label={g.name}
                    isCollapsed={isCollapsed}
                    onClick={onLinkClick}
                  />
                ))}
              </>
            )}

            <SectionLabel label="Ações" isCollapsed={isCollapsed} />
            <NavItem
              href="/groups/new"
              icon={<Plus className="h-4 w-4" />}
              label="Novo Grupo"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
              exact
            />
            <NavItem
              href="/groups/join"
              icon={<Users className="h-4 w-4" />}
              label="Entrar em Grupo"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
              exact
            />
          </>
        )}
      </nav>

      {/* Bottom: perfil + admin + logout */}
      <div className="shrink-0 border-t border-white/10 px-2 py-3 space-y-0.5" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
        {!isCollapsed && (
          <div className="px-3 py-2 mb-1 rounded-lg bg-white/5">
            <p className="text-[11px] text-white/40 truncate">{user.email}</p>
            <p className="text-[13px] font-medium text-white truncate">{user.name}</p>
          </div>
        )}

        <NavItem
          href="/profile"
          icon={<UserCircle className="h-4 w-4" />}
          label="Meu Perfil"
          isCollapsed={isCollapsed}
          onClick={onLinkClick}
          exact
        />
        <NavItem
          href="/settings"
          icon={<Settings2 className="h-4 w-4" />}
          label="Configurações"
          isCollapsed={isCollapsed}
          onClick={onLinkClick}
          exact
        />
        <NavItem
          href="/ajuda"
          icon={<HelpCircle className="h-4 w-4" />}
          label="Ajuda"
          isCollapsed={isCollapsed}
          onClick={onLinkClick}
          exact
        />

        {user.systemRole === "system_admin" && (
          <>
            <NavItem
              href="/admin"
              icon={<Shield className="h-4 w-4" />}
              label="Painel Admin"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
            <NavItem
              href="/admin/agent"
              icon={<BarChart2 className="h-4 w-4" />}
              label="Quotas Agente"
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
              exact
            />
          </>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all",
            isCollapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}
