# API Documentation - Peladeiros App

Documentação completa das API Routes do Peladeiros App.

## Base URL

- **Desenvolvimento**: `http://localhost:3000`
- **Produção**: `https://seu-dominio.vercel.app`

## Autenticação

Todas as rotas (exceto páginas públicas) requerem autenticação via NextAuth.

```javascript
// Headers necessários
{
  "Cookie": "next-auth.session-token=..."
}
```

---

## Grupos

### `GET /api/groups`

Lista todos os grupos do usuário autenticado.

**Response:**
```json
{
  "groups": [
    {
      "id": "uuid",
      "name": "Pelada do Domingo",
      "description": "Pelada semanal aos domingos",
      "privacy": "private",
      "photo_url": null,
      "created_at": "2025-01-15T10:00:00Z",
      "user_role": "admin"
    }
  ]
}
```

### `POST /api/groups`

Cria um novo grupo.

**Request Body:**
```json
{
  "name": "Pelada do Domingo",
  "description": "Pelada semanal aos domingos",
  "privacy": "private"
}
```

**Response:**
```json
{
  "group": {
    "id": "uuid",
    "name": "Pelada do Domingo",
    "inviteCode": "ABC12XYZ"
  }
}
```

### `GET /api/groups/:groupId`

Retorna detalhes de um grupo específico.

**Response:**
```json
{
  "group": {
    "id": "uuid",
    "name": "Pelada do Domingo",
    "userRole": "admin",
    "members": [
      {
        "id": "uuid",
        "name": "João Silva",
        "image": "https://...",
        "role": "admin",
        "is_goalkeeper": false,
        "base_rating": 7
      }
    ],
    "upcomingEvents": [
      {
        "id": "uuid",
        "starts_at": "2025-01-20T15:00:00Z",
        "status": "scheduled",
        "confirmed_count": 8
      }
    ]
  }
}
```

### `PATCH /api/groups/:groupId`

Atualiza informações do grupo (apenas admins).

**Request Body:**
```json
{
  "name": "Novo Nome",
  "description": "Nova descrição",
  "privacy": "public"
}
```

---

## Eventos

### `POST /api/events`

Cria um novo evento/pelada (apenas admins do grupo).

**Request Body:**
```json
{
  "groupId": "uuid",
  "startsAt": "2025-01-20T15:00:00Z",
  "venueId": "uuid",
  "maxPlayers": 10,
  "maxGoalkeepers": 2,
  "waitlistEnabled": true
}
```

**Response:**
```json
{
  "event": {
    "id": "uuid",
    "group_id": "uuid",
    "starts_at": "2025-01-20T15:00:00Z",
    "status": "scheduled"
  }
}
```

### `GET /api/events/:eventId`

Retorna detalhes completos de um evento.

**Response:**
```json
{
  "event": {
    "id": "uuid",
    "starts_at": "2025-01-20T15:00:00Z",
    "status": "scheduled",
    "group_name": "Pelada do Domingo",
    "venue_name": "Arena Vila",
    "userRole": "admin",
    "attendance": [
      {
        "user_id": "uuid",
        "user_name": "João Silva",
        "status": "yes",
        "role": "line"
      }
    ],
    "teams": null
  }
}
```

---

## RSVP (Confirmação de Presença)

### `POST /api/events/:eventId/rsvp`

Confirma ou recusa presença em um evento.

**Request Body:**
```json
{
  "status": "yes",
  "role": "line"
}
```

**Valores possíveis:**
- `status`: "yes", "no", "waitlist"
- `role`: "gk" (goleiro), "line" (linha)

**Response:**
```json
{
  "attendance": {
    "id": "uuid",
    "event_id": "uuid",
    "user_id": "uuid",
    "status": "yes",
    "role": "line"
  }
}
```

**Notas:**
- Se o evento estiver cheio, status será automaticamente mudado para "waitlist"
- Quando alguém recusa, o primeiro da fila de espera é promovido automaticamente

---

## Sorteio de Times

### `POST /api/events/:eventId/draw`

Sorteia times para o evento (apenas admins).

**Request Body:**
```json
{
  "numTeams": 2
}
```

**Response:**
```json
{
  "teams": [
    {
      "id": "uuid",
      "name": "Time A",
      "seed": 0,
      "members": [
        {
          "user_id": "uuid",
          "name": "João Silva",
          "role": "gk",
          "base_rating": 7
        }
      ]
    }
  ]
}
```

**Algoritmo (v1):**
- Separação automática de goleiros em times diferentes
- Distribuição aleatória dos jogadores de linha
- Balanceamento numérico dos times

---

## Ações do Jogo

### `GET /api/events/:eventId/actions`

Lista todas as ações registradas em um evento.

**Response:**
```json
{
  "actions": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "actor_user_id": "uuid",
      "actor_name": "João Silva",
      "action_type": "goal",
      "team_id": "uuid",
      "team_name": "Time A",
      "minute": 15,
      "created_at": "2025-01-20T15:15:00Z"
    }
  ]
}
```

