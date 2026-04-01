import { redirect } from "next/navigation";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { type GroupStatus, type SystemRole } from "@/lib/group-status";

type GroupMemberAudit = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UserGroupAudit = {
  id: string;
  name: string;
  status: GroupStatus;
  role: string;
};

export default async function AdminPage() {
  try {
    const user = await requireSystemAdmin();

    const [stats] = await sql`
      SELECT
        COUNT(*)::int as total_groups,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending_groups,
        COUNT(*) FILTER (WHERE status = 'active')::int as active_groups,
        COUNT(*) FILTER (WHERE status = 'inactive')::int as inactive_groups,
        COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected_groups
      FROM groups
      WHERE deleted_at IS NULL
    `;

    const [userCount] = await sql`
      SELECT COUNT(*)::int as total_users
      FROM users
    `;

    const groupsRaw = await sql`
      SELECT
        g.id,
        g.name,
        g.status,
        g.status_reason,
        g.created_at,
        creator.name as creator_name,
        creator.email as creator_email,
        COUNT(member_user.id)::int as member_count,
        EXISTS(
          SELECT 1 FROM group_subscriptions gs
          WHERE gs.group_id = g.id AND gs.status IN ('active', 'trialing')
        ) as has_subscription,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', member_user.id,
              'name', member_user.name,
              'email', member_user.email,
              'role', gm.role
            )
          ) FILTER (WHERE member_user.id IS NOT NULL),
          '[]'::json
        ) as members
      FROM groups g
      LEFT JOIN users creator ON creator.id = g.created_by
      LEFT JOIN group_members gm ON gm.group_id = g.id
      LEFT JOIN users member_user ON member_user.id = gm.user_id
      WHERE g.deleted_at IS NULL
      GROUP BY g.id, creator.name, creator.email
      ORDER BY
        CASE g.status
          WHEN 'pending' THEN 0
          WHEN 'inactive' THEN 1
          WHEN 'rejected' THEN 2
          ELSE 3
        END,
        g.created_at DESC
    `;

    const usersRaw = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.created_at,
        u.system_role,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', g.id,
              'name', g.name,
              'status', g.status,
              'role', gm.role
            )
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'::json
        ) as groups
      FROM users u
      LEFT JOIN group_members gm ON gm.user_id = u.id
      LEFT JOIN groups g ON g.id = gm.group_id AND g.deleted_at IS NULL
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;

    const groups = (groupsRaw as Array<Record<string, unknown>>).map((group) => ({
      id: group.id as string,
      name: group.name as string,
      status: group.status as GroupStatus,
      statusReason: group.status_reason as string | null,
      createdAt: group.created_at as string,
      creatorName: group.creator_name as string | null,
      creatorEmail: group.creator_email as string | null,
      memberCount: group.member_count as number,
      hasSubscription: group.has_subscription as boolean,
      members: (group.members as GroupMemberAudit[]) || [],
    }));

    const users = (usersRaw as Array<Record<string, unknown>>).map((account) => ({
      id: account.id as string,
      name: account.name as string,
      email: account.email as string,
      createdAt: account.created_at as string,
      systemRole: (account.system_role as SystemRole | null) ?? "user",
      groups: (account.groups as UserGroupAudit[]) || [],
    }));

    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader userName={user.name || user.email} systemRole={user.systemRole} />

        <div className="bg-gradient-to-br from-red-700 via-red-800 to-slate-900 text-white">
          <div className="container mx-auto max-w-7xl px-4 py-12">
            <h1 className="mb-2 text-4xl font-bold">Administracao Global</h1>
            <p className="text-lg text-red-100">Controle de grupos, contas criadas e aprovacao operacional.</p>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-8">
          <AdminDashboard
            stats={{
              totalGroups: stats.total_groups,
              pendingGroups: stats.pending_groups,
              activeGroups: stats.active_groups,
              inactiveGroups: stats.inactive_groups,
              rejectedGroups: stats.rejected_groups,
              totalUsers: userCount.total_users,
            }}
            groups={groups}
            users={users}
          />
        </div>
      </div>
    );
  } catch {
    redirect("/dashboard");
  }
}
