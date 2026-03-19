import postgres from 'postgres';
import { readFileSync } from 'fs';

// Load .env manually
const envContent = readFileSync('.env', 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL não encontrada');
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  ssl: 'require',
  prepare: false,
});

async function runMigration() {
  try {
    console.log('Iniciando migração: Temporadas + Gols Contra...\n');

    // 1. own_goal constraint
    console.log('1. Atualizando CHECK constraint para own_goal...');
    await sql`ALTER TABLE event_actions DROP CONSTRAINT IF EXISTS event_actions_action_type_check`;
    await sql`ALTER TABLE event_actions ADD CONSTRAINT event_actions_action_type_check
      CHECK (action_type IN (
        'goal', 'assist', 'save', 'tackle', 'error',
        'yellow_card', 'red_card', 'period_start', 'period_end', 'own_goal'
      ))`;
    console.log('   ✓ CHECK constraint atualizado\n');

    // 2. seasons table
    console.log('2. Criando tabela seasons...');
    await sql`CREATE TABLE IF NOT EXISTS seasons (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      starts_at TIMESTAMP NOT NULL,
      ends_at TIMESTAMP NOT NULL,
      status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('active', 'finished', 'upcoming')),
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      CHECK (ends_at > starts_at)
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_seasons_group ON seasons(group_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_seasons_group_status ON seasons(group_id, status)`;
    console.log('   ✓ Tabela seasons criada\n');

    // 3. season_snapshots table
    console.log('3. Criando tabela season_snapshots...');
    await sql`CREATE TABLE IF NOT EXISTS season_snapshots (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      games_played INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      goals INTEGER NOT NULL DEFAULT 0,
      assists INTEGER NOT NULL DEFAULT 0,
      own_goals INTEGER NOT NULL DEFAULT 0,
      mvp_count INTEGER NOT NULL DEFAULT 0,
      team_goals INTEGER NOT NULL DEFAULT 0,
      goals_conceded INTEGER NOT NULL DEFAULT 0,
      goal_difference INTEGER NOT NULL DEFAULT 0,
      player_name VARCHAR(255),
      player_image TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(season_id, user_id)
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_season_snapshots_season ON season_snapshots(season_id)`;
    console.log('   ✓ Tabela season_snapshots criada\n');

    // 4. Recreate materialized view
    console.log('4. Recriando materialized view mv_event_scoreboard...');
    await sql`DROP MATERIALIZED VIEW IF EXISTS mv_event_scoreboard`;
    await sql`CREATE MATERIALIZED VIEW mv_event_scoreboard AS
      SELECT
        ea.event_id,
        ea.team_id,
        t.name AS team_name,
        COUNT(CASE WHEN ea.action_type = 'goal' THEN 1 END) AS goals,
        COUNT(CASE WHEN ea.action_type = 'assist' THEN 1 END) AS assists,
        COUNT(CASE WHEN ea.action_type = 'own_goal' THEN 1 END) AS own_goals
      FROM event_actions ea
      LEFT JOIN teams t ON ea.team_id = t.id
      WHERE ea.action_type IN ('goal', 'assist', 'own_goal')
      GROUP BY ea.event_id, ea.team_id, t.name`;
    await sql`CREATE UNIQUE INDEX idx_mv_scoreboard_event_team ON mv_event_scoreboard(event_id, team_id)`;
    console.log('   ✓ Materialized view recriada\n');

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
