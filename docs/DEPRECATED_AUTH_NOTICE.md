# ⚠️ DOCUMENTAÇÃO DESCONTINUADA

**Data de Descontinuação:** 23 de Outubro de 2025

Este arquivo contém documentação antiga sobre Stack Auth, que foi **removido** do projeto.

## O que mudou?

O projeto Peladeiros **não usa mais Stack Auth**. Agora utilizamos **NextAuth v5** (Auth.js) com autenticação por credenciais (email e senha).

## Nova Documentação

Para informações atualizadas sobre autenticação, consulte:

👉 **[NEON_AUTH_GUIDE.md](./NEON_AUTH_GUIDE.md)** - Guia completo de autenticação com NextAuth v5

## Resumo das Mudanças

### Removido
- ❌ Stack Auth (@stackframe/stack)
- ❌ Magic Link
- ❌ Handlers externos (/handler/sign-in)

### Adicionado
- ✅ NextAuth v5 (next-auth@beta)
- ✅ Autenticação por email e senha
- ✅ Páginas customizadas de login e registro
- ✅ API de registro de usuários
- ✅ Senhas criptografadas com bcrypt

## Como Migrar

Se você ainda está usando Stack Auth em outro ambiente:

1. Leia o guia completo em [NEON_AUTH_GUIDE.md](./NEON_AUTH_GUIDE.md)
2. Atualize as variáveis de ambiente (remova Stack Auth, adicione NextAuth)
3. Execute a migração do banco de dados (adicione campo `password_hash`)
4. Remova dependências do Stack Auth do `package.json`
5. Atualize imports e configurações conforme o novo guia

---

**Os arquivos abaixo são mantidos apenas para referência histórica.**

---
