# Migração do Banco de Dados - Stack Auth para Neon Auth

Este documento descreve como migrar o banco de dados do Peladeiros para suportar a nova autenticação com NextAuth v5.

## Mudanças no Schema

A principal mudança é a adição do campo `password_hash` na tabela `users`.

### Campo Adicionado

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

## Como Aplicar a Migração

### Opção 1: Via Neon Console (Recomendado)

1. Acesse o [Neon Console](https://console.neon.tech/)
2. Selecione seu projeto Peladeiros
3. Vá para a aba **SQL Editor**
4. Execute o seguinte comando:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

5. Clique em **Run** para executar
6. Verifique se o campo foi criado:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users';
```

### Opção 2: Via CLI do Neon

Se você tiver o CLI do Neon instalado:

```bash
# Conectar ao banco
psql $DATABASE_URL

# Executar migração
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

# Sair
\q
```

### Opção 3: Via Script SQL

Execute o arquivo de schema completo atualizado:

```bash
psql $DATABASE_URL < src/db/schema.sql
```

**Nota:** Isso só criará a coluna se ela não existir, devido ao `IF NOT EXISTS`.

## Migração de Usuários Existentes

Se você tem usuários existentes no sistema (criados via Stack Auth), eles **não terão senha** inicialmente.

### Opção 1: Pedir para os usuários criarem nova senha

1. Implementar funcionalidade de "Primeira senha" ou "Redefinir senha"
2. Enviar email para usuários existentes
3. Usuários definem senha na primeira vez que fizerem login

### Opção 2: Definir senha temporária

Para permitir que usuários existentes façam login imediatamente:

```sql
-- Gerar hash bcrypt para senha temporária (ex: "mudar123")
-- Use o script Node.js abaixo para gerar o hash

UPDATE users 
SET password_hash = '$2a$10$exemplo_hash_bcrypt_aqui'
WHERE password_hash IS NULL;
```

#### Script para Gerar Hash (Node.js)

Crie um arquivo `generate-hash.js`:

```javascript
const bcrypt = require('bcryptjs');

const password = 'mudar123'; // Senha temporária
const hash = bcrypt.hashSync(password, 10);

console.log('Hash gerado:');
console.log(hash);
```

Execute:

```bash
node generate-hash.js
```

Depois, use o hash gerado no UPDATE acima.

### Opção 3: Limpar usuários antigos

Se você estiver em ambiente de desenvolvimento ou não tiver usuários importantes:

```sql
-- CUIDADO: Isso apagará todos os usuários
TRUNCATE TABLE users CASCADE;
```

## Verificação Pós-Migração

Após aplicar a migração, verifique:

### 1. Schema da tabela users

```sql
\d users
```

Deve mostrar algo como:

```
                          Table "public.users"
     Column      |            Type             | Nullable | Default
-----------------+-----------------------------+----------+---------
 id              | uuid                        | not null | uuid_generate_v4()
 name            | character varying(255)      | not null |
 email           | character varying(255)      | not null |
 email_verified  | timestamp without time zone |          |
 password_hash   | text                        |          |
 image           | text                        |          |
 created_at      | timestamp without time zone |          | now()
 updated_at      | timestamp without time zone |          | now()
```

### 2. Testar criação de novo usuário

Via interface web:
1. Acesse `/auth/signup`
2. Preencha o formulário
3. Crie uma conta
4. Verifique se o usuário foi criado:

```sql
SELECT id, name, email, password_hash IS NOT NULL as has_password
FROM users
ORDER BY created_at DESC
LIMIT 5;
```

### 3. Testar login

1. Acesse `/auth/signin`
2. Digite email e senha do usuário criado
3. Verifique se consegue fazer login
4. Deve ser redirecionado para `/dashboard`

## Rollback (Reverter Migração)

Se precisar reverter a migração:

```sql
-- Remover coluna password_hash
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
```

**ATENÇÃO:** Isso apagará todas as senhas dos usuários! Use apenas se necessário.

## Problemas Comuns

### "column password_hash does not exist"

**Solução:** Execute a migração novamente.

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

### Usuários antigos não conseguem fazer login

**Causa:** Usuários criados com Stack Auth não têm `password_hash`.

**Solução:** 
- Use uma das opções de migração de usuários acima
- Ou peça para o usuário se registrar novamente

### "Email já cadastrado"

**Causa:** Email já existe no banco (de usuário antigo).

**Soluções:**
1. Definir senha para o usuário existente (opção 2 acima)
2. Deletar o usuário antigo e criar novo:

```sql
DELETE FROM users WHERE email = 'email@exemplo.com';
```

## Checklist de Migração

- [ ] Fazer backup do banco de dados
- [ ] Executar migração (adicionar coluna password_hash)
- [ ] Verificar schema da tabela users
- [ ] Testar criação de novo usuário
- [ ] Testar login com novo usuário
- [ ] Decidir estratégia para usuários existentes
- [ ] Aplicar migração de usuários (se necessário)
- [ ] Testar login com usuário migrado (se aplicável)
- [ ] Atualizar variáveis de ambiente (remover Stack Auth, adicionar NextAuth)
- [ ] Fazer deploy das mudanças de código

## Backup do Banco de Dados

Antes de fazer qualquer migração, faça backup:

### Via Neon Console

1. Acesse o Neon Console
2. Vá para Settings > Branching
3. Crie um novo branch como backup

### Via pg_dump

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Próximos Passos

Após a migração bem-sucedida:

1. Atualizar variáveis de ambiente no Vercel/produção
2. Fazer deploy da nova versão do código
3. Notificar usuários sobre mudanças (se houver)
4. Monitorar logs para erros de autenticação
5. Implementar recuperação de senha (futuro)

## Suporte

Se encontrar problemas durante a migração:

1. Verifique os logs do Neon Console
2. Revise a documentação em [NEON_AUTH_GUIDE.md](./NEON_AUTH_GUIDE.md)
3. Execute as queries de verificação acima
4. Em último caso, restaure o backup
