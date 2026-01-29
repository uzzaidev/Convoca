"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Target, Users, Star, Medal } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ScoringConfig = {
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  pointsGoal: number;
  pointsAssist: number;
  pointsMvp: number;
  pointsPresence: number;
  rankingMode: "standard" | "complete";
};

const PRESETS = {
  standard: {
    name: "Futebol Padrão",
    description: "V=3, E=1, D=0 (apenas resultados)",
    config: {
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      pointsGoal: 0,
      pointsAssist: 0,
      pointsMvp: 0,
      pointsPresence: 0,
      rankingMode: "standard" as const,
    },
  },
  complete: {
    name: "Completo",
    description: "Resultados + estatísticas individuais",
    config: {
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      pointsGoal: 1,
      pointsAssist: 1,
      pointsMvp: 2,
      pointsPresence: 0,
      rankingMode: "complete" as const,
    },
  },
  participation: {
    name: "Participativo",
    description: "Valoriza presença e colaboração",
    config: {
      pointsWin: 2,
      pointsDraw: 1,
      pointsLoss: 0,
      pointsGoal: 1,
      pointsAssist: 2,
      pointsMvp: 3,
      pointsPresence: 1,
      rankingMode: "complete" as const,
    },
  },
};

// Exemplo de jogador para preview
const EXAMPLE_PLAYER = {
  name: "Exemplo",
  wins: 5,
  draws: 2,
  losses: 3,
  goals: 8,
  assists: 4,
  mvps: 2,
  games: 10,
};

type ScoringConfigFormProps = {
  groupId: string;
};

