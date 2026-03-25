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
      <DashboardHeader userName={user.name || "Usuario"} systemRole={user.systemRole} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-navy">Meu Perfil</h1>
        <ProfileForm initialName={user.name || ""} email={user.email || ""} />
      </main>
    </div>
  );
}
