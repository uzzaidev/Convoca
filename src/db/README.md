# 📁 Database - Convoca App# Scripts de Banco de Dados



Diretório de gerenciamento do banco de dados PostgreSQL (Neon).## Diferença importante: Neon vs Autenticação do App



## 📋 Estrutura de Arquivos### 🔐 Neon Authentication (DATABASE_URL)

- **O que é**: Credenciais para o Neon acessar o banco de dados PostgreSQL

```- **Usado por**: Conexão com o banco (connection string)

src/db/- **Não é**: Sistema de login de usuários do app

├── README.md                    # Este arquivo - guia rápido- **Configuração**: Variável `DATABASE_URL` no `.env`

├── MIGRATION_WORKFLOW.md        # Guia completo de migrations

├── schema.sql                   # Schema atual do banco### 👤 Autenticação do App (Login/Senha dos Usuários)

├── client.ts                    # Cliente Neon (@neondatabase/serverless)- **O que é**: Sistema de login/senha para usuários do seu app

├── backup-neon.bat             # Script de backup (Windows)- **Usado por**: NextAuth com credenciais (email e senha)

├── create-migration.ps1        # Helper para criar migrations- **Armazenado em**: Tabela `users` no banco de dados

├── apply-migrations.ps1        # Helper para aplicar migrations- **Login em**: `/auth/signin` e registro em `/auth/signup`

├── migrations/                 # Migrations SQL (versionamento)

│   └── 00000000000000_example_add_phone_to_users.sql---

└── backups/                    # Backups locais (não commitar)

    └── .gitkeep## Scripts Disponíveis

```

### 1. `create-users-table.sql` (Script Standalone)

## 🚀 Quick StartScript para criar **apenas** a tabela de usuários do app.



### 1. Fazer Backup do Banco**Quando usar**:

- Quando você só precisa da tabela de usuários

Antes de qualquer alteração estrutural:- Para um setup rápido do sistema de autenticação

- Se você já tem outras tabelas e só quer adicionar usuários

```powershell

cd src\db**Como executar**:

.\backup-neon.bat```bash

```# Opção 1: No Neon SQL Editor

# Copie e cole o conteúdo do arquivo no editor e execute

Isso cria 3 arquivos na pasta `backups/`:

- `convoca_full_TIMESTAMP.sql` (completo)# Opção 2: Via CLI do Neon

- `convoca_structure_TIMESTAMP.sql` (apenas estrutura)neon sql < src/db/create-users-table.sql

- `convoca_data_TIMESTAMP.sql` (apenas dados)

# Opção 3: Via psql

### 2. Criar Nova Migrationpsql $DATABASE_URL -f src/db/create-users-table.sql

```

```powershell

# Da raiz do projeto### 2. `schema.sql` (Schema Completo)

.\src\db\create-migration.ps1 "add_verified_column"Schema completo do app incluindo todas as tabelas (users, groups, events, etc.)



# Isso cria: src/db/migrations/20251030143000_add_verified_column.sql**Quando usar**:

```- Setup inicial completo do app

- Reset completo do banco de dados

### 3. Editar a Migration- Produção/deployment inicial



Abra o arquivo gerado e adicione seu SQL:**Como executar**:

```bash

```sql# Opção 1: No Neon SQL Editor

BEGIN;# Copie e cole o conteúdo do arquivo no editor e execute



ALTER TABLE public.users # Opção 2: Via CLI do Neon

ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;neon sql < src/db/schema.sql



CREATE INDEX IF NOT EXISTS idx_users_verified # Opção 3: Via psql

ON public.users(verified);psql $DATABASE_URL -f src/db/schema.sql

```

COMMIT;

```---



### 4. Aplicar Migration## Estrutura da Tabela Users



```powershell```sql

# Aplicar migration específicausers (

psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -f "src\db\migrations\20251030143000_add_verified_column.sql"  id UUID PRIMARY KEY,              -- ID único do usuário

  name VARCHAR(255),                -- Nome completo

