# 📱 Plano de Desenvolvimento Mobile Android - Convoca App

## 🎯 Visão Geral do Projeto

Transformar o **Convoca** (app de gestão de peladas) em um aplicativo mobile híbrido Android usando **Capacitor** + **Next.js 15**, mantendo a base de código única para web e mobile.

---

## 🏗️ ARQUITETURA PROPOSTA

```
┌─────────────────────────────────────────────────────────┐
│              CONVOCA WEB APP (Next.js 15)                │
│           TypeScript + React 19 + Neon DB               │
│   ┌────────────────────────────────────────────┐        │
│   │  Frontend (Dashboard, Grupos, Eventos)     │        │
│   │  + API Routes (Backend Serverless)         │        │
│   │  + NextAuth v5 (Auth)                      │        │
│   └────────────────────────────────────────────┘        │
│                        ↓                                 │
│                  STATIC BUILD                            │
│              (next build + next export)                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                  CAPACITOR 7.x                           │
│        (Wrapper Nativo - Android)                        │
│                                                          │
│  WebView carrega:                                        │
│  - Produção: https://convoca.app (ou seu domínio)      │
│  - Local (dev): http://localhost:3000                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              ANDROID NATIVE (Kotlin/Java)                │
│   - Push Notifications (Firebase)                       │
│   - Biometria (@aparajita/capacitor-biometric-auth)     │
│   - Compartilhamento nativo                             │
│   - Status Bar / Splash Screen                          │
│   - Network Status                                       │
│   - Camera (fotos de perfil/eventos)                    │
│   - Geolocation (locais de eventos)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 ESTRUTURA DE ARQUIVOS (APÓS IMPLEMENTAÇÃO)

```
Convoca/
├── capacitor.config.ts          # ⭐ Config principal do Capacitor
├── package.json                 # + Dependências Capacitor
├── android/                     # ⭐ Projeto Android Studio (NOVO)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/com/convoca/app/
│   │   │   │   └── MainActivity.java
│   │   │   ├── res/
│   │   │   │   ├── drawable/
│   │   │   │   ├── mipmap-*/        # App icons
│   │   │   │   └── values/
│   │   │   │       ├── strings.xml
│   │   │   │       └── styles.xml
│   │   │   └── assets/              # Build Next.js (se local)
│   │   └── build.gradle             # Config build Android
│   ├── build.gradle
│   ├── google-services.json         # ⭐ Firebase Config
│   └── release.properties           # ⚠️ Keystore (NÃO commitar)
│
├── ios/                             # Projeto iOS (futuro)
│
├── out/                             # Build estático Next.js (export)
│
├── src/                             # ⭐ Código existente (Next.js)
│   ├── app/
│   │   ├── (auth)/                  # Login/Signup
│   │   ├── dashboard/               # Dashboard principal
│   │   ├── groups/                  # Gestão de grupos
│   │   ├── events/                  # Gestão de eventos
│   │   └── api/                     # API Routes
│   │
│   ├── components/                  # Componentes React
│   │   ├── ui/                      # shadcn/ui
│   │   ├── dashboard/
│   │   ├── groups/
│   │   ├── events/
│   │   └── mobile/                  # ⭐ NOVO: Componentes mobile-specific
│   │
│   ├── lib/
│   │   ├── auth.ts                  # NextAuth v5
│   │   ├── auth-helpers.ts
│   │   ├── mobile/                  # ⭐ NOVO: Utils mobile
│   │   │   ├── push-notifications.ts
│   │   │   ├── biometric.ts
│   │   │   ├── camera.ts
│   │   │   ├── geolocation.ts
│   │   │   ├── share.ts
│   │   │   └── platform-detector.ts
│   │   └── stores/
│   │
│   └── db/
│       ├── client.ts                # Neon client
│       └── migrations/
│
├── public/                          # Assets
│   ├── icons/                       # ⭐ NOVO: App icons
│   │   ├── icon-512x512.png
│   │   ├── icon-192x192.png
│   │   └── splash.png
│   └── ...
│
└── scripts/
    ├── build-mobile.js              # ⭐ NOVO: Script build mobile
    └── setup-android.js             # ⭐ NOVO: Setup inicial Android
