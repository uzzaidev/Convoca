"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { Check, Hourglass } from "lucide-react";

interface Attendee {
  userId: string | number;
  role: "gk" | "line";
  status: "yes" | "no" | "waitlist";
  userName?: string;
}

interface AttendeeListProps {
  attendees: Attendee[];
}

export function AttendeeList({ attendees }: AttendeeListProps) {
  const confirmed = attendees.filter((a) => a.status === "yes");
  const waitlist = attendees.filter((a) => a.status === "waitlist");
  const declined = attendees.filter((a) => a.status === "no");

  const goalkeepers = confirmed.filter((a) => a.role === "gk");
  const linePlayers = confirmed.filter((a) => a.role === "line");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Presença</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confirmados */}
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            Confirmados ({confirmed.length})
            <Badge variant="default" className="ml-auto flex items-center gap-1">
              <Check className="h-3 w-3" />
            </Badge>
          </h3>
          {goalkeepers.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-1">Goleiros</p>
              <div className="space-y-2 mb-3">
                {goalkeepers.map((att) => (
                  <AttendeeRow key={att.userId} attendee={att} />
                ))}
              </div>
            </>
          )}
          {linePlayers.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-1">Linha</p>
              <div className="space-y-2">
                {linePlayers.map((att) => (
                  <AttendeeRow key={att.userId} attendee={att} />
                ))}
              </div>
            </>
          )}
          {confirmed.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum confirmado ainda.</p>
          )}
        </div>

        {waitlist.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                Fila de espera ({waitlist.length})
                <Badge variant="secondary" className="ml-auto flex items-center gap-1">
                  <Hourglass className="h-3 w-3" />
                </Badge>
              </h3>
              <div className="space-y-2">
                {waitlist.map((att) => (
                  <AttendeeRow key={att.userId} attendee={att} />
                ))}
              </div>
            </div>
          </>
        )}

        {declined.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">
                Não confirmados ({declined.length})
              </h3>
              <div className="space-y-1">
                {declined.map((att) => (
                  <AttendeeRow key={att.userId} attendee={att} dimmed />
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AttendeeRow({ attendee, dimmed }: { attendee: Attendee; dimmed?: boolean }) {
  const idStr = String(attendee.userId);
  const initials = attendee.userName
    ? attendee.userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : idStr.slice(0, 2).toUpperCase();

  return (
    <div className={`flex items-center gap-2 ${dimmed ? "opacity-50" : ""}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="text-sm flex-1">
        {attendee.userName || `Usuário ${idStr.slice(0, 8)}`}
      </span>
      {attendee.role === "gk" && !dimmed && (
        <Badge variant="outline" className="text-xs">
          GK
        </Badge>
      )}
    </div>
  );
}
