"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, Users, Check, X, Clock } from "lucide-react";

type Event = {
  id: string;
  starts_at: string;
  status: string;
  group_name: string;
  group_id: string;
  venue_name: string | null;
  confirmed_count: number;
  max_players: number;
  user_status: string | null;
};

type UpcomingEventsCardProps = {
  events: Event[];
};

export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximas Peladas</CardTitle>
        <CardDescription>
          {events.length} evento{events.length !== 1 ? "s" : ""} agendado
          {events.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma pelada agendada no momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event: Event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block p-4 border rounded-lg hover:bg-accent hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1 flex items-center gap-2 flex-wrap">
                        <span className="truncate">{event.group_name}</span>
                        {event.user_status && (
                          <Badge
                            variant={
                              event.user_status === "yes"
                                ? "default"
                                : event.user_status === "waitlist"
                                ? "secondary"
                                : "outline"
                            }
                            className="flex-shrink-0 flex items-center gap-1"
                          >
                            {event.user_status === "yes" ? (
                              <>
                                <Check className="h-3 w-3" />
                                Confirmado
                              </>
                            ) : event.user_status === "waitlist" ? (
                              <>
                                <Clock className="h-3 w-3" />
                                Lista de espera
                              </>
                            ) : (
                              <>
                                <X className="h-3 w-3" />
                                Recusado
                              </>
                            )}
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(event.starts_at)}
                      </p>
                      {event.venue_name && (
                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.venue_name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.confirmed_count}/{event.max_players} confirmados
                        </span>
                        <div className="flex-1 max-w-[100px]">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                event.confirmed_count >= event.max_players
                                  ? "bg-green-500"
                                  : event.confirmed_count >= event.max_players * 0.7
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                              }`}
                              style={{
                                width: `${Math.min(
                                  (event.confirmed_count / event.max_players) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