```

---

## 🚀 FASES DE IMPLEMENTAÇÃO

### **FASE 1: Setup Inicial (Semana 1)**

#### 1.1. Instalação e Configuração Base

**Objetivo**: Configurar Capacitor e criar projeto Android base.

**Tarefas**:

1. **Instalar Dependências Capacitor**
   ```bash
   pnpm add @capacitor/core @capacitor/cli
   pnpm add @capacitor/android
   pnpm add @capacitor/app @capacitor/network @capacitor/status-bar @capacitor/splash-screen
   ```

2. **Inicializar Capacitor**
   ```bash
   npx cap init
   # App Name: Convoca
   # App ID: com.convoca.app (ou br.com.convoca)
   # Web Dir: out
   ```

3. **Criar `capacitor.config.ts`**
   ```typescript
   import { CapacitorConfig } from '@capacitor/cli';

   const config: CapacitorConfig = {
     appId: 'com.convoca.app',
     appName: 'Convoca',
     webDir: 'out',
     server: {
       // PRODUÇÃO: Carrega webapp remota
       url: process.env.CAPACITOR_SERVER_URL || 'https://convoca.app',
       cleartext: false, // HTTPS obrigatório
       // DESENVOLVIMENTO: Comentar url acima e usar localhost
       // androidScheme: 'https'
     },
     plugins: {
       SplashScreen: {
         launchShowDuration: 2000,
         backgroundColor: "#16a34a", // Verde Convoca
         showSpinner: false,
       },
       StatusBar: {
         style: 'dark',
         backgroundColor: "#16a34a",
       },
     },
   };

   export default config;
   ```

4. **Modificar `next.config.ts` para Export Estático**
   ```typescript
   const nextConfig: NextConfig = {
     output: 'export', // ⭐ Habilita export estático
     images: {
       unoptimized: true, // ⚠️ Necessário para export
     },
     // ... resto da config
   };
   ```

5. **Adicionar Plataforma Android**
   ```bash
   npx cap add android
   ```

6. **Atualizar `package.json` com Scripts Mobile**
   ```json
   {
     "scripts": {
       "dev": "next dev --webpack",
       "build": "next build",
       "build:mobile": "next build && npx cap sync",
       "android:dev": "next dev & npx cap run android -l --host=YOUR_LOCAL_IP",
       "android:build": "pnpm build:mobile && cd android && ./gradlew assembleRelease",
       "android:open": "npx cap open android",
       "cap:sync": "npx cap sync",
       "cap:copy": "npx cap copy"
     }
   }
   ```

7. **Criar `.env.mobile` para Configurações Mobile**
   ```bash
   CAPACITOR_SERVER_URL=https://convoca.app
   NEXT_PUBLIC_IS_MOBILE=true
   ```

**Entregáveis**:
- ✅ Projeto Android criado em `/android`
- ✅ `capacitor.config.ts` configurado
- ✅ Scripts de build mobile funcionando
- ✅ App abrindo em emulador/device (carregando webapp remota)

---

#### 1.2. Configuração de Ícones e Splash Screen

**Objetivo**: Criar identidade visual do app mobile.

**Tarefas**:

1. **Criar Ícones do App**
   - Design: Ícone 1024x1024px (logo Convoca)
   - Gerar variações: 512x512, 192x192, 144x144, 96x96, 72x72, 48x48
   - Salvar em: `public/icons/`

2. **Usar Ferramenta de Geração**
   ```bash
   # Instalar cordova-res
   npm install -g cordova-res

   # Gerar ícones e splash screens
   cordova-res android --skip-config --copy
   ```

3. **Configurar Splash Screen**
   - Criar `public/splash.png` (2732x2732px - iOS, 1920x1920px - Android)
   - Adicionar fundo verde (#16a34a) com logo branco

**Entregáveis**:
- ✅ Ícones gerados em `android/app/src/main/res/mipmap-*`
- ✅ Splash screen configurado
- ✅ App com identidade visual Convoca

---

### **FASE 2: Adaptações Web → Mobile (Semana 2-3)**

#### 2.1. Detector de Plataforma

**Objetivo**: Criar sistema para detectar se app está rodando em mobile ou web.

**Arquivo**: `src/lib/mobile/platform-detector.ts`

```typescript
import { Capacitor } from '@capacitor/core';

export const isMobile = () => {
  return Capacitor.isNativePlatform();
};

export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

export const isWeb = () => {
  return Capacitor.getPlatform() === 'web';
};

// Hook React
export const usePlatform = () => {
  const [platform, setPlatform] = useState<string>('web');

  useEffect(() => {
    setPlatform(Capacitor.getPlatform());
  }, []);

  return {
    isMobile: platform !== 'web',
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    isWeb: platform === 'web',
  };
};
```

**Uso**:
```typescript
import { usePlatform } from '@/lib/mobile/platform-detector';

