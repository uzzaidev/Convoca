# Documentação: Separação entre Membros e Administradores

## Resumo da Implementação

Este documento descreve a implementação completa da separação de permissões entre membros (members) e administradores (admins) nos grupos do Peladeiros.

## Estrutura de Dados

### Tabela `group_members` (já existente)

```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_goalkeeper BOOLEAN DEFAULT FALSE,
  base_rating INTEGER DEFAULT 5 CHECK (base_rating >= 0 AND base_rating <= 10),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);
```

## Novos Endpoints Implementados

### 1. Gerenciamento de Convites (Admin Only)

#### `POST /api/groups/:groupId/invites`
Cria um novo convite para o grupo.

**Permissão:** Admin apenas

**Request Body:**
```json
{
  "expiresAt": "2025-12-31T23:59:59Z",  // opcional
  "maxUses": 10                          // opcional
}
```

**Response:**
```json
{
  "invite": {
    "id": "uuid",
    "code": "ABC123XYZ",
    "group_id": "uuid",
    "expires_at": "2025-12-31T23:59:59Z",
    "max_uses": 10,
    "used_count": 0,
    "created_at": "2025-10-29T22:00:00Z",
    "created_by": "uuid"
  }
}
```

#### `GET /api/groups/:groupId/invites`
Lista todos os convites do grupo.

**Permissão:** Admin apenas

**Response:**
```json
{
  "invites": [
    {
      "id": "uuid",
      "code": "ABC123XYZ",
      "expires_at": "2025-12-31T23:59:59Z",
      "max_uses": 10,
      "used_count": 5,
      "created_at": "2025-10-29T22:00:00Z",
      "created_by_name": "João Silva"
    }
  ]
}
```

#### `DELETE /api/groups/:groupId/invites/:inviteId`
Deleta um convite específico.

**Permissão:** Admin apenas

**Response:**
```json
{
  "message": "Convite deletado com sucesso"
}
```

### 2. Entrada no Grupo (Qualquer Usuário)

#### `POST /api/groups/join`
Permite que um usuário entre em um grupo usando um código de convite.

**Permissão:** Qualquer usuário autenticado

**Request Body:**
```json
{
  "code": "ABC123XYZ"
}
```

**Response:**
```json
{
  "message": "Você entrou no grupo com sucesso",
  "group": {
    "id": "uuid",
    "name": "Pelada do Fim de Semana",
    "description": "Grupo de futebol aos sábados",
    "privacy": "private"
  }
}
```

**Validações:**
- Código deve existir
- Convite não pode estar expirado
- Convite não pode ter excedido limite de usos
- Usuário não pode já ser membro do grupo

### 3. Gerenciamento de Membros (Admin Only)

#### `PATCH /api/groups/:groupId/members/:userId`
Altera o role de um membro (promove a admin ou remove de admin).

**Permissão:** Admin apenas

**Request Body:**
```json
{
  "role": "admin"  // ou "member"
}
```

**Response:**
```json
{
  "message": "Role do membro atualizado com sucesso",
  "member": {
    "id": "uuid",
    "user_id": "uuid",
    "group_id": "uuid",
    "role": "admin",
    "joined_at": "2025-10-29T22:00:00Z"
  }
}
```

#### `DELETE /api/groups/:groupId/members/:userId`
Remove um membro do grupo.

**Permissão:** Admin apenas

**Response:**
```json
{
  "message": "Membro removido do grupo com sucesso"
}
```

**Validações:**
- Admin não pode remover a si mesmo
- Usuário deve ser membro do grupo

### 4. Gerenciamento de Eventos (Admin Only)

#### `PATCH /api/events/:eventId`
Edita um evento existente.

**Permissão:** Admin apenas

**Request Body:**
```json
{
  "startsAt": "2025-11-01T18:00:00Z",  // opcional
  "venueId": "uuid",                     // opcional
  "maxPlayers": 12,                      // opcional
  "maxGoalkeepers": 2,                   // opcional
  "waitlistEnabled": true,               // opcional
  "status": "scheduled"                  // opcional
}
```

