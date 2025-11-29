# Capacitor Setup - Peladeiros Mobile App

## Pré-requisitos

### Para iOS
- macOS (obrigatório para compilar iOS)
- Xcode 14+ (instalar via App Store)
- CocoaPods: `sudo gem install cocoapods`

### Para Android
- Android Studio (qualquer sistema operacional)
- Java JDK 17+
- Android SDK (instalado via Android Studio)

### Geral
- Node.js 18+
- pnpm (já instalado)

## Passo 1: Instalar Capacitor

```bash
# Instalar dependências do Capacitor
pnpm add @capacitor/core @capacitor/cli

# Instalar plataformas
pnpm add @capacitor/ios @capacitor/android

# Plugins essenciais
pnpm add @capacitor/app @capacitor/haptics @capacitor/keyboard
pnpm add @capacitor/status-bar @capacitor/splash-screen
pnpm add @capacitor/push-notifications @capacitor/camera
```

## Passo 2: Configurar Next.js para Static Export CONDICIONAL

⚠️ **IMPORTANTE**: NÃO configure `output: 'export'` permanentemente!

Editar `next.config.ts`:

```typescript
import type { NextConfig } from "next";

// ✅ Build condicional: SOMENTE export static quando building para mobile
const isMobileBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  // 📱 Export static SOMENTE para mobile
  output: isMobileBuild ? 'export' : undefined,

  // Desabilitar otimização de imagens (não funciona em static export)
  images: {
    unoptimized: true,
  },

  // Trailing slash para compatibilidade
  trailingSlash: true,

  // Headers CORS (apenas se necessário)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,PATCH,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 🔄 Como funciona

**Build Web (Vercel/Produção)**
```bash
npm run build  # CAPACITOR_BUILD não está definido
# → output: undefined (SSR normal)
# → API Routes funcionam
# → Server Actions funcionam
```

**Build Mobile (Capacitor)**
```bash
CAPACITOR_BUILD=true npm run build:mobile
# → output: 'export' (static)
# → API Routes NÃO funcionam
# → Usa API remota via helper
```

### ⚠️ Limitações do Export Static (SOMENTE Mobile)

Quando `output: 'export'` está ativo (mobile build), você NÃO pode usar:
- ❌ API Routes (`/api/*`)
- ❌ Server Actions
- ❌ `getServerSideProps`
- ❌ `revalidate`
- ❌ Image Optimization

**Mas isso não afeta a web!** A web continua com SSR completo.

## Passo 3: Inicializar Capacitor

```bash
# Inicializar Capacitor
npx cap init

# Responder às perguntas:
# - App name: Peladeiros
# - App ID: com.peladeiros.app
# - Web dir: out
```

Isso criará `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.peladeiros.app',
  appName: 'Peladeiros',
  webDir: 'out',
  server: {
    // Para desenvolvimento, apontar para localhost
    // androidScheme: 'https',
    // url: 'http://10.0.2.2:3000', // Android emulator
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#16a34a", // Verde Peladeiros
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
```

## Passo 4: Adicionar Plataformas

```bash
# Adicionar plataformas iOS e Android
npx cap add ios
npx cap add android
```

Isso criará:
- `ios/` - Projeto Xcode
- `android/` - Projeto Android Studio

## Passo 5: Configurar Scripts no package.json

Adicionar em `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:mobile": "CAPACITOR_BUILD=true next build && npx cap sync",
    "open:ios": "npx cap open ios",
    "open:android": "npx cap open android",
    "sync": "npx cap sync",
    "ios": "pnpm build:mobile && npx cap open ios",
    "android": "pnpm build:mobile && npx cap open android"
  }
}
```

**Explicação:**
- `build`: Build web normal (SSR) → `output: undefined`
- `build:mobile`: Build mobile com `CAPACITOR_BUILD=true` → `output: 'export'`
- `ios`/`android`: Build mobile + abrir IDE nativa

## Passo 6: Criar API Helper

Criar `src/lib/api-client.ts`:

```typescript
/**
 * API Client para aplicação mobile
 *
 * Em produção (mobile), aponta para URL do backend
 * Em desenvolvimento (web), usa API Routes local
 */

const IS_MOBILE = typeof window !== 'undefined' &&
  (window.navigator.userAgent.includes('Capacitor') ||
   window.navigator.userAgent.includes('peladeiros-app'));

const API_BASE_URL = IS_MOBILE
  ? process.env.NEXT_PUBLIC_API_URL || 'https://peladeiros.vercel.app'
  : '';

interface ApiRequestOptions extends RequestInit {
  useAuth?: boolean;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { useAuth = true, ...fetchOptions } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: useAuth ? 'include' : 'same-origin',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Erro desconhecido',
    }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Helpers específicos
export const api = {
  get: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  patch: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};
