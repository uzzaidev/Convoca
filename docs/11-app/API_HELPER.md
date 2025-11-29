# API Helper para Mobile - Peladeiros

## Contexto Importante

### 📱 Export Static: SOMENTE para Mobile

No `next.config.js`:
```js
const isMobileBuild = process.env.CAPACITOR_BUILD === 'true'
const nextConfig = {
  output: isMobileBuild ? 'export' : undefined, // ✅ Condicional!
}
```

Isso significa:
- ✅ **Web**: Modo normal Next.js (SSR/SSG) - API Routes funcionam
- ✅ **Mobile**: Export static (`output: 'export'`) - API Routes NÃO funcionam

### 🔄 Como funciona na prática

**Web (Vercel/Produção)**
```bash
npm run build  # output: undefined (SSR normal)
```
- API Routes locais funcionam (`/api/conversations`, `/api/groups`, etc.)
- SSR, Server Actions, tudo funciona normalmente

**Mobile (Capacitor - iOS/Android)**
```bash
CAPACITOR_BUILD=true npm run build:mobile  # output: 'export'
```
- Gera HTML/CSS/JS estáticos
- API Routes NÃO existem (sem servidor Node.js)
- Precisa consumir APIs remotas (URL absoluta)

## Problema a Resolver

Quando fazemos build mobile com `output: 'export'`, perdemos:
- ❌ API Routes (`/api/*` não funcionam)
- ❌ Server-Side Rendering
- ❌ Server Actions

**Solução**: Criar um helper que detecta a plataforma e redireciona chamadas de API para o backend de produção quando estiver em mobile.

## Implementação do API Helper

### Estrutura de Arquivos

```
src/lib/
├── api-client.ts          # Cliente principal
├── api/                   # Wrappers específicos
│   ├── groups.ts
│   ├── events.ts
│   ├── auth.ts
│   └── users.ts
└── utils.ts
```

### 1. Cliente Base (api-client.ts)

```typescript
/**
 * API Client que funciona tanto para web quanto mobile
 *
 * - Web: Usa API Routes locais (/api/*)
 * - Mobile: Aponta para backend em produção (https://peladeiros.vercel.app/api/*)
 */

import { Capacitor } from '@capacitor/core';

// Detectar se está rodando em ambiente Capacitor (mobile)
const IS_MOBILE = Capacitor.isNativePlatform();

// URL base da API
// Web: '' (vazio = URL relativa = localhost ou domínio atual)
// Mobile: 'https://peladeiros.vercel.app' (URL absoluta = API remota)
const API_BASE_URL = IS_MOBILE
  ? process.env.NEXT_PUBLIC_API_URL || 'https://peladeiros.vercel.app'
  : '';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Faz uma requisição para a API
 *
 * Web: fetch(''/api/groups) → /api/groups (API Route local)
 * Mobile: fetch('https://peladeiros.vercel.app'/api/groups) → https://peladeiros.vercel.app/api/groups (API remota)
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  // Garantir que endpoint começa com /
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: skipAuth ? 'omit' : 'include', // Incluir cookies para NextAuth
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data?.error || `HTTP ${response.status}`,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Erro de rede
    throw new ApiError(0, 'Erro de conexão. Verifique sua internet.', error);
  }
}

/**
 * Helpers HTTP
 */
export const api = {
  get: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Hook para verificar plataforma
 */
export function useIsMobile() {
  return IS_MOBILE;
}
```

### 2. Wrapper para Groups API (api/groups.ts)