export default function Header() {
  const { isMobile } = usePlatform();

  return (
    <header className={isMobile ? 'p-2' : 'p-4'}>
      {/* Layout adaptado */}
    </header>
  );
}
```

---

#### 2.2. Adaptação de Navegação e Rotas

**Objetivo**: Ajustar navegação para mobile (back button nativo, gestos).

**Tarefas**:

1. **Instalar Plugin App**
   ```bash
   pnpm add @capacitor/app
   ```

2. **Criar Hook de Navegação Mobile**

   **Arquivo**: `src/lib/mobile/navigation.ts`
   ```typescript
   import { App } from '@capacitor/app';
   import { useRouter } from 'next/navigation';
   import { useEffect } from 'react';

   export const useBackButton = () => {
     const router = useRouter();

     useEffect(() => {
       const listener = App.addListener('backButton', ({ canGoBack }) => {
         if (canGoBack) {
           router.back();
         } else {
           App.exitApp(); // Sai do app se não pode voltar
         }
       });

       return () => {
         listener.remove();
       };
     }, [router]);
   };
   ```

3. **Aplicar em Layout Principal**

   **Arquivo**: `src/app/layout.tsx`
   ```typescript
   'use client';
   import { useBackButton } from '@/lib/mobile/navigation';

   export default function RootLayout({ children }) {
     useBackButton(); // Gerencia back button Android

     return (
       <html>
         <body>{children}</body>
       </html>
     );
   }
   ```

---

#### 2.3. Adaptação de UI/UX para Mobile

**Objetivo**: Criar componentes responsivos para telas pequenas.

**Tarefas**:

1. **Ajustar Tailwind Config para Mobile**

   **Arquivo**: `tailwind.config.ts`
   ```typescript
   export default {
     theme: {
       extend: {
         spacing: {
           'safe-top': 'env(safe-area-inset-top)',
           'safe-bottom': 'env(safe-area-inset-bottom)',
         },
       },
     },
   };
   ```

2. **Criar Componentes Mobile-Specific**

   **Arquivo**: `src/components/mobile/MobileHeader.tsx`
   ```typescript
   'use client';
   import { usePlatform } from '@/lib/mobile/platform-detector';
   import { ArrowLeft } from 'lucide-react';
   import { useRouter } from 'next/navigation';

   export default function MobileHeader({ title }: { title: string }) {
     const { isMobile } = usePlatform();
     const router = useRouter();

     if (!isMobile) return null;

     return (
       <header className="sticky top-0 z-50 bg-green-600 text-white p-4 pt-safe-top">
         <div className="flex items-center gap-3">
           <button onClick={() => router.back()}>
             <ArrowLeft className="w-6 h-6" />
           </button>
           <h1 className="text-lg font-semibold">{title}</h1>
         </div>
       </header>
     );
   }
   ```

3. **Adaptar Cards de Eventos/Grupos para Mobile**
   - Reduzir padding/margin
   - Aumentar área de toque (min 44px)
   - Simplificar layouts complexos

4. **Bottom Navigation (estilo app nativo)**

   **Arquivo**: `src/components/mobile/BottomNav.tsx`
   ```typescript
   import { Home, Users, Calendar, User } from 'lucide-react';
   import Link from 'next/link';

   export default function BottomNav() {
     return (
       <nav className="fixed bottom-0 left-0 right-0 bg-white border-t pb-safe-bottom">
         <div className="flex justify-around py-3">
           <Link href="/dashboard">
             <Home className="w-6 h-6" />
           </Link>
           <Link href="/groups">
             <Users className="w-6 h-6" />
           </Link>
           <Link href="/events">
             <Calendar className="w-6 h-6" />
           </Link>
           <Link href="/profile">
             <User className="w-6 h-6" />
           </Link>
         </div>
       </nav>
     );
   }
   ```

**Entregáveis**:
- ✅ Navegação mobile funcional (back button)
- ✅ UI adaptada para telas pequenas
- ✅ Bottom navigation implementada
- ✅ Safe areas respeitadas (notch, barra de navegação)

---

### **FASE 3: Funcionalidades Nativas (Semana 4-5)**

#### 3.1. Push Notifications (Firebase)

**Objetivo**: Notificar usuários sobre novos eventos, confirmações de presença, etc.

**Tarefas**:

1. **Setup Firebase**
   - Criar projeto no [Firebase Console](https://console.firebase.google.com/)
   - Adicionar app Android (`com.convoca.app`)
   - Baixar `google-services.json`
   - Colocar em: `android/app/google-services.json`

2. **Instalar Dependências**
   ```bash
   pnpm add @capacitor/push-notifications
   ```

3. **Configurar `android/app/build.gradle`**
   ```gradle
   dependencies {
       implementation platform('com.google.firebase:firebase-bom:34.6.0')
       implementation 'com.google.firebase:firebase-messaging'
       // ... outras deps
   }

   apply plugin: 'com.google.gms.google-services'
   ```

4. **Criar Serviço de Push Notifications**

   **Arquivo**: `src/lib/mobile/push-notifications.ts`
   ```typescript
   import { PushNotifications } from '@capacitor/push-notifications';
   import { sql } from '@/db/client';

   export const registerPushNotifications = async (userId: string) => {
     // 1. Solicitar permissão
     const permission = await PushNotifications.requestPermissions();

     if (permission.receive !== 'granted') {
       throw new Error('Permissão de notificação negada');
     }

     // 2. Registrar no Firebase
     await PushNotifications.register();

     // 3. Listener: Token FCM
     await PushNotifications.addListener('registration', async (token) => {
       console.log('FCM Token:', token.value);

       // Salvar token no banco
       await sql`
         INSERT INTO push_tokens (user_id, token, platform)
         VALUES (${userId}, ${token.value}, 'android')
         ON CONFLICT (user_id, platform)
         DO UPDATE SET token = ${token.value}, updated_at = NOW()
       `;
     });

     // 4. Listener: Notificação recebida (app em foreground)
     await PushNotifications.addListener('pushNotificationReceived', (notification) => {
       console.log('Push received:', notification);
       // Mostrar toast ou alerta
     });

     // 5. Listener: Notificação clicada
     await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
       console.log('Push action:', action);
       // Navegar para tela específica
       const data = action.notification.data;
       if (data.eventId) {
         window.location.href = `/events/${data.eventId}`;
       }
     });
   };

   export const unregisterPushNotifications = async () => {
     await PushNotifications.removeAllListeners();
   };
   ```

5. **Integrar no App**

   **Arquivo**: `src/app/layout.tsx`
   ```typescript
   'use client';
   import { useEffect } from 'react';
   import { registerPushNotifications } from '@/lib/mobile/push-notifications';
   import { useAuth } from '@/hooks/useAuth';

   export default function RootLayout({ children }) {
     const { user } = useAuth();

     useEffect(() => {
       if (user?.id && isMobile()) {
         registerPushNotifications(user.id).catch(console.error);
       }
     }, [user]);

     return <html><body>{children}</body></html>;
   }
   ```

6. **Criar Tabela `push_tokens` no Banco**

   **Arquivo**: `src/db/migrations/add-push-tokens.sql`
   ```sql
   CREATE TABLE push_tokens (
     id SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     token TEXT NOT NULL,
     platform VARCHAR(20) NOT NULL CHECK (platform IN ('android', 'ios')),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id, platform)
   );

   CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
   ```

7. **Criar API para Enviar Notificações**

   **Arquivo**: `src/app/api/notifications/send/route.ts`
   ```typescript
   import { requireAuth } from '@/lib/auth-helpers';
   import { sql } from '@/db/client';
   import { sendPushNotification } from '@/lib/firebase-admin';

   export async function POST(req: Request) {
     try {
       await requireAuth();
       const { userId, title, body, data } = await req.json();

       // Buscar token do usuário
       const tokens = await sql`
         SELECT token FROM push_tokens WHERE user_id = ${userId}
       `;

       // Enviar notificação
       for (const { token } of tokens) {
         await sendPushNotification(token, { title, body, data });
       }

       return NextResponse.json({ success: true });
     } catch (error) {
       logger.error(error, 'Erro ao enviar notificação');
       return NextResponse.json({ error: 'Erro ao enviar' }, { status: 500 });
     }
   }
   ```

8. **Criar Serviço Firebase Admin (Backend)**

   **Arquivo**: `src/lib/firebase-admin.ts`
   ```typescript
   import admin from 'firebase-admin';

   if (!admin.apps.length) {
     admin.initializeApp({
       credential: admin.credential.cert({
         projectId: process.env.FIREBASE_PROJECT_ID,
         clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
         privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
       }),
     });
   }

   export const sendPushNotification = async (
     token: string,
     payload: { title: string; body: string; data?: any }
   ) => {
     return admin.messaging().send({
       token,
       notification: {
         title: payload.title,
         body: payload.body,
       },
       data: payload.data || {},
       android: {
         priority: 'high',
       },
     });
   };
   ```

**Casos de Uso**:
- ✅ Novo evento criado → Notificar membros do grupo
- ✅ Evento confirmado → Notificar criador
- ✅ Faltam 1 dia para evento → Lembrete para confirmados
- ✅ Times sorteados → Notificar todos participantes
- ✅ Novo membro no grupo → Notificar admins

**Entregáveis**:
- ✅ Push notifications funcionando
- ✅ Tabela `push_tokens` criada
- ✅ API de envio de notificações
- ✅ Integração com eventos do app

---

#### 3.2. Autenticação Biométrica

**Objetivo**: Login rápido com impressão digital / Face ID.

**Tarefas**:

1. **Instalar Plugin**
   ```bash
   pnpm add @aparajita/capacitor-biometric-auth
   npx cap sync
   ```

2. **Criar Serviço de Biometria**

   **Arquivo**: `src/lib/mobile/biometric.ts`
   ```typescript
   import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';

   export const checkBiometricAvailable = async () => {
     try {
       const result = await BiometricAuth.checkBiometry();
       return {
         available: result.isAvailable,
         type: result.biometryType, // fingerprint, face, iris
         strongBiometryAvailable: result.strongBiometryAvailable,
       };
     } catch (error) {
       return { available: false };
     }
   };

   export const authenticateWithBiometric = async (reason: string = 'Autenticar') => {
     try {
       const result = await BiometricAuth.authenticate({
         reason,
         cancelTitle: 'Cancelar',
         allowDeviceCredential: true, // Permite PIN/padrão
         iosFallbackTitle: 'Usar senha',
       });

       return result.verified;
     } catch (error) {
       console.error('Biometric error:', error);
       return false;
     }
   };
   ```

3. **Integrar no Login**

   **Arquivo**: `src/app/auth/signin/page.tsx`
   ```typescript
   'use client';
   import { authenticateWithBiometric } from '@/lib/mobile/biometric';
   import { usePlatform } from '@/lib/mobile/platform-detector';

   export default function SignInPage() {
     const { isMobile } = usePlatform();
     const [biometricEnabled, setBiometricEnabled] = useState(false);

     useEffect(() => {
       if (isMobile) {
         checkBiometricAvailable().then(({ available }) => {
           setBiometricEnabled(available);
         });
       }
     }, [isMobile]);

     const handleBiometricLogin = async () => {
       const verified = await authenticateWithBiometric('Login no Convoca');

       if (verified) {
         // Buscar credenciais salvas (localStorage seguro)
         const savedCredentials = localStorage.getItem('convoca_credentials');
         if (savedCredentials) {
           const { email, token } = JSON.parse(savedCredentials);
           // Autenticar com token
           await signIn('credentials', { email, token });
         }
       }
     };

     return (
       <div>
         <form>{/* Form normal */}</form>

         {biometricEnabled && (
           <button onClick={handleBiometricLogin}>
             🔐 Entrar com Biometria
           </button>
         )}
       </div>
     );
   }
   ```

4. **Adicionar Permissões no AndroidManifest.xml**
   ```xml
   <uses-permission android:name="android.permission.USE_BIOMETRIC" />
   <uses-permission android:name="android.permission.USE_FINGERPRINT" />
   ```

**Entregáveis**:
- ✅ Login com biometria funcional
- ✅ Opção de habilitar/desabilitar nas configurações
- ✅ Fallback para senha se biometria falhar

---

#### 3.3. Câmera (Fotos de Perfil / Eventos)

**Objetivo**: Permitir tirar/escolher fotos para perfil e eventos.

**Tarefas**:

1. **Instalar Plugin**
   ```bash
   pnpm add @capacitor/camera
   npx cap sync
   ```

2. **Criar Serviço de Câmera**

   **Arquivo**: `src/lib/mobile/camera.ts`
   ```typescript
   import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

   export const takePicture = async (source: 'camera' | 'gallery' = 'camera') => {
     try {
       const image = await Camera.getPhoto({
         quality: 90,
         allowEditing: true,
         resultType: CameraResultType.Base64,
         source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
       });

       return {
         base64: `data:image/${image.format};base64,${image.base64String}`,
         format: image.format,
       };
     } catch (error) {
       console.error('Camera error:', error);
       return null;
     }
   };

   export const uploadImage = async (base64: string, type: 'profile' | 'event') => {
     // Upload para storage (Supabase, S3, etc.)
     const response = await fetch('/api/upload', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ image: base64, type }),
     });

     if (!response.ok) throw new Error('Upload failed');

     const { url } = await response.json();
     return url;
   };
   ```

3. **Integrar no Perfil**

   **Arquivo**: `src/components/profile/ProfilePictureUpload.tsx`
   ```typescript
   'use client';
   import { takePicture, uploadImage } from '@/lib/mobile/camera';
   import { usePlatform } from '@/lib/mobile/platform-detector';

   export default function ProfilePictureUpload() {
     const { isMobile } = usePlatform();
     const [loading, setLoading] = useState(false);

     const handleUpload = async (source: 'camera' | 'gallery') => {
       setLoading(true);
       try {
         const image = await takePicture(source);
         if (!image) return;

         const url = await uploadImage(image.base64, 'profile');

         // Atualizar perfil
         await fetch('/api/profile/update', {
           method: 'PATCH',
           body: JSON.stringify({ profilePicture: url }),
         });

         // Atualizar UI
         window.location.reload();
       } catch (error) {
         console.error(error);
       } finally {
         setLoading(false);
       }
     };

     if (!isMobile) {
       return <input type="file" accept="image/*" />;
     }

     return (
       <div>
         <button onClick={() => handleUpload('camera')}>
           📷 Tirar Foto
         </button>
         <button onClick={() => handleUpload('gallery')}>
           🖼️ Escolher da Galeria
         </button>
       </div>
     );
   }
   ```

4. **Adicionar Permissões no AndroidManifest.xml**
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   ```

