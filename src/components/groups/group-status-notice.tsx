import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getGroupBlockedMessage, getGroupStatusLabel, type GroupStatus } from "@/lib/group-status";

export function GroupStatusNotice({
  status,
  reason,
}: {
  status: GroupStatus;
  reason?: string | null;
}) {
  const message = getGroupBlockedMessage(status, reason);

  if (!message || status === "active") {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTitle>Status do grupo: {getGroupStatusLabel(status)}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
