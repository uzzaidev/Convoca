import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ChevronLeft } from "lucide-react";
import { PaymentsContent } from "@/components/payments/payments-content";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

export default async function PaymentsPage({ params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { groupId } = await params;

  // Buscar informações do grupo e membership
  const groupResult = await sql`
    SELECT
      g.id,
      g.name,
      g.description,
      gm.role as user_role
    FROM groups g
    INNER JOIN group_members gm ON g.id = gm.group_id
    WHERE g.id = ${groupId} AND gm.user_id = ${user.id}
  `;

  if (!groupResult || groupResult.length === 0) {
    redirect("/dashboard");
  }

  const group = groupResult[0] as {
    id: string;
    name: string;
    description: string | null;
    user_role: "admin" | "member";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50/30 dark:from-green-950/20 dark:via-background dark:to-green-950/10">
      <DashboardHeader userName={user.name || user.email} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Botão voltar */}
        <div className="mb-6">
          <Link href={`/groups/${groupId}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar para o grupo
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Pagamentos</h1>
              <p className="text-muted-foreground mt-2">{group.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={group.user_role === "admin" ? "default" : "secondary"}
                className="w-fit"
              >
                {group.user_role === "admin" ? "Admin" : "Membro"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Conteúdo de pagamentos */}
        <PaymentsContent
          groupId={groupId}
          isAdmin={group.user_role === "admin"}
        />
      </div>
    </div>
  );
}
