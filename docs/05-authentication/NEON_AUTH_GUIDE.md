# Neon Auth - Guia de Autenticação

Este documento descreve como funciona a autenticação no Peladeiros usando NextAuth v5 (Auth.js) com Neon Database.

## Visão Geral

O projeto utiliza **NextAuth v5** (também conhecido como Auth.js) para autenticação de usuários, com os seguintes recursos:

- ✅ **Autenticação por credenciais** (email e senha)
- ✅ **Registro de novos usuários**
- ✅ **Senhas criptografadas** com bcrypt
- ✅ **Sessões JWT** (não requer banco de sessões)
- ✅ **Proteção de rotas** via middleware
- ✅ **Usuários armazenados no Neon Database**

## Mudanças em Relação ao Stack Auth

### Removido
- ❌ Stack Auth (@stackframe/stack)
- ❌ Magic Link
- ❌ Dependência de serviços externos para autenticação
- ❌ Handler routes (/handler/sign-in, etc.)

### Adicionado
- ✅ NextAuth v5 (next-auth@beta)
- ✅ Autenticação por credenciais (email/senha)
- ✅ API de registro de usuários
- ✅ Páginas customizadas de login e registro
- ✅ Campo `password_hash` na tabela `users`

## Estrutura de Arquivos

```
src/
├── lib/
│   ├── auth.ts                    # Configuração principal do NextAuth
│   └── auth-helpers.ts            # Helpers para autenticação em APIs
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/
│   │       │   └── route.ts       # Handler do NextAuth
│   │       └── signup/
│   │           └── route.ts       # API de registro
│   └── auth/
│       ├── signin/
│       │   └── page.tsx           # Página de login
│       └── signup/
│           └── page.tsx           # Página de registro
└── middleware.ts                  # Middleware de proteção de rotas
```

## Variáveis de Ambiente

Configurar no `.env.local`:

```bash
# Database (Neon Postgres)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# NextAuth (Authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_secret_aqui
```

### Gerando NEXTAUTH_SECRET

Execute no terminal:

```bash
openssl rand -base64 32
```

## Schema do Banco de Dados

A tabela `users` foi atualizada para incluir o campo `password_hash`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  password_hash TEXT,              -- ← NOVO CAMPO
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Migração do Banco de Dados

Execute no Neon SQL Editor:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

## Como Criar Usuários

### 1. Via Interface Web (Recomendado)

Acesse `/auth/signup` e preencha o formulário:
- Nome completo
- Email
- Senha (mínimo 6 caracteres)
- Confirmação de senha

### 2. Via API

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

### 3. Via SQL Direto (Para Testes)

```sql
INSERT INTO users (name, email, password_hash, email_verified)
VALUES (
  'Admin User',
  'admin@peladeiros.com',
  '$2a$10$exemplo_de_hash_bcrypt_aqui',
  NOW()
);
```

**Nota:** Para gerar o hash da senha, use bcrypt com salt rounds = 10.

## Como Fazer Login

### Via Interface Web

1. Acesse `/auth/signin`
2. Digite seu email e senha
3. Clique em "Entrar"
4. Será redirecionado para `/dashboard`

### Via API (programaticamente)

```typescript
import { signIn } from "next-auth/react";

const result = await signIn("credentials", {
  email: "usuario@example.com",
  password: "senha123",
  redirect: false,
});

if (result?.error) {
  console.error("Erro ao fazer login");
} else {
  // Login bem-sucedido
}
```

## Como Fazer Logout

```typescript
import { signOut } from "next-auth/react";

await signOut({ 
  callbackUrl: "/" 
});
```

## Proteção de Rotas

### No Middleware (Automático)

O middleware em `src/middleware.ts` protege automaticamente todas as rotas, exceto:
- `/` (landing page)
- `/auth/*` (páginas de autenticação)
- `/api/*` (APIs fazem sua própria validação)

### Em APIs (Manual)

Use os helpers em `src/lib/auth-helpers.ts`:

```typescript
import { getCurrentUser, requireAuth } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  // Opção 1: Obter usuário (pode ser null)
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Opção 2: Requerer autenticação (lança erro se não autenticado)
  const user = await requireAuth();
  
  // Usar dados do usuário
  console.log(user.id, user.email, user.name);
}
```

### Em Server Components

