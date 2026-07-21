"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = () => {
    switch (error) {
      case "Configuration":
        return {
          title: "Erro de Configuração",
          description: "A autenticação não está configurada corretamente.",
          details: "Verifique se as variáveis de ambiente AUTH_SECRET e DATABASE_URL estão configuradas.",
        };
      case "AccessDenied":
        return {
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar este recurso.",
          details: null,
        };
      case "Verification":
        return {
          title: "Erro de Verificação",
          description: "O link de verificação pode ter expirado ou ser inválido.",
          details: null,
        };
      case "CredentialsSignin":
        return {
          title: "Credenciais Inválidas",
          description: "Email ou senha incorretos.",
          details: null,
        };
      default:
        return {
          title: "Erro de Autenticação",
          description: "Ocorreu um erro ao tentar fazer login.",
          details: null,
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white dark:from-red-950 dark:to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{errorInfo.title}</CardTitle>
          <CardDescription className="text-center">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorInfo.details && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Detalhes</AlertTitle>
              <AlertDescription>{errorInfo.details}</AlertDescription>
            </Alert>
          )}
          
          {error === "Configuration" && (
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p className="font-semibold">Para administradores:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Verifique se AUTH_SECRET está definido no Vercel</li>
                <li>Verifique se DATABASE_URL está correto</li>
                <li>Consulte a documentação em NEON_AUTH_GUIDE.md</li>
              </ol>
            </div>
          )}

          <p className="text-center text-muted-foreground text-sm">
            {error 
              ? `Código do erro: ${error}` 
              : "Por favor, tente novamente ou entre em contato com o suporte."
            }
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

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
