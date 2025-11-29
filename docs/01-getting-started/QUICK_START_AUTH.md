# 🚀 Quick Start - Sistema de Autenticação

## TL;DR - Começar Rápido

Para ter o sistema de login/senha funcionando:

### 1️⃣ Criar a Tabela Users no Banco

Execute no [Neon SQL Editor](https://console.neon.tech):

```sql
-- Copie e cole este código e execute
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  password_hash TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

Ou use o script pronto:
```bash
neon sql < src/db/create-users-table.sql
```

### 2️⃣ Configurar Variáveis de Ambiente

No arquivo `.env.local`:

```bash
DATABASE_URL=postgresql://...       # Já deve estar configurado
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=cole_aqui_o_secret_gerado_abaixo
```

Gerar o secret:
```bash
openssl rand -base64 32
```

### 3️⃣ Testar o Sistema

```bash
# Instalar dependências (se ainda não fez)
npm install

# Iniciar servidor
npm run dev
```

Abra o navegador:
- **Criar conta**: http://localhost:3000/auth/signup
- **Fazer login**: http://localhost:3000/auth/signin
- **Dashboard**: http://localhost:3000/dashboard (após login)

### 4️⃣ Criar Primeiro Usuário

1. Acesse: http://localhost:3000/auth/signup
2. Preencha:
   - Nome: Seu Nome
   - Email: seu@email.com
   - Senha: minimo6caracteres
   - Confirmar: minimo6caracteres
3. Clique em "Criar conta"
4. Faça login na próxima página
5. Pronto! ✨

---

## 🎯 Entender a Diferença

| Neon Auth | App Auth |
|-----------|----------|
| Para conectar no banco | Para usuários fazerem login |
| DATABASE_URL | Tabela `users` |
| Credenciais técnicas | Email e senha dos usuários |
| Usada pela aplicação | Usada pelos usuários finais |

**Em resumo**: 
- Neon = como sua aplicação acessa o banco
- App Auth = como os usuários acessam sua aplicação

---

## 📁 Arquivos Principais

```
src/
├── db/
│   ├── create-users-table.sql    ← Execute isto no Neon
│   ├── schema.sql                ← Schema completo (alternativa)
│   └── README.md                 ← Documentação detalhada
├── app/
│   ├── auth/
│   │   ├── signup/page.tsx       ← Página de registro
│   │   └── signin/page.tsx       ← Página de login
│   └── api/
│       └── auth/
│           ├── signup/route.ts   ← API de registro
│           └── [...nextauth]/    ← Handler do NextAuth
└── lib/
    └── auth.ts                   ← Configuração NextAuth
```

---

## ✅ Checklist de Setup

- [ ] Tabela `users` criada no Neon
- [ ] Variável `DATABASE_URL` configurada
- [ ] Variável `NEXTAUTH_URL` configurada
- [ ] Variável `NEXTAUTH_SECRET` gerada e configurada
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor rodando (`npm run dev`)
- [ ] Primeiro usuário criado em `/auth/signup`
- [ ] Login funcionando em `/auth/signin`
- [ ] Acesso ao dashboard após login

---

## 🔍 Verificar se Está Funcionando

### Testar Registro (via curl):
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste User",
    "email": "teste@example.com",
    "password": "senha123"
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "user": {
    "id": "uuid-aqui",
    "name": "Teste User",
    "email": "teste@example.com"
  }
}
```

### Ver usuários no banco:
```sql
SELECT id, name, email, created_at FROM users ORDER BY created_at DESC;
```

---

## 🆘 Problemas Comuns

### "Table users does not exist"
➜ Execute o script SQL: `src/db/create-users-table.sql`

### "Email já cadastrado"
➜ Use outro email ou delete o usuário existente

### "Failed to connect to database"
➜ Verifique se `DATABASE_URL` está correta no `.env.local`

### "Invalid credentials" no login
➜ Verifique se o usuário existe e a senha está correta (mínimo 6 caracteres)

### Redirecionamento não funciona
➜ Verifique se `NEXTAUTH_URL` e `NEXTAUTH_SECRET` estão configurados

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **[GUIA_AUTENTICACAO.md](./GUIA_AUTENTICACAO.md)** - Explicação completa da diferença Neon x App Auth
- **[src/db/README.md](./src/db/README.md)** - Documentação do banco de dados
- **[NEON_AUTH_GUIDE.md](./NEON_AUTH_GUIDE.md)** - Guia técnico completo do NextAuth

---

## 🎉 Pronto!

Após seguir esses passos, você terá:
- ✅ Sistema de registro de usuários
- ✅ Sistema de login com email e senha
- ✅ Senhas criptografadas com bcrypt
- ✅ Sessões JWT seguras
- ✅ Rotas protegidas

Divirta-se desenvolvendo! 🚀⚽
