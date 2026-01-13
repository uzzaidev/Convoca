"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CheckCircle2, UserCog } from "lucide-react";
import { EventRsvpForm } from "./event-rsvp-form";
import { AdminPlayerManager } from "./admin-player-manager";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Player = {
  id: string;
  name: string;
  image: string | null;
  role: string;
  preferred_position: string | null;
  secondary_position: string | null;
  created_at: string;
  removed_by_self_at: string | null;
};

type WaitlistPlayer = {
  id: string;
  name: string;
  image: string | null;
  role: string;
  created_at: string;
};

type UserAttendance = {
  status: string;
  preferred_position: string | null;
  secondary_position: string | null;
} | null;

type GroupMember = {
  user_id: string;
  user_name: string;
  user_image: string | null;
  is_confirmed: boolean;
};

type ConfirmationTabProps = {
  eventId: string;
  groupId: string;
  isAdmin: boolean;
  confirmedPlayers: Player[];
  waitlistPlayers: WaitlistPlayer[];
  hasTeams: boolean;
  maxPlayers: number;
  eventStatus: string;
  userAttendance: UserAttendance;
  groupMembers: GroupMember[];
};

export function ConfirmationTab({
  eventId,
  groupId,
  isAdmin,
  confirmedPlayers,
  waitlistPlayers,
  hasTeams,
  maxPlayers,
  eventStatus,
  userAttendance,
  groupMembers,
}: ConfirmationTabProps) {
  // Transform groupMembers to match AdminPlayerManager expected format
  const transformedGroupMembers = groupMembers.map(member => ({
    userId: member.user_id,
    userName: member.user_name,
    userImage: member.user_image,
    isConfirmed: member.is_confirmed,
  }));

  return (
    <div className="space-y-6">
      {/* RSVP Form - shown for all users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Confirmar Presença
          </CardTitle>
          <CardDescription>
            Informe se você irá participar do evento e selecione suas posições
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventRsvpForm
            eventId={eventId}
            currentAttendance={userAttendance}
            eventStatus={eventStatus}
          />
        </CardContent>
      </Card>

      {/* Admin Player Manager - shown only for admins when event is scheduled */}
      {isAdmin && eventStatus === "scheduled" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-blue-500" />
              Gerenciar Jogadores
            </CardTitle>
            <CardDescription>
              Como administrador, você pode confirmar ou desconfirmar jogadores manualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminPlayerManager
              eventId={eventId}
              groupMembers={transformedGroupMembers}
            />
          </CardContent>
        </Card>
      )}
      {/* Jogadores Confirmados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Jogadores Confirmados ({confirmedPlayers.length}/{maxPlayers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {confirmedPlayers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-600 font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{player.name}</p>
                  {player.role === "gk" ? (
                    <Badge variant="outline" className="text-xs">
                      Goleiro
                    </Badge>
                  ) : player.preferred_position && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {player.preferred_position === "defender" ? "Zagueiro" :
                       player.preferred_position === "midfielder" ? "Meio-campo" : "Atacante"}
                      {player.secondary_position && ` / ${
                        player.secondary_position === "defender" ? "Zagueiro" :
                        player.secondary_position === "midfielder" ? "Meio-campo" : "Atacante"
                      }`}
                    </p>
                  )}
                  {isAdmin && player.removed_by_self_at && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      Saiu em {format(new Date(player.removed_by_self_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Espera */}
      {waitlistPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Lista de Espera ({waitlistPlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {waitlistPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <p className="font-medium">{player.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