**Entregáveis**:
- ✅ Upload de foto de perfil via câmera/galeria
- ✅ Upload de foto de evento
- ✅ Integração com storage (Supabase Storage ou similar)

---

#### 3.4. Geolocalização (Locais de Eventos)

**Objetivo**: Preencher automaticamente local do evento, mostrar mapa.

**Tarefas**:

1. **Instalar Plugin**
   ```bash
   pnpm add @capacitor/geolocation
   npx cap sync
   ```

2. **Criar Serviço de Geolocalização**

   **Arquivo**: `src/lib/mobile/geolocation.ts`
   ```typescript
   import { Geolocation } from '@capacitor/geolocation';

   export const getCurrentLocation = async () => {
     try {
       const position = await Geolocation.getCurrentPosition({
         enableHighAccuracy: true,
         timeout: 10000,
       });

       return {
         latitude: position.coords.latitude,
         longitude: position.coords.longitude,
         accuracy: position.coords.accuracy,
       };
     } catch (error) {
       console.error('Geolocation error:', error);
       return null;
     }
   };

   export const reverseGeocode = async (lat: number, lng: number) => {
     // Usar API de geocoding (Google Maps, OpenStreetMap)
     const response = await fetch(
       `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
     );
     const data = await response.json();
     return data.display_name;
   };
   ```

3. **Integrar no Formulário de Evento**

   **Arquivo**: `src/components/events/EventForm.tsx`
   ```typescript
   import { getCurrentLocation, reverseGeocode } from '@/lib/mobile/geolocation';

   export default function EventForm() {
     const [location, setLocation] = useState('');

     const handleGetLocation = async () => {
       const coords = await getCurrentLocation();
       if (!coords) return;

       const address = await reverseGeocode(coords.latitude, coords.longitude);
       setLocation(address);
     };

     return (
       <form>
         <input value={location} onChange={(e) => setLocation(e.target.value)} />
         <button type="button" onClick={handleGetLocation}>
           📍 Usar Localização Atual
         </button>
       </form>
     );
   }
   ```

4. **Adicionar Permissões no AndroidManifest.xml**
   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   ```

