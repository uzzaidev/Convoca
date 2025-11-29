import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { GroupSettingsTabs } from "@/components/groups/group-settings-tabs";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupSettingsPage({ params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { groupId } = await params;

  // Check if user is admin of the group
  const groupResult = await sql`
    SELECT
      g.id,
      g.name,
      g.description,
      g.privacy,
      gm.role as user_role
    FROM groups g
    INNER JOIN group_members gm ON g.id = gm.group_id
    WHERE g.id = ${groupId} AND gm.user_id = ${user.id}
  `;

  if (groupResult.length === 0) {
    redirect("/dashboard");
  }

  const group = groupResult[0] as {
    id: string;
    name: string;
    description: string | null;
    privacy: string;
    user_role: string;
  };

  if (group.user_role !== "admin") {
    redirect(`/groups/${groupId}`);
  }

  // Fetch invites
  const invites = await sql`
    SELECT
      i.id,
      i.code,
      i.expires_at,
      i.max_uses,
      i.used_count,
      i.created_at,
      u.name as created_by_name
    FROM invites i
    LEFT JOIN users u ON i.created_by = u.id
    WHERE i.group_id = ${groupId}
    ORDER BY i.created_at DESC
  ` as unknown as Array<{
    id: string;
    code: string;
    expires_at: string | null;
    max_uses: number | null;
    used_count: number;
    created_at: string;
    created_by_name: string | null;
  }>;

  // Fetch members
  const members = await sql`
    SELECT
      gm.id,
      gm.user_id,
      gm.role,
      gm.joined_at,
      u.name,
      u.email
    FROM group_members gm
    INNER JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = ${groupId}
    ORDER BY 
      CASE WHEN gm.role = 'admin' THEN 0 ELSE 1 END,
      gm.joined_at ASC
  ` as unknown as Array<{
    id: string;
    user_id: string;
    role: string;
    joined_at: string;
    name: string;
    email: string;
  }>;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userName={user.name || user.email} />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <h1 className="text-4xl font-bold mb-2">Configurações do Grupo</h1>
          <p className="text-gray-200 text-lg">{group.name}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <GroupSettingsTabs
          group={group}
          invites={invites}
          members={members}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
