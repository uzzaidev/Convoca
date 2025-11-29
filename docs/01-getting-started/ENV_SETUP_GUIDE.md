# Guia de Configuração das Variáveis de Ambiente

Este guia explica como configurar as variáveis de ambiente necessárias para executar o Peladeiros.

## 🚨 Erro: "AUTH_SECRET não está configurado"

Se você está vendo este erro, significa que a autenticação não pode funcionar sem as variáveis de ambiente corretas.

### Solução Rápida

1. **Gere um AUTH_SECRET:**
```bash
openssl rand -base64 32
```

2. **Adicione ao arquivo `.env.local` (desenvolvimento):**
```bash
# Copie o valor gerado acima
AUTH_SECRET="cole_o_valor_aqui"
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="sua_url_do_neon_aqui"
```

3. **No Vercel (produção):**
   - Vá para: Project Settings → Environment Variables
   - Adicione as variáveis:
     - `AUTH_SECRET`: o valor gerado acima
     - `NEXTAUTH_URL`: https://seu-app.vercel.app
     - `DATABASE_URL`: sua URL do Neon Database

## 📋 Variáveis Obrigatórias

### DATABASE_URL
**O que é:** URL de conexão com o banco de dados PostgreSQL (Neon)

**Onde obter:**
1. Acesse [console.neon.tech](https://console.neon.tech)
2. Selecione seu projeto
3. Vá em "Connection Details"
4. Copie a "Connection String" (com pooling habilitado)

**Exemplo:**
```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### AUTH_SECRET
**O que é:** Chave secreta usada pelo NextAuth para assinar tokens JWT

**Como gerar:**
```bash
openssl rand -base64 32
```

**⚠️ IMPORTANTE:**
- Nunca compartilhe este valor
- Use valores diferentes para dev e produção
- Nunca commite este valor no Git

**Exemplo:**
```
AUTH_SECRET="tCJjXPWTVxuSWLwmwkhPxB6cC/oV2tI1UmF1FHYbL2Y="
```

### NEXTAUTH_URL
**O que é:** URL base da sua aplicação

**Valores:**
- Desenvolvimento: `http://localhost:3000`
- Produção: `https://seu-dominio.vercel.app`

**Exemplo:**
```
NEXTAUTH_URL=http://localhost:3000
```

## 🔄 Migrando do Stack Auth

Se você estava usando Stack Auth anteriormente, **REMOVA** estas variáveis:

```bash
# ❌ NÃO MAIS NECESSÁRIO - PODE REMOVER
NEXT_PUBLIC_STACK_PROJECT_ID=...
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=...
STACK_SECRET_SERVER_KEY=...
```

O Peladeiros agora usa **NextAuth v5** com autenticação por email e senha.

## 📝 Arquivo .env.local Completo

Exemplo de arquivo `.env.local` funcional:

```bash
# Database (obrigatório)
DATABASE_URL=postgresql://neondb_owner:senha@host.neon.tech/neondb?sslmode=require

# Authentication (obrigatório)
AUTH_SECRET="gere_com_openssl_rand_base64_32"
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 Deploy no Vercel

### Passo a Passo

1. **Conecte seu repositório ao Vercel**

2. **Configure as variáveis de ambiente:**
   - Vá em: Settings → Environment Variables
   - Adicione cada variável obrigatória
   - Marque os ambientes: Production, Preview, Development

3. **Deploy:**
   - O Vercel fará o deploy automaticamente
   - Acesse a URL fornecida pelo Vercel

### Checklist de Deploy

- [ ] `DATABASE_URL` configurado (Connection String do Neon)
- [ ] `AUTH_SECRET` configurado (gerado com openssl)
- [ ] `NEXTAUTH_URL` configurado (URL do Vercel)
- [ ] Build passou sem erros
- [ ] Login funciona na aplicação deployada

## ❓ Problemas Comuns

### "Não consigo fazer login"

**Causa:** AUTH_SECRET não configurado ou incorreto

**Solução:**
1. Verifique se AUTH_SECRET está no .env.local
2. Se no Vercel, verifique em Environment Variables
3. Gere um novo secret se necessário
4. Redeploy a aplicação

### "Erro de conexão com banco"

**Causa:** DATABASE_URL incorreto ou banco não acessível

**Solução:**
1. Verifique se a URL está correta
2. Verifique se o banco está ativo no Neon Console
3. Confirme que a URL inclui `?sslmode=require`

### "Sessão não persiste"

**Causa:** Cookie settings ou AUTH_SECRET diferente entre deploys

**Solução:**
1. Use o mesmo AUTH_SECRET em todos os ambientes
2. Limpe cookies do browser
3. Verifique se NEXTAUTH_URL está correto

## 📚 Mais Informações

- **Guia de Autenticação:** [NEON_AUTH_GUIDE.md](./NEON_AUTH_GUIDE.md)
- **Setup Geral:** [SETUP.md](./SETUP.md)
- **Documentação NextAuth:** [authjs.dev](https://authjs.dev/)

## 💡 Dicas de Segurança

✅ **Faça:**
- Use AUTH_SECRET diferente para dev e produção
- Mantenha secrets fora do Git
- Use HTTPS em produção (Vercel faz automaticamente)
- Gere secrets longos e aleatórios

❌ **Não faça:**
- Commitar .env.local no Git
- Usar senhas simples como "123456"
- Compartilhar AUTH_SECRET publicamente
- Usar o mesmo secret em múltiplos projetos
