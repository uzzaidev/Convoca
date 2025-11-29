import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EventForm } from "@/components/events/event-form";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

export default async function NewEventPage({ params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { groupId } = await params;

  // Check if user is admin of the group
  const groupResult = await sql`
    SELECT
      g.id,
      g.name,
      gm.role as user_role
    FROM groups g
    INNER JOIN group_members gm ON g.id = gm.group_id
    WHERE g.id = ${groupId} AND gm.user_id = ${user.id}
  `;

  if (groupResult.length === 0) {
    redirect("/dashboard");
  }

  const group = groupResult[0] as {
    id: string;
    name: string;
    user_role: string;
  };

  if (group.user_role !== "admin") {
    redirect(`/groups/${groupId}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userName={user.name || user.email} />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <h1 className="text-4xl font-bold mb-2">Criar Novo Evento</h1>
          <p className="text-gray-200 text-lg">{group.name}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <EventForm groupId={groupId} mode="create" />
      </div>
    </div>
  );
}
