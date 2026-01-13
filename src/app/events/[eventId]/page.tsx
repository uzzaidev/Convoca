import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import { EventRsvpForm } from "@/components/events/event-rsvp-form";
import { EventTabs } from "@/components/events/event-tabs";
import { AdminPlayerManager } from "@/components/events/admin-player-manager";
import Link from "next/link";

type RouteParams = {
  params: Promise<{ eventId: string }>;
};

type Player = {
  id: string;
  name: string;
  image: string | null;
  role: string;
  preferred_position: string | null;
  secondary_position: string | null;
  created_at: string;
  removed_by_self_at: string | null;
};

type WaitlistPlayer = {
  id: string;
  name: string;
  image: string | null;
  role: string;
  created_at: string;
};

type GroupMember = {
  user_id: string;
  user_name: string;
  user_image: string | null;
  is_confirmed: boolean;
};

type Team = {
  id: string;
  name: string;
  seed: number;
  is_winner: boolean | null;
  members: Array<{
    userId: string;
    userName: string;
    userImage: string | null;
    position: string;
    starter: boolean;
  }> | null;
};

type UserAttendance = {
  status: string;
  preferred_position: string | null;
  secondary_position: string | null;
} | null;

export default async function EventRsvpPage({ params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { eventId } = await params;

  // Buscar informações do evento
  const eventResult = await sql`
    SELECT
      e.*,
      g.name as group_name,
      g.id as group_id,
      v.name as venue_name,
      v.address as venue_address,
      (SELECT COUNT(*) FROM event_attendance WHERE event_id = e.id AND status = 'yes') as confirmed_count,
      (SELECT COUNT(*) FROM event_attendance WHERE event_id = e.id AND status = 'waitlist') as waitlist_count
    FROM events e
    INNER JOIN groups g ON e.group_id = g.id
    LEFT JOIN venues v ON e.venue_id = v.id
    WHERE e.id = ${eventId}
  `;

  if (eventResult.length === 0) {
    redirect("/dashboard");
  }

  const event = eventResult[0];

  // Verificar se o usuário é membro do grupo
  const membershipResult = await sql`
    SELECT role FROM group_members
    WHERE group_id = ${event.group_id} AND user_id = ${user.id}
  `;

  if (membershipResult.length === 0) {
    redirect("/dashboard");
  }

  const membership = membershipResult[0];
  const isAdmin = membership.role === "admin";

  // Buscar times e jogadores
  const teams = await sql`
    SELECT
      t.id,
      t.name,
      t.seed,
      t.is_winner,
      json_agg(
        json_build_object(
          'userId', u.id,
          'userName', u.name,
          'userImage', u.image,
          'position', tm.position,
          'starter', tm.starter
        ) ORDER BY tm.position DESC, tm.starter DESC
      ) FILTER (WHERE u.id IS NOT NULL) as members
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id
    LEFT JOIN users u ON tm.user_id = u.id
    WHERE t.event_id = ${eventId}
    GROUP BY t.id, t.name, t.seed, t.is_winner
    ORDER BY t.seed ASC
  ` as unknown as Team[];
  
  const hasTeams = teams.length > 0;

  // Buscar status atual do usuário neste evento
  const userAttendanceResult = await sql`
    SELECT status, preferred_position, secondary_position FROM event_attendance
    WHERE event_id = ${eventId} AND user_id = ${user.id}
  `;

  const userAttendance: UserAttendance = userAttendanceResult.length > 0
    ? userAttendanceResult[0] as { status: string; preferred_position: string | null; secondary_position: string | null; }
    : null;

  // Buscar lista de confirmados
  const confirmedPlayers = await sql`
    SELECT
      u.id,
      u.name,
      u.image,
      ea.role,
      ea.preferred_position,
      ea.secondary_position,
      ea.created_at,
      ea.removed_by_self_at
    FROM event_attendance ea
    INNER JOIN users u ON ea.user_id = u.id
    WHERE ea.event_id = ${eventId} AND ea.status = 'yes'
    ORDER BY ea.created_at ASC
  ` as unknown as Player[];

  const waitlistPlayers = await sql`
    SELECT
      u.id,
      u.name,
      u.image,
      ea.role,
      ea.created_at
    FROM event_attendance ea
    INNER JOIN users u ON ea.user_id = u.id
    WHERE ea.event_id = ${eventId} AND ea.status = 'waitlist'
    ORDER BY ea.created_at ASC
  ` as unknown as WaitlistPlayer[];

  // Buscar membros do grupo para o admin gerenciar confirmações
  const groupMembers: GroupMember[] = isAdmin ? await sql`
    SELECT
      u.id as user_id,
      u.name as user_name,
      u.image as user_image,
      CASE WHEN ea.status = 'yes' THEN true ELSE false END as is_confirmed
    FROM group_members gm
    INNER JOIN users u ON gm.user_id = u.id
    LEFT JOIN event_attendance ea ON ea.user_id = u.id AND ea.event_id = ${eventId}
    WHERE gm.group_id = ${event.group_id}
    ORDER BY u.name ASC
  ` as unknown as GroupMember[] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50/30 dark:from-green-950/20 dark:via-background dark:to-green-950/10">
      <DashboardHeader userName={user.name || user.email} />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Botão voltar */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para o Dashboard
            </Button>
          </Link>
        </div>

        {/* Cabeçalho do evento */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            {formatDate(event.starts_at)}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">{event.group_name}</h1>
              {event.venue_name && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue_name}</span>
                </div>
              )}
            </div>
            <Badge
              variant={
                event.status === "finished"
                  ? "default"
                  : event.status === "live"
                  ? "destructive"
                  : "secondary"
              }
              className="w-fit"
            >
              {event.status === "finished"
                ? "Finalizado"
                : event.status === "live"
                ? "Ao vivo"
                : "Agendado"}
            </Badge>
          </div>

          {/* Barra de progresso discreta */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="font-medium">
                {event.confirmed_count}/{event.max_players}
              </span>
            </div>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-xs">
              <div
                className={`h-full transition-all ${
                  event.confirmed_count >= event.max_players
                    ? "bg-green-500"
                    : event.confirmed_count >= event.max_players * 0.7
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
                style={{
                  width: `${Math.min(
                    (event.confirmed_count / event.max_players) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Sistema de Abas */}
        <EventTabs
          eventId={eventId}
          groupId={event.group_id}
          eventStatus={event.status}
          isAdmin={isAdmin}
          confirmedPlayers={confirmedPlayers}
          waitlistPlayers={waitlistPlayers}
          teams={teams}
          maxPlayers={event.max_players}
          hasTeams={hasTeams}
          userAttendance={userAttendance}
          groupMembers={groupMembers}
        />
      </div>
    </div>
  );
}
