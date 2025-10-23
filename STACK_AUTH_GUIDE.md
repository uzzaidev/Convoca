# Stack Auth Setup - Peladeiros

Este documento descreve como configurar e usar o Stack Auth (Neon Auth) no projeto Peladeiros.

## Sobre Stack Auth

O Stack Auth é a solução de autenticação fornecida pelo Neon Database. Ele oferece:
- Autenticação por magic link (email)
- Gerenciamento de sessões
- Integração nativa com Next.js
- Zero configuração de variáveis de ambiente adicionais além das fornecidas pelo Neon

## Variáveis de Ambiente Necessárias

Apenas as variáveis fornecidas pelo Neon Auth são necessárias:

```bash
# Stack Auth (Neon Auth)
NEXT_PUBLIC_STACK_PROJECT_ID=seu_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=sua_publishable_key
STACK_SECRET_SERVER_KEY=sua_secret_key
```

**Importante:** Estas variáveis já estão configuradas no arquivo `.env` e no Vercel. Você as obteve ao configurar o Neon Auth no painel do Neon.

## Arquitetura

### Estrutura de Arquivos

```
src/
├── lib/
│   ├── stack.ts              # Configuração do Stack Server App
│   ├── stack-client.ts       # Configuração do Stack Client App
│   ├── auth-helpers.ts       # Helpers para autenticação em APIs
│   └── stores/
│       └── auth-store.ts     # Zustand store para estado de auth
├── components/
│   └── providers/
│       └── stack-provider.tsx # Provider React do Stack Auth
├── app/
│   ├── layout.tsx            # Root layout com StackProvider
│   ├── auth/
│   │   └── signin/
│   │       └── page.tsx      # Página de login
│   └── api/                  # Rotas da API usando auth-helpers
└── middleware.ts             # Middleware de autenticação
```

### Componentes Principais

#### 1. Stack Server App (`src/lib/stack.ts`)

Instância do Stack Auth para uso no servidor (API routes, server components):

```typescript
import { stackServerApp } from "@/lib/stack";

// Em uma API route ou server component
const user = await stackServerApp.getUser();
```

#### 2. Stack Client App (`src/lib/stack-client.ts`)

Instância do Stack Auth para uso no cliente (client components):

```typescript
"use client";
import { useStackApp } from "@stackframe/stack";

export function MyComponent() {
  const app = useStackApp();
  // Use app.signInWithMagicLink(), etc
}
```

#### 3. Auth Helpers (`src/lib/auth-helpers.ts`)

Funções auxiliares para autenticação nas rotas da API:

- `getCurrentUser()`: Retorna o usuário atual ou null
- `requireAuth()`: Retorna o usuário ou lança erro 401

```typescript
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    // user está autenticado
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
  }
}
```

#### 4. Zustand Store (`src/lib/stores/auth-store.ts`)

Store Zustand para gerenciar estado de autenticação no cliente:

```typescript
import { useAuthStore } from "@/lib/stores/auth-store";

function MyComponent() {
  const { user, isLoading, setUser, clearUser } = useAuthStore();
  // Use o estado conforme necessário
}
```

## Fluxo de Autenticação

### Login com Magic Link

1. Usuário acessa `/auth/signin`
2. Insere seu email
3. Stack Auth envia um magic link por email
4. Usuário clica no link
5. É redirecionado para `/dashboard` autenticado

### Proteção de Rotas

O middleware (`src/middleware.ts`) protege automaticamente as rotas:

- **Públicas**: `/`, `/simple-test`
- **Auth**: `/auth/signin`, `/auth/error`
- **Protegidas**: Todas as outras (requerem autenticação)

### Sincronização com Banco de Dados

O `auth-helpers.ts` sincroniza automaticamente usuários do Stack Auth com a tabela `users`:

```typescript
// Ao fazer login pela primeira vez, o usuário é criado automaticamente
const user = await getCurrentUser();
// user contém: { id, email, name, image, stackUserId }
```

## Como Usar

### 1. Em Client Components

```typescript
"use client";
import { useStackApp, useUser } from "@stackframe/stack";

export function MyComponent() {
  const app = useStackApp();
  const user = useUser();

  if (!user) {
    return <div>Não autenticado</div>;
  }

  return (
    <div>
      <p>Olá, {user.displayName}</p>
      <button onClick={() => app.signOut()}>
        Sair
      </button>
    </div>
  );
}
```

### 2. Em Server Components

```typescript
import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function MyPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  return <div>Olá, {user.name}</div>;
}
```

### 3. Em API Routes

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Lógica da API usando user.id
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
```

## Gerenciamento de Estado com Zustand

O Zustand store (`auth-store.ts`) pode ser usado para:

- Cache de dados do usuário no cliente
- Otimização de re-renders
- Persistência de estado em localStorage

```typescript
import { useAuthStore } from "@/lib/stores/auth-store";

function MyComponent() {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div>Carregando...</div>;
  }
  
  return <div>Usuário: {user?.email}</div>;
}
```

## Diferenças do NextAuth

### Antes (NextAuth)
- Necessário configurar `NEXTAUTH_SECRET` e `NEXTAUTH_URL`
- Configuração manual de providers
- Rotas `/api/auth/[...nextauth]`
- Session callbacks complexos

### Agora (Stack Auth)
- Apenas variáveis do Neon (já configuradas)
- Magic link out-of-the-box
- Nenhuma rota de auth necessária
- Sincronização automática com DB

## Troubleshooting

### Erro: "Não autenticado" em todas as rotas

- Verifique se as variáveis de ambiente estão configuradas corretamente
- Verifique se o `StackProvider` está no `layout.tsx`
- Limpe cookies e tente fazer login novamente

### Magic link não é enviado

- Verifique a configuração de email no painel do Stack Auth
- Verifique spam/lixeira
- Confirme que o email está correto

### Usuário não é criado no banco de dados

- Verifique a conexão com o banco (DATABASE_URL)
- Veja logs de erro no console
- O usuário é criado automaticamente na primeira autenticação

## Recursos Adicionais

- [Stack Auth Documentation](https://docs.stack-auth.com/)
- [Neon Auth Guide](https://neon.tech/docs/guides/auth)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

## Próximos Passos

- [ ] Configurar email personalizado para magic links
- [ ] Adicionar OAuth providers (Google, GitHub)
- [ ] Implementar refresh de sessão automático
- [ ] Adicionar testes de autenticação
