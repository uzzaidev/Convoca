import { getEventWithAttendees } from "@/lib/events";
import { EventPageClient } from "./client";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ eventId: string }> };

export default async function EventPage({ params }: Props) {
  const { eventId } = await params;
  const event = await getEventWithAttendees(eventId);

  if (!event) {
    notFound();
  }

  return <EventPageClient event={event} />;
}
