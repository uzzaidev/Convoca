import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { GroupsCard } from "@/components/dashboard/groups-card";
import { UpcomingEventsCard } from "@/components/dashboard/upcoming-events-card";

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
  const user = await getCurrentUser();

  if (!user) {
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
      WHERE gm.user_id = ${user.id}
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
      LEFT JOIN event_attendance ea ON e.id = ea.event_id AND ea.user_id = ${user.id}
      WHERE gm.user_id = ${user.id}
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
      <DashboardHeader userName={user.name || user.email} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo, {user.name || user.email}
            </p>
          </div>
          <Button asChild className="w-fit">
            <Link href="/groups/new">➕ Criar Grupo</Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <GroupsCard groups={groups} />
          <UpcomingEventsCard events={upcomingEvents} />
        </div>
      </div>
    </div>
  );
}
