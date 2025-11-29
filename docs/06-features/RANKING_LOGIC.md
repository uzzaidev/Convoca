# Sistema de Rankings - Lógica e Funcionamento

Este documento descreve como funciona o sistema de rankings do Peladeiros App, incluindo a lógica de cálculo de estatísticas e pontuação.

## Visão Geral

O sistema de rankings analisa todos os eventos finalizados de um grupo e calcula estatísticas individuais para cada jogador, gerando um ranking baseado em múltiplos fatores de desempenho.

## 1. Identificação de Jogos Jogados

### Critério Principal
Um jogador é considerado como tendo "jogado" um evento se ele **está em um time (team_members) de um evento finalizado**.

```sql
-- Identifica eventos que cada jogador jogou
SELECT DISTINCT tm.user_id, t.event_id
FROM team_members tm
INNER JOIN teams t ON tm.team_id = t.id
WHERE t.event_id IN (eventos finalizados do grupo)
```

### Por que não usar check-in?

Inicialmente tentamos usar `event_attendance.checked_in_at`, mas descobrimos que:
- Admins adicionam jogadores aos times e registram ações **sem que os jogadores façam check-in**
- Isso causava discrepância: jogadores com gols registrados mas 0 jogos contabilizados
- **Solução**: Se o jogador está em um time do evento finalizado, ele jogou

## 2. Cálculo de Resultados por Jogo

Para cada jogo que o jogador participou, calculamos o resultado comparando os gols:

```sql
game_results AS (
  SELECT
    pg.user_id,
    pg.event_id,
    t_player.id as player_team_id,

    -- Gols do time do jogador neste evento
    (SELECT COUNT(*)
     FROM event_actions ea
     WHERE ea.team_id = t_player.id
       AND ea.event_id = pg.event_id
       AND ea.action_type = 'goal'
    ) as team_goals,

    -- Gols de todos os outros times neste evento
    (SELECT COUNT(*)
     FROM event_actions ea
     INNER JOIN teams t ON ea.team_id = t.id
     WHERE t.event_id = pg.event_id
       AND t.id != t_player.id
       AND ea.action_type = 'goal'
    ) as opponent_goals

  FROM player_games pg
  INNER JOIN team_members tm ON tm.user_id = pg.user_id
  INNER JOIN teams t_player ON t_player.id = tm.team_id
    AND t_player.event_id = pg.event_id
)
```

### Importante: Evitar Multiplicação de Gols

**❌ ERRADO:**
```sql
-- Isso multiplica os gols pelo número de jogadores no time!
SELECT COUNT(*)
FROM event_actions ea
INNER JOIN team_members tm ON tm.team_id = ea.team_id  -- ⚠️ Causa duplicação
WHERE ea.action_type = 'goal'
```

**✅ CORRETO:**
```sql
-- Conta gols diretamente pelo team_id
SELECT COUNT(*)
FROM event_actions ea
WHERE ea.team_id = t_player.id
  AND ea.action_type = 'goal'
```

### Determinação de Vitória/Derrota/Empate

```sql
-- Vitórias: jogos onde o time do jogador fez mais gols
WHERE team_goals > opponent_goals

-- Derrotas: jogos onde o time do jogador fez menos gols
WHERE team_goals < opponent_goals

-- Empates: jogos com placar igual
WHERE team_goals = opponent_goals
```

**Por que não usar `teams.is_winner`?**
- O campo `is_winner` pode não ser atualizado quando admins modificam placares após finalizar o jogo
- Calcular diretamente pelos gols garante consistência

## 3. Estatísticas Individuais

### Gols e Assistências

Contabilizados através de `event_actions` usando o campo `subject_user_id` (quem executou a ação):

```sql
-- Gols do jogador
SELECT COUNT(*)
FROM event_actions ea
WHERE ea.subject_user_id = user_id
  AND ea.event_id IN (eventos finalizados)
  AND ea.action_type = 'goal'

-- Assistências do jogador
SELECT COUNT(*)
FROM event_actions ea
WHERE ea.subject_user_id = user_id
  AND ea.event_id IN (eventos finalizados)
  AND ea.action_type = 'assist'
```

**Importante**: Usar `subject_user_id`, **NÃO** `actor_user_id`:
- `subject_user_id` = quem performou a ação (o jogador que fez o gol)
- `actor_user_id` = quem registrou a ação (geralmente o admin)

### MVPs

Contados através de tags nas avaliações de jogadores:

```sql
SELECT COUNT(*)
FROM player_ratings pr
WHERE pr.rated_user_id = user_id
  AND pr.event_id IN (eventos finalizados)
  AND 'mvp' = ANY(pr.tags)
```

### Gols do Time e Gols Sofridos

Agregação dos resultados de cada jogo:

```sql
-- Total de gols do time do jogador (soma de todos os jogos)
SELECT COALESCE(SUM(team_goals), 0)
FROM game_results
WHERE user_id = jogador

-- Total de gols sofridos (soma de todos os jogos)
SELECT COALESCE(SUM(opponent_goals), 0)
FROM game_results
WHERE user_id = jogador
```

### DM Games

Jogos onde o jogador deu "DM" (Deu Mancada - não compareceu):

