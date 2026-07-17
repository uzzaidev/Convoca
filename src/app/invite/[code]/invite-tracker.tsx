"use client";

import { useEffect } from "react";
import { trackInvitePageViewed } from "@/lib/mobile/analytics";

export function InviteTracker({ codeLength }: { codeLength: number }) {
  useEffect(() => {
    void trackInvitePageViewed({ inviteCodeLength: codeLength });
  }, [codeLength]);
  return null;
}
