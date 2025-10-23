import { auth } from "@/lib/auth";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type Group = {
  id: string;
  name: string;
  description: string | null;
  role: string;
  member_count: number;
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

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  let groups: Group[] = [];
  let upcomingEvents: Event[] = [];

  try {
    // Get user's groups
    const groupsRaw = await sql`
      SELECT
        g.id,
        g.name,
        g.description,
        gm.role,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ${session.user.id}
      ORDER BY g.created_at DESC
    `;
    groups = groupsRaw as Group[];
  } catch (error) {
    console.error("Error fetching groups:", error);
    // Continue with empty groups array
  }

  try {
    // Get upcoming events across all groups
    const upcomingEventsRaw = await sql`
      SELECT
        e.id,
        e.starts_at,
        e.status,
        g.name as group_name,
        g.id as group_id,
        v.name as venue_name,
        (SELECT COUNT(*) FROM event_attendance WHERE event_id = e.id AND status = 'yes') as confirmed_count,
        e.max_players,
        ea.status as user_status
      FROM events e
      INNER JOIN groups g ON e.group_id = g.id
      INNER JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN event_attendance ea ON e.id = ea.event_id AND ea.user_id = ${session.user.id}
      WHERE gm.user_id = ${session.user.id}
        AND e.starts_at > NOW()
        AND e.status = 'scheduled'
      ORDER BY e.starts_at ASC
      LIMIT 10
    `;
    upcomingEvents = upcomingEventsRaw as Event[];
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    // Continue with empty events array
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo, {session.user.name || session.user.email}
            </p>
          </div>
          <Button asChild>
            <Link href="/groups/new">Criar Grupo</Link>
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Groups Section */}
          <Card>
            <CardHeader>
              <CardTitle>Meus Grupos</CardTitle>
              <CardDescription>
                {groups.length} grupo{groups.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Você ainda não faz parte de nenhum grupo.</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link href="/groups/new">Criar seu primeiro grupo</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map((group: Group) => (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{group.name}</h3>
                          {group.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {group.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {group.member_count} membros
                          </p>
                        </div>
                        <Badge variant={group.role === "admin" ? "default" : "secondary"}>
                          {group.role === "admin" ? "Admin" : "Membro"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events Section */}
          <Card>
            <CardHeader>
              <CardTitle>Próximas Peladas</CardTitle>
              <CardDescription>
                {upcomingEvents.length} evento{upcomingEvents.length !== 1 ? "s" : ""} agendado
                {upcomingEvents.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma pelada agendada.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event: Event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{event.group_name}</h3>
                            {event.user_status && (
                              <Badge
                                variant={
                                  event.user_status === "yes"
                                    ? "default"
                                    : event.user_status === "waitlist"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {event.user_status === "yes"
                                  ? "Confirmado"
                                  : event.user_status === "waitlist"
                                  ? "Lista de espera"
                                  : "Recusado"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.starts_at)}
                          </p>
                          {event.venue_name && (
                            <p className="text-xs text-muted-foreground">
                              📍 {event.venue_name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.confirmed_count}/{event.max_players} confirmados
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
