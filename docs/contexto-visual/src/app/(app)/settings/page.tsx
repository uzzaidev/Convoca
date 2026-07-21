import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { NotificationSettings } from "@/components/settings/notification-settings";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-2xl font-bold mb-6">Configurações</h1>
        <NotificationSettings />
      </div>
    </div>
  );
}
