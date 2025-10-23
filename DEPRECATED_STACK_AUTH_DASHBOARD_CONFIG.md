# Configuração do Stack Auth Dashboard

Este guia explica como configurar corretamente o Stack Auth no dashboard para resolver o erro "OTP sign-in is not enabled for this project".

## ⚠️ Problema

Erro ao fazer login:
```
StackAssertionError: Failed to send request to https://api.stack-auth.com/api/v1/auth/otp/send-sign-in-code: 403 OTP sign-in is not enabled for this project
```

## 🔧 Solução

O erro ocorre porque o método de autenticação OTP (One-Time Password) / Magic Link não está habilitado no projeto do Stack Auth. Siga os passos abaixo para habilitar:

### Passo 1: Acessar o Dashboard do Stack Auth

1. Acesse: [https://app.stack-auth.com](https://app.stack-auth.com)
2. Faça login na sua conta
3. Selecione o projeto: **Peladeiros** (Project ID: `1bc505ea-b01d-44d6-af8d-c1fd464802d0`)

### Passo 2: Configurar Métodos de Autenticação

1. No menu lateral, clique em **"Authentication"** ou **"Sign-in Methods"**
2. Você verá uma lista de métodos de autenticação disponíveis:
   - Password
   - Magic Link / OTP
   - OAuth (Google, GitHub, etc.)
   - Passkeys

### Passo 3: Habilitar Magic Link / OTP

1. Localize a opção **"Magic Link"** ou **"OTP Sign-in"**
2. Clique no botão **"Enable"** ou toggle switch para ativar
3. Se houver opções de configuração, use as seguintes:
   - **Email Provider**: Use o provider padrão do Stack Auth
   - **Email From Name**: Peladeiros
   - **Email From Address**: Use o email padrão fornecido pelo Stack Auth
   - **Token Expiration**: 15 minutos (padrão)

### Passo 4: Configurar URLs de Redirecionamento

1. No dashboard, vá para **"Settings"** > **"URLs"** ou **"Redirect URLs"**
2. Adicione as seguintes URLs autorizadas:

   **Para desenvolvimento local:**
   ```
   http://localhost:3000
   http://localhost:3000/handler/sign-in
   http://localhost:3000/handler/sign-up
   http://localhost:3000/handler/magic-link-callback
   http://localhost:3000/dashboard
   ```

   **Para produção (Vercel):**
   ```
   https://peladeiros.vercel.app
   https://peladeiros.vercel.app/handler/sign-in
   https://peladeiros.vercel.app/handler/sign-up
   https://peladeiros.vercel.app/handler/magic-link-callback
   https://peladeiros.vercel.app/dashboard
   ```
   
   ⚠️ **Importante**: Substitua `peladeiros.vercel.app` pela sua URL real do Vercel.

3. Salve as alterações

### Passo 5: Verificar Configuração de Email

1. Vá para **"Email"** ou **"Email Templates"** no dashboard
2. Verifique se os templates de email estão configurados:
   - **Magic Link Email**: Template para envio do link mágico
   - Certifique-se de que o template está ativo

### Passo 6: Salvar e Testar

1. Salve todas as alterações no dashboard
2. Aguarde alguns minutos para as alterações propagarem
3. Teste o login no aplicativo

## 🧪 Como Testar

### Teste Local

1. Execute o app localmente:
   ```bash
   npm run dev
   ```

2. Acesse: [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin)
   - Você será redirecionado para `/handler/sign-in`

3. Na página de sign-in do Stack Auth:
   - Digite seu email
   - Clique em "Send Magic Link" ou "Enviar Link Mágico"
   - Verifique seu email
   - Clique no link recebido
   - Você deve ser redirecionado para `/dashboard` autenticado

### Teste em Produção

1. Acesse sua URL do Vercel
2. Tente fazer login
3. Verifique se o magic link é enviado corretamente

## 🚨 Troubleshooting

### Erro persiste após habilitar Magic Link

**Solução 1: Limpar Cache**
```bash
# Limpar cache do navegador
# Ou usar modo anônimo
```

**Solução 2: Verificar Variáveis de Ambiente**
```bash
# No Vercel Dashboard, verifique se as variáveis estão corretas:
NEXT_PUBLIC_STACK_PROJECT_ID=1bc505ea-b01d-44d6-af8d-c1fd464802d0
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_...
STACK_SECRET_SERVER_KEY=ssk_...
```

**Solução 3: Redesenhar (Redeploy)**
```bash
# No Vercel Dashboard:
# 1. Vá para Deployments
# 2. Clique nos três pontos do último deploy
# 3. Clique em "Redeploy"
```

### Magic Link não chega no email

1. Verifique a pasta de spam
2. Confirme que o email está correto
3. No Stack Auth dashboard, verifique se o email provider está configurado
4. Tente com outro provedor de email (Gmail, Outlook)

### Erro: "Redirect URL not whitelisted"

1. Volte ao Passo 4 e adicione todas as URLs necessárias
2. Certifique-se de adicionar:
   - URL base (sem trailing slash)
   - URL com `/handler/sign-in`
   - URL com `/handler/sign-up`
   - URL com `/handler/magic-link-callback`
   - URL com `/dashboard`

### Erro 403 ainda aparece

1. Aguarde 5-10 minutos após fazer alterações no dashboard
2. Limpe cache do navegador
3. Tente em modo anônimo
4. Verifique se o Project ID está correto nas variáveis de ambiente

## 📋 Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

- [ ] Magic Link / OTP está habilitado no dashboard
- [ ] URLs de redirecionamento estão configuradas (dev + prod)
- [ ] Email templates estão ativos
- [ ] Variáveis de ambiente estão corretas no Vercel
- [ ] Projeto foi redesenhado após mudanças
- [ ] Testou em ambiente local
- [ ] Testou em produção

## 🔄 Alternativa: Usar Password Authentication

Se preferir usar autenticação por senha em vez de magic link:

1. No Stack Auth dashboard, habilite **"Password Authentication"**
2. Desabilite ou deixe desabilitado **"Magic Link / OTP"**
3. O Stack Auth automaticamente mostrará um formulário de login com email/senha

## 📚 Recursos Adicionais

- [Stack Auth Documentation](https://docs.stack-auth.com)
- [Stack Auth Authentication Methods](https://docs.stack-auth.com/authentication/overview)
- [Stack Auth Dashboard Guide](https://docs.stack-auth.com/getting-started/dashboard)

## 💡 Dica

Após configurar o Stack Auth corretamente, você pode personalizar as páginas de autenticação usando os componentes do Stack Auth ou criando suas próprias páginas customizadas que usam os métodos corretos da SDK.

## 🎯 Resumo da Solução

1. **Acesse o dashboard**: [https://app.stack-auth.com](https://app.stack-auth.com)
2. **Habilite Magic Link / OTP** na seção de Authentication
3. **Configure URLs de redirecionamento** para dev e prod
4. **Salve as alterações** e aguarde propagação
5. **Teste o login** no aplicativo

Seguindo estes passos, o erro "OTP sign-in is not enabled for this project" será resolvido e o login funcionará corretamente.