**Entregáveis**:
- ✅ Botão "Usar localização atual" em eventos
- ✅ Integração com API de geocoding
- ✅ Permissões de localização configuradas

---

#### 3.5. Compartilhamento Nativo

**Objetivo**: Compartilhar convites de grupo/evento via WhatsApp, SMS, etc.

**Tarefas**:

1. **Instalar Plugin**
   ```bash
   pnpm add @capacitor/share
   npx cap sync
   ```

2. **Criar Serviço de Compartilhamento**

   **Arquivo**: `src/lib/mobile/share.ts`
   ```typescript
   import { Share } from '@capacitor/share';

   export const shareGroupInvite = async (groupName: string, inviteCode: string) => {
     const url = `https://convoca.app/groups/join?code=${inviteCode}`;
     const text = `Junte-se ao grupo "${groupName}" no Convoca!\n\nCódigo: ${inviteCode}\nLink: ${url}`;

     try {
       await Share.share({
         title: `Convite - ${groupName}`,
         text,
         url,
         dialogTitle: 'Compartilhar convite',
       });
     } catch (error) {
       console.error('Share error:', error);
     }
   };

   export const shareEventInvite = async (eventTitle: string, eventDate: string) => {
     const text = `Evento: ${eventTitle}\nData: ${eventDate}\n\nConfirme sua presença no Convoca!`;

     await Share.share({
       title: `Convite - ${eventTitle}`,
       text,
       dialogTitle: 'Compartilhar evento',
     });
   };
   ```

3. **Integrar nos Botões de Compartilhamento**

   **Arquivo**: `src/components/groups/GroupHeader.tsx`
   ```typescript
   import { shareGroupInvite } from '@/lib/mobile/share';
   import { Share2 } from 'lucide-react';

   export default function GroupHeader({ group }) {
     return (
       <header>
         <h1>{group.name}</h1>
         <button onClick={() => shareGroupInvite(group.name, group.invite_code)}>
           <Share2 className="w-5 h-5" />
           Convidar
         </button>
       </header>
     );
   }
   ```

**Entregáveis**:
- ✅ Compartilhamento de convites via apps nativos
- ✅ Compartilhamento de eventos
- ✅ Deep linking configurado (`convoca://groups/join?code=XXX`)

