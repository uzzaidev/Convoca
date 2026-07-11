"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, CheckCircle2, ExternalLink, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isNativePlatform } from "@/lib/mobile/platform-detector";

type PermissionState = "granted" | "denied" | "prompt" | "loading" | "web";

const NOTIFICATION_TYPES = [
  { icon: "📅", label: "Novo jogo criado no grupo" },
  { icon: "⏰", label: "Lembrete 24h antes do jogo" },
  { icon: "⚡", label: "Lembrete 12h antes do jogo" },
  { icon: "🎉", label: "Saiu da lista de espera" },
  { icon: "🎲", label: "Times sorteados" },
  { icon: "📊", label: "Resultado do jogo publicado" },
  { icon: "🏆", label: "Resultado de partida do campeonato" },
  { icon: "🏆", label: "Campeonato encerrado" },
];

export function NotificationSettings() {
  const [permission, setPermission] = useState<PermissionState>("loading");
  const [requesting, setRequesting] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    if (!isNativePlatform()) {
      setPermission("web");
      return;
    }

    void checkPermission();
  }, []);

  async function checkPermission() {
    try {
      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
      const result = await FirebaseMessaging.checkPermissions();
      setPermission(result.receive as PermissionState);
    } catch {
      setPermission("denied");
    }
  }

  async function handleEnable() {
    setRequesting(true);
    setShowManualInstructions(false);
    try {
      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
      const result = await FirebaseMessaging.requestPermissions();
      setPermission(result.receive as PermissionState);

      if (result.receive === "granted") {
        // Re-register token
        const { initPushNotifications } = await import("@/lib/mobile/push-notifications");
        await initPushNotifications();
      } else {
        // Permission permanently denied — show manual instructions
        setShowManualInstructions(true);
      }
    } catch {
      setShowManualInstructions(true);
    } finally {
      setRequesting(false);
    }
  }

  // ── Status badge ──────────────────────────────────────────────────────────────

  function StatusBadge() {
    if (permission === "loading") {
      return <Badge variant="secondary">Verificando...</Badge>;
    }
    if (permission === "granted") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Ativas
        </Badge>
      );
    }
    if (permission === "web") {
      return <Badge variant="outline">Apenas no app</Badge>;
    }
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200">
        <BellOff className="h-3 w-3 mr-1" />
        Desativadas
      </Badge>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" />
            Notificações Push
          </div>
          <StatusBadge />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Web message */}
        {permission === "web" && (
          <div className="rounded-lg border border-dashed p-4 text-center space-y-2">
            <Smartphone className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">Disponível apenas no app</p>
            <p className="text-xs text-muted-foreground">
              As notificações push funcionam no app instalado no celular (Android ou iOS), não no navegador.
            </p>
          </div>
        )}

        {/* Granted: all good */}
        {permission === "granted" && (
          <div className="flex items-start gap-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Notificações ativas</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                Você receberá alertas em tempo real para os eventos abaixo.
              </p>
            </div>
          </div>
        )}

        {/* Not granted: enable button */}
        {(permission === "prompt" || permission === "denied") && !showManualInstructions && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
              <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Notificações desativadas</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Ative para receber alertas de jogos, sorteios e campeonatos.
                </p>
              </div>
            </div>
            <Button
              onClick={handleEnable}
              disabled={requesting}
              className="w-full"
            >
              <BellRing className="h-4 w-4 mr-2" />
              {requesting ? "Aguardando permissão..." : "Ativar Notificações"}
            </Button>
          </div>
        )}

        {/* Manual instructions (permission permanently denied) */}
        {showManualInstructions && (
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <p className="text-sm font-medium">Ative manualmente nas configurações do aparelho:</p>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Abra <strong>Configurações</strong> do celular</li>
                <li>Toque em <strong>Aplicativos</strong> (ou Apps)</li>
                <li>Encontre e toque em <strong>Convoca</strong></li>
                <li>Toque em <strong>Notificações</strong></li>
                <li>Ative a chave <strong>Permitir notificações</strong></li>
              </ol>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  setShowManualInstructions(false);
                  void checkPermission();
                }}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Já ativei — verificar novamente
              </Button>
            </div>
          </div>
        )}

        {/* Notification types list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Você será notificado sobre
          </p>
          <div className="rounded-lg border divide-y">
            {NOTIFICATION_TYPES.map((n) => (
              <div key={n.label} className="flex items-center gap-3 px-3 py-2.5">
                <span className="text-base shrink-0">{n.icon}</span>
                <span className="text-sm text-muted-foreground">{n.label}</span>
                {permission === "granted" && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 ml-auto shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
