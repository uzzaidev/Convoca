"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { DollarSign, Shield, UserCircle } from "lucide-react";

export function DashboardHeader({
  userName,
  systemRole = "user",
}: {
  userName: string;
  systemRole?: "user" | "system_admin";
}) {
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

    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    await signOut({ callbackUrl: "/" });
  }

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-green-dark">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22" stroke="currentColor" strokeWidth="2" />
              <path d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22" stroke="currentColor" strokeWidth="2" />
              <path d="M2 12C2 12 6 8 12 8C18 8 22 12 22 12" stroke="currentColor" strokeWidth="2" />
              <path d="M2 12C2 12 6 16 12 16C18 16 22 12 22 12" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-navy">Convoca</span>
        </Link>
        <div className="flex items-center gap-4">
          {systemRole === "system_admin" && (
            <Button asChild variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
              <Link href="/admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            </Button>
          )}
          <Link
            href="/profile"
            className="hidden items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-navy sm:flex"
          >
            <UserCircle className="h-4 w-4" />
            {userName}
          </Link>
          {pendingCount > 0 && (
            <div className="relative">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="relative text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
              >
                <Link href="/dashboard">
                  <DollarSign className="h-5 w-5" />
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
                  >
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </Badge>
                </Link>
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-navy text-navy hover:bg-navy hover:text-white"
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