**Response:**
```json
{
  "event": {
    "id": "uuid",
    "group_id": "uuid",
    "starts_at": "2025-11-01T18:00:00Z",
    "venue_id": "uuid",
    "max_players": 12,
    "max_goalkeepers": 2,
    "status": "scheduled",
    "waitlist_enabled": true,
    "created_by": "uuid",
    "created_at": "2025-10-29T22:00:00Z",
    "updated_at": "2025-10-29T23:00:00Z"
  }
}
```

#### `DELETE /api/events/:eventId`
Cancela um evento (marca como cancelado, não remove do banco).

**Permissão:** Admin apenas

**Response:**
```json
{
  "message": "Evento cancelado com sucesso"
}
```

**Nota:** O evento não é removido do banco de dados, apenas seu status é alterado para 'canceled'.

## Matriz de Permissões

| Ação | Admin | Member | Descrição |
|------|-------|--------|-----------|
| Ver grupo | ✅ | ✅ | GET /api/groups/:groupId |
| Editar grupo | ✅ | ❌ | PATCH /api/groups/:groupId |
| Criar evento | ✅ | ❌ | POST /api/events |
| Ver evento | ✅ | ✅ | GET /api/events/:eventId |
| Editar evento | ✅ | ❌ | PATCH /api/events/:eventId |
| Cancelar evento | ✅ | ❌ | DELETE /api/events/:eventId |
| Fazer RSVP | ✅ | ✅ | POST /api/events/:eventId/rsvp |
| Sortear times | ✅ | ❌ | POST /api/events/:eventId/draw |
| Registrar ações | ✅ | ❌ | POST /api/events/:eventId/actions |
| Avaliar jogadores | ✅ | ✅ | POST /api/events/:eventId/ratings |
| Criar convite | ✅ | ❌ | POST /api/groups/:groupId/invites |
| Ver convites | ✅ | ❌ | GET /api/groups/:groupId/invites |
| Deletar convite | ✅ | ❌ | DELETE /api/groups/:groupId/invites/:inviteId |
| Alterar role | ✅ | ❌ | PATCH /api/groups/:groupId/members/:userId |
| Remover membro | ✅ | ❌ | DELETE /api/groups/:groupId/members/:userId |
| Ver estatísticas | ✅ | ✅ | GET /api/groups/:groupId/stats |
| Ver rankings | ✅ | ✅ | GET /api/groups/:groupId/rankings |

## Fluxos de Uso

### Fluxo 1: Criar Grupo e Adicionar Membros

1. **Usuário cria grupo**
   - `POST /api/groups` → Se torna admin automaticamente
   - Sistema cria convite padrão automaticamente

2. **Admin gera convite personalizado** (opcional)
   - `POST /api/groups/:groupId/invites`
   - Define expiração e limite de usos

3. **Admin compartilha código do convite**
   - Código pode ser compartilhado fora do sistema (WhatsApp, etc)

4. **Novos usuários entram no grupo**
   - `POST /api/groups/join` com o código
   - Entram como members

5. **Admin promove membros a admin** (opcional)
   - `PATCH /api/groups/:groupId/members/:userId` com role='admin'

### Fluxo 2: Gerenciar Evento

1. **Admin cria evento**
   - `POST /api/events`

2. **Membros fazem RSVP**
   - `POST /api/events/:eventId/rsvp`

3. **Admin edita detalhes se necessário**
   - `PATCH /api/events/:eventId`

4. **Admin sorteia times**
   - `POST /api/events/:eventId/draw`

5. **Admin registra ações durante a partida**
   - `POST /api/events/:eventId/actions`

6. **Membros avaliam jogadores após a partida**
   - `POST /api/events/:eventId/ratings`

### Fluxo 3: Gerenciar Membros

1. **Admin visualiza membros do grupo**
   - `GET /api/groups/:groupId` (retorna lista de membros)

