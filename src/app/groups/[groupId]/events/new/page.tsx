import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EventForm } from "@/components/events/event-form";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

export default async function NewEventPage({ params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { groupId } = await params;

  try {
    const group = await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem criar eventos",
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader userName={user.name || user.email} systemRole={user.systemRole} />

        <div className="bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
          <div className="container mx-auto max-w-2xl px-4 py-12">
            <h1 className="mb-2 text-4xl font-bold">Criar Novo Evento</h1>
            <p className="text-lg text-gray-200">{group.name}</p>
          </div>
        </div>

        <div className="container mx-auto max-w-2xl px-4 py-8">
          <EventForm groupId={groupId} mode="create" />
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof GroupAccessError) {
      redirect(`/groups/${groupId}`);
    }

    throw error;
  }
}
