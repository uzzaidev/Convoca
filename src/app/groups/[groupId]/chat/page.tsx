import { requireAuth } from "@/lib/auth-helpers";
import { requireGroupAccess } from "@/lib/group-access";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ChatInterface } from "@/components/agent/ChatInterface";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

export default async function ChatPage({ params }: RouteParams) {
  const { groupId } = await params;

  const user = await requireAuth().catch(() => null);
  if (!user) redirect("/auth/signin");

  const ctx = await requireGroupAccess(groupId, user).catch(() => null);
  if (!ctx) redirect("/dashboard");

  const role = ctx.userRole === "admin" ? "admin" : "member";

  return (
    <div className="flex flex-col h-screen">
      <DashboardHeader userName={user.name} systemRole={user.systemRole} />
      <main className="flex-1 min-h-0 flex flex-col max-w-3xl w-full mx-auto px-4 pb-4">
        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-background mt-4">
          <ChatInterface groupId={groupId} role={role} />
        </div>
      </main>
    </div>
  );
}
