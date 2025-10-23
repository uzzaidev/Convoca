# Guia: Autenticação Neon vs Usuários do App

## 🎯 Entendendo a Confusão

Você estava certo em identificar a confusão! São duas coisas completamente diferentes:

### 1. Autenticação do Neon (Acesso ao Banco)
- **O que é**: Username e senha para o Neon acessar o banco PostgreSQL
- **Onde está**: Na variável `DATABASE_URL` do `.env`
- **Exemplo**: `postgresql://neondb_owner:senha123@host.neon.tech/neondb`
- **Usado por**: Biblioteca `@neondatabase/serverless` para executar queries SQL
- **Propósito**: Apenas conectar no banco de dados
- **Usuários**: Não são usuários do seu app, são credenciais técnicas do Neon

### 2. Login/Senha dos Usuários do App
- **O que é**: Sistema de autenticação para os usuários finais do seu app
- **Onde está**: Tabela `users` no banco de dados
- **Exemplo**: Um usuário cria conta com email `joao@email.com` e senha `senha123`
- **Usado por**: NextAuth v5 para fazer login no app
- **Propósito**: Controlar acesso dos usuários às funcionalidades
- **Usuários**: Pessoas que usam o app (jogadores, admins, etc.)

---

## ✅ O Que Já Está Implementado

Boa notícia: **tudo já está funcionando!** Aqui está o que já existe:

### 1. Tabela de Usuários ✅
**Localização**: `src/db/schema.sql` (linhas 8-17)

A tabela `users` já existe com:
- `id` - ID único do usuário
- `name` - Nome completo
- `email` - Email (usado para login)
- `password_hash` - Senha criptografada com bcrypt
- `email_verified` - Data de verificação do email
- `image` - Foto de perfil
- `created_at` e `updated_at` - Timestamps

### 2. Página de Registro ✅
**Localização**: `src/app/auth/signup/page.tsx`
**URL**: `http://localhost:3000/auth/signup`

Página com formulário que contém:
- Campo de nome
- Campo de email
- Campo de senha
- Campo de confirmar senha
- Botão "Criar conta"

### 3. API de Registro ✅
**Localização**: `src/app/api/auth/signup/route.ts`
**Endpoint**: `POST /api/auth/signup`

Esta API:
1. Recebe nome, email e senha do frontend
2. Valida os dados com Zod
3. Verifica se o email já existe
4. Cria hash bcrypt da senha (10 salt rounds)
5. Insere o usuário na tabela `users`
6. Retorna sucesso ou erro

### 4. Página de Login ✅
**Localização**: `src/app/auth/signin/page.tsx`
**URL**: `http://localhost:3000/auth/signin`

Página com formulário que contém:
- Campo de email
- Campo de senha
- Botão "Entrar"

### 5. Sistema de Autenticação ✅
**Localização**: `src/lib/auth.ts`
**Provider**: NextAuth v5 com Credentials

O sistema:
1. Recebe email e senha do formulário
2. Busca usuário na tabela `users` pelo email
3. Compara senha digitada com o `password_hash` usando bcrypt
4. Se correto, cria sessão JWT válida por 30 dias
5. Redireciona para `/dashboard`

---

## 📋 Arquivos Criados Agora

Para facilitar, foram criados 3 novos arquivos:

### 1. `src/db/create-users-table.sql`
Script SQL standalone para criar **apenas** a tabela de usuários.

**Quando usar**: 
- Se você quer criar só a tabela de usuários
- Setup rápido do sistema de autenticação

**Como executar**:
```bash
# No Neon SQL Editor
# Copie o conteúdo e execute

# Ou via CLI
neon sql < src/db/create-users-table.sql
```

### 2. `src/db/README.md`
Documentação completa sobre:
- Diferença entre Neon auth e app auth
- Como executar os scripts SQL
- Estrutura da tabela users
- Fluxo de registro e login
- Troubleshooting

### 3. Este arquivo (`GUIA_AUTENTICACAO.md`)
Explicação direta da confusão e como usar o sistema.

---

## 🚀 Como Usar o Sistema

### Passo 1: Criar a Tabela (Se Ainda Não Existe)

Você tem duas opções:

**Opção A - Só a Tabela de Usuários:**
```bash
# Execute este comando no terminal
neon sql < src/db/create-users-table.sql
```

**Opção B - Schema Completo (Recomendado):**
```bash
# Execute este comando para criar todas as tabelas
neon sql < src/db/schema.sql
```

**Opção C - Via Neon Console (Interface Web):**
1. Acesse https://console.neon.tech
2. Selecione seu projeto
3. Vá em "SQL Editor"
4. Copie o conteúdo de `src/db/create-users-table.sql`
5. Cole no editor e clique em "Run"

