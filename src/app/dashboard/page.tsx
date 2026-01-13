import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { GroupsCard } from "@/components/dashboard/groups-card";
import { UpcomingEventsCard } from "@/components/dashboard/upcoming-events-card";
import { PendingPaymentsCard } from "@/components/dashboard/pending-payments-card";
import { Plus, Users } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userName={user.name || user.email} />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Olá, {user.name?.split(' ')[0] || user.email}! 👋
              </h1>
              <p className="text-gray-200 text-lg">
                Gerencie seus grupos e peladas em um só lugar
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                <Link href="/groups/join" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Entrar em Grupo
                </Link>
              </Button>
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white border-0">
                <Link href="/groups/new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Grupo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="text-3xl font-bold text-green-600">{groups.length}</div>
              <div className="text-sm text-gray-600 mt-1">
                {groups.length === 1 ? 'Grupo' : 'Grupos'}
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-navy/5 border border-navy/20">
              <div className="text-3xl font-bold text-navy">{upcomingEvents.length}</div>
              <div className="text-sm text-gray-600 mt-1">
                {upcomingEvents.length === 1 ? 'Pelada Agendada' : 'Peladas Agendadas'}
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-dark/10 border border-green-dark/30 col-span-2 md:col-span-1">
              <div className="text-3xl font-bold text-green-dark">
                {upcomingEvents.filter(e => e.user_status === 'yes').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {upcomingEvents.filter(e => e.user_status === 'yes').length === 1 ? 'Confirmação' : 'Confirmações'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Payment Notifications */}
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