# OU aplicar todas as migrations pendentes  email VARCHAR(255) UNIQUE,        -- Email (usado para login)

.\src\db\apply-migrations.ps1  email_verified TIMESTAMP,         -- Data de verificação do email

```  password_hash TEXT,               -- Hash bcrypt da senha

  image TEXT,                       -- URL da foto do perfil

### 5. Verificar no Banco  created_at TIMESTAMP,             -- Data de criação

  updated_at TIMESTAMP              -- Data da última atualização

```powershell)

# Conectar ao banco```

psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

## Fluxo de Registro e Login

# Ver estrutura da tabela

\d+ users### Registro de Novo Usuário

1. Usuário acessa `/auth/signup`

# Sair2. Preenche: nome, email, senha

\q3. Frontend envia POST para `/api/auth/signup`

```4. API valida dados com Zod

5. API cria hash bcrypt da senha

### 6. Commitar no Git6. API insere registro na tabela `users`

7. Usuário é redirecionado para `/auth/signin`

```powershell

git add src/db/migrations/### Login

git commit -m "feat: add verified column to users"1. Usuário acessa `/auth/signin`

git push2. Digita email e senha

```3. NextAuth busca usuário na tabela `users` pelo email

4. Compara senha digitada com `password_hash` usando bcrypt

## 📦 Scripts Disponíveis5. Se correto, cria sessão JWT

6. Redireciona para `/dashboard`

### `backup-neon.bat`

## Verificar se a Tabela Existe

Cria backups do banco Neon PostgreSQL.

```sql

**Uso:**SELECT EXISTS (

```powershell  SELECT FROM information_schema.tables 

.\src\db\backup-neon.bat  WHERE table_schema = 'public' 

```  AND table_name = 'users'

);

**Resultado:**```

- Backup completo (estrutura + dados)

- Backup apenas estrutura## Ver Usuários Cadastrados

- Backup apenas dados

```sql

**Local:** `src/db/backups/`SELECT id, name, email, email_verified, created_at 

FROM users 

### `create-migration.ps1`ORDER BY created_at DESC;

```

Cria novo arquivo de migration com template.

## Resetar Senha de Usuário (Manualmente)

**Uso:**

```powershell```bash

.\src\db\create-migration.ps1 "nome_da_migration"# 1. Gerar hash bcrypt da nova senha

```# Use: https://bcrypt-generator.com/ com 10 rounds

# Ou em Node.js:

**Exemplo:**node -e "console.log(require('bcryptjs').hashSync('nova_senha', 10))"

```powershell

.\src\db\create-migration.ps1 "add_phone_to_users"# 2. Atualizar no banco

# Cria: src/db/migrations/20251030150000_add_phone_to_users.sqlUPDATE users 

```SET password_hash = '$2a$10$...' 

WHERE email = 'usuario@example.com';

### `apply-migrations.ps1````



Aplica todas as migrations na pasta `migrations/` em ordem.## Troubleshooting



**Uso:**### "Tabela users não existe"

```powershellExecute o script `create-users-table.sql` ou `schema.sql`

.\src\db\apply-migrations.ps1

```### "Email já cadastrado"

O email deve ser único. Use outro email ou delete o usuário existente.

**Comportamento:**

- Lista todas as migrations encontradas### "Erro ao conectar no banco"

- Pede confirmaçãoVerifique se `DATABASE_URL` está configurada corretamente no `.env`

- Aplica em ordem cronológica (por timestamp)

- Para na primeira que falhar### "Senha incorreta no login"

- Verifique se o `password_hash` não é NULL no banco

## 🗃️ Conexão com o Banco- Confirme que a senha tem pelo menos 6 caracteres

- Tente criar um novo usuário para testar

### Connection String (Pooled)

```
postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

### Conectar via psql

```powershell
psql "postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Executar Query Rápida

```powershell
psql "postgresql://..." -c "SELECT COUNT(*) FROM users;"
```

### Exportar Schema Atual

