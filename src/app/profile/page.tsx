import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userName={user.name || "Usuário"} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-navy mb-6">Meu Perfil</h1>
        <ProfileForm
          initialName={user.name || ""}
          email={user.email || ""}
        />
      </main>
    </div>
  );
}