```

## Passo 7: Atualizar Variáveis de Ambiente

Criar `.env.production`:

```bash
# URL do backend em produção
NEXT_PUBLIC_API_URL=https://peladeiros.vercel.app

# NextAuth (mesmo URL)
NEXTAUTH_URL=https://peladeiros.vercel.app
AUTH_SECRET=seu-secret-aqui

# Neon Database
DATABASE_URL=postgresql://...
```

## Passo 8: Build e Teste

### Para desenvolvimento web (sem mudanças)
```bash
pnpm dev
```

### Para testar mobile

#### iOS (necessário macOS)
```bash
# Build e abrir Xcode
pnpm ios

# No Xcode:
# 1. Selecionar simulador (iPhone 15 Pro)
# 2. Clicar em "Run" (▶️)
```

#### Android
```bash
# Build e abrir Android Studio
pnpm android

# No Android Studio:
# 1. Criar AVD (Android Virtual Device)
# 2. Clicar em "Run" (▶️)
```

## Passo 9: Configurar Assets Mobile

### iOS

Editar `ios/App/App/Info.plist` para adicionar permissões:

```xml
<key>NSCameraUsageDescription</key>
<string>Precisamos de acesso à câmera para foto de perfil</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Precisamos de acesso às fotos para foto de perfil</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Precisamos de sua localização para mostrar campos próximos</string>
```

### Android

Editar `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Ícones e Splash Screen

Usar ferramenta online:
1. Criar ícone 1024x1024 px
2. Usar [Capacitor Asset Generator](https://github.com/capacitor-community/assets)

```bash
pnpm add -D @capacitor/assets

# Colocar ícone em resources/icon.png
# Colocar splash em resources/splash.png

npx capacitor-assets generate
```

## Passo 10: Testar Autenticação Mobile

Criar hook para detectar plataforma:

```typescript
// src/hooks/usePlatform.ts
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export function usePlatform() {
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');

  useEffect(() => {
    const currentPlatform = Capacitor.getPlatform();
    setPlatform(currentPlatform as any);
  }, []);

  return {
    platform,
    isWeb: platform === 'web',
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isMobile: platform !== 'web',
  };
}
```

Uso:
```typescript
const { isMobile, platform } = usePlatform();

if (isMobile) {
  // Usar API client
  const groups = await api.get('/api/groups');
} else {
  // Usar fetch normal (API Routes)
  const groups = await fetch('/api/groups').then(r => r.json());
}
```

## Passo 11: Push Notifications (Opcional)

```bash
# Instalar plugin
pnpm add @capacitor/push-notifications

# Firebase setup necessário
pnpm add firebase
```

Ver `PUSH_NOTIFICATIONS.md` para instruções detalhadas.

## Desenvolvimento Diário

### Workflow recomendado

```bash
# 1. Desenvolver features na web (mais rápido - com SSR e API Routes)
pnpm dev
# → Desenvolvimento normal com SSR
# → API Routes funcionam (/api/*)
# → Hot reload rápido

# 2. Testar build web (Vercel)
pnpm build
# → Build SSR (output: undefined)
# → Verifica se não quebrou nada na web

# 3. Quando feature está pronta, testar em mobile
pnpm build:mobile
# → Build static (CAPACITOR_BUILD=true, output: 'export')
# → Sincroniza com Capacitor

# 4. Testar iOS
npx cap open ios
# → Abre Xcode
# → Run no simulador iPhone

# 5. Testar Android
npx cap open android
# → Abre Android Studio
# → Run no emulador Android

# 6. Se tudo OK, commit
git add .
git commit -m "feat: nova feature X"
```

**Dica**: Durante desenvolvimento, use `pnpm dev` 99% do tempo. Só teste mobile quando a feature estiver completa.

## Troubleshooting

### Erro: "Could not find web assets directory"
```bash
# Build novamente
pnpm build
npx cap sync
```

### Erro: API retorna 401 em mobile
- Verificar se `credentials: 'include'` está configurado
- Verificar CORS no backend
- Testar com Postman primeiro

### Erro: Imagens não carregam
- Usar `<img>` ao invés de `next/image` para mobile
- Ou condicional: `isMobile ? <img> : <Image>`

### Erro: Rotas dinâmicas não funcionam
- Gerar todas as rotas dinâmicas no build
- Ou usar query params ao invés de dynamic routes

## Próximos Passos

1. ✅ Seguir este guia para setup inicial
2. → Testar build básico em simulador
3. → Implementar API client em todas as páginas
4. → Testar autenticação
5. → Adicionar push notifications
6. → Preparar para publicação nas lojas

## Referências

- [Capacitor iOS Setup](https://capacitorjs.com/docs/ios)
- [Capacitor Android Setup](https://capacitorjs.com/docs/android)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
