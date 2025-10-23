# Solução para o Erro de Login - Stack Auth

## 📋 Resumo do Problema

**Erro Original:**
```
StackAssertionError: Failed to send request to https://api.stack-auth.com/api/v1/auth/otp/send-sign-in-code: 403 OTP sign-in is not enabled for this project
```

**Causa:**
O projeto Stack Auth não estava configurado corretamente para permitir autenticação via Magic Link / OTP.

## ✅ Mudanças Implementadas

### 1. Atualização da Página de Login (`src/app/auth/signin/page.tsx`)

**Antes:** Página customizada que tentava enviar magic link diretamente
**Depois:** Página que redireciona para o handler nativo do Stack Auth

A página agora simplesmente redireciona para `/handler/sign-in`, que é gerenciado pelo Stack Auth e oferece suporte completo aos métodos de autenticação configurados no dashboard.

### 2. Configuração Explícita de URLs

Atualizados os arquivos:
- `src/lib/stack.ts` (StackServerApp)
- `src/lib/stack-client.ts` (StackClientApp)

Adicionada configuração explícita de URLs:
```typescript
{
  urls: {
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    home: "/",
  }
}
```

Isso garante que o Stack Auth saiba exatamente para onde redirecionar os usuários em cada etapa do fluxo de autenticação.

### 3. Documentação Completa

Criados documentos:
- `STACK_AUTH_DASHBOARD_CONFIG.md` - Guia passo a passo para configurar o dashboard
- Atualização de `STACK_AUTH_GUIDE.md` - Adicionada seção sobre o erro 403

## 🎯 O Que Você Precisa Fazer

### ⚠️ AÇÃO NECESSÁRIA: Configurar o Stack Auth Dashboard

O código foi atualizado, mas você **DEVE** configurar o Stack Auth no dashboard:

1. **Acesse o Dashboard:**
   - URL: https://app.stack-auth.com
   - Projeto: Peladeiros (ID: `1bc505ea-b01d-44d6-af8d-c1fd464802d0`)

2. **Habilite Magic Link / OTP:**
   - Navegue para: Authentication > Sign-in Methods
   - Encontre: "Magic Link" ou "OTP Sign-in"
   - **Ative** o método

3. **Configure URLs de Redirecionamento:**
   
   Adicione estas URLs na seção Settings > URLs:
   
   **Desenvolvimento:**
   ```
   http://localhost:3000
   http://localhost:3000/handler/sign-in
   http://localhost:3000/handler/sign-up
   http://localhost:3000/handler/magic-link-callback
   http://localhost:3000/dashboard
   ```
   
   **Produção (substitua pela sua URL do Vercel):**
   ```
   https://sua-url.vercel.app
   https://sua-url.vercel.app/handler/sign-in
   https://sua-url.vercel.app/handler/sign-up
   https://sua-url.vercel.app/handler/magic-link-callback
   https://sua-url.vercel.app/dashboard
   ```

4. **Salve as Alterações**

5. **Redesenhar (Redeploy) no Vercel:**
   - Vá para Vercel Dashboard
   - Deployments > último deploy > Redeploy
   - Isso aplicará as mudanças de código

### 📖 Guia Completo

Para instruções detalhadas com screenshots e troubleshooting, consulte:
**`STACK_AUTH_DASHBOARD_CONFIG.md`**

## 🧪 Testando a Solução

### Teste Local

```bash
# 1. Instale as dependências (se necessário)
npm install

# 2. Execute o app
npm run dev

# 3. Acesse no navegador
# http://localhost:3000/auth/signin
# Você será redirecionado para /handler/sign-in

# 4. Insira seu email e tente fazer login
```

### Teste em Produção

1. Faça o redeploy no Vercel
2. Acesse sua URL do Vercel
3. Tente fazer login em: `https://sua-url.vercel.app/auth/signin`

## 📊 Fluxo de Autenticação Atualizado

```
Usuário acessa /auth/signin
    ↓
Redirecionado para /handler/sign-in (Stack Auth)
    ↓
Usuário insere email
    ↓
Stack Auth envia Magic Link
    ↓
Usuário clica no link no email
    ↓
Stack Auth valida o link em /handler/magic-link-callback
    ↓
Usuário redirecionado para /dashboard (autenticado)
```

## 🔍 Verificação

Use este checklist para confirmar que tudo está funcionando:

- [ ] ✅ Build passa sem erros (`npm run build`)
- [ ] ✅ Lint passa sem erros (`npm run lint`)
- [ ] ✅ Magic Link / OTP habilitado no dashboard
- [ ] ✅ URLs de redirecionamento configuradas
- [ ] ✅ Variáveis de ambiente corretas no Vercel
- [ ] ✅ Redesenhado no Vercel
- [ ] ✅ Login funciona localmente
- [ ] ✅ Login funciona em produção
- [ ] ✅ Magic link chega no email
- [ ] ✅ Usuário é redirecionado para /dashboard após login

## 🚨 Troubleshooting

### O erro 403 ainda aparece

1. **Verifique se habilitou Magic Link no dashboard**
   - Volte ao dashboard e confirme que está ativado

2. **Aguarde propagação**
   - Mudanças no dashboard podem levar 5-10 minutos para propagar

3. **Limpe cache do navegador**
   - Ou tente em modo anônimo

4. **Verifique variáveis de ambiente**
   ```bash
   # No Vercel, confirme que estão corretas:
   NEXT_PUBLIC_STACK_PROJECT_ID=1bc505ea-b01d-44d6-af8d-c1fd464802d0
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_...
   STACK_SECRET_SERVER_KEY=ssk_...
   ```

### Magic Link não chega

1. Verifique spam/lixeira
2. Tente com outro provedor de email (Gmail, Outlook)
3. Confirme que o email está correto
4. Verifique configuração de email no dashboard

### Erro: "Redirect URL not whitelisted"

- Adicione TODAS as URLs necessárias no dashboard (veja passo 3 acima)
- Não esqueça de adicionar tanto dev quanto prod

## 📚 Recursos Adicionais

- **Configuração Detalhada:** `STACK_AUTH_DASHBOARD_CONFIG.md`
- **Guia Geral do Stack Auth:** `STACK_AUTH_GUIDE.md`
- **Troubleshooting de Magic Link:** `MAGIC_LINK_TROUBLESHOOTING.md`
- **Documentação Oficial:** https://docs.stack-auth.com

## 💡 Alternativa: Autenticação por Senha

Se preferir usar senha em vez de magic link:

1. No dashboard: habilite "Password Authentication"
2. Desabilite "Magic Link / OTP"
3. O Stack Auth mostrará automaticamente um formulário de email/senha

## ✨ Benefícios da Solução

- ✅ **Usa UI nativa do Stack Auth** - Totalmente funcional e mantida
- ✅ **Suporte a múltiplos métodos** - Pode adicionar OAuth (Google, GitHub) facilmente
- ✅ **Menos código customizado** - Menos bugs e manutenção
- ✅ **Melhor UX** - Interface profissional e acessível
- ✅ **Configuração centralizada** - Gerenciada no dashboard

## 🎉 Próximos Passos

Após resolver o erro de login:

1. **Configurar OAuth Providers** (opcional)
   - Google Sign-in
   - GitHub Sign-in
   - No dashboard: Authentication > OAuth Providers

2. **Personalizar Email Templates** (opcional)
   - No dashboard: Email > Templates
   - Adicione logo e cores da marca Peladeiros

3. **Adicionar MFA** (opcional)
   - No dashboard: Security > Multi-Factor Authentication

4. **Configurar Team/Group Management** (futuro)
   - Stack Auth suporta teams/organizações nativamente

## 📝 Resumo dos Arquivos Modificados

```
✅ src/app/auth/signin/page.tsx - Redireciona para Stack Auth
✅ src/lib/stack.ts - URLs configuradas explicitamente
✅ src/lib/stack-client.ts - URLs configuradas explicitamente
✅ STACK_AUTH_DASHBOARD_CONFIG.md - Novo guia
✅ STACK_AUTH_GUIDE.md - Atualizado com erro 403
```

## 🆘 Suporte

Se tiver problemas:

1. Consulte `STACK_AUTH_DASHBOARD_CONFIG.md` para guia detalhado
2. Verifique logs no console do navegador (F12)
3. Verifique logs no Vercel Dashboard
4. Consulte documentação oficial do Stack Auth
5. Abra uma issue no repositório com logs e screenshots

---

## ⚡ Ação Rápida

**Se quiser resolver rapidamente:**

1. 🌐 Acesse: https://app.stack-auth.com
2. 🔑 Habilite: Authentication > Magic Link / OTP
3. 🔗 Adicione URLs: Settings > Redirect URLs (veja seção acima)
4. 💾 Salve tudo
5. 🚀 Redesenhar no Vercel
6. ✅ Teste o login!

---

**Data da Solução:** 23 de outubro de 2025
**Versão do Stack Auth:** 2.8.44
**Versão do Next.js:** 15.5.6
