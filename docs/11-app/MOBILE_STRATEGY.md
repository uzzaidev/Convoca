# Estratégia Mobile - Peladeiros App

## Visão Geral

Este documento descreve a estratégia para criar aplicativos móveis iOS e Android para o Peladeiros, reutilizando a base de código Next.js existente.

## Tecnologia Recomendada: Capacitor

**Capacitor** é a solução recomendada por permitir:
- ✅ Reutilizar 100% do código React/Next.js existente
- ✅ Um único código para Web, iOS e Android
- ✅ Acesso a recursos nativos (câmera, notificações push, etc.)
- ✅ Deploy independente de web e mobile
- ✅ Performance nativa

### Por que Capacitor ao invés de React Native?

| Capacitor | React Native |
|-----------|--------------|
| Reutiliza código Next.js | Requer reescrita completa |
| Mesmo time desenvolve web e mobile | Times separados |
| Deploy rápido (static export) | Configuração complexa |
| Ionic tem suporte comercial | Comunidade |

## Arquitetura Proposta

```
peladeiros/
├── src/                          # Código Next.js (WEB)
│   ├── app/                      # App Router
│   ├── components/               # Componentes React (compartilhados)
│   ├── lib/                      # Utilitários (compartilhados)
│   └── ...
├── mobile/                       # Configuração Capacitor
│   ├── android/                  # Projeto Android Studio
│   ├── ios/                      # Projeto Xcode
│   └── capacitor.config.ts       # Config do Capacitor
├── out/                          # Static export (gerado)
└── package.json                  # Dependencies
```

## Fluxo de Desenvolvimento

### 1. Desenvolvimento Web (SSR normal - Atual)
```bash
pnpm dev          # Desenvolve com SSR e API Routes
pnpm build        # Build web SSR (output: undefined)
```
- ✅ API Routes funcionam (`/api/*`)
- ✅ SSR, Server Actions funcionam
- ✅ Hot reload rápido

### 2. Desenvolvimento Mobile (Export static - Futuro)
```bash
pnpm build:mobile # CAPACITOR_BUILD=true next build (output: 'export')
npx cap sync      # Sincroniza com projetos nativos
npx cap open ios  # Abre Xcode
npx cap open android # Abre Android Studio
```
- ❌ API Routes NÃO funcionam
- ✅ Usa API remota via `api.get()`
- ✅ Gera HTML/CSS/JS estático

## Mudanças Necessárias

### 1. Configuração Next.js - Build CONDICIONAL

⚠️ **IMPORTANTE**: NÃO configure `output: 'export'` permanentemente!

O Next.js deve ter build **condicional**:

```typescript
// next.config.js
const isMobileBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig = {
  // 📱 Export static SOMENTE para mobile
  output: isMobileBuild ? 'export' : undefined,

  images: {
    unoptimized: true
  },
  // ... resto da config
}
```

### 🔄 Como funciona

**Web (Vercel/Produção)**
```bash
npm run build
# → output: undefined (SSR normal)
# → API Routes funcionam
# → Server Actions funcionam
```

**Mobile (Capacitor)**
```bash
CAPACITOR_BUILD=true npm run build:mobile
# → output: 'export' (static)
# → API Routes NÃO funcionam
# → Usa API remota via helper
```

### ⚠️ Limitações do Static Export (SOMENTE Mobile)

Quando `CAPACITOR_BUILD=true` (build mobile):
- ❌ Sem Server-Side Rendering (SSR)
- ❌ Sem API Routes do Next.js
- ❌ Sem ISR ou On-Demand Revalidation

**Mas a web continua normal!** SSR, API Routes, tudo funciona na web.

### 2. API Helper para Mobile

O helper detecta automaticamente a plataforma e ajusta a URL:

```typescript
// src/lib/api-client.ts
import { Capacitor } from '@capacitor/core';

// Detectar se está em mobile (Capacitor) ou web
const IS_MOBILE = Capacitor.isNativePlatform();

// Web: '' (vazio = URL relativa = /api/groups)
// Mobile: 'https://peladeiros.vercel.app' (URL absoluta)
const API_BASE_URL = IS_MOBILE
  ? process.env.NEXT_PUBLIC_API_URL || 'https://peladeiros.vercel.app'
  : '';

export async function apiRequest(endpoint: string, options?: RequestInit) {
  // Web: fetch('/api/groups') → API Route local
  // Mobile: fetch('https://peladeiros.vercel.app/api/groups') → API remota
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Para cookies de autenticação (NextAuth)
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
```

**Como usar:**
```typescript
// ❌ ERRADO - Não funciona em mobile
fetch('/api/groups')

// ✅ CORRETO - Funciona em web E mobile
import { api } from '@/lib/api-client'
api.get('/api/groups')
```

### 3. Autenticação em Mobile

NextAuth funciona com cookies. Para mobile:
- ✅ Usar mesma API de autenticação
- ✅ Cookies funcionam via `credentials: 'include'`
- ⚠️ Considerar token-based auth para melhor UX mobile

### 4. Navegação e Rotas

Next.js App Router funciona normalmente em static export:
- ✅ `useRouter()` funciona
- ✅ `<Link>` funciona
- ✅ Dynamic routes funcionam (se pre-geradas)

