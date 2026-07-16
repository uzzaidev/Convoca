-- Inscreve os 21 jogadores avulsos no campeonato FUTLIPPE + CHURRASCO
-- Sem times ainda — o admin sorteia ou monta manualmente depois

DO $$
DECLARE
  champ_id UUID;
BEGIN
  SELECT id INTO champ_id
  FROM championships
  WHERE name = 'FUTLIPPE + CHURRASCO'
  ORDER BY created_at DESC
  LIMIT 1;

  IF champ_id IS NULL THEN
    RAISE EXCEPTION 'Campeonato "FUTLIPPE + CHURRASCO" nao encontrado. Verifique o nome exato.';
  END IF;

  INSERT INTO championship_participants (championship_id, guest_name) VALUES
    (champ_id, 'Lippe'),
    (champ_id, 'Digo'),
    (champ_id, 'Bred'),
    (champ_id, 'Ian'),
    (champ_id, 'GV'),
    (champ_id, 'Batata'),
    (champ_id, 'Gui'),
    (champ_id, 'Lele'),
    (champ_id, 'JJ'),
    (champ_id, 'Marcello'),
    (champ_id, 'Juan'),
    (champ_id, 'Aly'),
    (champ_id, 'Gregory'),
    (champ_id, 'matheus'),
    (champ_id, 'chob'),
    (champ_id, 'Eli'),
    (champ_id, 'Vini'),
    (champ_id, 'PV'),
    (champ_id, 'Caxias'),
    (champ_id, 'Borsa'),
    (champ_id, 'Gabo')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '21 inscritos adicionados ao campeonato %', champ_id;
END;
$$;
