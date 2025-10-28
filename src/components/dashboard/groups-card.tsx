"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

type Group = {
  id: string;
  name: string;
  description: string | null;
  role: string;
  member_count: number;
};

type GroupsCardProps = {
  groups: Group[];
};

export function GroupsCard({ groups }: GroupsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Grupos</CardTitle>
        <CardDescription>
          {groups.length} grupo{groups.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">Você ainda não faz parte de nenhum grupo.</p>
            <Button asChild variant="outline">
              <Link href="/groups/new">Criar seu primeiro grupo</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group: Group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="block p-4 border rounded-lg hover:bg-accent hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {group.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {group.member_count} membro{group.member_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={group.role === "admin" ? "default" : "secondary"}
                    className="flex-shrink-0"
                  >
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