---

### **FASE 4: Otimizações e Performance (Semana 6)**

#### 4.1. Offline Mode e Caching

**Objetivo**: App funcional sem internet (dados em cache).

**Tarefas**:

1. **Configurar Service Worker**

   **Arquivo**: `next.config.ts`
   ```typescript
   import withPWA from 'next-pwa';

   const nextConfig = withPWA({
     dest: 'public',
     disable: process.env.NODE_ENV === 'development',
   })({
     // ... config existente
   });
   ```

2. **Criar `public/manifest.json`**
   ```json
   {
     "name": "Convoca - Gestão de Peladas",
     "short_name": "Convoca",
     "description": "Organize suas peladas com facilidade",
     "start_url": "/dashboard",
     "display": "standalone",
     "background_color": "#16a34a",
     "theme_color": "#16a34a",
     "icons": [
       {
         "src": "/icons/icon-192x192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icons/icon-512x512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

3. **Detectar Status de Conexão**

   **Arquivo**: `src/lib/mobile/network.ts`
   ```typescript
   import { Network } from '@capacitor/network';
   import { useState, useEffect } from 'react';

   export const useNetworkStatus = () => {
     const [isOnline, setIsOnline] = useState(true);

     useEffect(() => {
       Network.getStatus().then(status => {
         setIsOnline(status.connected);
       });

       const listener = Network.addListener('networkStatusChange', status => {
         setIsOnline(status.connected);
       });

       return () => {
         listener.remove();
       };
     }, []);

     return { isOnline };
   };
   ```

4. **Implementar Cache de Dados**
   - Usar IndexedDB para armazenar grupos/eventos
   - Sincronizar quando voltar online
   - Mostrar badge "Offline" quando sem conexão

**Entregáveis**:
- ✅ App funciona offline (leitura de dados em cache)
- ✅ Sincronização automática quando voltar online
- ✅ Indicador visual de status de conexão

---

#### 4.2. Otimização de Imagens e Assets

**Tarefas**:

1. **Configurar Compression de Imagens**
   - Usar WebP para imagens
   - Lazy loading em listas longas
   - Redimensionar imagens no upload

2. **Code Splitting**
   ```typescript
   // Carregar componentes pesados sob demanda
   const EventStats = dynamic(() => import('@/components/events/EventStats'), {
     loading: () => <Skeleton />,
   });
   ```

3. **Reduzir Bundle Size**
   - Analisar bundle: `pnpm build && npx @next/bundle-analyzer`
   - Remover dependências não usadas
   - Tree-shaking de bibliotecas grandes

**Entregáveis**:
- ✅ Tempo de carregamento < 3s
- ✅ Bundle size < 1MB (gzipped)
- ✅ Imagens otimizadas (WebP)

---

### **FASE 5: Testes e Build de Produção (Semana 7)**

#### 5.1. Testes em Dispositivos Reais

**Tarefas**:

1. **Testar em Emuladores**
   ```bash
   # Abrir Android Studio
   npx cap open android

   # Rodar em emulador
   npx cap run android
   ```

2. **Testar em Dispositivos Físicos**
   - Conectar via USB
   - Habilitar depuração USB
   - Instalar APK de debug

3. **Checklist de Testes**
   - ✅ Login/Logout
   - ✅ Criar grupo
   - ✅ Criar evento
   - ✅ Confirmar presença
   - ✅ Sorteio de times
   - ✅ Push notifications
   - ✅ Biometria
   - ✅ Câmera/upload de foto
   - ✅ Compartilhamento
   - ✅ Modo offline
   - ✅ Back button
   - ✅ Rotação de tela
   - ✅ Diferentes tamanhos de tela

---

#### 5.2. Configuração de Signing (Assinatura de APK)

**Objetivo**: Gerar APK assinado para publicação na Play Store.

**Tarefas**:

1. **Gerar Keystore**
   ```bash
   keytool -genkey -v -keystore release.keystore -alias convoca -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Criar `android/release.properties`** (⚠️ NÃO commitar)
   ```properties
   storeFile=release.keystore
   storePassword=SEU_PASSWORD
   keyAlias=convoca
   keyPassword=SEU_PASSWORD
   ```

