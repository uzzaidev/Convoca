"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RSVPCard } from "@/components/rsvp-card";
import { AttendeeList } from "@/components/attendee-list";
import { Badge } from "@/components/ui/badge";
import type { EventWithAttendance } from "@/lib/events";

interface EventPageClientProps {
  event: EventWithAttendance;
}

export function EventPageClient({ event }: EventPageClientProps) {
  const [attendees, setAttendees] = useState(event.attendees);
  
  // Mock user ID - na produção viria da sessão
  const currentUserId = 1;
  const currentAttendee = attendees.find((a) => a.userId === currentUserId);

  const confirmedCount = attendees.filter((a) => a.status === "yes").length;
  const waitlistCount = attendees.filter((a) => a.status === "waitlist").length;

  const handleRSVP = async (status: "yes" | "no", role: "gk" | "line") => {
    const res = await fetch(`/api/events/${event.id}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, role, userId: currentUserId }),
    });

    if (res.ok) {
      // Atualizar lista localmente
      setAttendees((prev) => {
        const filtered = prev.filter((a) => a.userId !== currentUserId);
        // Determinar status real (pode ser waitlist se estiver cheio)
        const actualStatus = status === "no" ? "no" : (confirmedCount >= event.maxPlayers && !currentAttendee ? "waitlist" : "yes");
        return [...filtered, { userId: currentUserId, status: actualStatus as "yes" | "no" | "waitlist", role }];
      });
    }
  };

  const eventDate = new Date(event.startsAt).toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <main className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pelada</h1>
        <p className="text-muted-foreground">{eventDate}</p>
        <div className="flex gap-2 mt-2">
          <Badge variant={event.status === "scheduled" ? "default" : "secondary"}>
            {event.status === "scheduled" ? "Agendado" : event.status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pre-jogo" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pre-jogo">Pré-jogo</TabsTrigger>
          <TabsTrigger value="ao-vivo">Ao vivo</TabsTrigger>
          <TabsTrigger value="pos-jogo">Pós-jogo</TabsTrigger>
        </TabsList>

        <TabsContent value="pre-jogo" className="space-y-4">
          <RSVPCard
            eventId={event.id}
            userId={currentUserId}
            currentStatus={currentAttendee?.status}
            currentRole={currentAttendee?.role}
            confirmedCount={confirmedCount}
            maxPlayers={event.maxPlayers}
            waitlistCount={waitlistCount}
            onRSVP={handleRSVP}
          />
          <AttendeeList attendees={attendees} />
        </TabsContent>

        <TabsContent value="ao-vivo" className="space-y-4">
          <p className="text-center text-muted-foreground py-8">
            Placar e eventos ao vivo aparecerão aqui durante o jogo.
          </p>
        </TabsContent>

        <TabsContent value="pos-jogo" className="space-y-4">
          <p className="text-center text-muted-foreground py-8">
            Notas e destaques do jogo aparecerão aqui após o término.
          </p>
        </TabsContent>
      </Tabs>
    </main>
  );
}
