import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import { getGroupAccessContext } from "@/lib/group-access";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ChampionshipsClient, type ChampionshipSummary } from "@/components/championships/championships-client";

type RouteParams = { params: Promise<{ groupId: string }> };

export default async function ChampionshipsPage({ params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const { groupId } = await params;
  const group = await getGroupAccessContext(groupId, user);
  if (!group || (!group.userRole && !group.isSystemAdmin)) redirect("/dashboard");

  const rows = await sql`
    SELECT
      c.id,
      c.name,
      c.description,
      c.status,
      c.format,
      c.team_formation,
      c.starts_at,
      c.ends_at,
      c.match_duration_minutes,
      c.match_win_goal_diff,
      c.created_at,
      COUNT(DISTINCT ct.id) FILTER (WHERE ct.is_bye = FALSE)::int AS team_count,
      COUNT(DISTINCT cm.id)::int AS match_count,
      COUNT(DISTINCT cm.id) FILTER (WHERE cm.status = 'finished')::int AS finished_matches
    FROM championships c
    LEFT JOIN championship_teams ct ON ct.championship_id = c.id
    LEFT JOIN championship_phases cp ON cp.championship_id = c.id
    LEFT JOIN championship_rounds cr ON cr.phase_id = cp.id
    LEFT JOIN championship_matches cm ON cm.round_id = cr.id
    WHERE c.group_id = ${groupId}
    GROUP BY c.id
    ORDER BY
      CASE c.status WHEN 'active' THEN 0 WHEN 'draft' THEN 1 WHEN 'finished' THEN 2 ELSE 3 END,
      c.created_at DESC
  `;

  const isAdmin = group.userRole === "admin" || !!group.isSystemAdmin;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {group.name}
          </Link>
        </div>

        <ChampionshipsClient
          groupId={groupId}
          championships={rows as unknown as ChampionshipSummary[]}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
