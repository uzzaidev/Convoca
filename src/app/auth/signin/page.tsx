"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a página de sign-in do Stack Auth
    router.push("/handler/sign-in");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-background">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Redirecionando para login...</p>
      </div>
    </div>
  );
}
