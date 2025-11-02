-- Query de debug para ver os dados do Pedro Costa
-- Execute isso no Neon SQL Editor

-- 1. Ver todos os eventos que Pedro participou (fez check-in)
SELECT
  e.id as event_id,
  e.starts_at,
  e.status,
  ea.status as attendance_status,
  ea.checked_in_at,
  t.id as team_id,
  t.name as team_name,
  t.is_winner
FROM events e
INNER JOIN event_attendance ea ON e.id = ea.event_id
LEFT JOIN team_members tm ON tm.user_id = ea.user_id
LEFT JOIN teams t ON t.id = tm.team_id AND t.event_id = e.id
WHERE ea.user_id = '33333333-3333-3333-3333-333333333333' -- Pedro Costa
  AND e.status = 'finished'
ORDER BY e.starts_at DESC;

-- 2. Ver gols marcados pelo Pedro
SELECT
  e.id as event_id,
  e.starts_at,
  ea.action_type,
  ea.subject_user_id,
  ea.team_id,
  t.name as team_name
FROM event_actions ea
INNER JOIN events e ON ea.event_id = e.id
LEFT JOIN teams t ON ea.team_id = t.id
WHERE ea.subject_user_id = '33333333-3333-3333-3333-333333333333'
  AND e.status = 'finished'
ORDER BY e.starts_at DESC;

-- 3. Ver placar de todos os jogos que Pedro participou
SELECT
  e.id as event_id,
  e.starts_at,
  t.id as team_id,
  t.name as team_name,
  t.seed,
  t.is_winner,
  (SELECT COUNT(*) FROM event_actions WHERE team_id = t.id AND action_type = 'goal') as goals_scored,
  -- Time do Pedro?
  EXISTS(
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = t.id
      AND tm.user_id = '33333333-3333-3333-3333-333333333333'
  ) as pedro_in_team
FROM events e
INNER JOIN event_attendance ea ON e.id = ea.event_id
INNER JOIN teams t ON t.event_id = e.id
WHERE ea.user_id = '33333333-3333-3333-3333-333333333333'
  AND e.status = 'finished'
  AND ea.checked_in_at IS NOT NULL
ORDER BY e.starts_at DESC, t.seed;