## Estratégia de Desenvolvimento em Paralelo

### Opção 1: Branch Separado (Recomendado Inicialmente)

```bash
main              # Web app (SSR, API Routes)
└── mobile        # Mobile app (static export, API client)
```

**Prós**:
- Desenvolvimento web continua sem impacto
- Mobile pode ter suas próprias configurações

**Contras**:
- Merge frequente necessário
- Conflitos de código

### Opção 2: Monorepo (Futuro)

```bash
packages/
├── web/          # Next.js SSR
├── mobile/       # Next.js static export + Capacitor
└── shared/       # Componentes compartilhados
```

**Prós**:
- Zero conflitos
- Versionamento independente

**Contras**:
- Setup inicial complexo
- Mais arquivos para manter

## Recursos Nativos Necessários

### Fase 1 (MVP Mobile)
- [ ] Push Notifications (confirmações de eventos)
- [ ] Câmera (foto de perfil)
- [ ] Geolocalização (campos próximos - futuro)
- [ ] Share (compartilhar evento)

### Fase 2
- [ ] Calendar Integration (adicionar evento)
- [ ] Contacts (convidar amigos)
- [ ] App Badge (pending RSVPs)

## Plano de Implementação

### Sprint 1: Setup Inicial
1. Configurar Capacitor
2. Criar API helper
3. Testar autenticação
4. Build básico iOS/Android

### Sprint 2: Features Core
1. Listar grupos
2. Listar eventos
3. Fazer RSVP
4. Ver times sorteados

### Sprint 3: Features Avançadas
1. Push notifications
2. Compartilhar eventos
3. Upload de foto
4. Geolocalização

### Sprint 4: Publicação
1. App Store (iOS)
2. Google Play (Android)
3. Documentação
4. Suporte

## Custos e Requisitos

### Desenvolvimento
- **Xcode**: Gratuito (macOS obrigatório)
- **Android Studio**: Gratuito (Windows/Mac/Linux)

### Publicação
- **Apple Developer**: $99/ano (USD)
- **Google Play**: $25 one-time (USD)

### Infraestrutura
- **Backend**: Mesmo Vercel/Neon (sem custo adicional)
- **Push Notifications**: Firebase (gratuito até 10M msgs/mês)

## Alternativas Consideradas

### React Native
❌ Descartado porque:
- Requer reescrita completa
- Time precisa aprender nova stack
- Manutenção de 2 códigos separados

### Flutter
❌ Descartado porque:
- Linguagem diferente (Dart)
- Zero reuso de código
- Time precisa aprender nova stack

### PWA (Progressive Web App)
⚠️ Considerado como complemento:
- **Prós**: Deploy simples, sem app stores
- **Contras**: Limitações iOS, sem push notifications confiáveis
- **Decisão**: PWA primeiro, depois Capacitor

## 🎯 TL;DR - Resumo Executivo

### Arquitetura Final

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
│   - api.get() → URL remota              │
│   - Build: CAPACITOR_BUILD=true         │
│   - Output: 'export'                    │
│   - Capacitor plugins (nativos)         │
└─────────────────────────────────────────┘
```

### Tabela de Comparação

| Aspecto            | Web (Vercel)                 | Mobile (Capacitor)                  |
|--------------------|------------------------------|-------------------------------------|
| Build command      | `npm run build`              | `CAPACITOR_BUILD=true npm run build:mobile` |
| Next.js output     | `undefined` (SSR)            | `'export'` (static)                 |
| API Routes         | ✅ Funcionam localmente      | ❌ Não existem (sem Node.js)         |
| Como chamar APIs   | `fetch('/api/...')` ou `api.get()` | `api.get()` (obrigatório)     |
| URL de APIs        | `/api/groups` (local)        | `https://peladeiros.vercel.app/api/groups` |
| SSR                | ✅ Sim                       | ❌ Não                               |
| Server Actions     | ✅ Sim                       | ❌ Não                               |
| Deploy             | Vercel (automático)          | App Store + Google Play             |

### Regras de Ouro

1. **Build condicional garante zero impacto na web**
   - Web continua com SSR, API Routes, tudo normal
   - Mobile usa export static apenas quando `CAPACITOR_BUILD=true`

2. **SEMPRE use `api.get()` nos componentes (nunca `fetch` direto)**
   - ❌ `fetch('/api/groups')` - quebra no mobile
   - ✅ `api.get('/api/groups')` - funciona em ambos

3. **O helper detecta automaticamente a plataforma**
   - Web: chama API local (`/api/...`)
   - Mobile: chama API remota (`https://peladeiros.vercel.app/api/...`)

4. **Desenvolvimento acontece 99% na web**
   - Use `pnpm dev` normalmente
   - Teste mobile apenas quando feature estiver completa

## Próximos Passos

1. ✅ Ler este documento
2. → Ler `CAPACITOR_SETUP.md` para instruções técnicas
3. → Ler `API_HELPER.md` para implementar cliente de API
4. → Implementar POC (Proof of Concept) em branch separado

## Referências

- [Capacitor Docs](https://capacitorjs.com/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Ionic Framework](https://ionicframework.com/) - UI components mobile-friendly
