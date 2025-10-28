# Fix: Vercel 404 Error - Configuração Incorreta

## Problema

A integração com Vercel estava retornando erro 404 nas páginas da aplicação.

## Causa Raiz

O arquivo `vercel.json` continha uma configuração incorreta para aplicações Next.js:

```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next"
}
```

Essa configuração é apropriada para **sites estáticos** ou **frameworks customizados**, mas **não para Next.js**.

## Por que causava erro 404?

1. **Override da detecção automática**: Ao especificar `buildCommand` e `outputDirectory`, você força o Vercel a tratar o projeto como um site estático genérico, ignorando a configuração automática do Next.js.

2. **Roteamento quebrado**: Next.js usa um sistema de roteamento dinâmico (App Router) que requer configuração específica. A configuração manual quebrava esse roteamento.

3. **Middleware ignorado**: O arquivo `src/middleware.ts` (usado para autenticação) não era processado corretamente.

4. **API Routes não funcionavam**: As rotas em `src/app/api/*` não eram reconhecidas como endpoints dinâmicos.

## Solução

Remover a configuração manual e deixar o Vercel detectar automaticamente o Next.js:

```json
{}
```

Ou simplesmente deletar o arquivo `vercel.json` se não houver outras configurações necessárias.

## Como Vercel detecta Next.js

Quando você faz deploy de um repositório, o Vercel:

1. ✅ Procura por `next.config.js` ou `next.config.ts` na raiz
2. ✅ Detecta `package.json` com dependência `next`
3. ✅ Automaticamente configura:
   - Build command: `next build`
   - Output directory: `.next`
   - Install command: `npm install` (ou `pnpm install` se houver `pnpm-lock.yaml`)
   - Development command: `next dev`

## Quando usar vercel.json?

O arquivo `vercel.json` **deve ser usado** apenas para:

### 1. Rewrites e Redirects

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://external-api.com/:path*"
    }
  ],
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    }
  ]
}
```

### 2. Headers Customizados

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### 3. Variáveis de Ambiente (Build-time)

```json
{
  "env": {
    "API_URL": "https://api.example.com"
  }
}
```

### 4. Configurações Avançadas

```json
{
  "regions": ["gru1"],
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## ⚠️ O que NÃO colocar no vercel.json

❌ **NÃO especificar build commands para Next.js:**
```json
{
  "buildCommand": "next build",  // ❌ NÃO FAZER
  "outputDirectory": ".next"     // ❌ NÃO FAZER
}
```

❌ **NÃO especificar framework:**
```json
{
  "framework": "nextjs"  // ❌ Detectado automaticamente
}
```

## Verificando o Deploy

Após corrigir o `vercel.json`:

### 1. Fazer novo deploy

```bash
git add vercel.json
git commit -m "Fix: Remove incorrect Vercel configuration"
git push
```

Ou via CLI:
```bash
vercel --prod
```

### 2. Verificar no Dashboard

Acesse [Vercel Dashboard](https://vercel.com/dashboard) e:

1. Vá em seu projeto **peladeiros**
2. Clique na última deployment
3. Verifique em **Build Logs**:
   ```
   ✓ Detected Next.js
   ✓ Installing dependencies...
   ✓ Running "next build"...
   ```

### 3. Testar as Rotas

Teste as seguintes URLs:

- ✅ **Homepage**: `https://seu-dominio.vercel.app/`
- ✅ **Dashboard**: `https://seu-dominio.vercel.app/dashboard`
- ✅ **Auth**: `https://seu-dominio.vercel.app/auth/signin`
- ✅ **API**: `https://seu-dominio.vercel.app/api/debug`

Todas devem retornar conteúdo (não 404).

## Configurações Recomendadas para Next.js

Para a maioria dos projetos Next.js, o `vercel.json` ideal é:

### Opção 1: Vazio (Recomendado)
```json
{}
```

### Opção 2: Com configurações úteis
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Opção 3: Com redirect de www
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "www.peladeiros.com"
        }
      ],
      "destination": "https://peladeiros.com/:path*",
      "permanent": true
    }
  ]
}
```

## Troubleshooting

### Ainda vejo 404 após o fix

**Possíveis causas:**

1. **Cache do navegador**
   - Limpe o cache: Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)
   - Ou abra em aba anônima

2. **Deploy não completou**
   - Verifique se o deploy terminou com sucesso no Dashboard
   - Procure por erros nos Build Logs

3. **DNS ainda propagando**
   - Se usando domínio customizado, aguarde até 24h para propagação
   - Teste com URL `.vercel.app` primeiro

4. **Variáveis de ambiente faltando**
   - Verifique se `DATABASE_URL` está configurada
   - Adicione `NEXTAUTH_URL` e `NEXTAUTH_SECRET`

### Build falha com erros

**Erros comuns:**

1. **"Cannot find module"**
   - Delete `node_modules` e reinstale: `npm install`
   - Commit o `package-lock.json` atualizado

2. **TypeScript errors**
   - Execute `npm run build` localmente primeiro
   - Corrija os erros antes de fazer deploy

3. **Database connection error**
   - Verifique se a integração Neon foi adicionada
   - Confirme que `DATABASE_URL` existe nas Environment Variables

## Recursos Úteis

- [Vercel Next.js Documentation](https://vercel.com/docs/frameworks/nextjs)
- [vercel.json Configuration](https://vercel.com/docs/projects/project-configuration)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)

## Resumo

✅ **Antes**: `vercel.json` com `buildCommand` → ❌ 404 errors
✅ **Depois**: `vercel.json` vazio → ✅ App funcionando

**Lição aprendida**: Para Next.js, **menos é mais**. Deixe o Vercel fazer a detecção automática!