```powershell
$env:PGPASSWORD = "REDACTED_PASSWORD"
pg_dump -h ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech -U neondb_owner -d neondb -s -f "src\db\schema_current.sql"
```

## 🔄 Workflow de Migrations

```
┌────────────────────────────────────────┐
│  MUDANÇA NO BANCO?                     │
│                                        │
│  1. .\backup-neon.bat                 │
│  2. .\create-migration.ps1 "nome"     │
│  3. Editar arquivo .sql gerado        │
│  4. Aplicar: psql ... -f migration.sql│
│  5. Verificar: \d+ tabela             │
│  6. git commit + push                  │
└────────────────────────────────────────┘
```

## 📋 Comandos psql Úteis

Dentro do psql (após conectar):

```sql
-- Listar tabelas
\dt

-- Listar tabelas com detalhes
\dt+

-- Ver estrutura de uma tabela
\d+ users

-- Listar índices
\di+

-- Listar funções
\df+

-- Sair
\q
```

## ✅ Boas Práticas

1. **SEMPRE fazer backup antes de migrations arriscadas**
   ```powershell
   .\src\db\backup-neon.bat
   ```

2. **Use transações (BEGIN/COMMIT) nas migrations**
   ```sql
   BEGIN;
   ALTER TABLE users ADD COLUMN phone VARCHAR(20);
   COMMIT;
   ```

3. **Use IF NOT EXISTS / IF EXISTS para idempotência**
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
   DROP INDEX IF EXISTS idx_users_phone;
   ```

4. **Adicione comentários explicativos**
   ```sql
   COMMENT ON COLUMN users.phone IS 'Telefone do usuário';
   ```

5. **Inclua rollback comentado no arquivo**
   ```sql
   -- Rollback:
   -- BEGIN;
   -- ALTER TABLE users DROP COLUMN phone;
   -- COMMIT;
   ```

6. **Nunca edite migrations já aplicadas**
   - Se errou, crie uma NOVA migration para corrigir

7. **Commite as migrations no Git**
   - São parte do histórico do projeto

## ⚠️ O Que NÃO Fazer

- ❌ Executar SQL direto no Neon Console (use migrations)
- ❌ Editar migrations já aplicadas
- ❌ Deletar arquivos de migration
- ❌ Esquecer de fazer backup antes de mudanças grandes
- ❌ Usar migrations para dados de produção (use seeds)

## 🔧 Pré-requisitos

### PostgreSQL Client Tools

Instale `psql` e `pg_dump`:

```powershell
# Opção 1: Scoop (recomendado)
scoop install postgresql

# Opção 2: Download direto
# https://www.postgresql.org/download/windows/
```

Verifique a instalação:

```powershell
psql --version
pg_dump --version
```

## 📚 Mais Informações

Para guia completo e exemplos avançados, leia:

**[MIGRATION_WORKFLOW.md](./MIGRATION_WORKFLOW.md)**

Inclui:
- Exemplos de migrations (adicionar coluna, criar tabela, triggers)
- Como fazer rollback
- Checklist completo
- Scripts auxiliares avançados

## 🆘 Troubleshooting

### Erro: "psql: command not found"

Instale PostgreSQL client tools (ver seção Pré-requisitos).

### Erro: "connection refused"

Verifique se:
- Connection string está correta
- Senha está correta
- Neon project está ativo

### Erro: "permission denied"

Use a connection string com as credenciais corretas (`neondb_owner`).

### Migration falhou no meio

1. Verifique se usou `BEGIN/COMMIT` (transação)
2. Se não usou, o banco pode estar em estado inconsistente
3. Restaure backup:
   ```powershell
   psql "..." -f "src\db\backups\convoca_full_TIMESTAMP.sql"
   ```

## 📞 Ajuda

- Leia [MIGRATION_WORKFLOW.md](./MIGRATION_WORKFLOW.md)
- Consulte [Neon Docs](https://neon.tech/docs)
- Consulte [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Projeto Convoca App** | Database Management | Neon PostgreSQL
