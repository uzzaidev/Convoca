import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ChevronLeft } from "lucide-react";
import { PaymentsContent } from "@/components/payments/payments-content";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

export default async function PaymentsPage({ params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { groupId } = await params;

  try {
    const group = await requireGroupAccess(groupId, user);

    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader userName={user.name || user.email} systemRole={user.systemRole} />

        <div className="bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
          <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="mb-4">
              <Link href={`/groups/${groupId}`}>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Voltar para o grupo
                </Button>
              </Link>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h1 className="mb-2 text-4xl font-bold">Pagamentos</h1>
                <p className="text-lg text-gray-200">{group.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <GroupStatusBadge status={group.status} className="border-white/20 bg-white/10 text-white" />
                <Badge
                  variant={group.userRole === "admin" ? "default" : "secondary"}
                  className="border-white/30 bg-white/20 text-white"
                >
                  {group.userRole === "admin" ? "Admin" : "Membro"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-8">
          <PaymentsContent groupId={groupId} isAdmin={group.isSystemAdmin || group.userRole === "admin"} />
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
