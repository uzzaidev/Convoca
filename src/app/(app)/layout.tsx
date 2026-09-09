import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import type { SidebarGroup, SidebarUser } from "@/components/layout/AppSidebar";
import { StripePaymentNotice } from "@/components/billing/stripe-payment-notice";

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

  // Verificar se o usuario eh admin de algum grupo sem assinatura ativa (para o banner)
  const [stripeNoticeData] = await sql`
    SELECT
      u.stripe_notice_dismissed_at,
      EXISTS (
        SELECT 1
        FROM group_members gm2
        INNER JOIN groups g2 ON g2.id = gm2.group_id
        WHERE gm2.user_id = ${user.id}
          AND gm2.role = 'admin'
          AND g2.deleted_at IS NULL
          AND g2.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM group_subscriptions gs
            WHERE gs.group_id = g2.id
              AND (
                gs.status IN ('active', 'trialing')
                OR (gs.grace_until IS NOT NULL AND gs.grace_until > NOW())
              )
          )
      ) AS has_group_without_subscription
    FROM users u
    WHERE u.id = ${user.id}
  `;

  const hasGroupWithoutSubscription = stripeNoticeData?.has_group_without_subscription === true;
  const noticeDismissedAt = stripeNoticeData?.stripe_notice_dismissed_at as string | null;

  return (
    <AppLayout user={sidebarUser} groups={groups}>
      {hasGroupWithoutSubscription && (
        <StripePaymentNotice
          hasGroupWithoutSubscription={hasGroupWithoutSubscription}
          noticeDismissedAt={noticeDismissedAt ? String(noticeDismissedAt) : null}
        />
      )}
      {children}
    </AppLayout>
  );
}
