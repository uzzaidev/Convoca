"use client";

import { StackProvider } from "@stackframe/stack";
import { stackClientApp } from "@/lib/stack-client";

export default function StackClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StackProvider app={stackClientApp}>
      {children}
    </StackProvider>
  );
}
