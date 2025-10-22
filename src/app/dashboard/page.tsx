import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecentGroups, getUpcomingEvents, type Group, type EventSummary } from "@/lib/groups";
import { Info } from "lucide-react";

export default async function DashboardPage() {
  let groups: Group[] = [];
  let events: EventSummary[] = [];
  let dbError = false;

  try {
    groups = await getRecentGroups(5);
    events = await getUpcomingEvents(5);
  } catch (e) {
    dbError = true;
  }

  return (
    <main className="container mx-auto p-6 space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus grupos e eventos
          </p>
        </div>
        <Button asChild>
          <Link href="/groups/new">+ Criar Grupo</Link>
        </Button>
      </div>

      {dbError && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Primeiros passos
            </CardTitle>
            <CardDescription className="text-blue-700">
              Configure a variável DATABASE_URL no arquivo .env e popule com dados de exemplo:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-blue-100 p-3 rounded text-sm font-mono">
              pnpm run seed
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Próximos Eventos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Próximos Jogos</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/events/new">+ Criar Evento</Link>
              </Button>
            </div>
            <CardDescription>
              Peladas agendadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nenhum evento agendado. Crie um novo evento para começar!
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {new Date(event.startsAt).toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.startsAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge variant="outline">{event.maxPlayers} vagas</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meus Grupos */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Grupos</CardTitle>
            <CardDescription>
              Grupos que você participa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nenhum grupo encontrado. Crie seu primeiro grupo!
              </p>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">{group.name}</p>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {group.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Grupos</CardDescription>
            <CardTitle className="text-3xl">{groups.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Eventos Agendados</CardDescription>
            <CardTitle className="text-3xl">{events.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Peladas Jogadas</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Gols Marcados</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}