```typescript
import { auth } from "@/lib/auth";

export default async function ProtectedPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  const user = session.user;
  
  return <div>Olá, {user.name}!</div>;
}
```

### Em Client Components

```typescript
"use client";

import { useSession } from "next-auth/react";

export default function ClientComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <div>Carregando...</div>;
  }
  
  if (!session) {
    return <div>Não autenticado</div>;
  }
  
  return <div>Olá, {session.user.name}!</div>;
}
```

## Fluxo de Autenticação

1. **Registro**:
   - Usuário acessa `/auth/signup`
   - Preenche nome, email e senha
   - API `/api/auth/signup` valida dados
   - Senha é hasheada com bcrypt
   - Usuário é criado no banco
   - Redirecionado para `/auth/signin`

2. **Login**:
   - Usuário acessa `/auth/signin`
   - Digita email e senha
   - NextAuth valida credenciais
   - Busca usuário no banco
   - Compara senha com hash armazenado
   - Cria sessão JWT
   - Redirecionado para `/dashboard`

3. **Sessão**:
   - JWT armazenado em cookie HTTP-only
   - Válido por 30 dias
   - Renovado automaticamente
   - Middleware verifica em cada requisição

## Segurança

### Boas Práticas Implementadas

✅ **Senhas hasheadas** com bcrypt (10 salt rounds)
✅ **Sessões JWT** assinadas com secret
✅ **Cookies HTTP-only** (não acessíveis via JavaScript)
✅ **Validação de entrada** com Zod
✅ **Emails em lowercase** para evitar duplicatas
✅ **Middleware de proteção** de rotas

### Recomendações Adicionais

- Use HTTPS em produção (Vercel faz isso automaticamente)
- Mantenha `NEXTAUTH_SECRET` seguro e nunca o commite
- Considere adicionar rate limiting para login/signup
- Implemente recuperação de senha futuramente
- Adicione 2FA para contas administrativas

## Gerenciamento de Usuários

### Listar Usuários (Admin)

```sql
SELECT id, name, email, email_verified, created_at
FROM users
ORDER BY created_at DESC;
```

### Verificar Email de Usuário

```sql
UPDATE users
SET email_verified = NOW()
WHERE email = 'usuario@example.com';
```

### Redefinir Senha (Temporário)

```sql
-- 1. Gerar hash para nova senha
-- Use bcrypt online ou script Node.js

-- 2. Atualizar no banco
UPDATE users
SET password_hash = '$2a$10$novo_hash_aqui'
WHERE email = 'usuario@example.com';
```

### Deletar Usuário

```sql
DELETE FROM users
WHERE email = 'usuario@example.com';
```

## Troubleshooting

### "Email ou senha incorretos"

- Verifique se o email está cadastrado
- Verifique se a senha está correta
- Confirme que `password_hash` não é NULL no banco

### "Erro ao criar conta"

- Email pode já estar cadastrado
- Verifique conexão com banco de dados
- Veja logs do servidor para mais detalhes

### Sessão não persiste

- Confirme que `NEXTAUTH_SECRET` está definido
- Verifique se cookies estão habilitados no browser
- Em desenvolvimento, use HTTP (não HTTPS)

### Middleware redirecionando incorretamente

- Verifique configuração do middleware
- Confirme que rotas públicas estão no matcher config
- Veja logs do servidor

## Diferenças do Stack Auth

| Aspecto | Stack Auth | Neon Auth (NextAuth) |
|---------|------------|----------------------|
| Autenticação | Magic Link | Email + Senha |
| Provider externo | Sim (Stack) | Não |
| Complexidade | Baixa | Média |
| Customização | Limitada | Total |
| Custo | Pode ter custo | Gratuito |
| Controle | Limitado | Total |
| Banco de dados | Gerenciado pelo Stack | Neon (seu controle) |

## Próximos Passos (Futuro)

- [ ] Implementar recuperação de senha via email
- [ ] Adicionar autenticação OAuth (Google, GitHub)
- [ ] Implementar 2FA (autenticação em dois fatores)
- [ ] Adicionar rate limiting
- [ ] Sistema de verificação de email
- [ ] Logs de auditoria de autenticação

## Referências

- [NextAuth.js v5 Documentation](https://authjs.dev/)
- [Neon Database](https://neon.tech/)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