### Passo 2: Verificar Variáveis de Ambiente

Arquivo `.env.local` deve conter:

```bash
# Conexão com o banco (Neon)
DATABASE_URL=postgresql://...sua_connection_string...

# Autenticação do app (NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_secret_aqui_gerado_com_openssl
```

Para gerar o `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Passo 3: Iniciar o Servidor

```bash
npm run dev
```

### Passo 4: Criar Primeiro Usuário

1. Abra o navegador em `http://localhost:3000/auth/signup`
2. Preencha o formulário:
   - Nome: Seu Nome Completo
   - Email: seu@email.com
   - Senha: no mínimo 6 caracteres
   - Confirmar Senha: mesma senha
3. Clique em "Criar conta"
4. Se der certo, será redirecionado para `/auth/signin`
5. Faça login com seu email e senha
6. Será redirecionado para `/dashboard`

### Passo 5: Verificar Usuário no Banco

```sql
-- Execute no Neon SQL Editor para ver seus usuários
SELECT id, name, email, email_verified, created_at 
FROM users 
ORDER BY created_at DESC;
```

---

## 🔍 Testando a API Diretamente

Se quiser testar a API sem usar a interface:

```bash
# Criar usuário
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123"
  }'

# Resposta esperada:
# {
#   "success": true,
#   "user": {
#     "id": "uuid...",
#     "name": "João Silva",
#     "email": "joao@example.com"
#   }
# }
```

---

## 🎨 Fluxo Visual

```
┌─────────────────────────────────────────────────────────┐
│                   NEON DATABASE                         │
│  (Só para conectar no banco, não é login de usuário)   │
│                                                         │
│  DATABASE_URL = postgresql://user:pass@host/db         │
└─────────────────────────────────────────────────────────┘
                            │
                            │ Usa para executar SQL
                            ▼
┌─────────────────────────────────────────────────────────┐
│              TABELA USERS (no Postgres)                 │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │ id  │ name      │ email         │ password_hash│    │
│  ├───────────────────────────────────────────────┤    │
│  │ 1   │ João      │ joao@mail.com │ $2a$10$...  │    │
│  │ 2   │ Maria     │ maria@mail.com│ $2a$10$...  │    │
│  └───────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
                            │ NextAuth busca aqui
                            ▼
┌─────────────────────────────────────────────────────────┐
│              LOGIN DOS USUÁRIOS DO APP                  │
│                                                         │
│  1. Usuário digita email e senha em /auth/signin       │
│  2. NextAuth busca na tabela users                     │
│  3. Compara senha com password_hash (bcrypt)           │
│  4. Se correto, cria sessão JWT                        │
│  5. Redireciona para /dashboard                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Resumo do Que Foi Feito

| Item | Status | Localização |
|------|--------|-------------|
| Tabela `users` | ✅ Já existia | `src/db/schema.sql` |
| Página de registro | ✅ Já existia | `src/app/auth/signup/page.tsx` |
| API de registro | ✅ Já existia | `src/app/api/auth/signup/route.ts` |
| Página de login | ✅ Já existia | `src/app/auth/signin/page.tsx` |
| NextAuth config | ✅ Já existia | `src/lib/auth.ts` |
| Script SQL standalone | ✅ Criado agora | `src/db/create-users-table.sql` |
| Documentação DB | ✅ Criado agora | `src/db/README.md` |
| Este guia | ✅ Criado agora | `GUIA_AUTENTICACAO.md` |

---

## 🎓 Conclusão

**O sistema já estava funcionando!** A confusão era normal porque:

1. O Neon pede autenticação (DATABASE_URL) para conectar no banco
2. Mas isso não é o login dos usuários do app
3. O login dos usuários é feito com a tabela `users` e NextAuth

**Agora você tem**:
- ✅ Tabela de usuários funcionando
- ✅ Sistema completo de registro e login
- ✅ Script SQL para criar a tabela se necessário
- ✅ Documentação clara da diferença

**Para usar**:
1. Execute o script SQL se a tabela não existir
2. Acesse `/auth/signup` para criar conta
3. Acesse `/auth/signin` para fazer login
4. Pronto! 🎉

---

## 📚 Referências

- Documentação completa: [NEON_AUTH_GUIDE.md](./NEON_AUTH_GUIDE.md)
- Schema completo: [src/db/schema.sql](./src/db/schema.sql)
- Script standalone: [src/db/create-users-table.sql](./src/db/create-users-table.sql)
- Guia do DB: [src/db/README.md](./src/db/README.md)