3. **Configurar `android/app/build.gradle`**
   ```gradle
   android {
       signingConfigs {
           release {
               def props = new Properties()
               file("../release.properties").withInputStream { props.load(it) }

               storeFile file(props['storeFile'])
               storePassword props['storePassword']
               keyAlias props['keyAlias']
               keyPassword props['keyPassword']
           }
       }

       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

4. **Build de Produção**
   ```bash
   # Build APK
   cd android
   ./gradlew assembleRelease

   # Build AAB (Android App Bundle - recomendado para Play Store)
   ./gradlew bundleRelease

   # Arquivos gerados:
   # APK: android/app/build/outputs/apk/release/app-release.apk
   # AAB: android/app/build/outputs/bundle/release/app-release.aab
   ```

**Entregáveis**:
- ✅ APK de release assinado
- ✅ AAB para Play Store
- ✅ Keystore armazenado com segurança

---

#### 5.3. Publicação na Play Store

**Tarefas**:

1. **Criar Conta no Google Play Console**
   - Taxa única: $25 USD
   - Link: https://play.google.com/console

2. **Preparar Materiais de Store Listing**
   - **Nome do app**: Convoca - Gestão de Peladas
   - **Descrição curta** (80 chars):
     > Organize peladas, sorteie times e acompanhe estatísticas com facilidade!

   - **Descrição completa**:
     > Convoca é o app definitivo para organizar suas peladas de futebol.
     >
     > ⚽ Crie grupos e convide amigos
     > 📅 Agende eventos facilmente
     > ✅ Confirme presença com 1 clique
     > 🎲 Sorteie times automaticamente
     > 📊 Acompanhe estatísticas e rankings
     > 💰 Gerencie cobranças do grupo
     >
     > Simples, rápido e feito para brasileiros que amam futebol!

   - **Screenshots** (mínimo 2, recomendado 8):
     - Tela de login
     - Dashboard
     - Lista de grupos
     - Detalhes de evento
     - Sorteio de times
     - Rankings

   - **Ícone do app**: 512x512px (PNG)
   - **Feature graphic**: 1024x500px (Banner)
   - **Categoria**: Esportes
   - **Classificação de conteúdo**: Livre (PEGI 3)

3. **Upload do AAB**
   - Criar release em "Produção" ou "Teste interno"
   - Upload do `app-release.aab`
   - Preencher notas de versão

4. **Submeter para Revisão**
   - Tempo de revisão: 1-7 dias
   - Corrigir eventuais problemas apontados pelo Google

**Entregáveis**:
- ✅ App publicado na Play Store
- ✅ Link da loja: `https://play.google.com/store/apps/details?id=com.convoca.app`

---

### **FASE 6: Pós-Lançamento e Manutenção**

#### 6.1. Monitoramento e Analytics

**Tarefas**:

1. **Integrar Firebase Analytics**
   ```bash
   pnpm add @capacitor-firebase/analytics
   ```

   **Arquivo**: `src/lib/analytics.ts`
   ```typescript
   import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

   export const trackEvent = (name: string, params?: any) => {
     FirebaseAnalytics.logEvent({ name, params });
   };

   // Exemplos de uso:
   trackEvent('group_created', { groupId: '123' });
   trackEvent('event_confirmed', { eventId: '456' });
   trackEvent('teams_drawn', { eventId: '789' });
   ```

2. **Integrar Crashlytics (relatórios de crash)**
   ```bash
   pnpm add @capacitor-firebase/crashlytics
   ```

3. **Monitorar Métricas**
   - DAU/MAU (usuários ativos)
   - Taxa de retenção
   - Tempo médio de sessão
   - Eventos mais usados

---

#### 6.2. Sistema de Feedback e Updates

**Tarefas**:

1. **In-App Feedback**
   - Botão "Enviar feedback" nas configurações
   - Form para sugestões/bugs

2. **Sistema de Updates**
   - Notificar usuário quando nova versão disponível
   - Deep link para Play Store

3. **Changelog no App**
   - Mostrar "Novidades" após atualização

---

## 📊 CRONOGRAMA RESUMIDO

