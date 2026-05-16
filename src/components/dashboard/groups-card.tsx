"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, ChevronRight } from "lucide-react";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { type GroupStatus } from "@/lib/group-status";

type Group = {
  id: string;
  name: string;
  description: string | null;
  role: string;
  member_count: number;
  status: GroupStatus;
};

type GroupsCardProps = {
  groups: Group[];
};

const AVATAR_COLORS = [
  "hsl(var(--pitch))",
  "hsl(var(--navy))",
  "hsl(var(--gold))",
  "hsl(var(--pitch-deep))",
  "hsl(var(--coral))",
];

function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function GroupsCard({ groups }: GroupsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="font-display text-2xl tracking-display">SEUS GRUPOS</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/groups/new" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Novo
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="mb-4">Você ainda não faz parte de nenhum grupo.</p>
            <Button asChild variant="outline">
              <Link href="/groups/new">Criar seu primeiro grupo</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {groups.map((group, i) => {
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const isGold = color === "hsl(var(--gold))";
              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-sm px-2 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-secondary/60"
                >
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md font-display text-xl tracking-wide"
                    style={{
                      background: color,
                      color: isGold ? "hsl(var(--accent-foreground))" : "hsl(var(--primary-foreground))",
                      boxShadow: "inset 0 -3px 0 rgba(0,0,0,.15)",
                    }}
                  >
                    {initialsFor(group.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{group.name}</h3>
                      {group.role === "admin" && (
                        <Badge variant="secondary" className="h-5 text-[10px]">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {group.member_count} membro{Number(group.member_count) !== 1 ? "s" : ""}
                      </span>
                      <GroupStatusBadge status={group.status} />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
