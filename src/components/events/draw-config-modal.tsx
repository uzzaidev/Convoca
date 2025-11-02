"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Settings, Save, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DrawConfig = {
  playersPerTeam: number;
  reservesPerTeam: number;
  positions: {
    gk: number;
    defender: number;
    midfielder: number;
    forward: number;
  };
};

type DrawConfigModalProps = {
  eventId: string;
  groupId: string;
  onConfigSaved?: () => void;
};

const DEFAULT_CONFIG: DrawConfig = {
  playersPerTeam: 7,
  reservesPerTeam: 2,
  positions: {
    gk: 1,
    defender: 2,
    midfielder: 2,
    forward: 2,
  },
};

export function DrawConfigModal({ eventId, groupId, onConfigSaved }: DrawConfigModalProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<DrawConfig>(DEFAULT_CONFIG);

  // Carregar configuração existente
  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen, groupId]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/draw-config`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || DEFAULT_CONFIG);
      }
    } catch (error) {
      // Se não conseguir carregar, usa configuração padrão
      setConfig(DEFAULT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/draw-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar configuração");
      }

      toast({
        title: "Configuração salva!",
        description: "As configurações do sorteio foram atualizadas.",
      });

      setIsOpen(false);
      onConfigSaved?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar configuração",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePosition = (position: keyof DrawConfig["positions"], value: number) => {
    setConfig(prev => ({
      ...prev,
      positions: {
        ...prev.positions,
        [position]: Math.max(0, value),
      },
    }));
  };

  const totalPlayers = config.playersPerTeam + config.reservesPerTeam;
  const totalPositions = Object.values(config.positions).reduce((sum, count) => sum + count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Algoritmo de Sorteio</DialogTitle>
          <DialogDescription>
            Configure como os times serão sorteados considerando posições e pontuações dos jogadores.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando configuração...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Configurações básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações Básicas</CardTitle>
                <CardDescription>
                  Defina o número de jogadores por time e reservas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="playersPerTeam">Jogadores por Time</Label>
                    <Input
                      id="playersPerTeam"
                      type="number"
                      min="1"
                      max="22"
                      value={config.playersPerTeam}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        playersPerTeam: Math.max(1, parseInt(e.target.value) || 1)
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reservesPerTeam">Reservas por Time</Label>
                    <Input
                      id="reservesPerTeam"
                      type="number"
                      min="0"
                      max="11"
                      value={config.reservesPerTeam}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        reservesPerTeam: Math.max(0, parseInt(e.target.value) || 0)
                      }))}
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total por time: {totalPlayers} jogadores ({config.playersPerTeam} titulares + {config.reservesPerTeam} reservas)
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por posições */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Posições</CardTitle>
                <CardDescription>
                  Defina quantos jogadores de cada posição são necessários por time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gk">Goleiros (GK)</Label>
                    <Input
                      id="gk"
                      type="number"
                      min="0"
                      max="5"
                      value={config.positions.gk}
                      onChange={(e) => updatePosition("gk", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defender">Zagueiros</Label>
                    <Input
                      id="defender"
                      type="number"
                      min="0"
                      max="11"
                      value={config.positions.defender}
                      onChange={(e) => updatePosition("defender", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="midfielder">Meio-campistas</Label>
                    <Input
                      id="midfielder"
                      type="number"
                      min="0"
                      max="11"
                      value={config.positions.midfielder}
                      onChange={(e) => updatePosition("midfielder", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="forward">Atacantes</Label>
                    <Input
                      id="forward"
                      type="number"
                      min="0"
                      max="11"
                      value={config.positions.forward}
                      onChange={(e) => updatePosition("forward", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de posições definidas: {totalPositions} jogadores
                  {totalPositions !== config.playersPerTeam && (
                    <span className="text-orange-600 ml-2">
                      ⚠️ Diferente do número de titulares ({config.playersPerTeam})
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Como funciona o algoritmo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como Funciona o Algoritmo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><strong>1. Prioridade por Posição:</strong> Primeiro considera a posição principal escolhida pelo jogador</p>
                <p><strong>2. Desempate por Ranking:</strong> Entre jogadores da mesma posição, prioriza maior pontuação</p>
                <p><strong>3. Preenchimento:</strong> Posições não preenchidas recebem jogadores com menor pontuação</p>
                <p><strong>4. Balanceamento:</strong> Times são balanceados considerando pontuações totais</p>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={saveConfig} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}