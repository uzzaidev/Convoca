"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function DashboardHeader({ userName }: { userName: string }) {
  async function handleLogout() {
    await signOut({ callbackUrl: "/" });
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold">
          Peladeiros
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Olá, {userName}
          </span>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
