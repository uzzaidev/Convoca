-- Query para debugar os resultados de cada jogo do Pedro Costa

WITH player_games AS (
  -- Eventos que cada jogador jogou (está em um time do evento finalizado)
  SELECT DISTINCT
    tm.user_id,
    t.event_id
  FROM team_members tm
  INNER JOIN teams t ON tm.team_id = t.id
  WHERE t.event_id IN (
    SELECT id FROM events
    WHERE group_id = 'aaaabbbb-cccc-dddd-eeee-111111111111'
    AND status = 'finished'
  )
),
game_results AS (
  -- Resultado de cada jogo para cada jogador
  SELECT
    pg.user_id,
    pg.event_id,
    t_player.id as player_team_id,

    -- Gols do time do jogador (direto, sem multiplicar por jogadores!)
    (SELECT COUNT(*)
     FROM event_actions ea
     WHERE ea.team_id = t_player.id
       AND ea.event_id = pg.event_id
       AND ea.action_type = 'goal'
    ) as team_goals,

    -- Gols do time adversário
    (SELECT COUNT(*)
     FROM event_actions ea
     INNER JOIN teams t ON ea.team_id = t.id
     WHERE t.event_id = pg.event_id
       AND t.id != t_player.id
       AND ea.action_type = 'goal'
    ) as opponent_goals

  FROM player_games pg
  INNER JOIN team_members tm ON tm.user_id = pg.user_id
  INNER JOIN teams t_player ON t_player.id = tm.team_id AND t_player.event_id = pg.event_id
)
SELECT
  gr.*,
  e.starts_at,
  CASE
    WHEN gr.team_goals > gr.opponent_goals THEN 'WIN'
    WHEN gr.team_goals < gr.opponent_goals THEN 'LOSS'
    ELSE 'DRAW'
  END as result
FROM game_results gr
INNER JOIN events e ON gr.event_id = e.id
WHERE gr.user_id = '33333333-3333-3333-3333-333333333333'
ORDER BY e.starts_at DESC;
