"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export function JoinGroupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao entrar no grupo");
      }

      toast({
        title: "Você entrou no grupo!",
        description: `Bem-vindo ao grupo ${data.group.name}`,
      });

      // Redirect to the group page
      router.push(`/groups/${data.group.id}`);
    } catch (error) {
      toast({
        title: "Erro ao entrar no grupo",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Código de Convite</CardTitle>
          <CardDescription>
            Insira o código que você recebeu do administrador do grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="code">Código *</Label>
            <Input
              id="code"
              placeholder="Ex: ABC123XYZ"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              disabled={isLoading}
              className="font-mono text-lg tracking-wider"
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar no Grupo
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