```typescript
import { api } from '../api-client';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  // ... outros campos
}

export interface CreateGroupData {
  name: string;
  description?: string;
  is_public?: boolean;
}

/**
 * API Client para grupos
 */
export const groupsApi = {
  /**
   * Lista todos os grupos do usuário
   */
  list: () =>
    api.get<{ groups: Group[] }>('/api/groups'),

  /**
   * Busca um grupo por ID
   */
  get: (groupId: string) =>
    api.get<{ group: Group }>(`/api/groups/${groupId}`),

  /**
   * Cria um novo grupo
   */
  create: (data: CreateGroupData) =>
    api.post<{ group: Group }>('/api/groups', data),

  /**
   * Atualiza um grupo
   */
  update: (groupId: string, data: Partial<CreateGroupData>) =>
    api.patch<{ group: Group }>(`/api/groups/${groupId}`, data),

  /**
   * Deleta um grupo
   */
  delete: (groupId: string) =>
    api.delete(`/api/groups/${groupId}`),

  /**
   * Busca membros do grupo
   */
  getMembers: (groupId: string) =>
    api.get(`/api/groups/${groupId}/members`),

  /**
   * Busca rankings do grupo
   */
  getRankings: (groupId: string) =>
    api.get(`/api/groups/${groupId}/rankings`),

  /**
   * Busca estatísticas do grupo
   */
  getStats: (groupId: string) =>
    api.get(`/api/groups/${groupId}/stats`),

  /**
   * Busca estatísticas do usuário no grupo
   */
  getMyStats: (groupId: string) =>
    api.get(`/api/groups/${groupId}/my-stats`),

  /**
   * Entra em um grupo via código
   */
  join: (code: string) =>
    api.post('/api/groups/join', { code }),
};
```

### 3. Wrapper para Events API (api/events.ts)

```typescript
import { api } from '../api-client';

export interface Event {
  id: string;
  group_id: string;
  title: string;
  date: string;
  max_players: number;
  // ... outros campos
}

export interface CreateEventData {
  group_id: string;
  title: string;
  date: string;
  max_players: number;
  max_goalkeepers?: number;
}

export const eventsApi = {
  /**
   * Lista eventos (com filtros opcionais)
   */
  list: (params?: { group_id?: string; upcoming?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.group_id) searchParams.set('group_id', params.group_id);
    if (params?.upcoming) searchParams.set('upcoming', 'true');

    const query = searchParams.toString();
    return api.get<{ events: Event[] }>(
      `/api/events${query ? `?${query}` : ''}`
    );
  },

  /**
   * Busca um evento por ID
   */
  get: (eventId: string) =>
    api.get<{ event: Event }>(`/api/events/${eventId}`),

  /**
   * Cria um novo evento
   */
  create: (data: CreateEventData) =>
    api.post<{ event: Event }>('/api/events', data),

  /**
   * Atualiza um evento
   */
  update: (eventId: string, data: Partial<CreateEventData>) =>
    api.patch<{ event: Event }>(`/api/events/${eventId}`, data),

  /**
   * Deleta um evento
   */
  delete: (eventId: string) =>
    api.delete(`/api/events/${eventId}`),

  /**
   * Confirma presença
   */
  rsvp: (eventId: string, status: 'yes' | 'no' | 'waitlist') =>
    api.post(`/api/events/${eventId}/rsvp`, { status }),

  /**
   * Sorteia times
   */
  draw: (eventId: string) =>
    api.post(`/api/events/${eventId}/draw`),

  /**
   * Busca times sorteados
   */
  getTeams: (eventId: string) =>
    api.get(`/api/events/${eventId}/teams`),

  /**
   * Troca jogadores de time
   */
  swapPlayers: (eventId: string, player1Id: string, player2Id: string) =>
    api.post(`/api/events/${eventId}/teams/swap`, {
      player1_id: player1Id,
      player2_id: player2Id,
    }),

  /**
   * Registra ação (gol, assistência, cartão)
   */
  recordAction: (
    eventId: string,
    data: {
      player_id: string;
      team_id: string;
      action_type: 'goal' | 'assist' | 'yellow_card' | 'red_card';
    }
  ) =>
    api.post(`/api/events/${eventId}/actions`, data),

  /**
   * Vota em jogadores
   */
  vote: (eventId: string, playerIds: string[]) =>
    api.post(`/api/events/${eventId}/ratings`, { player_ids: playerIds }),
};
```

### 4. Wrapper para Auth API (api/auth.ts)

