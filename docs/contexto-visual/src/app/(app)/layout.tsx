import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import type { SidebarGroup, SidebarUser } from "@/components/layout/AppSidebar";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const groupsRaw = await sql<
    {
      id: string;
      name: string;
      role: string;
      app_mode: string;
    }[]
  >`
    SELECT
      g.id,
      g.name,
      gm.role,
      COALESCE(g.app_mode, 'ranking') AS app_mode
    FROM group_members gm
    INNER JOIN groups g ON g.id = gm.group_id
    WHERE gm.user_id = ${user.id}
      AND g.deleted_at IS NULL
    ORDER BY g.name ASC
  `;

  const groups: SidebarGroup[] = groupsRaw.map((g) => ({
    id: g.id,
    name: g.name,
    role: g.role as "admin" | "member",
    app_mode: (g.app_mode ?? "ranking") as "ranking" | "control",
  }));

  const sidebarUser: SidebarUser = {
    id: user.id,
    name: user.name || user.email || "Usuário",
    email: user.email || "",
    systemRole: user.systemRole ?? "user",
  };

  return (
    <AppLayout user={sidebarUser} groups={groups}>
      {children}
    </AppLayout>
  );
}
