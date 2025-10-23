import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">⚽ Peladeiros</CardTitle>
          <CardDescription>
            Faça login para organizar suas peladas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              A autenticação será configurada em breve com NextAuth v5.
            </p>
            <p className="text-sm text-center text-muted-foreground">
              Por enquanto, acesse diretamente o{" "}
              <a href="/dashboard" className="text-primary underline">
                Dashboard
              </a>
            </p>
            <Button asChild className="w-full">
              <a href="/dashboard">Ir para Dashboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
