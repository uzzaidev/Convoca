import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getGroupStatusLabel, type GroupStatus } from "@/lib/group-status";

const statusClassNames: Record<GroupStatus, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  pending_payment: "bg-yellow-100 text-yellow-800 border-yellow-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export function GroupStatusBadge({
  status,
  className,
}: {
  status: GroupStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(statusClassNames[status], className)}>
      {getGroupStatusLabel(status)}
    </Badge>
  );
}