export function ScoringConfigForm({ groupId }: ScoringConfigFormProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<ScoringConfig>(PRESETS.standard.config);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<ScoringConfig | null>(null);

  useEffect(() => {
    fetchConfig();
  }, [groupId]);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/scoring-config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setOriginalConfig(data.config);
      }
    } catch (error) {
      console.error("Error fetching scoring config:", error);
      toast({ title: "Erro", description: "Erro ao carregar configuração", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePoints = (cfg: ScoringConfig) => {
    const p = EXAMPLE_PLAYER;
    return (
      p.wins * cfg.pointsWin +
      p.draws * cfg.pointsDraw +
      p.losses * cfg.pointsLoss +
      p.goals * cfg.pointsGoal +
      p.assists * cfg.pointsAssist +
      p.mvps * cfg.pointsMvp +
      p.games * cfg.pointsPresence
    );
  };

  const updateConfig = (key: keyof ScoringConfig, value: number | string) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    setHasChanges(JSON.stringify(newConfig) !== JSON.stringify(originalConfig));
  };

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setConfig(preset.config);
    setHasChanges(JSON.stringify(preset.config) !== JSON.stringify(originalConfig));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/scoring-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast({ title: "Sucesso", description: "Configuração salva! A tabela será atualizada." });
        setOriginalConfig(config);
        setHasChanges(false);
      } else {
        const data = await res.json();
        toast({ title: "Erro", description: data.error || "Erro ao salvar configuração", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error saving scoring config:", error);
      toast({ title: "Erro", description: "Erro ao salvar configuração", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const previewPoints = calculatePoints(config);

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Sistema de Pontuação
          </CardTitle>
          <CardDescription>
            Configure como os pontos são calculados no ranking do grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Escolha um modelo ou personalize</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(PRESETS).map(([key, preset]) => {
                const isActive = JSON.stringify(config) === JSON.stringify(preset.config);
                return (
                  <button
                    key={key}
                    onClick={() => applyPreset(key as keyof typeof PRESETS)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isActive
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {preset.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Medal className="h-4 w-4" />
              Pontos por Resultado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Vitória
                </Label>
                <Badge variant="outline" className="font-mono">
                  {config.pointsWin} pts
                </Badge>
              </div>
              <Slider
                value={[config.pointsWin]}
                onValueChange={([value]) => updateConfig("pointsWin", value)}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  Empate
                </Label>
                <Badge variant="outline" className="font-mono">
                  {config.pointsDraw} pts
                </Badge>
              </div>
              <Slider
                value={[config.pointsDraw]}
                onValueChange={([value]) => updateConfig("pointsDraw", value)}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Derrota
                </Label>
                <Badge variant="outline" className="font-mono">
                  {config.pointsLoss} pts
                </Badge>
              </div>
              <Slider
                value={[config.pointsLoss]}
                onValueChange={([value]) => updateConfig("pointsLoss", value)}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Individual Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-4 w-4" />
              Pontos Individuais
            </CardTitle>
            <CardDescription>
              Pontos extras por estatísticas individuais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Gol</Label>
                <Badge variant="outline" className="font-mono">
                  {config.pointsGoal} pts
                </Badge>
              </div>
              <Slider
                value={[config.pointsGoal]}
                onValueChange={([value]) => updateConfig("pointsGoal", value)}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Assistência</Label>
                <Badge variant="outline" className="font-mono">
                  {config.pointsAssist} pts
                </Badge>
              </div>
              <Slider
                value={[config.pointsAssist]}
                onValueChange={([value]) => updateConfig("pointsAssist", value)}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500" />
                  MVP
                </Label>
                <Badge variant="outline" className="font-mono">
                  {config.pointsMvp} pts
                </Badge>
              </div>
              <Slider
                value={[config.pointsMvp]}
                onValueChange={([value]) => updateConfig("pointsMvp", value)}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Presença (por jogo)
                </Label>
                <Badge variant="outline" className="font-mono">
                  {config.pointsPresence} pts
                </Badge>
              </div>
              <Slider
                value={[config.pointsPresence]}
                onValueChange={([value]) => updateConfig("pointsPresence", value)}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
        <CardHeader>
          <CardTitle className="text-lg">Preview da Pontuação</CardTitle>
          <CardDescription>
            Veja como os pontos são calculados com a configuração atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Jogador Exemplo</span>
              <Badge className="text-lg px-3 py-1 bg-green-600">
                {previewPoints} pts
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{EXAMPLE_PLAYER.wins} vitórias</span>
                <span className="font-mono">+{EXAMPLE_PLAYER.wins * config.pointsWin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{EXAMPLE_PLAYER.draws} empates</span>
                <span className="font-mono">+{EXAMPLE_PLAYER.draws * config.pointsDraw}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{EXAMPLE_PLAYER.losses} derrotas</span>
                <span className="font-mono">+{EXAMPLE_PLAYER.losses * config.pointsLoss}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{EXAMPLE_PLAYER.goals} gols</span>
                <span className="font-mono">+{EXAMPLE_PLAYER.goals * config.pointsGoal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{EXAMPLE_PLAYER.assists} assistências</span>
                <span className="font-mono">+{EXAMPLE_PLAYER.assists * config.pointsAssist}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{EXAMPLE_PLAYER.mvps} MVPs</span>
                <span className="font-mono">+{EXAMPLE_PLAYER.mvps * config.pointsMvp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{EXAMPLE_PLAYER.games} jogos</span>
                <span className="font-mono">+{EXAMPLE_PLAYER.games * config.pointsPresence}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <strong>Fórmula:</strong> (V × {config.pointsWin}) + (E × {config.pointsDraw}) +
            (D × {config.pointsLoss}) + (Gols × {config.pointsGoal}) +
            (Assist × {config.pointsAssist}) + (MVP × {config.pointsMvp}) +
            (Jogos × {config.pointsPresence})
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        {hasChanges && (
          <Button
            variant="outline"
            onClick={() => {
              if (originalConfig) {
                setConfig(originalConfig);
                setHasChanges(false);
              }
            }}
          >
            Cancelar
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configuração"
          )}
        </Button>
      </div>
    </div>
  );
}
