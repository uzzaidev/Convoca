"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { DollarSign } from "lucide-react";

export function DashboardHeader({ userName }: { userName: string }) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await fetch("/api/users/me/pending-charges-count");
        const data = await res.json();
        setPendingCount(data.count || 0);
      } catch (error) {
        console.error("Error fetching pending charges:", error);
      }
    };

    fetchPendingCount();

    // Poll every 60 seconds
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    await signOut({ callbackUrl: "/" });
  }

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-dark rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 12C2 12 6 8 12 8C18 8 22 12 22 12" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 12C2 12 6 16 12 16C18 16 22 12 22 12" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="text-2xl font-bold text-navy">Peladeiros</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:inline">
            Olá, {userName}
          </span>
          {pendingCount > 0 && (
            <div className="relative">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="relative text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
              >
                <Link href="/dashboard">
                  <DollarSign className="h-5 w-5" />
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </Badge>
                </Link>
              </Button>
            </div>
          )}
          <Button variant="outline" onClick={handleLogout} className="border-navy text-navy hover:bg-navy hover:text-white">
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
