# Correções Implementadas - 11/02/2026

## 📋 Problemas Corrigidos

### 1. ⚽ Sorteio de Times - Exigência de Check-in

**Problema**: O sorteio de times exigia que os jogadores tivessem feito check-in físico (`checked_in_at IS NOT NULL`), mas o sistema apenas registrava a confirmação de presença, não o check-in.

**Sintoma**: Mensagem de erro "Necessário pelo menos 4 jogadores com check-in confirmado" mesmo tendo 17 jogadores confirmados.

**Solução**: 
- Removida a exigência de `checked_in_at IS NOT NULL` da query de sorteio
- Agora o sorteio funciona apenas com jogadores que confirmaram presença (`status = 'yes'`)
- Mensagem de erro atualizada para "Necessário pelo menos 4 jogadores confirmados para sortear times."

**Arquivo alterado**: 
- `src/app/api/events/[eventId]/draw/route.ts` (linhas 232-256)

---

### 2. 🔐 Funcionalidade "Esquecer Senha"

**Problema**: O link "Esqueceu a senha?" não funcionava (href="#").

**Solução**: Implementada funcionalidade completa de reset de senha com:

#### Arquivos Criados:

1. **Página de Solicitação de Reset**
   - `src/app/auth/forgot-password/page.tsx`
   - Interface para o usuário solicitar reset de senha
   - Formulário com validação de email

2. **API de Solicitação de Reset**
   - `src/app/api/auth/forgot-password/route.ts`
   - Gera token de reset válido por 1 hora
   - Em modo de desenvolvimento, exibe o link no console
   - Em produção, deve enviar email (TODO)

3. **API de Reset de Senha**
   - `src/app/api/auth/reset-password/route.ts`
   - Valida token e expira após uso
   - Atualiza senha com bcrypt hash
   - Limpa token após reset bem-sucedido

4. **Página de Reset de Senha**
   - `src/app/auth/reset-password/page.tsx`
   - Interface para definir nova senha
   - Validação de senha (mínimo 6 caracteres)
   - Confirmação de senha
   - Toggle para mostrar/ocultar senha
   - Redirecionamento automático para login após sucesso

5. **Migration SQL**
   - `src/db/migrations/20260211_add_password_reset_fields.sql`
   - Adiciona campos `reset_token` e `reset_token_expiry` à tabela `users`
   - Cria índice para busca rápida de tokens

#### Arquivo Atualizado:
- `src/app/auth/signin/page.tsx` - Link "Esqueceu a senha?" agora aponta para `/auth/forgot-password`

---

## 🚀 Como Aplicar as Mudanças

### 1. Executar Migration no Banco de Dados

Você precisa executar a migration para adicionar os campos necessários à tabela `users`.

#### Opção A: Via Neon Console (Recomendado)

1. Acesse seu projeto no [Neon Console](https://console.neon.tech/)
2. Vá para a aba "SQL Editor"
3. Execute o seguinte SQL:

```sql
-- Add reset_token and reset_token_expiry columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Add index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Comment on columns
COMMENT ON COLUMN users.reset_token IS 'Token for password reset (valid for 1 hour)';
COMMENT ON COLUMN users.reset_token_expiry IS 'Expiry timestamp for reset token';
```

#### Opção B: Via Script (Requer DATABASE_URL configurado)

```bash
# Configure DATABASE_URL se ainda não estiver
# Depois execute:
node run-password-reset-migration.mjs
```

### 2. Testar a Funcionalidade

1. **Testar Sorteio de Times**:
   - Acesse um evento com jogadores confirmados
   - Clique em "Sortear Times"
   - Deve funcionar com qualquer jogador que tenha `status = 'yes'`

2. **Testar Reset de Senha**:
   - Acesse `/auth/signin`
   - Clique em "Esqueceu a senha?"
   - Digite um email cadastrado
   - Em **modo desenvolvimento**, o link de reset aparecerá no console do servidor
   - Copie o link e acesse-o no navegador
   - Defina uma nova senha
   - Faça login com a nova senha

---

## 📝 Notas Importantes

### Modo Desenvolvimento
Em modo de desenvolvimento (`NODE_ENV=development`), o link de reset de senha é:
- Exibido no console do servidor (terminal)
- Incluído na resposta da API
- Não requer configuração de email

**Exemplo de log no console**:
```
===========================================
🔐 LINK DE REDEFINIÇÃO DE SENHA (DEV MODE)
===========================================
Email: usuario@exemplo.com
Nome: João Silva
Link: http://localhost:3000/auth/reset-password?token=abc123...
===========================================
```

### Modo Produção
Para produção, você precisará:
1. Configurar um serviço de email (SendGrid, AWS SES, Resend, etc.)
2. Implementar a função `sendPasswordResetEmail` no arquivo `src/app/api/auth/forgot-password/route.ts`
3. Remover ou condicionar o log do link no console

**TODO no código** (linha 54 do forgot-password/route.ts):
```typescript
// TODO: In production, send email with reset link
// await sendPasswordResetEmail(user.email, resetLink);
```

### Segurança
- Tokens são válidos por 1 hora
- Tokens são únicos e aleatórios (32 bytes)
- Tokens são removidos após uso
- A API sempre retorna a mesma mensagem (sucesso ou erro) para prevenir enumeração de emails
- Tokens expirados são automaticamente limpos ao tentar usá-los

---

## 🧪 Testes Recomendados

1. ✅ Confirmar presença em um evento
2. ✅ Sortear times com 4+ jogadores confirmados
3. ✅ Solicitar reset de senha com email válido
4. ✅ Solicitar reset de senha com email inválido (deve retornar mesma mensagem)
5. ✅ Usar link de reset válido
6. ✅ Tentar usar link de reset expirado
7. ✅ Tentar usar link de reset já usado
8. ✅ Fazer login com nova senha

---

## 📊 Impacto das Mudanças

### Sorteio de Times
- ✅ Corrigido bug que impedia sorteio
- ✅ Simplificada a lógica de validação
- ✅ Melhor mensagem de erro para usuários

### Reset de Senha
- ✅ Nova funcionalidade completa
- ✅ UX consistente com o resto do app
- ✅ Seguro e seguindo boas práticas
- ⚠️ Requer migração do banco de dados
- ⚠️ Em produção, requer configuração de email

---

## 🔄 Próximos Passos (Opcional)

1. **Envio de Email em Produção**
   - Integrar com serviço de email
   - Criar template de email HTML
   - Configurar variáveis de ambiente do serviço de email

2. **Melhorias Futuras**
   - Limpar tokens expirados automaticamente (cron job)
   - Adicionar limite de tentativas de reset
   - Adicionar autenticação de dois fatores
   - Histórico de alterações de senha

---

## 📞 Suporte

Se você encontrar problemas ao executar a migration ou testar as funcionalidades:
1. Verifique se o `DATABASE_URL` está configurado corretamente
2. Confirme que a migration foi executada com sucesso no Neon Console
3. Verifique os logs do servidor para mensagens de erro
4. Em desenvolvimento, verifique o console do terminal para o link de reset
