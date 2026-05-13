"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Users, ArrowRight, XCircle } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UpcomingEvent = {
  id: string;
  starts_at: string;
  venue_name: string | null;
  status: string;
  confirmed_count: number;
  max_players: number;
};

type UpcomingEventsCardProps = {
  events: UpcomingEvent[];
  groupId?: string;
  userRole?: string;
};

export function UpcomingEventsCard({ events, groupId, userRole }: UpcomingEventsCardProps) {
  const router = useRouter();
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const isAdmin = userRole === "admin";

  async function handleCancelEvent(eventId: string) {
    setCancelingId(eventId);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao cancelar evento");
      }

      // Refresh the page to show updated list
      router.refresh();
    } catch (error) {
      console.error("Error canceling event:", error);
      alert("Erro ao cancelar evento. Tente novamente.");
    } finally {
      setCancelingId(null);
    }
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-500" />
            Próximas Partidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma partida agendada
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-500" />
          Próximas Partidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <Link href={`/events/${event.id}`} className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span className="truncate">{formatDate(event.starts_at)}</span>
                    </div>
                    <Badge
                      variant={event.status === "live" ? "destructive" : "secondary"}
                      className="shrink-0 sm:hidden"
                    >
                      {event.status === "live" ? "Ao vivo" : "Agendado"}
                    </Badge>
                  </div>
                  {event.venue_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{event.venue_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">
                      <span className="font-medium">{event.confirmed_count}</span>
                      <span className="text-muted-foreground">/{event.max_players} confirmados</span>
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <Badge
                    variant={event.status === "live" ? "destructive" : "secondary"}
                    className="hidden sm:inline-flex"
                  >
                    {event.status === "live" ? "Ao vivo" : "Agendado"}
                  </Badge>
                  <div className="flex gap-2 flex-1 sm:flex-none">
                    <Button asChild variant="ghost" size="sm" className="gap-1 flex-1 sm:flex-none">
                      <Link href={`/events/${event.id}`}>
                        Ver detalhes
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                            disabled={cancelingId === event.id}
                          >
                            <XCircle className="h-4 w-4" />
                            Cancelar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar Partida</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja cancelar esta partida? Esta ação não pode ser desfeita.
                              Todos os jogadores confirmados serão notificados (se houver sistema de notificações).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelEvent(event.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Sim, cancelar partida
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
