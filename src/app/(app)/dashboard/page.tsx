import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GroupsCard } from "@/components/dashboard/groups-card";
import { UpcomingEventsCard } from "@/components/dashboard/upcoming-events-card";
import { PendingPaymentsCard } from "@/components/dashboard/pending-payments-card";
import { PitchBackground } from "@/components/ui/pitch-background";
import { Plus, Users, MapPin, Clock, ArrowRight, Calendar } from "lucide-react";
import { type GroupStatus } from "@/lib/group-status";
import { DashboardTour } from "@/components/tour/DashboardTour";

type Group = {
  id: string;
  name: string;
  description: string | null;
  role: string;
  member_count: number;
  status: GroupStatus;
};

type Event = {
  id: string;
  starts_at: string;
  status: string;
  group_name: string;
  group_id: string;
  venue_name: string | null;
  confirmed_count: number;
  max_players: number;
  user_status: string | null;
};

const WEEKDAY_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function formatHeroDate(iso: string) {
  const d = new Date(iso);
  const weekday = WEEKDAY_PT[d.getDay()];
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return { weekday, time };
}

function relativeDays(iso: string): string {
  const target = new Date(iso);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  let groups: Group[] = [];
  let upcomingEvents: Event[] = [];

  try {
    const groupsRaw = await sql`
      SELECT
        g.id,
        g.name,
        g.description,
        g.status,
        gm.role,
        (
          SELECT COUNT(*)
          FROM group_members
          WHERE group_id = g.id
        ) as member_count
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ${user.id}
        AND g.deleted_at IS NULL
      ORDER BY g.created_at DESC
    `;
    groups = groupsRaw as unknown as Group[];
  } catch (error) {
    console.error("Error fetching groups:", error);
  }

  try {
    const upcomingEventsRaw = await sql`
      SELECT
        e.id,
        e.starts_at,
        e.status,
        g.name as group_name,
        g.id as group_id,
        v.name as venue_name,
        (
          SELECT COUNT(*)
          FROM event_attendance
          WHERE event_id = e.id AND status = 'yes'
        ) as confirmed_count,
        e.max_players,
        ea.status as user_status
      FROM events e
      INNER JOIN groups g ON e.group_id = g.id
      INNER JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN event_attendance ea ON e.id = ea.event_id AND ea.user_id = ${user.id}
      WHERE gm.user_id = ${user.id}
        AND g.deleted_at IS NULL
        AND g.status = 'active'
        AND e.starts_at > NOW()
        AND e.status = 'scheduled'
      ORDER BY e.starts_at ASC
      LIMIT 10
    `;
    upcomingEvents = upcomingEventsRaw as unknown as Event[];
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
  }

  const firstName = user.name?.split(" ")[0] || user.email;
  const nextEvent = upcomingEvents[0];
  const confirmedCount = upcomingEvents.filter((e) => e.user_status === "yes").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Greeting + actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-eyebrow text-muted-foreground">
              Bem-vindo de volta
            </div>
            <h1 className="font-display text-4xl tracking-display sm:text-5xl">
              Olá, {firstName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {nextEvent
                ? `Sua próxima pelada começa ${relativeDays(nextEvent.starts_at)} · ${nextEvent.confirmed_count} confirmado${
                    Number(nextEvent.confirmed_count) === 1 ? "" : "s"
                  }`
                : "Você ainda não tem peladas marcadas"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" data-tour="entrar-grupo">
              <Link href="/groups/join" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Entrar em Grupo
              </Link>
            </Button>
            <Button asChild data-tour="criar-grupo">
              <Link href="/groups/new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar Grupo
              </Link>
            </Button>
          </div>
        </div>

        {/* HERO — next match on pitch background */}
        {nextEvent ? (
          <Link
            href={`/events/${nextEvent.id}`}
            className="block overflow-hidden rounded-2xl shadow-warm-lg transition-transform hover:scale-[1.005]"
          >
            <div className="relative">
              <PitchBackground height={260} />
              <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 text-primary-foreground">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-navy/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                        Próxima pelada
                      </span>
                      <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                        {nextEvent.group_name}
                      </span>
                    </div>
                    <h2
                      className="font-display tracking-scoreboard"
                      style={{
                        fontSize: "clamp(36px, 7vw, 56px)",
                        lineHeight: 0.9,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(() => {
                        const { weekday, time } = formatHeroDate(nextEvent.starts_at);
                        return `${weekday} · ${time}`;
                      })()}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm opacity-90">
                      {nextEvent.venue_name && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {nextEvent.venue_name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {relativeDays(nextEvent.starts_at)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold uppercase tracking-eyebrow opacity-70">
                      Presença
                    </div>
                    <div
                      className="font-display num"
                      style={{ fontSize: 48, lineHeight: 1 }}
                    >
                      {nextEvent.confirmed_count}
                      <span style={{ opacity: 0.5, fontSize: 24 }}>
                        /{nextEvent.max_players}
                      </span>
                    </div>
                    {Number(nextEvent.max_players) - Number(nextEvent.confirmed_count) > 0 && (
                      <div className="text-xs opacity-80">
                        {Number(nextEvent.max_players) - Number(nextEvent.confirmed_count)} vagas restantes
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm ${
                      nextEvent.user_status === "yes"
                        ? "bg-pitch-glow/90"
                        : "bg-white/20"
                    }`}
                  >
                    {nextEvent.user_status === "yes"
                      ? "✓ Você confirmou"
                      : nextEvent.user_status === "no"
                      ? "Você não vai"
                      : nextEvent.user_status === "waitlist"
                      ? "Lista de espera"
                      : "Confirme sua presença"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-pitch-glow px-4 py-2 text-sm font-semibold text-navy shadow-glow">
                    Ver detalhes
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="overflow-hidden rounded-2xl shadow-warm-md">
            <div className="relative">
              <PitchBackground height={200} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-primary-foreground">
                <h2 className="font-display tracking-display" style={{ fontSize: 36, lineHeight: 1 }}>
                  SEM PELADAS NO HORIZONTE
                </h2>
                <p className="max-w-md text-sm opacity-85">
                  Crie um grupo, marque uma pelada ou peça pra um amigo te convidar.
                </p>
                <div className="mt-2 flex gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/groups/new">Criar grupo</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-pitch-glow text-navy hover:bg-pitch-glow/90">
                    <Link href="/groups/join">Entrar em grupo</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
          <div className="cv-stat">
            <div className="cv-stat-label">Grupos</div>
            <div className="cv-stat-value">{groups.length}</div>
            <div className="cv-stat-trend">
              {groups.length === 1 ? "1 ativo" : `${groups.length} ativos`}
            </div>
          </div>
          <div className="cv-stat">
            <div className="cv-stat-label">Peladas</div>
            <div className="cv-stat-value">{upcomingEvents.length}</div>
            <div className="cv-stat-trend">agendadas</div>
          </div>
          <div className="cv-stat">
            <div className="cv-stat-label">Confirmações</div>
            <div className={`cv-stat-value ${confirmedCount > 0 ? "text-pitch" : ""}`}>
              {confirmedCount}
            </div>
            <div className="cv-stat-trend">próximos jogos</div>
          </div>
        </div>

        {/* Pending payments */}
        <div className="mt-6">
          <PendingPaymentsCard userId={user.id} />
        </div>

        {/* Groups + upcoming events */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GroupsCard groups={groups} />
          <UpcomingEventsCard events={upcomingEvents} />
        </div>
      </div>

      <DashboardTour hasGroups={groups.length > 0} />
    </div>
  );
}
