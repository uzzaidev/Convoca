import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, Shuffle, BarChart3, Rocket } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-green-700 dark:text-green-400 flex items-center justify-center gap-3">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 12C2 12 6 8 12 8C18 8 22 12 22 12" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 12C2 12 6 16 12 16C18 16 22 12 22 12" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Peladeiros
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            A plataforma completa para organizar suas peladas
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signin">Começar Agora</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                Organize
              </CardTitle>
              <CardDescription>
                Crie grupos, convide jogadores e agende partidas facilmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Gestão de grupos e membros</li>
                <li>• Convites por link</li>
                <li>• Confirmação de presença (RSVP)</li>
                <li>• Fila de espera automática</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Sorteio Inteligente
              </CardTitle>
              <CardDescription>
                Times equilibrados automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Sorteio aleatório ou balanceado</li>
                <li>• Separação automática de goleiros</li>
                <li>• Registro de ordem de chegada</li>
                <li>• Histórico de times</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas
              </CardTitle>
              <CardDescription>
                Acompanhe performance e rankings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Gols, assistências, defesas</li>
                <li>• Sistema de avaliação</li>
                <li>• Rankings e destaques</li>
                <li>• Histórico completo</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Rocket className="h-5 w-5" />
                Roadmap
              </CardTitle>
              <CardDescription>O que vem por aí</CardDescription>
            </CardHeader>
            <CardContent className="text-left">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Fase 1 - MVP (Atual)</h4>
                  <p className="text-sm text-muted-foreground">
                    Grupos, eventos, RSVP, sorteio de times, estatísticas básicas
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Fase 2 - Realtime</h4>
                  <p className="text-sm text-muted-foreground">
                    Placar ao vivo, notificações push, sorteio inteligente balanceado
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Fase 3 - Pro Features</h4>
                  <p className="text-sm text-muted-foreground">
                    Gestão financeira completa, gamificação, troféus, ligas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