2. **Admin promove membro a admin**
   - `PATCH /api/groups/:groupId/members/:userId` com role='admin'

3. **Admin remove membro problemático**
   - `DELETE /api/groups/:groupId/members/:userId`

## Segurança

### Verificações Implementadas

1. **Autenticação:** Todos os endpoints requerem usuário autenticado
2. **Autorização:** Endpoints de admin verificam `membership.role === 'admin'`
3. **Validação de Convites:**
   - Código deve existir
   - Não pode estar expirado
   - Não pode exceder limite de usos
   - Usuário não pode já ser membro
4. **Proteções Especiais:**
   - Admin não pode remover a si mesmo
   - Eventos são cancelados, não deletados (soft delete)
   - Todas as operações são logadas

### Logging

Todas as operações administrativas são registradas com Pino logger incluindo:
- ID do usuário que executou a ação
- ID do recurso afetado (grupo, evento, membro)
- Timestamp da operação

## Compatibilidade

Esta implementação é **100% compatível** com o código existente:

- ✅ Não altera tabelas existentes
- ✅ Não quebra endpoints existentes
- ✅ Adiciona apenas novos endpoints
- ✅ Reutiliza estruturas e padrões existentes
- ✅ Segue convenções do projeto (Zod, SQL, NextAuth, etc)

## Exemplos de Uso

### Criar e gerenciar convite

```typescript
// Admin cria convite com expiração em 7 dias
const response = await fetch('/api/groups/abc123/invites', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxUses: 50
  })
});

const { invite } = await response.json();
console.log(`Código: ${invite.code}`); // Compartilhar este código
```

### Usuário entra no grupo

```typescript
// Usuário usa código recebido
const response = await fetch('/api/groups/join', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'ABC123XYZ'
  })
});

const { group } = await response.json();
console.log(`Entrou no grupo: ${group.name}`);
```

### Promover membro a admin

```typescript
// Admin promove membro
const response = await fetch('/api/groups/abc123/members/user456', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    role: 'admin'
  })
});

const { member } = await response.json();
console.log(`${member.user_id} agora é admin`);
```

### Editar evento

```typescript
// Admin altera horário e local do evento
const response = await fetch('/api/events/event789', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startsAt: '2025-11-01T19:00:00Z',
    venueId: 'venue456'
  })
});

const { event } = await response.json();
console.log(`Evento atualizado para ${event.starts_at}`);
```

## Testes Manuais Recomendados

1. **Criar grupo e verificar que criador é admin**
2. **Gerar convite e verificar que código funciona**
3. **Entrar com convite e verificar que usuário vira member**
4. **Tentar criar evento como member (deve falhar)**
5. **Promover member a admin e verificar que agora pode criar eventos**
6. **Remover membro e verificar que não tem mais acesso**
7. **Tentar usar convite expirado (deve falhar)**
8. **Tentar usar convite que atingiu max_uses (deve falhar)**
9. **Editar evento como admin e verificar mudanças**
10. **Cancelar evento e verificar status = 'canceled'**

## Arquivos Modificados/Criados

### Novos arquivos:
- `src/app/api/groups/[groupId]/invites/route.ts`
- `src/app/api/groups/[groupId]/invites/[inviteId]/route.ts`
- `src/app/api/groups/join/route.ts`
- `src/app/api/groups/[groupId]/members/[userId]/route.ts`
- `docs/migration-admin-member-separation.sql`

### Arquivos modificados:
- `src/app/api/events/[eventId]/route.ts` (adicionado PATCH e DELETE)

## Conclusão

A separação entre membros e administradores foi implementada com sucesso, fornecendo:

✅ Controle granular de permissões  
✅ Sistema robusto de convites  
✅ Gerenciamento completo de membros  
✅ Edição e cancelamento de eventos  
✅ Segurança e validações adequadas  
✅ Logging completo de operações  
✅ Compatibilidade com código existente  
✅ Build e lint sem erros  

A implementação segue as melhores práticas do projeto e está pronta para uso em produção.
