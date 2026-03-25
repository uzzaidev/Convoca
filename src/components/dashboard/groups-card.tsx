"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
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

export function GroupsCard({ groups }: GroupsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Grupos</CardTitle>
        <CardDescription>{groups.length} grupo{groups.length !== 1 ? "s" : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="mb-4">Voce ainda nao faz parte de nenhum grupo.</p>
            <Button asChild variant="outline">
              <Link href="/groups/new">Criar seu primeiro grupo</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="block rounded-lg border p-4 transition-all hover:bg-accent hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 text-base font-semibold">{group.name}</h3>
                    {group.description && (
                      <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{group.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {group.member_count} membro{group.member_count !== 1 ? "s" : ""}
                      </span>
                      <GroupStatusBadge status={group.status} />
                    </div>
                  </div>
                  <Badge variant={group.role === "admin" ? "default" : "secondary"} className="flex-shrink-0">
                    {group.role === "admin" ? "Admin" : "Membro"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
