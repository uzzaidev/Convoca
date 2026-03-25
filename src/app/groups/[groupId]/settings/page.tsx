import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { GroupSettingsTabs } from "@/components/groups/group-settings-tabs";
import { requireGroupAccess, GroupAccessError } from "@/lib/group-access";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupSettingsPage({ params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { groupId } = await params;

  try {
    const group = await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem acessar as configuracoes",
    });

    const invites = (await sql`
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
    `) as unknown as Array<{
      id: string;
      code: string;
      expires_at: string | null;
      max_uses: number | null;
      used_count: number;
      created_at: string;
      created_by_name: string | null;
    }>;

    const members = (await sql`
      SELECT
        gm.id,
        gm.user_id,
        gm.role,
        gm.is_mensalista,
        gm.monthly_amount_cents,
        gm.joined_at,
        u.name,
        u.email
      FROM group_members gm
      INNER JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ${groupId}
      ORDER BY
        CASE WHEN gm.role = 'admin' THEN 0 ELSE 1 END,
        gm.joined_at ASC
    `) as unknown as Array<{
      id: string;
      user_id: string;
      role: string;
      is_mensalista: boolean;
      monthly_amount_cents: number;
      joined_at: string;
      name: string;
      email: string;
    }>;

    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader userName={user.name || user.email} systemRole={user.systemRole} />

        <div className="bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
          <div className="container mx-auto max-w-6xl px-4 py-12">
            <h1 className="mb-2 text-4xl font-bold">Configuracoes do Grupo</h1>
            <p className="text-lg text-gray-200">{group.name}</p>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-8">
          <GroupSettingsTabs
            group={{
              id: group.id,
              name: group.name,
              description: group.description,
              privacy: group.privacy,
            }}
            invites={invites}
            members={members}
            currentUserId={user.id}
          />
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
