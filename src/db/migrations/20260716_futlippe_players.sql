-- Adiciona jogadores avulsos ao campeonato FUTLIPPE + CHURRASCO
-- Times criados com nomes provisorios: renomeie na UI apos rodar
-- Distribuicao pode ser editada antes de rodar

DO $$
DECLARE
  champ_id  UUID;
  time1_id  UUID;
  time2_id  UUID;
  time3_id  UUID;
BEGIN

  SELECT id INTO champ_id
  FROM championships
  WHERE name = 'FUTLIPPE + CHURRASCO'
  ORDER BY created_at DESC
  LIMIT 1;

  IF champ_id IS NULL THEN
    RAISE EXCEPTION 'Campeonato "FUTLIPPE + CHURRASCO" nao encontrado. Verifique o nome exato.';
  END IF;

  -- ── TIME 1 ──────────────────────────────────────────────────────────────────
  INSERT INTO championship_teams (championship_id, name, color, seed)
  VALUES (champ_id, 'Time 1', '#ef4444', 1)
  RETURNING id INTO time1_id;

  INSERT INTO championship_team_players (championship_team_id, guest_name, is_captain) VALUES
    (time1_id, 'Lippe',   FALSE),
    (time1_id, 'GV',      FALSE),
    (time1_id, 'Juan',    FALSE),
    (time1_id, 'Gregory', FALSE),
    (time1_id, 'Eli',     FALSE),
    (time1_id, 'Borsa',   FALSE),
    (time1_id, 'Vini',    FALSE);  -- goleiro

  -- ── TIME 2 ──────────────────────────────────────────────────────────────────
  INSERT INTO championship_teams (championship_id, name, color, seed)
  VALUES (champ_id, 'Time 2', '#3b82f6', 2)
  RETURNING id INTO time2_id;

  INSERT INTO championship_team_players (championship_team_id, guest_name, is_captain) VALUES
    (time2_id, 'Digo',    FALSE),
    (time2_id, 'Batata',  FALSE),
    (time2_id, 'Lele',    FALSE),
    (time2_id, 'Aly',     FALSE),
    (time2_id, 'matheus', FALSE),
    (time2_id, 'Caxias',  FALSE),
    (time2_id, 'PV',      FALSE);  -- goleiro

  -- ── TIME 3 ──────────────────────────────────────────────────────────────────
  INSERT INTO championship_teams (championship_id, name, color, seed)
  VALUES (champ_id, 'Time 3', '#22c55e', 3)
  RETURNING id INTO time3_id;

  INSERT INTO championship_team_players (championship_team_id, guest_name, is_captain) VALUES
    (time3_id, 'Bred',    FALSE),
    (time3_id, 'Ian',     FALSE),
    (time3_id, 'Gui',     FALSE),
    (time3_id, 'JJ',      FALSE),
    (time3_id, 'Marcello',FALSE),
    (time3_id, 'chob',    FALSE),
    (time3_id, 'Gabo',    FALSE);

  RAISE NOTICE 'Campeonato: % | Times criados: %, %, %', champ_id, time1_id, time2_id, time3_id;

END;
$$;
