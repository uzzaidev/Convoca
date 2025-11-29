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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userName={user.name || user.email} />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <h1 className="text-4xl font-bold mb-2">Entrar em um Grupo</h1>
          <p className="text-gray-200 text-lg">
            Use um código de convite para entrar em um grupo existente
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <JoinGroupForm />
      </div>
    </div>
  );
}