```sql
SELECT COUNT(DISTINCT ea.event_id)
FROM event_attendance ea
WHERE ea.user_id = user_id
  AND ea.event_id IN (eventos finalizados)
  AND ea.status = 'dm'
```

## 4. Cálculo do Score de Performance

O score final é uma soma ponderada de vários fatores:

```javascript
score =
  (games_played × 2) +    // 2 pontos por presença
  (goals × 3) +           // 3 pontos por gol
  (assists × 2) +         // 2 pontos por assistência
  (mvps × 5) +            // 5 pontos por MVP
  (wins × 1)              // 1 ponto por vitória
```

### Pesos das Métricas

| Métrica | Peso | Justificativa |
|---------|------|---------------|
| Presença | 2 | Valoriza participação regular |
| Gols | 3 | Principal métrica ofensiva |
| Assistências | 2 | Contribuição importante para gols |
| MVPs | 5 | Reconhecimento de destaque na partida |
| Vitórias | 1 | Contribuição para resultado do time |

### Critérios de Ordenação

Os jogadores são ordenados por:

1. **Score** (descendente) - Maior score primeiro
2. **Jogos** (descendente) - Em caso de empate, quem jogou mais
3. **Gols** (descendente) - Em caso de empate adicional, quem fez mais gols

```javascript
rankings.sort((a, b) => {
  if (b.score !== a.score) return b.score - a.score;
  if (b.games !== a.games) return b.games - a.games;
  return b.goals - a.goals;
});
```

## 5. Campos Derivados

Calculados no TypeScript após a query:

```javascript
{
  goal_difference: team_goals - team_goals_conceded,
  available_matches: total_events - dm_games,
  score: (games * 2) + (goals * 3) + (assists * 2) + (mvps * 5) + (wins * 1)
}
```

## 6. Exemplo Prático

### Dados do Jogador: Pedro Costa

**Jogos Participados:**
1. Evento 1: Time B, 2x4 → **DERROTA**
2. Evento 2: Time A, 8x3 → **VITÓRIA**
3. Evento 3: Time A, 0x0 → **EMPATE**

**Estatísticas Pessoais:**
- 7 gols marcados
- 1 assistência
- 0 MVPs

**Cálculos:**
```
games_played = 3
goals = 7
assists = 1
mvps = 0
wins = 1
losses = 1
draws = 1
team_goals = 0 + 8 + 2 = 10
team_goals_conceded = 0 + 3 + 4 = 7
goal_difference = 10 - 7 = 3

score = (3 × 2) + (7 × 3) + (1 × 2) + (0 × 5) + (1 × 1)
score = 6 + 21 + 2 + 0 + 1
score = 30
```

## 7. Limitações e Considerações

### Limitações Atuais

1. **Assume 2 times por evento**: A lógica de gols sofridos assume que há apenas 2 times por evento
2. **Sem ponderação por qualidade**: Todos os jogos têm o mesmo peso, independente da dificuldade
3. **Sem ajuste temporal**: Jogos recentes não pesam mais que jogos antigos

### Melhorias Futuras Possíveis

1. **ELO Rating**: Sistema dinâmico que ajusta rating baseado em resultados
2. **Decaimento temporal**: Dar mais peso a jogos recentes
3. **Bônus por sequências**: Streak de vitórias, gols consecutivos, etc.
4. **Contexto do jogo**: Diferenciar gol normal de gol da vitória, etc.
5. **Materialização**: Criar uma tabela/view materializada para performance

## 8. Queries de Referência

### Query Principal Completa

Localização: `src/app/groups/[groupId]/page.tsx` (linhas 322-454)

### Queries de Debug

- **Resultados de jogos individuais**: `debug-game-results.sql`
- **Estatísticas de um jogador**: `debug-pedro-stats.sql`

## 9. Troubleshooting

### Problema: Gols multiplicados

**Sintoma**: Jogador mostra 40 gols quando deveria mostrar 8

**Causa**: JOIN com `team_members` dentro da subquery de contagem de gols

**Solução**: Contar gols diretamente por `team_id` sem JOIN adicional

### Problema: Vitórias inconsistentes

**Sintoma**: Jogador mostra vitória quando perdeu o jogo

**Causa**: Campo `teams.is_winner` não atualizado após admin modificar placar

**Solução**: Calcular vitória/derrota comparando `team_goals` e `opponent_goals`

### Problema: Jogos não contabilizados

**Sintoma**: Jogador tem 0 jogos mas tem gols registrados

**Causa**: Usar apenas `checked_in_at` para determinar se jogou

**Solução**: Usar participação em `team_members` como critério

## 10. Manutenção

### Ao adicionar novos tipos de ações

1. Adicionar campo na query principal
2. Adicionar peso no cálculo de score
3. Atualizar documentação
4. Adicionar coluna na tabela de rankings

### Ao modificar pesos

1. Ajustar cálculo de score
2. Documentar a mudança e justificativa
3. Considerar recalcular scores históricos

### Performance

Para grupos com muitos eventos/jogadores, considerar:
- Criar índices em `event_actions(event_id, subject_user_id, action_type)`
- Criar índices em `team_members(user_id, team_id)`
- Materializar o ranking em uma tabela dedicada com trigger de atualização

---

**Última atualização**: 2025-11-02
**Responsável**: Sistema de Rankings Peladeiros App
