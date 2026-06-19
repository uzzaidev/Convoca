"use client";

import { useEffect } from "react";
import { useSession, SessionProvider } from "next-auth/react";
import { initNativeShell } from "@/lib/mobile/native-shell";
import { initPushNotifications } from "@/lib/mobile/push-notifications";

function MobileRuntimeInitializer() {
  const { status } = useSession();

  useEffect(() => {
    void initNativeShell();
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      void initPushNotifications();
    }
  }, [status]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MobileRuntimeInitializer />
      {children}
    </SessionProvider>
  );
}