### `POST /api/events/:eventId/actions`

Registra uma ação durante o jogo (apenas admins).

**Request Body:**
```json
{
  "actorUserId": "uuid",
  "actionType": "goal",
  "teamId": "uuid",
  "minute": 15,
  "subjectUserId": "uuid",
  "metadata": {}
}
```

**Tipos de ação (`actionType`):**
- `goal` - Gol
- `assist` - Assistência
- `save` - Defesa (goleiro)
- `tackle` - Desarme
- `error` - Falha
- `yellow_card` - Cartão amarelo
- `red_card` - Cartão vermelho
- `period_start` - Início de período
- `period_end` - Fim de período

**Response:**
```json
{
  "action": {
    "id": "uuid",
    "event_id": "uuid",
    "actor_user_id": "uuid",
    "action_type": "goal"
  }
}
```

---

## Avaliações de Jogadores

### `GET /api/events/:eventId/ratings`

Lista as avaliações médias dos jogadores em um evento.

**Response:**
```json
{
  "ratings": [
    {
      "rated_user_id": "uuid",
      "player_name": "João Silva",
      "avg_rating": "8.5",
      "rating_count": 10,
      "all_tags": ["mvp", "garcom"]
    }
  ]
}
```

### `POST /api/events/:eventId/ratings`

Submete avaliação de um jogador (apenas participantes confirmados).

**Request Body:**
```json
{
  "ratedUserId": "uuid",
  "score": 8,
  "tags": ["mvp", "garcom"]
}
```

**Tags disponíveis:**
- `mvp` - Melhor jogador
- `pereba` - Pior jogador
- `paredao` - Melhor goleiro
- `garcom` - Mais assistências
- `artilheiro` - Mais gols

**Regras:**
- Não pode avaliar a si mesmo
- Precisa ter confirmado presença ("yes")
- Pode atualizar sua avaliação (upsert)

**Response:**
```json
{
  "rating": {
    "id": "uuid",
    "event_id": "uuid",
    "rater_user_id": "uuid",
    "rated_user_id": "uuid",
    "score": 8,
    "tags": ["mvp"]
  }
}
```

---

## Rankings

### `GET /api/groups/:groupId/rankings`

Lista o ranking dos jogadores de um grupo com estatísticas agregadas.

**Response:**
```json
{
  "rankings": [
    {
      "user_id": "uuid",
      "player_name": "João Silva",
      "player_image": "https://...",
      "base_rating": 7,
      "games_played": 15,
      "goals": 23,
      "assists": 12,
      "avg_rating": "8.50",
      "wins": 10,
      "win_rate": "66.67",
      "mvp_count": 3,
      "performance_score": "245.50"
    }
  ]
}
```

**Métricas Calculadas:**
- `games_played` - Número de jogos disputados
- `goals` - Total de gols marcados
- `assists` - Total de assistências
- `avg_rating` - Média de avaliações recebidas (0-10)
- `wins` - Número de vitórias
- `win_rate` - Percentual de vitórias (%)
- `mvp_count` - Número de vezes escolhido como MVP
- `performance_score` - Score ponderado:
  - Jogos: 1 ponto cada
  - Gols: 3 pontos cada
  - Assistências: 2 pontos cada
  - Rating médio: 5 pontos por ponto de rating
  - Vitórias: 5 pontos cada
  - MVPs: 10 pontos cada

**Ordenação:** Por `performance_score` (decrescente), depois `avg_rating`, depois `goals`

**Notas:**
- Apenas jogadores com pelo menos 1 jogo disputado aparecem no ranking
- Requer ser membro do grupo

---

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos (veja `details` para erros de validação)
- `401` - Não autenticado
- `403` - Sem permissão (ex: não é admin do grupo)
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

## Formato de Erros

```json
{
  "error": "Mensagem de erro amigável",
  "details": {
    "fieldErrors": {
      "name": ["Nome é obrigatório"]
    }
  }
}
```

---

## Webhooks e Realtime (Fase 2)

*Será implementado na Fase 2 com Pusher/Ably para:*
- Atualizações de placar em tempo real
- Notificações de confirmação/recusa
- Updates da fila de espera

---

## Rate Limiting (Futuro)

*Será implementado com Upstash Redis:*
- 100 requisições por minuto por usuário
- 1000 requisições por hora por IP

---

## Próximas APIs (Roadmap)

### Fase 2
- `POST /api/notifications/subscribe` - Subscrever notificações push
- `POST /api/finance/charges` - Criar cobrança
- `POST /api/finance/transactions` - Registrar pagamento

### Fase 3
- `POST /api/groups/:groupId/events/recurring` - Eventos recorrentes
- `GET /api/users/:userId/stats` - Estatísticas do jogador
- `POST /api/tournaments` - Criar torneio
