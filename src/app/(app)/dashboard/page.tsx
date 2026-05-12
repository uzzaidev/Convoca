import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GroupsCard } from "@/components/dashboard/groups-card";
import { UpcomingEventsCard } from "@/components/dashboard/upcoming-events-card";
import { PendingPaymentsCard } from "@/components/dashboard/pending-payments-card";
import { Plus, Users } from "lucide-react";
import { type GroupStatus } from "@/lib/group-status";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold">Ola, {user.name?.split(" ")[0] || user.email}!</h1>
              <p className="text-lg text-gray-200">Gerencie seus grupos e peladas em um so lugar</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/groups/join" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Entrar em Grupo
                </Link>
              </Button>
              <Button asChild className="border-0 bg-green-600 text-white hover:bg-green-700">
                <Link href="/groups/new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Grupo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b bg-white">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{groups.length}</div>
              <div className="mt-1 text-sm text-gray-600">{groups.length === 1 ? "Grupo" : "Grupos"}</div>
            </div>
            <div className="rounded-lg border border-navy/20 bg-navy/5 p-4 text-center">
              <div className="text-3xl font-bold text-navy">{upcomingEvents.length}</div>
              <div className="mt-1 text-sm text-gray-600">
                {upcomingEvents.length === 1 ? "Pelada Agendada" : "Peladas Agendadas"}
              </div>
            </div>
            <div className="col-span-2 rounded-lg border border-green-dark/30 bg-green-dark/10 p-4 text-center md:col-span-1">
              <div className="text-3xl font-bold text-green-dark">
                {upcomingEvents.filter((event) => event.user_status === "yes").length}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {upcomingEvents.filter((event) => event.user_status === "yes").length === 1
                  ? "Confirmacao"
                  : "Confirmacoes"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <PendingPaymentsCard userId={user.id} />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <GroupsCard groups={groups} />
          <UpcomingEventsCard events={upcomingEvents} />
        </div>
      </div>
    </div>
  );
}
