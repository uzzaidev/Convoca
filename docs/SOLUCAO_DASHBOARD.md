# Solução: Erro ao Acessar Dashboard

## 📋 Resumo do Problema

O usuário relatou erro ao acessar o dashboard do Peladeiros, fornecendo apenas credenciais do Neon Database e Stack Auth.

### Causa Raiz

O projeto **migrou de Stack Auth para NextAuth v5**, mas as variáveis de ambiente obrigatórias do NextAuth (`AUTH_SECRET` e `NEXTAUTH_URL`) não estavam configuradas no ambiente de produção (Vercel).

Quando essas variáveis não estão presentes:
- NextAuth não consegue assinar tokens JWT
- A autenticação falha silenciosamente
- O dashboard não pode ser acessado

## ✅ Solução Implementada

### 1. Validação de Configuração

Adicionado em `src/lib/auth.ts`:
- Verificação de `AUTH_SECRET` ao iniciar a aplicação
- Mensagem de erro clara e informativa em português
- Bloqueio de inicialização em produção se a variável estiver faltando
- Warning em desenvolvimento para facilitar o setup local

### 2. Página de Erro Aprimorada

Melhorias em `src/app/auth/error/page.tsx`:
- Detecta diferentes tipos de erro (Configuration, CredentialsSignin, etc.)
- Exibe mensagens específicas para cada tipo de erro
- Fornece instruções práticas para administradores
- Usa o novo componente Alert UI para destacar informações importantes

### 3. Documentação Completa

Criados três guias em português:

**ENV_SETUP_GUIDE.md** - Guia completo com:
- Explicação detalhada de cada variável obrigatória
- Como gerar AUTH_SECRET
- Onde obter DATABASE_URL do Neon
- Configuração passo-a-passo para Vercel
- Troubleshooting de problemas comuns
- Checklist de deploy

**QUICK_FIX.md** - Solução rápida (5 minutos):
- Passo 1: Gerar AUTH_SECRET
- Passo 2: Configurar no Vercel
- Passo 3: Redeploy
- Passo 4: Criar primeiro usuário
- Checklist de verificação

**.env.example** atualizado:
- Separação clara entre variáveis obrigatórias e opcionais
- Comentários explicativos em português
- Nota sobre variáveis depreciadas (Stack Auth)

### 4. Componente UI

Adicionado `src/components/ui/alert.tsx`:
- Componente Alert do shadcn/ui
- Suporta variantes (default, destructive)
- Usado na página de erro para destacar informações

## 🚀 Próximos Passos para o Usuário

### Ação Imediata (5 minutos)

1. **Gerar AUTH_SECRET**
   ```bash
   openssl rand -base64 32
   ```

2. **Configurar no Vercel**
   - Acessar: https://vercel.com/dashboard
   - Projeto: peladeiros
   - Settings → Environment Variables
   - Adicionar:
     * `AUTH_SECRET` = valor gerado
     * `NEXTAUTH_URL` = https://seu-app.vercel.app
     * `DATABASE_URL` = (já deve estar configurado)

3. **Redeploy**
   - Deployments → ⋮ → Redeploy

4. **Criar Usuário**
   - Acessar: `/auth/signup`
   - Preencher nome, email e senha

5. **Login**
   - Acessar: `/auth/signin`
   - Dashboard funcionará normalmente

### Limpeza Opcional

As seguintes variáveis podem ser **removidas** do Vercel (não são mais usadas):
- `NEXT_PUBLIC_STACK_PROJECT_ID`
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
- `STACK_SECRET_SERVER_KEY`

## 📊 Validação

Testes realizados:
- ✅ Build production passa sem erros
- ✅ Linting sem warnings
- ✅ Página de signin carrega corretamente
- ✅ Página de erro mostra mensagens apropriadas
- ✅ Validação de AUTH_SECRET funciona corretamente
- ✅ Servidor inicia com warning claro quando AUTH_SECRET falta

## 📚 Documentação de Referência

- **Solução Rápida**: [QUICK_FIX.md](./QUICK_FIX.md)
- **Guia Completo**: [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)
- **Autenticação**: [NEON_AUTH_GUIDE.md](./NEON_AUTH_GUIDE.md)
- **Setup Geral**: [SETUP.md](./SETUP.md)

## 🔧 Suporte Técnico

Se o problema persistir após seguir os passos acima:

1. Verificar logs do Vercel para mensagens de erro específicas
2. Confirmar que todas as variáveis foram salvas corretamente
3. Verificar se o banco de dados Neon está ativo
4. Consultar a seção "Problemas Comuns" em ENV_SETUP_GUIDE.md

---

**Data da Solução**: 24 de Outubro de 2025
**Versão do Next.js**: 15.5.6
**Versão do NextAuth**: 5.0.0-beta.25
