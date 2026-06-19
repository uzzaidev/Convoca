"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Check } from "lucide-react";

type ProfileFormProps = {
  initialName: string;
  email: string;
};

export function ProfileForm({ initialName, email }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Erro ao atualizar perfil" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexao. Tente novamente." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informacoes Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                minLength={2}
                maxLength={255}
                required
              />
              <p className="text-xs text-muted-foreground">
                Este e o nome que aparece nos jogos e estatisticas.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
              </Label>
              <Input id="email" value={email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">O e-mail nao pode ser alterado.</p>
            </div>

            {message && (
              <div
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                  message.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message.type === "success" && <Check className="h-4 w-4" />}
                {message.text}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSaving || name.trim() === initialName}
              className="w-full"
            >
              {isSaving ? "Salvando..." : "Salvar Alteracoes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacidade e conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Gerencie solicitacoes de privacidade ou inicie a exclusao da sua conta.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="sm:w-auto">
              <Link href="/lgpd">Direitos LGPD</Link>
            </Button>
            <Button asChild variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 sm:w-auto">
              <Link href="/excluir-conta">Excluir conta</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
