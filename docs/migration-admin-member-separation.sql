-- Migration: Implementação completa da separação entre membros e administradores
-- Data: 2025-10-29
-- Descrição: Este arquivo documenta a estrutura de permissões para admin vs member

-- ============================================================================
-- ESTRUTURA JÁ EXISTENTE (não precisa rodar novamente)
-- ============================================================================

-- A tabela group_members já possui a coluna 'role' com CHECK constraint
-- CREATE TABLE group_members (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
--   role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
--   ...
-- );

-- ============================================================================
-- PERMISSÕES POR ROLE
-- ============================================================================

-- ADMINISTRADOR (role = 'admin'):
-- ✅ Criar eventos (POST /api/events)
-- ✅ Editar eventos (PATCH /api/events/:eventId)
-- ✅ Cancelar eventos (DELETE /api/events/:eventId)
-- ✅ Sortear times (POST /api/events/:eventId/draw)
-- ✅ Registrar ações de jogo (POST /api/events/:eventId/actions)
-- ✅ Editar grupo (PATCH /api/groups/:groupId)
-- ✅ Gerar convites (POST /api/groups/:groupId/invites)
-- ✅ Listar convites (GET /api/groups/:groupId/invites)
-- ✅ Deletar convites (DELETE /api/groups/:groupId/invites/:inviteId)
-- ✅ Promover/remover admin (PATCH /api/groups/:groupId/members/:userId)
-- ✅ Remover membros (DELETE /api/groups/:groupId/members/:userId)

-- MEMBRO (role = 'member'):
-- ✅ Ver detalhes do grupo (GET /api/groups/:groupId)
-- ✅ Ver eventos do grupo (GET /api/events/:eventId)
-- ✅ Fazer RSVP em eventos (POST /api/events/:eventId/rsvp)
-- ✅ Avaliar jogadores (POST /api/events/:eventId/ratings)
-- ✅ Ver estatísticas (GET /api/groups/:groupId/stats)
-- ✅ Ver rankings (GET /api/groups/:groupId/rankings)

-- QUALQUER USUÁRIO AUTENTICADO:
-- ✅ Criar novo grupo (POST /api/groups) - se torna admin automaticamente
-- ✅ Entrar em grupo com código (POST /api/groups/join) - se torna member

-- ============================================================================
-- VERIFICAÇÕES DE SEGURANÇA IMPLEMENTADAS
-- ============================================================================

-- 1. Todos os endpoints de admin verificam: membership.role === 'admin'
-- 2. Convites verificam:
--    - Código válido
--    - Não expirado (expires_at)
--    - Limite de usos não excedido (max_uses)
--    - Usuário ainda não é membro
-- 3. Gerenciamento de membros:
--    - Admin não pode remover a si mesmo
--    - Apenas admin pode alterar roles
--    - Apenas admin pode remover membros

-- ============================================================================
-- ÍNDICES EXISTENTES PARA PERFORMANCE
-- ============================================================================

-- CREATE INDEX idx_group_members_user ON group_members(user_id);
-- CREATE INDEX idx_group_members_group ON group_members(group_id);

-- ============================================================================
-- NOTAS DE IMPLEMENTAÇÃO
-- ============================================================================

-- 1. Quando um grupo é criado, o criador é automaticamente adicionado como admin
-- 2. DELETE de evento não remove do banco, apenas marca status = 'canceled'
-- 3. Convites incrementam used_count quando utilizados
-- 4. Ao entrar no grupo via convite, user wallet é criado se não existir
-- 5. Todas as operações são logadas com pino logger

-- ============================================================================
-- ENDPOINTS IMPLEMENTADOS
-- ============================================================================

-- GERENCIAMENTO DE CONVITES:
-- POST   /api/groups/:groupId/invites              (admin) - Criar convite
-- GET    /api/groups/:groupId/invites              (admin) - Listar convites
-- DELETE /api/groups/:groupId/invites/:inviteId    (admin) - Deletar convite
-- POST   /api/groups/join                          (any)   - Entrar com código

-- GERENCIAMENTO DE MEMBROS:
-- PATCH  /api/groups/:groupId/members/:userId      (admin) - Alterar role
-- DELETE /api/groups/:groupId/members/:userId      (admin) - Remover membro

-- GERENCIAMENTO DE EVENTOS:
-- PATCH  /api/events/:eventId                      (admin) - Editar evento
-- DELETE /api/events/:eventId                      (admin) - Cancelar evento

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
