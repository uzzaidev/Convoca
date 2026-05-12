"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface QuotaData {
  requestsUsed: number;
  requestLimit: number;
  tokensUsed: number;
  tokenLimit: number;
}

interface Props {
  refreshKey?: number;
}

export function QuotaBadge({ refreshKey = 0 }: Props) {
  const [quota, setQuota] = useState<QuotaData | null>(null);

  useEffect(() => {
    void fetch("/api/agent/quota")
      .then((r) => r.json())
      .then((data: { quota: QuotaData }) => setQuota(data.quota))
      .catch(() => null);
  }, [refreshKey]);

  if (!quota) return null;

  const requestPct = Math.round((quota.requestsUsed / quota.requestLimit) * 100);
  const nearLimit = requestPct >= 80;

  return (
    <Badge variant={nearLimit ? "destructive" : "secondary"} className="text-xs">
      {quota.requestsUsed}/{quota.requestLimit} req
    </Badge>
  );
}