```typescript
import { api } from '../api-client';

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authApi = {
  /**
   * Registra novo usuário
   */
  signUp: (data: SignUpData) =>
    api.post('/api/auth/signup', data, { skipAuth: true }),

  /**
   * Login (usa NextAuth nativo)
   * Em mobile, pode precisar de implementação customizada
   */
  signIn: async (data: SignInData) => {
    // NextAuth signIn funciona diferente
    // Usar signIn do next-auth/react
    throw new Error('Use signIn from next-auth/react');
  },

  /**
   * Logout
   */
  signOut: async () => {
    // Use signOut do next-auth/react
    throw new Error('Use signOut from next-auth/react');
  },
};
```

## Refatorando Código Existente

### Antes (usando fetch direto - ❌ NÃO funciona em mobile)

```typescript
// src/app/dashboard/page.tsx
'use client';

export default function DashboardPage() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    // ❌ ERRADO - Não funciona em mobile (export static)
    fetch('/api/groups')
      .then(r => r.json())
      .then(data => setGroups(data.groups));
  }, []);

  // ...
}
```

### Depois (usando API helper - ✅ Funciona em web E mobile)

```typescript
// src/app/dashboard/page.tsx
'use client';
import { groupsApi } from '@/lib/api/groups';

export default function DashboardPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ CORRETO - Funciona em web E mobile
    groupsApi
      .list()
      .then(data => setGroups(data.groups))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  // ...
}
```

**O que acontece nos bastidores:**
- **Web**: `fetch(''/api/groups)` → `/api/groups` (API Route local)
- **Mobile**: `fetch('https://peladeiros.vercel.app'/api/groups)` → API remota

### Usando React Query (Recomendado)

```typescript
// src/app/dashboard/page.tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '@/lib/api/groups';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.list(),
  });

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  const groups = data?.groups || [];

  // ...
}
```

## Configuração de Ambiente

### .env.local (desenvolvimento web)

```bash
# API aponta para localhost (API Routes)
NEXT_PUBLIC_API_URL=

# NextAuth local
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=seu-secret-local
```

### .env.production (build mobile)

```bash
# API aponta para produção
NEXT_PUBLIC_API_URL=https://peladeiros.vercel.app

# NextAuth produção
NEXTAUTH_URL=https://peladeiros.vercel.app
AUTH_SECRET=seu-secret-producao
```

## Tratamento de Erros

```typescript
// src/components/ErrorBoundary.tsx
'use client';
import { ApiError } from '@/lib/api-client';

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        // Não autenticado - redirecionar para login
        window.location.href = '/auth/signin';
        break;
      case 403:
        // Sem permissão
        alert('Você não tem permissão para fazer isso');
        break;
      case 404:
        // Não encontrado
        alert('Recurso não encontrado');
        break;
      case 500:
        // Erro no servidor
        alert('Erro no servidor. Tente novamente mais tarde.');
        break;
      default:
        alert(error.message);
    }
  } else {
    // Erro de rede ou desconhecido
    alert('Erro de conexão. Verifique sua internet.');
  }
}
```

Uso:

```typescript
try {
  await groupsApi.create({ name: 'Novo Grupo' });
} catch (error) {
  handleApiError(error);
}
```

## Autenticação em Mobile

### Opção 1: Continuar com NextAuth (mais simples)

NextAuth funciona com cookies, que funcionam em Capacitor:

```typescript
// src/lib/auth-mobile.ts
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

export async function signInMobile(email: string, password: string) {
  const result = await nextAuthSignIn('credentials', {
    email,
    password,
    redirect: false,
  });

  if (result?.error) {
    throw new Error(result.error);
  }

  return result;
}

export async function signOutMobile() {
  await nextAuthSignOut({ redirect: false });
}
```

### Opção 2: Token-based Auth (melhor UX mobile)

```typescript
// Criar nova API Route para login com token
// POST /api/auth/mobile/login

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Validar credenciais
  const user = await validateCredentials(email, password);

  // Gerar JWT
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  });

  return NextResponse.json({ token, user });
}
```

Uso:

