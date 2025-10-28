# Atualização: Sistema de Frequência e Ranking

## Resumo das Mudanças

Esta atualização adiciona melhorias ao sistema de frequência e corrige problemas no ranking geral.

## Novas Funcionalidades

### 1. Status DM (Departamento Médico)

Agora é possível marcar jogadores como "DM" (Departamento Médico) quando estão lesionados ou indisponíveis. Este status é diferente de "ausente" pois:
- Jogadores em DM não são contabilizados no cálculo de participação
- A % de participação é calculada como: `jogos presentes / (total de jogos - jogos em DM)`

### 2. Aba de Frequência Aprimorada

A aba de frequência agora exibe:
- **Presentes**: Número de jogos em que o jogador compareceu
- **DM**: Número de jogos em que o jogador estava no departamento médico
- **Ausentes**: Número de jogos em que o jogador faltou
- **% Participação**: Percentual de participação (calculado sobre jogos disponíveis)

### 3. Ranking Geral Corrigido

O ranking geral agora exibe corretamente:
- Coluna de "Jogos" com o número de partidas do jogador
- Contagem precisa de gols e assistências
- Pontuação baseada em:
  - 2 pontos por presença
  - 3 pontos por gol
  - 2 pontos por assistência
  - 5 pontos por MVP
  - 1 ponto por vitória

## Migração do Banco de Dados

### Para Atualizar o Banco de Dados

Execute o script de migração localizado em `docs/migration-add-dm-status.sql`:

```sql
-- Via psql
\i docs/migration-add-dm-status.sql

-- Ou via Neon Console
-- Copie e cole o conteúdo do arquivo
```

### Verificação

Após executar a migração, verifique se o novo status está disponível:

```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'event_attendance'::regclass 
AND conname = 'event_attendance_status_check';
```

Você deve ver que o constraint agora inclui `'dm'` como uma opção válida.

## Impacto nas APIs

### API Alterada: `/api/groups/[groupId]/stats`

A resposta agora inclui campos adicionais no objeto `playerFrequency`:

```typescript
{
  playerFrequency: [
    {
      id: string;
      name: string;
      games_played: string;      // Jogos presentes
      games_dm: string;          // Jogos no DM (novo)
      games_absent: string;      // Jogos ausentes (novo)
      total_games: string;       // Total de jogos (novo)
      frequency_percentage: string;
    }
  ]
}
```

## Compatibilidade

- ✅ Compatível com dados existentes
- ✅ Não quebra funcionalidades anteriores
- ✅ Migração pode ser executada em banco de dados com dados

## Próximos Passos

1. Execute a migração do banco de dados
2. Teste a funcionalidade de marcar jogadores como DM em eventos
3. Verifique se o ranking geral está exibindo os jogos corretamente
4. Confirme que a aba de frequência mostra todas as colunas

## Suporte

Para questões ou problemas, abra uma issue no repositório.
