import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Erro de Autenticação - Peladeiros",
};

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white dark:from-red-950 dark:to-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Erro de Autenticação</CardTitle>
          <CardDescription className="text-center">
            Ocorreu um erro ao tentar fazer login
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Não foi possível completar sua autenticação. Por favor, tente novamente.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/auth/signin">Tentar Novamente</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Voltar para o Início</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
