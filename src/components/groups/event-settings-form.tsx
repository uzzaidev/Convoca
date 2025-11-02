"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Save, Loader2 } from "lucide-react";

type EventSettings = {
  minPlayers: number;
  maxPlayers: number;
  maxWaitlist: number;
};

type EventSettingsFormProps = {
  groupId: string;
};

const DEFAULT_SETTINGS: EventSettings = {
  minPlayers: 4,
  maxPlayers: 22,
  maxWaitlist: 10,
};

export function EventSettingsForm({ groupId }: EventSettingsFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<EventSettings>(DEFAULT_SETTINGS);

  // Carregar configurações existentes
  useEffect(() => {
    loadSettings();
  }, [groupId]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/event-settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || DEFAULT_SETTINGS);
      }
    } catch (error) {
      // Se não conseguir carregar, usa configurações padrão
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/event-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar configurações");
      }

      toast({
        title: "Configurações salvas!",
        description: "As configurações de eventos foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Carregando configurações...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Eventos</CardTitle>
        <CardDescription>
          Configure as regras padrão para eventos do grupo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minPlayers">Mínimo de Jogadores</Label>
            <Input
              id="minPlayers"
              type="number"
              min="1"
              max="22"
              value={settings.minPlayers}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                minPlayers: Math.max(1, Math.min(22, parseInt(e.target.value) || 1))
              }))}
            />
            <p className="text-xs text-muted-foreground">
              Número mínimo para o jogo acontecer
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Máximo de Jogadores</Label>
            <Input
              id="maxPlayers"
              type="number"
              min="1"
              max="50"
              value={settings.maxPlayers}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                maxPlayers: Math.max(1, Math.min(50, parseInt(e.target.value) || 22))
              }))}
            />
            <p className="text-xs text-muted-foreground">
              Limite máximo de confirmações
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxWaitlist">Máximo na Fila de Espera</Label>
            <Input
              id="maxWaitlist"
              type="number"
              min="0"
              max="50"
              value={settings.maxWaitlist}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                maxWaitlist: Math.max(0, Math.min(50, parseInt(e.target.value) || 0))
              }))}
            />
            <p className="text-xs text-muted-foreground">
              Limite da lista de espera
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}