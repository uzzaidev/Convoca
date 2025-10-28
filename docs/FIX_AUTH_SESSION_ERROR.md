# Fix: Erro 500 no /api/auth/session - Dashboard em Branco

## 🎯 Problema

**Sintomas:**
- ✅ Dashboard mostra página em branco
- ✅ Console mostra erro: `GET /api/auth/session 500 (Internal Server Error)`
- ✅ Mensagem: "There was a problem with the server configuration"
- ✅ Múltiplas requisições sendo feitas repetidamente

**URL afetada:** https://peladeiros.sportstraining.com.br/dashboard

## 🔍 Causa

NextAuth v5 (Auth.js) usa a variável de ambiente `AUTH_SECRET` por padrão, mas o código estava procurando por `NEXTAUTH_SECRET`. Se apenas `AUTH_SECRET` estiver configurado no Vercel (ou vice-versa), o NextAuth falha ao validar sessões.

## ✅ Solução

### 1. Código Atualizado

O código foi corrigido para aceitar **ambas** as variáveis:

```typescript
// src/lib/auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  // ... outras configurações
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
```

### 2. Configurar Variável no Vercel

**IMPORTANTE:** Você precisa configurar a variável de ambiente no Vercel.

#### Opção A: Via Dashboard (Recomendado)

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione o projeto **peladeiros**
3. Vá em **Settings** → **Environment Variables**
4. Verifique se existe `AUTH_SECRET` ou `NEXTAUTH_SECRET`

**Se não existir ou estiver vazio:**

1. Clique em **Add New**
2. **Key**: `AUTH_SECRET`
3. **Value**: Gere um valor com:
   ```bash
   openssl rand -base64 32
   ```
   Exemplo de saída: `tCJjXPWTVxuSWLwmwkhPxB6cC/oV2tI1UmF1FHYbL2Y=`
4. **Environments**: Selecione todas (Production, Preview, Development)
5. Clique em **Save**

#### Opção B: Via CLI

```bash
# Gerar secret
openssl rand -base64 32

# Adicionar ao Vercel (copie o output do comando acima)
vercel env add AUTH_SECRET
# Cole o valor gerado quando solicitado
# Selecione todos os ambientes (Production, Preview, Development)
```

### 3. Fazer Redeploy

Após adicionar a variável de ambiente:

**Opção A: Via Dashboard**
1. Vá em **Deployments**
2. Clique nos três pontos do último deployment
3. Clique em **Redeploy**

**Opção B: Via Git**
```bash
# Faça um commit vazio para forçar redeploy
git commit --allow-empty -m "Trigger redeploy after adding AUTH_SECRET"
git push
```

**Opção C: Via CLI**
```bash
vercel --prod
```

### 4. Verificar Fix

Após o redeploy completar:

1. Acesse: https://peladeiros.sportstraining.com.br/api/auth/session
   - **Antes:** Erro 500
   - **Depois:** `null` (JSON) ou dados da sessão se estiver logado

2. Acesse: https://peladeiros.sportstraining.com.br/dashboard
   - **Antes:** Página em branco com erros no console
   - **Depois:** Redirecionamento para /auth/signin ou dashboard carregado

3. Verifique o console do navegador:
   - **Antes:** Múltiplos erros 500
   - **Depois:** Sem erros de autenticação

## 📋 Checklist de Verificação

- [ ] Variável `AUTH_SECRET` adicionada no Vercel
- [ ] Valor gerado com `openssl rand -base64 32`
- [ ] Aplicado em todos os ambientes (Production, Preview, Development)
- [ ] Redeploy realizado
- [ ] `/api/auth/session` retorna 200 (não mais 500)
- [ ] Dashboard não está mais em branco
- [ ] Sem múltiplas requisições repetidas no console

## 🔧 Troubleshooting

### Ainda vejo erro 500?

1. **Verifique o log do deployment:**
   - Vá no Dashboard → Deployments → clique no deployment
   - Verifique se há erros durante o build

2. **Verifique a variável:**
   ```bash
   # Pull das env vars do Vercel
   vercel env pull .env.vercel
   
   # Verifique se AUTH_SECRET existe
   cat .env.vercel | grep AUTH_SECRET
   ```

3. **Teste localmente:**
   ```bash
   # Use as mesmas env vars do Vercel
   vercel env pull
   npm run dev
   
   # Teste
   curl http://localhost:3000/api/auth/session
   # Deve retornar: null (não erro 500)
   ```

### Erro persiste após redeploy?

1. **Limpe o cache do navegador:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)
   - Ou use aba anônima

2. **Verifique se o deployment está usando o código atualizado:**
   - Vá em Deployments
   - Verifique o commit hash
   - Deve ser o mesmo do PR que inclui a correção

3. **Verifique os logs em tempo real:**
   - No dashboard do Vercel, vá em **Functions**
   - Selecione `api/auth/[...nextauth]`
   - Veja os logs de execução

## 📚 Referências

- [NextAuth v5 Documentation](https://authjs.dev/getting-started/installation)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- Guia interno: [NEON_AUTH_GUIDE.md](./NEON_AUTH_GUIDE.md)

## ✅ Resumo

**Mudanças realizadas:**
1. ✅ Código atualizado para aceitar `AUTH_SECRET` ou `NEXTAUTH_SECRET`
2. ✅ Documentação atualizada (.env.example, README, DEPLOYMENT_CHECKLIST)
3. ✅ Testado localmente (200 OK)
4. ✅ Build de produção validado

**Próximo passo (você):**
- [ ] Configurar `AUTH_SECRET` no Vercel
- [ ] Fazer redeploy
- [ ] Testar em produção

---

**Data da correção:** 2025-10-24
**Commit:** ac8d97c (Update docs to recommend AUTH_SECRET for NextAuth v5)
