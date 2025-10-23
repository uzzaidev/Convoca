# Correção do Erro de Magic Link - "body.code must be exactly 45 characters"

## Problema

Ao tentar fazer login com magic link, os usuários encontravam o seguinte erro:

```
Request validation failed on POST /api/v1/auth/otp/sign-in:
- body.code must be exactly 45 characters
```

Este erro aparecia na tela como "Erro ao enviar link de login. Tente novamente."

## Causa Raiz

O problema tinha duas causas principais:

### 1. Uso Incorreto da API do Stack Auth

A aplicação estava usando o método `signInWithMagicLink(email)` que **não é o método correto** para enviar um magic link. Este método é usado internamente pelo Stack Auth para **processar** o código do magic link quando o usuário clica no link do email.

O método correto para **enviar** o magic link por email é `sendMagicLinkEmail(email, options)`.

**Antes (incorreto):**
```typescript
await app.signInWithMagicLink(email);
```

**Depois (correto):**
```typescript
const result = await app.sendMagicLinkEmail(email, {
  callbackUrl: `${baseUrl}/handler/magic-link-callback`,
});
```

### 2. Middleware Interceptando Rotas do Handler

O middleware de autenticação estava interceptando todas as rotas, incluindo as rotas `/handler/*` que são usadas pelo Stack Auth para processar os callbacks de autenticação (incluindo o callback do magic link).

Isso impedia que o Stack Auth processasse corretamente o código do magic link quando o usuário clicava no link recebido por email.

## Solução Implementada

### Mudança 1: Atualização do Método de Login

Arquivo: `src/app/auth/signin/page.tsx`

```typescript
async function handleSignIn(e: React.FormEvent) {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    // Stack Auth envia um magic link por email
    // O callbackUrl é onde o usuário será redirecionado após clicar no link
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const result = await app.sendMagicLinkEmail(email, {
      callbackUrl: `${baseUrl}/handler/magic-link-callback`,
    });
    
    if (result.status === "ok") {
      // Mostrar mensagem de sucesso
      setError("Link mágico enviado! Verifique seu email.");
    } else {
      // Tratar erro específico
      console.error("Erro ao enviar magic link:", result.error);
      setError("Erro ao enviar link de login. Tente novamente.");
    }
  } catch (err) {
    console.error("Erro ao fazer login:", err);
    setError("Erro ao enviar link de login. Tente novamente.");
  } finally {
    setIsLoading(false);
  }
}
```

**Mudanças principais:**
1. Substituído `signInWithMagicLink()` por `sendMagicLinkEmail()`
2. Adicionado `callbackUrl` nas opções, apontando para `/handler/magic-link-callback`
3. Adicionado tratamento adequado do resultado (verificando `result.status`)

### Mudança 2: Atualização do Middleware

Arquivo: `src/middleware.ts`

```typescript
export async function middleware(req: NextRequest) {
  const user = await stackServerApp.getUser();
  const isLoggedIn = !!user;
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isErrorPage = req.nextUrl.pathname === "/auth/error";
  const isPublicPage = req.nextUrl.pathname === "/" || req.nextUrl.pathname === "/simple-test";
  const isHandlerRoute = req.nextUrl.pathname.startsWith("/handler"); // NOVO

  // Allow unauthenticated access to public pages
  if (isPublicPage) {
    return NextResponse.next();
  }

  // Allow handler routes to process without authentication checks
  // NOVO - Essencial para o callback do magic link funcionar
  if (isHandlerRoute) {
    return NextResponse.next();
  }

  // ... resto do código
}
```

**Mudança principal:**
- Adicionada verificação para rotas `/handler/*`, permitindo que elas sejam processadas sem verificação de autenticação

## Como Funciona Agora

1. **Usuário acessa** `/auth/signin` e insere seu email
2. **Aplicação chama** `sendMagicLinkEmail()` com o email e o callbackUrl
3. **Stack Auth envia** um email com um magic link único
4. **Usuário clica** no link no email
5. **Stack Auth redireciona** para `/handler/magic-link-callback?code=<45-char-code>`
6. **Handler do Stack Auth** (`/handler/[...stack]/page.tsx`) processa o código
7. **Usuário é autenticado** e redirecionado para `/dashboard`

## Fluxo Técnico Detalhado

### Envio do Magic Link

```
Cliente (Browser)
    ↓ sendMagicLinkEmail(email, {callbackUrl})
Stack Auth API
    ↓ Envia email
Caixa de entrada do usuário
```

### Callback do Magic Link

```
Email do usuário (clique no link)
    ↓ https://app.com/handler/magic-link-callback?code=...
Stack Auth Handler (/handler/[...stack]/page.tsx)
    ↓ Valida código (45 caracteres)
    ↓ Cria sessão
    ↓ Redireciona para /dashboard
Dashboard (usuário autenticado)
```

## Validações

- ✅ Build executado com sucesso (`npm run build`)
- ✅ Linting executado sem erros (`npm run lint`)
- ✅ TypeScript compilado sem erros
- ✅ Dev server inicia sem problemas

## Referências

- [Stack Auth Documentation - signInWithMagicLink](https://docs.stack-auth.com/api/overview)
- [Stack Auth SDK - StackClientApp](https://docs.stack-auth.com/next/concepts/stack-app)
- [Stack Auth Handler Route](https://docs.stack-auth.com/next/getting-started)

## Notas Importantes

1. **Handler Route é Obrigatório**: A rota `/handler/[...stack]/page.tsx` é obrigatória para que o Stack Auth funcione corretamente. Ela processa todos os callbacks de autenticação.

2. **callbackUrl**: O `callbackUrl` deve apontar para uma rota dentro de `/handler/[...stack]`. No nosso caso, usamos `/handler/magic-link-callback`.

3. **Código de 45 Caracteres**: O código do magic link enviado pelo Stack Auth tem exatamente 45 caracteres. O erro anterior ocorria porque estávamos tentando enviar o email em vez de processar o código.

4. **Middleware**: É crucial que o middleware não intercepte rotas `/handler/*`, pois elas precisam ser acessíveis sem autenticação prévia para processar os callbacks.

## Troubleshooting

Se o erro persistir:

1. **Verifique as variáveis de ambiente**:
   ```bash
   NEXT_PUBLIC_STACK_PROJECT_ID=...
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=...
   STACK_SECRET_SERVER_KEY=...
   ```

2. **Verifique se o handler route existe**:
   - Arquivo: `src/app/handler/[...stack]/page.tsx`
   - Deve conter: `<StackHandler fullPage app={stackServerApp} />`

3. **Limpe o cache e reconstrua**:
   ```bash
   rm -rf .next
   npm run build
   ```

4. **Verifique o console do navegador** para erros específicos

5. **Desabilite ad blockers** que podem bloquear requisições para `api.stack-auth.com`
