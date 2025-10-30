import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { JoinGroupForm } from "@/components/groups/join-group-form";

export default async function JoinGroupPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={user.name || user.email} />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Entrar em um Grupo</h1>
          <p className="text-muted-foreground mt-2">
            Use um código de convite para entrar em um grupo existente
          </p>
        </div>
        <JoinGroupForm />
      </div>
    </div>
  );
}
