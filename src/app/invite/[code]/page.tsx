import { sql } from "@/db/client";
import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { InviteTracker } from "./invite-tracker";

const IOS_URL = "https://apps.apple.com/app/id6783026571";
const ANDROID_URL = "https://play.google.com/store/apps/details?id=com.uzzai.convoca";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const [row] = await sql`
    SELECT g.name
    FROM invites i
    JOIN groups g ON g.id = i.group_id
    WHERE i.code = ${code} AND g.deleted_at IS NULL
    LIMIT 1
  `;
  const groupName = row?.name ?? "grupo no Convoca";
  return {
    title: `Convite para ${groupName} — Convoca`,
    description: `Você foi convidado para jogar no grupo "${groupName}". Baixe o Convoca e entre agora.`,
  };
}

export default async function InvitePage({ params }: Props) {
  const { code } = await params;

  const user = await getCurrentUser();
  if (user) {
    redirect(`/groups/join?code=${code}`);
  }

  const [row] = await sql`
    SELECT
      g.name,
      COUNT(gm.user_id)::int AS member_count
    FROM invites i
    JOIN groups g ON g.id = i.group_id
    LEFT JOIN group_members gm ON gm.group_id = g.id
    WHERE i.code = ${code}
      AND g.deleted_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > NOW())
      AND (i.max_uses IS NULL OR i.used_count < i.max_uses)
    GROUP BY g.name
    LIMIT 1
  `;

  if (!row) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl font-display text-3xl mb-6"
          style={{ background: "hsl(var(--navy))", color: "hsl(var(--pitch-glow))" }}
        >
          C
        </div>
        <h1 className="font-display text-3xl tracking-display mb-2">CONVITE INVÁLIDO</h1>
        <p className="text-muted-foreground mb-8 max-w-xs">
          Este link de convite é inválido, expirou ou atingiu o limite de usos.
        </p>
        <Link
          href="/"
          className="text-sm font-semibold text-pitch hover:underline"
        >
          ← Ir para o início
        </Link>
      </div>
    );
  }

  const memberLabel = row.member_count === 1 ? "1 jogador" : `${row.member_count} jogadores`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Logo */}
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl font-display text-3xl mb-6"
          style={{ background: "hsl(var(--navy))", color: "hsl(var(--pitch-glow))" }}
        >
          C
        </div>

        <InviteTracker codeLength={code.length} />

        {/* Eyebrow */}
        <span className="inline-flex items-center rounded-full bg-pitch-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-eyebrow text-pitch mb-4">
          Você foi convidado
        </span>

        {/* Group name */}
        <h1 className="font-display text-4xl tracking-display leading-tight mb-1">
          {row.name}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">{memberLabel} no grupo</p>

        {/* App download buttons */}
        <div className="w-full flex flex-col gap-3 mb-6">
          <a
            href={IOS_URL}
            className="flex items-center justify-center gap-3 w-full rounded-xl border border-border bg-foreground text-background py-3.5 px-5 font-semibold text-sm transition-opacity hover:opacity-80"
          >
            <AppleIcon />
            Baixar para iPhone
          </a>
          <a
            href={ANDROID_URL}
            className="flex items-center justify-center gap-3 w-full rounded-xl border border-border bg-foreground text-background py-3.5 px-5 font-semibold text-sm transition-opacity hover:opacity-80"
          >
            <AndroidIcon />
            Baixar para Android
          </a>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Web fallback */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent(`/groups/join?code=${code}`)}`}
            className="text-sm font-semibold text-pitch hover:underline"
          >
            Já tenho conta → Entrar
          </Link>
          <Link
            href={`/auth/signup?callbackUrl=${encodeURIComponent(`/groups/join?code=${code}`)}`}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Não tenho conta → Criar conta grátis
          </Link>
        </div>
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.523 15.341 14.63 10.8l2.893-4.556A.5.5 0 0 0 17.1 5.5H6.9a.5.5 0 0 0-.423.744L9.37 10.8l-2.893 4.541A.5.5 0 0 0 6.9 16.1h1.6v3.4a.5.5 0 0 0 1 0V16.1h1v3.4a.5.5 0 0 0 1 0V16.1h1.6v3.4a.5.5 0 0 0 1 0V16.1h1.6v3.4a.5.5 0 0 0 1 0V16.1h.323a.5.5 0 0 0 .4-.759zM5 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm14 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
    </svg>
  );
}
