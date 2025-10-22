import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shuffle, BarChart3, Check } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">Peladeiros App</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Organize suas peladas, gerencie presenças, sorteie times e acompanhe estatísticas.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button asChild size="lg">
                <Link href="/dashboard">Ir para o Dashboard</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/api/health">Status da API</Link>
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  RSVP Inteligente
                </CardTitle>
                <CardDescription>
                  Confirmação de presença com fila de espera automática
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Confirmação rápida</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Escolha de posição (GK/Linha)</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Fila de espera automática</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Sorteio de Times
                </CardTitle>
                <CardDescription>
                  Times balanceados automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Distribuição equilibrada</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Goleiros separados</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Sorteio justo</li>
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
                  Acompanhe gols, assistências e rankings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Gols e assistências</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Avaliações pós-jogo</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Rankings de desempenho</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Quick Start */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Primeiros Passos</CardTitle>
              <CardDescription>Configure o banco de dados e comece a usar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-2">
                <div className="text-muted-foreground"># Configure as variáveis de ambiente</div>
                <div>Copy-Item .env.example .env</div>
                <div className="text-muted-foreground pt-2"># Crie as tabelas no banco</div>
                <div>pnpm db:push</div>
                <div className="text-muted-foreground pt-2"># Crie dados de exemplo</div>
                <div>pnpm run seed</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Depois acesse o <Link href="/dashboard" className="underline font-medium">Dashboard</Link> para começar a criar grupos e eventos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