| Fase | Duração | Entregáveis Principais |
|------|---------|------------------------|
| **1. Setup Inicial** | 1 semana | Capacitor configurado, APK básico funcionando |
| **2. Adaptações Web→Mobile** | 2 semanas | UI mobile, navegação, bottom nav |
| **3. Funcionalidades Nativas** | 2 semanas | Push, biometria, câmera, geolocalização, share |
| **4. Otimizações** | 1 semana | Offline mode, performance, caching |
| **5. Testes e Build** | 1 semana | Testes completos, APK de release |
| **6. Publicação** | 1-2 semanas | App na Play Store, pós-lançamento |

**Total**: ~8-9 semanas para primeira versão completa

---

## 🎯 PRIORIZAÇÃO (MVP vs. Futuro)

### ✅ MVP (Versão 1.0 - Essencial)
1. Setup Capacitor + APK básico
2. Navegação mobile + UI adaptada
3. Push Notifications (eventos, confirmações)
4. Autenticação (manter login entre sessões)
5. Core features funcionando (grupos, eventos, sorteios)

### 🚀 Versão 1.1 (Melhorias)
1. Biometria
2. Câmera (upload de fotos)
3. Compartilhamento nativo
4. Offline mode

### 🌟 Versão 1.2+ (Futuro)
1. Geolocalização + mapas
2. Vídeos de melhores momentos
3. Integração com redes sociais
4. Chat em tempo real
5. Gamificação avançada

---

## 🛠️ FERRAMENTAS E DEPENDÊNCIAS

### Dependências a Adicionar

```json
{
  "dependencies": {
    "@capacitor/core": "^7.0.0",
    "@capacitor/android": "^7.0.0",
    "@capacitor/app": "^7.0.0",
    "@capacitor/push-notifications": "^7.0.0",
    "@capacitor/network": "^7.0.0",
    "@capacitor/status-bar": "^7.0.0",
    "@capacitor/splash-screen": "^7.0.0",
    "@capacitor/camera": "^7.0.0",
    "@capacitor/geolocation": "^7.0.0",
    "@capacitor/share": "^7.0.0",
    "@aparajita/capacitor-biometric-auth": "^9.0.0",
    "@capacitor-firebase/analytics": "^7.0.0",
    "@capacitor-firebase/crashlytics": "^7.0.0",
    "firebase-admin": "^12.0.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.0.0",
    "cordova-res": "^0.15.4"
  }
}
```

### Ferramentas Necessárias

- **Android Studio**: IDE para desenvolvimento Android
- **Java JDK 17**: Necessário para Gradle
- **Gradle**: Build system Android
- **Firebase Console**: Push notifications, analytics
- **Google Play Console**: Publicação do app

---

## 📝 CHECKLIST DE LANÇAMENTO

### Pré-Lançamento
- [ ] Todos os testes passando
- [ ] APK assinado gerado
- [ ] Keystore armazenado com segurança (backup em local seguro)
- [ ] Firebase configurado (Push, Analytics, Crashlytics)
- [ ] Ícones e splash screens gerados
- [ ] Store listing preparado (screenshots, descrição)
- [ ] Política de privacidade publicada
- [ ] Termos de uso publicados

### Pós-Lançamento
- [ ] Monitorar crashes e erros
- [ ] Responder reviews na Play Store
- [ ] Coletar feedback de usuários
- [ ] Planejar próximas atualizações
- [ ] Otimizar com base em analytics

---

## 🔐 SEGURANÇA

### Boas Práticas

1. **Nunca commitar**:
   - `google-services.json` (Firebase)
   - `release.properties` (keystore passwords)
   - `release.keystore` (chave de assinatura)
   - `.env.mobile` com secrets

2. **Adicionar ao `.gitignore`**:
   ```
   android/app/google-services.json
   android/release.properties
   android/*.keystore
   .env.mobile
   ```

3. **Usar variáveis de ambiente**:
   - Firebase API keys → `.env.local`
   - Database credentials → Neon secrets
   - Auth secrets → NextAuth

4. **HTTPS obrigatório**:
   - Capacitor rejeita HTTP em produção
   - Certificado SSL válido

---

## 📞 SUPORTE E RECURSOS

### Documentação
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Next.js SSG](https://nextjs.org/docs/pages/building-your-application/rendering/static-site-generation)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Play Store Publishing Guide](https://developer.android.com/studio/publish)

### Comunidades
- [Capacitor Community Plugins](https://github.com/capacitor-community)
- [Ionic Forum](https://forum.ionicframework.com/)
- [Stack Overflow - capacitor tag](https://stackoverflow.com/questions/tagged/capacitor)

---

## 🎉 CONCLUSÃO

Este plano fornece um roadmap completo para transformar o **Convoca** em um aplicativo mobile Android nativo usando tecnologia híbrida (Capacitor + Next.js).

**Principais Vantagens**:
- ✅ Código único para web e mobile
- ✅ Performance nativa com plugins Capacitor
- ✅ Acesso a recursos nativos do Android
- ✅ Facilidade de manutenção (um time, uma base de código)
- ✅ Deploy independente (web e mobile)

**Próximos Passos**:
1. Revisar e aprovar este plano
2. Configurar ambiente de desenvolvimento (Android Studio, etc.)
3. Iniciar Fase 1 (Setup Inicial)
4. Iterar com feedback de usuários beta

---

**Dúvidas ou ajustes necessários?** Este documento é vivo e deve ser atualizado conforme o projeto evolui! 🚀
