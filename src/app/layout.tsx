import type { Metadata } from "next";
import "./globals.css";
import StackClientProvider from "@/components/providers/stack-provider";

export const metadata: Metadata = {
  title: "Peladeiros - Gestão de Peladas",
  description: "Organize suas peladas, sorteie times, registre estatísticas e acompanhe rankings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        <StackClientProvider>{children}</StackClientProvider>
      </body>
    </html>
  );
}