```typescript
// Salvar token no Capacitor Preferences
import { Preferences } from '@capacitor/preferences';

async function signIn(email: string, password: string) {
  const { token } = await api.post('/api/auth/mobile/login', {
    email,
    password,
  });

  await Preferences.set({ key: 'auth_token', value: token });
}

// Adicionar token em todas as requisições
const token = await Preferences.get({ key: 'auth_token' });
if (token.value) {
  headers['Authorization'] = `Bearer ${token.value}`;
}
```

## Testando em Diferentes Ambientes

```typescript
// src/lib/api-client.ts

// Logs para debug
if (process.env.NODE_ENV === 'development') {
  console.log('[API Client]', {
    isMobile: IS_MOBILE,
    baseUrl: API_BASE_URL,
    platform: Capacitor.getPlatform(),
  });
}
```

## Checklist de Migração

- [ ] Criar `src/lib/api-client.ts`
- [ ] Criar wrappers em `src/lib/api/`
- [ ] Refatorar todas as páginas para usar API helpers
- [ ] Testar em web (deve continuar funcionando)
- [ ] Configurar `.env.production` com URL de produção
- [ ] Build mobile e testar
- [ ] Verificar autenticação funciona
- [ ] Testar CRUD completo de grupos e eventos
- [ ] Adicionar tratamento de erro adequado
- [ ] Configurar retry logic se necessário

## 🎯 TL;DR - Resumo Executivo

### Como funciona a arquitetura

```
┌─────────────────────────────────────────┐
│         APLICAÇÃO WEB (Vercel)          │
│   - Next.js com SSR                     │
│   - API Routes (/api/*)                 │
│   - Build: npm run build                │
│   - Output: undefined (SSR)             │
└─────────────────────────────────────────┘
                    ▲
                    │ HTTP
                    │
┌─────────────────────────────────────────┐
│    APLICAÇÃO MOBILE (iOS/Android)       │
│   - Export static (HTML/CSS/JS)         │
│   - apiFetch() → URL remota             │
│   - Build: CAPACITOR_BUILD=true         │
│   - Output: 'export'                    │
│   - Capacitor plugins (nativos)         │
└─────────────────────────────────────────┘
```

### Tabela de Comparação

| Aspecto            | Web                          | Mobile                              |
|--------------------|------------------------------|-------------------------------------|
| Build              | `npm run build`              | `CAPACITOR_BUILD=true npm run build:mobile` |
| Output             | `undefined` (SSR)            | `'export'` (static)                 |
| API Routes         | ✅ Funcionam                 | ❌ Não funcionam                     |
| Como chamar APIs   | `fetch('/api/...')` ou `api.get('/api/...')` | `api.get('/api/...')` (obrigatório) |
| URL final          | `/api/groups` (local)        | `https://peladeiros.vercel.app/api/groups` |
| SSR                | ✅ Sim                       | ❌ Não                               |
| Server Actions     | ✅ Sim                       | ❌ Não                               |

### Regras de Ouro

1. **SEMPRE use `api.get()` ou wrappers (`groupsApi.list()`) nos componentes**
   - ❌ NUNCA: `fetch('/api/groups')`
   - ✅ SEMPRE: `api.get('/api/groups')` ou `groupsApi.list()`

2. **O helper detecta automaticamente a plataforma**
   - Web: chama `/api/...` (local)
   - Mobile: chama `https://peladeiros.vercel.app/api/...` (remota)

3. **API Routes continuam funcionando normalmente na web**
   - O backend Vercel permanece intacto
   - Nada muda para o usuário web

4. **Build condicional garante zero impacto**
   - Web: `npm run build` → SSR normal
   - Mobile: `CAPACITOR_BUILD=true npm run build:mobile` → static export

## Próximos Passos

1. ✅ Implementar API client base
2. → Criar wrappers para todas as APIs
3. → Refatorar páginas existentes
4. → Testar em simulador mobile
5. → Implementar offline support (opcional)

## Referências

- [Capacitor HTTP](https://capacitorjs.com/docs/apis/http)
- [React Query](https://tanstack.com/query/latest) - Recomendado para cache
- [SWR](https://swr.vercel.app/) - Alternativa ao React Query
