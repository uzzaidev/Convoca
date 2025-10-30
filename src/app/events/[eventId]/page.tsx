import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { EventRsvpForm } from "@/components/events/event-rsvp-form";

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
};

type WaitlistPlayer = {
  id: string;
  name: string;
  image: string | null;
  role: string;
  created_at: string;
};

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

  // Buscar status atual do usuário neste evento
  const userAttendanceResult = await sql`
    SELECT * FROM event_attendance
    WHERE event_id = ${eventId} AND user_id = ${user.id}
  `;

  const userAttendance = userAttendanceResult.length > 0 ? userAttendanceResult[0] : null;

  // Buscar lista de confirmados
  const confirmedPlayers = await sql`
    SELECT
      u.id,
      u.name,
      u.image,
      ea.role,
      ea.preferred_position,
      ea.secondary_position,
      ea.created_at
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50/30 dark:from-green-950/20 dark:via-background dark:to-green-950/10">
      <DashboardHeader userName={user.name || user.email} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Cabeçalho do evento */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            {formatDate(event.starts_at)}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            >
              {event.status === "finished"
                ? "Finalizado"
                : event.status === "live"
                ? "Ao vivo"
                : "Agendado"}
            </Badge>
          </div>
        </div>

        {/* Informações e status */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-blue-500" />
                Participantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confirmados</span>
                  <span className="font-bold text-lg">
                    {event.confirmed_count}/{event.max_players}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
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
                {event.waitlist_enabled && event.waitlist_count > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{event.waitlist_count} na lista de espera</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seu Status</CardTitle>
            </CardHeader>
            <CardContent>
              {userAttendance ? (
                <div className="space-y-2">
                  <Badge
                    variant={
                      userAttendance.status === "yes"
                        ? "default"
                        : userAttendance.status === "waitlist"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-base px-4 py-2"
                  >
                    {userAttendance.status === "yes"
                      ? "✓ Confirmado"
                      : userAttendance.status === "waitlist"
                      ? "⏳ Lista de espera"
                      : "✗ Não confirmado"}
                  </Badge>
                  {userAttendance.preferred_position && (
                    <div className="text-sm text-muted-foreground mt-3">
                      <p className="font-medium">Posições escolhidas:</p>
                      <p className="capitalize">
                        1ª: {userAttendance.preferred_position === "gk" ? "Goleiro" : 
                             userAttendance.preferred_position === "defender" ? "Zagueiro" :
                             userAttendance.preferred_position === "midfielder" ? "Meio-campo" : "Atacante"}
                      </p>
                      {userAttendance.secondary_position && (
                        <p className="capitalize">
                          2ª: {userAttendance.secondary_position === "gk" ? "Goleiro" : 
                               userAttendance.secondary_position === "defender" ? "Zagueiro" :
                               userAttendance.secondary_position === "midfielder" ? "Meio-campo" : "Atacante"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Você ainda não confirmou sua presença
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulário de confirmação */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Confirmar Presença</CardTitle>
            <CardDescription>
              Selecione suas posições preferenciais para o sorteio dos times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventRsvpForm
              eventId={eventId}
              currentAttendance={userAttendance}
              eventStatus={event.status}
            />
          </CardContent>
        </Card>

        {/* Lista de jogadores confirmados */}
        {confirmedPlayers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Jogadores Confirmados ({confirmedPlayers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {confirmedPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{player.name}</p>
                      {player.preferred_position && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {player.preferred_position === "gk" ? "Goleiro" : 
                           player.preferred_position === "defender" ? "Zagueiro" :
                           player.preferred_position === "midfielder" ? "Meio" : "Atacante"}
                          {player.secondary_position && ` / ${
                            player.secondary_position === "gk" ? "Goleiro" : 
                            player.secondary_position === "defender" ? "Zagueiro" :
                            player.secondary_position === "midfielder" ? "Meio" : "Atacante"
                          }`}
                        </p>
                      )}
                    </div>
                    {player.role === "gk" && (
                      <Badge variant="outline" className="text-xs">
                        GK
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de espera */}
        {waitlistPlayers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Lista de Espera ({waitlistPlayers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {waitlistPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <p className="font-medium">{player.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
