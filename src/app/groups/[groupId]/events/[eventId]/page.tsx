import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRating } from "@/lib/utils";
import { Calendar, MapPin, Trophy, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { TeamEditor } from "@/components/events/team-editor";

type RouteParams = {
  params: Promise<{ groupId: string; eventId: string }>;
};

type Team = {
  id: string;
  name: string;
  is_winner: boolean | null;
  seed: number;
  members: Array<{
    userId: string;
    userName: string;
    userImage: string | null;
    position: string;
    starter: boolean;
  }> | null;
};

type Action = {
  id: string;
  action_type: string;
  actor_name: string;
  actor_image: string | null;
  team_name: string | null;
  minute: number | null;
  created_at: string;
};

type Rating = {
  rated_user_id: string;
  player_name: string;
  player_image: string | null;
  avg_rating: string;
  rating_count: string;
  all_tags: string[] | null;
};

export default async function EventDetailPage({ params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { groupId, eventId } = await params;

  // Buscar informações do evento
  const eventResult = await sql`
    SELECT
      e.*,
      g.name as group_name,
      v.name as venue_name,
      v.address as venue_address
    FROM events e
    INNER JOIN groups g ON e.group_id = g.id
    LEFT JOIN venues v ON e.venue_id = v.id
    WHERE e.id = ${eventId} AND e.group_id = ${groupId}
  `;

  if (eventResult.length === 0) {
    redirect(`/groups/${groupId}`);
  }

  const event = eventResult[0];

  // Verificar se o usuário é membro do grupo
  const membershipResult = await sql`
    SELECT role FROM group_members
    WHERE group_id = ${groupId} AND user_id = ${user.id}
  `;

  if (membershipResult.length === 0) {
    redirect("/dashboard");
  }

  const membership = membershipResult[0];
  const isAdmin = membership.role === "admin";

  // Buscar times e jogadores
  const teams = await sql`
    SELECT
      t.id,
      t.name,
      t.seed,
      t.is_winner,
      json_agg(
        json_build_object(
          'userId', u.id,
          'userName', u.name,
          'userImage', u.image,
          'position', tm.position,
          'starter', tm.starter
        ) ORDER BY tm.position DESC, tm.starter DESC
      ) as members
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id
    LEFT JOIN users u ON tm.user_id = u.id
    WHERE t.event_id = ${eventId}
    GROUP BY t.id, t.name, t.seed, t.is_winner
    ORDER BY t.seed ASC
  ` as unknown as Team[];

  // Buscar ações do jogo (gols, assistências, etc)
  const actions = await sql`
    SELECT
      ea.id,
      ea.action_type,
      ea.minute,
      ea.created_at,
      u.name as actor_name,
      u.image as actor_image,
      t.name as team_name
    FROM event_actions ea
    INNER JOIN users u ON ea.actor_user_id = u.id
    LEFT JOIN teams t ON ea.team_id = t.id
    WHERE ea.event_id = ${eventId}
    ORDER BY ea.minute ASC NULLS LAST, ea.created_at ASC
  ` as unknown as Action[];

  // Buscar avaliações e MVP
  const ratings = await sql`
    SELECT
      pr.rated_user_id,
      u.name as player_name,
      u.image as player_image,
      AVG(pr.score)::numeric(3,2) as avg_rating,
      COUNT(pr.id) as rating_count,
      (
        SELECT array_agg(DISTINCT tag)
        FROM player_ratings pr2
        CROSS JOIN LATERAL unnest(pr2.tags) AS tag
        WHERE pr2.event_id = ${eventId} 
          AND pr2.rated_user_id = pr.rated_user_id
          AND pr2.tags IS NOT NULL
      ) as all_tags
    FROM player_ratings pr
    INNER JOIN users u ON pr.rated_user_id = u.id
    WHERE pr.event_id = ${eventId}
    GROUP BY pr.rated_user_id, u.name, u.image
    ORDER BY avg_rating DESC
  ` as unknown as Rating[];

  // Calcular gols por time
  const teamGoals: Record<string, number> = {};
  actions.forEach((action) => {
    if (action.action_type === "goal" && action.team_name) {
      teamGoals[action.team_name] = (teamGoals[action.team_name] || 0) + 1;
    }
  });

  // Encontrar MVP (jogador com mais tags 'mvp')
  const mvp = ratings.find((r) => r.all_tags?.includes("mvp"));

  // Filtrar ações relevantes para exibição
  const goals = actions.filter((a) => a.action_type === "goal");
  const assists = actions.filter((a) => a.action_type === "assist");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50/30 dark:from-green-950/20 dark:via-background dark:to-green-950/10">
      <DashboardHeader userName={user.name || user.email} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Botão voltar */}
        <div className="mb-6">
          <Link href={`/groups/${groupId}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar para o grupo
            </Button>
          </Link>
        </div>

        {/* Cabeçalho do evento */}
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatDate(event.starts_at)}
              {event.venue_name && (
                <>
                  <span className="mx-2">•</span>
                  <MapPin className="h-4 w-4" />
                  {event.venue_name}
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{event.group_name}</h1>
              <Badge
                variant={
                  event.status === "finished"
                    ? "default"
                    : event.status === "live"
                    ? "destructive"
                    : "secondary"
                }
              >
                {event.status === "finished"
                  ? "Finalizado"
                  : event.status === "live"
                  ? "Ao vivo"
                  : "Agendado"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Placar */}
        {teams.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-500" />
                Resultado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-6">
                {teams.map((team, index) => (
                  <div key={team.id} className="flex items-center gap-6">
                    {index > 0 && (
                      <div className="text-4xl font-bold text-muted-foreground">×</div>
                    )}
                    <div
                      className={`flex-1 text-center p-6 rounded-lg transition-all min-w-[200px] ${
                        team.is_winner
                          ? "bg-green-500/10 border-2 border-green-500/30 shadow-sm"
                          : "bg-muted/50"
                      }`}
                    >
                      <div className="font-semibold text-lg mb-3">{team.name}</div>
                      <div className="text-5xl font-bold">
                        {teamGoals[team.name] || 0}
                      </div>
                      {team.is_winner && (
                        <Badge className="mt-3" variant="default">
                          <Trophy className="h-3 w-3 mr-1" />
                          Vencedor
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* Times */}
          {teams.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Times
                  </CardTitle>
                  {isAdmin && event.status === "scheduled" && (
                    <TeamEditor eventId={eventId} teams={teams} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {teams.map((team) => (
                    <div key={team.id}>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        {team.name}
                        {team.is_winner && (
                          <Trophy className="h-4 w-4 text-green-500" />
                        )}
                      </h3>
                      <div className="space-y-2">
                        {team.members?.map((member) => (
                          <div
                            key={member.userId}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                member.position === "gk"
                                  ? "bg-yellow-500"
                                  : member.position === "defender"
                                  ? "bg-blue-500"
                                  : member.position === "midfielder"
                                  ? "bg-green-500"
                                  : member.position === "forward"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            <span>{member.userName}</span>
                            {member.position === "gk" && (
                              <Badge variant="outline" className="text-xs">
                                Goleiro
                              </Badge>
                            )}
                            {member.position === "defender" && (
                              <Badge variant="outline" className="text-xs">
                                Zagueiro
                              </Badge>
                            )}
                            {member.position === "midfielder" && (
                              <Badge variant="outline" className="text-xs">
                                Meio-campo
                              </Badge>
                            )}
                            {member.position === "forward" && (
                              <Badge variant="outline" className="text-xs">
                                Atacante
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas do jogo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Gols */}
                {goals.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                      Gols ({goals.length})
                    </h3>
                    <div className="space-y-2">
                      {goals.map((goal) => (
                        <div
                          key={goal.id}
                          className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {goal.minute ? `${goal.minute}'` : "-"}
                            </Badge>
                            <span className="font-medium">{goal.actor_name}</span>
                          </div>
                          {goal.team_name && (
                            <span className="text-muted-foreground text-xs">
                              {goal.team_name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assistências */}
                {assists.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                      Assistências ({assists.length})
                    </h3>
                    <div className="space-y-2">
                      {assists.map((assist) => (
                        <div
                          key={assist.id}
                          className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {assist.minute ? `${assist.minute}'` : "-"}
                            </Badge>
                            <span className="font-medium">{assist.actor_name}</span>
                          </div>
                          {assist.team_name && (
                            <span className="text-muted-foreground text-xs">
                              {assist.team_name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {goals.length === 0 && assists.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma estatística registrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* MVP e Avaliações */}
          {ratings.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Avaliações dos Jogadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mvp && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-8 w-8 text-yellow-500" />
                      <div>
                        <div className="text-sm text-muted-foreground font-medium">
                          MVP do Jogo
                        </div>
                        <div className="text-xl font-bold">{mvp.player_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Avaliação: {formatRating(mvp.avg_rating)}/10
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {ratings.map((rating, index) => (
                    <div
                      key={rating.rated_user_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground font-medium w-6">
                          {index + 1}º
                        </span>
                        <span className="font-medium">{rating.player_name}</span>
                        {rating.all_tags && rating.all_tags.length > 0 && (
                          <div className="flex gap-1">
                            {rating.all_tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {formatRating(rating.avg_rating)}
                        </span>
                        <span className="text-sm text-muted-foreground">/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
