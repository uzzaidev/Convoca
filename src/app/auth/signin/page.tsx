"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStackApp } from "@stackframe/stack";
import { useState } from "react";

export default function SignInPage() {
  const app = useStackApp();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Stack Auth envia um magic link por email
      await app.signInWithMagicLink(email);
      
      // Mostrar mensagem de sucesso
      setError("Link mágico enviado! Verifique seu email.");
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setError("Erro ao enviar link de login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

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
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Entrar com Magic Link"}
            </Button>
            {error && (
              <p className={`text-xs text-center ${error.includes("enviado") ? "text-green-600" : "text-red-600"}`}>
                {error}
              </p>
            )}
            <p className="text-xs text-center text-muted-foreground">
              Você receberá um link mágico para fazer login
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
