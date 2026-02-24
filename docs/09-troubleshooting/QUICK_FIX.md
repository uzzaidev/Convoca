# 🚀 Solução Rápida - Erro no Dashboard

## 🔴 Problema
Ao tentar acessar o dashboard, você recebe um erro de autenticação.

## ✅ Solução (5 minutos)

### Passo 1: Gerar AUTH_SECRET
Abra o terminal e execute:
```bash
openssl rand -base64 32
```

Copie o valor gerado (exemplo: `tCJjXPWTVxuSWLwmwkhPxB6cC/oV2tI1UmF1FHYbL2Y=`)

### Passo 2: Configurar no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto **convoca**
3. Vá em: **Settings** → **Environment Variables**
4. Adicione estas variáveis:

| Nome | Valor | Ambientes |
|------|-------|-----------|
| `AUTH_SECRET` | Cole o valor gerado acima | ✅ Production, ✅ Preview, ✅ Development |
| `NEXTAUTH_URL` | `https://seu-app.vercel.app` | ✅ Production |
| `NEXTAUTH_URL` | `https://seu-app-preview.vercel.app` | ✅ Preview |
| `NEXTAUTH_URL` | `http://localhost:3000` | ✅ Development |
| `DATABASE_URL` | `postgresql://neondb_owner:REDACTED_PASSWORD@ep-broad-grass-acup6c00-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require` | ✅ Production, ✅ Preview, ✅ Development |

### Passo 3: Redeploy

1. Vá na aba **Deployments**
2. Clique nos 3 pontinhos no último deployment
3. Clique em **Redeploy**
4. Aguarde o build completar (1-2 minutos)

### Passo 4: Criar primeiro usuário

Acesse: `https://seu-app.vercel.app/auth/signup`

Preencha:
- Nome completo
- Email
- Senha (mínimo 6 caracteres)

### ✅ Pronto!

Agora você pode fazer login em: `https://seu-app.vercel.app/auth/signin`

---

## 📋 Checklist

- [ ] Gerou AUTH_SECRET com `openssl rand -base64 32`
- [ ] Adicionou AUTH_SECRET no Vercel
- [ ] Adicionou NEXTAUTH_URL no Vercel
- [ ] Confirmou que DATABASE_URL está configurado
- [ ] Fez redeploy
- [ ] Criou conta em /auth/signup
- [ ] Consegue fazer login em /auth/signin
- [ ] Dashboard carrega sem erros

---

## ❓ Ainda com problemas?

### Erro: "AUTH_SECRET não está configurado"
✅ Verifique se a variável foi adicionada corretamente no Vercel
✅ Confirme que marcou todos os ambientes (Production, Preview, Development)
✅ Faça redeploy depois de adicionar as variáveis

### Erro: "Email ou senha incorretos"
✅ Certifique-se de ter criado uma conta primeiro em /auth/signup
✅ Verifique se está usando o email e senha corretos
✅ Senhas devem ter no mínimo 6 caracteres

### Erro: "Erro de conexão com banco"
✅ Verifique se DATABASE_URL está correto
✅ Confirme que o banco está ativo no Neon Console
✅ A URL deve terminar com `?sslmode=require`

### Dashboard mostra grupo vazio
✅ Isso é normal! Você precisa criar seu primeiro grupo
✅ Clique em "Criar Grupo" no dashboard
✅ Preencha nome e descrição

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- **Guia Completo:** [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)
- **Autenticação:** [NEON_AUTH_GUIDE.md](./NEON_AUTH_GUIDE.md)
- **Setup Geral:** [SETUP.md](./SETUP.md)

---

## 🔧 Variáveis Antigas (REMOVER)

Se você ainda tem estas variáveis no Vercel, pode **removê-las** (não são mais usadas):

❌ `NEXT_PUBLIC_STACK_PROJECT_ID`
❌ `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
❌ `STACK_SECRET_SERVER_KEY`

O projeto agora usa NextAuth v5, não Stack Auth.
