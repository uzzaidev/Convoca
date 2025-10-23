# Scripts de Banco de Dados

## Diferença importante: Neon vs Autenticação do App

### 🔐 Neon Authentication (DATABASE_URL)
- **O que é**: Credenciais para o Neon acessar o banco de dados PostgreSQL
- **Usado por**: Conexão com o banco (connection string)
- **Não é**: Sistema de login de usuários do app
- **Configuração**: Variável `DATABASE_URL` no `.env`

### 👤 Autenticação do App (Login/Senha dos Usuários)
- **O que é**: Sistema de login/senha para usuários do seu app
- **Usado por**: NextAuth com credenciais (email e senha)
- **Armazenado em**: Tabela `users` no banco de dados
- **Login em**: `/auth/signin` e registro em `/auth/signup`

---

## Scripts Disponíveis

### 1. `create-users-table.sql` (Script Standalone)
Script para criar **apenas** a tabela de usuários do app.

**Quando usar**:
- Quando você só precisa da tabela de usuários
- Para um setup rápido do sistema de autenticação
- Se você já tem outras tabelas e só quer adicionar usuários

**Como executar**:
```bash
# Opção 1: No Neon SQL Editor
# Copie e cole o conteúdo do arquivo no editor e execute

# Opção 2: Via CLI do Neon
neon sql < src/db/create-users-table.sql

# Opção 3: Via psql
psql $DATABASE_URL -f src/db/create-users-table.sql
```

### 2. `schema.sql` (Schema Completo)
Schema completo do app incluindo todas as tabelas (users, groups, events, etc.)

**Quando usar**:
- Setup inicial completo do app
- Reset completo do banco de dados
- Produção/deployment inicial

**Como executar**:
```bash
# Opção 1: No Neon SQL Editor
# Copie e cole o conteúdo do arquivo no editor e execute

# Opção 2: Via CLI do Neon
neon sql < src/db/schema.sql

# Opção 3: Via psql
psql $DATABASE_URL -f src/db/schema.sql
```

---

## Estrutura da Tabela Users

```sql
users (
  id UUID PRIMARY KEY,              -- ID único do usuário
  name VARCHAR(255),                -- Nome completo
  email VARCHAR(255) UNIQUE,        -- Email (usado para login)
  email_verified TIMESTAMP,         -- Data de verificação do email
  password_hash TEXT,               -- Hash bcrypt da senha
  image TEXT,                       -- URL da foto do perfil
  created_at TIMESTAMP,             -- Data de criação
  updated_at TIMESTAMP              -- Data da última atualização
)
```

## Fluxo de Registro e Login

### Registro de Novo Usuário
1. Usuário acessa `/auth/signup`
2. Preenche: nome, email, senha
3. Frontend envia POST para `/api/auth/signup`
4. API valida dados com Zod
5. API cria hash bcrypt da senha
6. API insere registro na tabela `users`
7. Usuário é redirecionado para `/auth/signin`

### Login
1. Usuário acessa `/auth/signin`
2. Digita email e senha
3. NextAuth busca usuário na tabela `users` pelo email
4. Compara senha digitada com `password_hash` usando bcrypt
5. Se correto, cria sessão JWT
6. Redireciona para `/dashboard`

## Verificar se a Tabela Existe

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
);
```

## Ver Usuários Cadastrados

```sql
SELECT id, name, email, email_verified, created_at 
FROM users 
ORDER BY created_at DESC;
```

## Resetar Senha de Usuário (Manualmente)

```bash
# 1. Gerar hash bcrypt da nova senha
# Use: https://bcrypt-generator.com/ com 10 rounds
# Ou em Node.js:
node -e "console.log(require('bcryptjs').hashSync('nova_senha', 10))"

# 2. Atualizar no banco
UPDATE users 
SET password_hash = '$2a$10$...' 
WHERE email = 'usuario@example.com';
```

## Troubleshooting

### "Tabela users não existe"
Execute o script `create-users-table.sql` ou `schema.sql`

### "Email já cadastrado"
O email deve ser único. Use outro email ou delete o usuário existente.

### "Erro ao conectar no banco"
Verifique se `DATABASE_URL` está configurada corretamente no `.env`

### "Senha incorreta no login"
- Verifique se o `password_hash` não é NULL no banco
- Confirme que a senha tem pelo menos 6 caracteres
- Tente criar um novo usuário para testar
